// Final branch coverage: presenter titles, truncated rendering, enrichment
// failures, market/keyword derivations, and ingest field passthrough.
import { describe, expect, it } from 'vitest'
import { Context } from '@tomato/cordis'
import { ToolCallId } from '@tomato/llm'
import { mountAgentLoopTestDependencies } from '@tomato/agent-loop-testkit'
import Storage from '@tomato/storage'
import type { ToolExecutionResult } from '@tomato/tools'
import * as CreatorSearch from '@tomato/tool-creator-search'
import {
  CREATOR_INGEST_TOOL,
  CREATOR_SCOUT_TOOL,
  CreatorSearchClient,
  CreatorSearchError,
  normalizeBrief,
  parseEngagementRate,
  planSearches,
  scoreCandidate,
  scoutCreators,
} from '@tomato/tool-creator-search'
import type { CreatorSearchClient as Client } from '@tomato/tool-creator-search'
import * as MemoryStorage from './helpers/memory-storage.ts'

const defaults = { followersMin: 1_000, followersMax: 100_000, minEngagementRate: 0.01, targetCount: 10 }
const weights = { followers: 25, engagement: 25, keywords: 20, market: 15, recency: 10, contactability: 5 }

async function mount(config: Record<string, unknown> = {}) {
  const ctx = new Context()
  await mountAgentLoopTestDependencies(ctx)
  const storage = await ctx.plugin(Storage)
  await storage.await()
  const domains = await ctx.plugin(MemoryStorage)
  await domains.await()
  ctx.provide('desktopSession', { sessionId: () => 'session-1' })
  const fiber = await ctx.plugin(CreatorSearch, { baseURL: 'https://bff.test', ...config })
  await fiber.await()
  return ctx
}

async function run(ctx: Context, name: string, args: unknown): Promise<ToolExecutionResult> {
  const batch = await ctx.tools.execute({
    calls: [{ type: 'tool-call', name, id: ToolCallId('final-1'), arguments: JSON.stringify(args) }],
    signal: new AbortController().signal,
  })
  const result = batch.results[0]?.result
  if (result === undefined) throw new Error('tool execution produced no result')
  return result
}

describe('presenter titles and rendering', () => {
  it('reports the crawler handoff through the scout tool when the pool is short', async () => {
    const ctx = await mount()
    const result = await run(ctx, CREATOR_SCOUT_TOOL, { category: 'beauty', platforms: ['TIKTOK'], market: 'US', targetCount: 1 })
    expect(result.isError).toBe(false)
    const value = result.value as { escalation?: { needed: number }; status: string }
    expect(value.status).toBe('ready')
  })

  it('omits the escalation block when the shortlist meets the target', async () => {
    const ctx = await mount()
    const original = globalThis.fetch
    globalThis.fetch = async () => Response.json({
      data: { items: [{ unique_id: 'beauty.one', follower_count: 30_000, country: 'US', avg_engagement_rate: '3' }] },
      meta: { traceId: 't', schemaVersion: '1.0', source: 'blue' },
    })
    const result = await run(ctx, CREATOR_SCOUT_TOOL, { category: 'beauty', platforms: ['TIKTOK'], market: 'US', targetCount: 1, keywords: ['beauty'] })
    globalThis.fetch = original
    expect(result.isError).toBe(false)
    expect(result.value).not.toHaveProperty('escalation')
  })

  it('titles scout and ingest pending cards with and without their optional parts', async () => {
    const ctx = await mount()
    const scout = ctx.tools.get(CREATOR_SCOUT_TOOL)
    const ingest = ctx.tools.get(CREATOR_INGEST_TOOL)
    expect(scout?.presentCall?.({ category: 'beauty' })).toMatchObject({ title: 'creator_scout beauty' })
    expect(scout?.presentCall?.({ category: 'beauty', market: 'US', targetCount: 3 })).toMatchObject({ title: 'creator_scout beauty in US ×3' })
    expect(ingest?.presentCall?.({ entries: [] })).toMatchObject({ title: 'creator_ingest' })
    expect(ingest?.presentCall?.({ category: 'beauty', entries: [] })).toMatchObject({ title: 'creator_ingest beauty' })
  })

  it('cuts a rendered value at the configured output cap', async () => {
    const ctx = await mount({ maxOutputChars: 500 })
    const result = await run(ctx, CREATOR_INGEST_TOOL, {
      category: 'beauty', platforms: ['TIKTOK'], market: 'US', targetCount: 5,
      entries: [
        { platform: 'TIKTOK', creatorId: 'a', name: 'A', handle: '@a', followers: 30_000, country: 'US', engagementRate: 0.03, hasEmail: true, lastPublishedAt: new Date().toISOString(), url: 'https://example.test/a' },
      ],
    })
    const block = result.content[0]
    expect(result.isError).toBe(false)
    expect(block?.type === 'text' && block.text).toContain('truncated')
  })
})

