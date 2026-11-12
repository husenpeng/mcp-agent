import { afterEach, describe, expect, it } from 'vitest'
import { probeOpenAiEndpoint, renderRouteSnippet } from '../src/openai-probe.ts'
import { closeMockServers, mockServer } from './mock-server.ts'

afterEach(async () => {
  await closeMockServers()
})

/** One Chat Completions reply with the usage fields a probe reads. */
function completion(usage: Record<string, unknown> = {}): string {
  return JSON.stringify({
    id: 'chatcmpl-1',
    object: 'chat.completion',
    choices: [{ index: 0, message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 10, completion_tokens: 1, ...usage },
  })
}

const PLAIN = { body: completion() }
/** The refusal a relay answers when function tools travel with a reasoning effort. */
const CONFLICT = {
  status: 400,
  body: JSON.stringify({
    message: 'Function tools with reasoning_effort are not supported for gpt-6.1-sol in /v1/chat/completions.'
      + ' To use function tools, use /v1/responses or set reasoning_effort to \'none\'.',
    type: 'invalid_request_error',
    param: 'reasoning_effort',
  }),
}

describe('OpenAI endpoint probe', () => {
  it('reports tools, their pairing with a reasoning effort, and a cache read', async () => {
    const server = await mockServer([
      PLAIN,
      { body: completion({ prompt_tokens_details: { cached_tokens: 0 } }) },
      { body: completion({ prompt_tokens_details: { cached_tokens: 900 } }) },
      { body: completion({ prompt_tokens_details: { cached_tokens: 900 } }) },
      PLAIN,
      PLAIN,
    ])

    const result = await probeOpenAiEndpoint({
      baseURL: `${server.url}/v1/`,
      apiKey: 'probe-key',
      model: 'gpt-6.1-sol',
      checkCache: true,
      checkTools: true,
    })

    expect(result).toEqual({
      api: 'openai-completions',
      reachable: true,
      cacheReadTokens: 900,
      cacheField: 'usage.prompt_tokens_details.cached_tokens',
      cacheKeyAccepted: true,
      tools: true,
      toolsWithReasoning: true,
    })
    // Every request names the model, and none streams: the probe parses JSON.
    const bodies = server.requests as Record<string, unknown>[]
    expect(bodies.every(body => body['model'] === 'gpt-6.1-sol' && body['stream'] === false)).toBe(true)
    expect(bodies[3]?.['prompt_cache_key']).toBe('tomato-capability-probe')
    expect(bodies[4]?.['tools']).toBeDefined()
    expect(bodies[5]?.['reasoning_effort']).toBe('high')
    expect(server.headers[0]?.['authorization']).toBe('Bearer probe-key')
  })

  it('reports the refusal when tools and a reasoning effort cannot travel together', async () => {
    const server = await mockServer([PLAIN, PLAIN, CONFLICT])

    const result = await probeOpenAiEndpoint({
      baseURL: server.url,
      model: 'gpt-6.1-sol',
      effort: 'xhigh',
      checkTools: true,
    })

    expect(result.tools).toBe(true)
    expect(result.toolsWithReasoning).toBe(false)
    expect(result.toolsWithReasoningError).toContain('400')
    expect(result.toolsWithReasoningError).toContain('Function tools with reasoning_effort')
    expect(result.cacheReadTokens).toBeUndefined()
  })

  it('reports a model that cannot drive a tool turn at all', async () => {
    const server = await mockServer([PLAIN, { status: 400, body: '{"message":"tools are not supported"}' }])

    const result = await probeOpenAiEndpoint({
      baseURL: server.url,
      model: 'no-tools',
      checkTools: true,
    })

    expect(result.tools).toBe(false)
    expect(result.toolsWithReasoning).toBe(false)
    // Tools alone failing is the answer; no second tool request is spent.
    expect(server.paths).toEqual(['/v1/chat/completions', '/v1/chat/completions'])
  })

  it('reads a vendor cache count from the usage root', async () => {
    const server = await mockServer([
      PLAIN,
      { body: completion({ prompt_cache_hit_tokens: 0 }) },
      { body: completion({ prompt_cache_hit_tokens: 2048 }) },
      { body: completion({ prompt_cache_hit_tokens: 2048 }) },
    ])

    const result = await probeOpenAiEndpoint({
      baseURL: server.url,
      model: 'DeepSeek-V4.1-Flash',
      checkCache: true,
    })

    expect(result.cacheReadTokens).toBe(2048)
    expect(result.cacheField).toBe('usage.prompt_cache_hit_tokens')
  })

  it('reports a refused cache key without discarding an observed cache read', async () => {
    const server = await mockServer([
      PLAIN,
      { body: completion({ prompt_tokens_details: { cached_tokens: 0 } }) },
      { body: completion({ prompt_tokens_details: { cached_tokens: 512 } }) },
      { status: 400, body: '{"message":"prompt_cache_key is not supported"}' },
    ])

    const result = await probeOpenAiEndpoint({
      baseURL: server.url,
      model: 'some-model',
      checkCache: true,
    })

    expect(result.cacheReadTokens).toBe(512)
    expect(result.cacheKeyAccepted).toBe(false)
  })

  it('speaks the Responses protocol with its own field names', async () => {
    const server = await mockServer([
      { body: JSON.stringify({ id: 'resp_1', object: 'response', output: [] }) },
      { body: JSON.stringify({ id: 'resp_2', object: 'response', output: [], usage: { input_tokens_details: { cached_tokens: 0 } } }) },
      { body: JSON.stringify({ id: 'resp_3', object: 'response', output: [], usage: { input_tokens_details: { cached_tokens: 700 } } }) },
      { body: JSON.stringify({ id: 'resp_4', object: 'response', output: [] }) },
      { body: JSON.stringify({ id: 'resp_5', object: 'response', output: [] }) },
      { body: JSON.stringify({ id: 'resp_6', object: 'response', output: [] }) },
    ])

    const result = await probeOpenAiEndpoint({
      baseURL: server.url,
      api: 'openai-responses',
      model: 'gpt-6.1-sol',
      checkCache: true,
      checkTools: true,
    })

    expect(result).toMatchObject({ api: 'openai-responses', reachable: true, cacheReadTokens: 700, tools: true, toolsWithReasoning: true })
    const bodies = server.requests as Record<string, unknown>[]
    expect(server.paths.every(path => path === '/v1/responses')).toBe(true)
    expect(bodies[1]?.['instructions']).toBeDefined()
    expect(bodies[1]?.['messages']).toBeUndefined()
    const tool = (bodies[4]?.['tools'] as Record<string, unknown>[])[0]
    expect(tool).toMatchObject({ type: 'function', name: 'get_weather' })
    expect(bodies[5]?.['reasoning']).toEqual({ effort: 'high' })
  })

  it('folds a baseURL without a version segment into one /v1 path', async () => {
    const server = await mockServer([PLAIN])

    await probeOpenAiEndpoint({ baseURL: `${server.url}/`, model: 'm' })

    expect(server.paths).toEqual(['/v1/chat/completions'])
  })

  it('reports an unreachable endpoint with its status', async () => {
    const server = await mockServer([{ status: 404, body: '{"error":"not found"}' }])

    const result = await probeOpenAiEndpoint({ baseURL: server.url, model: 'gpt-6.1-sol' })

    expect(result.reachable).toBe(false)
    expect(result.error).toContain('404')
    expect(result.tools).toBeUndefined()
  })

  it('requires a baseURL', async () => {
    const result = await probeOpenAiEndpoint({ baseURL: '', model: 'gpt-6.1-sol' })

    expect(result).toEqual({ api: 'openai-completions', reachable: false, error: 'baseURL is required' })
  })
})

describe('route snippet rendering', () => {
  const reachable = (overrides: Record<string, unknown>) => ({
    api: 'openai-completions' as const,
    reachable: true,
    tools: true,
    ...overrides,
  })

  it('declares the tool conflict and the observed cache dialect', () => {
    const yaml = renderRouteSnippet('blueai', 'gpt-6.1-sol', [
      reachable({ toolsWithReasoning: false, cacheReadTokens: 0, cacheKeyAccepted: true }),
    ])

    expect(yaml).toContain('models:\n  - id: gpt-6.1-sol')
    expect(yaml).toContain('    toolsWithReasoning: never')
    expect(yaml).toContain('      dialect: key')
  })

  it('switches the route to the protocol that accepts the pair', () => {
    const yaml = renderRouteSnippet('blueai', 'gpt-6.1-sol', [
      { api: 'openai-completions', reachable: false, error: '400' },
      reachable({ api: 'openai-responses' }),
    ])

    expect(yaml).toContain('api: openai-responses')
    expect(yaml).not.toContain('toolsWithReasoning: never')
  })

  it('omits cache configuration when the cache probe did not run', () => {
    const yaml = renderRouteSnippet('relay', 'm', [reachable({})])

    expect(yaml).not.toContain('cache:')
  })

  it('says so when no protocol answered', () => {
    const yaml = renderRouteSnippet('relay', 'm', [{ api: 'openai-completions', reachable: false, error: '404' }])

    expect(yaml).toContain('no probed protocol answered')
    expect(yaml).not.toContain('toolsWithReasoning')
  })
})
