import { afterEach, describe, expect, it } from 'vitest'
import { probeAnthropicEndpoint } from '../src/probe.ts'
import { closeMockServers, mockServer } from './mock-server.ts'

afterEach(async () => {
  await closeMockServers()
})

/** One Anthropic Messages reply with the fields a probe reads. */
function reply(
  content: readonly Record<string, unknown>[],
  usage: Record<string, unknown> = {},
  stopReason = 'end_turn',
): string {
  return JSON.stringify({
    id: 'msg_1',
    type: 'message',
    role: 'assistant',
    content,
    stop_reason: stopReason,
    stop_sequence: null,
    usage: { input_tokens: 3, output_tokens: 1, ...usage },
  })
}

const TEXT = [{ type: 'text', text: 'ok' }]
const PLAIN = { body: reply(TEXT) }

describe('Anthropic endpoint probe', () => {
  it('reports native and thinking tokens, folding a trailing /v1', async () => {
    const server = await mockServer([
      PLAIN,
      { body: reply(TEXT, { output_tokens_details: { thinking_tokens: 42 } }) },
    ])

    const result = await probeAnthropicEndpoint({
      baseURL: `${server.url}/v1/`,
      apiKey: 'probe-key',
      model: 'claude-opus-5-5',
    })

    expect(result).toEqual({ native: true, thinking: true, thinkingTokens: 42 })
    expect(server.paths).toEqual(['/v1/messages', '/v1/messages'])
    expect(server.headers[0]?.['x-api-key']).toBe('probe-key')
    expect(server.headers[0]?.['anthropic-version']).toBe('2023-06-01')
  })

  it('reports thinking text when the endpoint reports no token count', async () => {
    const server = await mockServer([
      PLAIN,
      { body: reply([{ type: 'thinking', thinking: 'nine remain' }, ...TEXT]) },
    ])

    const result = await probeAnthropicEndpoint({
      baseURL: server.url,
      model: 'claude-opus-5-5',
    })

    expect(result).toEqual({ native: true, thinking: true })
    // No key means no auth header, which is what an unauthenticated local
    // endpoint expects.
    expect(server.headers[0]?.['x-api-key']).toBeUndefined()
  })

  it('reports native without thinking when the reply reports none', async () => {
    const server = await mockServer([
      PLAIN,
      { body: reply(TEXT, { output_tokens_details: { thinking_tokens: 0 } }) },
    ])

    const result = await probeAnthropicEndpoint({
      baseURL: server.url,
      model: 'claude-opus-5-5',
    })

    expect(result).toEqual({ native: true, thinking: false, thinkingTokens: 0 })
  })

  it('reports native without thinking when the reply carries no content', async () => {
    const server = await mockServer([
      PLAIN,
      { body: JSON.stringify({ type: 'message' }) },
    ])

    const result = await probeAnthropicEndpoint({
      baseURL: server.url,
      model: 'claude-opus-5-5',
    })

    expect(result).toEqual({ native: true, thinking: false })
  })

  it('reports a caller abort reason as a native failure', async () => {
    const controller = new AbortController()
    controller.abort('stop')

    const result = await probeAnthropicEndpoint({
      baseURL: 'http://127.0.0.1:1',
      model: 'claude-opus-5-5',
      signal: controller.signal,
    })

    expect(result).toEqual({ native: false, thinking: false, error: 'stop' })
  })

  it('reports native when plain requests work but thinking is rejected', async () => {
    const server = await mockServer([
      PLAIN,
      { status: 400, body: '{"error":"invalid request"}' },
    ])

    const result = await probeAnthropicEndpoint({
      baseURL: server.url,
      model: 'claude-opus-4-5-20251101',
    })

    expect(result.native).toBe(true)
    expect(result.thinking).toBe(false)
    expect(result.thinkingError).toContain('400')
  })

  it('reports a native-probe failure with the endpoint status', async () => {
    const server = await mockServer([{ status: 404, body: '{"error":"not found"}' }])

    const result = await probeAnthropicEndpoint({
      baseURL: server.url,
      model: 'claude-opus-5-5',
    })

    expect(result.native).toBe(false)
    expect(result.thinking).toBe(false)
    expect(result.error).toContain('404')
  })

  it('reports a non-JSON reply as a native failure', async () => {
    const server = await mockServer([{ body: 'not json' }])

    const result = await probeAnthropicEndpoint({
      baseURL: server.url,
      model: 'claude-opus-5-5',
    })

    expect(result.native).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('reports a JSON array as a native failure', async () => {
    const server = await mockServer([{ body: '[]' }])

    const result = await probeAnthropicEndpoint({
      baseURL: server.url,
      model: 'claude-opus-5-5',
    })

    expect(result.native).toBe(false)
    expect(result.error).toContain('JSON object')
  })

  it('reports a network failure as a native failure', async () => {
    const server = await mockServer([])
    const baseURL = server.url
    await closeMockServers()

    const result = await probeAnthropicEndpoint({
      baseURL,
      model: 'claude-opus-5-5',
    })

    expect(result.native).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('requires a baseURL', async () => {
    const result = await probeAnthropicEndpoint({ baseURL: '', model: 'claude-opus-5-5' })

    expect(result.native).toBe(false)
    expect(result.error).toBe('baseURL is required')
  })

  it('checks caching with a long cached prefix', async () => {
    const server = await mockServer([
      PLAIN,
      { body: reply(TEXT, { output_tokens_details: { thinking_tokens: 7 } }) },
      { body: reply(TEXT, { cache_creation_input_tokens: 900 }) },
      { body: reply(TEXT, { cache_read_input_tokens: 900 }) },
    ])

    const result = await probeAnthropicEndpoint({
      baseURL: server.url,
      model: 'claude-opus-5-5',
      checkCache: true,
    })

    expect(result).toEqual({ native: true, thinking: true, thinkingTokens: 7, cache: true })
    const cacheRequest = server.requests[2] as { system?: { cache_control?: unknown }[] }
    expect(cacheRequest.system?.[0]?.cache_control).toEqual({ type: 'ephemeral' })
  })

  it('reports no cache when the second request reads none', async () => {
    const server = await mockServer([
      PLAIN,
      { body: reply(TEXT) },
      { body: reply(TEXT, { cache_creation_input_tokens: 900 }) },
      { body: reply(TEXT, { cache_read_input_tokens: 0 }) },
    ])

    const result = await probeAnthropicEndpoint({
      baseURL: server.url,
      model: 'claude-opus-5-5',
      checkCache: true,
    })

    expect(result.cache).toBe(false)
  })

  it('reports no cache when the second request omits the read count', async () => {
    const server = await mockServer([
      PLAIN,
      { body: reply(TEXT) },
      { body: reply(TEXT, { cache_creation_input_tokens: 900 }) },
      { body: JSON.stringify({ type: 'message' }) },
    ])

    const result = await probeAnthropicEndpoint({
      baseURL: server.url,
      model: 'claude-opus-5-5',
      checkCache: true,
    })

    expect(result.cache).toBe(false)
  })

  it('keeps the native result when the cache probe itself fails', async () => {
    const server = await mockServer([
      PLAIN,
      { body: reply(TEXT) },
      { status: 500, body: '{"error":"cache probe failed"}' },
    ])

    const result = await probeAnthropicEndpoint({
      baseURL: server.url,
      model: 'claude-opus-5-5',
      checkCache: true,
    })

    expect(result.native).toBe(true)
    expect(result.cache).toBe(false)
  })

  it('checks tool use', async () => {
    const server = await mockServer([
      PLAIN,
      { body: reply(TEXT) },
      {
        body: reply(
          [{ type: 'tool_use', name: 'get_weather', input: { city: 'Paris' } }],
          {},
          'tool_use',
        ),
      },
    ])

    const result = await probeAnthropicEndpoint({
      baseURL: server.url,
      model: 'claude-opus-5-5',
      checkTools: true,
    })

    expect(result.tools).toBe(true)
  })

  it('reports no tool use when the reply stops without one', async () => {
    const server = await mockServer([
      PLAIN,
      { body: reply(TEXT) },
      { body: reply(TEXT) },
    ])

    const result = await probeAnthropicEndpoint({
      baseURL: server.url,
      model: 'claude-opus-5-5',
      checkTools: true,
    })

    expect(result.tools).toBe(false)
  })

  it('keeps the native result when the tool probe itself fails', async () => {
    const server = await mockServer([
      PLAIN,
      { body: reply(TEXT) },
      { status: 500, body: '{"error":"tool probe failed"}' },
    ])

    const result = await probeAnthropicEndpoint({
      baseURL: server.url,
      model: 'claude-opus-5-5',
      checkTools: true,
    })

    expect(result.native).toBe(true)
    expect(result.tools).toBe(false)
  })
})
