import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@tomato/cordis'
import LlmRuntime, { createUserMessage } from '@tomato/llm'
import * as LlmPiAi from '@tomato/llm-pi-ai'
import { resolveModelPolicy } from '../src/config.ts'
import { assemble } from './assemble.ts'
import { closeMockServers, mockServer, textEvents } from './mock-server.ts'

const KEY_ENV = 'PI_TEST_KEY'
const PROVIDER = 'acme-gateway'
const MODELS = ['local-model', 'recent-model', 'blocked-model'] as const

beforeEach(() => {
  vi.stubEnv(KEY_ENV, 'test-key')
})

afterEach(async () => {
  vi.unstubAllEnvs()
  await closeMockServers()
})

/** One route whose three models exercise both allowlist filters and the deny default. */
function route(baseURL: string, modelPolicy?: LlmPiAi.Options['modelPolicy']): LlmPiAi.Options {
  return {
    providers: {
      [PROVIDER]: {
        apiKeyEnv: KEY_ENV,
        api: 'openai-completions',
        baseURL,
        models: MODELS.map(model => ({ id: model, contextWindow: 65_536, maxTokens: 4096 })),
      },
    },
    ...modelPolicy === undefined ? {} : { modelPolicy },
  }
}

/** The policy that permits the local and recent lists and denies every other model. */
const POLICY: LlmPiAi.Options['modelPolicy'] = {
  enabled: true,
  local: [{ provider: PROVIDER, model: 'local-model' }],
  recent: [{ provider: PROVIDER, model: 'recent-model', releasedAt: '2026-09-01' }],
  recentSince: '2026-05-05',
}

async function harness(config: LlmPiAi.Options): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(LlmRuntime)
  await ctx.plugin(LlmPiAi, config)
  return ctx
}

/** One user message for a request. */
function prompt(text: string) {
  return createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'test' } })
}

describe('model policy resolution', () => {
  it('leaves the adapter unrestricted when no policy is configured', () => {
    expect(resolveModelPolicy(undefined)).toBeUndefined()
    expect(resolveModelPolicy(null)).toBeUndefined()
  })

  it('leaves the adapter unrestricted when the policy is disabled', () => {
    expect(resolveModelPolicy({
      enabled: false,
      local: [{ provider: PROVIDER, model: 'local-model' }],
      recent: [],
    })).toBeUndefined()
  })

  it('permits the deployment’s local models alongside the recent-release list', () => {
    const policy = resolveModelPolicy({
      enabled: true,
      recentSince: '2026-05-05',
      local: [
        { provider: 'blueai', model: 'claude-opus-5-5' },
        { provider: 'blueai', model: 'claude-opus-4-5-20251101' },
        { provider: 'blueai', model: 'DeepSeek-V4.1-Flash-1017' },
      ],
      recent: [{ provider: 'blueai', model: 'claude-opus-4-8', releasedAt: '2026-09-01' }],
    })
    if (policy === undefined) throw new Error('policy did not resolve')
    // Local list: old or not, membership is enough.
    expect(policy.isAllowed('blueai', 'claude-opus-4-5-20251101')).toBe(true)
    expect(policy.isAllowed('blueai', 'DeepSeek-V4.1-Flash-1017')).toBe(true)
    // Recent-release list: allowed even though it is not local.
    expect(policy.isAllowed('blueai', 'claude-opus-4-8')).toBe(true)
    // Everything else is denied by default.
    expect(policy.isAllowed('blueai', 'glm-5.3')).toBe(false)
    expect(policy.isAllowed('blueai', 'claude-opus-4-7')).toBe(false)
  })

  it('permits the local and recent lists and denies everything else', () => {
    const policy = resolveModelPolicy(POLICY)
    if (policy === undefined) throw new Error('policy did not resolve')
    expect(policy.isAllowed(PROVIDER, 'local-model')).toBe(true)
    expect(policy.isAllowed(PROVIDER, 'recent-model')).toBe(true)
    expect(policy.isAllowed(PROVIDER, 'blocked-model')).toBe(false)
    expect(policy.isAllowed('other-gateway', 'local-model')).toBe(false)
    expect(policy.recentSince).toBe('2026-05-05')
  })

  it('applies the recent window to the recent list', () => {
    const policy = resolveModelPolicy({
      enabled: true,
      recentSince: '2026-05-05',
      local: [],
      recent: [
        { provider: PROVIDER, model: 'after', releasedAt: '2026-09-01' },
        { provider: PROVIDER, model: 'on', releasedAt: '2026-05-05' },
        { provider: PROVIDER, model: 'before', releasedAt: '2025-01-01' },
      ],
    })
    if (policy === undefined) throw new Error('policy did not resolve')
    expect(policy.isAllowed(PROVIDER, 'after')).toBe(true)
    expect(policy.isAllowed(PROVIDER, 'on')).toBe(true)
    expect(policy.isAllowed(PROVIDER, 'before')).toBe(false)
  })

  it('permits a model by its release date without listing it', () => {
    const policy = resolveModelPolicy({
      enabled: true,
      recentSince: '2026-05-05',
      local: [],
      recent: [],
      releaseDates: {
        [`${PROVIDER}/after`]: '2026-09-01',
        [`${PROVIDER}/on`]: '2026-05-05',
        [`${PROVIDER}/before`]: '2025-01-01',
      },
    })
    if (policy === undefined) throw new Error('policy did not resolve')
    expect(policy.isAllowed(PROVIDER, 'after')).toBe(true)
    expect(policy.isAllowed(PROVIDER, 'on')).toBe(true)
    expect(policy.isAllowed(PROVIDER, 'before')).toBe(false)
    expect(policy.isAllowed(PROVIDER, 'unknown')).toBe(false)
    expect(policy.releaseDates.get(`${PROVIDER}/after`)).toBe('2026-09-01')
  })

  it('requires the recent window for a release-date manifest', () => {
    expect(() => resolveModelPolicy({
      enabled: true,
      local: [],
      recent: [],
      releaseDates: { [`${PROVIDER}/m`]: '2026-09-01' },
    })).toThrow(/requires recentSince/)
  })

  it('refuses malformed release-date entries', () => {
    expect(() => resolveModelPolicy({
      enabled: true,
      recentSince: '2026-05-05',
      local: [],
      recent: [],
      releaseDates: { malformed: '2026-09-01' },
    })).toThrow(/must be provider\/model/)
    expect(() => resolveModelPolicy({
      enabled: true,
      recentSince: '2026-05-05',
      local: [],
      recent: [],
      releaseDates: { [`${PROVIDER}/m`]: 'not-a-date' },
    })).toThrow(/must be an ISO date/)
  })

  it('requires a release date for a recent entry when the window is set', () => {
    expect(() => resolveModelPolicy({
      enabled: true,
      recentSince: '2026-05-05',
      local: [],
      recent: [{ provider: PROVIDER, model: 'm' }],
    })).toThrow(/releasedAt is required/)
  })

  it('allows a recent entry without a date when no window is set', () => {
    const policy = resolveModelPolicy({
      enabled: true,
      local: [],
      recent: [{ provider: PROVIDER, model: 'm' }],
    })
    if (policy === undefined) throw new Error('policy did not resolve')
    expect(policy.isAllowed(PROVIDER, 'm')).toBe(true)
  })

  it('refuses an invalid releasedAt', () => {
    expect(() => resolveModelPolicy({
      enabled: true,
      recentSince: '2026-05-05',
      local: [],
      recent: [{ provider: PROVIDER, model: 'm', releasedAt: 'not-a-date' }],
    })).toThrow(/releasedAt must be an ISO date/)
  })

  it('denies every model when the configured lists are empty', () => {
    const policy = resolveModelPolicy({ enabled: true, local: [], recent: [] })
    if (policy === undefined) throw new Error('policy did not resolve')
    expect(policy.isAllowed(PROVIDER, 'local-model')).toBe(false)
  })

  it('refuses an empty model reference', () => {
    expect(() => resolveModelPolicy({ enabled: true, local: [{ provider: '', model: 'm' }], recent: [] }))
      .toThrow(/needs non-empty provider and model/)
    expect(() => resolveModelPolicy({ enabled: true, local: [], recent: [{ provider: PROVIDER, model: '' }] }))
      .toThrow(/needs non-empty provider and model/)
  })

  it('refuses an unusable recent window', () => {
    expect(() => resolveModelPolicy({ enabled: true, local: [], recent: [], recentSince: 'not-a-date' }))
      .toThrow(/ISO date/)
    expect(() => resolveModelPolicy({ enabled: true, local: [], recent: [], recentSince: '' }))
      .toThrow(/ISO date/)
  })
})

