/**
 * Creator scouting: turn a brief into a bounded search plan, merge the
 * candidates several strategies surface, enrich the best of them, and rank
 * them against the brief with evidence stated per candidate.
 *
 * The brief is the gate: a call without the fields that decide the search
 * returns the questions that would change the result instead of spending quota.
 * Scores are computed only from observed fields, and the reported coverage says
 * how much of the model the evidence supports.
 * @module @tomato/tool-creator-search/scout
 */

import type { JsonValue } from '@tomato/util-values'
import type { BlueDetailRequest, BlueSearchRequest, CreatorSearchClient } from './bff.ts'
import { CreatorSearchError } from './bff.ts'
import { crawlContact } from './contact.ts'
import type { ContactCrawler, ContactLimits } from './contact.ts'
import type { CreatorFeedbackIndex, FeedbackDecision } from './feedback.ts'
import { creatorKey } from './feedback.ts'
import type { CreatorPlatform } from './types.ts'

/** How hard one scout call searches; depth selects the call budget. */
export type ScoutDepth = 'fast' | 'standard' | 'broad'

/**
 * How far a run may go beyond the caller's own words. `strict` searches only the
 * stated keywords; `balanced` adds recombinations of the stated category,
 * product, and market; `broad` also appends the deployed suffix phrases.
 */
export type QueryPolicy = 'strict' | 'balanced' | 'broad'

/** Deployment limits on one scout call. */
export interface ScoutLimits {
  /** Most BFF search requests one call may send. */
  readonly maxSearchCalls: number
  /** Pages read per keyword query before the next strategy. */
  readonly pagesPerQuery: number
  /** Results requested per search page. */
  readonly pageSize: number
  /** Most candidates enriched through the detail endpoint. */
  readonly enrichLimit: number
  /** Pool size as a multiple of `targetCount` before enrichment stops searching. */
  readonly poolFactor: number
}

/** Per-call budgets for each depth, resolved by the plugin's config. */
export type DepthLimits = Readonly<Record<ScoutDepth, ScoutLimits>>

/** Weights that spread 100 points across the signals a candidate can carry. */
export interface ScoreWeights {
  /** Closeness to the middle of the brief's follower band. */
  readonly followers: number
  /** Engagement rate against the brief's floor. */
  readonly engagement: number
  /** How many of the brief's keywords surfaced and match the creator. */
  readonly keywords: number
  /** Country match against the brief's market. */
  readonly market: number
  /** Recency of the last published content. */
  readonly recency: number
  /** Whether a business email is on file. */
  readonly contactability: number
}

/** One creator the scout found, merged across the queries that surfaced it. */
export interface Candidate {
  /** Platform that owns the identifier. */
  readonly platform: CreatorPlatform
  /** Stable identifier on that platform. */
  readonly creatorId: string
  /** Handle, when the payload carried one. */
  readonly handle?: string
  /** Display name, when the payload carried one. */
  readonly name?: string
  /** Profile URL, when the payload carried one. */
  readonly url?: string
  /** ISO country code, when known. */
  readonly country?: string
  /** Follower count, when known. */
  readonly followers?: number
  /** Engagement rate as a ratio (0.032 = 3.2%), when known. */
  readonly engagementRate?: number
  /** Average views per video, when known. */
  readonly averageViews?: number
  /** Published video count, when known. */
  readonly videoCount?: number
  /** Last publish time as ISO 8601, when known. */
  readonly lastPublishedAt?: string
  /** Whether a contact email is on file, when the payload states it. */
  readonly hasEmail?: boolean
  /** Business email found by the contact crawl. */
  readonly email?: string
  /** Page that stated the email, with the read timestamp. */
  readonly emailSource?: { readonly url: string; readonly fetchedAt: string }
  /** Where the contact state came from. */
  readonly contactStatus?: 'platform' | 'crawled' | 'not-found'
  /** Queries that surfaced this creator. */
  readonly queries: readonly string[]
  /** BFF trace ids that produced its evidence. */
  readonly traces: readonly string[]
}

/** A brief as the deployment defaults and the caller's answers resolved it. */
export interface CreatorBrief {
  /** Client or brand the search is for; scopes remembered feedback. */
  readonly client: string | undefined
  /** Product being promoted, when the brief names one. */
  readonly product: string | undefined
  /** Category or niche the creator should work in. */
  readonly category: string
  /** Platforms to search. */
  readonly platforms: readonly CreatorPlatform[]
  /** Target market as an ISO country code or `GLOBAL`. */
  readonly market: string
  /** Creators wanted in the shortlist. */
  readonly targetCount: number
  /** Keyword phrases to run; derived from the stated fields only when it names none. */
  readonly keywords: readonly string[]
  /** Whether {@link keywords} repeats the caller's own phrases rather than derived ones. */
  readonly keywordsFromUser: boolean
  /** Follower band the creator should sit in. */
  readonly followers: { readonly min: number; readonly max: number }
  /** Lowest acceptable engagement rate as a ratio. */
  readonly minEngagementRate: number
  /** Preferred content language, when the brief states one. */
  readonly language: string | undefined
  /** Whether a business email is required. */
  readonly mustHaveEmail: boolean
  /** Creators the caller already ruled out. */
  readonly excludeCreators: readonly string[]
}

