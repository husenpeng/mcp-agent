/**
 * Local stand-in for the three off-machine services Tomato Harness talks to:
 * the model relay (OpenAI-compatible chat completions and a models listing),
 * the company login service (desktop authorize + token exchange), and the
 * internal OTLP relay. One process serves all three so the M1 walkthrough needs
 * no network and no credentials.
 *
 * Usage: `pnpm run mock:tomato` (port 4010 by default, `--port` to change it).
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { parseArgs } from 'node:util'

/** One OpenAI-shaped chat message the mock reads. */
interface ChatMessage {
  role?: string
  content?: unknown
  tool_call_id?: string
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    request.setEncoding('utf8')
    request.on('data', (chunk: string) => { body += chunk })
    request.on('end', () => { resolve(body) })
    request.on('error', reject)
  })
}

function json(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json' })
  response.end(JSON.stringify(value))
}

/** Flatten message content, which OpenAI sends as a string or as parts. */
function textOf(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content.flatMap(part => {
    if (typeof part !== 'object' || part === null) return []
    const text = (part as { text?: unknown }).text
    return typeof text === 'string' ? [text] : []
  }).join(' ')
}

/** Stream one assistant turn in the OpenAI chat-completions SSE shape. */
function streamChat(response: ServerResponse, messages: ChatMessage[]): void {
  const last = messages.at(-1)
  const wantsTool = last?.role !== 'tool' && /列|ls|list|目录/i.test(textOf(last?.content))
  const id = `chatcmpl-${String(Date.now())}`
  response.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
  })
  const send = (delta: unknown, finish: string | null = null): void => {
    response.write(`data: ${JSON.stringify({
      id,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: 'tomato-chat',
      choices: [{ index: 0, delta, finish_reason: finish }],
    })}\n\n`)
  }
  send({ role: 'assistant', content: '' })
  if (wantsTool) {
    const args = JSON.stringify({ command: 'ls -la', description: 'List the working directory' })
    send({ tool_calls: [{ index: 0, id: 'call_mock_1', type: 'function', function: { name: 'bash', arguments: '' } }] })
    send({ tool_calls: [{ index: 0, function: { arguments: args } }] })
    send({}, 'tool_calls')
  } else {
    const reply = last?.role === 'tool'
      ? 'Mock reply: the command finished. This is the local relay stand-in.'
      : `Mock reply: ${textOf(last?.content).slice(0, 80)}`
    for (const word of reply.split(' ')) send({ content: `${word} ` })
    send({}, 'stop')
  }
  response.write('data: [DONE]\n\n')
  response.end()
}

/** Serve one request; every route is local and credential-free. */
async function handle(request: IncomingMessage, response: ServerResponse, authorizeNonce: Map<string, string>): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1')
  if (request.method === 'GET' && url.pathname === '/v1/models') {
    json(response, 200, {
      object: 'list',
      data: [
        { id: 'tomato-chat', object: 'model', owned_by: 'tomato', context_window: 262144 },
        { id: 'tomato-reasoner', object: 'model', owned_by: 'tomato', context_window: 262144 },
      ],
    })
    return
  }
  if (request.method === 'POST' && url.pathname === '/v1/chat/completions') {
    const body = JSON.parse(await readBody(request)) as { messages?: ChatMessage[], stream?: boolean }
    const messages = Array.isArray(body.messages) ? body.messages : []
    if (body.stream === false) {
      json(response, 200, {
        id: 'chatcmpl-mock',
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'tomato-chat',
        choices: [{ index: 0, message: { role: 'assistant', content: 'Mock reply.' }, finish_reason: 'stop' }],
      })
      return
    }
    streamChat(response, messages)
    return
  }
  if (request.method === 'GET' && url.pathname === '/desktop/authorize') {
    const redirect = url.searchParams.get('redirect_uri')
    const state = url.searchParams.get('state') ?? ''
    if (redirect === null) { json(response, 400, { error: 'missing redirect_uri' }); return }
    const code = `mock-${String(Date.now())}`
    authorizeNonce.set(code, state)
    const target = new URL(redirect)
    target.searchParams.set('code', code)
    target.searchParams.set('state', state)
    // A real login page collects credentials first; the mock approves directly.
    response.writeHead(302, { location: target.href })
    response.end()
    return
  }
  if (request.method === 'POST' && url.pathname === '/desktop/token') {
    const body = JSON.parse(await readBody(request)) as { code?: string }
    const code = body.code ?? ''
    if (!authorizeNonce.delete(code)) { json(response, 401, { error: 'unknown code' }); return }
    json(response, 200, { token: `tomato-local-token-${code}` })
    return
  }
  if (request.method === 'POST' && (url.pathname === '/v1/traces' || url.pathname === '/v1/logs')) {
    const body = await readBody(request)
    console.log(`[mock] otlp ${url.pathname}: ${String(body.length)} bytes`)
    json(response, 200, {})
    return
  }
  if (request.method === 'GET' && url.pathname === '/account/usage') {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    response.end('<!doctype html><p>Mock account usage.</p>')
    return
  }
  json(response, 404, { error: `no route for ${request.method ?? 'GET'} ${url.pathname}` })
}

const { values } = parseArgs({ options: { port: { type: 'string', default: '4010' } } })
const port = Number.parseInt(values.port ?? '4010', 10)
const authorizeNonce = new Map<string, string>()
const server = createServer((request, response) => {
  void handle(request, response, authorizeNonce).catch((error: unknown) => {
    console.error('[mock] request failed', error)
    if (!response.headersSent) json(response, 500, { error: 'mock failure' })
    else response.end()
  })
})
server.listen(port, '127.0.0.1', () => {
  console.log(`[mock] tomato services on http://127.0.0.1:${String(port)}`)
  console.log('[mock]   TOMATO_RELAY_BASE_URL=http://127.0.0.1:' + String(port) + '/v1')
  console.log('[mock]   TOMATO_AUTH_URL=http://127.0.0.1:' + String(port))
  console.log('[mock]   TOMATO_OTLP_ENDPOINT=http://127.0.0.1:' + String(port) + '/v1/traces')
})
