// Contact discovery: query building, address filtering, crawl budgets, and the
// scout stage that fills a shortlist's missing emails.
import { describe, expect, it } from 'vitest'
import { Context } from '@tomato/cordis'
import { ToolCallId } from '@tomato/llm'
import type { JsonValue } from '@tomato/util-values'
import { mountAgentLoopTestDependencies } from '@tomato/agent-loop-testkit'
import Storage from '@tomato/storage'
import WebRuntime from '@tomato/web'
import * as CreatorSearch from '@tomato/tool-creator-search'
import * as MemoryStorage from './helpers/memory-storage.ts'
import {
  contactQueries,
  crawlContact,
  crawlerFromWeb,
  firstEmail,
  scoutCreators,
} from '@tomato/tool-creator-search'
import type { Candidate, ContactCrawler } from '@tomato/tool-creator-search'
import { CreatorSearchClient } from '@tomato/tool-creator-search'

const defaults = { followersMin: 1_000, followersMax: 100_000, minEngagementRate: 0.01, targetCount: 10 }
const weights = { followers: 25, engagement: 25, keywords: 20, market: 15, recency: 10, contactability: 5 }
const limits = { queriesPerCreator: 2, fetchesPerCreator: 2, timeoutMs: 5_000, now: () => 1_700_000_000_000 }
const base: Candidate = {
  platform: 'TIKTOK', creatorId: 'beauty.one', handle: '@beauty.one', name: 'Beauty One',
  queries: ['beauty'], traces: ['t'],
}

/** Crawler double whose search and fetch answers scripted results. */
function crawler(script: {
  sources?: string[]
  searchThrows?: boolean
  pages?: Record<string, { status?: number; text?: string; throws?: boolean }>
}): ContactCrawler & { searches: string[]; fetches: string[] } {
  const searches: string[] = []
  const fetches: string[] = []
  return {
    searches,
    fetches,
    async search(query) {
      searches.push(query)
      if (script.searchThrows === true) throw new Error('search down')
      return { sources: (script.sources ?? []).map(url => ({ url })) }
    },
    async fetch(url) {
      fetches.push(url)
      const page = script.pages?.[url]
      if (page === undefined) return { url, statusCode: 404 }
      if (page.throws === true) throw new Error('fetch down')
      return { url, statusCode: page.status ?? 200, ...page.text === undefined ? {} : { text: page.text } }
    },
  }
}

