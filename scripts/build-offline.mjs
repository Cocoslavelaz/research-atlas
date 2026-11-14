import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { paperDataVersion } from './offline-state.mjs'

const project = fileURLToPath(new URL('../', import.meta.url))
const offline = join(project, '.atlas-offline')
const index = join(offline, 'index.html')
const temporaryIndex = `${index}.${process.pid}.tmp`
await mkdir(offline, { recursive: true })
const output = await mkdtemp(join(offline, 'site-'))

function localUrl(url, directory) {
  const [, pathname, suffix] = url.match(/^\/([^?#]*)(.*)$/)
  const file = !pathname || pathname.endsWith('/') ? pathname + 'index.html' : pathname
  return relative(directory, join(output, file)).split(sep).join('/') + suffix
}

function rewriteHtml(html, directory) {
  return html.replace(/\b(href|src)="(\/(?!\/)[^"]*)"/g, (_, attribute, url) =>
    attribute + '="' + localUrl(url, directory) + '"')
}

async function removeSnapshot(directory) {
  if (dirname(directory) === offline) await rm(directory, { recursive: true, force: true })
}

let installed = false
try {
  const version = await paperDataVersion(project)
  for (const args of [['scripts/check.mjs'], ['node_modules/astro/bin/astro.mjs', 'build']]) {
    const result = spawnSync(process.execPath, args, {
      cwd: project,
      stdio: 'inherit',
      env: { ...process.env, ATLAS_OFFLINE: '1', ATLAS_OFFLINE_OUT: output, PAGES_BASE: '/', PAGES_ORIGIN: '' },
    })
    if (result.error) throw result.error
    if (result.status !== 0) throw new Error(`${args[0]} 執行失敗`)
  }

  const homepage = await readFile(join(output, 'index.html'), 'utf8')
  for (const entry of await readdir(output, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue
    const path = join(entry.parentPath, entry.name)
    if (entry.name.endsWith('.html')) {
      const html = await readFile(path, 'utf8')
      await writeFile(path, rewriteHtml(html, dirname(path)))
    } else if (entry.name.endsWith('.css')) {
      const css = await readFile(path, 'utf8')
      await writeFile(path, css.replace(/url\((['"]?)(\/(?!\/)[^)'" ]+)\1\)/g, (_, quote, url) =>
        'url(' + quote + localUrl(url, dirname(path)) + quote + ')'))
    }
  }

  const previousIndex = await readFile(index, 'utf8').catch(error => {
    if (error.code !== 'ENOENT') throw error
    return ''
  })
  const previousSite = previousIndex.match(/(?:href|src)="(site-[a-zA-Z0-9]+)\//)?.[1]
  const olderSite = previousIndex.match(/<!-- atlas-previous:(site-[a-zA-Z0-9]+) -->/)?.[1]
  const previousMarker = previousSite ? `<!-- atlas-previous:${previousSite} -->\n` : ''
  const content = `<!-- atlas-data:${version} -->\n${previousMarker}${rewriteHtml(homepage, offline)}`
  await writeFile(temporaryIndex, content, { flag: 'wx' })
  if (version !== await paperDataVersion(project)) {
    throw new Error('建置期間論文資料有變動，請重新輸出')
  }
  await rename(temporaryIndex, index)
  installed = true
  if (olderSite && olderSite !== previousSite && olderSite !== basename(output)) {
    await removeSnapshot(join(offline, olderSite)).catch(error =>
      console.warn('無法清理上一版離線檔案：' + error.message))
  }
} finally {
  await rm(temporaryIndex, { force: true })
  if (!installed) await removeSnapshot(output)
}
console.log('離線版已更新。請開啟根目錄的 index.html 並點選「開啟本機離線版」。')
