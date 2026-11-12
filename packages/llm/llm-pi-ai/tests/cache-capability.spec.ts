import { describe, expect, it } from 'vitest'
import { resolveRouteModels } from '../src/catalog.ts'
import type { RouteCatalogRequest } from '../src/catalog.ts'

/** A hand-declared route with one model, defaulted to a servable size. */
function route(overrides: Partial<RouteCatalogRequest> = {}): RouteCatalogRequest {
  return {
    provider: 'relay',
    api: 'openai-completions',
    baseURL: 'https://relay.test/v1',
    models: [{ id: 'claude-opus-5-5', reasoningEfforts: { off: null, high: 'high' } }],
    defaultContextWindow: 200_000,
    defaultMaxTokens: 8_000,
    defaultInput: ['text'],
    ...overrides,
  }
}

/** The one materialized model of a route. */
function model(overrides: Partial<RouteCatalogRequest> = {}) {
  return resolveRouteModels(route(overrides)).models[0]!
}

describe('prompt-cache dialect resolution', () => {
  it('applies the Anthropic marker when the route declares it on an OpenAI-compatible endpoint', () => {
    const resolved = model({ cache: { dialect: 'anthropic' } })
    expect(resolved.compat).toMatchObject({ cacheControlFormat: 'anthropic' })
  })

  it('keeps the Anthropic fallback for an Anthropic catalog model on a completions route', () => {
    // No declaration: the canonical id matches the first-party catalog entry,
    // whose own protocol is anthropic-messages, so the marker is inferred.
    expect(model().compat).toMatchObject({ cacheControlFormat: 'anthropic' })
  })

  it('refuses the Anthropic dialect on the protocol that carries breakpoints natively', () => {
    expect(() => model({
      api: 'anthropic-messages',
      baseURL: 'https://relay.test',
      models: [{ id: 'claude-opus-5-5' }],
      cache: { dialect: 'anthropic' },
    })).toThrow(/carries its own cache breakpoints/u)
  })

  it('routes an OpenAI-family model through a cache key with long retention', () => {
    const catalog = resolveRouteModels(route({
      models: [{ id: 'gpt-6.1-sol', reasoningEfforts: { off: null, high: 'high' } }],
      cache: { dialect: 'key' },
    }))

    expect(catalog.models[0]?.compat).toMatchObject({ supportsLongCacheRetention: true })
    // Long retention is what makes pi-ai's completions path emit the key at all.
    expect(catalog.configuredCacheRetention.get('gpt-6.1-sol')).toBe('long')
  })

  it('refuses a cache key beside short retention on completions', () => {
    expect(() => resolveRouteModels(route({
      cache: { dialect: 'key' },
      models: [{ id: 'claude-opus-5-5', cache: { dialect: 'key', retention: 'short' } }],
    }))).toThrow(/sends a cache key only beside long retention/u)
  })

  it('leaves responses retention to the caller because that protocol emits the key for any retention', () => {
    const catalog = resolveRouteModels(route({
      api: 'openai-responses',
      models: [{ id: 'gpt-6.1-sol', reasoningEfforts: { off: null, high: 'high' } }],
      cache: { dialect: 'key' },
    }))

    // The Responses protocol emits a cache key for any retention, so declaring
    // the dialect adds no switch and pins no retention.
    expect(catalog.models[0]?.compat).not.toHaveProperty('supportsLongCacheRetention')
    expect(catalog.configuredCacheRetention.has('gpt-6.1-sol')).toBe(false)
  })

  it('turns caching off for a model that declares none', () => {
    const catalog = resolveRouteModels(route({
      cacheRetention: 'short',
      models: [{ id: 'claude-opus-5-5', cache: { dialect: 'none' } }],
    }))

    expect(catalog.configuredCacheRetention.get('claude-opus-5-5')).toBe('none')
    expect(catalog.models[0]?.compat).toBeUndefined()
  })

  it('refuses a retention on a model whose caching is off', () => {
    expect(() => resolveRouteModels(route({
      models: [{ id: 'claude-opus-5-5', cache: { dialect: 'none', retention: 'long' } }],
    }))).toThrow(/cannot retain a prefix/u)
  })

  it('sends nothing for an implicit dialect and keeps the route retention', () => {
    const catalog = resolveRouteModels(route({
      cache: { dialect: 'implicit' },
    }))

    expect(catalog.models[0]?.compat).toBeUndefined()
    expect(catalog.configuredCacheRetention.size).toBe(0)
  })

  it('lets one model retain longer than its route', () => {
    const catalog = resolveRouteModels(route({
      cacheRetention: 'short',
      models: [
        { id: 'claude-opus-5-5', cache: { retention: 'long' } },
        { id: 'claude-sonnet-5-5' },
      ],
    }))

    expect(catalog.configuredCacheRetention.get('claude-opus-5-5')).toBe('long')
    expect(catalog.configuredCacheRetention.has('claude-sonnet-5-5')).toBe(false)
  })

  it('refuses a cache key on a protocol that has no key field', () => {
    expect(() => model({
      api: 'anthropic-messages',
      baseURL: 'https://relay.test',
      models: [{ id: 'claude-opus-5-5' }],
      cache: { dialect: 'key' },
    })).toThrow(/a cache key is an OpenAI protocol request field/u)
  })
})

describe('tools-with-reasoning declaration', () => {
  it('applies a route-level answer to every model', () => {
    const catalog = resolveRouteModels(route({
      toolsWithReasoning: 'never',
      models: [
        { id: 'claude-opus-5-5', reasoningEfforts: { off: null, high: 'high' } },
        { id: 'claude-sonnet-5-5', reasoningEfforts: { off: null, high: 'high' } },
      ],
    }))

    expect([...catalog.configuredToolsWithReasoning]).toEqual([
      ['claude-opus-5-5', 'never'],
      ['claude-sonnet-5-5', 'never'],
    ])
  })

  it('lets one model override its route', () => {
    const catalog = resolveRouteModels(route({
      toolsWithReasoning: 'never',
      models: [{ id: 'claude-opus-5-5', reasoningEfforts: { off: null, high: 'high' }, toolsWithReasoning: 'allowed' }],
    }))

    expect(catalog.configuredToolsWithReasoning.get('claude-opus-5-5')).toBe('allowed')
  })

  it('records nothing when no layer answers', () => {
    expect(resolveRouteModels(route()).configuredToolsWithReasoning.size).toBe(0)
  })
})
