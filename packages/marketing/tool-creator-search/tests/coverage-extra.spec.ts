// Coverage for the storage-backed feedback store, brief validation edges, and
// candidate enrichment paths that the tool-level suites do not reach.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@tomato/cordis'
import Storage from '@tomato/storage'
import {
  candidatesFromSearch,
  creatorFeedbackDomainSpec,
  creatorKey,
  CreatorFeedbackStore,
  enrichFromChannel,
  enrichFromDetail,
  feedbackStorageKey,
  normalizeBrief,
  planSearches,
  scoreCandidate,
  scoutCreators,
} from '@tomato/tool-creator-search'
import type { Candidate, CreatorSearchClient } from '@tomato/tool-creator-search'
import { CreatorSearchClient as Client, CreatorSearchError } from '@tomato/tool-creator-search'
import * as CreatorSearch from '@tomato/tool-creator-search'
import * as MemoryStorage from './helpers/memory-storage.ts'

const defaults = { followersMin: 1_000, followersMax: 100_000, minEngagementRate: 0.01, targetCount: 10 }
const baseCandidate: Candidate = { platform: 'TIKTOK', creatorId: 'a', queries: ['beauty'], traces: ['t'] }

afterEach(() => { vi.unstubAllGlobals() })

/**
 * Open the real feedback domain over the in-memory backend.
 * @returns the context and a store over the domain table.
 */
async function feedbackStore(): Promise<{ ctx: Context; store: CreatorFeedbackStore }> {
  const ctx = new Context()
  const storage = await ctx.plugin(Storage)
  await storage.await()
  const domains = await ctx.plugin(MemoryStorage)
  await domains.await()
  const domain = await ctx.storageDomain.open(creatorFeedbackDomainSpec)
  ctx.effect(() => () => domain.close(), 'test.feedbackDomain')
  return { ctx, store: new CreatorFeedbackStore(domain.table('feedback')) }
}

describe('feedback store', () => {
  it('writes every optional field and lists newest first for one client', async () => {
    const { ctx, store } = await feedbackStore()
    await store.record({ platform: 'TIKTOK', creatorId: 'a', decision: 'reject', reasons: ['brand-safety'], note: 'risky', client: 'acme', handle: '@a', name: 'A' }, 1_000)
    await store.record({ platform: 'TIKTOK', creatorId: 'b', decision: 'accept', client: 'acme' }, 2_000)

    const listed = store.list('acme')
    expect(listed.map(record => record.creatorId)).toEqual(['b', 'a'])
    expect(listed[1]).toMatchObject({ handle: '@a', name: 'A', note: 'risky', reasons: ['brand-safety'] })
    expect(store.list(undefined)).toHaveLength(0)
    await ctx.fiber.dispose()
  })

  it('prefers a client-specific record over a host-wide one, in either insertion order', async () => {
    const { ctx, store } = await feedbackStore()
    await store.record({ platform: 'TIKTOK', creatorId: 'a', decision: 'accept' }, 1_000)
    await store.record({ platform: 'TIKTOK', creatorId: 'a', decision: 'reject', client: 'acme' }, 2_000)
    expect(store.byCreator('acme').get(creatorKey('TIKTOK', 'a'))?.decision).toBe('reject')
    expect(store.byCreator(undefined).get(creatorKey('TIKTOK', 'a'))?.decision).toBe('accept')

    const reversed = await feedbackStore()
    await reversed.store.record({ platform: 'TIKTOK', creatorId: 'a', decision: 'reject', client: 'acme' }, 3_000)
    await reversed.store.record({ platform: 'TIKTOK', creatorId: 'a', decision: 'accept' }, 1_000)
    expect(reversed.store.byCreator('acme').get(creatorKey('TIKTOK', 'a'))?.decision).toBe('reject')
    await ctx.fiber.dispose()
    await reversed.ctx.fiber.dispose()
  })

  it('replaces the decision for the same creator and hashes keys by client', async () => {
    const { ctx, store } = await feedbackStore()
    expect(feedbackStorageKey(undefined, 'TIKTOK', 'a')).not.toBe(feedbackStorageKey('acme', 'TIKTOK', 'a'))
    await store.record({ platform: 'TIKTOK', creatorId: 'a', decision: 'watch' }, 1_000)
    await store.record({ platform: 'TIKTOK', creatorId: 'a', decision: 'reject' }, 2_000)
    expect(store.list(undefined)).toHaveLength(1)
    expect(store.list(undefined)[0]?.decision).toBe('reject')
    await ctx.fiber.dispose()
  })
})

