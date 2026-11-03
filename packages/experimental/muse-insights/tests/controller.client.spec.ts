// @vitest-environment jsdom
/** Polling decides notices, explicit refresh retains visible data, and opening navigates the right Sidebar. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RemoteResult } from '@tomato/api-remotes/client'
import type { ObservableSnapshot } from '@tomato/client-store'
import { RemoteError } from '@tomato/client-test-runtime'
import { createInsightsController, POLL_INTERVAL_MS, type InsightsControllerHost } from '../src/client/controller.ts'
import { createInsightsSource } from '../src/client/source.ts'
import type { DailyRecap, MuseInsightsSnapshot } from '../src/types.ts'

afterEach(() => { vi.useRealTimers(); localStorage.clear(); vi.restoreAllMocks() })

const recap: DailyRecap = {
  day: '2026-11-02',
  generatedAt: 10,
  source: 'model',
  headline: 'Launch ready',
  summary: '',
  workItems: [{ title: 'Draft the plan', detail: '', status: 'done' }],
  openTasks: ['Send the brief'],
  sessions: [],
  messageCount: 1,
}

function snapshot(overrides: Partial<MuseInsightsSnapshot> = {}): MuseInsightsSnapshot {
  return {
    available: true,
    day: '2026-11-02',
    recap,
    unfinished: { analyzedAt: 0, tasks: [] },
    analyzing: false,
    ...overrides,
  }
}

interface HostFixture {
  readonly host: InsightsControllerHost
  readonly snapshot: ReturnType<typeof vi.fn<(signal: AbortSignal) => Promise<RemoteResult<MuseInsightsSnapshot>>>>
  readonly refresh: ReturnType<typeof vi.fn<(signal: AbortSignal) => Promise<RemoteResult<MuseInsightsSnapshot>>>>
  readonly openTab: ReturnType<typeof vi.fn<(view: 'recap' | 'unfinished') => void>>
  readonly startSession: ReturnType<typeof vi.fn<() => void>>
  readonly warn: ReturnType<typeof vi.fn<(message: string, error: unknown) => void>>
  setMounted(value: string | undefined): void
  reset(): void
}

function hostFixture(): HostFixture {
  let mountedValue: string | undefined = 'session-1'
  const listeners = new Set<() => void>()
  const resets = new Set<() => void>()
  const mounted: ObservableSnapshot<string | undefined> = {
    getSnapshot: () => mountedValue,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
  const snapshotCall = vi.fn<(signal: AbortSignal) => Promise<RemoteResult<MuseInsightsSnapshot>>>()
    .mockResolvedValue({ ok: true, value: snapshot() })
  const refreshCall = vi.fn<(signal: AbortSignal) => Promise<RemoteResult<MuseInsightsSnapshot>>>()
    .mockResolvedValue({ ok: true, value: snapshot() })
  const openTab = vi.fn<(view: 'recap' | 'unfinished') => void>()
  const startSession = vi.fn<() => void>()
  const warn = vi.fn<(message: string, error: unknown) => void>()
  const host: InsightsControllerHost = {
    snapshot: snapshotCall,
    refresh: refreshCall,
    mounted,
    openTab,
    startSession,
    onReset: (listener) => {
      resets.add(listener)
      return () => { resets.delete(listener) }
    },
    warn,
  }
  return {
    host,
    snapshot: snapshotCall,
    refresh: refreshCall,
    openTab,
    startSession,
    warn,
    setMounted: (value) => {
      mountedValue = value
      for (const listener of [...listeners]) listener()
    },
    reset: () => { for (const listener of [...resets]) listener() },
  }
}

describe('insights controller', () => {
  it('publishes the first snapshot and raises one recap notice per day', async () => {
    const fixture = hostFixture()
    const source = createInsightsSource()
    const controller = createInsightsController(fixture.host, source)
    await vi.waitFor(() => { expect(source.hooks.insights.getSnapshot().status).toBe('ready') })
    expect(source.hooks.insights.getSnapshot().notice).toMatchObject({ kind: 'recap' })
    expect(JSON.parse(localStorage.getItem('tomato.muse-insights.v1') ?? '{}')).toMatchObject({ recapDay: '2026-11-02' })
    source.actions.dismissNotice()
    await controller.poll()
    expect(source.hooks.insights.getSnapshot().notice).toBeNull()
    controller.dispose()
  })

  it('raises the unfinished notice once per cooldown while tasks remain', async () => {
    const fixture = hostFixture()
    fixture.snapshot.mockResolvedValue({
      ok: true,
      value: snapshot({
        recap: null,
        unfinished: {
          analyzedAt: 20,
          tasks: [{ id: 'a', title: 'Send the brief', detail: '', status: 'pending', source: 'todo', sessionId: 's1', sessionTitle: null }],
        },
      }),
    })
    const source = createInsightsSource()
    const controller = createInsightsController(fixture.host, source)
    await vi.waitFor(() => { expect(source.hooks.insights.getSnapshot().notice).toMatchObject({ kind: 'unfinished' }) })
    source.actions.dismissNotice()
    await controller.poll()
    expect(source.hooks.insights.getSnapshot().notice).toBeNull()
    localStorage.setItem('tomato.muse-insights.v1', JSON.stringify({ recapDay: null, lastReminderAt: Date.now() - 31 * 60_000 }))
    await controller.poll()
    expect(source.hooks.insights.getSnapshot().notice).toMatchObject({ kind: 'unfinished' })
    controller.dispose()
  })

  it('opens the details page directly when a Session is on screen', async () => {
    const fixture = hostFixture()
    const source = createInsightsSource()
    const controller = createInsightsController(fixture.host, source)
    await vi.waitFor(() => { expect(source.hooks.insights.getSnapshot().notice).not.toBeNull() })
    controller.open('recap')
    expect(fixture.openTab).toHaveBeenCalledExactlyOnceWith('recap')
    expect(source.hooks.insights.getSnapshot().notice).toBeNull()
    controller.dispose()
  })

  it('starts a Session and opens once it is on screen when none is selected', async () => {
    const fixture = hostFixture()
    fixture.setMounted(undefined)
    const source = createInsightsSource()
    const controller = createInsightsController(fixture.host, source)
    controller.open('unfinished')
    expect(fixture.startSession).toHaveBeenCalledTimes(1)
    expect(fixture.openTab).not.toHaveBeenCalled()
    fixture.setMounted('session-2')
    await vi.waitFor(() => { expect(fixture.openTab).toHaveBeenCalledExactlyOnceWith('unfinished') })
    controller.dispose()
  })

  it('keeps the last snapshot on a failed refresh and reports the failure', async () => {
    const fixture = hostFixture()
    const source = createInsightsSource()
    const controller = createInsightsController(fixture.host, source)
    await vi.waitFor(() => { expect(source.hooks.insights.getSnapshot().status).toBe('ready') })
    fixture.refresh.mockResolvedValue({ ok: false, error: new RemoteError('gateway/internal', 'boom', {}) })
    await controller.refresh()
    expect(source.hooks.insights.getSnapshot()).toMatchObject({ status: 'ready', refreshing: false })
    expect(source.hooks.insights.getSnapshot().snapshot).not.toBeNull()
    expect(fixture.warn).toHaveBeenCalledWith('explicit refresh failed', expect.anything())
    controller.dispose()
  })

  it('polls again on reconnect and stops its interval on disposal', async () => {
    vi.useFakeTimers()
    const fixture = hostFixture()
    const source = createInsightsSource()
    const controller = createInsightsController(fixture.host, source)
    await vi.waitFor(() => { expect(fixture.snapshot).toHaveBeenCalledTimes(1) })
    fixture.reset()
    await vi.waitFor(() => { expect(fixture.snapshot).toHaveBeenCalledTimes(2) })
    controller.dispose()
    const calls = fixture.snapshot.mock.calls.length
    vi.advanceTimersByTime(POLL_INTERVAL_MS * 2)
    expect(fixture.snapshot).toHaveBeenCalledTimes(calls)
    vi.useRealTimers()
  })
})
