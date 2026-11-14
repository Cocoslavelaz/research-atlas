import { normalizeTopic } from '../../scripts/schema.mjs'

const records = import.meta.glob('../../data/papers/*.json', { eager: true, import: 'default' })
const visiblePapers = new Map(Object.values(records)
  .filter(paper => paper.status === 'published').map(paper => [paper.id, paper]))
if (import.meta.env.DEV || import.meta.env.ATLAS_OFFLINE) {
  const drafts = import.meta.glob('../../data/drafts/*.json', { eager: true, import: 'default' })
  for (const paper of Object.values(drafts)) {
    if (paper.status === 'draft' && !visiblePapers.has(paper.id)) visiblePapers.set(paper.id, paper)
  }
}
export const papers = [...visiblePapers.values()]
  .sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title))

export const paperUrl = id => route(`papers/${id}/`)
export function route(path = '') {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path}`
}

const doiKey = doi => doi?.toLowerCase()
const titleKey = title => title.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
const urlKey = url => {
  if (!url) return
  const parsed = new URL(url)
  return `${parsed.host.toLowerCase()}${parsed.pathname.replace(/\/$/, '')}`
}

const topicIndex = new Map()
for (const paper of papers) {
  for (const topic of paper.topics) {
    const key = normalizeTopic(topic)
    if (!topicIndex.has(key)) topicIndex.set(key, { id: key, label: topic, papers: [] })
    topicIndex.get(key).papers.push(paper.id)
  }
}
export const topics = [...topicIndex.values()]
  .sort((a, b) => b.papers.length - a.papers.length || a.label.localeCompare(b.label, 'zh-Hant'))

export const citations = papers.flatMap(paper => papers.flatMap(target => {
  if (target.id === paper.id) return []
  const evidence = paper.references.find(ref => {
    if (ref.doi && target.doi) return doiKey(ref.doi) === doiKey(target.doi)
    if (ref.url && target.sourceUrl && urlKey(ref.url) === urlKey(target.sourceUrl)) return true
    return titleKey(ref.title) === titleKey(target.title)
  })
  return evidence ? [{ from: paper.id, to: target.id, evidence }] : []
}))

export const citationId = edge => `citation-${edge.from}--${edge.to}`

export function relatedPapers(paper) {
  return papers.filter(other => other.id !== paper.id).map(other => {
    const shared = paper.topics.filter(topic => other.topics.some(value => normalizeTopic(value) === normalizeTopic(topic)))
    const outgoing = citations.find(edge => edge.from === paper.id && edge.to === other.id)
    const incoming = citations.find(edge => edge.from === other.id && edge.to === paper.id)
    return { other, shared, outgoing, incoming }
  }).filter(item => item.shared.length || item.outgoing || item.incoming)
}

export function sourceLink(paper) {
  return paper.sourceUrl || (paper.doi && `https://doi.org/${encodeURI(paper.doi)}`)
}
