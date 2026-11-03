/** The shared insights observable feeds both entries and keeps visible data on a failed refresh. */
import { describe, expect, it, vi } from 'vitest'
import { createInsightsSource } from '../src/client/source.ts'
import type { MuseInsightsSnapshot } from '../src/types.ts'

function snapshot(): MuseInsightsSnapshot {
  return {
    available: true,
    day: '2026-11-02',
    recap: null,
    unfinished: { analyzedAt: 0, tasks: [] },
    analyzing: false,
  }
}

describe('insights source', () => {
  it('publishes complete state and keeps the last snapshot when a later read fails', () => {
    const source = createInsightsSource()
    const listener = vi.fn()
    const unsubscribe = source.hooks.insights.subscribe(listener)
    expect(source.hooks.insights.getSnapshot()).toEqual({
      status: 'loading', snapshot: null, notice: null, refreshing: false,
    })
    source.actions.loaded(snapshot())
    expect(listener).toHaveBeenCalledTimes(1)
    expect(source.hooks.insights.getSnapshot().status).toBe('ready')
    source.actions.failed()
    expect(source.hooks.insights.getSnapshot()).toMatchObject({ status: 'ready', snapshot: { day: '2026-11-02' } })
    source.actions.refreshing(true)
    expect(source.hooks.insights.getSnapshot().refreshing).toBe(true)
    source.actions.refreshing(false)
    expect(source.hooks.insights.getSnapshot().refreshing).toBe(false)
    unsubscribe()
  })

  it('reports a first read failure and shows or dismisses one notice', () => {
    const source = createInsightsSource()
    source.actions.failed()
    expect(source.hooks.insights.getSnapshot().status).toBe('error')
    source.actions.showNotice({ id: 1, kind: 'unfinished', tasks: [] })
    expect(source.hooks.insights.getSnapshot().notice).toMatchObject({ id: 1, kind: 'unfinished' })
    source.actions.dismissNotice()
    expect(source.hooks.insights.getSnapshot().notice).toBeNull()
  })
})
