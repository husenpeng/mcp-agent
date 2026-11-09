/**
 * Configuration schema and provider-profile validation for the pi-ai adapter.
 * Profiles are a dict keyed by provider route, so the composition base and a
 * user-settings layer merge per provider and the route set is structural.
 *
 * A route key is not required to name an installed pi-ai provider. When it does,
 * that provider's endpoint, protocol, display name, and model catalog are the
 * profile's defaults and the profile overrides them field by field; when it does
 * not, the profile is the whole provider declaration. Stored reads retain
 * catalog diagnostics beside serviceable models; writes validate every changed
 * provider before persistence. Self-contained profile constraints apply to both.
 *
 * @module @tomato/llm-pi-ai/config
 */
import type { Volatile } from '@tomato/cordis'

import type { CacheRetention, ChatTemplateKwargValue, ModelThinkingLevel, Provider, ThinkingBudgets, Transport } from '@earendil-works/pi-ai'
import z from '@tomato/schemastery'
import { credentialRef } from '@tomato/credentials'
import type { CredentialRef } from '@tomato/credentials'
import { MAX_TIMER_DELAY_MS } from '@tomato/timeout'
import { resolveRetryPolicy, RetryPolicySchema } from '@tomato/llm'
import type { ResolvedRetryPolicy, RetryPolicyConfig } from '@tomato/llm'
import { deepEqualJson } from '@tomato/util-values'
import {
  CACHE_CONTROL_FORMATS,
  CHAT_TEMPLATE_VARS,
  MAX_TOKENS_FIELDS,
  MODALITIES,
  PiAiCatalogError,
  resolveRouteModels,
  SUPPORTED_THINKING_FORMATS,
  THINKING_LEVELS,
  THINKING_TOKEN_BUDGET_FIELDS,
} from './catalog.ts'
import type {
  PiAiCompatProfile,
  PiAiModality,
  PiAiModelOverride,
  PiAiModelProfile,
  PiAiReasoningEfforts,
  RouteCatalog,
} from './catalog.ts'
import { buildProvider, supportedProtocols } from './provider.ts'

/** Default maximum idle interval while an adapter stream read is outstanding. */
export const DEFAULT_STREAM_IDLE_TIMEOUT_MS = 300_000

/**
 * Default request-level bound on base64-encoded image payload. Every image in
 * history is re-encoded into every request body, so an unbounded conversation
 * eventually exceeds a provider or gateway request-size cap and the session
 * can never complete another request. The 20MiB default admits fifteen 1MiB
 * request versions after base64 expansion and reserves request capacity for
 * system prompts, history, tools, and JSON.
 * Deployments behind stricter gateways lower it per route.
 */
export const DEFAULT_MAX_REQUEST_IMAGE_BYTES = 20 * 1024 * 1024
/** Default total-pixel budget preserves the complete 2048px normalized attachment. */
export const DEFAULT_REQUEST_IMAGE_PIXEL_BUDGET = 2048 * 2048
/** Default raw encoded-byte target before inline base64 expansion; the smallest quality-ladder output is used when no quality fits. */
export const DEFAULT_REQUEST_IMAGE_MAX_BYTES = 1024 * 1024

/** Context capacity assumed for a model neither configuration nor the catalog sizes. */
export const DEFAULT_CONTEXT_WINDOW = 1_000_000

/** Output capability assumed for a model neither configuration nor the catalog sizes. */
export const DEFAULT_MAX_TOKENS = 128_000

/**
 * Modalities assumed for a model neither configuration nor the catalog
 * declares. Text is the floor every supported protocol certainly carries, so
 * this is the absence of a declaration rather than a guess at the endpoint:
 * nothing can interrogate a gateway for its modalities, and the two wrong
 * answers do not cost the same. Under-claiming refuses the image before it is
 * attached, naming the model. Over-claiming admits one the provider then
 * rejects mid-turn, after the message is durable, leaving the session
 * repeating a request that cannot succeed.
 */
export const DEFAULT_INPUT: readonly PiAiModality[] = ['text']

export type {
  PiAiCompatProfile,
  PiAiModality,
  PiAiModelOverride,
  PiAiModelProfile,
  PiAiReasoningEfforts,
  PiAiThinkingFormat,
} from './catalog.ts'