/** What the caller states about a brief; every field except the essentials may be omitted. */
export interface CreatorBriefInput {
  readonly client?: string
  readonly product?: string
  readonly category?: string
  readonly platforms?: readonly string[]
  readonly market?: string
  readonly targetCount?: number
  readonly keywords?: readonly string[]
  readonly followersMin?: number
  readonly followersMax?: number
  readonly minEngagementRate?: number
  readonly language?: string
  readonly mustHaveEmail?: boolean
  readonly excludeCreators?: readonly string[]
}

/** Deployment defaults a brief falls back to. */
export interface BriefDefaults {
  /** Default follower band floor. */
  readonly followersMin: number
  /** Default follower band ceiling. */
  readonly followersMax: number
  /** Default engagement floor as a ratio. */
  readonly minEngagementRate: number
  /** Default creators wanted. */
  readonly targetCount: number
}

/** One brief decision: either a runnable brief or the questions that block it. */
export interface BriefDecision {
  /** Resolved brief, present when every essential field is stated. */
  readonly brief?: CreatorBrief
  /** Essential fields the caller left out. */
  readonly missing: readonly string[]
  /** Defaults the decision applied, reported so the caller can override them. */
  readonly assumptions: readonly string[]
  /** At most three merged questions, one per missing essential group. */
  readonly questions: readonly string[]
}

/** One planned search request. */
export interface SearchStep {
  /** Strategy that produced this step, for the call report. */
  readonly strategy: 'keyword' | 'keyword-variant' | 'wide-page' | 'relaxed-followers'
  /** Platform to search. */
  readonly platform: CreatorPlatform
  /** Keyword phrase to send. */
  readonly query: string
  /** Whether the phrase came from the caller or was derived from stated fields. */
  readonly source: 'user' | 'derived'
  /** 1-based page. */
  readonly page: number
}

/** Keywords the deployed suffixes add to the brief's own. */
export const MAX_PLAN_CALLS = 24

/**
 * Normalize a brief against deployment defaults.
 * @param input - what the caller stated.
 * @param defaults - follower band, engagement floor, and target count to fall back to.
 * @returns a runnable brief, or the missing essentials with merged questions.
 */
export function normalizeBrief(input: CreatorBriefInput, defaults: BriefDefaults): BriefDecision {
  const assumptions: string[] = []
  const missing: string[] = []

  const category = normalizeText(input.category)
  if (category === '') missing.push('category')
  const platforms = normalizePlatforms(input.platforms)
  if (platforms.length === 0) missing.push('platforms')
  const market = normalizeText(input.market).toUpperCase()
  if (market === '') missing.push('market')

  const targetCount = input.targetCount ?? defaults.targetCount
  if (input.targetCount === undefined) assumptions.push(`targetCount defaults to ${String(defaults.targetCount)}`)
  if (!Number.isInteger(targetCount) || targetCount < 1 || targetCount > 50) {
    throw new Error('targetCount must be an integer between 1 and 50.')
  }

  const followersMin = input.followersMin ?? defaults.followersMin
  const followersMax = input.followersMax ?? defaults.followersMax
  if (input.followersMin === undefined && input.followersMax === undefined) {
    assumptions.push(`follower band defaults to ${compactCount(followersMin)}–${compactCount(followersMax)}`)
  }
  if (!Number.isFinite(followersMin) || !Number.isFinite(followersMax) || followersMin < 0 || followersMax <= followersMin) {
    throw new Error('followersMin and followersMax must describe a non-empty band.')
  }

  const minEngagementRate = input.minEngagementRate ?? defaults.minEngagementRate
  if (input.minEngagementRate === undefined) {
    assumptions.push(`engagement floor defaults to ${formatPercent(minEngagementRate)}`)
  }
  if (!Number.isFinite(minEngagementRate) || minEngagementRate < 0 || minEngagementRate > 1) {
    throw new Error('minEngagementRate must be a ratio between 0 and 1.')
  }

  if (missing.length > 0) return { missing, assumptions, questions: briefQuestions(missing) }

  const resolvedKeywords = resolveKeywords(input, category, market)

  return {
    brief: {
      client: normalizeText(input.client) || undefined,
      product: normalizeText(input.product) || undefined,
      category,
      platforms,
      market,
      targetCount,
      keywords: resolvedKeywords.keywords,
      keywordsFromUser: resolvedKeywords.fromUser,
      followers: { min: followersMin, max: followersMax },
      minEngagementRate,
      language: normalizeText(input.language) || undefined,
      mustHaveEmail: input.mustHaveEmail === true,
      excludeCreators: normalizeList(input.excludeCreators),
    },
    missing: [],
    assumptions,
    questions: [],
  }
}

/**
 * Plan the bounded search ladder: keywords first, then variants, then wider
 * pages, then a relaxed follower band. The ladder stops at the call budget.
 * @param brief - resolved brief.
 * @param limits - the depth's call limits.
 * @param suffixes - deployed query suffixes for the variant round.
 * @returns the ordered steps, at most `limits.maxSearchCalls`.
 */