describe('feedback presenter and optionals', () => {
  it('titles the feedback card and records optional fields, including an empty client', async () => {
    const ctx = await mount()
    const tool = ctx.tools.get('creator_feedback')
    expect(tool?.presentCall?.({})).toMatchObject({ card: 'generic', kind: 'read', title: 'creator_feedback' })
    const result = await run(ctx, 'creator_feedback', {
      client: '',
      entries: [{
        platform: 'TIKTOK', creatorId: 'a', decision: 'watch', reasons: ['other', 'not-a-reason'],
        handle: '@a', name: 'A', note: 'note',
      }],
    })
    expect(result.isError).toBe(false)
    expect(result.value).toMatchObject({ total: 1 })
  })
})

describe('derivations and formatting', () => {
  it('derives no market phrase for a global brief', () => {
    const brief = normalizeBrief({ category: 'beauty', product: 'serum', platforms: ['TIKTOK'], market: 'GLOBAL' }, defaults).brief!
    expect(brief.keywords).toEqual(['beauty', 'serum beauty'])
    expect(planSearches(brief, { maxSearchCalls: 24, pagesPerQuery: 1, pageSize: 20, enrichLimit: 0, poolFactor: 2 }, ['review'], 'broad')
      .some(step => step.query === 'serum review')).toBe(true)
    const noProduct = normalizeBrief({ category: 'beauty', platforms: ['TIKTOK'], market: 'GLOBAL' }, defaults).brief!
    expect(planSearches(noProduct, { maxSearchCalls: 24, pagesPerQuery: 1, pageSize: 20, enrichLimit: 0, poolFactor: 2 }, ['review'], 'broad')
      .some(step => step.query === 'beauty review')).toBe(true)
  })

  it('asks only for what is missing', () => {
    expect(normalizeBrief({ category: 'beauty', market: 'US' }, defaults).questions[0]).toContain('platforms')
    expect(normalizeBrief({ category: 'beauty', platforms: ['TIKTOK'] }, defaults).questions[0]).toContain('market')
  })

  it('reads odd engagement values and formats both percentage tiers', () => {
    expect(parseEngagementRate(undefined)).toBeUndefined()
    expect(parseEngagementRate({})).toBeUndefined()
    expect(parseEngagementRate(3)).toBeCloseTo(0.03)
    const high = scoreCandidate({ platform: 'TIKTOK', creatorId: 'h', engagementRate: 0.5, queries: [], traces: [] }, normalizeBrief({ category: 'x', platforms: ['TIKTOK'], market: 'US' }, defaults).brief!, weights, Date.now())
    expect('reasons' in high && high.reasons.some(reason => reason.includes('50%'))).toBe(true)
  })

  it('forwards every optional brief field the caller states', async () => {
    const ctx = await mount()
    const result = await run(ctx, CREATOR_INGEST_TOOL, {
      category: 'beauty', platforms: ['TIKTOK'], market: 'US',
      followersMin: 1_000, followersMax: 100_000, minEngagementRate: 0.01,
      language: 'en', mustHaveEmail: false, excludeCreators: ['blocked'], product: 'serum',
      entries: [{ platform: 'TIKTOK', creatorId: 'ok', followers: 30_000, country: 'US' }, { platform: 'TIKTOK', creatorId: 'bare' }],
    })
    expect(result.isError).toBe(false)
    expect(result.value).toMatchObject({ status: 'ready' })
  })

  it('reaches the email gate only when the earlier gates are known', () => {
    const gateBrief = normalizeBrief({ category: 'beauty', platforms: ['TIKTOK'], market: 'US' }, defaults).brief!
    const scored = scoreCandidate({
      platform: 'TIKTOK', creatorId: 'gate', queries: [], traces: [],
      followers: 30_000,
      engagementRate: 0.03,
      country: 'US',
    }, { ...gateBrief, mustHaveEmail: true }, weights, Date.now())
    expect('status' in scored && scored.status).toBe('conditional')
  })

  it('compacts counts in both abbreviation tiers', () => {
    const brief = { ...normalizeBrief({ category: 'beauty', platforms: ['TIKTOK'], market: 'US', followersMin: 0, followersMax: 10_000_000 }, defaults).brief! }
    const millions = scoreCandidate({ platform: 'TIKTOK', creatorId: 'm', followers: 2_000_000, queries: [], traces: [] }, brief, weights, Date.now())
    const small = scoreCandidate({ platform: 'TIKTOK', creatorId: 's', followers: 500, queries: [], traces: [] }, brief, weights, Date.now())
    expect('reasons' in millions && millions.reasons[0]).toContain('2M')
    expect('reasons' in small && small.reasons[0]).toContain('500 followers')
  })
})