/** Configuration for one pi-ai provider route; the `providers` dict key IS the route. */
export interface PiAiProviderProfile {
  /** Credential reference (environment-variable name) resolved per request through `ctx.credentials`. */
  apiKeyEnv?: string
  /** Name shown by configuration surfaces; defaults to the route key. */
  displayName?: string
  /**
   * Wire protocol every model on this route speaks. Omission keeps each
   * installed catalog model's own protocol, which is why a catalog route needs
   * no protocol at all; a route the catalog does not ship must name one.
   */
  api?: string
  /** Endpoint for this route's models; defaults to the installed catalog's endpoint. */
  baseURL?: string
  /**
   * This route's model catalog. Omission serves the installed catalog for the
   * route unchanged; an explicit list replaces it, each entry defaulting its
   * unset fields from the installed model of the same id.
   */
  models?: PiAiModelProfile[]
  /**
   * Installed-catalog customizations by model id: each entry reshapes that
   * one model with the same fields a {@link models} entry takes, while the
   * rest of the catalog keeps serving untouched. Only meaningful on a catalog
   * route with no `models` list — `models` already replaces the catalog, so
   * an override beside it, on a route the catalog does not ship, or naming a
   * model the catalog does not describe is refused rather than skipped.
   */
  modelOverrides?: Record<string, PiAiModelOverride>
  /**
   * pi-ai wire-compatibility switches defaulting every model on this route
   * whose protocol declares them; each model's own `compat` overrides per
   * field. What neither sets keeps the installed catalog entry's value, then
   * pi-ai's own detection. A switch no model on the route could read is
   * refused rather than left looking applied.
   */
  compat?: PiAiCompatProfile
  /**
   * Context capacity for a model this route lists that neither the entry nor
   * the installed catalog sizes (default 1,000,000). A guess by construction, so
   * a deployment whose gateway serves smaller models corrects it here.
   */
  defaultContextWindow?: number
  /**
   * Output capability for a model this route lists that neither the entry nor
   * the installed catalog sizes (default 128,000). This sizes the model; it
   * never becomes a per-request cap on its own.
   */
  defaultMaxTokens?: number
  /**
   * Request modalities for a model this route lists that neither its entry's
   * {@link PiAiModelProfile.input} nor the installed catalog declares (default
   * `[text]`). A fallback like the capacities above, not an override: a
   * catalog model keeps the modalities the catalog records for it, and this
   * value never narrows one. A gateway serving vision models the catalog does
   * not describe declares `[text, image]` once here instead of on every entry.
   * Unlike an entry's list, this one may not be empty — nothing sits below it
   * to answer instead.
   */
  defaultInput?: PiAiModality[]
  /** Provider request headers, validated against Fetch when the profile resolves; Harness attribution wins reserved names. */
  headers?: Record<string, string>
  /** Provider-neutral pi-ai reasoning level. */
  reasoning?: ModelThinkingLevel
  /** Token budgets used by reasoning providers that support them. */
  thinkingBudgets?: ThinkingBudgets
  /** Prompt-cache retention preference. */
  cacheRetention?: CacheRetention
  /** Streaming transport preference. */
  transport?: Transport
  /** HTTP/provider SDK timeout in milliseconds. */
  timeoutMs?: number
  /** WebSocket connection timeout in milliseconds. */
  websocketConnectTimeoutMs?: number
  /** Maximum provider idle time while one stream read is outstanding. */
  streamIdleTimeoutMs?: number
  /**
   * Maximum base64-encoded image payload per request. When a request's
   * accumulated images exceed it, the oldest images are replaced by text
   * placeholders until the request fits, so a long session keeps completing
   * requests instead of being rejected by a request-size cap.
   */
  maxRequestImageBytes?: number
  /** Total-pixel budget for each deterministic inline request version. */
  requestImagePixelBudget?: number
  /**
   * Raw encoded-byte target for each deterministic inline request version;
   * the smallest quality-ladder output is used when no quality fits.
   */
  requestImageMaxBytes?: number
  /** Provider-owned model-request retry policy; omission uses normal mode with five retries. */
  retryPolicy?: RetryPolicyConfig
}

