/** What the browser half registers, when it observes, and that the page leaves with the fiber. */

import { Context } from '@tomato/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import z from '@tomato/schemastery'
import { resolveSlotLabel } from '@tomato/client-ui-slots'
import { SlotRegistry } from '@tomato/client-ui-renderer/client'
import { RemoteError, TestRemote } from '@tomato/client-test-runtime'
import { LocaleRuntime } from '@tomato/client-locale/client'
import { apply as settingsApply, inject as settingsInject } from '@tomato/client-ui-settings/client'
import { installConnection } from '@tomato/client-connection/client'
import type { ObservableSnapshot } from '@tomato/client-store'
import { apply, inject, NS, SETTINGS_NAMESPACE } from '../src/client/index.ts'
import type { DeveloperSectionInjected } from '../src/client/index.ts'
import type { DeveloperState } from '../src/client/store.ts'

/** Serialized schema the Host describes for the developer namespace. */
const developerSchema = z.object({ enabled: z.boolean() }).toJSON()

/** One Host view of the developer namespace. */
function view(value: Record<string, unknown>, revision: number) {
  return { ns: SETTINGS_NAMESPACE, schema: developerSchema, value, applies: 'live', secrets: [], revision }
}

/** The developer page's Settings section, as its owner declares it. */
function declareRoot(slots: SlotRegistry): () => void {
  return slots.register({
    name: 'root',
    children: {
      'settings.section': { kind: 'list', scope: 'root' },
      'shell.overlay': { kind: 'list', scope: 'root' },
    },
  } as never, () => null)
}

async function bench(options: { development?: boolean; enabled?: boolean; served?: boolean } = {}) {
  vi.unstubAllGlobals()
  if (options.development !== false) vi.stubGlobal('tomatoDesktop', { development: true })
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  const locale = new LocaleRuntime(ctx)
  locale.setLocale('zh')
  ctx.provide('locale', locale)
  let current: Record<string, unknown> = { enabled: options.enabled ?? false }
  let revision = 1
  const mutate = vi.fn(async (_ns: string, ops: readonly { op: string; path: readonly (string | number)[]; value?: unknown }[]) => {
    for (const op of ops) {
      if (op.op === 'set' && op.path[0] === 'enabled') current = { ...current, enabled: op.value === true }
    }
    revision += 1
    return { ok: true, value: view(current, revision) }
  })
  const describeSettings = vi.fn(async () => options.served === false
    ? { ok: false, error: new RemoteError('gateway/internal', 'no provider', {}) }
    : { ok: true, value: { writable: true, hasDocument: true, namespaces: [view(current, revision)] } })
  new TestRemote(ctx, { settings: { describe: describeSettings, mutate } })
  await ctx.plugin({ inject: [...settingsInject], apply: settingsApply }).await()
  installConnection(ctx, {
    transport: {
      fetch: async (_input, init) => {
        const body = init.body
        const request = JSON.parse(typeof body === 'string' ? body : '{}') as { rpcId: string }
        return new Response(JSON.stringify({ type: 'server-response', rpcId: request.rpcId,
          result: { ok: true, value: null } }), { status: 200, headers: { 'content-type': 'application/json' } })
      },
    },
  })
  return { ctx, slots: ctx.get('slots') as SlotRegistry, mutate, describeSettings }
}

function face(entry: ReturnType<SlotRegistry['entries']>[number]): DeveloperSectionInjected {
  const injectFactory = entry.inject
  if (injectFactory === undefined) throw new Error('developer page inject is missing')
  const callable: () => DeveloperSectionInjected = injectFactory as never
  return callable()
}

afterEach(() => { vi.unstubAllGlobals() })

