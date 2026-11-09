/** Host-half behavior: configuration, envelope normalization, proxy, and tools. */
import assert from 'node:assert/strict'
import http from 'node:http'
import { after, before, describe, it } from 'node:test'
import { resolveConfig } from '../src/host/config.js'
import { createBff, normalizeEnvelope } from '../src/host/bff.js'
import { createProxy } from '../src/host/proxy.js'
import { createTools } from '../src/host/tools.js'
import { sessionOf } from '../src/host/session.js'
import { startUpstream } from './upstream.mjs'

/** A tool definition as the real `defineTool` would return it. */
const defineTool = definition => definition

describe('configuration', () => {
  it('defaults the proxy path and takes the origin from the environment', () => {
    const config = resolveConfig({}, { TOMATO_WEB_URL: 'https://test.tomatoai.vip/' })
    assert.equal(config.baseUrl, 'https://test.tomatoai.vip')
    assert.equal(config.proxyPath, '/api/clientweb')
    assert.equal(config.sessionCookie, 'tomato_session')
    assert.equal(config.tools, true)
    assert.equal(config.allowWrites, true)
  })

  it('rejects a non-HTTP origin instead of throwing', () => {
    assert.equal(resolveConfig({ baseUrl: 'ftp://example.com' }).baseUrl, '')
    assert.equal(resolveConfig({ baseUrl: 'not a url' }).baseUrl, '')
  })
})

describe('session', () => {
  it('reads the gateway cookie and prefers the Desktop header', () => {
    const config = resolveConfig({})
    assert.equal(sessionOf({ cookie: 'a=1; tomato_session=s1' }, config), 's1')
    assert.equal(sessionOf({ cookie: 'tomato_session=s1', 'x-tomato-session': 's2' }, config), 's2')
    assert.equal(sessionOf({ cookie: 'a=1' }, config), undefined)
  })
})

describe('envelope normalization', () => {
  it('treats a campaign warning code as success and an error code as failure', () => {
    assert.deepEqual(normalizeEnvelope({ code: 20001, data: { items: [] } }, 200).ok, true)
    const failed = normalizeEnvelope({ code: 40301, message: '没有权限', data: null }, 200)
    assert.equal(failed.ok, false)
    assert.equal(failed.error.code, 40301)
  })

  it('reads the discover envelope', () => {
    assert.deepEqual(normalizeEnvelope({ data: { items: [1] } }, 200).data, { items: [1] })
    assert.equal(normalizeEnvelope({ error: { code: 'UPSTREAM_UNAVAILABLE', message: 'x' } }, 502).ok, false)
  })
})