describe('model policy enforcement', () => {
  it('marks blocked models visible but unavailable', async () => {
    const server = await mockServer([])
    const ctx = await harness(route(server.url, POLICY))

    expect(await ctx.llm.listModels(PROVIDER)).toEqual([
      { provider: PROVIDER, id: 'local-model', name: 'local-model', inputModalities: ['text'] },
      { provider: PROVIDER, id: 'recent-model', name: 'recent-model', inputModalities: ['text'] },
      {
        provider: PROVIDER,
        id: 'blocked-model',
        name: 'blocked-model',
        inputModalities: ['text'],
        blockedReason: 'outside the deployment model allowlist',
      },
    ])
  })

  it('lists every model when no policy is configured', async () => {
    const server = await mockServer([])
    const ctx = await harness(route(server.url))

    expect((await ctx.llm.listModels(PROVIDER)).map(model => model.id)).toEqual([...MODELS])
  })

  it('refuses a blocked model before any provider request', async () => {
    const server = await mockServer([])
    const ctx = await harness(route(server.url, POLICY))

    const result = await assemble(ctx, {
      provider: PROVIDER,
      model: 'blocked-model',
      messages: [prompt('hello')],
    })

    expect(result.finish).toMatchObject({
      kind: 'error',
      failure: { code: 'MODEL_NOT_ALLOWED' },
    })
    expect(server.paths).toEqual([])
  })

  it('serves a model from the local list', async () => {
    const server = await mockServer([{ events: textEvents }])
    const ctx = await harness(route(server.url, POLICY))

    const result = await assemble(ctx, {
      provider: PROVIDER,
      model: 'local-model',
      messages: [prompt('hello')],
    })

    expect(result.finish).toEqual({ kind: 'stop' })
    expect(server.paths).toEqual(['/chat/completions'])
  })

  it('serves a model from the recent-release list', async () => {
    const server = await mockServer([{ events: textEvents }])
    const ctx = await harness(route(server.url, POLICY))

    const result = await assemble(ctx, {
      provider: PROVIDER,
      model: 'recent-model',
      messages: [prompt('hello')],
    })

    expect(result.finish).toEqual({ kind: 'stop' })
    expect(server.paths).toEqual(['/chat/completions'])
  })

  it('refuses to mount an invalid policy', async () => {
    const server = await mockServer([])
    await expect(harness(route(server.url, {
      enabled: true,
      local: [{ provider: '', model: 'm' }],
      recent: [],
    }))).rejects.toThrow(/needs non-empty provider and model/)
  })
})
