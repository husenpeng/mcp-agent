/**
 * One-shot capability probe for a third-party Anthropic-compatible endpoint.
 *
 * A gateway that speaks OpenAI Chat Completions for DeepSeek may or may not
 * expose Anthropic's native `/v1/messages`, and a 200 on a model listing says
 * nothing about thinking, cache markers, or tool use. This probe asks the
 * endpoint directly with the smallest requests that answer those questions,
 * so a deployment can decide whether to move a model to a native route before
 * a real session fails.
 *
 * @module @tomato/llm-pi-ai/probe
 */

/** One endpoint and model to interrogate. */
export interface AnthropicEndpointProbeOptions {
  /** Endpoint root; a trailing `/v1` and trailing slashes are folded away. */
  baseURL: string
  /** Model id the endpoint serves. */
  model: string
  /** Credential sent as `x-api-key`; omission probes an unauthenticated endpoint. */
  apiKey?: string
  /** Additional request headers, overriding the probe's defaults. */
  headers?: Readonly<Record<string, string>>
  /** Caller cancellation. */
  signal?: AbortSignal
  /** Whether to test prompt caching with a repeated long prefix; omission skips it. */
  checkCache?: boolean
  /** Whether to test tool use; omission skips it. */
  checkTools?: boolean
}

/** What the endpoint answered, or why it could not be asked. */
export interface AnthropicEndpointProbe {
  /** Whether `POST /v1/messages` answered with a JSON message. */
  native: boolean
  /** Whether the model produced thinking tokens (or thinking text). */
  thinking: boolean
  /** Thinking tokens the reply reported, when the endpoint reports them. */
  thinkingTokens?: number
  /** Thinking-probe failure detail when plain requests work but thinking is rejected. */
  thinkingError?: string
  /** Whether a repeated prefix produced a cache read; absent when not checked. */
  cache?: boolean
  /** Whether a tool definition produced a `tool_use` reply; absent when not checked. */
  tools?: boolean
  /** Native-probe failure detail, with response bodies truncated. */
  error?: string
}

const ANTHROPIC_VERSION = '2023-06-01'
const MAX_BODY_CHARS = 300
const THINKING_PROMPT = 'A farmer has 17 sheep. All but 9 run away. Then he buys twice as many as remain, '
  + 'and sells 5. How many sheep? Think it through.'
const TOOL_PROMPT = 'What is the weather in Paris? Use the get_weather tool.'
const PLAIN_PROMPT = 'Reply with exactly OK.'
const CACHE_SYSTEM = [
  'You are a precise assistant.',
  ...Array.from({ length: 3 }, (_, index) =>
    `Rule ${index + 1}: ${'The quick brown fox jumps over the lazy dog. '.repeat(80)}`),
].join('\n')
const CACHE_PROMPT = 'Reply with exactly OK.'

/** A failure message, preserving an Error's own text and stringifying any other throw. */
function failureMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** A JSON object from an unknown value, or `undefined` when it is not one. */
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

/** The message content blocks, or an empty list when the reply carries none. */
function contentOf(body: Record<string, unknown>): readonly Record<string, unknown>[] {
  const content = body['content']
  return Array.isArray(content)
    ? content.filter((block): block is Record<string, unknown> => typeof block === 'object' && block !== null && !Array.isArray(block))
    : []
}

/** Thinking tokens the reply reported, or `undefined` when it reported none. */
function thinkingTokensOf(body: Record<string, unknown>): number | undefined {
  const details = recordAt(recordAt(body, 'usage'), 'output_tokens_details')
  return numberAt(details, 'thinking_tokens')
}

/** Whether any content block carries non-empty thinking text. */
function hasThinkingText(body: Record<string, unknown>): boolean {
  return contentOf(body).some(block =>
    block['type'] === 'thinking' && typeof block['thinking'] === 'string' && block['thinking'].trim().length > 0)
}

/** Cache-read tokens the reply reported, or `0` when it reported none. */
function cacheReadTokensOf(body: Record<string, unknown>): number {
  return numberAt(recordAt(body, 'usage'), 'cache_read_input_tokens') ?? 0
}

/**
 * The native Messages URL for one endpoint root. Gateway documentation
 * publishes both `https://host` and `https://host/v1` as the same root, so the
 * trailing API segment is folded away rather than doubled.
 * @param baseURL - endpoint root, with or without a trailing `/v1`.
 * @returns the `POST /v1/messages` URL.
 * @throws Error when the root is empty.
 */
function messagesUrl(baseURL: string): string {
  const root = baseURL.replace(/\/+$/, '').replace(/\/v1$/i, '')
  if (root.length === 0) throw new Error('baseURL is required')
  return `${root}/v1/messages`
}

