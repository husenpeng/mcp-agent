/**
 * The model-facing creator-search tools: `creator_search`, `creator_detail`,
 * and `youtube_channel`. The BFF exposes one capability per endpoint; this
 * module owns the schemas, the input limits the BFF enforces, the rendered
 * result text, and the pending-call titles a UI shows.
 * @module @tomato/creator-search/tools
 */

import type { Context } from '@tomato/cordis'
import { defineTool } from '@tomato/tools'
import type { JsonValue } from '@tomato/util-values'
import { truncateWithoutSplittingSurrogatePair } from '@tomato/output-retention'
import type { CreatorSearchClient } from './bff.ts'
import { creatorKey, FEEDBACK_REASONS } from './feedback.ts'
import type { CreatorFeedbackStore, FeedbackReason } from './feedback.ts'
import type { ContactCrawler } from './contact.ts'
import type { BriefDefaults, Candidate, ContactOptions, CreatorBriefInput, DepthLimits, QueryPolicy, ScoreWeights, ScoutResult } from './scout.ts'
import { normalizeBrief, scoreCandidate, scoutCreators } from './scout.ts'
import type { CreatorSearchResult } from './types.ts'

/** Wire name of the keyword search tool. */
export const CREATOR_SEARCH_TOOL = 'creator_search'

/** Wire name of the creator detail tool. */
export const CREATOR_DETAIL_TOOL = 'creator_detail'

/** Wire name of the YCP channel tool. */
export const YOUTUBE_CHANNEL_TOOL = 'youtube_channel'

/** Wire name of the brief-to-shortlist scouting tool. */
export const CREATOR_SCOUT_TOOL = 'creator_scout'

/** Wire name of the feedback tool. */
export const CREATOR_FEEDBACK_TOOL = 'creator_feedback'

/** Wire name of the tool that scores externally found creators. */
export const CREATOR_INGEST_TOOL = 'creator_ingest'

/** Platforms the group (Blue/KOX) API accepts, as the schema advertises them. */
const PLATFORMS = ['TIKTOK', 'INSTAGRAM', 'YOUTUBE'] as const

/** Longest keyword phrase the BFF accepts, in characters. */
export const QUERY_MAX_CHARS = 200

/** Largest 1-based result page the BFF accepts. */
export const PAGE_MAX = 100_000

/** Largest results-per-page value the BFF accepts. */
export const PAGE_SIZE_MAX = 50

/** Longest creator identifier the BFF accepts, in characters. */
export const CREATOR_ID_MAX_CHARS = 200

/** Longest YCP language code the BFF accepts, in characters. */
export const LANGUAGE_CODE_MAX_CHARS = 20

/** Default cap on the complete rendered text of one call, in characters. */
export const CREATOR_SEARCH_DEFAULT_MAX_OUTPUT_CHARS = 20_000

/** Smallest output cap a deployment may configure; below it no payload is readable. */
export const CREATOR_SEARCH_MIN_OUTPUT_CHARS = 500

/** Channels the YCP endpoint addresses: a `UC…` channel id or an `@handle`. */
const CHANNEL_PATTERN = /^(UC[A-Za-z0-9_-]{22}|@[A-Za-z0-9._-]+)$/

/** Stands after a rendered result the cap cut short. */
const TRUNCATION_NOTICE = '\n(The result was truncated at the deployed output cap; narrow the request to read the rest.)'

/** Canonical value every creator-search tool returns. */
const RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    source: { type: 'string', enum: ['blue', 'ycp'], required: true, description: 'Capability that answered.' },
    traceId: { type: 'string', required: true, description: 'BFF trace id for support requests.' },
    data: { type: 'json', required: true, description: 'Capability payload with its upstream field names.' },
    quota: {
      type: 'object',
      additionalProperties: false,
      properties: {
        month: { type: 'string', required: true },
        limit: { type: 'integer', required: true },
        used: { type: 'integer', required: true },
        remaining: { type: 'integer', required: true },
      },
    },
  },
} as const