describe('contact discovery primitives', () => {
  it('builds one query per identifying phrase', () => {
    expect(contactQueries(base)).toHaveLength(3)
    expect(contactQueries({ platform: 'TIKTOK', creatorId: 'beauty.one', handle: '@beauty.one', queries: [], traces: [] })).toHaveLength(2)
  })

  it('queries only the name when no handle is usable', () => {
    expect(contactQueries({ ...base, handle: '', creatorId: '  ', name: 'Beauty One' }))
      .toEqual(['"Beauty One" business email contact'])
  })

  it('adapts the web seam and keeps a signal through both calls', async () => {
    const calls: string[] = []
    const web = {
      async search(request: { query: string }) {
        calls.push(`search:${request.query}`)
        return { sources: [{ url: 'https://profile.test/x' }], truncated: false }
      },
      async fetch(request: { url: string }) {
        calls.push(`fetch:${request.url}`)
        return { url: request.url, statusCode: 200, body: { kind: 'text' as const, content: 'hi@beauty.test' }, truncated: false }
      },
    }
    const crawler = crawlerFromWeb(web)
    const found = await crawler.search('"beauty.one" email', 5)
    expect(calls).toEqual(['search:"beauty.one" email'])
    expect(found.sources).toHaveLength(1)
    const page = await crawler.fetch('https://profile.test/x')
    expect(page).toMatchObject({ url: 'https://profile.test/x', statusCode: 200, text: 'hi@beauty.test' })
  })

  it('takes the first plausible address and skips noise', () => {
    expect(firstEmail('write to hi@creator.test today')).toBe('hi@creator.test')
    expect(firstEmail('logo@assets.test.png and noreply@creator.test')).toBeUndefined()
    expect(firstEmail('team@example.com hello@creator.test')).toBe('hello@creator.test')
    expect(firstEmail('nothing here')).toBeUndefined()
  })

  it('falls back to the wall clock when no clock is injected', async () => {
    const outcome = await crawlContact({ ...base, url: 'https://profile.test/clock' }, crawler({}), {
      queriesPerCreator: 1, fetchesPerCreator: 0, timeoutMs: 5_000,
    })
    expect(outcome).toEqual({ searches: 1, fetches: 0 })
  })

  it('reads the page and reports the source', async () => {
    const fake = crawler({ pages: { 'https://profile.test/beauty.one': { text: 'Business: hello@beauty.test' } } })
    const outcome = await crawlContact({ ...base, url: 'https://profile.test/beauty.one' }, fake, limits)
    expect(outcome.email).toBe('hello@beauty.test')
    expect(outcome).toMatchObject({
      email: 'hello@beauty.test',
      emailSource: { url: 'https://profile.test/beauty.one', fetchedAt: new Date(1_700_000_000_000).toISOString() },
    })
    expect(outcome.searches).toBe(2)
    expect(outcome.fetches).toBe(1)
  })

  it('prefers pages whose URL carries the handle and ignores duplicates', async () => {
    const fake = crawler({
      sources: ['https://elsewhere.test/a', 'https://site.test/beauty.one', 'https://site.test/beauty.one'],
      pages: { 'https://site.test/beauty.one': { text: 'hi@beauty.test' } },
    })
    const outcome = await crawlContact(base, fake, limits)
    expect(fake.fetches[0]).toBe('https://site.test/beauty.one')
    expect(outcome.fetches).toBe(1)
  })

  it('survives failed searches and unreadable pages', async () => {
    const fake = crawler({
      searchThrows: true,
      pages: {
        'https://profile.test/x': { status: 500, text: 'x@y.test' },
      },
    })
    const outcome = await crawlContact({ ...base, url: 'https://profile.test/x' }, fake, limits)
    expect(outcome).toEqual({ searches: 2, fetches: 1 })
  })

  it('continues past a page that states no email and keeps the caller signal', async () => {
    const fake = crawler({ pages: { 'https://profile.test/none': { text: 'no contact here' } } })
    const signal = new AbortController().signal
    const outcome = await crawlContact({ ...base, url: 'https://profile.test/none' }, fake, limits, signal)
    expect(outcome.fetches).toBe(1)
    expect(outcome.email).toBeUndefined()
  })

  it('falls back to the creator id when the handle is absent', async () => {
    const fake = crawler({ pages: { 'https://profile.test/id': { text: 'hi@beauty.test' } } })
    const outcome = await crawlContact({ platform: 'TIKTOK', creatorId: 'beauty.one', name: 'Beauty One', queries: [], traces: [], url: 'https://profile.test/id' }, fake, limits)
    expect(outcome.email).toBe('hi@beauty.test')
  })

  it('skips non-HTTP profile URLs and binary bodies, and respects zero fetches', async () => {
    const fake = crawler({})
    await crawlContact({ ...base, url: 'mailto:x@y.test' }, fake, { ...limits, fetchesPerCreator: 0 })
    expect(fake.fetches).toHaveLength(0)
    const binary = crawler({ pages: { 'https://profile.test/b': {} } })
    const outcome = await crawlContact({ ...base, url: 'https://profile.test/b' }, binary, limits)
    expect(outcome.fetches).toBe(1)
  })
})

describe('plugin wiring with the web seam', () => {
  it('mounts the crawler when a web service is present', async () => {
    const ctx = new Context()
    await mountAgentLoopTestDependencies(ctx)
    const storage = await ctx.plugin(Storage)
    await storage.await()
    const domains = await ctx.plugin(MemoryStorage)
    await domains.await()
    await ctx.plugin(WebRuntime)
    ctx.provide('desktopSession', { sessionId: () => 's' })
    const fiber = await ctx.plugin(CreatorSearch, { baseURL: 'https://bff.test' })
    await fiber.await()
    expect(ctx.tools.get('creator_scout')).toBeDefined()

    globalThis.fetch = async () => Response.json({
      data: { items: [] }, meta: { traceId: 't', schemaVersion: '1.0', source: 'blue' },
    })
    const batch = await ctx.tools.execute({
      calls: [{ type: 'tool-call', name: 'creator_scout', id: ToolCallId('w-1'), arguments: JSON.stringify({ category: 'beauty', platforms: ['TIKTOK'], market: 'US', targetCount: 1 }) }],
      signal: new AbortController().signal,
    })
    expect(batch.results[0]?.result.isError).toBe(false)
    await ctx.fiber.dispose()
  })
})

