// @vitest-environment jsdom
/** The monitor plugin registers its overlay entry, exposes its business face, and retracts both. */
import { Context } from '@tomato/cordis'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { SlotRegistry } from '@tomato/client-ui-renderer/client'
import { LocaleRuntime } from '@tomato/client-locale/client'
import { apply, inject } from '../src/client/index.ts'
import type { SystemMonitorInjected } from '../src/client/Dock.tsx'
import type { SystemMonitorSnapshot } from '@tomato/api-system-monitor-controller/client'
import { apply as nodeApply } from '../src/index.ts'

/** A stand-in for `ctx.systemMonitor` with just the members the overlay reads. */
const monitor = {
  state: {
    getSnapshot: (): SystemMonitorSnapshot => ({ frame: null, points: [], status: 'idle', failure: null }),
    subscribe: () => () => {},
  },
  watch: () => () => {},
}

/** Point the document at one query string. */
function setSearch(search: string): void {
  window.history.replaceState({}, '', `/${search}`)
}

afterEach(() => {
  setSearch('')
  Reflect.deleteProperty(window, 'tomatoDesktop')
})

/**
 * Boot the plugin over a real slot registry, locale runtime, and monitor face.
 * @returns the context, the plugin fiber, and the registered entry.
 */
async function bench() {
  const ctx = new Context()
  onTestFinished(async () => { await ctx.fiber.dispose() })
  await ctx.plugin(SlotRegistry).await()
  ctx.slots.register({
    name: 'root',
    children: { 'shell.overlay': { kind: 'list', scope: 'root' } },
  } as never, (() => null) as never)
  ctx.provide('locale', new LocaleRuntime(ctx))
  ctx.provide('systemMonitor', monitor)
  const fiber = ctx.plugin({ inject: [...inject], apply })
  await fiber.await()
  return { ctx, fiber }
}

describe('ui-system-monitor browser plugin', () => {
  it('registers one overlay entry with the injected monitor face', async () => {
    const { ctx } = await bench()
    const entries = ctx.slots.entries('shell.overlay')
    expect(entries).toHaveLength(1)
    const entry = entries[0]!
    expect(entry.options).toMatchObject({ id: 'system-monitor' })
    expect(entry.locale).toBe('systemMonitor')
    const injected = entry.inject as unknown as () => SystemMonitorInjected
    expect(injected().hooks.monitor).toBe(monitor.state)
    expect(typeof injected().watch()).toBe('function')
  })

  it('registers its dictionaries', async () => {
    const { ctx } = await bench()
    expect(ctx.locale.bind('systemMonitor')('title')).toBe('System monitor')
  })

  it('renders the window surface for the panel document and marks the page', async () => {
    setSearch('?surface=system-monitor')
    const { ctx } = await bench()
    expect(document.documentElement.dataset.systemMonitorWindow).toBe('')
    const injected = ctx.slots.entries('shell.overlay')[0]!.inject as unknown as () => SystemMonitorInjected
    expect(injected().surface).toBe('window')
    expect(injected().closeWindow).toBeNull()
    await ctx.fiber.dispose()
    expect(document.documentElement.dataset.systemMonitorWindow).toBeUndefined()
  })

  it('reaches the desktop panel bridge when the shell provides it', async () => {
    const toggle = vi.fn(async () => true)
    const close = vi.fn(async () => {})
    Reflect.set(window, 'tomatoDesktop', { systemMonitor: { toggle, close } })
    const { ctx } = await bench()
    const injected = ctx.slots.entries('shell.overlay')[0]!.inject as unknown as () => SystemMonitorInjected
    expect(injected().surface).toBe('overlay')
    injected().floatPanel?.()
    expect(toggle).toHaveBeenCalledTimes(1)
    setSearch('?surface=system-monitor')
    const windowed = await bench()
    const face = windowed.ctx.slots.entries('shell.overlay')[0]!.inject as unknown as () => SystemMonitorInjected
    face().closeWindow?.()
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('retracts the entry with the plugin fiber', async () => {
    const { ctx, fiber } = await bench()
    await fiber.dispose()
    expect(ctx.slots.entries('shell.overlay')).toHaveLength(0)
  })

  it('keeps the node half inert', () => {
    nodeApply()
    expect(nodeApply).toBeTypeOf('function')
  })
})
