/**
 * Contact discovery for a creator the platform reports no email for: search the
 * web for the handle, read the profile and the most relevant results, and take
 * the first plausible business email the pages state.
 *
 * The crawler is injected as a narrow capability so this module never depends
 * on a concrete web provider; the plugin adapts `ctx.web` when the profile has
 * one, and an absent crawler leaves candidates unchanged.
 * @module @tomato/tool-creator-search/contact
 */

import type WebService from '@tomato/web'
import type { Candidate } from './scout.ts'

/** The crawl capability contact discovery needs, shaped from the web seam. */
export interface ContactCrawler {
  /**
   * Search the web for one query.
   * @param query - the phrase to search.
   * @param maxResults - upper bound on returned sources.
   * @param signal - cancellation for this request.
   * @returns source URLs the search reported.
   */
  search(query: string, maxResults: number, signal?: AbortSignal): Promise<{ readonly sources: readonly { readonly url: string }[] }>
  /**
   * Read one page.
   * @param url - page URL.
   * @param signal - cancellation for this request.
   * @returns the status and the decoded text, when the body is text or HTML.
   */
  fetch(url: string, signal?: AbortSignal): Promise<{ readonly url: string; readonly statusCode: number; readonly text?: string }>
}

/** Limits on one creator's contact crawl. */
export interface ContactLimits {
  /** Search requests one creator may spend. */
  readonly queriesPerCreator: number
  /** Page reads one creator may spend. */
  readonly fetchesPerCreator: number
  /** End-to-end budget for one creator, in milliseconds. */
  readonly timeoutMs: number
  /** Clock used for the source timestamp; tests replace it. */
  readonly now?: () => number
}

/** What one contact crawl found. */
export type ContactOutcome = {
  /** Search requests spent. */
  readonly searches: number
  /** Page reads spent. */
  readonly fetches: number
} & (
  | {
    /** First plausible email the pages stated. */
    readonly email: string
    /** Page that stated it, with the read timestamp. */
    readonly emailSource: { readonly url: string; readonly fetchedAt: string }
  }
  | { readonly email?: undefined }
)

/** Domains that publish placeholder or asset addresses, never a creator's inbox. */
const IGNORED_DOMAINS = new Set([
  'example.com', 'example.org', 'sentry.io', 'wixpress.com', 'domain.com', 'email.com', 'yourdomain.com',
])

/** File suffixes a match ending those names is an asset path, not an address. */
const ASSET_SUFFIXES = /\.(?:png|jpe?g|gif|webp|svg|css|js|json|pdf|ico)$/i

/** Address forms that are never a human business inbox. */
const IGNORED_LOCAL = /^(?:no-?reply|donot?reply|support|help|info|admin|webmaster|postmaster|abuse)$/i

/**
 * Adapt the web seam to the crawl capability contact discovery needs.
 * @param web - mounted web service.
 * @returns the crawler this module calls.
 */
export function crawlerFromWeb(web: Pick<WebService, 'search' | 'fetch'>): ContactCrawler {
  return {
    async search(query, maxResults, signal) {
      const result = await web.search({ query, maxResults }, signal)
      return { sources: result.sources.map(source => ({ url: source.url })) }
    },
    async fetch(url, signal) {
      const result = await web.fetch({ url }, signal)
      return { url: result.url, statusCode: result.statusCode, text: result.body.content }
    },
  }
}

/**
 * Read the queries one creator's crawl runs, in order.
 * @param candidate - creator to locate.
 * @returns at most one query per identifying phrase the candidate states.
 */
export function contactQueries(candidate: Candidate): string[] {
  const handle = normalizedHandle(candidate.handle ?? candidate.creatorId)
  const name = candidate.name?.trim() ?? ''
  const queries = [
    handle === '' ? undefined : `"${handle}" email`,
    name === '' ? undefined : `"${name}" business email contact`,
    handle === '' ? undefined : `"${handle}" ${candidate.platform.toLowerCase()} contact`,
  ].filter((query): query is string => query !== undefined)
  return [...new Set(queries)]
}

/**
 * Take the first plausible business email from one page.
 * @param text - decoded page text or HTML.
 * @returns the address, or undefined when the page states none.
 */
export function firstEmail(text: string): string | undefined {
  const matches = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? []
  for (const raw of matches) {
    const email = raw.replace(/[.,;:]+$/, '')
    const [local = '', domain = ''] = email.split('@')
    if (IGNORED_DOMAINS.has(domain.toLowerCase())) continue
    if (IGNORED_LOCAL.test(local)) continue
    if (ASSET_SUFFIXES.test(domain)) continue
    return email
  }
  return undefined
}

/**
 * Crawl one creator's pages for a business email.
 * @param candidate - creator the platform reported no email for.
 * @param crawler - search and fetch capability.
 * @param limits - per-creator request and time budget.
 * @param signal - caller cancellation, combined with the budget.
 * @returns the email with its source, and the requests spent.
 */
export async function crawlContact(
  candidate: Candidate,
  crawler: ContactCrawler,
  limits: ContactLimits,
  signal?: AbortSignal,
): Promise<ContactOutcome> {
  const budget = AbortSignal.timeout(limits.timeoutMs)
  const combined = signal === undefined ? budget : AbortSignal.any([signal, budget])
  const now = (limits.now ?? Date.now)()
  let searches = 0
  let fetches = 0
  const targets: string[] = []
  if (candidate.url !== undefined && /^https?:/i.test(candidate.url)) targets.push(candidate.url)

  for (const query of contactQueries(candidate).slice(0, limits.queriesPerCreator)) {
    searches += 1
    try {
      const result = await crawler.search(query, 5, combined)
      for (const source of result.sources) {
        if (!targets.includes(source.url)) targets.push(source.url)
      }
    } catch {
      // A failed search only costs the query; the remaining pages may still answer.
    }
  }

  const handle = normalizedHandle(candidate.handle ?? candidate.creatorId)
  targets.sort((left, right) => Number(pageMatches(right, handle)) - Number(pageMatches(left, handle)))
  for (const url of targets.slice(0, limits.fetchesPerCreator)) {
    fetches += 1
    try {
      const page = await crawler.fetch(url, combined)
      if (page.statusCode < 200 || page.statusCode >= 300 || page.text === undefined) continue
      const email = firstEmail(page.text)
      if (email === undefined) continue
      return {
        email,
        emailSource: { url: page.url, fetchedAt: new Date(now).toISOString() },
        searches,
        fetches,
      }
    } catch {
      // One unreadable page does not end the crawl; the next target may answer.
    }
  }
  return { searches, fetches }
}

/**
 * Normalize a handle for querying and page matching.
 * @param value - handle or creator id.
 * @returns the bare, lowercased name.
 */
function normalizedHandle(value: string): string {
  return value.trim().replace(/^@/, '').toLowerCase()
}

/**
 * Whether a page URL mentions the creator's handle.
 * @param url - page URL.
 * @param handle - normalized handle.
 * @returns true when the URL carries the handle.
 */
function pageMatches(url: string, handle: string): boolean {
  return handle !== '' && url.toLowerCase().includes(handle)
}
