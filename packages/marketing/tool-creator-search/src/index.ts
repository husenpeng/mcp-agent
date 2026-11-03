/**
 * Model-facing creator tools over the company BFF's `/api/v1/creator-search/*`
 * endpoints, plus the scouting layer that turns a brief into a ranked shortlist
 * and remembers the decisions a reviewer makes.
 *
 * The BFF exposes single-point capabilities — a group (Blue/KOX) keyword
 * search, a group creator detail, and a YCP channel detail — and this plugin
 * decides how the model reaches them. The signed-in Desktop session is the
 * request credential: it arrives as the BFF's `session_id` cookie, so a profile
 * without a shell session fails its first call with sign-in guidance rather
 * than sending an anonymous request.
 * @module @tomato/tool-creator-search
 */

import type { Context } from '@tomato/cordis'
import { launchEnvironmentOf } from '@tomato/launch-environment'
import z from '@tomato/schemastery'
import type {} from '@tomato/storage-domain'
import type {} from '@tomato/web'
import type {} from '@tomato/system-prompt'
import type {} from '@tomato/tools'
import { CreatorSearchClient, CREATOR_SEARCH_DEFAULT_TIMEOUT_MS } from './bff.ts'
import { creatorFeedbackDomainSpec, CreatorFeedbackStore } from './feedback.ts'
import {
  applyCreatorSearchTools,
  CREATOR_SEARCH_DEFAULT_MAX_OUTPUT_CHARS,
  CREATOR_SEARCH_MIN_OUTPUT_CHARS,
  PAGE_SIZE_MAX,
} from './tools.ts'
import { crawlerFromWeb } from './contact.ts'
import type { ContactCrawler } from './contact.ts'
import type { DepthLimits, ScoutLimits } from './scout.ts'
import { MAX_PLAN_CALLS } from './scout.ts'

export {
  CREATOR_SEARCH_DEFAULT_TIMEOUT_MS,
  CREATOR_SEARCH_PATHS,
  CREATOR_SEARCH_SESSION_COOKIE,
  CreatorSearchClient,
  CreatorSearchError,
} from './bff.ts'
export type {
  BlueDetailRequest,
  BlueSearchRequest,
  CreatorSearchClientOptions,
  CreatorSearchFailure,
  YcpChannelRequest,
} from './bff.ts'
export { contactQueries, crawlContact, crawlerFromWeb, firstEmail } from './contact.ts'
export type { ContactCrawler, ContactLimits, ContactOutcome } from './contact.ts'
export {
  creatorFeedbackDomainSpec,
  CreatorFeedbackStore,
  creatorKey,
  FEEDBACK_REASONS,
  feedbackRecordSchema,
  feedbackStorageKey,
} from './feedback.ts'
export type {
  CreatorFeedbackIndex,
  FeedbackDecision,
  FeedbackInput,
  FeedbackReason,
  FeedbackRecord,
} from './feedback.ts'
export {
  applyCreatorSearchTools,
  CREATOR_DETAIL_TOOL,
  CREATOR_FEEDBACK_TOOL,
  CREATOR_INGEST_TOOL,
  CREATOR_SCOUT_TOOL,
  CREATOR_SEARCH_DEFAULT_MAX_OUTPUT_CHARS,
  CREATOR_SEARCH_MIN_OUTPUT_CHARS,
  CREATOR_SEARCH_TOOL,
  CREATOR_ID_MAX_CHARS,
  LANGUAGE_CODE_MAX_CHARS,
  PAGE_MAX,
  PAGE_SIZE_MAX,
  QUERY_MAX_CHARS,
  formatCreatorResult,
  YOUTUBE_CHANNEL_TOOL,
} from './tools.ts'
export type { CreatorToolOptions, CreatorToolSelection } from './tools.ts'
export {
  candidatesFromSearch,
  enrichFromChannel,
  enrichFromDetail,
  MAX_PLAN_CALLS,
  mergeCandidate,
  normalizeBrief,
  parseEngagementRate,
  planSearches,
  scoreCandidate,
  scoutCreators,
} from './scout.ts'
export type {
  BriefDecision,
  ContactOptions,
  BriefDefaults,
  Candidate,
  CreatorBrief,
  CreatorBriefInput,
  DepthLimits,
  GateFailure,
  ScoutDepth,
  ScoutLimits,
  ScoutNeedsBrief,
  ScoutOptions,
  ScoutReady,
  ScoutResult,
  ScoutStats,
  ScoredCandidate,
  ScoreWeights,
  SearchStep,
} from './scout.ts'
export type {
  CreatorErrorEnvelope,
  CreatorPlatform,
  CreatorQuota,
  CreatorSearchResult,
  CreatorSuccessEnvelope,
  CreatorSuccessMeta,
} from './types.ts'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'tool-creator-search'