/** Resolved settings every creator-search tool shares. */
export interface CreatorToolOptions {
  /** Client that reaches the BFF. */
  readonly client: CreatorSearchClient
  /** Cap on the complete rendered text of one call, in characters. */
  readonly maxOutputChars: number
  /** Cooperative tool-call budget attached to each definition, in milliseconds. */
  readonly timeoutMs: number
  /** Durable feedback the scout reads and the feedback tool writes. */
  readonly feedback: CreatorFeedbackStore
  /** Brief defaults the scout applies. */
  readonly defaults: BriefDefaults
  /** Per-depth search budgets. */
  readonly depths: DepthLimits
  /** Score weights. */
  readonly weights: ScoreWeights
  /** Query suffixes only the `broad` policy adds. */
  readonly suffixes: readonly string[]
  /** Default fidelity policy when the call states none. */
  readonly queryPolicy: QueryPolicy
  /** Score points one remembered acceptance adds. */
  readonly feedbackBoost: number
  /** Cooperative budget for one multi-request scout call, in milliseconds. */
  readonly scoutTimeoutMs: number
  /** Clock used for scoring ages; tests replace it. */
  readonly now?: () => number
  /** Contact crawl capability; undefined leaves missing emails unknown. */
  readonly crawler?: ContactCrawler
  /** Contact crawl limits and enablement. */
  readonly contact: ContactOptions
}

/** Which creator-search tools the deployment enables. */
export interface CreatorToolSelection {
  /** Register {@link CREATOR_SEARCH_TOOL}. */
  readonly search: boolean
  /** Register {@link CREATOR_DETAIL_TOOL}. */
  readonly detail: boolean
  /** Register {@link YOUTUBE_CHANNEL_TOOL}. */
  readonly channel: boolean
  /** Register {@link CREATOR_SCOUT_TOOL}. */
  readonly scout: boolean
  /** Register {@link CREATOR_FEEDBACK_TOOL}. */
  readonly feedback: boolean
  /** Register {@link CREATOR_INGEST_TOOL}. */
  readonly ingest: boolean
}

/**
 * Format one successful call as the text the model reads.
 * @param result - the canonical value.
 * @param maxOutputChars - cap on the complete text, in characters.
 * @returns compact JSON, short of the cap, else a cut payload plus a truncation notice.
 */
export function formatCreatorResult(result: CreatorSearchResult, maxOutputChars: number): string {
  const text = JSON.stringify(result)
  if (text.length <= maxOutputChars) return text
  const body = truncateWithoutSplittingSurrogatePair(text, Math.max(0, maxOutputChars - TRUNCATION_NOTICE.length))
  return `${body}${TRUNCATION_NOTICE}`
}

/**
 * Validate a required free-text argument the schema DSL cannot constrain.
 * @param label - model-facing argument name used in the failure.
 * @param value - the argument as the schema accepted it.
 * @param maxChars - inclusive upper bound, in characters.
 * @returns the trimmed value.
 * @throws {Error} when the trimmed value is empty or over the bound.
 */
function requireText(label: string, value: string, maxChars: number): string {
  const trimmed = value.trim()
  if (trimmed === '' || trimmed.length > maxChars) {
    throw new Error(`${label} must be between 1 and ${maxChars} characters.`)
  }
  return trimmed
}

/**
 * Validate an optional integer argument within a range.
 * @param label - model-facing argument name used in the failure.
 * @param value - the argument, or undefined when omitted.
 * @param min - inclusive lower bound.
 * @param max - inclusive upper bound.
 * @returns the value, or undefined when omitted.
 * @throws {Error} when the value is not an integer within the range.
 */
