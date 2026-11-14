import { paperCategories } from '../src/lib/paper-categories.mjs'

const string = { type: 'string' }
const integer = { type: 'integer' }
const array = items => ({ type: 'array', items })
const nullable = schema => ({ anyOf: [schema, { type: 'null' }] })
const object = properties => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
})

export const extractionSchema = object({
  title: string,
  authors: array(string),
  year: nullable(integer),
  doi: nullable(string),
  sourceUrl: nullable(string),
  shortTitle: string,
  summary: string,
  topics: array(string),
  categories: array({ type: 'string', enum: paperCategories.map(category => category.id) }),
  comparison: array(object({
    field: { type: 'string', enum: ['task', 'method', 'benchmark', 'metric', 'result', 'limitation'] },
    text: string,
    page: integer,
    location: string,
  })),
  notes: array(object({
    kind: { type: 'string', enum: ['研究問題', '方法', '發現', '限制'] },
    text: string,
    page: integer,
    location: string,
  })),
  equations: array(object({
    title: string,
    latex: string,
    explanation: string,
    page: integer,
    location: string,
  })),
  references: array(object({
    title: string,
    doi: nullable(string),
    url: nullable(string),
    page: integer,
    context: nullable(object({
      page: integer,
      location: string,
      purpose: string,
      connection: string,
    })),
  })),
})

export const recordSchema = object({
  id: string,
  status: { type: 'string', enum: ['draft', 'published'] },
  demo: { type: 'boolean' },
  source: object({
    filename: nullable(string),
    sha256: nullable(string),
    model: nullable(string),
  }),
  ...extractionSchema.properties,
})
// Existing records can omit fields introduced after their extraction.
recordSchema.required = recordSchema.required.filter(key => !['equations', 'comparison', 'categories'].includes(key))
const storedReference = recordSchema.properties.references.items
recordSchema.properties.references = array({ ...storedReference, required: storedReference.required.filter(key => key !== 'context') })

function validate(schema, value, path) {
  if (schema.anyOf) {
    if (value !== null) validate(schema.anyOf[0], value, path)
    return
  }
  const type = Array.isArray(value) ? 'array' : typeof value
  if (schema.type === 'integer' ? !Number.isInteger(value) : type !== schema.type || value === null) {
    throw new Error(`${path} 必須是 ${schema.type}`)
  }
  if (schema.enum && !schema.enum.includes(value)) throw new Error(`${path} 值不在允許清單中`)
  if (schema.type === 'string' && !value.trim()) throw new Error(`${path} 不可留白`)
  if (schema.type === 'array') value.forEach((item, i) => validate(schema.items, item, `${path}[${i}]`))
  if (schema.type !== 'object') return
  for (const key of Object.keys(value)) {
    if (!Object.hasOwn(schema.properties, key)) throw new Error(`${path} 包含未知欄位 ${key}`)
  }
  for (const [key, field] of Object.entries(schema.properties)) {
    if (!Object.hasOwn(value, key) && !schema.required.includes(key)) continue
    validate(field, value[key], `${path}.${key}`)
  }
}

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const normalizeTopic = topic => topic.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()

export function paperIdFromFilename(filename) {
  if (!filename || !/\.pdf$/i.test(filename)) return null
  const id = filename.slice(0, -4).trim().toLowerCase().replace(/[-\s]+/g, '-')
  return slugPattern.test(id) ? id : null
}

export function validateRecord(record, id, status) {
  validate(recordSchema, record, id)
  if (!slugPattern.test(id) || record.id !== id || record.status !== status) {
    throw new Error(`${id} 的檔名、id 或狀態不符`)
  }
  if (!record.notes.length || !record.topics.length) throw new Error(`${id} 需有主題和至少一則重點`)
  if (new Set(record.topics.map(normalizeTopic)).size !== record.topics.length) {
    throw new Error(`${id} 的主題重複`)
  }
  if (new Set(record.categories).size !== (record.categories?.length ?? 0)) {
    throw new Error(`${id} 的主題分類重複`)
  }
  const comparison = record.comparison ?? []
  if (new Set(comparison.map(item => item.field)).size !== comparison.length) {
    throw new Error(`${id} 的比較欄位重複`)
  }
  const contexts = record.references.flatMap(reference => reference.context ? [reference.context] : [])
  if ([...record.notes, ...(record.equations ?? []), ...comparison, ...record.references, ...contexts].some(item => item.page < 1)) {
    throw new Error(`${id} 的 PDF 頁碼從 1 起算`)
  }
  for (const url of [record.sourceUrl, ...record.references.map(ref => ref.url)]) {
    if (url && !['http:', 'https:'].includes(new URL(url).protocol)) {
      throw new Error(`${id} 的來源網址必須使用 HTTP 或 HTTPS`)
    }
  }
  if (!record.demo && (!/^[a-f0-9]{64}$/.test(record.source.sha256 ?? '') ||
    paperIdFromFilename(record.source.filename) !== id || !record.source.model)) {
    throw new Error(`${id} 缺少匯入來源資訊`)
  }
  if (status === 'published' && !record.authors.length) {
    throw new Error(`${id} 發布前需確認作者`)
  }
  if (status === 'published' && !record.doi && !record.sourceUrl) {
    throw new Error(`${id} 發布前需填入 DOI 或原文網址`)
  }
  for (const doi of [record.doi, ...record.references.map(ref => ref.doi)]) {
    if (doi && !/^10\.\d{4,9}\/\S+$/.test(doi)) throw new Error(`${id} 的 DOI 格式錯誤`)
  }
}