describe('brief and plan edges', () => {
  it('reports every missing essential instead of guessing', () => {
    const decision = normalizeBrief({}, defaults)
    expect(decision.missing).toEqual(['category', 'platforms', 'market'])
    expect(decision.questions).toHaveLength(3)
  })

  it('rejects a target count the BFF cannot serve', () => {
    expect(() => normalizeBrief({ category: 'beauty', platforms: ['TIKTOK'], market: 'US', targetCount: 0 }, defaults)).toThrow('targetCount')
    expect(() => normalizeBrief({ category: 'beauty', platforms: ['TIKTOK'], market: 'US', targetCount: 51 }, defaults)).toThrow('targetCount')
  })

  it('plans nothing when a hand-built brief carries no keyword', () => {
    const brief = normalizeBrief({ category: 'beauty', platforms: ['TIKTOK'], market: 'US' }, defaults).brief!
    expect(planSearches({ ...brief, keywords: [] }, { maxSearchCalls: 4, pagesPerQuery: 1, pageSize: 20, enrichLimit: 0, poolFactor: 2 }, [], 'balanced')).toEqual([])
  })
})

describe('candidate extraction and enrichment', () => {
  it('drops payloads and entries that cannot describe a creator', () => {
    expect(candidatesFromSearch('TIKTOK', 'nope', 'q', 't')).toEqual([])
    expect(candidatesFromSearch('TIKTOK', { items: [1, { unique_id: 'a' }, { channel_id: 'UC1' }] }, 'q', 't')).toHaveLength(2)
  })

  it('falls back to the other identifier per platform', () => {
    const youtube = candidatesFromSearch('YOUTUBE', { items: [{ unique_id: 'handle' }] }, 'q', 't')
    expect(youtube[0]?.creatorId).toBe('handle')
    const tiktok = candidatesFromSearch('TIKTOK', { items: [{ channel_id: 'UC1' }] }, 'q', 't')
    expect(tiktok[0]?.creatorId).toBe('UC1')
    expect(candidatesFromSearch('TIKTOK', { items: [{}] }, 'q', 't')).toEqual([])
  })

  it('fills detail fields from the matching platform channel', () => {
    const enriched = enrichFromDetail(baseCandidate, {
      kox_name: 'Beauty One',
      kox_country: 'us',
      kox_email: 'hi@example.test',
      kox_channel_list: [{ platform: 'youtube', channel_name: 'YT' }, { platform: 'tiktok', channel_name: 'TT', fans_count: '4200', avg_engagement: '3.1', avg_view: 900 }],
    }, 'trace-detail')
    expect(enriched).toMatchObject({ name: 'Beauty One', country: 'US', followers: 4_200, engagementRate: 0.031, averageViews: 900, hasEmail: true })
    expect(enriched.traces).toEqual(['t', 'trace-detail'])
    expect(enrichFromDetail(baseCandidate, 'nope', 't')).toEqual(baseCandidate)
    expect(enrichFromDetail(baseCandidate, { kox_name: 'X' }, 't')).toMatchObject({ name: 'X' })
  })

  it('fills channel fields from YCP public data', () => {
    const enriched = enrichFromChannel(baseCandidate, { regionCode: 'us', subscriberCount: 9_000, businessEmail: 'hi@example.test' }, 'trace-ycp')
    expect(enriched).toMatchObject({ country: 'US', followers: 9_000, hasEmail: true })
    expect(enrichFromChannel(baseCandidate, 'nope', 't')).toEqual(baseCandidate)
    expect(enrichFromChannel(baseCandidate, { businessEmail: '  ' }, 't')).toMatchObject({ hasEmail: false })
  })
})

