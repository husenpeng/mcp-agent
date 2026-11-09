/** Mock company BFF for the plugin's host tests. */
import http from 'node:http'

/**
 * Start the mock upstream.
 * @returns `{ url, port, close, seen }` where `seen` records every request.
 */
export async function startUpstream() {
  const seen = []
  const server = http.createServer(async (request, response) => {
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    const body = Buffer.concat(chunks).toString('utf8')
    seen.push({ method: request.method, url: request.url, headers: request.headers, body })
    const url = new URL(request.url, 'http://127.0.0.1')

    if (url.pathname === '/api/v1/campaigns' && request.method === 'GET') {
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify({
        code: 0,
        message: 'ok',
        data: { items: [{ id: 'c1', name: '秋冬美妆', brand: '花西子', stage: 'running' }], total: 1 },
        meta: { traceId: 'trace-1' },
      }))
      return
    }
    if (url.pathname === '/api/v1/campaigns/c1' && request.method === 'GET') {
      response.writeHead(200, { 'content-type': 'application/json', 'set-cookie': ['session_id=upstream; Secure', 'theme=dark; Secure'] })
      response.end(JSON.stringify({ code: 0, data: { id: 'c1', name: '秋冬美妆' }, meta: null }))
      return
    }
    if (url.pathname === '/api/v1/campaigns/c1/creators' && request.method === 'GET') {
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ code: 0, data: { items: [{ creatorKey: 'tt:1', nickname: 'Mia' }] } }))
      return
    }
    if (url.pathname === '/api/auth/members' && request.method === 'GET') {
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ data: { items: [{ id: 'u1', name: '林一' }] }, meta: { traceId: 'trace-2' } }))
      return
    }
    if (url.pathname === '/api/outreach/threads/t1/reply' && request.method === 'POST') {
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ data: { messageId: 'm1' }, meta: null }))
      return
    }
    if (url.pathname === '/api/v1/campaigns/denied') {
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ code: 40301, message: '没有权限', data: null, meta: { traceId: 'trace-3' } }))
      return
    }
    if (url.pathname === '/api/expired') {
      response.writeHead(307, { location: '/login?from=%2Fapi%2Fexpired' })
      response.end()
      return
    }
    if (url.pathname === '/api/moved') {
      response.writeHead(302, { location: `http://${request.headers.host}/api/v1/campaigns` })
      response.end()
      return
    }
    response.writeHead(404, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'not found', retryable: false } }))
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  return {
    port,
    url: `http://127.0.0.1:${port}`,
    seen,
    close: () => new Promise(resolve => server.close(resolve)),
  }
}