/** The registries and durable storage this plugin contributes through. */
export const inject = ['tools', 'storageDomain', 'systemPrompt']

/** Environment variable naming the BFF origin when the composition omits `baseURL`. */
export const CREATOR_SEARCH_GATEWAY_ENV = 'TOMATO_SEARCH_GATEWAY_URL'

/** Fallback environment variable naming the same company BFF origin. */
export const TOMATO_WEB_ENV = 'TOMATO_WEB_URL'

/** Prompt section that states the brief-first and evidence discipline. */
export const CREATOR_SCOUT_SECTION = 'tool:creator_scout'

/**
 * Prompt-section order. The section sits with the other tool guidance, after
 * the web-search guidance at 2000 and before later tool-specific blocks.
 */
const SCOUT_SECTION_ORDER = 2050

/** The Desktop session service the shell publishes on the Host context. */
export interface DesktopSessionService {
  /**
   * Read the current auth session.
   * @returns the auth-service session id, or undefined after sign-out.
   */
  sessionId(): string | undefined
}

/** One depth's search budget; omitted fields take the built-in default for that depth. */
export interface DepthLimitConfig {
  /** Most BFF search requests one call may send. */
  maxSearchCalls?: number
  /** Pages read per keyword query. */
  pagesPerQuery?: number
  /** Results requested per page. */
  pageSize?: number
  /** Most candidates enriched through the detail endpoint. */
  enrichLimit?: number
  /** Pool size as a multiple of `targetCount` before enrichment stops searching. */
  poolFactor?: number
}

/** Built-in budgets the depth overrides start from. */
const DEPTH_DEFAULTS: DepthLimits = {
  fast: { maxSearchCalls: 3, pagesPerQuery: 1, pageSize: 20, enrichLimit: 0, poolFactor: 2 },
  standard: { maxSearchCalls: 8, pagesPerQuery: 2, pageSize: 20, enrichLimit: 10, poolFactor: 2 },
  broad: { maxSearchCalls: 16, pagesPerQuery: 3, pageSize: 40, enrichLimit: 20, poolFactor: 3 },
}

/** Plugin config (all optional — `apply` fills environment and constant defaults). */
export interface Config {
  /** BFF origin such as `https://test.tomatoai.vip`. Falls back to `$TOMATO_SEARCH_GATEWAY_URL`, then `$TOMATO_WEB_URL`. */
  baseURL?: string
  /** End-to-end budget for one BFF request, in milliseconds. Defaults to 60 seconds. */
  timeoutMs?: number
  /** Cap on the complete rendered text of one call, in characters. Defaults to 20000. */
  maxOutputChars?: number
  /** Budget for one multi-request scout call, in milliseconds. Defaults to 300 seconds. */
  scoutTimeoutMs?: number
  /** Register `creator_search`. Defaults to true. */
  search?: boolean
  /** Register `creator_detail`. Defaults to true. */
  detail?: boolean
  /** Register `youtube_channel`. Defaults to true. */
  channel?: boolean
  /** Register `creator_scout`. Defaults to true. */
  scout?: boolean
  /** Register `creator_feedback`. Defaults to true. */
  feedback?: boolean
  /** Register `creator_ingest` for creators found outside the index. Defaults to true. */
  ingest?: boolean
  /** Follower band floor a brief falls back to. Defaults to 10000. */
  defaultFollowersMin?: number
  /** Follower band ceiling a brief falls back to. Defaults to 200000. */
  defaultFollowersMax?: number
  /** Engagement floor a brief falls back to, as a ratio. Defaults to 0.01. */
  defaultMinEngagementRate?: number
  /** Creators a brief asks for when it states none. Defaults to 10. */
  defaultTargetCount?: number
  /** Overrides for the `fast` depth budget. */
  depthFast?: DepthLimitConfig
  /** Overrides for the `standard` depth budget. */
  depthStandard?: DepthLimitConfig
  /** Overrides for the `broad` depth budget. */
  depthBroad?: DepthLimitConfig
  /** Query suffixes only the `broad` policy appends, such as `review`. Defaults to no suffixes. */
  querySuffixes?: string[]
  /**
   * Default fidelity policy. `strict` searches only the stated keywords,
   * `balanced` recombines the stated fields, and `broad` may append the
   * configured suffix phrases. Defaults to `balanced`.
   */
  queryPolicy?: 'strict' | 'balanced' | 'broad'
  /** Score points one remembered acceptance adds. Defaults to 10. */
  feedbackBoost?: number
  /** Weight of follower-band fit in the score. Defaults to 25. */
  weightFollowers?: number
  /** Weight of engagement rate in the score. Defaults to 25. */
  weightEngagement?: number
  /** Weight of keyword evidence in the score. Defaults to 20. */
  weightKeywords?: number
  /** Weight of market match in the score. Defaults to 15. */
  weightMarket?: number
  /** Weight of publishing recency in the score. Defaults to 10. */
  weightRecency?: number
  /** Weight of contactability in the score. Defaults to 5. */
  weightContactability?: number
  /** Crawl missing business emails for shortlisted creators. Defaults to true. */
  contactEnrichment?: boolean
  /** Most shortlisted creators one call crawls. Defaults to 5. */
  contactLimit?: number
  /** Search requests one creator's crawl may spend. Defaults to 2. */
  contactQueriesPerCreator?: number
  /** Page reads one creator's crawl may spend. Defaults to 2. */
  contactFetchesPerCreator?: number
  /** Budget for one creator's crawl, in milliseconds. Defaults to 20 seconds. */
  contactTimeoutMs?: number
}

