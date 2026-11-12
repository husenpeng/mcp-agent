// @vitest-environment jsdom
/**
 * The page's injected face reads the gateway, Session list, and robot service
 * through the plugin's own inject declaration. Cordis exposes only declared
 * services on the plugin context, so a face that reads `ctx.remote` while the
 * declaration lists only `remote.permissionPresets` fails before it issues any
 * request and every capability picker opens empty.
 */
import { Context } from '@tomato/cordis'
import { createSnapshotStore } from '@tomato/client-store'
import { RemoteError } from '@tomato/typert-protocol'
import { describe, expect, it, vi } from 'vitest'
import type { RobotCapabilityCatalog } from '@tomato/api-robot-controller/client'
import { apply, inject } from '../src/client/index.ts'
import type { RobotInjected } from '../src/client/RobotPage.tsx'

const CATALOG: RobotCapabilityCatalog = {
  skills: [{ value: 'brand-insight', label: 'brand-insight' }],
  plugins: [{ value: '@tomato/marketing', label: '@tomato/marketing' }],
  tools: [{ value: 'web_search', label: 'web_search' }],
  mcpServers: [],
  workspaceRoots: [{ value: '/work', label: 'Work', path: '/work' }],
}

/** One captured `slots.register` declaration. */
interface Registration {
  readonly name: string
  readonly key?: string
  readonly inject: () => RobotInjected
}

/**
 * Mount the plugin over stub services, keeping every slot registration.
 *
 * Each stub is provided from its own sibling fiber, as the shipped client
 * provides them: a root-level `provide` would sit on the plugin's own ancestor
 * chain and hide a missing inject declaration.
 * @returns the root context, the captured registrations, and the catalog doubles.
 */
async function bench() {
  const ctx = new Context()
  /** Provide one stub from a sibling fiber, the way a feature plugin would. */
  const provide = async (name: string, value: unknown): Promise<void> => {
    await ctx.plugin((child: Context) => { child.provide(name, value) }).await()
  }
  const registrations: Registration[] = []
  await provide('slots', {
    inject: (_name: string, run: () => unknown) => { run(); return () => {} },
    register: (declaration: Registration) => { registrations.push(declaration); return () => {} },
  })
  await provide('locale', {
    register: () => () => {},
    bind: () => (key: string) => key,
    getSnapshot: () => ({ active: 'zh' }),
  })
  await provide('layout', { selectPanel: vi.fn() })
  await provide('uiWorkspace', { startSession: vi.fn(), listDirectory: vi.fn(), pickDirectory: vi.fn() })
  await provide('uiConversation', { binding: () => ({ target: () => createSnapshotStore(undefined) }) })
  await provide('sessions', {
    list: createSnapshotStore({ ids: [], byId: {}, phase: 'ready', projectionsBySession: {} }),
  })
  const capabilities = vi.fn(async () => ({ ok: true as const, value: CATALOG }))
  await provide('robotRuns', {
    state: createSnapshotStore({ specs: [], robots: [], runs: [], templates: [] }),
    capabilities,
    publish: vi.fn(), instantiate: vi.fn(), rebind: vi.fn(), install: vi.fn(), remove: vi.fn(), hire: vi.fn(),
    start: vi.fn(), cancel: vi.fn(), interrupt: vi.fn(), correct: vi.fn(),
  })
  const presetCatalog = vi.fn(async () => ({
    ok: true as const,
    value: { options: [{ value: 'workspace', name: 'Workspace' }] },
  }))
  const modelCatalog = vi.fn(async () => ({
    ok: false as const,
    error: new RemoteError('gateway/internal', 'the stub offers no model catalog', {}),
  }))
  const remote = { permissionPresets: { catalog: presetCatalog }, session: { modelCatalog } }
  await provide('remote', remote)
  await provide('remote.permissionPresets', remote.permissionPresets)
  await provide('remote.session', remote.session)
  const fiber = ctx.plugin({ inject: [...inject], apply })
  await fiber.await()
  return { ctx, registrations, capabilities, presetCatalog, fiber }
}

describe('ui-robot inject declaration', () => {
  it('reads both catalogs and the robot capability list through the gateway it declares', async () => {
    const b = await bench()
    try {
      const main = b.registrations.find(registration => registration.name === 'main')
      expect(main).toBeDefined()
      const data = await main!.inject().references()
      expect(b.presetCatalog).toHaveBeenCalledOnce()
      expect(b.capabilities).toHaveBeenCalledOnce()
      expect(data.capabilities).toEqual(CATALOG)
      expect(data.presets).toEqual([{ value: 'workspace', label: 'Workspace' }])
    } finally {
      await b.fiber.dispose()
    }
  })

})
