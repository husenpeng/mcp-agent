// Brief gating, the search ladder, scoring, and the feedback loop, exercised
// through the registered tools over a stubbed BFF and the real storage path.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@tomato/cordis'
import { ToolCallId } from '@tomato/llm'
import type { ToolExecutionResult } from '@tomato/tools'
import { mountAgentLoopTestDependencies } from '@tomato/agent-loop-testkit'
import Storage from '@tomato/storage'
import * as CreatorSearch from '@tomato/tool-creator-search'
import {
  CREATOR_FEEDBACK_TOOL,
  CREATOR_INGEST_TOOL,
  CREATOR_SCOUT_TOOL,
  creatorKey,
  normalizeBrief,
  parseEngagementRate,
  planSearches,
  scoreCandidate,
} from '@tomato/tool-creator-search'
import * as MemoryStorage from './helpers/memory-storage.ts'

async function mount() {
  const ctx = new Context()
  await mountAgentLoopTestDependencies(ctx)
  const storage = await ctx.plugin(Storage)
  await storage.await()
  const domains = await ctx.plugin(MemoryStorage)
  await domains.await()
  ctx.provide('desktopSession', { sessionId: () => 'session-1' })
  const fiber = await ctx.plugin(CreatorSearch, {
    baseURL: 'https://bff.test',
    defaultFollowersMin: 1_000,
    defaultFollowersMax: 100_000,
    defaultMinEngagementRate: 0.01,
    defaultTargetCount: 2,
    depthStandard: { maxSearchCalls: 4, pagesPerQuery: 1, pageSize: 20, enrichLimit: 1 },
  })
  await fiber.await()
  return ctx
}

async function run(ctx: Context, name: string, args: unknown): Promise<ToolExecutionResult> {
  const batch = await ctx.tools.execute({
    calls: [{ type: 'tool-call', name, id: ToolCallId('scout-1'), arguments: JSON.stringify(args) }],
    signal: new AbortController().signal,
  })
  const result = batch.results[0]?.result
  if (result === undefined) throw new Error('tool execution produced no result')
  return result
}

/** Blue search items for one query: a strong, a weak, and an out-of-band creator. */
function blueItems(query: string): unknown[] {
  const creator = {
    channel_id: 'UC1111111111111111111111',
    unique_id: 'beauty.one',
    nickname: 'Beauty One',
    country: 'US',
    follower_count: 30_000,
    avg_engagement_rate: '3.4',
    has_email: true,
    last_publish_at: new Date().toISOString(),
    url: 'https://example.test/beauty.one',
  }
  const weak = {
    channel_id: 'UC2222222222222222222222',
    unique_id: 'beauty.two',
    nickname: 'Beauty Two',
    country: 'GB',
    follower_count: 5_000,
    avg_engagement_rate: '0.4',
    has_email: false,
  }
  const outOfBand = { channel_id: 'UC3333333333333333333333', unique_id: 'mega', nickname: 'Mega', country: 'US', follower_count: 4_000_000 }
  return query === 'beauty US' ? [creator, weak, outOfBand] : [creator]
}

/** Route the stubbed BFF by endpoint. */
function stubBff(seen: string[]): void {
  vi.stubGlobal('fetch', vi.fn(async (url: URL, init: RequestInit) => {
    const path = url.pathname
    seen.push(path)
    if (path.endsWith('/blue/search')) {
      const body = JSON.parse(typeof init.body === 'string' ? init.body : '{}') as { query?: string }
      return Response.json({ data: { items: blueItems(body.query ?? '') }, meta: { traceId: `t${String(seen.length)}`, schemaVersion: '1.0', source: 'blue' } })
    }
    if (path.endsWith('/blue/detail')) {
      return Response.json({ data: { kox_country: 'US', kox_email: 'hi@example.test' }, meta: { traceId: 'detail', schemaVersion: '1.0', source: 'blue' } })
    }
    return Response.json({ data: { regionCode: 'US', subscriberCount: 30_000, businessEmail: 'hi@example.test' }, meta: { traceId: 'ycp', schemaVersion: '1.0', source: 'ycp' } })
  }))
}

afterEach(() => { vi.unstubAllGlobals() })

