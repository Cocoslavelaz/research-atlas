import { readFile, readdir } from 'node:fs/promises'
import { validateRecord } from './schema.mjs'

for (const [directory, status] of [['drafts', 'draft'], ['papers', 'published']]) {
  const folder = new URL(`../data/${directory}/`, import.meta.url)
  const filenames = (await readdir(folder)).filter(name => name.endsWith('.json'))
  for (const filename of filenames) {
    const paper = JSON.parse(await readFile(new URL(filename, folder), 'utf8'))
    validateRecord(paper, filename.slice(0, -5), status)
  }
  console.log(`${directory}：${filenames.length} 筆資料通過驗證`)
}