export function planSearches(
  brief: CreatorBrief,
  limits: ScoutLimits,
  suffixes: readonly string[],
  policy: QueryPolicy = 'balanced',
): SearchStep[] {
  const steps: SearchStep[] = []
  const budget = Math.min(limits.maxSearchCalls, MAX_PLAN_CALLS)
  const stated = brief.keywordsFromUser ? 'user' : 'derived'
  const [primary] = brief.keywords
  if (primary === undefined) return []

  // The caller's own phrases always come first, on every platform and page.
  for (const page of pages(limits.pagesPerQuery)) {
    for (const platform of brief.platforms) {
      for (const query of brief.keywords.slice(0, 2)) {
        steps.push({ strategy: page === 1 ? 'keyword' : 'wide-page', platform, query, page, source: stated })
      }
    }
  }
  // A narrow brief stays narrow: variants exist only above `strict`, and the
  // deployed suffix phrases only above `balanced`.
  for (const variant of variantQueries(brief, suffixes, policy)) {
    for (const platform of brief.platforms) {
      steps.push({ strategy: 'keyword-variant', platform, query: variant.query, page: 1, source: variant.source })
    }
  }
  if (policy === 'broad') {
    const widest = Math.min(limits.pagesPerQuery + 1, 5)
    for (const platform of brief.platforms) {
      steps.push({
        strategy: 'relaxed-followers',
        platform,
        query: primary,
        page: widest,
        source: stated,
      })
    }
  }
  return steps.slice(0, budget)
}

/**
 * Map one Blue search payload into candidates.
 * @param platform - platform the search ran on.
 * @param payload - the BFF `data` body.
 * @param query - keyword phrase that produced the payload.
 * @param traceId - BFF trace id.
 * @returns the candidates the payload describes; malformed entries are dropped.
 */
export function candidatesFromSearch(
  platform: CreatorPlatform,
  payload: JsonValue,
  query: string,
  traceId: string,
): Candidate[] {
  if (!isJsonObject(payload) || !Array.isArray(payload.items)) return []
  const out: Candidate[] = []
  for (const item of payload.items) {
    if (!isJsonObject(item)) continue
    // The detail endpoint locates YouTube by channel id and TikTok/Instagram by handle.
    const creatorId = platform === 'YOUTUBE'
      ? readText(item.channel_id) ?? readText(item.unique_id)
      : readText(item.unique_id) ?? readText(item.channel_id)
    if (creatorId === undefined) continue
    out.push({
      platform,
      creatorId,
      ...compact({
        handle: readText(item.unique_id),
        name: readText(item.nickname),
        url: readText(item.url),
        country: readText(item.country)?.toUpperCase(),
        followers: readCount(item.follower_count),
        engagementRate: parseEngagementRate(item.avg_engagement_rate),
        averageViews: readCount(item.avg_play_count),
        videoCount: readCount(item.video_count),
        lastPublishedAt: readText(item.last_publish_at),
        hasEmail: typeof item.has_email === 'boolean' ? item.has_email : undefined,
      }),
      queries: [query],
      traces: [traceId],
    })
  }
  return out
}

/**
 * Merge one candidate into another, filling gaps and unioning evidence.
 * @param left - the candidate already held.
 * @param right - the newly found candidate.
 * @returns the merged candidate.
 */
export function mergeCandidate(left: Candidate, right: Candidate): Candidate {
  const held = Object.fromEntries(Object.entries(left).filter(([, value]) => value !== undefined)) as Partial<Candidate>
  return {
    ...right,
    ...held,
    queries: [...new Set([...left.queries, ...right.queries])],
    traces: [...new Set([...left.traces, ...right.traces])],
  }
}

/**
 * Fill candidate fields from one Blue detail payload.
 * @param candidate - the candidate as the search found it.
 * @param payload - the BFF detail `data` body.
 * @param traceId - BFF trace id.
 * @returns the enriched candidate; unknown fields stay as they were.
 */
export function enrichFromDetail(candidate: Candidate, payload: JsonValue, traceId: string): Candidate {
  if (!isJsonObject(payload)) return candidate
  const channels = Array.isArray(payload.kox_channel_list) ? payload.kox_channel_list : []
  const channel = channels.map(entry => isJsonObject(entry) ? entry : undefined)
    .find(entry => entry !== undefined && readText(entry.platform)?.toLowerCase() === candidate.platform.toLowerCase())
  return {
    ...candidate,
    ...compact({
      name: readText(payload.kox_name) ?? (channel === undefined ? undefined : readText(channel.channel_name)),
      country: (readText(payload.kox_country) ?? (channel === undefined ? undefined : readText(channel.channel_title)))?.toUpperCase(),
      followers: channel === undefined ? undefined : readCount(channel.fans_count),
      engagementRate: channel === undefined ? undefined : parseEngagementRate(channel.avg_engagement),
      averageViews: channel === undefined ? undefined : readCount(channel.avg_view),
      hasEmail: readText(payload.kox_email) === undefined ? undefined : true,
    }),
    traces: [...new Set([...candidate.traces, traceId])],
  }
}

/**
 * Fill candidate fields from one YCP channel payload.
 * @param candidate - the candidate as the search found it.
 * @param payload - the BFF YCP `data` body.
 * @param traceId - BFF trace id.
 * @returns the enriched candidate; unknown fields stay as they were.
 */
export function enrichFromChannel(candidate: Candidate, payload: JsonValue, traceId: string): Candidate {
  if (!isJsonObject(payload)) return candidate
  return {
    ...candidate,
    ...compact({
      country: readText(payload.regionCode)?.toUpperCase(),
      followers: readCount(payload.subscriberCount),
      hasEmail: typeof payload.businessEmail === 'string' ? payload.businessEmail.trim() !== '' : undefined,
    }),
    traces: [...new Set([...candidate.traces, traceId])],
  }
}

