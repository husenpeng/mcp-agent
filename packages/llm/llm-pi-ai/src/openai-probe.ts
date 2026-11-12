/**
 * One-shot capability probe for a third-party OpenAI-style endpoint.
 *
 * A gateway that answers `/v1/chat/completions` says nothing about prompt
 * caching, tool use, or whether function tools may travel with a reasoning
 * effort. Some endpoints reject exactly that pair — "Function tools with
 * reasoning_effort are not supported … use /v1/responses" — which every agent
 * turn trips because every turn declares tools. This probe asks the endpoint
 * the smallest questions that answer those facts over either protocol, so a
 * deployment can declare `cache` and `toolsWithReasoning` before a session
 * fails, instead of discovering them mid-turn.
 *
 * @module @tomato/llm-pi-ai/openai-probe
 */

/** Wire protocol one probe speaks. */
export type OpenAiProbeProtocol = 'openai-completions' | 'openai-responses'

/** One endpoint, one model, and the checks to run. */
export interface OpenAiProbeOptions {
  /** Endpoint root; a trailing `/v1` and trailing slashes are folded away. */
  baseURL: string
  /** Model id the endpoint serves. */
  model: string
  /** Protocol to probe; defaults to `openai-completions`. */
  api?: OpenAiProbeProtocol
  /** Credential sent as `Authorization: Bearer`; omission probes an unauthenticated endpoint. */
  apiKey?: string
  /** Additional request headers, overriding the probe's defaults. */
  headers?: Readonly<Record<string, string>>
  /** Caller cancellation. */
  signal?: AbortSignal
  /** Reasoning effort the tools-with-reasoning probe sends; defaults to `high`. */
  effort?: string
  /** Whether to test prompt caching with two identical long-prefix requests; omission skips it. */
  checkCache?: boolean
  /** Whether to test function tools and their pairing with a reasoning effort; omission skips it. */
  checkTools?: boolean
}

/** What the endpoint answered, or why it could not be asked. */
export interface OpenAiProbe {
  /** Protocol this result describes. */
  api: OpenAiProbeProtocol
  /** Whether one plain completion answered with a JSON object. */
  reachable: boolean
  /** Failure detail for the plain completion. */
  error?: string
  /** Whether a function tool was accepted; absent when not checked. */
  tools?: boolean
  /** Whether a tool request carrying a reasoning effort was accepted; absent when not checked. */
  toolsWithReasoning?: boolean
  /** Rejection detail for the tools-with-reasoning request. */
  toolsWithReasoningError?: string
  /** Cache-read tokens the second identical long-prefix request reported; absent when not checked. */
  cacheReadTokens?: number
  /** Response field that carried the cache-read count, when one did. */
  cacheField?: string
  /** Whether the endpoint accepted a `prompt_cache_key`; absent when the cache probe did not run. */
  cacheKeyAccepted?: boolean
}

const MAX_BODY_CHARS = 300
const PLAIN_PROMPT = 'Reply with exactly OK.'
const TOOL_PROMPT = 'What is the weather in Paris? Use the get_weather tool.'
const CACHE_PROMPT = 'Reply with exactly OK.'
const CACHE_SYSTEM = [
  'You are a precise assistant.',
  ...Array.from({ length: 60 }, (_, index) =>
    `Rule ${index + 1}: ${'The quick brown fox jumps over the lazy dog. '.repeat(20)}`),
].join('\n')

/** A failure message, preserving an Error's own text and stringifying any other throw. */
function failureMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** A nested object from an unknown value, or `undefined` when it is not one. */
function recordAt(value: Record<string, unknown> | undefined, key: string): Record<string, unknown> | undefined {
  const child = value?.[key]
  return typeof child === 'object' && child !== null && !Array.isArray(child)
    ? child as Record<string, unknown>
    : undefined
}

/** A finite number field, or `undefined` when absent or unusable. */
function numberAt(value: Record<string, unknown> | undefined, key: string): number | undefined {
  const child = value?.[key]
  return typeof child === 'number' && Number.isFinite(child) ? child : undefined
}

/**
 * The protocol URL for one endpoint root. Gateway documentation publishes both
 * `https://host` and `https://host/v1` as the same root, so the API segment is
 * supplied once rather than doubled.
 * @param baseURL - endpoint root, with or without a trailing `/v1`.
 * @param path - protocol path, such as `/chat/completions`.
 * @returns the absolute request URL.
 * @throws Error when the root is empty.
 */
function endpointUrl(baseURL: string, path: string): string {
  const root = baseURL.replace(/\/+$/, '')
  if (root.length === 0) throw new Error('baseURL is required')
  return `${/\/v1$/i.test(root) ? root : `${root}/v1`}${path}`
}