describe('scoring gates and evidence edges', () => {
  const brief = normalizeBrief(
    { category: 'beauty', platforms: ['TIKTOK'], market: 'US', targetCount: 3 },
    defaults,
  ).brief!
  const weights = { followers: 25, engagement: 25, keywords: 20, market: 15, recency: 10, contactability: 5 }

  it('rejects an excluded creator by id or handle', () => {
    const excluded = { ...brief, excludeCreators: ['excluded.id'] }
    expect(scoreCandidate({ ...baseCandidate, creatorId: 'excluded.id' }, excluded, weights, Date.now()))
      .toMatchObject({ gate: 'exclusion' })
    const byHandle = { ...brief, excludeCreators: ['@blocked'] }
    expect(scoreCandidate({ ...baseCandidate, handle: 'blocked' }, byHandle, weights, Date.now())).toMatchObject({ gate: 'exclusion' })
  })

  it('rejects engagement below the floor and a missing required email', () => {
    expect(scoreCandidate({ ...baseCandidate, engagementRate: 0.001 }, brief, weights, Date.now())).toMatchObject({ gate: 'engagement' })
    const emailRequired = { ...brief, mustHaveEmail: true }
    expect(scoreCandidate({ ...baseCandidate, hasEmail: false }, emailRequired, weights, Date.now())).toMatchObject({ gate: 'contactability' })
  })

  it('scores without keyword, recency, or market evidence', () => {
    const bare = scoreCandidate({ platform: 'TIKTOK', creatorId: 'bare', queries: ['beauty'], traces: ['t'] }, { ...brief, market: 'GLOBAL' }, weights, Date.now())
    expect('score' in bare && bare.coverage).toBe(0)
    const stale = scoreCandidate({
      ...baseCandidate,
      lastPublishedAt: new Date(Date.now() - 200 * 86_400_000).toISOString(),
    }, brief, weights, Date.now())
    expect('reasons' in stale && stale.reasons.some(reason => reason.includes('last post 200 days ago'))).toBe(true)
    const invalidDate = scoreCandidate({ ...baseCandidate, lastPublishedAt: 'not-a-date' }, brief, weights, Date.now())
    expect('score' in invalidDate).toBe(true)
  })

  it('scores a fresh creator, an unknown email, and a global market', () => {
    const fresh = scoreCandidate({ ...baseCandidate, lastPublishedAt: new Date().toISOString() }, brief, weights, Date.now())
    expect('reasons' in fresh && fresh.reasons.some(reason => reason.includes('days ago'))).toBe(true)
    const unknownEmail = scoreCandidate(baseCandidate, brief, weights, Date.now())
    expect('score' in unknownEmail && unknownEmail.status).toBe('conditional')
    const global = scoreCandidate({ ...baseCandidate, country: 'GB' }, { ...brief, market: 'GLOBAL' }, weights, Date.now())
    expect('score' in global).toBe(true)
  })

  it('walks the recency tiers and the contactability message', () => {
    const twoMonths = scoreCandidate({
      ...baseCandidate,
      hasEmail: false,
      lastPublishedAt: new Date(Date.now() - 60 * 86_400_000).toISOString(),
    }, brief, weights, Date.now())
    expect('reasons' in twoMonths && twoMonths.reasons.some(reason => reason.includes('60 days ago'))).toBe(true)
    expect('reasons' in twoMonths && twoMonths.reasons.some(reason => reason.includes('no business email'))).toBe(true)
    const emailOk = scoreCandidate({ ...baseCandidate, hasEmail: true }, { ...brief, mustHaveEmail: true }, weights, Date.now())
    expect('score' in emailOk).toBe(true)
  })

  it('reports low coverage as unverified even when every gate has a value', () => {
    const skewed = { followers: 5, engagement: 5, keywords: 40, market: 5, recency: 40, contactability: 5 }
    const scored = scoreCandidate({
      ...baseCandidate,
      followers: 30_000,
      engagementRate: 0.03,
      country: 'US',
      hasEmail: true,
    }, brief, skewed, Date.now())
    expect('status' in scored && scored.status).toBe('unverified')
  })

  it('treats an all-zero weight set as no evidence', () => {
    const zero = { followers: 0, engagement: 0, keywords: 0, market: 0, recency: 0, contactability: 0 }
    const scored = scoreCandidate(baseCandidate, brief, zero, Date.now())
    expect('coverage' in scored && scored.coverage).toBe(0)
  })

  it('treats an unknown email as an unverified gate when the brief requires one', () => {
    const scored = scoreCandidate(baseCandidate, { ...brief, mustHaveEmail: true }, weights, Date.now())
    expect('status' in scored && scored.status).toBe('conditional')
  })

  it('treats an equal follower band as a single point', () => {
    const equalBand = { ...brief, followers: { min: 10_000, max: 10_000 } }
    const scored = scoreCandidate({ ...baseCandidate, followers: 10_000 }, equalBand, weights, Date.now())
    expect('score' in scored && scored.reasons.some(reason => reason.includes('followers'))).toBe(true)
  })
})