describe('scout contact stage', () => {
  it('keeps a candidate whose enriched country fails a gate', async () => {
    const client = new CreatorSearchClient({ baseURL: 'https://bff.test', timeoutMs: 1_000, sessionId: () => 's' })
    client.searchBlue = async () => ({
      source: 'blue' as const,
      traceId: 't',
      data: { items: [{ unique_id: 'abroad.one', follower_count: 30_000, avg_engagement_rate: '3' }] },
    })
    client.detailBlue = async () => ({ source: 'blue' as const, traceId: 'd', data: { kox_country: 'GB' } })
    const result = await scoutCreators(
      { category: 'beauty', platforms: ['TIKTOK'] as const, market: 'US', targetCount: 1, keywords: ['beauty'] },
      'standard',
      defaults,
      {
        limits: {
          fast: { maxSearchCalls: 1, pagesPerQuery: 1, pageSize: 20, enrichLimit: 0, poolFactor: 2 },
          standard: { maxSearchCalls: 1, pagesPerQuery: 1, pageSize: 20, enrichLimit: 1, poolFactor: 2 },
          broad: { maxSearchCalls: 1, pagesPerQuery: 1, pageSize: 20, enrichLimit: 0, poolFactor: 2 },
        },
        weights,
        suffixes: [] as string[],
        feedbackBoost: 10,
        client,
      },
    )
    expect(result.status).toBe('ready')
    expect(result.status === 'ready' && result.stats.detailCalls).toBe(1)
  })

  const brief = { category: 'beauty', platforms: ['TIKTOK'] as const, market: 'US', targetCount: 1, keywords: ['beauty'] }
  const options = {
    limits: {
      fast: { maxSearchCalls: 1, pagesPerQuery: 1, pageSize: 20, enrichLimit: 0, poolFactor: 2 },
      standard: { maxSearchCalls: 1, pagesPerQuery: 1, pageSize: 20, enrichLimit: 0, poolFactor: 2 },
      broad: { maxSearchCalls: 1, pagesPerQuery: 1, pageSize: 20, enrichLimit: 0, poolFactor: 2 },
    },
    weights,
    suffixes: [] as string[],
    feedbackBoost: 10,
    contact: { enabled: true, limit: 5, queriesPerCreator: 1, fetchesPerCreator: 1, timeoutMs: 5_000 },
  }

  function client(items: JsonValue[]): CreatorSearchClient {
    const value = new CreatorSearchClient({ baseURL: 'https://bff.test', timeoutMs: 1_000, sessionId: () => 's' })
    value.searchBlue = async () => ({ source: 'blue' as const, traceId: 't', data: { items } })
    return value
  }

  it('fills a missing email from the crawled page and re-scores the creator', async () => {
    const page = crawler({ pages: { 'https://profile.test/beauty.one': { text: 'hello@beauty.test' } } })
    const result = await scoutCreators(brief, 'fast', defaults, {
      ...options,
      client: client([{ unique_id: 'beauty.one', follower_count: 30_000, country: 'US', avg_engagement_rate: '3', url: 'https://profile.test/beauty.one' }]),
      crawler: page,
    })
    expect(result.status).toBe('ready')
    const shortlist = result.status === 'ready' ? result.shortlist : []
    expect(shortlist[0]).toMatchObject({ email: 'hello@beauty.test', hasEmail: true, contactStatus: 'crawled' })
    expect(shortlist[0]?.emailSource?.url).toBe('https://profile.test/beauty.one')
    expect(shortlist[0]?.emailSource?.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(result.status === 'ready' && result.stats.contact).toEqual({ creators: 1, searches: 1, fetches: 1, found: 1, unavailable: false })
  })

  it('reports a creator whose pages state no email', async () => {
    const result = await scoutCreators(brief, 'fast', defaults, {
      ...options,
      client: client([{ unique_id: 'quiet.one', follower_count: 30_000, country: 'US' }]),
      crawler: crawler({}),
    })
    expect(result.status === 'ready' && result.shortlist[0]?.contactStatus).toBe('not-found')
    expect(result.status === 'ready' && result.stats.contact.found).toBe(0)
  })

  it('reports the missing crawl channel when a shortlisted creator still lacks an email', async () => {
    const result = await scoutCreators(brief, 'fast', defaults, {
      ...options,
      client: client([{ unique_id: 'no.mail', follower_count: 30_000, country: 'US' }]),
    })
    expect(result.status === 'ready' && result.caveats.some(caveat => caveat.includes('contact crawling is unavailable'))).toBe(true)
  })

  it('leaves the shortlist alone without a crawler, with a caveat', async () => {
    const result = await scoutCreators(brief, 'fast', defaults, {
      ...options,
      client: client([{ unique_id: 'quiet.two', follower_count: 30_000, country: 'US', has_email: true }]),
    })
    expect(result.status === 'ready' && result.stats.contact.unavailable).toBe(true)
    expect(result.status === 'ready' && result.caveats.some(caveat => caveat.includes('contact crawling is unavailable'))).toBe(false)
  })

  it('crawls nothing when the stage is disabled or the email is already known', async () => {
    const disabled = await scoutCreators(brief, 'fast', defaults, {
      ...options,
      client: client([{ unique_id: 'a', follower_count: 30_000, country: 'US' }]),
      crawler: crawler({}),
      contact: { ...options.contact, enabled: false },
    })
    expect(disabled.status === 'ready' && disabled.stats.contact.creators).toBe(0)

    const known = await scoutCreators(brief, 'fast', defaults, {
      ...options,
      client: client([{ unique_id: 'b', follower_count: 30_000, country: 'US', has_email: true }]),
      crawler: crawler({}),
    })
    expect(known.status === 'ready' && known.stats.contact.creators).toBe(0)
  })
})
