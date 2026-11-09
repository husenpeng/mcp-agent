import { Context } from '@tomato/cordis'
import type { CurrentAccount, TomatoAccount } from '@tomato/gateway'
import { afterEach, describe, expect, it } from 'vitest'
import * as AccountGateway from '../src/index.ts'

const user = { id: 'user-1', email: 'person@example.com', name: 'Person', avatarUrl: null, language: 'zh-CN', roles: ['admin'], quotas: { 'model.tokens.daily': 2000 } }
const clients: Context[] = []
afterEach(async () => { await Promise.all(clients.splice(0).map(ctx => ctx.fiber.dispose())) })

function fixture(initial: CurrentAccount) {
  const listeners = new Set<(account: CurrentAccount) => void>()
  let current = initial
  const tomato: TomatoAccount = {
    current: () => current,
    watch: (listener) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
  const ctx = new Context()
  ctx.provide('tomatoAccount', tomato)
  clients.push(ctx)
  return {
    ctx,
    set(account: CurrentAccount) {
      current = account
      for (const listener of [...listeners]) listener(account)
    },
  }
}

describe('account gateway provider', () => {
  it('projects the signed-in gateway user without exposing a model credential', async () => {
    const { ctx } = fixture({ status: 'signed-in', user })
    await ctx.plugin(AccountGateway, { usageUrl: 'https://usage.example', topUpUrl: 'https://topup.example' })
    const account = ctx.get('account')!
    expect(await account.getState()).toMatchObject({
      status: 'credential-stored', links: { usageUrl: 'https://usage.example', topUpUrl: 'https://topup.example' },
    })
    expect(await account.getProfile({ version: '1', locale: 'zh-CN', timezoneOffsetSeconds: 0 })).toEqual({
      status: 'ready', value: { id: 'user-1', name: 'Person', contact: 'person@example.com', avatarUrl: null },
    })
    expect(await account.resolveToken('https://api.deepseek.com')).toBeUndefined()
    expect(await account.getPlatformSession()).toBeNull()
    expect(await account.getEntitlements()).toEqual({ roles: ['admin'], quotas: { 'model.tokens.daily': 2000 } })
    expect(await account.getBalance({ version: '1', locale: 'en', timezoneOffsetSeconds: 0 })).toBeNull()
    expect(await account.getUnnotifiedBonuses({ version: '1', locale: 'en', timezoneOffsetSeconds: 0 })).toBeNull()
    expect(await account.ackBonusNotified('bonus' as never, 'order' as never,
      { version: '1', locale: 'en', timezoneOffsetSeconds: 0 })).toBe(false)
  })

  it('uses partial and absent link configuration defaults', async () => {
    const partial = fixture({ status: 'signed-out' })
    await partial.ctx.plugin(AccountGateway, { usageUrl: 'https://usage.example' })
    expect(await partial.ctx.get('account')!.getState()).toMatchObject({
      links: { usageUrl: 'https://usage.example', topUpUrl: '' },
    })
    const absent = fixture({ status: 'signed-out' })
    AccountGateway.apply(absent.ctx, {})
    expect(await absent.ctx.get('account')!.getState()).toMatchObject({ links: { usageUrl: '', topUpUrl: '' } })
  })

  it('reports a signed-out profile and no account user', async () => {
    const { ctx } = fixture({ status: 'signed-out' })
    await ctx.plugin(AccountGateway, {})
    const account = ctx.get('account')!
    expect(await account.getProfile({ version: '1', locale: 'en', timezoneOffsetSeconds: 0 })).toBeNull()
    expect(await account.getEntitlements()).toBeNull()
    expect(await account.getDeviceIdentity()).toMatchObject({ deviceId: expect.any(String), osVersion: expect.any(String) })
    expect(await account.getDeviceIdentity()).not.toHaveProperty('userId')
  })

  it('starts a gateway sign-in and follows the verified account', async () => {
    const { ctx, set } = fixture({ status: 'signed-out' })
    await ctx.plugin(AccountGateway, {})
    const account = ctx.get('account')!
    const starting = await account.startSignIn({ version: '1', locale: 'en', timezoneOffsetSeconds: 0 }, 'http://127.0.0.1:58337', 'web')
    expect(starting).toMatchObject({
      status: 'signed-out',
      attempt: { phase: 'waiting-browser', authorizeUrl: 'http://127.0.0.1:58337/api/auth/start' },
    })
    const attemptId = starting.attempt!.id
    const controller = new AbortController()
    const iterator = account.watch(controller.signal)[Symbol.asyncIterator]()
    const first = await iterator.next()
    expect(first.value).toMatchObject({ status: 'signed-out', attempt: { phase: 'waiting-browser' } })
    const pending = iterator.next()
    set({ status: 'signed-in', user })
    const second = await pending
    expect(second.value).toMatchObject({ status: 'credential-stored', attempt: { id: attemptId, phase: 'succeeded' } })
    await account.rejectToken('unused')
    controller.abort()
    expect(await iterator.next()).toMatchObject({ done: true })
    expect(await account.getDeviceIdentity()).toMatchObject({ userId: 'user-1' })
  })

  it('cancels a waiting attempt and reports signed-out after the gateway clears the account', async () => {
    const { ctx, set } = fixture({ status: 'signed-in', user })
    await ctx.plugin(AccountGateway, {})
    const account = ctx.get('account')!
    const started = await account.startSignIn({ version: '1', locale: 'en', timezoneOffsetSeconds: 0 }, 'http://127.0.0.1:1', 'desktop')
    expect(started.attempt?.authorizeUrl).toContain('desktop=1')
    expect((await account.cancelSignIn(started.attempt!.id)).attempt?.phase).toBe('cancelled')
    expect((await account.cancelSignIn('other' as never)).attempt?.phase).toBe('cancelled')
    const retry = await account.startSignIn({ version: '1', locale: 'en', timezoneOffsetSeconds: 0 }, 'http://127.0.0.1:1', 'web')
    set({ status: 'signed-out' })
    expect((await account.getState()).attempt).toMatchObject({ id: retry.attempt!.id, phase: 'failed', errorCode: 'expired' })
    expect(await account.getState()).toMatchObject({ status: 'signed-out' })
    expect(await account.signOut({ version: '1', locale: 'en', timezoneOffsetSeconds: 0 })).toMatchObject({ status: 'signed-out' })
    set({ status: 'signed-in', user })
    expect(await account.getState()).toMatchObject({ status: 'credential-stored' })
  })
})