/** Validated profile with its route stamped and every adapter-owned default resolved. */
export interface ResolvedPiAiProviderProfile
  extends Omit<PiAiProviderProfile, 'apiKeyEnv' | 'retryPolicy' | 'models' | 'displayName'> {
  /** Harness route key and the `Models` collection key (the configuration dict key). */
  provider: string
  /** Resolved display name for selectors and configuration surfaces. */
  displayName: string
  /** Validated credential reference, when one is configured. */
  apiKeyEnv?: CredentialRef
  /** Positive finite provider-idle interval after defaulting. */
  streamIdleTimeoutMs: number
  /** Positive request-level base64 image payload bound after defaulting. */
  maxRequestImageBytes: number
  /** Positive total-pixel request-version budget after defaulting. */
  requestImagePixelBudget: number
  /** Positive raw request-version byte target after defaulting; the smallest quality-ladder output is used when no quality fits. */
  requestImageMaxBytes: number
  /** Immutable retry policy captured with this provider route. */
  retryPolicy: ResolvedRetryPolicy
  /**
   * The pi-ai provider containing this route's serviceable models. Absent when
   * a stored route cannot be constructed; its configuration remains editable.
   */
  piProvider?: Provider
  /** First model diagnostic, or the route failure when no model diagnostic is available. */
  catalogError?: string
  /** Per-model failures reported before attempting a request. */
  modelErrors: ReadonlyMap<string, string>
  /**
   * Per-request output caps this profile explicitly configured, by model id.
   * The seam materializes one only into a request that names no cap of its
   * own, so a catalog capability must not appear here.
   */
  configuredMaxTokens: ReadonlyMap<string, number>
}

/** Plugin configuration: the provider routes this instance owns. */
export interface Config {
  /**
   * pi-ai provider routes, keyed by provider. An empty (or omitted) dict is
   * the dormant settings-driven posture: the adapter mounts with no routes
   * and registers them the moment a settings section supplies profiles.
   */
  providers: Volatile<Record<string, PiAiProviderProfile>>
  /**
   * Optional allowlist of provider/model pairs this adapter may list and call.
   * Omission leaves the adapter unrestricted; presence denies every unlisted
   * model, so a configuration edit cannot add one outside the policy.
   */
  modelPolicy: Volatile<ModelPolicyConfig | null>
}

/** Plain options accepted by the provider resolver. */
export interface Options {
  /** Provider routes, as the schema receives them. */
  providers?: Record<string, PiAiProviderProfile>
  /** Allowlist input, as the schema receives it. */
  modelPolicy?: ModelPolicyOptions
}

/** Mutable allowlist input the schema accepts. */
export interface ModelPolicyOptions {
  enabled: boolean
  local: ModelPolicyRef[]
  recent: ModelPolicyRef[]
  releaseDates?: Record<string, string>
  recentSince?: string
}

/** One provider/model pair a deployment's model policy permits. */
export interface ModelPolicyRef {
  /** Provider route the model belongs to. */
  provider: string
  /** Exact model id the route serves. */
  model: string
  /** ISO release date; required for a recent entry once `recentSince` is set. */
  releasedAt?: string
}

/**
 * Allowlist for the models this adapter may list and call. Omission leaves the
 * adapter unrestricted; presence turns every unlisted pair into a denied
 * model, including one a later configuration edit adds.
 */
export interface ModelPolicyConfig {
  /** Whether the allowlist is in force; `false` leaves the adapter unrestricted. */
  enabled: boolean
  /** Models already present in the deployment's local model list. */
  local: readonly ModelPolicyRef[]
  /** Models released inside the deployment's recent-release window. */
  recent: readonly ModelPolicyRef[]
  /**
   * ISO release dates keyed by `provider/model`; a model with a date on or after
   * `recentSince` is permitted even when it is in neither list. Requires
   * `recentSince`, and an unknown key is refused rather than ignored.
   */
  releaseDates?: Readonly<Record<string, string>>
  /** ISO date describing the recent window's lower bound, and the recent-date cutoff. */
  recentSince?: string
}

/** A resolved allowlist; omission means no policy and every model is permitted. */
export interface ResolvedModelPolicy {
  /**
   * Whether one exact route/model pair may be listed and called.
   * @param provider - provider route.
   * @param model - exact model id.
   * @returns whether the pair is in the local or recent allowlist.
   */
  isAllowed(provider: string, model: string): boolean
  /** Configured local entries, in configuration order. */
  readonly local: readonly ModelPolicyRef[]
  /** Configured recent-release entries, in configuration order. */
  readonly recent: readonly ModelPolicyRef[]
  /** Release dates by `provider/model`, when the deployment supplied a manifest. */
  readonly releaseDates: ReadonlyMap<string, string>
  /** Configured recent-release lower bound, when one was named. */
  readonly recentSince?: string
}

