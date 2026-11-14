export function allowLocalRequest(request) {
  const { host, origin } = request.headers
  return ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress) &&
    /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host ?? '') &&
    (origin === `http://${host}` || origin === `https://${host}`)
}

export async function readLocalJson(request) {
  let body = ''
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    body += chunk
    if (body.length > 2048) {
      request.resume()
      throw new Error('請求過大。')
    }
  }
  try {
    return JSON.parse(body)
  } catch {
    throw new Error('無法讀取請求。')
  }
}
