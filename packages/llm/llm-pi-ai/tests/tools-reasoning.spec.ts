import { afterEach, describe, expect, it, vi } from 'vitest'
import { createUserMessage } from '@tomato/llm'
import type { GenerateOptions, StreamChunk } from '@tomato/llm'
import { PiAiAdapter } from '@tomato/llm-pi-ai'
import type { PiAiProviderProfile } from '@tomato/llm-pi-ai'
import { resolveProfiles } from '../src/config.ts'
import { memoryAuth } from './auth-double.ts'
import { closeMockServers, mockServer, textEvents } from './mock-server.ts'

afterEach(async () => {
  await closeMockServers()
})

/** The refusal a relay answers when function tools travel with a reasoning effort. */
const CONFLICT_BODY = JSON.stringify({
  message: 'Function tools with reasoning_effort are not supported for gpt-6.1-sol in /v1/chat/completions.'
    + ' To use function tools, use /v1/responses or set reasoning_effort to \'none\'.',
  type: 'invalid_request_error',
  param: 'reasoning_effort',
})

const TOOLS = [{
  name: 'get_weather',
  description: 'Get the current weather for a city.',
  parameters: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] },
}]

/** One route naming a reasoning model, with the deployment's extra fields. */
function route(baseURL: string, overrides: Partial<PiAiProviderProfile> = {}): Record<string, PiAiProviderProfile> {
  return {
    relay: {
      api: 'openai-completions',
      baseURL,
      models: [{ id: 'gpt-6.1-sol', reasoningEfforts: { off: null, high: 'high' } }],
      ...overrides,
    },
  }
}

/** A direct adapter over the real profile resolver, with a fixed key per call. */
function adapterOf(
  providers: Record<string, PiAiProviderProfile>,
  onCapabilityDegrade?: (detail: Record<string, unknown>) => void,
): PiAiAdapter {
  return new PiAiAdapter({
    profiles: () => resolveProfiles(providers),
    resolveApiKey: () => Promise.resolve('test-key'),
    auth: memoryAuth(),
    ...onCapabilityDegrade === undefined ? {} : { onCapabilityDegrade },
  })
}

/** The request one stream call assembles, with a reasoning effort and tools. */
function request(overrides: Partial<GenerateOptions> = {}): GenerateOptions {
  return {
    provider: 'relay',
    model: 'gpt-6.1-sol',
    reasoningEffort: 'high',
    tools: TOOLS,
    messages: [createUserMessage({ content: [{ type: 'text', text: 'hi' }], source: { kind: 'user' } })],
    ...overrides,
  } as GenerateOptions
}

/** Drain one adapter stream into its chunks. */
async function drain(adapter: PiAiAdapter, options: GenerateOptions): Promise<StreamChunk[]> {
  const chunks: StreamChunk[] = []
  for await (const chunk of adapter.stream(options)) chunks.push(chunk)
  return chunks
}

/** The finish reason of one drained stream. */
function finishOf(chunks: readonly StreamChunk[]): StreamChunk | undefined {
  return chunks.find(chunk => chunk.type === 'finish')
}

describe('declared tools-with-reasoning refusal', () => {
  it('sends no reasoning effort for a model whose route declares the refusal', async () => {
    const server = await mockServer([{ events: textEvents }])
    const degrade = vi.fn()
    const adapter = adapterOf(route(server.url, { toolsWithReasoning: 'never' }), degrade)

    const chunks = await drain(adapter, request())

    expect(finishOf(chunks)).toMatchObject({ type: 'finish', reason: { kind: 'stop' } })
    const body = server.requests[0] as Record<string, unknown>
    expect(body['reasoning_effort']).toBeUndefined()
    expect(body['tools']).toBeDefined()
    expect(degrade).toHaveBeenCalledTimes(1)
    expect(degrade).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'relay',
      model: 'gpt-6.1-sol',
      capability: 'tools-with-reasoning',
      requested: 'high',
      applied: 'off',
      reason: 'declared',
    }))
  })

  it('keeps the reasoning effort when the request carries no tools', async () => {
    const server = await mockServer([{ events: textEvents }])
    const adapter = adapterOf(route(server.url, { toolsWithReasoning: 'never' }))

    await drain(adapter, request({ tools: [] }))

    expect((server.requests[0] as Record<string, unknown>)['reasoning_effort']).toBe('high')
  })

  it('warns once per route and model across requests', async () => {
    const server = await mockServer([{ events: textEvents }, { events: textEvents }])
    const degrade = vi.fn()
    const adapter = adapterOf(route(server.url, { toolsWithReasoning: 'never' }), degrade)

    await drain(adapter, request())
    await drain(adapter, request())

    expect(degrade).toHaveBeenCalledTimes(1)
  })
})

describe('learned tools-with-reasoning refusal', () => {
  it('retries once without the effort after the endpoint refuses the pair', async () => {
    const server = await mockServer([
      { status: 400, body: CONFLICT_BODY },
      { events: textEvents },
    ])
    const degrade = vi.fn()
    const adapter = adapterOf(route(server.url), degrade)

    const chunks = await drain(adapter, request())

    expect(finishOf(chunks)).toMatchObject({ type: 'finish', reason: { kind: 'stop' } })
    expect(server.paths).toEqual(['/chat/completions', '/chat/completions'])
    const first = server.requests[0] as Record<string, unknown>
    const retried = server.requests[1] as Record<string, unknown>
    expect(first['reasoning_effort']).toBe('high')
    expect(retried['reasoning_effort']).toBeUndefined()
    // The retry is the same turn, not a rebuilt request.
    expect(retried['messages']).toEqual(first['messages'])
    expect(retried['tools']).toEqual(first['tools'])
    expect(degrade).toHaveBeenCalledWith(expect.objectContaining({
      reason: 'learned',
      applied: 'off',
    }))
    expect(finishOf(chunks)).toMatchObject({ reason: { kind: 'stop' } })
  })

  it('sends no effort on the next request once the refusal is learned', async () => {
    const server = await mockServer([
      { status: 400, body: CONFLICT_BODY },
      { events: textEvents },
      { events: textEvents },
    ])
    const adapter = adapterOf(route(server.url))

    await drain(adapter, request())
    await drain(adapter, request())

    expect(server.requests).toHaveLength(3)
    expect((server.requests[2] as Record<string, unknown>)['reasoning_effort']).toBeUndefined()
  })

  it('leaves an unrelated invalid request to the provider instead of retrying', async () => {
    const server = await mockServer([{ status: 400, body: '{"message":"missing required field: model"}' }])
    const adapter = adapterOf(route(server.url))

    const chunks = await drain(adapter, request())

    expect(server.paths).toHaveLength(1)
    expect(finishOf(chunks)).toMatchObject({ type: 'finish', reason: { kind: 'error', failure: { code: 'INVALID_REQUEST' } } })
  })

  it('does not retry a conflict that arrives after content streamed', async () => {
    // The scripted stream delivers text and then a terminal error carrying the
    // same wording; replaying it would duplicate the text already emitted.
    const server = await mockServer([
      { events: [...textEvents.slice(0, 2), '{"error":{"message":"Function tools with reasoning_effort are not supported"}}'] },
    ])
    const adapter = adapterOf(route(server.url))

    const chunks = await drain(adapter, request())

    expect(server.paths).toHaveLength(1)
    expect(finishOf(chunks)).toMatchObject({ type: 'finish', reason: { kind: 'error' } })
  })
})