const modelPolicyRef = z.object({
  provider: z.string().required(),
  model: z.string().required(),
  releasedAt: z.string(),
})

const modelPolicy = z.object({
  enabled: z.boolean().default(false),
  local: z.array(modelPolicyRef).default([]),
  recent: z.array(modelPolicyRef).default([]),
  releaseDates: z.dict(z.string()).default({}),
  recentSince: z.string(),
})

/**
 * Resolve one allowlist and validate its entries.
 * @param config - configured allowlist; omission leaves the adapter unrestricted.
 * @returns the resolved allowlist, or `undefined` when none was configured.
 * @throws Error naming an empty entry or an unusable recent-window date.
 */
export function resolveModelPolicy(config: ModelPolicyConfig | null | undefined): ResolvedModelPolicy | undefined {
  if (config === undefined || config === null || !config.enabled) return undefined
  const since = config.recentSince === undefined
    ? undefined
    : Date.parse(config.recentSince)
  if (since !== undefined && Number.isNaN(since)) {
    throw new Error('llm-pi-ai: modelPolicy.recentSince must be an ISO date')
  }
  const pairs = new Set<string>()
  const normalize = (entries: readonly ModelPolicyRef[], field: string): ModelPolicyRef[] =>
    entries.map((entry, index) => {
      if (entry.provider.length === 0 || entry.model.length === 0) {
        throw new Error(`llm-pi-ai: modelPolicy.${field}[${index}] needs non-empty provider and model`)
      }
      const releasedAt = entry.releasedAt
      if (releasedAt !== undefined && Number.isNaN(Date.parse(releasedAt))) {
        throw new Error(`llm-pi-ai: modelPolicy.${field}[${index}].releasedAt must be an ISO date`)
      }
      return {
        provider: entry.provider,
        model: entry.model,
        ...releasedAt === undefined ? {} : { releasedAt },
      }
    })
  const local = normalize(config.local, 'local')
  for (const entry of local) pairs.add(`${entry.provider}\u0000${entry.model}`)
  const recent = normalize(config.recent, 'recent')
  for (const [index, entry] of recent.entries()) {
    if (since === undefined) {
      pairs.add(`${entry.provider}\u0000${entry.model}`)
      continue
    }
    if (entry.releasedAt === undefined) {
      throw new Error(`llm-pi-ai: modelPolicy.recent[${index}].releasedAt is required when recentSince is set`)
    }
    if (Date.parse(entry.releasedAt) >= since) pairs.add(`${entry.provider}\u0000${entry.model}`)
  }
  const releaseDates = new Map<string, string>()
  const releaseTimes = new Map<string, number>()
  for (const [key, value] of Object.entries(config.releaseDates ?? {})) {
    const slash = key.indexOf('/')
    if (slash <= 0 || slash === key.length - 1) {
      throw new Error(`llm-pi-ai: modelPolicy.releaseDates key "${key}" must be provider/model`)
    }
    const date = Date.parse(value)
    if (Number.isNaN(date)) {
      throw new Error(`llm-pi-ai: modelPolicy.releaseDates["${key}"] must be an ISO date`)
    }
    releaseDates.set(key, value)
    releaseTimes.set(key, date)
  }
  if (releaseDates.size > 0 && since === undefined) {
    throw new Error('llm-pi-ai: modelPolicy.releaseDates requires recentSince')
  }
  const cutoff = since ?? Number.NEGATIVE_INFINITY
  return {
    isAllowed: (provider, model) => {
      if (pairs.has(`${provider}\u0000${model}`)) return true
      const date = releaseTimes.get(`${provider}/${model}`)
      return date !== undefined && date >= cutoff
    },
    local,
    recent,
    releaseDates,
    ...config.recentSince === undefined ? {} : { recentSince: config.recentSince },
  }
}

const thinkingBudgets = z.object({
  minimal: z.number(),
  low: z.number(),
  medium: z.number(),
  high: z.number(),
})

/**
 * One `chat_template_kwargs` or `chat_template_args` value. The `$var` member
 * is pi-ai's placeholder for a value dispatch fills from the request's
 * thinking state, which makes a template-driven gateway configurable without
 * restating its template.
 */
const chatTemplateKwarg: z<ChatTemplateKwargValue> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.const(null),
  z.object({
    $var: z.union(CHAT_TEMPLATE_VARS).required(),
    omitWhenOff: z.boolean(),
  }),
])

