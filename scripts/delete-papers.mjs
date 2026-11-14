import { archivePaper } from './paper-archive.mjs'
import { allowLocalRequest, readLocalJson } from './local-request.mjs'
import { slugPattern } from './schema.mjs'

export default function deletePapers() {
  const pending = new Set()
  return {
    name: 'research-atlas-delete',
    hooks: {
      'astro:server:setup': ({ server, logger }) => {
        const endpoint = server.config.base.replace(/\/$/, '') + '/api/delete-paper/'
        server.middlewares.use(async (request, response, next) => {
          if (request.url?.split('?')[0] !== endpoint) return next()
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.setHeader('Cache-Control', 'no-store')
          function error(status, message) {
            response.statusCode = status
            response.end(JSON.stringify({ error: message }))
          }
          if (request.method !== 'POST') {
            response.setHeader('Allow', 'POST')
            return error(405, '請從論文庫操作。')
          }
          if (!allowLocalRequest(request)) return error(403, '請從本機論文庫操作。')
          if (request.headers['content-type']?.split(';')[0] !== 'application/json') {
            return error(415, '刪除請求格式不符。')
          }
          const body = await readLocalJson(request).catch(() => null)
          const id = body?.id
          if (typeof id !== 'string' || !slugPattern.test(id)) return error(400, '找不到有效的論文識別碼。')
          if (pending.has(id)) return error(409, '這篇論文正在移除。')
          pending.add(id)
          try {
            if (!await archivePaper(id)) return error(404, '找不到這篇論文，請重新整理論文庫。')
            response.end(JSON.stringify({ ok: true }))
          } catch (cause) {
            logger.warn(`無法移除論文 ${id}：${cause.message}`)
            error(500, '無法完成移除。請確認專案資料夾可寫入後重試。')
          } finally {
            pending.delete(id)
          }
        })
      },
    },
  }
}