describe('enrichment fallbacks', () => {
  it('skips non-object channel entries and reads the channel fields', () => {
    const enriched = enrichFromDetail(baseCandidate, {
      kox_channel_list: ['junk', { platform: 'TIKTOK', channel_name: 'From channel', channel_title: 'us' }],
    }, 't2')
    expect(enriched).toMatchObject({ name: 'From channel', country: 'US' })
  })

  it('keeps a channel match without a name or country', () => {
    const enriched = enrichFromDetail(baseCandidate, { kox_channel_list: [{ platform: 'TIKTOK' }] }, 't4')
    expect(enriched).toMatchObject({ platform: 'TIKTOK', creatorId: 'a', traces: ['t', 't4'] })
    expect(enriched.name).toBeUndefined()
  })

  it('takes the name from a matched channel when the top-level field is absent', () => {
    const enriched = enrichFromDetail(baseCandidate, { kox_channel_list: [{ platform: 'TIKTOK', channel_name: 'Channel name' }] }, 't5')
    expect(enriched.name).toBe('Channel name')
  })

  it('prefers a top-level name over a channel name', () => {
    const enriched = enrichFromDetail(baseCandidate, { kox_name: 'Top', kox_channel_list: [{ platform: 'TIKTOK', channel_name: 'Channel' }] }, 't6')
    expect(enriched.name).toBe('Top')
  })

  it('leaves email unknown when the channel payload cannot state it', () => {
    const enriched = enrichFromChannel(baseCandidate, { businessEmail: null }, 't3')
    expect(enriched).toEqual({ ...baseCandidate, traces: ['t', 't3'] })
  })
})

