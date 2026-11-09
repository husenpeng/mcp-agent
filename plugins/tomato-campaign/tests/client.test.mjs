/**
 * Browser-half behavior: registration, the signed-out state, the campaign list
 * with its data columns, one campaign's workspace (role cards, roster, report),
 * and the status write — rendered from the built client.js bundle against a
 * mocked proxy.
 */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { after, before, describe, it } from 'node:test'
import { JSDOM } from 'jsdom'

const harnessRequire = createRequire('/Users/underdog/engineering/tomatoHarness/packages/client/ui-primitives/package.json')

/** Requests the bundle made, in order. */
const CALLS = []

/** Fixtures the proxy would return for a signed-in account. */
const FIXTURES = {
  '/api/clientweb/_status': { signedIn: true, configured: true, companyWebUrl: 'https://test.tomatoai.vip' },
  '/api/clientweb/v1/campaigns': {
    code: 0,
    data: {
      items: [{
        id: 'c1',
        name: '秋冬美妆 TikTok 种草季',
        brand: '花西子',
        category: '美妆护肤',
        goal: '品牌曝光',
        status: 'outreach',
        market: ['FR', 'GB'],
        platformFocus: ['tiktok', 'instagram'],
        budget: { min: 400000, max: null, currency: 'USD', tier: null },
        creatorCount: 148,
        recruitTarget: { total: 15 },
        creatorTierStats: { head: 2, mid: 40, tail: 106 },
        updatedAt: '2026-11-02T09:11:24.437416+00:00',
      }],
      total: 1,
    },
    meta: { traceId: 't1' },
  },
  '/api/clientweb/v1/campaigns/c1': {
    code: 0,
    data: {
      id: 'c1',
      name: '秋冬美妆 TikTok 种草季',
      brand: '花西子',
      category: '美妆护肤',
      goal: '品牌曝光',
      status: 'outreach',
      market: ['FR', 'GB'],
      platformFocus: ['tiktok'],
      budget: { min: 400000, max: null, currency: 'USD', tier: null },
      creatorCount: 148,
      recruitTarget: { total: 15 },
      creatorTierStats: { head: 2, mid: 40, tail: 106 },
      memberCount: 3,
      fileCount: 2,
      myRole: 'owner',
      product: '花西子玉养气垫',
      competitors: '完美日记',
      updatedAt: '2026-11-02T09:11:24.437416+00:00',
      artifacts: [{ type: 'handoff_doc', title: '执行交接', format: 'html', url: 'https://example.com/handoff.html', createdAt: '2026-11-03T05:22:00+00:00' }],
    },
  },
  '/api/clientweb/v1/campaigns/c1/creators': {
    code: 0,
    data: {
      items: [{
        creatorKey: 'TIKTOK:mia',
        platform: 'TIKTOK',
        displayName: 'Mia 美妆日记',
        handle: 'mia',
        followerCount: 182400,
        engagementRate: 0.086,
        country: 'FR',
        joinTier: 'mid',
        outreachStage: 'not_contacted',
        verifyStatus: 'verified',
        dataUpdatedAt: '2026-10-28T08:38:48+00:00',
        recommendReason: '近期美妆测评内容与气垫卖点高度匹配。',
      }],
      total: 1,
    },
  },
  '/api/clientweb/v1/campaigns/c1/role-cards': {
    code: 0,
    data: {
      items: [{
        id: 'r1',
        role: '美妆教程达人',
        tier: 'Mid-tier',
        category: '美妆护肤',
        vertical: '日常妆容',
        creatorType: '教程型',
        platforms: ['tiktok'],
        country: ['FR'],
        follow: 20000,
        followMax: 200000,
        mission: '日常妆容教程',
        taskId: 'task-1',
      }],
    },
  },
  '/api/clientweb/v1/campaigns/c1/role-cards/r1/search-task/report': {
    code: 0,
    data: {
      summary: '本次在 TikTok 找到 1 位法国美妆达人。',
      assumptions: ['未指定单人预算'],
      platforms: {
        tiktok: {
          candidates: [{
            rank: 1,
            channel_id: 'mia',
            channel_title: 'Mia 美妆日记',
            subscriber_count: 182400,
            estimated_price: 2500,
            reason: '妆容教程与气垫卖点匹配。',
            evidence: { metrics: { er: 0.086 } },
            profile: { handle: 'mia', profileUrl: 'https://www.tiktok.com/@mia', avatarUrl: null },
          }],
        },
      },
    },
  },
  '/api/clientweb/outreach/threads': { data: { items: [], nextCursor: null, funnelCounts: {} } },
  '/api/clientweb/outreach/campaigns/pending': { code: 0, data: { items: [{ id: 'c1', name: '秋冬美妆 TikTok 种草季', pendingCount: 12, timeline: null }], total: 1 } },
}