const compatProfile: z<PiAiCompatProfile> = z.object({
  supportsStore: z.boolean(),
  supportsDeveloperRole: z.boolean(),
  supportsReasoningEffort: z.boolean(),
  supportsUsageInStreaming: z.boolean(),
  supportsFinishReason: z.boolean(),
  maxTokensField: z.union(MAX_TOKENS_FIELDS),
  requiresToolResultName: z.boolean(),
  requiresAssistantAfterToolResult: z.boolean(),
  requiresThinkingAsText: z.boolean(),
  requiresReasoningContentOnAssistantMessages: z.boolean(),
  thinkingFormat: z.union(SUPPORTED_THINKING_FORMATS),
  chatTemplateKwargs: z.dict(chatTemplateKwarg),
  chatTemplateArgs: z.dict(chatTemplateKwarg),
  supportsThinkingTokenBudget: z.boolean(),
  thinkingTokenBudgetField: z.union(THINKING_TOKEN_BUDGET_FIELDS),
  vllmPriority: z.number().step(1),
  supportsMaxOutputTokens: z.boolean(),
  supportsStrictMode: z.boolean(),
  cacheControlFormat: z.union(CACHE_CONTROL_FORMATS),
  supportsLongCacheRetention: z.boolean(),
  supportsEagerToolInputStreaming: z.boolean(),
  supportsCacheControlOnTools: z.boolean(),
  supportsTemperature: z.boolean(),
  forceAdaptiveThinking: z.boolean(),
  allowEmptySignature: z.boolean(),
  supportsStrictTools: z.boolean(),
})

/**
 * Keys are the offered levels, values their wire spellings. A valueless key
 * (`off:`) survives validation because schemastery passes nullable data
 * through before any member schema runs — `z.const(null)` only controls the
 * error for non-null wrong values and what a configuration UI renders.
 * Only resolution decides which levels may leave the value empty, so the
 * diagnostic can name the route and model. The assertion narrows
 * schemastery's `Dict`, which types every literal key as required; dict
 * validation checks only present keys, so the runtime value is a partial record.
 */
const reasoningEfforts = z.dict(
  z.union([z.string(), z.const(null)]),
  z.union(THINKING_LEVELS),
) as unknown as z<PiAiReasoningEfforts>

/** The fields a `models` entry and a `modelOverrides` value share; only the id's home differs. */
const modelFields = {
  name: z.string(),
  contextWindow: z.number().step(1).min(1),
  maxTokens: z.number().step(1).min(1),
  // No explicit default, unlike the route's `defaultInput`: schemastery
  // materializes `[]` for an absent array, and resolution reads that as "no
  // answer here" so the catalog entry below still applies.
  input: z.array(z.union(MODALITIES)),
  // The union, not a bare dict: schemastery materializes an absent dict as
  // `{}`, and absent must stay distinguishable — it means "inherit the
  // installed catalog's capability", while `false` disables reasoning.
  reasoningEfforts: z.union([z.const(false), reasoningEfforts]),
  compat: compatProfile,
}

const modelProfile: z<PiAiModelProfile> = z.object({
  id: z.string().required(),
  ...modelFields,
})

/** A {@link modelProfile} whose id lives in the `modelOverrides` dict key. */
const modelOverride: z<PiAiModelOverride> = z.object(modelFields)

const profile = z.object({
  apiKeyEnv: z.string().role('credential-ref'),
  displayName: z.string(),
  api: z.union(supportedProtocols()),
  baseURL: z.string(),
  models: z.array(modelProfile),
  modelOverrides: z.dict(modelOverride),
  compat: compatProfile,
  defaultContextWindow: z.number().step(1).min(1).default(DEFAULT_CONTEXT_WINDOW),
  defaultMaxTokens: z.number().step(1).min(1).default(DEFAULT_MAX_TOKENS),
  defaultInput: z.array(z.union(MODALITIES)).default([...DEFAULT_INPUT]),
  headers: z.dict(z.string()),
  reasoning: z.union(THINKING_LEVELS),
  thinkingBudgets,
  cacheRetention: z.union(['none', 'short', 'long']),
  transport: z.union(['sse', 'websocket', 'websocket-cached', 'auto']),
  timeoutMs: z.natural(),
  websocketConnectTimeoutMs: z.natural(),
  streamIdleTimeoutMs: z.number().min(Number.MIN_VALUE).max(MAX_TIMER_DELAY_MS).default(DEFAULT_STREAM_IDLE_TIMEOUT_MS),
  maxRequestImageBytes: z.number().step(1).min(1).default(DEFAULT_MAX_REQUEST_IMAGE_BYTES),
  requestImagePixelBudget: z.number().step(1).min(1).default(DEFAULT_REQUEST_IMAGE_PIXEL_BUDGET),
  requestImageMaxBytes: z.number().step(1).min(1).default(DEFAULT_REQUEST_IMAGE_MAX_BYTES),
  retryPolicy: RetryPolicySchema,
})