/** Request headers shared by every probe request. */
function headersOf(options: AnthropicEndpointProbeOptions): Record<string, string> {
  return {
    'content-type': 'application/json',
    'anthropic-version': ANTHROPIC_VERSION,
    ...options.apiKey === undefined ? {} : { 'x-api-key': options.apiKey },
    ...options.headers,
  }
}

/**
 * POST one JSON body and return the parsed reply.
 * @param options - endpoint root, headers, and cancellation.
 * @param body - the Messages request body.
 * @returns the parsed JSON object.
 * @throws Error for a transport failure, a non-2xx status, or a non-JSON reply.
 */
async function post(
  options: AnthropicEndpointProbeOptions,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const response = await fetch(messagesUrl(options.baseURL), {
    method: 'POST',
    headers: headersOf(options),
    body: JSON.stringify(body),
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

/** The plain request: establishes native support without asking for thinking. */
function plainRequest(model: string): Record<string, unknown> {
  return {
    model,
    max_tokens: 16,
    messages: [{ role: 'user', content: PLAIN_PROMPT }],
  }
}

/** The thinking request: one hard prompt with adaptive thinking. */
function thinkingRequest(model: string): Record<string, unknown> {
  return {
    model,
    max_tokens: 512,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: THINKING_PROMPT }],
  }
}

/** The cache request: a long system prefix and a last-message breakpoint. */
function cacheRequest(model: string): Record<string, unknown> {
  return {
    model,
    max_tokens: 16,
    system: [{ type: 'text', text: CACHE_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{
      role: 'user',
      content: [{ type: 'text', text: CACHE_PROMPT, cache_control: { type: 'ephemeral' } }],
    }],
  }
}

/** The tool request: one trivially callable definition. */
function toolsRequest(model: string): Record<string, unknown> {
  return {
    model,
    max_tokens: 128,
    tools: [{
      name: 'get_weather',
      description: 'Get the current weather for a city.',
      input_schema: {
        type: 'object',
        properties: { city: { type: 'string' } },
        required: ['city'],
      },
    }],
    messages: [{ role: 'user', content: TOOL_PROMPT }],
  }
}

/**
 * Test prompt caching with two identical long-prefix requests.
 * @param options - endpoint and model to ask.
 * @returns whether the second request reported a cache read; a probe failure is `false`.
 */
async function checkCache(options: AnthropicEndpointProbeOptions): Promise<boolean> {
  try {
    await post(options, cacheRequest(options.model))
    const second = await post(options, cacheRequest(options.model))
    return cacheReadTokensOf(second) > 0
  } catch {
    // A cache probe failing leaves the native endpoint usable; report no cache.
    return false
  }
}

/**
 * Test tool use with one definition and one explicit prompt.
 * @param options - endpoint and model to ask.
 * @returns whether the reply used the tool; a probe failure is `false`.
 */
async function checkTools(options: AnthropicEndpointProbeOptions): Promise<boolean> {
  try {
    const reply = await post(options, toolsRequest(options.model))
    return reply['stop_reason'] === 'tool_use'
      && contentOf(reply).some(block => block['type'] === 'tool_use')
  } catch {
    // A tool probe failing leaves the native endpoint usable; report no tools.
    return false
  }
}

/**
 * Probe one model on one Anthropic-compatible endpoint.
 * @param options - endpoint, credential, model, and optional capability checks.
 * @returns the observed capabilities, or the native-probe failure.
 */
export async function probeAnthropicEndpoint(
  options: AnthropicEndpointProbeOptions,
): Promise<AnthropicEndpointProbe> {
  // Establish native support first: a model can answer plain Messages requests
  // while rejecting the thinking fields, and that is a different outcome from
  // "this endpoint has no /v1/messages".
  try {
    await post(options, plainRequest(options.model))
  } catch (error: unknown) {
    return {
      native: false,
      thinking: false,
      error: failureMessage(error),
    }
  }
  let thinking = false
  let thinkingTokens: number | undefined
  let thinkingError: string | undefined
  try {
    const reply = await post(options, thinkingRequest(options.model))
    thinkingTokens = thinkingTokensOf(reply)
    thinking = (thinkingTokens ?? 0) > 0 || hasThinkingText(reply)
  } catch (error: unknown) {
    thinkingError = failureMessage(error)
  }
  const result: AnthropicEndpointProbe = {
    native: true,
    thinking,
    ...thinkingTokens === undefined ? {} : { thinkingTokens },
    ...thinkingError === undefined ? {} : { thinkingError },
  }
  if (options.checkCache === true) result.cache = await checkCache(options)
  if (options.checkTools === true) result.tools = await checkTools(options)
  return result
}
