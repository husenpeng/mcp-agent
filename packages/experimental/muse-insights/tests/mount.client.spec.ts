// @vitest-environment jsdom
/** The browser contribution mounts its Remote, registrations, notice, and navigation, then leaves cleanly. */
import assert from 'node:assert/strict'
import { Context, Service } from '@tomato/cordis'
import { expect, it, vi } from 'vitest'
import { SlotRegistry } from '@tomato/client-ui-renderer/client'
import { LocaleRuntime } from '@tomato/client-locale/client'
import type { ObservableSnapshot } from '@tomato/client-store'
import type { TypertRemoteContribution } from '@tomato/typert-protocol'
import { apply, inject } from '../src/client/index.ts'
import { POLL_INTERVAL_MS } from '../src/client/controller.ts'
import type { MuseInsightsSnapshot } from '../src/types.ts'

const snapshot: MuseInsightsSnapshot = {
  available: true,
  day: '2026-11-02',
  recap: {
    day: '2026-11-02', generatedAt: 1, source: 'local', headline: '', summary: '', workItems: [], openTasks: [], sessions: [], messageCount: 0,
  },
  unfinished: { analyzedAt: 0, tasks: [] },
  analyzing: false,
}

/** Registration shape the fake tab registry receives. */
interface TabDefinition {
  readonly id: string
  readonly kind: string
  readonly title: () => string
  readonly guide: readonly { readonly title: () => string; readonly description?: () => string }[]
}

interface MountedSidebar {
  readonly mounted: ObservableSnapshot<string | undefined>
  readonly openTab: ReturnType<typeof vi.fn<(kind: string, options?: { params?: { view?: string } }) => void>>
  tabsIn(sessionId: string): readonly { readonly id: string }[]
  setMounted(value: string | undefined): void
}

function sidebar(): MountedSidebar {
  let value: string | undefined
  const listeners = new Set<() => void>()
  const openTab = vi.fn<(kind: string, options?: { params?: { view?: string } }) => void>()
  return {
    mounted: {
      getSnapshot: () => value,
      subscribe: (listener) => {
        listeners.add(listener)
        return () => { listeners.delete(listener) }
      },
    },
    openTab,
    tabsIn: () => [{ id: 'tab1' }],
    setMounted(next) {
      value = next
      for (const listener of [...listeners]) listener()
    },
  }
}

/** The tab injection face each page registration must expose. */
interface TabFace {
  readonly hooks: { readonly insights: ObservableSnapshot<unknown> }
  readonly onRefresh: (signal?: AbortSignal) => Promise<void>
  readonly workItemBindings?: BindingFace
}

/** One detail page's durable binding, as its signatures reach it. */
interface BindingFace {
  read(session: string, tab: string): unknown
  write(session: string, tab: string, target: { day: string; title: string }): void
}

/** The chip injection face the work item page's title registration must expose. */
interface TitleFace {
  readonly workItemBindings: BindingFace
}

/** The notice injection face the overlay registration must expose. */
interface NoticeFace {
  readonly onOpen: (view: 'recap' | 'unfinished') => void
  readonly onDismiss: () => void
}

function assertTabFace(value: Record<string, unknown>): asserts value is Record<string, unknown> & TabFace {
  assert(typeof value.onRefresh === 'function')
  assert(typeof value.hooks === 'object' && value.hooks !== null)
}

function assertNoticeFace(value: Record<string, unknown>): asserts value is Record<string, unknown> & NoticeFace {
  assert(typeof value.onOpen === 'function')
  assert(typeof value.onDismiss === 'function')
}

function assertTitleFace(value: Record<string, unknown>): asserts value is Record<string, unknown> & TitleFace {
  assert(typeof value.workItemBindings === 'object' && value.workItemBindings !== null)
}