describe('client bundle', () => {
  let dom
  let React
  let ReactDOM
  let act
  let exports
  let registrations

  before(async () => {
    dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://127.0.0.1:58337/' })
    global.window = dom.window
    global.document = dom.window.document
    Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true })
    global.HTMLElement = dom.window.HTMLElement
    global.IS_REACT_ACT_ENVIRONMENT = true
    React = harnessRequire('react')
    ReactDOM = harnessRequire('react-dom/client')
    act = harnessRequire('react-dom/test-utils').act

    global.fetch = async (url, init = {}) => {
      const parsed = new URL(String(url), 'http://127.0.0.1:58337')
      CALLS.push({ method: init.method ?? 'GET', path: parsed.pathname, body: init.body })
      const body = FIXTURES[parsed.pathname]
      if (body === undefined) {
        return { ok: false, status: 404, text: async () => JSON.stringify({ error: { code: 'NOT_FOUND', message: 'missing' } }) }
      }
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify(body),
        json: async () => body,
      }
    }

    registrations = { main: [], sidebar: [] }
    dom.window.__ModuleLoader__ = { load: (entry) => { exports = entry.factory(harnessRequire) } }
    await import('../client.js')
    assert.ok(exports.apply, 'client bundle must export apply')
  })

  after(() => {
    delete global.window
    delete global.document
    delete global.navigator
    delete global.fetch
  })

  it('registers one main panel and one sidebar entry', () => {
    const ctx = {
      effect(fn) { return fn() },
      slots: {
        inject(_name, fn) { return fn() },
        register(options, component) {
          if (options.name === 'main') registrations.main.push({ options, component })
          if (options.name === 'sidebar.panellist') registrations.sidebar.push({ options, component })
          return () => {}
        },
      },
    }
    exports.apply(ctx)
    assert.equal(registrations.main.length, 1)
    assert.equal(registrations.main[0].options.key, 'campaign-workspace')
    assert.equal(registrations.sidebar.length, 1)
    assert.equal(registrations.sidebar[0].options.id, 'campaign-workspace')
    assert.equal(registrations.sidebar[0].options.label(), '活动')
  })

  it('renders the list with status, market, platform, budget, and creator columns', async () => {
    const App = registrations.main[0].component
    const container = document.getElementById('root')
    const root = ReactDOM.createRoot(container)
    await act(async () => { root.render(React.createElement(App)) })

    const text = () => container.textContent
    assert.match(text(), /活动工作台/)
    assert.match(text(), /秋冬美妆 TikTok 种草季/)
    assert.match(text(), /花西子 · 美妆护肤 · 品牌曝光/)
    assert.match(text(), /建联/)
    assert.match(text(), /法国 FR/)
    assert.match(text(), /TikTok/)
    assert.match(text(), /\$40\.0 万 起/)
    assert.match(text(), /148/)
    assert.match(text(), /目标 15/)
    assert.equal(container.querySelectorAll('tbody tr.clickable').length, 1)

    await act(async () => { root.unmount() })
  })

  it('drills into one campaign: role cards, report, and roster', async () => {
    const App = registrations.main[0].component
    const container = document.getElementById('root')
    const root = ReactDOM.createRoot(container)
    await act(async () => { root.render(React.createElement(App)) })

    const text = () => container.textContent
    const row = container.querySelector('tbody tr.clickable')
    await act(async () => { row.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })

    assert.match(text(), /美妆教程达人/)
    assert.match(text(), /日常妆容教程/)
    assert.match(text(), /已有推荐任务/)

    const reportButton = [...container.querySelectorAll('button')].find(button => button.textContent === '查看报告')
    await act(async () => { reportButton.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })
    assert.match(text(), /推荐报告 · 美妆教程达人/)
    assert.match(text(), /Mia 美妆日记/)
    assert.match(text(), /\$2500/)

    const close = [...container.querySelectorAll('button')].find(button => button.textContent === '关闭')
    await act(async () => { close.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })

    const rosterTab = [...container.querySelectorAll('.tcw-tabs-line button')].find(button => button.textContent.startsWith('达人清单'))
    await act(async () => { rosterTab.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })
    assert.match(text(), /Mia 美妆日记/)
    assert.match(text(), /8\.6%/)

    await act(async () => { root.unmount() })
  })

  it('writes the new status through the proxy', async () => {
    CALLS.length = 0
    global.fetch = async (url, init = {}) => {
      const parsed = new URL(String(url), 'http://127.0.0.1:58337')
      CALLS.push({ method: init.method ?? 'GET', path: parsed.pathname, body: init.body })
      if (init.method === 'PATCH') {
        const body = { code: 0, data: { id: 'c1', status: JSON.parse(String(init.body)).status } }
        return { ok: true, status: 200, text: async () => JSON.stringify(body), json: async () => body }
      }
      const body = FIXTURES[parsed.pathname]
      if (body === undefined) {
        return { ok: false, status: 404, text: async () => JSON.stringify({ error: { code: 'NOT_FOUND', message: 'missing' } }) }
      }
      return { ok: true, status: 200, text: async () => JSON.stringify(body), json: async () => body }
    }

    const App = registrations.main[0].component
    const container = document.getElementById('root')
    const root = ReactDOM.createRoot(container)
    await act(async () => { root.render(React.createElement(App)) })
    const row = container.querySelector('tbody tr.clickable')
    await act(async () => { row.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })

    const select = container.querySelector('select[aria-label="修改阶段"]')
    assert.ok(select, 'detail must offer the status select')
    await act(async () => {
      select.value = 'completed'
      select.dispatchEvent(new dom.window.Event('change', { bubbles: true }))
    })

    const patch = CALLS.find(call => call.method === 'PATCH')
    assert.ok(patch, 'changing the status must reach the proxy')
    assert.equal(patch.path, '/api/clientweb/v1/campaigns/c1')
    assert.deepEqual(JSON.parse(patch.body), { status: 'completed' })

    await act(async () => { root.unmount() })
  })
})