/** One candidate after gating and scoring. */
export interface ScoredCandidate extends Candidate {
  /** Weighted score from 0 to 100 over the observed signals. */
  readonly score: number
  /** Share of the weight the evidence covers, from 0 to 100. */
  readonly coverage: number
  /** Evidence verdict: all gates observed, some missing, or barely any evidence. */
  readonly status: 'pass' | 'conditional' | 'unverified'
  /** Why the candidate scored as it did, in plain language. */
  readonly reasons: readonly string[]
}

/** One gate a candidate failed outright. */
export interface GateFailure {
  /** Candidate the gate rejected. */
  readonly key: string
  /** Gate that rejected it. */
  readonly gate: 'followers' | 'engagement' | 'market' | 'contactability' | 'exclusion' | 'feedback'
  /** Model-facing explanation. */
  readonly reason: string
}

/**
 * Gate and score one candidate against the brief.
 * @param candidate - merged candidate fields.
 * @param brief - resolved brief.
 * @param weights - deployment weights.
 * @param now - epoch milliseconds used for recency.
 * @returns the scored candidate, or the gate that rejected it.
 */
export function scoreCandidate(
  candidate: Candidate,
  brief: CreatorBrief,
  weights: ScoreWeights,
  now: number,
): ScoredCandidate | GateFailure {
  const key = creatorKey(candidate.platform, candidate.creatorId)
  const handled = candidate.handle ?? candidate.name ?? ''
  if (brief.excludeCreators.some(value => sameHandle(value, handled) || sameHandle(value, candidate.creatorId))) {
    return { key, gate: 'exclusion', reason: 'the caller already excluded this creator' }
  }
  if (candidate.followers !== undefined && (candidate.followers < brief.followers.min || candidate.followers > brief.followers.max)) {
    return {
      key,
      gate: 'followers',
      reason: `${compactCount(candidate.followers)} followers sits outside ${compactCount(brief.followers.min)}–${compactCount(brief.followers.max)}`,
    }
  }
  if (candidate.engagementRate !== undefined && candidate.engagementRate < brief.minEngagementRate) {
    return {
      key,
      gate: 'engagement',
      reason: `${formatPercent(candidate.engagementRate)} engagement sits below the ${formatPercent(brief.minEngagementRate)} floor`,
    }
  }
  if (brief.market !== 'GLOBAL' && candidate.country !== undefined && candidate.country !== brief.market) {
    return { key, gate: 'market', reason: `country ${candidate.country} does not match market ${brief.market}` }
  }
  if (brief.mustHaveEmail && candidate.hasEmail === false) {
    return { key, gate: 'contactability', reason: 'the brief requires an email and none is on file' }
  }

  const reasons: string[] = []
  let observed = 0
  let earned = 0
  const observe = (weight: number, value: number, reason: string): void => {
    observed += weight
    earned += weight * clamp01(value)
    reasons.push(reason)
  }

  if (candidate.followers !== undefined) {
    const mid = Math.sqrt(brief.followers.min * brief.followers.max)
    const span = Math.log(brief.followers.max / brief.followers.min) / 2 || 1
    const distance = Math.abs(Math.log(candidate.followers / mid)) / span
    observe(weights.followers, 1 - distance, `${compactCount(candidate.followers)} followers sits in the brief band`)
  }
  if (candidate.engagementRate !== undefined) {
    const target = Math.max(brief.minEngagementRate, 1e-4) * 5
    observe(weights.engagement, candidate.engagementRate / target, `${formatPercent(candidate.engagementRate)} engagement against a ${formatPercent(brief.minEngagementRate)} floor`)
  }
  const matched = matchedKeywords(candidate, brief)
  if (matched.length > 0) {
    observe(weights.keywords, matched.length / Math.max(1, brief.keywords.length), `matched keywords: ${matched.join(', ')}`)
  }
  if (candidate.country !== undefined && brief.market !== 'GLOBAL') {
    observe(weights.market, 1, `country ${candidate.country} matches market ${brief.market}`)
  }
  if (candidate.lastPublishedAt !== undefined) {
    const days = daysSince(candidate.lastPublishedAt, now)
    if (days !== undefined) {
      const value = days <= 30 ? 1 : days <= 90 ? 0.6 : 0.2
      observe(weights.recency, value, `last post ${String(days)} days ago`)
    }
  }
  if (candidate.hasEmail !== undefined) {
    observe(weights.contactability, candidate.hasEmail ? 1 : 0, candidate.hasEmail ? 'business email on file' : 'no business email on file')
  }

  const total = weights.followers + weights.engagement + weights.keywords + weights.market + weights.recency + weights.contactability
  const coverage = total === 0 ? 0 : (observed / total) * 100
  const score = observed === 0 ? 0 : (earned / observed) * 100
  const gatesKnown = candidate.followers !== undefined && candidate.engagementRate !== undefined
    && (brief.market === 'GLOBAL' || candidate.country !== undefined)
    && (!brief.mustHaveEmail || candidate.hasEmail !== undefined)
  const status = !gatesKnown ? 'conditional' : coverage < 50 ? 'unverified' : 'pass'
  if (!gatesKnown) reasons.push('some gates are unverified: the payload carried no follower, engagement, country, or email value')
  return { ...candidate, score: Math.round(score), coverage: Math.round(coverage), status, reasons }
}