describe('proxy and tools against a mock BFF', () => {
  let upstream
  let server
  let origin
  let state

  before(async () => {
    upstream = await startUpstream()
    state = { sessionId: undefined }
    const config = resolveConfig({ baseUrl: upstream.url })
    const handler = createProxy({ config, state, origin: undefined })
    server = http.createServer((request, response) => handler(request, response))
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    origin = `http://127.0.0.1:${server.address().port}`
  })

  after(async () => {
    await new Promise(resolve => server.close(resolve))
    await upstream.close()
  })

  it('reports signed-out status without calling upstream', async () => {
    const response = await fetch(`${origin}/api/clientweb/_status`)
    const body = await response.json()
    assert.equal(response.status, 200)
    assert.equal(body.signedIn, false)
    assert.equal(body.configured, true)
  })

  it('projects the status from the request session, not only from earlier API calls', async () => {
    // A freshly mounted panel asks for the status before any proxied call runs.
    const before = await (await fetch(`${origin}/api/clientweb/_status`, { headers: { cookie: 'tomato_session=desk' } })).json()
    assert.equal(before.signedIn, true)
    assert.equal(upstream.seen.length, 0, 'status must not spend an upstream request')
  })

  it('reads the Desktop session header for the status too', async () => {
    const body = await (await fetch(`${origin}/api/clientweb/_status`, { headers: { 'x-tomato-session': 'desktop' } })).json()
    assert.equal(body.signedIn, true)
  })

  it('rejects an API call without the session cookie', async () => {
    const response = await fetch(`${origin}/api/clientweb/v1/campaigns`)
    assert.equal(response.status, 401)
    assert.equal((await response.json()).error.code, 'NOT_SIGNED_IN')
  })

  it('forwards path, query, method, and body with session_id', async () => {
    const response = await fetch(`${origin}/api/clientweb/v1/campaigns?keyword=%E7%BE%8E%E5%A6%86`, {
      headers: { cookie: 'tomato_session=s1' },
    })
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.code, 0)
    assert.equal(body.data.items[0].id, 'c1')
    const seen = upstream.seen.at(-1)
    assert.equal(seen.url, '/api/v1/campaigns?keyword=%E7%BE%8E%E5%A6%86')
    assert.equal(seen.headers.cookie, 'session_id=s1')
    assert.equal(state.sessionId, 's1')
  })

  it('drops the BFF session cookie but keeps other cookies, without Secure', async () => {
    const response = await fetch(`${origin}/api/clientweb/v1/campaigns/c1`, {
      headers: { cookie: 'tomato_session=s1' },
    })
    assert.equal(response.status, 200)
    const cookies = response.headers.getSetCookie()
    assert.deepEqual(cookies, ['theme=dark'])
  })

  it('maps an upstream login redirect to 401 for API callers', async () => {
    const response = await fetch(`${origin}/api/clientweb/expired`, {
      headers: { cookie: 'tomato_session=s1' },
    })
    assert.equal(response.status, 401)
    assert.equal((await response.json()).error.code, 'UNAUTHENTICATED')
  })

  it('rewrites an absolute upstream redirect onto the proxy prefix', async () => {
    const response = await fetch(`${origin}/api/clientweb/moved`, {
      headers: { cookie: 'tomato_session=s1' },
      redirect: 'manual',
    })
    assert.equal(response.status, 302)
    assert.equal(response.headers.get('location'), '/api/clientweb/v1/campaigns')
  })

  it('runs the campaign_list tool through the shared session', async () => {
    const config = resolveConfig({ baseUrl: upstream.url })
    const bff = createBff({ baseUrl: config.baseUrl, timeoutMs: 5000 })
    const call = (path, options = {}) => bff.call(path, { ...options, session: state.sessionId })
    const tools = createTools({ config, call, defineTool })
    assert.ok(tools.some(tool => tool.name === 'campaign_list'))
    assert.ok(tools.some(tool => tool.name === 'outreach_reply'))
    const value = await tools.find(tool => tool.name === 'campaign_list').execute({ keyword: '美妆' }, {})
    assert.equal(value.data.items[0].id, 'c1')
    assert.equal(value.meta.traceId, 'trace-1')
  })

  it('turns a campaign error code into a thrown failure', async () => {
    const config = resolveConfig({ baseUrl: upstream.url })
    const bff = createBff({ baseUrl: config.baseUrl, timeoutMs: 5000 })
    const call = (path, options = {}) => bff.call(path, { ...options, session: 's1' })
    const tools = createTools({ config, call, defineTool })
    await assert.rejects(
      tools.find(tool => tool.name === 'campaign_get').execute({ campaignId: 'denied' }, {}),
      /没有权限/,
    )
  })

  it('escapes reply text into paragraphs', async () => {
    const config = resolveConfig({ baseUrl: '' })
    const calls = []
    const call = async (path, options) => {
      calls.push({ path, options })
      return { ok: true, data: { messageId: 'm1' }, meta: null }
    }
    const tools = createTools({ config, call, defineTool })
    await tools.find(tool => tool.name === 'outreach_reply').execute(
      { threadId: 't1', text: 'A < B\n\n第二段' },
      {},
    )
    const body = calls[0].options.body
    assert.equal(body.bodyText, 'A < B\n\n第二段')
    assert.equal(body.bodyHtml, '<p>A &lt; B</p><p>第二段</p>')
  })

  it('refuses tools before any browser request establishes a session', async () => {
    const config = resolveConfig({ baseUrl: upstream.url })
    const bff = createBff({ baseUrl: config.baseUrl, timeoutMs: 5000 })
    const tools = createTools({ config, call: (path, options = {}) => bff.call(path, options), defineTool })
    await assert.rejects(
      tools.find(tool => tool.name === 'campaign_list').execute({}, {}),
      /还没有登录/,
    )
  })
})