/**
 * POST one JSON body and return the parsed reply.
 * @param options - endpoint, credential, and cancellation.
 * @param body - the protocol request body.
 * @returns the parsed JSON object.
 * @throws Error for a transport failure, a non-2xx status, or a non-JSON reply.
 */
async function post(
  options: OpenAiProbeOptions,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const url = endpointUrl(options.baseURL, options.api === 'openai-responses' ? '/responses' : '/chat/completions')
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...options.apiKey === undefined ? {} : { authorization: `Bearer ${options.apiKey}` },
      ...options.headers,
    },
    body: JSON.stringify({ ...body, model: options.model, stream: false }),
    ...options.signal === undefined ? {} : { signal: options.signal },
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`${response.status} ${detail.slice(0, MAX_BODY_CHARS)}`.trim())
  }
  const parsed: unknown = await response.json()
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('endpoint did not answer with a JSON object')
  }
  return parsed as Record<string, unknown>
}

/** The plain request: one completion with no tools and no reasoning. */
function plainRequest(protocol: OpenAiProbeProtocol): Record<string, unknown> {
  return protocol === 'openai-responses'
    ? { input: PLAIN_PROMPT, max_output_tokens: 16 }
    : { max_tokens: 16, messages: [{ role: 'user', content: PLAIN_PROMPT }] }
}

/** The cache request: a long stable prefix and one short instruction. */
function cacheRequest(protocol: OpenAiProbeProtocol, cacheKey?: string): Record<string, unknown> {
  return {
    ...cacheKey === undefined ? {} : { prompt_cache_key: cacheKey },
    ...protocol === 'openai-responses'
      ? { instructions: CACHE_SYSTEM, input: CACHE_PROMPT, max_output_tokens: 16 }
      : {
        max_tokens: 16,
        messages: [
          { role: 'system', content: CACHE_SYSTEM },
          { role: 'user', content: CACHE_PROMPT },
        ],
      },
  }
}

/** One function tool in the protocol's own declaration spelling. */
function toolDeclarations(protocol: OpenAiProbeProtocol): Record<string, unknown>[] {
  const parameters = {
    type: 'object',
    properties: { city: { type: 'string' } },
    required: ['city'],
  }
  return protocol === 'openai-responses'
    ? [{ type: 'function', name: 'get_weather', description: 'Get the current weather for a city.', parameters }]
    : [{ type: 'function', function: { name: 'get_weather', description: 'Get the current weather for a city.', parameters } }]
}

/** The tool request, with an optional reasoning effort for the paired probe. */
function toolsRequest(protocol: OpenAiProbeProtocol, effort?: string): Record<string, unknown> {
  return {
    ...effort === undefined
      ? {}
      : protocol === 'openai-responses' ? { reasoning: { effort } } : { reasoning_effort: effort },
    tools: toolDeclarations(protocol),
    ...protocol === 'openai-responses'
      ? { input: TOOL_PROMPT, max_output_tokens: 128 }
      : { max_tokens: 128, messages: [{ role: 'user', content: TOOL_PROMPT }] },
  }
}

/**
 * The usage field that carries cache reads, by protocol, then by vendor
 * spelling: OpenAI nests the count under its detail object, while DeepSeek and
 * several gateways put it at the usage root.
 */
function cacheReadOf(protocol: OpenAiProbeProtocol, body: Record<string, unknown>): { tokens: number; field: string } | undefined {
  const usage = recordAt(body, 'usage')
  const candidates: readonly (readonly [string | undefined, string])[] = protocol === 'openai-responses'
    ? [['input_tokens_details', 'cached_tokens'], [undefined, 'cache_read_input_tokens']]
    : [['prompt_tokens_details', 'cached_tokens'], [undefined, 'prompt_cache_hit_tokens'], [undefined, 'cache_read_input_tokens']]
  for (const [container, key] of candidates) {
    const tokens = numberAt(container === undefined ? usage : recordAt(usage, container), key)
    if (tokens !== undefined) {
      return { tokens, field: `usage.${container === undefined ? '' : `${container}.`}${key}` }
    }
  }
  return undefined
}

/**
 * Test prompt caching with two identical long-prefix requests, then whether
 * the endpoint tolerates a cache key.
 * @param options - endpoint and model to ask.
 * @returns the observed cache read, or a probe failure recorded as no cache.
 */