/** Contact crawl settings for one scout call. */
export interface ContactOptions extends ContactLimits {
  /** Whether the shortlist's missing emails are crawled. */
  readonly enabled: boolean
  /** Most shortlisted creators one call crawls. */
  readonly limit: number
}

/** One scout call's request and result accounting. */
export interface ScoutStats {
  /** Search requests sent. */
  readonly searchCalls: number
  /** Detail requests sent. */
  readonly detailCalls: number
  /** Channel requests sent. */
  readonly channelCalls: number
  /** Distinct creators found. */
  readonly uniqueCreators: number
  /** Creators that reached scoring after feedback exclusions. */
  readonly scored: number
  /** Search steps per strategy. */
  readonly byStrategy: Readonly<Record<string, number>>
  /** The fidelity policy this run used. */
  readonly queryPolicy: QueryPolicy
  /** Planned phrases the caller stated versus phrases derived from stated fields. */
  readonly queries: { readonly user: number; readonly derived: number }
  /** Blue requests that spent group-API quota. */
  readonly quotaSpent: number
  /** Hard caps this run was given and what it spent, per request kind. */
  readonly budget: {
    readonly search: { readonly used: number; readonly limit: number }
    readonly detail: { readonly used: number; readonly limit: number }
    readonly channel: { readonly used: number; readonly limit: number }
  }
  /** Why the search loop stopped. */
  readonly stopReason: 'pool_met' | 'budget_exhausted' | 'search_complete' | 'quota' | 'unauthenticated'
  /** Contact crawl work spent on the shortlist. */
  readonly contact: {
    readonly creators: number
    readonly searches: number
    readonly fetches: number
    readonly found: number
    readonly unavailable: boolean
  }
}

/** The crawler handoff a short pool leaves to the caller. */
export interface ScoutEscalation {
  /** Shortlist places the BFF-backed run could not fill. */
  readonly needed: number
  /** Query phrases to take to the web search tool, in the caller's own words. */
  readonly queries: readonly string[]
  /** How to use the phrases, stated once for the model. */
  readonly instruction: string
}

/** A ready scout result. */
export interface ScoutReady {
  readonly status: 'ready'
  readonly brief: CreatorBrief
  readonly assumptions: readonly string[]
  readonly shortlist: readonly ScoredCandidate[]
  readonly excluded: readonly { readonly key: string; readonly reason: string }[]
  readonly appliedFeedback: readonly { readonly key: string; readonly decision: FeedbackDecision; readonly reasons: readonly string[] }[]
  readonly stats: ScoutStats
  readonly caveats: readonly string[]
  /** Present when the pool stayed short of `targetCount`. */
  readonly escalation?: ScoutEscalation
}

/** A scout call that cannot run yet. */
export interface ScoutNeedsBrief {
  readonly status: 'needs_brief'
  readonly missing: readonly string[]
  readonly assumptions: readonly string[]
  readonly questions: readonly string[]
  readonly plan: readonly SearchStep[]
}

/** Everything one scout call returns. */
export type ScoutResult = ScoutReady | ScoutNeedsBrief

/** Dependencies one scout call reads. */
export interface ScoutOptions {
  /** BFF client. */
  readonly client: CreatorSearchClient
  /** Remembered feedback, when a client is named. */
  readonly feedback?: CreatorFeedbackIndex
  /** Per-depth limits; the call's depth selects one. */
  readonly limits: DepthLimits
  /** Score weights. */
  readonly weights: ScoreWeights
  /** Query suffixes for the broad variant round. */
  readonly suffixes: readonly string[]
  /** Fidelity policy; defaults to `balanced` when omitted. */
  readonly queryPolicy?: QueryPolicy
  /** Score points an accepted creator keeps across calls. */
  readonly feedbackBoost: number
  /** Contact crawl capability; undefined leaves candidates unchanged. */
  readonly crawler?: ContactCrawler
  /** Contact crawl limits and enablement. */
  readonly contact?: ContactOptions
  /** Clock, for recency and feedback application; tests replace it. */
  readonly now?: () => number
}

/**
 * Run one bounded scouting pass.
 * @param input - brief as the caller stated it.
 * @param depth - search budget to use.
 * @param defaults - brief defaults.
 * @param options - client, feedback, weights, and limits.
 * @param signal - caller cancellation.
 * @returns a ready shortlist, or the questions that block the search.
 */
