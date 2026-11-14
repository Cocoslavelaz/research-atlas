import { lstat, mkdir, rename } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const project = fileURLToPath(new URL('../', import.meta.url))
const archiveDirectory = id => join(project, '.atlas-trash', id)

async function exists(path) {
  try {
    await lstat(path)
    return true
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    return false
  }
}

export const isArchived = id => exists(archiveDirectory(id))

export async function archivePaper(id) {
  const destination = archiveDirectory(id)
  const folders = ['papers', 'drafts']
  const sources = folders.map(folder => join(project, 'data', folder, id + '.json'))
  const existing = await Promise.all(sources.map(exists))
  if (!existing.some(Boolean)) return isArchived(id)

  // The directory also tells the importer to skip this ID, even while a move is in progress.
  await mkdir(destination, { recursive: true })
  for (const [index, folder] of folders.entries()) {
    if (!existing[index]) continue
    const backup = join(destination, folder + '.json')
    if (await exists(backup)) throw new Error('已有同名備份')
    try {
      await rename(sources[index], backup)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
  return true
}
