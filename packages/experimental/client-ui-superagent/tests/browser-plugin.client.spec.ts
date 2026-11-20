/** Real registries verify the ticket Remote mount, lazy read, and complete rollback. */
import assert from 'node:assert/strict'
import { Context, Service } from '@tomato/cordis'
import { LocaleRuntime } from '@tomato/client-locale/client'
import { SlotRegistry } from '@tomato/client-ui-renderer/client'
import type { TypertRemoteContribution } from '@tomato/typert-protocol'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { inject, mountSuperagentTickets } from '../src/client/mount.ts'
import { en, zh } from '../src/client/ticket-locales.ts'
import type { TicketsTabInjected } from '../src/client/TicketsTab.tsx'

const CONTRIBUTION: TypertRemoteContribution = { package: '@tomato/superagent-runtime', descriptors: [] }

describe('superagent ticket browser plugin', () => {
  it('mounts the Remote, reads when the panel is injected, and removes every registration on unload', async () => {
    const ctx = new Context()
    onTestFinished(() => ctx.fiber.dispose())
    await ctx.plugin(SlotRegistry).await()
    ctx.slots.register({
      name: 'root',
      children: { 'sidebar.right.pane.tab': { kind: 'keyed', scope: 'session' } },
    } as never, () => null)
    const locale = new LocaleRuntime(ctx)
    ctx.provide('locale', locale)
    const unregister = vi.fn()
    const register = vi.fn((definition: { title: () => string; guide?: readonly { title: () => string }[] }) => {
      void definition
      return unregister
    })
    ctx.provide('sidebarRightTabs', { register })
    const unmount = vi.fn(async () => {})
    const list = vi.fn(async (_signal?: AbortSignal) => ({ ok: true as const, value: [] }))
    const watch = vi.fn((_signal?: AbortSignal) => ({
      [Symbol.asyncIterator]: () => ({ next: () => Promise.resolve({ done: true as const, value: undefined }) }),
      send: () => {},
      end: () => {},
      dispose: () => {},
    }))
    class Remote extends Service {
      constructor(remoteCtx: Context) { super(remoteCtx, 'remote') }
      async $mount(contribution: TypertRemoteContribution) {
        expect(contribution).toBe(CONTRIBUTION)
        return unmount
      }
    }
    new Remote(ctx)
    ctx.provide('remote.superagentTickets', {
      list,
      watch,
      submit: vi.fn(),
      detail: vi.fn(),
      message: vi.fn(),
      cancel: vi.fn(),
      stop: vi.fn(),
    })

    const fiber = ctx.plugin({
      inject: [...inject],
      apply: (plugin: Context) => mountSuperagentTickets(plugin, CONTRIBUTION),
    })
    await fiber.await()
    const definition = register.mock.calls[0]?.[0]
    expect([en['tab.title'], zh['tab.title']]).toContain(definition?.title())
    expect(definition?.guide?.[0]?.title()).toBe(definition?.title())
    const entry = ctx.slots.entries('sidebar.right.pane.tab')[0]
    expect(entry).toMatchObject({ options: { key: '@tomato/client-ui-superagent/tickets' }, locale: 'superagentTickets' })
    expect(list).not.toHaveBeenCalled()
    const injectFace = entry?.inject as (() => TicketsTabInjected) | undefined
    assert(injectFace !== undefined)
    const face = injectFace()
    await vi.waitFor(() => { expect(face.hooks.tickets.getSnapshot().status).toBe('ready') })
    expect(list).toHaveBeenCalledOnce()
    expect(watch).toHaveBeenCalledOnce()
    expect(face.actions.submit).toBeTypeOf('function')

    await fiber.dispose()
    expect(unmount).toHaveBeenCalledOnce()
    expect(unregister).toHaveBeenCalledOnce()
    expect(ctx.slots.entries('sidebar.right.pane.tab')).toEqual([])

    vi.spyOn(locale, 'register').mockImplementation(() => { throw new Error('registration failed') })
    const failed = ctx.plugin({
      inject: [...inject],
      apply: (plugin: Context) => mountSuperagentTickets(plugin, CONTRIBUTION),
    })
    await expect(failed.await()).rejects.toThrow('registration failed')
    await failed.dispose()
    expect(unmount).toHaveBeenCalledTimes(2)
  })
})