export async function scoutCreators(
  input: CreatorBriefInput,
  depth: ScoutDepth,
  defaults: BriefDefaults,
  options: ScoutOptions,
  signal?: AbortSignal,
): Promise<ScoutResult> {
  const decision = normalizeBrief(input, defaults)
  const limits = options.limits[depth]
  if (decision.brief === undefined) {
    return {
      status: 'needs_brief',
      missing: decision.missing,
      assumptions: decision.assumptions,
      questions: decision.questions,
      plan: [],
    }
  }
  const brief = decision.brief
  const now = (options.now ?? Date.now)()
  const feedback = options.feedback?.byCreator(brief.client)
  const merged = new Map<string, Candidate>()
  const byStrategy: Record<string, number> = {}
  let searchCalls = 0
  const caveats: string[] = []
  const excluded: { key: string; reason: string }[] = []
  const appliedFeedback: { key: string; decision: FeedbackDecision; reasons: readonly string[] }[] = []
  let stopReason: ScoutStats['stopReason'] = 'search_complete'

  const queryPolicy = options.queryPolicy ?? 'balanced'
  const plan = planSearches(brief, limits, options.suffixes, queryPolicy)
  for (const step of plan) {
    if (merged.size >= brief.targetCount * limits.poolFactor) {
      stopReason = 'pool_met'
      break
    }
    searchCalls += 1
    byStrategy[step.strategy] = (byStrategy[step.strategy] ?? 0) + 1
    try {
      const request: BlueSearchRequest = {
        platform: step.platform,
        query: step.query,
        page: step.page,
        pageSize: limits.pageSize,
      }
      const result = await options.client.searchBlue(request, signal)
      for (const candidate of candidatesFromSearch(step.platform, result.data, step.query, result.traceId)) {
        if (brief.excludeCreators.some(value => sameHandle(value, candidate.handle ?? '') || sameHandle(value, candidate.creatorId))) {
          excluded.push({ key: creatorKey(candidate.platform, candidate.creatorId), reason: 'excluded by the brief' })
          continue
        }
        const key = creatorKey(step.platform, candidate.creatorId)
        const held = merged.get(key)
        merged.set(key, held === undefined ? candidate : mergeCandidate(held, candidate))
      }
    } catch (error: unknown) {
      if (!(error instanceof CreatorSearchError)) throw error
      if (error.failure === 'quota' || error.failure === 'unauthenticated') {
        caveats.push(`search stopped early: ${error.message}`)
        stopReason = error.failure
        break
      }
      caveats.push(`one search strategy failed: ${error.message}`)
    }
  }

  const beforeFeedback: Candidate[] = []
  for (const candidate of merged.values()) {
    const key = creatorKey(candidate.platform, candidate.creatorId)
    const remembered = feedback?.get(key)
    if (remembered?.decision === 'reject') {
      excluded.push({ key, reason: `remembered rejection: ${remembered.reasons.join(', ') || 'no reason recorded'}` })
      continue
    }
    if (remembered !== undefined) appliedFeedback.push({ key, decision: remembered.decision, reasons: remembered.reasons })
    beforeFeedback.push(candidate)
  }

  const scored: ScoredCandidate[] = []
  for (const candidate of beforeFeedback) {
    const entry = scoreCandidate(candidate, brief, options.weights, now)
    if ('gate' in entry) excluded.push({ key: entry.key, reason: entry.reason })
    else scored.push(entry)
  }

  scored.sort((left, right) => right.score - left.score)
  const enrichment = await enrichRanked(scored.slice(0, limits.enrichLimit), options, signal)
  const byKey = new Map(enrichment.candidates.map(candidate => [creatorKey(candidate.platform, candidate.creatorId), candidate]))

  /**
   * Re-score every candidate after one more data source filled some fields.
   * @param extra - candidate fields added after the earlier pass, by creator key.
   * @returns the re-scored list, in the order of the earlier pass.
   */
  const rescoreWith = (extra: ReadonlyMap<string, Candidate>): ScoredCandidate[] => scored.map((candidate) => {
    const key = creatorKey(candidate.platform, candidate.creatorId)
    const base = byKey.get(key) ?? candidate
    const updated = extra.get(key)
    const merged = updated === undefined ? base : { ...base, ...updated }
    const entry = scoreCandidate(merged, brief, options.weights, now)
    if ('gate' in entry) return candidate
    return entry
  }).map(applyFeedbackBoost(feedback, options.feedbackBoost))

  let rescored = rescoreWith(new Map())
  const contactResult = await enrichContacts(rescored, options, now, signal)
  if (contactResult.stats.unavailable && rescored.some(candidate => candidate.email === undefined && candidate.hasEmail !== true)) {
    caveats.push(
      'contact crawling is unavailable in this profile, so missing emails stay unknown',
    )
  }
  rescored = rescoreWith(contactResult.updated)
  const contact = contactResult.stats
  rescored.sort((left, right) => right.score - left.score)
  const stats: ScoutStats = {
    searchCalls,
    detailCalls: enrichment.detailCalls,
    channelCalls: enrichment.channelCalls,
    uniqueCreators: merged.size,
    scored: rescored.length,
    byStrategy,
    queryPolicy,
    queries: {
      user: plan.filter(step => step.source === 'user').length,
      derived: plan.filter(step => step.source === 'derived').length,
    },
    quotaSpent: searchCalls + enrichment.detailCalls,
    budget: {
      search: { used: searchCalls, limit: limits.maxSearchCalls },
      detail: { used: enrichment.detailCalls, limit: limits.enrichLimit },
      channel: { used: enrichment.channelCalls, limit: limits.enrichLimit },
    },
    stopReason,
    contact,
  }
  if (merged.size < brief.targetCount) {
    caveats.push(`only ${String(merged.size)} distinct creators were found for ${String(brief.targetCount)} wanted; widening the market or follower band is the next step`)
  }
  const shortlist = rescored.slice(0, brief.targetCount)
  const needed = brief.targetCount - shortlist.length
  return {
    status: 'ready',
    brief,
    assumptions: decision.assumptions,
    shortlist,
    excluded,
    appliedFeedback,
    stats,
    caveats,
    ...needed <= 0 ? {} : {
      escalation: {
        needed,
        queries: brief.keywords,
        instruction: 'The creator index did not fill the shortlist within its call budget. Search these phrases with web_search, open the strongest profiles with web_fetch, and pass what you verified to creator_ingest so it is scored and remembered the same way.',
      },
    },
  }
}

