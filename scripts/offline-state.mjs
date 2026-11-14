import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

export async function paperDataVersion(project) {
  const hash = createHash('sha256')
  for (const folder of ['papers', 'drafts']) {
    const directory = join(project, 'data', folder)
    const entries = await readdir(directory, { withFileTypes: true })
    for (const name of entries.filter(entry => entry.isFile() && entry.name.endsWith('.json'))
      .map(entry => entry.name).sort()) {
      hash.update(JSON.stringify([folder, name, await readFile(join(directory, name), 'utf8')]))
    }
  }
  return hash.digest('hex')
}

export async function offlineDataVersion(project) {
  try {
    const html = await readFile(join(project, 'index.html'), 'utf8')
    return html.match(/^<!-- atlas-data:([a-f0-9]{64}) -->/)?.[1]
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}
