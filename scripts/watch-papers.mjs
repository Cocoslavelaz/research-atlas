import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { offlineDataVersion, paperDataVersion } from './offline-state.mjs'

const project = fileURLToPath(new URL('../', import.meta.url))
const inbox = join(project, '.private-papers')
const intervalMs = 2000

export default function watchPapers() {
  let timer
  let worker
  let stopped = false
  let retryOfflineAt = 0
  let previous = new Map()
  const attempted = new Map()

  async function scan(logger) {
    try {
      await mkdir(inbox, { recursive: true })
      const current = new Map()
      for (const entry of await readdir(inbox, { withFileTypes: true })) {
        if (!entry.isFile() || !/\.pdf$/i.test(entry.name)) continue
        const info = await stat(join(inbox, entry.name)).catch(error => {
          if (error.code !== 'ENOENT') throw error
        })
        if (info) current.set(entry.name, `${info.size}:${info.mtimeMs}:${info.ctimeMs}`)
      }

      // Wait until a PDF is stable across two scans before sending it for extraction.
      const ready = [...current].filter(([name, stamp]) =>
        previous.get(name) === stamp && attempted.get(name) !== stamp)
      previous = current
      for (const name of attempted.keys()) {
        if (!current.has(name)) attempted.delete(name)
      }
      if (ready.length && !stopped) {
        logger.info(`開始處理 ${ready.length} 份 PDF`)
        for (const [name, stamp] of ready) attempted.set(name, stamp)
        await runIngest(ready.map(([name]) => name), logger)
      }
    } catch (error) {
      if (!stopped) logger.warn(`無法掃描 .private-papers：${error.message}`)
    }

    try {
      if (!stopped && Date.now() >= retryOfflineAt &&
          await paperDataVersion(project) !== await offlineDataVersion(project)) {
        logger.info('正在更新根目錄的 index.html')
        if (await runWorker(['scripts/build-offline.mjs'], logger) !== 0) {
          throw new Error('離線版建置失敗，稍後會重試')
        }
      }
    } catch (error) {
      retryOfflineAt = Date.now() + 10_000
      if (!stopped) logger.warn(`無法更新 index.html：${error.message}`)
    } finally {
      if (!stopped) timer = setTimeout(() => void scan(logger), intervalMs)
    }
  }

  async function runIngest(names, logger) {
    const envArgs = existsSync(join(project, '.env')) ? ['--env-file-if-exists=.env'] : []
    const code = await runWorker([...envArgs, 'scripts/ingest.mjs', inbox, ...names], logger)
    if (code !== 0 && !stopped) {
      logger.warn('部分 PDF 未能匯入。修正後重新放入檔案或重啟網站可重試。')
    }
  }

  function runWorker(args, logger) {
    if (stopped) return Promise.resolve(null)
    return new Promise(resolve => {
      worker = spawn(process.execPath, args, {
        cwd: project,
        stdio: ['ignore', 'inherit', 'inherit'],
        windowsHide: true,
      })
      worker.once('error', error => logger.error(`無法啟動 ${args.find(arg => !arg.startsWith('--'))}：${error.message}`))
      worker.once('close', code => {
        worker = undefined
        resolve(code)
      })
    })
  }

  return {
    name: 'research-atlas-pdf',
    hooks: {
      'astro:server:start': ({ logger }) => {
        stopped = false
        logger.info('正在監看 .private-papers，新增 PDF 會自動產生摘要並更新 index.html。')
        void scan(logger)
      },
      'astro:server:done': () => {
        stopped = true
        clearTimeout(timer)
        worker?.kill()
      },
    },
  }
}