/**
 * Enrich the ranked candidates the deployment allows: the free YCP channel read
 * first for YouTube, then the quota-spending detail read only while a field the
 * brief needs is still unknown.
 * @param candidates - ranked candidates to enrich.
 * @param options - client and feedback dependencies.
 * @param signal - caller cancellation.
 * @returns the enriched candidates and the requests the enrichment spent.
 */
async function enrichRanked(
  candidates: readonly ScoredCandidate[],
  options: ScoutOptions,
  signal: AbortSignal | undefined,
): Promise<{ candidates: Candidate[]; detailCalls: number; channelCalls: number }> {
  let detailCalls = 0
  let channelCalls = 0
  const out: Candidate[] = []
  for (const candidate of candidates) {
    let current: Candidate = candidate
    if (candidate.platform === 'YOUTUBE' && /^UC/.test(candidate.creatorId)) {
      channelCalls += 1
      try {
        const result = await options.client.ycpChannel({ channel: candidate.creatorId }, signal)
        current = enrichFromChannel(current, result.data, result.traceId)
      } catch (error: unknown) {
        if (!(error instanceof CreatorSearchError)) throw error
      }
    }
    if (current.country === undefined || current.hasEmail === undefined || current.engagementRate === undefined) {
      detailCalls += 1
      try {
        const request: BlueDetailRequest = { platform: candidate.platform, creatorId: candidate.creatorId }
        const result = await options.client.detailBlue(request, signal)
        current = enrichFromDetail(current, result.data, result.traceId)
      } catch (error: unknown) {
        if (!(error instanceof CreatorSearchError)) throw error
      }
    }
    out.push(current)
  }
  return { candidates: out, detailCalls, channelCalls }
}

/**
 * Crawl the shortlist's missing emails, re-score what changed, and report the work spent.
 * @param rescored - scored candidates, in final order.
 * @param options - scout dependencies, including the optional crawler.
 * @param now - epoch milliseconds used for scoring and source timestamps.
 * @param signal - caller cancellation.
 * @returns the contact work spent.
 */
async function enrichContacts(
  rescored: ScoredCandidate[],
  options: ScoutOptions,
  now: number,
  signal: AbortSignal | undefined,
): Promise<{ stats: ScoutStats['contact']; updated: Map<string, Candidate> }> {
  const stats = { creators: 0, searches: 0, fetches: 0, found: 0, unavailable: options.crawler === undefined }
  const updated = new Map<string, Candidate>()
  if (options.crawler === undefined || options.contact === undefined || !options.contact.enabled) return { stats, updated }
  const targets = rescored.filter(candidate => candidate.email === undefined && candidate.hasEmail !== true)
    .slice(0, options.contact.limit)
  for (const candidate of targets) {
    stats.creators += 1
    const outcome = await crawlContact(candidate, options.crawler, { ...options.contact, now: () => now }, signal)
    stats.searches += outcome.searches
    stats.fetches += outcome.fetches
    const key = creatorKey(candidate.platform, candidate.creatorId)
    if (outcome.email === undefined) {
      updated.set(key, { ...candidate, contactStatus: 'not-found' })
      continue
    }
    stats.found += 1
    updated.set(key, {
      ...candidate,
      hasEmail: true,
      email: outcome.email,
      contactStatus: 'crawled',
      emailSource: outcome.emailSource,
    })
  }
  return { stats, updated }
}

/**
 * Apply the remembered acceptance boost.
 * @param feedback - remembered records keyed by creator.
 * @param boost - points to add.
 * @returns the scoring step.
 */
function applyFeedbackBoost(
  feedback: ReadonlyMap<string, { readonly decision: FeedbackDecision }> | undefined,
  boost: number,
): (candidate: ScoredCandidate) => ScoredCandidate {
  return (candidate: ScoredCandidate) => {
    const remembered = feedback?.get(creatorKey(candidate.platform, candidate.creatorId))
    if (remembered?.decision !== 'accept') return candidate
    return {
      ...candidate,
      score: Math.min(100, candidate.score + boost),
      reasons: [...candidate.reasons, `remembered acceptance adds ${String(boost)} points`],
    }
  }
}

/**
 * Derive the query variants the plan's second round runs.
 * @param brief - resolved brief.
 * @param suffixes - deployed suffixes.
 * @returns distinct phrases beyond the brief's own keywords.
 */
function variantQueries(
  brief: CreatorBrief,
  suffixes: readonly string[],
  policy: QueryPolicy,
): { query: string; source: 'derived' }[] {
  if (policy === 'strict') return []
  const base = new Set(brief.keywords.map(value => value.toLowerCase()))
  // Balanced variants only recombine words the caller stated, so a narrow
  // constraint is never widened by vocabulary this plugin invented.
  const recombined = [
    brief.category,
    brief.product === undefined ? undefined : `${brief.product} ${brief.category}`,
    brief.market === 'GLOBAL' ? undefined : `${brief.category} ${brief.market}`,
  ]
  const appended = policy === 'broad'
    ? suffixes.map(suffix => `${brief.product ?? brief.category} ${suffix}`)
    : []
  return [...new Set([...recombined, ...appended])]
    .filter((value): value is string => value !== undefined && value.trim() !== '')
    .filter(value => !base.has(value.toLowerCase()))
    .map(query => ({ query, source: 'derived' }))
}

