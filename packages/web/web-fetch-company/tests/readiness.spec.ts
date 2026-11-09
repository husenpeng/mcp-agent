/** Company fetch readiness and registration: the signed-in Desktop session is the credential a step needs. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@tomato/cordis'
import WebRuntime from '@tomato/web'
import * as companyPlugin from '../src/index.ts'

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.TOMATO_SEARCH_GATEWAY_URL
})

/**
 * Mount the web seam and the company provider over one live session reader.
 * @param sessionId - reads the session the Desktop shell publishes; undefined when signed out.
 * @param config - plugin config; omitted leaves the environment origin in charge.
 * @returns the composed context.
 */
async function boot(sessionId: () => string | undefined, config: companyPlugin.Config = { baseURL: 'https://bff.test' }): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(WebRuntime, { fetchProvider: 'company' })
  ctx.provide('desktopSession', { sessionId })
  await ctx.plugin(companyPlugin, config)
  return ctx
}

describe('company fetch readiness', () => {
  it('is ready for a signed-in session', async () => {
    const ctx = await boot(() => 'session-1')
    await expect(ctx.web.fetchReady()).resolves.toBe(true)
  })

  it('is not ready while signed out, whatever the model route', async () => {
    const ctx = await boot(() => undefined)
    await expect(ctx.web.fetchReady()).resolves.toBe(false)
    await expect(ctx.web.fetchReady('blueai')).resolves.toBe(false)
  })

  it('treats an empty published session as signed out', async () => {
    const ctx = await boot(() => '')
    await expect(ctx.web.fetchReady()).resolves.toBe(false)
  })

  it('follows a session that appears after sign-in', async () => {
    const session: { current: string | undefined } = { current: undefined }
    const ctx = await boot(() => session.current)
    await expect(ctx.web.fetchReady()).resolves.toBe(false)
    session.current = 'session-2'
    await expect(ctx.web.fetchReady()).resolves.toBe(true)
  })
})