/** Runtime schema for {@link Config}. */
export const Config = z.object({
  providers: z.dict(profile).default({}).volatile(),
  modelPolicy: modelPolicy.volatile(),
})

/**
 * Reject new or changed provider profiles that cannot be served. Unchanged
 * stored profiles may need repair after a catalog upgrade and do not block
 * edits to another provider. Removed profiles require no catalog validation.
 * @param config - the resolved section to check.
 * @param previous - current resolved section; omission checks every provider.
 * @throws Error naming the route and configuration entry that cannot be served.
 */
export function assertServiceable(config: Options, previous?: Options): void {
  const changed = Object.fromEntries(Object.entries(config.providers ?? {}).filter(([provider, profile]) =>
    !deepEqualJson(profile, previous?.providers?.[provider])))
  resolveProfiles(changed)
}

/** Reject removed pre-release profile fields and name their replacements. */
function rejectRemovedFields(provider: string, source: PiAiProviderProfile): void {
  const legacy = source as PiAiProviderProfile & {
    provider?: unknown
    maxRetries?: unknown
    maxRetryDelayMs?: unknown
  }
  if ('provider' in legacy) {
    throw new Error(`llm-pi-ai: provider "${provider}" sets "provider", which moved to the providers dict key`)
  }
  if ('maxRetries' in legacy || 'maxRetryDelayMs' in legacy) {
    throw new Error(
      `llm-pi-ai: provider "${provider}" sets maxRetries or maxRetryDelayMs, which were removed;`
      + ' compose agent recovery with @tomato/llm-retry',
    )
  }
}

/** Reject a profile header that Fetch cannot put on a provider request. */
function assertValidHeaders(provider: string, headers: Readonly<Record<string, string>> | undefined): void {
  for (const [name, value] of Object.entries(headers ?? {})) {
    try {
      new Headers([[name, value]])
    } catch {
      throw new Error(
        `llm-pi-ai: provider "${provider}" header "${name}" is not valid for Fetch;`
        + ' use a valid HTTP field name and a single-line value representable as bytes',
      )
    }
  }
}

/**
 * Resolve scalar defaults and materialize each route's serviceable models.
 * Deferred catalog validation retains diagnostics without deleting configured
 * routes. An omitted dict resolves to the empty, dormant route set.
 * @param providers - configured provider profiles keyed by route.
 * @param validation - writes require a complete catalog; stored reads retain catalog diagnostics.
 * @returns validated profiles in configuration order.
 */