/**
 * Resolve the keyword phrases a brief searches.
 * @param input - stated brief fields.
 * @param category - normalized category.
 * @param market - normalized market.
 * @returns distinct phrases, never empty.
 */
function resolveKeywords(
  input: CreatorBriefInput,
  category: string,
  market: string,
): { keywords: string[]; fromUser: boolean } {
  const stated = normalizeList(input.keywords)
  // When the caller names its phrases, nothing else is searched: a narrow brief
  // must not gain vocabulary it never approved.
  if (stated.length > 0) return { keywords: stated.slice(0, 8), fromUser: true }
  const derived = [
    category,
    input.product === undefined ? undefined : `${normalizeText(input.product)} ${category}`,
    market === 'GLOBAL' ? undefined : `${category} ${market}`,
  ].filter((value): value is string => value !== undefined && value !== '')
  return { keywords: [...new Set(derived)].slice(0, 8), fromUser: false }
}

/**
 * List the brief keywords a candidate's name, handle, or URL contains.
 * @param candidate - candidate under scoring.
 * @param brief - resolved brief.
 * @returns matched keyword phrases.
 */
function matchedKeywords(candidate: Candidate, brief: CreatorBrief): string[] {
  const haystack = `${candidate.name ?? ''} ${candidate.handle ?? ''} ${candidate.url ?? ''}`.toLowerCase()
  return brief.keywords.filter(keyword => haystack.includes(keyword.toLowerCase()))
}

/**
 * Merge questions for the missing essentials into at most three.
 * @param missing - essential fields absent.
 * @returns model-facing questions.
 */
function briefQuestions(missing: readonly string[]): string[] {
  const questions: string[] = []
  if (missing.includes('category')) questions.push('Which product category or niche should the creators work in?')
  if (missing.includes('platforms')) questions.push('Which platforms should I search: TikTok, Instagram, YouTube, or several of them?')
  if (missing.includes('market')) questions.push('Which market should their audience be in? Name a country code, or say global.')
  return questions.slice(0, 3)
}

/** Normalize a platform list, dropping unknown names. */
function normalizePlatforms(values: readonly string[] | undefined): CreatorPlatform[] {
  const known: readonly CreatorPlatform[] = ['TIKTOK', 'INSTAGRAM', 'YOUTUBE']
  return [...new Set((values ?? []).map(value => value.trim().toUpperCase())
    .filter((value): value is CreatorPlatform => known.includes(value as CreatorPlatform)))]
}

/** Normalize optional string lists. */
function normalizeList(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).map(value => value.trim()).filter(value => value !== ''))]
}

/** Trim a stated text value, or return an empty string. */
function normalizeText(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** Pages from 1 to the configured count. */
function pages(count: number): number[] {
  return Array.from({ length: Math.max(1, Math.min(count, 5)) }, (_, index) => index + 1)
}

/** An optional-field map without explicit `undefined`, as `exactOptionalPropertyTypes` requires. */
type Defined<T> = { [K in keyof T]?: Exclude<T[K], undefined> }

/**
 * Drop undefined values so optional fields stay absent under `exactOptionalPropertyTypes`.
 * @param value - candidate fields.
 * @returns the same fields with undefined entries removed.
 */
function compact<T extends object>(value: T): Defined<T> {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as Defined<T>
}

/** Read a JSON object. */
function isJsonObject(value: unknown): value is { readonly [key: string]: JsonValue } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Read a non-empty string field. */
function readText(value: JsonValue | undefined): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

/** Read a finite count, accepting numeric strings. */
function readCount(value: JsonValue | undefined): number | undefined {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
  return Number.isFinite(parsed) ? parsed : undefined
}

/**
 * Parse an engagement rate defensively: values above 1 are percentages.
 * @param value - upstream `avg_engagement_rate`.
 * @returns the rate as a ratio, or undefined when unreadable.
 */
export function parseEngagementRate(value: JsonValue | undefined): number | undefined {
  const text = typeof value === 'string'
    ? value.trim().replace('%', '')
    : typeof value === 'number' ? String(value) : undefined
  if (text === undefined) return undefined
  const parsed = Number(text)
  if (!Number.isFinite(parsed) || parsed < 0) return undefined
  return parsed > 1 ? parsed / 100 : parsed
}

/** Clamp a ratio into 0..1. */
function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

/** Compare two handles, tolerating `@` prefixes and case. */
function sameHandle(left: string, right: string): boolean {
  return normalizeHandle(left) !== '' && normalizeHandle(left) === normalizeHandle(right)
}

/** Strip `@` and lowercase. */
function normalizeHandle(value: string): string {
  return value.trim().replace(/^@/, '').toLowerCase()
}

/** Compact a count for messages. */
function compactCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(Math.round(value))
}

/** Format a ratio as a percentage. */
function formatPercent(value: number): string {
  return `${(value * 100).toFixed(value * 100 >= 10 ? 0 : 1).replace(/\.0$/, '')}%`
}

/** Whole days between an ISO timestamp and now. */
function daysSince(timestamp: string, now: number): number | undefined {
  const parsed = Date.parse(timestamp)
  if (!Number.isFinite(parsed)) return undefined
  return Math.max(0, Math.floor((now - parsed) / 86_400_000))
}