describe('scout failure paths', () => {
  const brief = { category: 'beauty', platforms: ['TIKTOK'] as const, market: 'US', targetCount: 2, keywords: ['beauty'] }
  const options = {
    limits: {
      fast: { maxSearchCalls: 1, pagesPerQuery: 1, pageSize: 20, enrichLimit: 0, poolFactor: 2 },
      standard: { maxSearchCalls: 3, pagesPerQuery: 1, pageSize: 20, enrichLimit: 0, poolFactor: 2 },
      broad: { maxSearchCalls: 3, pagesPerQuery: 1, pageSize: 20, enrichLimit: 0, poolFactor: 2 },
    },
    weights: { followers: 25, engagement: 25, keywords: 20, market: 15, recency: 10, contactability: 5 },
    suffixes: [] as string[],
    feedbackBoost: 10,
  }

  /**
   * Client whose search answers with a scripted sequence.
   * @param outcomes - one action per search call.
   * @returns the client double.
   */
  function scripted(outcomes: readonly ('fail' | 'empty' | 'one')[]): CreatorSearchClient {
    let index = 0
    const client = new Client({ baseURL: 'https://bff.test', timeoutMs: 1_000, sessionId: () => 's' })
    client.searchBlue = async () => {
      const outcome = outcomes[Math.min(index, outcomes.length - 1)]
      index += 1
      if (outcome === 'fail') throw new CreatorSearchError('transient', 'upstream flaked')
      if (outcome === 'empty') return { source: 'blue', traceId: 'e', data: { items: [] } }
      return {
        source: 'blue',
        traceId: 't',
        data: { items: [{ unique_id: 'beauty.one', follower_count: 30_000, country: 'US', avg_engagement_rate: '3' }] },
      }
    }
    return client
  }

  it('records a failed strategy and still returns what the other strategies found', async () => {
    const result = await scoutCreators(brief, 'standard', defaults, { ...options, client: scripted(['fail', 'one']) })
    expect(result.status).toBe('ready')
    expect(result.status === 'ready' && result.caveats.some(caveat => caveat.includes('one search strategy failed'))).toBe(true)
    expect(result.status === 'ready' && result.shortlist.length).toBe(1)
  })

  it('stops searching when quota is exhausted', async () => {
    const client = scripted(['fail'])
    client.searchBlue = async () => { throw new CreatorSearchError('quota', 'quota spent') }
    const result = await scoutCreators(brief, 'standard', defaults, { ...options, client })
    expect(result.status === 'ready' && result.caveats.some(caveat => caveat.includes('search stopped early'))).toBe(true)
  })

  it('excludes a creator the brief names and stops at the call budget', async () => {
    let calls = 0
    const client = new Client({ baseURL: 'https://bff.test', timeoutMs: 1_000, sessionId: () => 's' })
    client.searchBlue = async () => {
      calls += 1
      return {
        source: 'blue' as const,
        traceId: `t${String(calls)}`,
        data: { items: [{ unique_id: 'beauty.one', follower_count: 30_000, country: 'US', avg_engagement_rate: '3' }] },
      }
    }
    const result = await scoutCreators(
      { ...brief, platforms: ['TIKTOK', 'INSTAGRAM'], excludeCreators: ['beauty.one'] },
      'standard',
      defaults,
      { ...options, client, limits: { ...options.limits, standard: { ...options.limits.standard, maxSearchCalls: 1 } } },
    )
    expect(result.status === 'ready' && result.excluded.some(entry => entry.reason.includes('excluded by the brief'))).toBe(true)
    expect(calls).toBe(1)
  })

  it('enriches a YouTube candidate through the free channel read first', async () => {
    const client = new Client({ baseURL: 'https://bff.test', timeoutMs: 1_000, sessionId: () => 's' })
    let detailCalls = 0
    client.searchBlue = async () => ({
      source: 'blue' as const,
      traceId: 't',
      data: { items: [{ channel_id: 'UC3333333333333333333333', nickname: 'YT', country: 'US', follower_count: 30_000, avg_engagement_rate: '3' }] },
    })
    client.ycpChannel = async () => ({ source: 'ycp' as const, traceId: 'y1', data: { regionCode: 'US', businessEmail: 'hi@example.test' } })
    client.detailBlue = async () => { detailCalls += 1; return { source: 'blue' as const, traceId: 'd', data: {} } }

    const result = await scoutCreators({ ...brief, platforms: ['YOUTUBE'] }, 'standard', defaults, {
      ...options,
      client,
      limits: { ...options.limits, standard: { ...options.limits.standard, enrichLimit: 2 } },
    })
    expect(result.status === 'ready' && result.stats.channelCalls).toBe(1)
    expect(detailCalls).toBe(0)
    expect(result.status === 'ready' && result.shortlist[0]?.traces).toContain('y1')
  })

  it('rethrows an error the client did not classify', async () => {
    const client = new Client({ baseURL: 'https://bff.test', timeoutMs: 1_000, sessionId: () => 's' })
    client.searchBlue = async () => { throw new Error('boom') }
    await expect(scoutCreators(brief, 'standard', defaults, { ...options, client })).rejects.toThrow('boom')
  })

  it('reports a rejection without a recorded reason', async () => {
    const store = (await feedbackStore()).store
    await store.record({ platform: 'TIKTOK', creatorId: 'beauty.one', decision: 'reject', client: 'acme' })
    const result = await scoutCreators(
      { ...brief, client: 'acme' },
      'standard',
      defaults,
      { ...options, client: scripted(['one']), feedback: store },
    )
    expect(result.status === 'ready' && result.excluded.some(entry => entry.reason.includes('no reason recorded'))).toBe(true)
  })

  it('boosts a remembered acceptance', async () => {
    const store = (await feedbackStore()).store
    await store.record({ platform: 'TIKTOK', creatorId: 'beauty.one', decision: 'accept', reasons: ['content-quality'], client: 'acme' })
    const result = await scoutCreators(
      { ...brief, client: 'acme' },
      'standard',
      defaults,
      { ...options, client: scripted(['one']), feedback: store },
    )
    expect(result.status === 'ready' && result.shortlist[0]?.reasons.some(reason => reason.includes('remembered acceptance'))).toBe(true)
  })

  it('stops once the pool factor is met and sorts several candidates', async () => {
    const client = new Client({ baseURL: 'https://bff.test', timeoutMs: 1_000, sessionId: () => 's' })
    let calls = 0
    client.searchBlue = async () => {
      calls += 1
      return {
        source: 'blue' as const,
        traceId: 't',
        data: {
          items: [
            { unique_id: 'beauty.one', follower_count: 30_000, country: 'US', avg_engagement_rate: '3', has_email: true },
            { unique_id: 'beauty.two', follower_count: 20_000, country: 'US', avg_engagement_rate: '1.5', has_email: false },
          ],
        },
      }
    }
    const result = await scoutCreators({ ...brief, targetCount: 1 }, 'standard', defaults, {
      ...options,
      client,
      limits: { ...options.limits, standard: { ...options.limits.standard, maxSearchCalls: 4, poolFactor: 1 } },
    })
    expect(result.status === 'ready' && result.shortlist).toHaveLength(1)
    expect(calls).toBe(1)
    expect(result.status === 'ready' && result.stats.scored).toBe(2)
  })

  it('excludes by creator id when the handle differs', async () => {
    const client = new Client({ baseURL: 'https://bff.test', timeoutMs: 1_000, sessionId: () => 's' })
    client.searchBlue = async () => ({
      source: 'blue' as const,
      traceId: 't',
      data: { items: [{ channel_id: 'UC2222222222222222222222', nickname: 'No overlap', country: 'US', follower_count: 30_000 }] },
    })
    const result = await scoutCreators({ ...brief, excludeCreators: ['UC2222222222222222222222'] }, 'standard', defaults, { ...options, client })
    expect(result.status === 'ready' && result.excluded.some(entry => entry.reason.includes('excluded by the brief'))).toBe(true)
  })

  it('stops early once the pool factor is met and reports a short pool', async () => {
    const thin = await scoutCreators(brief, 'standard', defaults, {
      ...options,
      client: scripted(['empty']),
      limits: { ...options.limits, standard: { ...options.limits.standard, poolFactor: 3 } },
    })
    expect(thin.status === 'ready' && thin.caveats.some(caveat => caveat.includes('distinct creators'))).toBe(true)

    const full = await scoutCreators(brief, 'fast', defaults, {
      ...options,
      client: scripted(['one']),
      limits: { ...options.limits, fast: { ...options.limits.fast, poolFactor: 1 } },
    })
    expect(full.status === 'ready' && full.stats.searchCalls).toBe(1)
  })
})

describe('configuration guards', () => {
  it('rejects a configuration with no positive score weight', async () => {
    const ctx = new Context()
    const storage = await ctx.plugin(Storage)
    await storage.await()
    const domains = await ctx.plugin(MemoryStorage)
    await domains.await()
    await expect(CreatorSearch.apply(ctx, {
      baseURL: 'https://bff.test',
      weightFollowers: 0, weightEngagement: 0, weightKeywords: 0,
      weightMarket: 0, weightRecency: 0, weightContactability: 0,
    })).rejects.toThrow('at least one score weight')
    await ctx.fiber.dispose()
  })
})