describe('brief normalization', () => {
  it('returns merged questions instead of a brief when an essential field is missing', () => {
    const decision = normalizeBrief({ category: 'beauty' }, { followersMin: 1_000, followersMax: 100_000, minEngagementRate: 0.01, targetCount: 10 })
    expect(decision.brief).toBeUndefined()
    expect(decision.missing).toEqual(['platforms', 'market'])
    expect(decision.questions).toHaveLength(2)
    expect(decision.questions.join(' ')).toContain('platform')
  })

  it('states every default it applied and derives keyword variants', () => {
    const decision = normalizeBrief(
      { category: 'acne skincare', product: 'cleanser', platforms: ['tiktok', 'YOUTUBE'], market: 'us' },
      { followersMin: 10_000, followersMax: 200_000, minEngagementRate: 0.01, targetCount: 10 },
    )
    expect(decision.brief?.platforms).toEqual(['TIKTOK', 'YOUTUBE'])
    expect(decision.brief?.market).toBe('US')
    expect(decision.brief?.keywords).toEqual(expect.arrayContaining(['cleanser acne skincare', 'acne skincare US']))
    expect(decision.assumptions).toEqual(expect.arrayContaining([
      'targetCount defaults to 10',
      'follower band defaults to 10K–200K',
      'engagement floor defaults to 1%',
    ]))
  })

  it('rejects a brief whose stated values cannot describe a search', () => {
    const defaults = { followersMin: 1_000, followersMax: 100_000, minEngagementRate: 0.01, targetCount: 10 }
    expect(() => normalizeBrief({ category: 'x', platforms: ['TIKTOK'], market: 'US', followersMin: 9_000, followersMax: 5_000 }, defaults)).toThrow('non-empty band')
    expect(() => normalizeBrief({ category: 'x', platforms: ['TIKTOK'], market: 'US', minEngagementRate: 2 }, defaults)).toThrow('between 0 and 1')
  })
})