function requireInteger(label: string, value: number | undefined, min: number, max: number): number | undefined {
  if (value === undefined) return undefined
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${label} must be an integer between ${min} and ${max}.`)
  }
  return value
}

/**
 * Register the enabled creator-search tools, in the deployment's selection.
 * @param ctx - plugin context that owns the registrations.
 * @param options - resolved client, output cap, and per-call budget.
 * @param selection - which tools to register.
 */
export function applyCreatorSearchTools(ctx: Context, options: CreatorToolOptions, selection: CreatorToolSelection): void {
  if (selection.search) registerSearchTool(ctx, options)
  if (selection.detail) registerDetailTool(ctx, options)
  if (selection.channel) registerChannelTool(ctx, options)
  if (selection.scout) registerScoutTool(ctx, options)
  if (selection.feedback) registerFeedbackTool(ctx, options)
  if (selection.ingest) registerIngestTool(ctx, options)
}

/**
 * Render callback shared by the three tools.
 * @param options - resolved settings carrying the output cap.
 * @returns the renderer `defineTool` expects.
 */
function renderer(options: CreatorToolOptions) {
  return (_args: unknown, value: CreatorSearchResult): { type: 'text'; text: string }[] => [
    { type: 'text', text: formatCreatorResult(value, options.maxOutputChars) },
  ]
}

/**
 * Register the keyword search tool.
 * @param ctx - plugin context that owns the registration.
 * @param options - resolved client, output cap, and per-call budget.
 */
function registerSearchTool(ctx: Context, options: CreatorToolOptions): void {
  ctx.tools.register(defineTool({
    name: CREATOR_SEARCH_TOOL,
    description: [
      'Search TikTok, Instagram, or YouTube creators by keyword.',
      'Returns matching creators with follower count, engagement, recent content, and whether an email is on file, plus a pager.',
      'Each call spends one unit of the team\'s monthly search quota, so search with specific keywords instead of repeating the same query.',
    ].join(' '),
    parameters: {
      platform: { type: 'string', enum: PLATFORMS, required: true, description: 'Platform whose creator index to search.' },
      query: { type: 'string', required: true, description: 'Keywords to match against creator names, handles, and content; 1–200 characters.' },
      page: { type: 'integer', description: 'Result page to read, 1-based. Defaults to 1.' },
      pageSize: { type: 'integer', description: 'Results per page, 1–50. Defaults to 20.' },
    },
    output: { schema: RESULT_SCHEMA, render: renderer(options) },
    timeoutMs: options.timeoutMs,
    presentCall: args => ({
      card: 'generic',
      kind: 'search',
      title: `${CREATOR_SEARCH_TOOL} ${args.platform.toLowerCase()}: ${args.query}`,
    }),
    execute: async (args, exec) => {
      const page = requireInteger('page', args.page, 1, PAGE_MAX)
      const pageSize = requireInteger('pageSize', args.pageSize, 1, PAGE_SIZE_MAX)
      return options.client.searchBlue({
        platform: args.platform,
        query: requireText('query', args.query, QUERY_MAX_CHARS),
        ...page === undefined ? {} : { page },
        ...pageSize === undefined ? {} : { pageSize },
      }, exec.signal)
    },
  }))
}

/**
 * Register the creator detail tool.
 * @param ctx - plugin context that owns the registration.
 * @param options - resolved client, output cap, and per-call budget.
 */
function registerDetailTool(ctx: Context, options: CreatorToolOptions): void {
  ctx.tools.register(defineTool({
    name: CREATOR_DETAIL_TOOL,
    description: [
      'Read one creator\'s full profile from the group API: account facts, audience demographics, and recent video performance.',
      'Locate a YouTube creator by channel id and a TikTok or Instagram creator by handle.',
      'Each call spends one unit of the team\'s monthly search quota.',
    ].join(' '),
    parameters: {
      platform: { type: 'string', enum: PLATFORMS, required: true, description: 'Platform that owns the identifier.' },
      creatorId: {
        type: 'string',
        required: true,
        description: 'YouTube channel id starting with UC, or a TikTok/Instagram handle; 1–200 characters.',
      },
    },
    output: { schema: RESULT_SCHEMA, render: renderer(options) },
    timeoutMs: options.timeoutMs,
    presentCall: args => ({
      card: 'generic',
      kind: 'read',
      title: `${CREATOR_DETAIL_TOOL} ${args.platform.toLowerCase()}: ${args.creatorId}`,
    }),
    execute: async (args, exec) => options.client.detailBlue({
      platform: args.platform,
      creatorId: requireText('creatorId', args.creatorId, CREATOR_ID_MAX_CHARS),
    }, exec.signal),
  }))
}

/**
 * Register the YCP channel tool.
 * @param ctx - plugin context that owns the registration.
 * @param options - resolved client, output cap, and per-call budget.
 */
function registerChannelTool(ctx: Context, options: CreatorToolOptions): void {
  ctx.tools.register(defineTool({
    name: YOUTUBE_CHANNEL_TOOL,
    description: [
      'Read a YouTube channel\'s public BrandConnect data: subscriber count, region, data-sharing and YPP state, and its business email when shared.',
      'Locate the channel by id or @handle. This read does not spend the team\'s monthly search quota.',
    ].join(' '),
    parameters: {
      channel: {
        type: 'string',
        required: true,
        description: 'YouTube channel id starting with UC and 24 characters long, or an @handle.',
      },
      languageCode: {
        type: 'string',
        description: 'Language for localized fields, such as en or zh; 2–20 characters. Defaults to the BFF choice.',
      },
    },
    output: { schema: RESULT_SCHEMA, render: renderer(options) },
    timeoutMs: options.timeoutMs,
    presentCall: args => ({
      card: 'generic',
      kind: 'read',
      title: `${YOUTUBE_CHANNEL_TOOL}: ${args.channel}`,
    }),
    execute: async (args, exec) => {
      const channel = requireText('channel', args.channel, CREATOR_ID_MAX_CHARS)
      if (!CHANNEL_PATTERN.test(channel)) {
        throw new Error('channel must be a YouTube channel id starting with UC and 24 characters long, or an @handle.')
      }
      return options.client.ycpChannel({
        channel,
        ...args.languageCode === undefined
          ? {}
          : { languageCode: requireText('languageCode', args.languageCode, LANGUAGE_CODE_MAX_CHARS) },
      }, exec.signal)
    },
  }))
}

/** Brief fields the scout tool accepts, shared with the pre-flight description. */
const BRIEF_PARAMETERS = {
  client: { type: 'string', description: 'Client or brand this search is for; remembered feedback is scoped to it.' },
  product: { type: 'string', description: 'Product being promoted, when the brief names one.' },
  category: { type: 'string', description: 'Product category or niche the creators should work in.' },
  platforms: {
    type: 'array',
    items: { type: 'string', enum: PLATFORMS },
    description: 'Platforms to search: TIKTOK, INSTAGRAM, YOUTUBE.',
  },
  market: { type: 'string', description: 'Audience market as an ISO country code such as US, or GLOBAL.' },
  targetCount: { type: 'integer', description: 'Creators wanted in the shortlist, 1–50. Defaults to the deployment value.' },
  keywords: {
    type: 'array',
    items: { type: 'string' },
    description: 'Keyword phrases to search; the category, product, and market derive variants when omitted.',
  },
  followersMin: { type: 'integer', description: 'Lowest follower count to accept; defaults to the deployment band.' },
  followersMax: { type: 'integer', description: 'Highest follower count to accept; defaults to the deployment band.' },
  minEngagementRate: { type: 'number', description: 'Lowest engagement as a ratio, 0–1; defaults to the deployment floor.' },
  language: { type: 'string', description: 'Preferred content language, when the brief states one.' },
  mustHaveEmail: { type: 'boolean', description: 'When true, drop creators without a business email on file.' },
  excludeCreators: { type: 'array', items: { type: 'string' }, description: 'Handles or creator ids the caller already ruled out.' },
} as const

/** Canonical value the scout tool returns. */
const SCOUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', enum: ['ready', 'needs_brief'], required: true, description: 'Whether the brief was complete enough to search.' },
    missing: { type: 'array', items: { type: 'string' }, required: true, description: 'Essential brief fields the caller left out.' },
    assumptions: { type: 'array', items: { type: 'string' }, required: true, description: 'Defaults the run applied.' },
    questions: { type: 'array', items: { type: 'string' }, required: true, description: 'At most three questions to ask the user.' },
    brief: { type: 'json', description: 'The resolved brief when the run was ready.' },
    shortlist: { type: 'array', items: { type: 'json' }, description: 'Ranked creators with score, coverage, status, and reasons.' },
    excluded: { type: 'array', items: { type: 'json' }, description: 'Creators dropped by a gate or remembered feedback.' },
    appliedFeedback: { type: 'array', items: { type: 'json' }, description: 'Remembered decisions that shaped this run.' },
    stats: { type: 'json', description: 'Requests spent, distinct creators, and the strategy mix.' },
    caveats: { type: 'array', items: { type: 'string' }, description: 'Limits of this run, such as a short pool or a stopped strategy.' },
    escalation: { type: 'json', description: 'Crawler handoff when the shortlist stayed short of the target count.' },
    plan: { type: 'array', items: { type: 'json' }, description: 'The planned search ladder, present when the brief was incomplete.' },
  },
} as const

/** Canonical value the feedback tool returns. */
const FEEDBACK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    recorded: { type: 'array', items: { type: 'json' }, required: true, description: 'Records this call wrote.' },
    total: { type: 'integer', required: true, description: 'Remembered records that apply to the client.' },
    entries: { type: 'array', items: { type: 'json' }, required: true, description: 'Remembered records that apply to the client.' },
  },
} as const

/**
 * Register the brief-to-shortlist scouting tool.
 * @param ctx - plugin context that owns the registration.
 * @param options - resolved client, budgets, weights, and feedback.
 */
function registerScoutTool(ctx: Context, options: CreatorToolOptions): void {
  ctx.tools.register(defineTool({
    name: CREATOR_SCOUT_TOOL,
    description: [
      'Find creators for a marketing brief: search the company creator index across the stated platforms and keywords, merge what several strategies surface, enrich the strongest candidates, and rank them against the brief with evidence per candidate.',
      'When the brief lacks a category, platform list, or market, or the deployment requires more from it, this call returns the questions to ask instead of spending search quota.',
      'Each shortlisted creator carries a status: pass means every gate had a value, conditional means a gate input was missing, unverified means most inputs were missing. Report that status and the reasons; do not present a conditional creator as verified.',
      'Record every accept or reject decision with creator_feedback so the next run honors it.',
    ].join(' '),
    parameters: {
      ...BRIEF_PARAMETERS,
      depth: { type: 'string', enum: ['fast', 'standard', 'broad'], description: 'Search budget: fast checks one page, standard and broad widen the plan. Defaults to standard.' },
      queryPolicy: {
        type: 'string',
        enum: ['strict', 'balanced', 'broad'],
        description: 'How far to go beyond the stated keywords: strict searches only them, balanced adds recombinations of the stated category, product, and market, broad may also append configured suffix phrases. Defaults to the deployment value.',
      },
    },
    output: { schema: SCOUT_SCHEMA, render: (_args, value) => [{ type: 'text', text: formatJson(value, options.maxOutputChars) }] },
    timeoutMs: options.scoutTimeoutMs,
    presentCall: args => ({
      card: 'generic',
      kind: 'search',
      title: `${CREATOR_SCOUT_TOOL} ${args.category}${args.market === undefined ? '' : ` in ${args.market}`}${args.targetCount === undefined ? '' : ` ×${String(args.targetCount)}`}`,
    }),
    execute: async (args, exec) => scoutJson(await scoutCreators(
      briefInput(args),
      args.depth ?? 'standard',
      options.defaults,
      {
        client: options.client,
        feedback: options.feedback,
        limits: options.depths,
        weights: options.weights,
        suffixes: options.suffixes,
        queryPolicy: (args.queryPolicy ?? options.queryPolicy),
        feedbackBoost: options.feedbackBoost,
        ...options.crawler === undefined ? {} : { crawler: options.crawler },
        contact: options.contact,
      },
      exec.signal,
    )),
  }))
}

/**
 * Register the feedback tool that writes and lists remembered decisions.
 * @param ctx - plugin context that owns the registration.
 * @param options - resolved client and feedback store.
 */
function registerFeedbackTool(ctx: Context, options: CreatorToolOptions): void {
  ctx.tools.register(defineTool({
    name: CREATOR_FEEDBACK_TOOL,
    description: [
      'Remember a decision about creators so later scouting runs honor it: an accepted creator ranks higher, a rejected one is not offered again, a watched one stays flagged.',
      'Record the user\'s verdict with its reasons immediately after they give it; the record is durable and scoped to the stated client.',
      'Omit entries to read the decisions remembered for a client.',
    ].join(' '),
    parameters: {
      entries: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            platform: { type: 'string', enum: PLATFORMS, required: true, description: 'Platform that owns the creator id.' },
            creatorId: { type: 'string', required: true, description: 'Creator id or handle as the scout reported it.' },
            handle: { type: 'string', description: 'Handle, when known.' },
            name: { type: 'string', description: 'Display name, when known.' },
            decision: { type: 'string', enum: ['accept', 'reject', 'watch'], required: true, description: 'Verdict to remember.' },
            reasons: { type: 'array', items: { type: 'string' }, description: 'Reasons from the documented set: brand-safety, audience-mismatch, price, content-quality, competitor, already-worked, other.' },
            note: { type: 'string', description: 'Free-form note from the reviewer.' },
            client: { type: 'string', description: 'Client the decision applies to; omit to apply it to every client on this host.' },
          },
        },
        description: 'Decisions to remember; omit to list the decisions already remembered.',
      },
      client: { type: 'string', description: 'Client whose remembered decisions to list.' },
    },
    output: { schema: FEEDBACK_SCHEMA, render: (_args, value) => [{ type: 'text', text: formatJson(value, options.maxOutputChars) }] },
    timeoutMs: options.timeoutMs,
    presentCall: () => ({ card: 'generic', kind: 'read', title: CREATOR_FEEDBACK_TOOL }),
    execute: async (args) => {
      const client = args.client?.trim() === '' ? undefined : args.client
      const recorded = []
      for (const entry of args.entries ?? []) {
        recorded.push(await options.feedback.record({
          platform: entry.platform,
          creatorId: entry.creatorId.trim(),
          decision: entry.decision,
          reasons: (entry.reasons ?? []).filter((value): value is FeedbackReason => FEEDBACK_REASONS.includes(value as FeedbackReason)),
          ...entry.handle === undefined ? {} : { handle: entry.handle },
          ...entry.name === undefined ? {} : { name: entry.name },
          ...entry.note === undefined ? {} : { note: entry.note },
          ...entry.client === undefined ? {} : { client: entry.client },
        }))
      }
      return {
        recorded: recorded.map(toJson),
        total: options.feedback.list(client).length,
        entries: options.feedback.list(client).map(toJson),
      }
    },
  }))
}

/**
 * Map the tool arguments into the brief input the scout normalizes.
 * @param args - schema-validated tool arguments.
 * @returns the stated brief fields.
 */
function briefInput(args: {
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
  readonly queryPolicy?: QueryPolicy
}): CreatorBriefInput {
  return {
    ...args.category === undefined ? {} : { category: args.category },
    ...args.platforms === undefined ? {} : { platforms: args.platforms },
    ...args.market === undefined ? {} : { market: args.market },
    ...args.targetCount === undefined ? {} : { targetCount: args.targetCount },
    ...args.keywords === undefined ? {} : { keywords: args.keywords },
    ...args.followersMin === undefined ? {} : { followersMin: args.followersMin },
    ...args.followersMax === undefined ? {} : { followersMax: args.followersMax },
    ...args.minEngagementRate === undefined ? {} : { minEngagementRate: args.minEngagementRate },
    ...args.language === undefined ? {} : { language: args.language },
    ...args.mustHaveEmail === undefined ? {} : { mustHaveEmail: args.mustHaveEmail },
    ...args.excludeCreators === undefined ? {} : { excludeCreators: args.excludeCreators },
    ...args.client === undefined ? {} : { client: args.client },
    ...args.product === undefined ? {} : { product: args.product },
  }
}

/** Canonical value the scout tool declares, matching {@link SCOUT_SCHEMA}. */
interface ScoutToolValue {
  readonly status: 'ready' | 'needs_brief'
  readonly missing: string[]
  readonly assumptions: string[]
  readonly questions: string[]
  readonly brief?: JsonValue
  readonly shortlist?: JsonValue[]
  readonly excluded?: JsonValue[]
  readonly appliedFeedback?: JsonValue[]
  readonly stats?: JsonValue
  readonly caveats?: string[]
  readonly escalation?: JsonValue
  readonly plan?: JsonValue[]
}

/**
 * Project a scout result into the canonical JSON the output schema declares.
 * @param result - the scout outcome.
 * @returns the lossless JSON value.
 */
function scoutJson(result: ScoutResult): ScoutToolValue {
  if (result.status !== 'ready') {
    return {
      status: result.status,
      missing: [...result.missing],
      assumptions: [...result.assumptions],
      questions: [...result.questions],
      plan: result.plan.map(toJson),
    }
  }
  return {
    status: result.status,
    missing: [],
    assumptions: [...result.assumptions],
    questions: [],
    brief: toJson(result.brief),
    shortlist: result.shortlist.map(toJson),
    excluded: result.excluded.map(toJson),
    appliedFeedback: result.appliedFeedback.map(toJson),
    stats: toJson(result.stats),
    caveats: [...result.caveats],
    ...result.escalation === undefined ? {} : { escalation: toJson(result.escalation) },
    plan: [],
  }
}

/**
 * Render one value as compact JSON, short of the cap, else cut with a notice.
 * @param value - canonical value to render.
 * @param maxOutputChars - cap on the complete text, in characters.
 * @returns the model-facing text.
 */
function formatJson(value: JsonValue, maxOutputChars: number): string {
  const text = JSON.stringify(value)
  if (text.length <= maxOutputChars) return text
  const body = truncateWithoutSplittingSurrogatePair(text, Math.max(0, maxOutputChars - TRUNCATION_NOTICE.length))
  return `${body}${TRUNCATION_NOTICE}`
}

/**
 * Snapshot one value as lossless JSON.
 * @param value - any JSON-serializable value.
 * @returns the canonical JSON value.
 */
function toJson(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue
}

/** One externally found creator, as the crawler path reports it. */
const INGEST_ENTRY_PROPERTIES = {
  platform: { type: 'string', enum: PLATFORMS, required: true, description: 'Platform that owns the identifier.' },
  creatorId: { type: 'string', required: true, description: 'Handle or platform id you verified.' },
  handle: { type: 'string', description: 'Handle, when it differs from the id.' },
  name: { type: 'string', description: 'Display name, when known.' },
  country: { type: 'string', description: 'Audience or creator country as an ISO code, when known.' },
  followers: { type: 'integer', description: 'Follower count as reported by the page you read.' },
  engagementRate: { type: 'number', description: 'Engagement rate as a ratio, 0–1.' },
  lastPublishedAt: { type: 'string', description: 'Last post time as ISO 8601.' },
  hasEmail: { type: 'boolean', description: 'Whether a business email is publicly on file.' },
  url: { type: 'string', description: 'Profile URL you read.' },
} as const

/** Canonical value the ingest tool returns. */
const INGEST_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', enum: ['ready', 'needs_brief'], required: true },
    missing: { type: 'array', items: { type: 'string' }, required: true },
    questions: { type: 'array', items: { type: 'string' }, required: true },
    shortlist: { type: 'array', items: { type: 'json' }, required: true },
    excluded: { type: 'array', items: { type: 'json' }, required: true },
  },
} as const

/**
 * Register the tool that scores creators found outside the BFF, such as
 * profiles a web search and fetch verified.
 * @param ctx - plugin context that owns the registration.
 * @param options - resolved client, weights, and feedback.
 */
function registerIngestTool(ctx: Context, options: CreatorToolOptions): void {
  ctx.tools.register(defineTool({
    name: CREATOR_INGEST_TOOL,
    description: [
      'Score creators you found outside the creator index, so crawled profiles are judged by the same brief, gates, and remembered decisions as a scout run.',
      'Pass the same brief you scouted with and one entry per creator whose page you actually read; leave unknown fields out rather than guessing.',
    ].join(' '),
    parameters: {
      ...BRIEF_PARAMETERS,
      entries: {
        type: 'array',
        items: { type: 'object', additionalProperties: false, properties: INGEST_ENTRY_PROPERTIES },
        required: true,
        description: 'Creators found outside the index, with the values the page stated.',
      },
    },
    output: { schema: INGEST_SCHEMA, render: (_args, value) => [{ type: 'text', text: formatJson(value, options.maxOutputChars) }] },
    timeoutMs: options.timeoutMs,
    presentCall: args => ({ card: 'generic', kind: 'read', title: `${CREATOR_INGEST_TOOL} ${args.category ?? ''}`.trim() }),
    execute: (args) => {
      const decision = normalizeBrief(briefInput(args), options.defaults)
      if (decision.brief === undefined) {
        return Promise.resolve({ status: 'needs_brief' as const, missing: [...decision.missing], questions: [...decision.questions], shortlist: [], excluded: [] })
      }
      const brief = decision.brief
      const feedback = options.feedback.byCreator(brief.client)
      const excluded: { key: string; reason: string }[] = []
      const scored = []
      for (const entry of args.entries) {
        const candidate: Candidate = {
          platform: entry.platform,
          creatorId: entry.creatorId.trim(),
          queries: ['crawled'],
          traces: [],
          ...entry.handle === undefined ? {} : { handle: entry.handle },
          ...entry.name === undefined ? {} : { name: entry.name },
          ...entry.country === undefined ? {} : { country: entry.country.toUpperCase() },
          ...entry.followers === undefined ? {} : { followers: entry.followers },
          ...entry.engagementRate === undefined ? {} : { engagementRate: entry.engagementRate },
          ...entry.lastPublishedAt === undefined ? {} : { lastPublishedAt: entry.lastPublishedAt },
          ...entry.hasEmail === undefined ? {} : { hasEmail: entry.hasEmail },
          ...entry.url === undefined ? {} : { url: entry.url },
        }
        const remembered = feedback.get(creatorKey(candidate.platform, candidate.creatorId))
        if (remembered?.decision === 'reject') {
          excluded.push({ key: creatorKey(candidate.platform, candidate.creatorId), reason: `remembered rejection: ${remembered.reasons.join(', ') || 'no reason recorded'}` })
          continue
        }
        const entryScore = scoreCandidate(candidate, brief, options.weights, (options.now ?? Date.now)())
        if ('gate' in entryScore) excluded.push({ key: entryScore.key, reason: entryScore.reason })
        else scored.push(entryScore)
      }
      scored.sort((left, right) => right.score - left.score)
      return Promise.resolve({
        status: 'ready' as const,
        missing: [],
        questions: [],
        shortlist: scored.slice(0, brief.targetCount).map(toJson),
        excluded: excluded.map(toJson),
      })
    },
  }))
}