export function resolveProfiles(
  providers: Readonly<Record<string, PiAiProviderProfile>> | undefined,
  validation: 'strict' | 'deferred' = 'strict',
): Map<string, ResolvedPiAiProviderProfile> {
  if (Array.isArray(providers)) {
    throw new Error('llm-pi-ai: providers is now a dict keyed by provider route, not an array of profiles')
  }
  const entries = Object.entries(providers ?? {})
  const resolved = new Map<string, ResolvedPiAiProviderProfile>()
  for (const [provider, source] of entries) {
    rejectRemovedFields(provider, source)
    if (provider.length === 0) throw new Error('llm-pi-ai: provider names must be non-empty')
    if (source.baseURL !== undefined && source.baseURL.length === 0) {
      throw new Error(`llm-pi-ai: provider "${provider}" has an empty baseURL`)
    }
    if (source.displayName !== undefined && source.displayName.length === 0) {
      throw new Error(`llm-pi-ai: provider "${provider}" has an empty displayName`)
    }
    assertValidHeaders(provider, source.headers)
    const streamIdleTimeoutMs = source.streamIdleTimeoutMs ?? DEFAULT_STREAM_IDLE_TIMEOUT_MS
    if (!Number.isFinite(streamIdleTimeoutMs)
      || streamIdleTimeoutMs <= 0
      || streamIdleTimeoutMs > MAX_TIMER_DELAY_MS) {
      throw new Error(
        `llm-pi-ai: provider "${provider}" streamIdleTimeoutMs must be a positive finite number no greater than ${MAX_TIMER_DELAY_MS}`,
      )
    }
    const maxRequestImageBytes = source.maxRequestImageBytes ?? DEFAULT_MAX_REQUEST_IMAGE_BYTES
    if (!Number.isInteger(maxRequestImageBytes) || maxRequestImageBytes <= 0) {
      throw new Error(`llm-pi-ai: provider "${provider}" maxRequestImageBytes must be a positive integer`)
    }
    const requestImagePixelBudget = source.requestImagePixelBudget ?? DEFAULT_REQUEST_IMAGE_PIXEL_BUDGET
    if (!Number.isSafeInteger(requestImagePixelBudget) || requestImagePixelBudget <= 0) {
      throw new Error(`llm-pi-ai: provider "${provider}" requestImagePixelBudget must be a positive safe integer`)
    }
    const requestImageMaxBytes = source.requestImageMaxBytes ?? DEFAULT_REQUEST_IMAGE_MAX_BYTES
    if (!Number.isSafeInteger(requestImageMaxBytes) || requestImageMaxBytes <= 0) {
      throw new Error(`llm-pi-ai: provider "${provider}" requestImageMaxBytes must be a positive safe integer`)
    }
    // Detached from the configuration object because pi-ai types `Model.input`
    // mutable. The schema's explicit default covers an absent key, so an empty
    // list here is always one someone typed — and unlike an entry's, nothing
    // below it can answer instead — so it is refused rather than read as "no
    // answer".
    const defaultInput = [...source.defaultInput ?? DEFAULT_INPUT]
    if (defaultInput.length === 0) {
      throw new Error(`llm-pi-ai: provider "${provider}" defaultInput must name at least one modality`)
    }
    // The route key, not the installed provider's own name: the directory has
    // always shown route keys, and a catalog route must not silently rename
    // itself on every configuration surface just because it gained a profile.
    const displayName = source.displayName ?? provider
    let catalog: RouteCatalog | undefined
    let piProvider: Provider | undefined
    let catalogError: string | undefined
    try {
      catalog = resolveRouteModels({
        provider,
        ...source.api === undefined ? {} : { api: source.api },
        ...source.baseURL === undefined ? {} : { baseURL: source.baseURL },
        ...source.models === undefined ? {} : { models: source.models },
        ...source.modelOverrides === undefined ? {} : { modelOverrides: source.modelOverrides },
        ...source.compat === undefined ? {} : { compat: source.compat },
        defaultInput,
        defaultContextWindow: source.defaultContextWindow ?? DEFAULT_CONTEXT_WINDOW,
        defaultMaxTokens: source.defaultMaxTokens ?? DEFAULT_MAX_TOKENS,
      }, validation)
      catalogError = catalog.modelErrors.values().next().value
      piProvider = buildProvider({
        provider,
        displayName,
        ...source.api === undefined ? {} : { api: source.api },
        ...source.baseURL === undefined ? {} : { baseURL: source.baseURL },
        models: catalog.models,
        namesCredential: source.apiKeyEnv !== undefined,
      })
    } catch (error) {
      if (validation === 'strict' || !(error instanceof PiAiCatalogError)) throw error
      catalogError ??= error.message
    }
    const { apiKeyEnv, retryPolicy, models: _models, displayName: _displayName, ...rest } = source
    resolved.set(provider, {
      ...rest,
      provider,
      displayName,
      ...apiKeyEnv === undefined ? {} : { apiKeyEnv: credentialRef(apiKeyEnv) },
      streamIdleTimeoutMs,
      maxRequestImageBytes,
      requestImagePixelBudget,
      requestImageMaxBytes,
      retryPolicy: resolveRetryPolicy(retryPolicy, `llm-pi-ai: provider "${provider}" retryPolicy`),
      ...rest.headers === undefined ? {} : { headers: { ...rest.headers } },
      ...rest.thinkingBudgets === undefined ? {} : { thinkingBudgets: { ...rest.thinkingBudgets } },
      configuredMaxTokens: catalog?.configuredMaxTokens ?? new Map(),
      modelErrors: catalog?.modelErrors ?? new Map(),
      ...piProvider === undefined ? {} : { piProvider },
      ...catalogError === undefined ? {} : { catalogError },
    })
  }
  return resolved
}