const DEPTH_LIMIT_SCHEMA = z.object({
  maxSearchCalls: z.natural().min(1).max(MAX_PLAN_CALLS),
  pagesPerQuery: z.natural().min(1).max(5),
  pageSize: z.natural().min(1).max(PAGE_SIZE_MAX),
  enrichLimit: z.natural().min(0).max(MAX_PLAN_CALLS),
  poolFactor: z.natural().min(1).max(10),
})

export const Config: z<Config> = z.object({
  baseURL: z.string(),
  timeoutMs: z.natural().min(1).default(CREATOR_SEARCH_DEFAULT_TIMEOUT_MS),
  maxOutputChars: z.natural().min(CREATOR_SEARCH_MIN_OUTPUT_CHARS).default(CREATOR_SEARCH_DEFAULT_MAX_OUTPUT_CHARS),
  scoutTimeoutMs: z.natural().min(1).default(300_000),
  search: z.boolean().default(true),
  detail: z.boolean().default(true),
  channel: z.boolean().default(true),
  scout: z.boolean().default(true),
  feedback: z.boolean().default(true),
  ingest: z.boolean().default(true),
  defaultFollowersMin: z.natural().min(0).default(10_000),
  defaultFollowersMax: z.natural().min(1).default(200_000),
  defaultMinEngagementRate: z.number().min(0).max(1).default(0.01),
  defaultTargetCount: z.natural().min(1).max(50).default(10),
  depthFast: DEPTH_LIMIT_SCHEMA,
  depthStandard: DEPTH_LIMIT_SCHEMA,
  depthBroad: DEPTH_LIMIT_SCHEMA,
  querySuffixes: z.array(z.string()).default([]),
  queryPolicy: z.union(['strict', 'balanced', 'broad']).default('balanced'),
  feedbackBoost: z.natural().min(0).max(50).default(10),
  weightFollowers: z.natural().min(0).default(25),
  weightEngagement: z.natural().min(0).default(25),
  weightKeywords: z.natural().min(0).default(20),
  weightMarket: z.natural().min(0).default(15),
  weightRecency: z.natural().min(0).default(10),
  weightContactability: z.natural().min(0).default(5),
  contactEnrichment: z.boolean().default(true),
  contactLimit: z.natural().min(0).max(20).default(5),
  contactQueriesPerCreator: z.natural().min(1).max(3).default(2),
  contactFetchesPerCreator: z.natural().min(0).max(3).default(2),
  contactTimeoutMs: z.natural().min(1).default(20_000),
})

/** Config after schemastery filled every defaulted field. */
type ResolvedConfig = Config & Required<Omit<Config, 'baseURL' | 'depthFast' | 'depthStandard' | 'depthBroad'>>

/**
 * Register the enabled creator tools, the scout, and its durable feedback store.
 * The tools stay registered when the origin or the session is missing; each
 * call then fails with the guidance that fixes it, instead of the model seeing
 * an empty toolset whose absence it cannot explain.
 * @param ctx - plugin context; the Host publishes `desktopSession` on it.
 * @param config - loader-validated plugin configuration.
 */
