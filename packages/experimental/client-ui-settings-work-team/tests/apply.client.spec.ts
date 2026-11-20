/** What the browser half registers, when, what its face forwards, and that it all leaves with the fiber. */

import { Context } from '@tomato/cordis'
import { describe, expect, it, vi } from 'vitest'
import { brandString } from '@tomato/branded'
import { createSnapshotStore } from '@tomato/client-store'
import { resolveSlotLabel } from '@tomato/client-ui-slots'
import { SlotRegistry } from '@tomato/client-ui-renderer/client'
import { TestRemote } from '@tomato/client-test-runtime'
import { LocaleRuntime } from '@tomato/client-locale/client'
import { apply as settingsApply, inject as settingsInject } from '@tomato/client-ui-settings/client'
import type { RobotId, RobotRunsSnapshot, RobotSpecRef } from '@tomato/api-robot-controller/client'
import { apply, inject, NS, WORK_TEAM_ENTRY } from '../src/client/index.ts'
import type { WorkTeamSettingsCardFace } from '../src/client/index.ts'
import { apply as hostApply } from '../src/index.ts'

/** One Host view of a served namespace. */
function view(ns: string, revision = 0) {
  return { ns, schema: {}, value: {}, applies: 'live', secrets: [], revision }
}

/**
 * Assemble the settings runtime plus a stub robot service provided from a
 * sibling fiber, as the shipped client provides it.
 * @param served - namespaces the Host describes.
 * @returns the context, slot registry, and robot service spies.
 */
async function bench(served: string[]) {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  const locale = new LocaleRuntime(ctx)
  locale.setLocale('zh')
  ctx.provide('locale', locale)
  const describeSettings = vi.fn(() => Promise.resolve({
    ok: true, value: { writable: true, hasDocument: true, namespaces: served.map(ns => view(ns)) },
  }))
  new TestRemote(ctx, { settings: { describe: describeSettings } })
  await ctx.plugin({ inject: [...settingsInject], apply: settingsApply }).await()
  const snapshot: RobotRunsSnapshot = { specs: [], robots: [], runs: [], templates: [] }
  const state = createSnapshotStore<RobotRunsSnapshot>(snapshot)
  const publish = vi.fn()
  const rebind = vi.fn()
  await ctx.plugin((child: Context) => {
    child.provide('robotRuns', { state, publish, rebind })
  }).await()
  return { ctx, slots: ctx.get('slots') as SlotRegistry, state, snapshot, publish, rebind }
}

/** The Plugins page's item slot, as its owner declares it. */
function declareRoot(slots: SlotRegistry): () => void {
  return slots.register({
    name: 'root',
    children: { 'plugins.item': { kind: 'list', scope: 'root' } },
  } as never, () => null)
}

describe('ui-settings-work-team apply', () => {
  it('keeps the host Loader entry inert', () => {
    expect(hostApply).not.toThrow()
  })

  it('declares the services it uses', () => {
    expect(inject).toEqual(['slots', 'locale', 'configForms', 'robotRuns'])
  })

  it('registers one page while the Host serves the entry, titled in the active locale', async () => {
    const { ctx, slots, state, snapshot, publish, rebind } = await bench([WORK_TEAM_ENTRY])
    declareRoot(slots)

    await ctx.plugin({ inject: [...inject], apply }).await()

    await vi.waitFor(() => { expect(slots.entries('plugins.item')).toHaveLength(1) })
    const entry = slots.entries('plugins.item')[0]!
    expect(entry.options).toMatchObject({ id: 'work-team', order: 12 })
    expect(resolveSlotLabel(entry.options.label)).toBe('工作团队')
    expect(entry.locale).toBe(NS)
    const face = (entry.inject as () => Pick<WorkTeamSettingsCardFace, 'hooks' | 'robotSnapshot' | 'rebindRobot'>)()
    expect(Object.keys(face.hooks).sort()).toEqual(['robotRegistry', 'workTeamDefaults'])
    expect(face.hooks.robotRegistry).toBe(state)
    expect(face.robotSnapshot()).toBe(snapshot)
    const ref: RobotSpecRef = { spec: brandString<RobotSpecRef['spec']>('spec-scout'), revision: 2 }
    const request = { robotId: brandString<RobotId>('robot-scout'), ref }
    void face.rebindRobot(request)
    expect(rebind).toHaveBeenCalledWith(request)
    expect(publish).not.toHaveBeenCalled()
    await ctx.fiber.dispose()
  })

  it('registers nothing when the Host does not serve the entry', async () => {
    const { ctx, slots } = await bench(['shell'])
    declareRoot(slots)
    await ctx.plugin({ inject: [...inject], apply }).await()
    await vi.waitFor(() => { expect(slots.entries('plugins.item')).toHaveLength(0) })
    await ctx.fiber.dispose()
  })

  it('collapses the page on teardown', async () => {
    const { ctx, slots } = await bench([WORK_TEAM_ENTRY])
    declareRoot(slots)
    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    await vi.waitFor(() => { expect(slots.entries('plugins.item')).toHaveLength(1) })

    await fiber.dispose()

    expect(slots.entries('plugins.item')).toHaveLength(0)
    await ctx.fiber.dispose()
  })
})