describe('ui-settings-developer apply', () => {
  it('declares the services it uses', () => {
    expect(inject).toEqual(['slots', 'locale', 'remote', 'configForms'])
  })

  it('registers the page in the development desktop shell, titled in the active locale', async () => {
    const { ctx, slots } = await bench()
    declareRoot(slots)
    await ctx.plugin({ inject: [...inject], apply }).await()
    await vi.waitFor(() => { expect(slots.entries('settings.section')).toHaveLength(1) })
    const entry = slots.entries('settings.section')[0]!
    expect(entry.options).toMatchObject({ id: 'developer', order: 5 })
    expect(resolveSlotLabel(entry.options.label)).toBe('开发者')
    expect(entry.locale).toBe(NS)
    expect(Object.keys(face(entry).hooks)).toEqual(['enabled', 'gateway'])
    expect(slots.entries('shell.overlay')).toHaveLength(1)
    expect(slots.entries('shell.overlay')[0]!.options).toMatchObject({ id: 'developer-panel' })
  })

  it('registers nothing outside the development desktop shell', async () => {
    const { ctx, slots } = await bench({ development: false })
    declareRoot(slots)
    await ctx.plugin({ inject: [...inject], apply }).await()
    expect(slots.entries('settings.section')).toHaveLength(0)
    expect(slots.entries('shell.overlay')).toHaveLength(0)
  })

  it('observes only while the switch is on and stops on teardown', async () => {
    const { ctx, slots, mutate } = await bench()
    declareRoot(slots)
    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    await vi.waitFor(() => { expect(slots.entries('settings.section')).toHaveLength(1) })
    const page = face(slots.entries('settings.section')[0]!)
    const gateway: ObservableSnapshot<DeveloperState> = page.hooks.gateway
    const connection = ctx.get('connection') as { rpc: { call: (channel: string, endpoint: string, payload: unknown) => Promise<unknown> } }
    expect(page.hooks.enabled.getSnapshot()).toBe(false)
    await connection.rpc.call('/api', 'before/switch', {})
    expect(gateway.getSnapshot().entries).toHaveLength(0)
    await page.setEnabled(true)
    expect(mutate).toHaveBeenCalledWith(SETTINGS_NAMESPACE, [{ op: 'set', path: ['enabled'], value: true }], expect.any(Number))
    await vi.waitFor(() => { expect(page.hooks.enabled.getSnapshot()).toBe(true) })
    await connection.rpc.call('/api', 'while/on', {})
    await vi.waitFor(() => { expect(gateway.getSnapshot().entries).toHaveLength(1) })
    await page.setEnabled(false)
    await vi.waitFor(() => { expect(page.hooks.enabled.getSnapshot()).toBe(false) })
    await connection.rpc.call('/api', 'after/switch', {})
    expect(gateway.getSnapshot().entries).toHaveLength(1)
    await fiber.dispose()
    expect(slots.entries('settings.section')).toHaveLength(0)
    expect(slots.entries('shell.overlay')).toHaveLength(0)
  })

  it('reports swallowed write failures through the injected action', async () => {
    const { ctx, slots, mutate } = await bench()
    mutate.mockResolvedValueOnce({ ok: false } as never)
    declareRoot(slots)
    await ctx.plugin({ inject: [...inject], apply }).await()
    await vi.waitFor(() => { expect(slots.entries('settings.section')).toHaveLength(1) })
    const page = face(slots.entries('settings.section')[0]!)
    await expect(page.setEnabled(true)).rejects.toThrow('developer setting was not saved')
  })

  it('reads page facts with the fallbacks a missing composition leaves', async () => {
    const { ctx, slots } = await bench()
    declareRoot(slots)
    await ctx.plugin({ inject: [...inject], apply }).await()
    await vi.waitFor(() => { expect(slots.entries('settings.section')).toHaveLength(1) })
    const page = face(slots.entries('settings.section')[0]!)
    page.refreshPageInfo()
    const gateway: ObservableSnapshot<DeveloperState> = page.hooks.gateway
    await vi.waitFor(() => { expect(gateway.getSnapshot().page).toBeDefined() })
    expect(gateway.getSnapshot().page).toMatchObject({
      release: 'unknown', modules: 0, plugins: 0, connection: 'unknown', panel: 'conversation', sessions: 0,
    })
    page.clear()
  })
})
