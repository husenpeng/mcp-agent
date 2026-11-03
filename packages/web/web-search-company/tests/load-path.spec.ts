/** Real Loader-path guard: the company provider must mount through `unwrapExports` with its `inject` intact. */
import { describe, expect, it } from 'vitest'
import { Context } from '@tomato/cordis'
import Loader from '@tomato/cordis-plugin-loader'
import WebRuntime from '@tomato/web'
import * as companyPlugin from '../src/index.ts'

describe('@tomato/web-search-company real-load-path guard', () => {
  it('keeps name/inject/Config through unwrapExports', () => {
    expect('default' in companyPlugin).toBe(false)

    const loader = Object.create(Loader.prototype) as Loader
    const unwrapped = loader.unwrapExports(companyPlugin) as Record<string, unknown>
    expect(unwrapped).toBe(companyPlugin)
    expect(unwrapped.name).toBe('web-search-company')
    expect(unwrapped.inject).toEqual(['web'])
    expect(typeof unwrapped.apply).toBe('function')
  })

  it('boots over ctx.web through the unwrapped module without an inject error', async () => {
    const ctx = new Context()
    await ctx.plugin(WebRuntime, { searchProvider: 'company' })
    ctx.provide('desktopSession', { sessionId: () => 'session-1' })

    const loader = Object.create(Loader.prototype) as Loader
    const unwrapped = loader.unwrapExports(companyPlugin) as Parameters<Context['plugin']>[0]
    const fiber = await ctx.plugin(unwrapped, { baseURL: 'https://bff.test' })
    await expect(ctx.web.searchReady()).resolves.toBe(true)
    await fiber.dispose()
  })
})