it('mounts the Remote, its page type, notice, and navigation face, then withdraws both halves', async () => {
  const ctx = new Context()
  const unmount = vi.fn(async () => {})
  class TestRemote extends Service {
    constructor() { super(ctx, 'remote') }
    async $mount(value: TypertRemoteContribution) {
      expect((value as { spec?: { package?: string } }).spec?.package).toBe('@tomato/experimental-muse-insights')
      return unmount
    }
  }
  new TestRemote()
  const sidebarRight = sidebar()
  const startSession = vi.fn(() => {
    queueMicrotask(() => { sidebarRight.setMounted('session-2') })
  })
  const register = vi.fn<(definition: TabDefinition) => () => void>(() => () => {})
  const snapshotCall = vi.fn(async () => ({ ok: true as const, value: snapshot }))
  const refreshCall = vi.fn(async () => ({ ok: true as const, value: snapshot }))
  ctx.provide('remote.museInsights', { snapshot: snapshotCall, refresh: refreshCall } as never)
  ctx.provide('sidebarRightTabs', { register } as never)
  ctx.provide('sidebarRight', sidebarRight as never)
  ctx.provide('uiWorkspace', { startSession } as never)
  ctx.provide('locale', new LocaleRuntime(ctx))
  await ctx.plugin(SlotRegistry)
  ctx.slots.register({
    name: 'root',
    children: {
      'sidebar.right.pane.tab': { kind: 'keyed', scope: 'session' },
      'sidebar.right.pane.tab.title': { kind: 'keyed', scope: 'session' },
      'shell.overlay': { kind: 'list', scope: 'root' },
    },
  } as never, () => null)

  const dispose = await apply(ctx)
  expect(inject).toContain('sidebarRight')
  expect(register).toHaveBeenCalledTimes(2)
  const definition = register.mock.calls[0]?.[0]
  assert(definition !== undefined)
  expect(definition.kind).toBe('muse-insights')
  expect(definition.id).toBe('@tomato/experimental-muse-insights/recap')
  expect(definition.title()).toBe('Daily recap')
  expect(definition.guide).toHaveLength(1)
  const guide = definition.guide[0]
  assert(guide !== undefined)
  expect(guide.title()).toBe('Daily recap and tasks')
  expect(guide.description?.()).toBe('Today’s work summary and unfinished tasks')
  const itemDefinition = register.mock.calls[1]?.[0]
  assert(itemDefinition !== undefined)
  expect(itemDefinition.kind).toBe('museInsightsWorkItem')
  expect(itemDefinition.id).toBe('@tomato/experimental-muse-insights/work-item')
  expect(itemDefinition.title()).toBe('Work item')
  expect(ctx.slots.entries('sidebar.right.pane.tab')).toHaveLength(2)
  expect(ctx.slots.entries('sidebar.right.pane.tab.title')).toHaveLength(1)
  expect(ctx.slots.entries('shell.overlay')).toHaveLength(1)
  const tabEntry = ctx.slots.entries('sidebar.right.pane.tab')[0]!
  assert(typeof tabEntry.inject === 'function')
  const tabFace = tabEntry.inject()
  assertTabFace(tabFace)
  await tabFace.onRefresh()
  expect(refreshCall).toHaveBeenCalledTimes(1)
  const itemEntry = ctx.slots.entries('sidebar.right.pane.tab')[1]!
  assert(typeof itemEntry.inject === 'function')
  const itemFace = itemEntry.inject()
  assertTabFace(itemFace)
  await itemFace.onRefresh()
  expect(refreshCall).toHaveBeenCalledTimes(2)
  assert(itemFace.workItemBindings !== undefined)
  itemFace.workItemBindings.write('session-1', 'tab1', { day: '2026-11-02', title: 'Draft the plan' })
  expect(itemFace.workItemBindings.read('session-1', 'tab1')).toEqual({ day: '2026-11-02', title: 'Draft the plan' })
  const titleEntry = ctx.slots.entries('sidebar.right.pane.tab.title')[0]!
  assert(typeof titleEntry.inject === 'function')
  assertTitleFace(titleEntry.inject())
  const noticeEntry = ctx.slots.entries('shell.overlay')[0]!
  assert(typeof noticeEntry.inject === 'function')
  const noticeFace = noticeEntry.inject()
  assertNoticeFace(noticeFace)
  await vi.waitFor(() => { expect(snapshotCall).toHaveBeenCalled() })
  noticeFace.onOpen('recap')
  expect(startSession).toHaveBeenCalledTimes(1)
  await vi.waitFor(() => {
    expect(sidebarRight.openTab).toHaveBeenCalledWith('muse-insights', { params: { view: 'recap' } })
  })
  noticeFace.onDismiss()
  await dispose()
  expect(ctx.slots.entries('sidebar.right.pane.tab')).toHaveLength(0)
  expect(ctx.slots.entries('sidebar.right.pane.tab.title')).toHaveLength(0)
  expect(ctx.slots.entries('shell.overlay')).toHaveLength(0)
  expect(unmount).toHaveBeenCalledTimes(1)
  await ctx.fiber.dispose()
  expect(POLL_INTERVAL_MS).toBeGreaterThan(0)
})
