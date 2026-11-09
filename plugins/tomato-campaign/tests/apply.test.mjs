/** Plugin wiring: apply() registers the proxy, the tools, and the skill. */
import assert from 'node:assert/strict'
import http from 'node:http'
import { after, before, describe, it } from 'node:test'
import { apply } from '../index.js'
import { startUpstream } from './upstream.mjs'

describe('plugin apply()', () => {
  let upstream
  let server
  let origin
  const routes = []
  const registeredTools = []
  const registeredSkills = []

  before(async () => {
    upstream = await startUpstream()
    const services = {
      tools: { register: tool => { registeredTools.push(tool); return () => {} } },
      skills: { register: skill => { registeredSkills.push(skill); return () => {} } },
    }
    const ctx = {
      effect(fn) { return fn() },
      inject(deps, callback) {
        const child = {
          effect(fn) { return fn() },
          tools: services.tools,
          skills: services.skills,
        }
        for (const dep of deps) assert.ok(dep in services, `unexpected dependency ${dep}`)
        callback(child)
      },
      webServer: {
        getOrigin: () => 'http://127.0.0.1:58337',
        register(route) { routes.push(route); return () => {} },
      },
    }
    apply(ctx, { baseUrl: upstream.url })

    assert.equal(routes.length, 1)
    server = http.createServer((request, response) => routes[0].handler(request, response))
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    origin = `http://127.0.0.1:${server.address().port}`
  })

  after(async () => {
    await new Promise(resolve => server.close(resolve))
    await upstream.close()
  })

  it('mounts a prefix route on the configured path', () => {
    assert.equal(routes[0].kind, 'prefix')
    assert.equal(routes[0].path, '/api/clientweb')
  })

  it('registers the read and write tools plus the skill', () => {
    const names = registeredTools.map(tool => tool.name)
    for (const name of ['campaign_list', 'campaign_get', 'roster_list', 'role_card_list', 'feishu_members', 'outreach_threads', 'outreach_reply']) {
      assert.ok(names.includes(name), `missing ${name}`)
    }
    assert.equal(registeredSkills.length, 1)
    assert.equal(registeredSkills[0].name, 'campaign-outreach')
    assert.ok(registeredSkills[0].content.includes('campaign_list'))
  })

  it('serves the proxy through the registered route and shares the session with tools', async () => {
    const response = await fetch(`${origin}/api/clientweb/v1/campaigns`, { headers: { cookie: 'tomato_session=s9' } })
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.data.items[0].id, 'c1')
    assert.equal(upstream.seen.at(-1).headers.cookie, 'session_id=s9')

    const tool = registeredTools.find(candidate => candidate.name === 'campaign_list')
    const value = await tool.execute({}, {})
    assert.equal(value.data.items[0].id, 'c1')
  })
})