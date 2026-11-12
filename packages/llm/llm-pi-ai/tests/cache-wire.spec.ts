import { afterEach, describe, expect, it } from 'vitest'
import { createUserMessage } from '@tomato/llm'
import { SessionId } from '@tomato/session'
import type { GenerateOptions, ReasoningEffortId, StreamChunk } from '@tomato/llm'
import { PiAiAdapter } from '@tomato/llm-pi-ai'
import type { PiAiProviderProfile } from '@tomato/llm-pi-ai'
import { resolveProfiles } from '../src/config.ts'
import { memoryAuth } from './auth-double.ts'
import { closeMockServers, mockServer, textEvents } from './mock-server.ts'

afterEach(async () => {
  await closeMockServers()
})

const TOOLS = [{
  name: 'get_weather',
  description: 'Get the current weather for a city.',
  parameters: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] },
}]

/** One route over a local endpoint, with a catalog model whose capabilities are known. */
function route(baseURL: string, overrides: Partial<PiAiProviderProfile> = {}): Record<string, PiAiProviderProfile> {
  return {
    relay: {
      api: 'openai-completions',
      baseURL,
      models: [{ id: 'claude-opus-5-5', reasoningEfforts: { off: null, high: 'high' } }],
      ...overrides,
    },
  }
}

/** A direct adapter over the real profile resolver. */
function adapterOf(providers: Record<string, PiAiProviderProfile>): PiAiAdapter {
  return new PiAiAdapter({
    profiles: () => resolveProfiles(providers),
    resolveApiKey: () => Promise.resolve('test-key'),
    auth: memoryAuth(),
  })
}

/** Drain one adapter stream into its chunks. */
async function drain(adapter: PiAiAdapter, options: GenerateOptions): Promise<StreamChunk[]> {
  const chunks: StreamChunk[] = []
  for await (const chunk of adapter.stream(options)) chunks.push(chunk)
  return chunks
}

/** One request carrying tools, a session id, and a reasoning effort. */
function request(): GenerateOptions {
  return {
    provider: 'relay',
    model: 'claude-opus-5-5',
    reasoningEffort: 'high' as ReasoningEffortId,
    sessionId: SessionId('session-probe'),
    tools: TOOLS,
    messages: [createUserMessage({ content: [{ type: 'text', text: 'hi' }], source: { kind: 'user' } })],
  } as GenerateOptions
}

describe('cache dialect on the wire', () => {
  it('sends Anthropic breakpoints when the dialect declares them', async () => {
    const server = await mockServer([{ events: textEvents }])
    const adapter = adapterOf(route(server.url, { cache: { dialect: 'anthropic' } }))

    await drain(adapter, request())

    const body = server.requests[0] as {
      messages: { role: string; content: unknown }[]
      tools: { cache_control?: unknown }[]
      prompt_cache_key?: unknown
    }
    // This request has no system prompt, so the last message is the breakpoint.
    expect(body.messages.at(-1)?.content).toMatchObject([{ cache_control: { type: 'ephemeral' } }])
    expect(body.tools.at(-1)?.cache_control).toEqual({ type: 'ephemeral' })
    expect(body.prompt_cache_key).toBeUndefined()
  })

  it('sends a prompt cache key with long retention when the dialect declares a key', async () => {
    const server = await mockServer([{ events: textEvents }])
    const adapter = adapterOf(route(server.url, { cache: { dialect: 'key' } }))

    await drain(adapter, request())

    const body = server.requests[0] as Record<string, unknown>
    expect(body['prompt_cache_key']).toBe('session-probe')
    expect(body['prompt_cache_retention']).toBe('24h')
  })

  it('sends neither marker nor key for a model whose caching is off', async () => {
    const server = await mockServer([{ events: textEvents }])
    const adapter = adapterOf(route(server.url, { cache: { dialect: 'none' } }))

    await drain(adapter, request())

    const body = server.requests[0] as {
      messages: { content: unknown }[]
      prompt_cache_key?: unknown
    }
    expect(JSON.stringify(body)).not.toContain('cache_control')
    expect(body.prompt_cache_key).toBeUndefined()
  })

  it('lets one model keep the route cache while another disables it', async () => {
    const server = await mockServer([{ events: textEvents }, { events: textEvents }])
    const adapter = adapterOf({
      relay: {
        api: 'openai-completions',
        baseURL: server.url,
        cache: { dialect: 'anthropic' },
        models: [
          { id: 'claude-opus-5-5', reasoningEfforts: { off: null, high: 'high' } },
          { id: 'claude-sonnet-5-5', reasoningEfforts: { off: null, high: 'high' }, cache: { dialect: 'none' } },
        ],
      },
    })

    await drain(adapter, request())
    await drain(adapter, { ...request(), model: 'claude-sonnet-5-5' } as GenerateOptions)

    expect(JSON.stringify(server.requests[0])).toContain('cache_control')
    expect(JSON.stringify(server.requests[1])).not.toContain('cache_control')
  })
})