async function checkCache(options: OpenAiProbeOptions): Promise<Pick<OpenAiProbe, 'cacheReadTokens' | 'cacheField' | 'cacheKeyAccepted'>> {
  const protocol = options.api ?? 'openai-completions'
  try {
    await post(options, cacheRequest(protocol))
    const second = await post(options, cacheRequest(protocol))
    const read = cacheReadOf(protocol, second)
    const result: Pick<OpenAiProbe, 'cacheReadTokens' | 'cacheField' | 'cacheKeyAccepted'> = {
      cacheReadTokens: read?.tokens ?? 0,
      ...read === undefined ? {} : { cacheField: read.field },
    }
    try {
      await post(options, cacheRequest(protocol, 'tomato-capability-probe'))
      result.cacheKeyAccepted = true
    } catch {
      // A rejected cache key leaves prefix caching possible; only the key is refused.
      result.cacheKeyAccepted = false
    }
    return result
  } catch {
    // A cache probe failing leaves the endpoint reachable; report no cache.
    return { cacheReadTokens: 0 }
  }
}

/**
 * Test function tools alone and beside a reasoning effort.
 * @param options - endpoint and model to ask.
 * @returns the two observations, with the paired rejection detail.
 */
async function checkTools(options: OpenAiProbeOptions): Promise<Pick<OpenAiProbe, 'tools' | 'toolsWithReasoning' | 'toolsWithReasoningError'>> {
  const protocol = options.api ?? 'openai-completions'
  const effort = options.effort ?? 'high'
  const result: Pick<OpenAiProbe, 'tools' | 'toolsWithReasoning' | 'toolsWithReasoningError'> = {}
  try {
    await post(options, toolsRequest(protocol))
    result.tools = true
  } catch {
    // Tools alone were refused: the model cannot drive an agent turn at all.
    result.tools = false
    result.toolsWithReasoning = false
    return result
  }
  try {
    await post(options, toolsRequest(protocol, effort))
    result.toolsWithReasoning = true
  } catch (error: unknown) {
    result.toolsWithReasoning = false
    result.toolsWithReasoningError = failureMessage(error)
  }
  return result
}

/**
 * Probe one model on one OpenAI-style endpoint.
 * @param options - endpoint, credential, model, protocol, and optional capability checks.
 * @returns the observed capabilities, or the protocol-probe failure.
 */
export async function probeOpenAiEndpoint(options: OpenAiProbeOptions): Promise<OpenAiProbe> {
  const protocol = options.api ?? 'openai-completions'
  try {
    await post(options, plainRequest(protocol))
  } catch (error: unknown) {
    return { api: protocol, reachable: false, error: failureMessage(error) }
  }
  const result: OpenAiProbe = { api: protocol, reachable: true }
  if (options.checkCache === true) Object.assign(result, await checkCache(options))
  if (options.checkTools === true) Object.assign(result, await checkTools(options))
  return result
}

/** The cache dialect a probe's observations justify. */
function dialectOf(cache: Pick<OpenAiProbe, 'cacheReadTokens' | 'cacheKeyAccepted'>): 'implicit' | 'key' | 'none' {
  if ((cache.cacheReadTokens ?? 0) > 0) return 'implicit'
  return cache.cacheKeyAccepted === true ? 'key' : 'none'
}

/**
 * Render the route configuration a probe supports.
 *
 * Only what the endpoint demonstrated is emitted: a model whose tool request
 * with a reasoning effort was refused gets `toolsWithReasoning: never`, and a
 * cache block appears only when the cache probe ran. The reasoning effort the
 * probe sent is named in a comment because the refusal may be effort-specific.
 * @param provider - provider route key the snippet configures.
 * @param model - probed model id.
 * @param probes - one result per protocol, at least one of which is reachable.
 * @returns a YAML fragment for the route's `models` list.
 */
export function renderRouteSnippet(
  provider: string,
  model: string,
  probes: readonly OpenAiProbe[],
): string {
  const reachable = probes.filter(probe => probe.reachable)
  const working = reachable.find(probe => probe.toolsWithReasoning !== false) ?? reachable[0]
  const lines = [
    `# ${provider}/${model}`,
    ...working === undefined
      ? ['# no probed protocol answered; check the endpoint and model id']
      : [],
  ]
  if (working !== undefined && working.api !== 'openai-completions') {
    lines.push(`api: ${working.api}`)
  }
  lines.push('models:', `  - id: ${model}`)
  if (working?.toolsWithReasoning === false) lines.push('    toolsWithReasoning: never')
  const cached = working === undefined ? undefined : working.cacheReadTokens === undefined ? undefined : working
  if (cached !== undefined) {
    lines.push('    cache:', `      dialect: ${dialectOf(cached)}`)
    if ((cached.cacheReadTokens ?? 0) > 0) {
      lines.push(`      # observed ${cached.cacheReadTokens} cached tokens on a repeated prefix`)
    }
    if (cached.cacheKeyAccepted === false) lines.push('      # the endpoint refused prompt_cache_key')
  }
  return lines.join('\n')
}