export async function apply(ctx: Context, config: Config): Promise<void> {
  const resolved = config as ResolvedConfig
  const domain = await ctx.storageDomain.open(creatorFeedbackDomainSpec)
  ctx.effect(() => () => domain.close(), 'tool-creator-search.feedbackDomain')

  const weights = {
    followers: resolved.weightFollowers,
    engagement: resolved.weightEngagement,
    keywords: resolved.weightKeywords,
    market: resolved.weightMarket,
    recency: resolved.weightRecency,
    contactability: resolved.weightContactability,
  }
  if (weights.followers + weights.engagement + weights.keywords + weights.market + weights.recency + weights.contactability === 0) {
    throw new Error('tool-creator-search: at least one score weight must be above zero')
  }

  const web = ctx.get('web')
  const crawler: ContactCrawler | undefined = web === undefined ? undefined : crawlerFromWeb(web)

  applyCreatorSearchTools(ctx, {
    client: new CreatorSearchClient({
      baseURL: resolveBaseURL(ctx, resolved.baseURL),
      timeoutMs: resolved.timeoutMs,
      sessionId: () => publishedSessionId(ctx),
    }),
    feedback: new CreatorFeedbackStore(domain.table('feedback')),
    defaults: {
      followersMin: resolved.defaultFollowersMin,
      followersMax: resolved.defaultFollowersMax,
      minEngagementRate: resolved.defaultMinEngagementRate,
      targetCount: resolved.defaultTargetCount,
    },
    depths: {
      fast: resolveDepth('fast', resolved.depthFast),
      standard: resolveDepth('standard', resolved.depthStandard),
      broad: resolveDepth('broad', resolved.depthBroad),
    },
    weights,
    suffixes: resolved.querySuffixes,
    queryPolicy: resolved.queryPolicy,
    feedbackBoost: resolved.feedbackBoost,
    maxOutputChars: resolved.maxOutputChars,
    timeoutMs: resolved.timeoutMs,
    scoutTimeoutMs: resolved.scoutTimeoutMs,
    ...crawler === undefined ? {} : { crawler },
    contact: {
      enabled: resolved.contactEnrichment,
      limit: resolved.contactLimit,
      queriesPerCreator: resolved.contactQueriesPerCreator,
      fetchesPerCreator: resolved.contactFetchesPerCreator,
      timeoutMs: resolved.contactTimeoutMs,
    },
  }, {
    search: resolved.search,
    detail: resolved.detail,
    channel: resolved.channel,
    scout: resolved.scout,
    feedback: resolved.feedback,
    ingest: resolved.ingest,
  })

  if (resolved.scout) {
    ctx.systemPrompt.section({
      name: CREATOR_SCOUT_SECTION,
      order: SCOUT_SECTION_ORDER,
      text: [
        'When the user asks to find creators, settle the brief before searching: category, platforms, and market, plus a target count when they care about one.',
        'Ask at most three questions at once, and never invent an answer; creator_scout returns the questions itself when an essential field is missing.',
        'Report every shortlisted creator with its evidence status: pass means each gate had a value, conditional means a gate input was missing, unverified means most inputs were missing. Never present a conditional or unverified creator as verified.',
        'Record each accept, reject, or watch decision with creator_feedback as soon as the user gives it, with the reason; earlier decisions then shape later runs.',
      ].join(' '),
    })
  }
}

/**
 * Resolve one depth's limits from its built-in budget and the deployment overrides.
 * @param depth - depth name.
 * @param override - configured override, when present.
 * @returns the resolved limits.
 */
function resolveDepth(depth: keyof DepthLimits, override: DepthLimitConfig | undefined): ScoutLimits {
  const base = DEPTH_DEFAULTS[depth]
  const resolved: ScoutLimits = {
    maxSearchCalls: Math.min(MAX_PLAN_CALLS, override?.maxSearchCalls ?? base.maxSearchCalls),
    pagesPerQuery: override?.pagesPerQuery ?? base.pagesPerQuery,
    pageSize: override?.pageSize ?? base.pageSize,
    enrichLimit: override?.enrichLimit ?? base.enrichLimit,
    poolFactor: override?.poolFactor ?? base.poolFactor,
  }
  return resolved
}

/**
 * Resolve the BFF origin: an explicit config value wins over the environment.
 * @param ctx - plugin context carrying the launch environment.
 * @param configured - the composition's `baseURL`, when it states one.
 * @returns the origin, or an empty string when no source states one.
 * @throws {Error} when a stated origin is not an absolute URL.
 */
function resolveBaseURL(ctx: Context, configured: string | undefined): string {
  const environment = launchEnvironmentOf(ctx)
  const stated = [
    configured,
    environment.get(CREATOR_SEARCH_GATEWAY_ENV)?.value,
    environment.get(TOMATO_WEB_ENV)?.value,
  ].find(value => value !== undefined && value.trim() !== '')
  if (stated === undefined) return ''
  const origin = stated.trim()
  if (!URL.canParse(origin)) {
    throw new Error(`tool-creator-search: the BFF origin must be an absolute URL, received ${JSON.stringify(origin)}`)
  }
  return origin
}

/**
 * Read the auth session the Desktop shell published to the Host.
 * @param ctx - plugin context; the Host provides `desktopSession` on it.
 * @returns the current session id, or undefined when signed out or absent.
 */
function publishedSessionId(ctx: Context): string | undefined {
  const service = ctx.get('desktopSession') as DesktopSessionService | undefined
  const value = service?.sessionId()
  return typeof value === 'string' && value !== '' ? value : undefined
}