describe('search planning', () => {
  const brief = normalizeBrief(
    { category: 'beauty', product: 'serum', platforms: ['TIKTOK', 'INSTAGRAM'], market: 'US', targetCount: 5, keywords: ['beauty US'] },
    { followersMin: 1_000, followersMax: 100_000, minEngagementRate: 0.01, targetCount: 10 },
  ).brief!

  it('stops at the call budget and covers more than one strategy', () => {
    const steps = planSearches(brief, { maxSearchCalls: 5, pagesPerQuery: 2, pageSize: 20, enrichLimit: 0, poolFactor: 2 }, ['review'])
    expect(steps).toHaveLength(5)
    expect(new Set(steps.map(step => step.strategy)).size).toBeGreaterThan(1)
    expect(steps.every(step => brief.platforms.includes(step.platform))).toBe(true)
  })

  it('searches only the caller\'s own phrases under strict', () => {
    const steps = planSearches(brief, { maxSearchCalls: 24, pagesPerQuery: 2, pageSize: 20, enrichLimit: 0, poolFactor: 2 }, ['review'], 'strict')
    expect(steps.every(step => step.query === 'beauty US')).toBe(true)
    expect(steps.every(step => step.source === 'user')).toBe(true)
    expect(steps.some(step => step.strategy === 'keyword-variant')).toBe(false)
    expect(steps.some(step => step.strategy === 'relaxed-followers')).toBe(false)
  })

  it('keeps balanced variants inside the stated vocabulary', () => {
    const steps = planSearches(brief, { maxSearchCalls: 24, pagesPerQuery: 1, pageSize: 20, enrichLimit: 0, poolFactor: 2 }, ['review'], 'balanced')
    const variants = steps.filter(step => step.strategy === 'keyword-variant')
    expect(variants.length).toBeGreaterThan(0)
    expect(variants.every(step => !step.query.includes('review'))).toBe(true)
    expect(variants.every(step => step.query.includes('beauty') || step.query.includes('serum'))).toBe(true)
  })

  it('appends the configured suffix only under broad', () => {
    const steps = planSearches(brief, { maxSearchCalls: 24, pagesPerQuery: 1, pageSize: 20, enrichLimit: 0, poolFactor: 2 }, ['review'], 'broad')
    expect(steps.some(step => step.query.includes('review'))).toBe(true)
  })

  it('never paves the same query twice for one platform', () => {
    const steps = planSearches(brief, { maxSearchCalls: 24, pagesPerQuery: 1, pageSize: 20, enrichLimit: 0, poolFactor: 2 }, ['review'])
    const keys = steps.map(step => `${step.platform}|${step.query}|${String(step.page)}`)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('scoring', () => {
  const brief = normalizeBrief(
    { category: 'beauty', platforms: ['TIKTOK'], market: 'US', targetCount: 3 },
    { followersMin: 1_000, followersMax: 100_000, minEngagementRate: 0.01, targetCount: 10 },
  ).brief!
  const weights = { followers: 25, engagement: 25, keywords: 20, market: 15, recency: 10, contactability: 5 }

  it('passes a creator whose gates all have evidence', () => {
    const scored = scoreCandidate({
      platform: 'TIKTOK',
      creatorId: 'a',
      handle: 'beauty.one',
      name: 'Beauty One',
      country: 'US',
      followers: 30_000,
      engagementRate: 0.034,
      hasEmail: true,
      lastPublishedAt: new Date().toISOString(),
      queries: ['beauty'],
      traces: ['t1'],
    }, brief, weights, Date.now())
    expect('score' in scored && scored.status).toBe('pass')
    expect('coverage' in scored && scored.coverage).toBe(100)
    expect('reasons' in scored && scored.reasons.length).toBeGreaterThan(2)
  })

  it('drops creators outside a gate with the value that failed', () => {
    const outOfBand = scoreCandidate({
      platform: 'TIKTOK', creatorId: 'big', followers: 500_000, queries: ['beauty'], traces: ['t'],
    }, brief, weights, Date.now())
    expect(outOfBand).toMatchObject({ gate: 'followers' })
    const offMarket = scoreCandidate({
      platform: 'TIKTOK', creatorId: 'gb', country: 'GB', followers: 30_000, queries: ['beauty'], traces: ['t'],
    }, brief, weights, Date.now())
    expect(offMarket).toMatchObject({ gate: 'market' })
  })

  it('marks a creator with missing gate evidence as conditional', () => {
    const scored = scoreCandidate({
      platform: 'TIKTOK', creatorId: 'sparse', handle: 'beauty', queries: ['beauty'], traces: ['t'],
    }, brief, weights, Date.now())
    expect('score' in scored && scored.status).toBe('conditional')
    expect('coverage' in scored && scored.coverage).toBeLessThan(50)
  })

  it('reads engagement defensively', () => {
    expect(parseEngagementRate('3.4')).toBeCloseTo(0.034)
    expect(parseEngagementRate('0.034')).toBeCloseTo(0.034)
    expect(parseEngagementRate('3.4%')).toBeCloseTo(0.034)
    expect(parseEngagementRate('n/a')).toBeUndefined()
  })
})

describe('scout and feedback through the tools', () => {
  it('asks for the brief without spending a request', async () => {
    const seen: string[] = []
    stubBff(seen)
    const ctx = await mount()
    const result = await run(ctx, CREATOR_SCOUT_TOOL, { category: 'beauty' })

    expect(result.isError).toBe(false)
    expect(result.value).toMatchObject({ status: 'needs_brief' })
    expect(seen).toHaveLength(0)
  })

  it('scouts, merges duplicate findings, and ranks by the brief', async () => {
    const seen: string[] = []
    stubBff(seen)
    const ctx = await mount()
    const result = await run(ctx, CREATOR_SCOUT_TOOL, {
      category: 'beauty', platforms: ['TIKTOK'], market: 'US', targetCount: 2, keywords: ['beauty'],
    })

    expect(result.isError).toBe(false)
    const value = result.value as {
      shortlist: { creatorId: string; status: string; score: number }[]
      stats: { searchCalls: number }
    }
    expect(value.stats.searchCalls).toBeGreaterThan(0)
    expect(value.shortlist.map(entry => entry.creatorId)).toContain('beauty.one')
    expect(new Set(value.shortlist.map(entry => entry.status))).toEqual(new Set(['pass']))
  })

  it('hands a short pool to the crawler path with the budget it spent', async () => {
    stubBff([])
    const ctx = await mount()
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ data: { items: [] }, meta: { traceId: 't', schemaVersion: '1.0', source: 'blue' } })))
    const result = await run(ctx, CREATOR_SCOUT_TOOL, { category: 'beauty', platforms: ['TIKTOK'], market: 'US', targetCount: 2 })
    const value = result.value as {
      shortlist: unknown[]
      escalation?: { needed: number; queries: string[]; instruction: string }
      stats: { budget: { search: { used: number; limit: number } }; stopReason: string }
    }
    expect(value.shortlist).toHaveLength(0)
    expect(value.escalation?.needed).toBe(2)
    expect(value.escalation?.queries).toContain('beauty')
    expect(value.escalation?.instruction).toContain('creator_ingest')
    expect(value.stats.budget.search.limit).toBeGreaterThan(0)
    expect(['search_complete', 'pool_met']).toContain(value.stats.stopReason)
  })

  it('scores crawled creators through creator_ingest and honors remembered rejections', async () => {
    const ctx = await mount()
    await run(ctx, CREATOR_FEEDBACK_TOOL, {
      entries: [{ platform: 'TIKTOK', creatorId: 'crawled.bad', decision: 'reject' }],
    })
    const result = await run(ctx, CREATOR_INGEST_TOOL, {
      category: 'beauty', platforms: ['TIKTOK'], market: 'US', targetCount: 5,
      entries: [
        { platform: 'TIKTOK', creatorId: 'crawled.good', followers: 30_000, country: 'US', engagementRate: 0.03, hasEmail: true, url: 'https://example.test/good' },
        { platform: 'TIKTOK', creatorId: 'crawled.bad', followers: 30_000, country: 'US' },
        { platform: 'TIKTOK', creatorId: 'crawled.big', followers: 900_000, country: 'US' },
      ],
    })
    const value = result.value as { shortlist: { creatorId: string }[]; excluded: { key: string; reason: string }[] }
    expect(value.shortlist.map(entry => entry.creatorId)).toEqual(['crawled.good'])
    expect(value.excluded.some(entry => entry.reason.includes('remembered rejection'))).toBe(true)
    expect(value.excluded.some(entry => entry.reason.includes('outside'))).toBe(true)
  })

  it('does not run ingest without the brief essentials', async () => {
    const ctx = await mount()
    const result = await run(ctx, CREATOR_INGEST_TOOL, { entries: [{ platform: 'TIKTOK', creatorId: 'a' }] })
    expect(result.value).toMatchObject({ status: 'needs_brief', missing: ['category', 'platforms', 'market'] })
  })

  it('honors a remembered rejection in the next run', async () => {
    const seen: string[] = []
    stubBff(seen)
    const ctx = await mount()
    await run(ctx, CREATOR_FEEDBACK_TOOL, {
      entries: [{ platform: 'TIKTOK', creatorId: 'beauty.one', decision: 'reject', reasons: ['brand-safety'], client: 'acme' }],
    })

    const result = await run(ctx, CREATOR_SCOUT_TOOL, {
      category: 'beauty', platforms: ['TIKTOK'], market: 'US', targetCount: 2, client: 'acme',
    })
    const value = result.value as { shortlist: { creatorId: string }[]; excluded: { key: string; reason: string }[] }
    expect(value.shortlist.map(entry => entry.creatorId)).not.toContain('beauty.one')
    expect(value.excluded.some(entry => entry.key === creatorKey('TIKTOK', 'beauty.one') && entry.reason.includes('brand-safety'))).toBe(true)
  })

  it('keeps another client\'s decisions out of the run', async () => {
    stubBff([])
    const ctx = await mount()
    await run(ctx, CREATOR_FEEDBACK_TOOL, {
      entries: [{ platform: 'TIKTOK', creatorId: 'beauty.one', decision: 'reject', client: 'acme' }],
    })
    const result = await run(ctx, CREATOR_FEEDBACK_TOOL, { client: 'other' })
    expect(result.value).toMatchObject({ total: 0 })
  })
})