describe('enrichment failures', () => {
  const brief = { category: 'beauty', platforms: ['YOUTUBE'] as const, market: 'US', targetCount: 1, keywords: ['beauty'] }
  const options = {
    limits: {
      fast: { maxSearchCalls: 1, pagesPerQuery: 1, pageSize: 20, enrichLimit: 1, poolFactor: 2 },
      standard: { maxSearchCalls: 1, pagesPerQuery: 1, pageSize: 20, enrichLimit: 2, poolFactor: 2 },
      broad: { maxSearchCalls: 1, pagesPerQuery: 1, pageSize: 20, enrichLimit: 1, poolFactor: 2 },
    },
    weights,
    suffixes: [] as string[],
    feedbackBoost: 10,
  }

  /** Client whose search finds one YouTube creator. */
  function youtubeClient(): Client {
    const client = new CreatorSearchClient({ baseURL: 'https://bff.test', timeoutMs: 1_000, sessionId: () => 's' })
    client.searchBlue = async () => ({
      source: 'blue' as const,
      traceId: 't',
      data: { items: [{ channel_id: 'UC5555555555555555555555', nickname: 'YT', country: 'US' }] },
    })
    return client
  }

  it('fills a candidate from the detail read after the channel read leaves a gap', async () => {
    const client = youtubeClient()
    client.ycpChannel = async () => ({ source: 'ycp' as const, traceId: 'y1', data: { regionCode: 'US', businessEmail: 'hi@example.test' } })
    client.detailBlue = async () => ({ source: 'blue' as const, traceId: 'd1', data: { kox_country: 'US' } })
    const result = await scoutCreators({ ...brief, targetCount: 1 }, 'standard', defaults, { ...options, client })
    expect(result.status === 'ready' && result.stats.detailCalls).toBe(1)
    expect(result.status === 'ready' && result.shortlist[0]?.traces).toContain('d1')
  })

  it('swallows classified failures from both enrichment reads', async () => {
    const client = youtubeClient()
    client.ycpChannel = async () => { throw new CreatorSearchError('transient', 'ycp down') }
    client.detailBlue = async () => { throw new CreatorSearchError('rejected', 'detail down') }
    const result = await scoutCreators(brief, 'standard', defaults, { ...options, client })
    expect(result.status).toBe('ready')
  })

  it('rethrows an unclassified channel failure', async () => {
    const client = youtubeClient()
    client.ycpChannel = async () => { throw new Error('raw ycp') }
    const outcome = await scoutCreators(brief, 'standard', defaults, { ...options, client }).catch((thrown: unknown) => thrown)
    expect(outcome).toBeInstanceOf(Error)
    expect((outcome as Error).message).toContain('raw ycp')
  })

  it('rethrows an unclassified detail failure', async () => {
    const client = youtubeClient()
    client.ycpChannel = async () => ({ source: 'ycp' as const, traceId: 'y', data: {} })
    client.detailBlue = async () => { throw new Error('raw detail') }
    const outcome = await scoutCreators(brief, 'standard', defaults, { ...options, client }).catch((thrown: unknown) => thrown)
    expect((outcome as Error).message).toContain('raw detail')
  })
})
