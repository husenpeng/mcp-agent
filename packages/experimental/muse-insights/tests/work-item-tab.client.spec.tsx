// @vitest-environment jsdom
/** One work item's page draws the item its tab names, recovers it after a reload, and reports one the recap dropped. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { allowAllAccess, makeTranslate } from '@tomato/client-test-runtime'
import { SessionId } from '@tomato/session/types'
import type { SidebarRightTabActions, SidebarRightTabInfo, TabId } from '@tomato/client-ui-sidebar-right/client'
import type { GlobalStandardProps, SessionStandardProps, SnapshotSelectorHook } from '@tomato/client-ui-slots'
import { formatDay } from '../src/client/format.ts'
import { en } from '../src/client/locales.ts'
import type { InsightsState } from '../src/client/source.ts'
import type { DailyRecap, MuseInsightsSnapshot, RecapWorkItem } from '../src/types.ts'
import { WorkItemTab, type WorkItemTabProps } from '../src/client/WorkItemTab.tsx'
import { WorkItemTabTitle, type WorkItemTabTitleProps } from '../src/client/WorkItemTabTitle.tsx'
import { WorkItemTabBindings } from '../src/client/work-item-bindings.ts'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

const sessionId = SessionId('session-1')
const tabId = 'tab-1' as TabId
/** The navigation one row's click passes: the recap day and the item's problem. */
const opened = { day: '2026-11-02', problem: 'The launch plan has no owner' }

const unused = (): never => { throw new Error('This isolated page does not read that framework hook') }
const standard: GlobalStandardProps & SessionStandardProps = {
  sessionId,
  useSession: unused, useProjection: unused, useConversation: unused, useInput: unused,
  useChat: unused, useTrajectory: unused,
  usePanelInfo: unused, useSessions: unused, useSessionStatus: unused,
  useSessionRetainInfo: unused, useResource: unused, useWorkspaces: unused,
  ...allowAllAccess,
  inputActions: {
    insertQuote: () => false, captureInsertion: unused, insertText: unused, setDraft: unused,
    persistDraft: unused, addAttachments: unused, removeAttachment: unused, pruneAttachments: unused, submit: unused,
  },
}

const recap: DailyRecap = {
  day: '2026-11-02',
  generatedAt: new Date(2026, 10, 2, 18, 5).getTime(),
  source: 'model',
  headline: 'Launch ready',
  summary: 'Prepared the launch.',
  workItems: [
    {
      problem: 'The launch plan has no owner',
      conclusion: 'The plan is drafted and the owner named.',
      solution: 'Wrote the plan down.\nNamed the owner and scheduled the review.',
      status: 'done',
      sessionIds: ['s1', 's2'],
    },
    {
      problem: 'The launch brief is still unsent',
      conclusion: 'Waiting on the legal review.',
      solution: '',
      status: 'ongoing',
      sessionIds: ['s1'],
    },
    {
      problem: 'The legal review blocks the brief',
      conclusion: '',
      solution: '',
      status: 'blocked',
      sessionIds: [],
    },
    {
      problem: 'Meeting notes were archived',
      conclusion: 'Filed the notes.',
      solution: '',
      status: 'unknown',
      sessionIds: ['s2'],
    },
  ],
  openTasks: [],
  sessions: [
    { sessionId: 's1', title: 'Launch plan', summary: 'Drafted the plan.', messageCount: 4 },
    { sessionId: 's2', title: 'Legal review', summary: 'Reviewed the claims.', messageCount: 1 },
  ],
  messageCount: 8,
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

function ready(overrides: Partial<MuseInsightsSnapshot> = {}): InsightsState {
  return { status: 'ready', snapshot: snapshot(overrides), notice: null, refreshing: false }
}

/** One detail tab as an open or a reloaded Sidebar hands it to its body. */
function tabInfo(params: unknown, actions: SidebarRightTabActions, revision = 1): SidebarRightTabInfo {
  return {
    sidebar: { expanded: true, fullscreen: false },
    panel: { id: 'pane-1' },
    tab: {
      id: tabId,
      kind: 'museInsightsWorkItem',
      contentId: 'sidebar://museInsightsWorkItem',
      title: 'Work item',
      navigation: { address: 'sidebar://museInsightsWorkItem', params, revision },
      actions,
      signal: new AbortController().signal,
    },
  } as SidebarRightTabInfo
}

function tabActions() {
  const openTab = vi.fn()
  const actions: SidebarRightTabActions = { bindCommands: vi.fn(() => vi.fn()), openResource: vi.fn(), openTab, close: vi.fn() }
  return { actions, openTab }
}

function mount(
  state: InsightsState,
  params: unknown,
  bindings = new WorkItemTabBindings(),
) {
  const { actions, openTab } = tabActions()
  const info = tabInfo(params, actions)
  const onRefresh = vi.fn<(signal?: AbortSignal) => Promise<void>>(async () => {})
  const useInsights: SnapshotSelectorHook<InsightsState> = select => select(state)
  const props = {
    ...standard,
    useTabInfo: () => info,
    useInsights,
    workItemBindings: bindings,
    onRefresh,
    t: makeTranslate(en),
  } as WorkItemTabProps
  render(<WorkItemTab {...props} />)
  return { actions, openTab, onRefresh, bindings, info }
}

describe('WorkItemTab', () => {
  it('draws the named item with its status, day, and both detail sections', () => {
    mount(ready(), opened)
    expect(screen.getByRole('heading', { name: 'The launch plan has no owner' })).toBeTruthy()
    expect(screen.getByText(/^Done · /u)).toBeTruthy()
    expect(screen.getByText(formatDay('2026-11-02', 'en-US'), { exact: false })).toBeTruthy()
    expect(screen.getByText(/2 sessions/u)).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Conclusion' })).toBeTruthy()
    expect(screen.getByText('The plan is drafted and the owner named.')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Solution' })).toBeTruthy()
    expect(screen.getByText(/Named the owner and scheduled the review/u)).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Source sessions' })).toBeTruthy()
    expect(screen.getByText('Launch plan')).toBeTruthy()
    expect(screen.getByText('Legal review')).toBeTruthy()
    expect(screen.getByText('4 messages')).toBeTruthy()
    expect(screen.getByText('1 message')).toBeTruthy()
  })

  const statuses: readonly (readonly [RecapWorkItem['status'], string, string])[] = [
    ['done', 'The launch plan has no owner', 'Done'],
    ['ongoing', 'The launch brief is still unsent', 'Ongoing'],
    ['blocked', 'The legal review blocks the brief', 'Blocked'],
    ['unknown', 'Meeting notes were archived', 'Recorded'],
  ]
  it.each(statuses)('names a %s work item with the word that status owns', (_status, problem, label) => {
    mount(ready(), { day: '2026-11-02', problem })
    expect(screen.getByRole('heading', { name: problem })).toBeTruthy()
    expect(screen.getByText(new RegExp(`^${label} · `, 'u'))).toBeTruthy()
  })

  it('marks a recap that is not today’s', () => {
    mount(ready({ day: '2026-11-03' }), opened)
    expect(screen.getByText(/Latest recap/u)).toBeTruthy()
  })

  it('records the item each open names and recovers it for a restored tab', () => {
    const bindings = new WorkItemTabBindings()
    mount(ready(), opened, bindings)
    expect(bindings.read(sessionId, tabId)).toEqual({ day: '2026-11-02', problem: 'The launch plan has no owner' })
    cleanup()
    mount(ready(), undefined, bindings)
    expect(screen.getByRole('heading', { name: 'The launch plan has no owner' })).toBeTruthy()
  })

  it('follows a navigation that shows another item in the same page', () => {
    const bindings = new WorkItemTabBindings()
    const { actions } = tabActions()
    let info = tabInfo(opened, actions, 1)
    const state: InsightsState = { status: 'ready', snapshot: snapshot(), notice: null, refreshing: false }
    const useInsights: SnapshotSelectorHook<InsightsState> = select => select(state)
    const props = {
      ...standard,
      useTabInfo: () => info,
      useInsights,
      workItemBindings: bindings,
      onRefresh: vi.fn<(signal?: AbortSignal) => Promise<void>>(async () => {}),
      t: makeTranslate(en),
    } as WorkItemTabProps
    const view = render(<WorkItemTab {...props} />)
    expect(screen.getByRole('heading', { name: 'The launch plan has no owner' })).toBeTruthy()
    info = tabInfo({ day: '2026-11-02', problem: 'The launch brief is still unsent' }, actions, 2)
    view.rerender(<WorkItemTab {...props} />)
    expect(screen.getByRole('heading', { name: 'The launch brief is still unsent' })).toBeTruthy()
    expect(bindings.read(sessionId, tabId)).toEqual({ day: '2026-11-02', problem: 'The launch brief is still unsent' })
  })

  it('reports an item the latest recap no longer lists and opens the recap view', () => {
    const { openTab } = mount(ready(), { day: '2026-11-02', problem: 'Ship the release' })
    expect(screen.getByRole('heading', { name: 'This work item is no longer listed' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Open daily recap' }))
    expect(openTab).toHaveBeenCalledExactlyOnceWith('muse-insights', { params: { view: 'recap' } })
  })

  it('reports an item named by a day the latest recap no longer holds', () => {
    mount(ready(), { day: '2026-11-01', problem: 'The launch plan has no owner' })
    expect(screen.getByRole('heading', { name: 'This work item is no longer listed' })).toBeTruthy()
  })

  it('reports a restored tab without a binding and one carrying another type’s parameters', () => {
    mount(ready(), undefined)
    expect(screen.getByRole('heading', { name: 'This work item is no longer listed' })).toBeTruthy()
    cleanup()
    mount(ready(), { view: 'recap' })
    expect(screen.getByRole('heading', { name: 'This work item is no longer listed' })).toBeTruthy()
    cleanup()
    mount(ready(), { day: '2026-11-02' })
    expect(screen.getByRole('heading', { name: 'This work item is no longer listed' })).toBeTruthy()
  })

  it('waits for the first read and centers a failure with a retry', () => {
    mount({ status: 'loading', snapshot: null, notice: null, refreshing: false }, opened)
    expect(screen.getByRole('status', { name: 'Loading insights' })).toBeTruthy()
    cleanup()
    const { onRefresh } = mount({ status: 'error', snapshot: null, notice: null, refreshing: false }, opened)
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('reports a signed-out Host', () => {
    mount(ready({ available: false }), opened)
    expect(screen.getByRole('heading', { name: 'Sign in to see insights' })).toBeTruthy()
  })
})

/** Render the chip in isolation and return its text. */
function mountTitle(params: unknown, bindings: WorkItemTabBindings, revision = 1): string {
  const { actions } = tabActions()
  const info = tabInfo(params, actions, revision)
  const props = {
    ...standard,
    useTabInfo: () => info,
    workItemBindings: bindings,
    t: makeTranslate(en),
  } as WorkItemTabTitleProps
  const view = render(<WorkItemTabTitle {...props} />)
  return view.container.textContent ?? ''
}

describe('WorkItemTabTitle', () => {
  it('names the item its tab opened and the one a restored tab recorded', () => {
    expect(mountTitle({ day: '2026-11-02', problem: 'The launch plan has no owner' }, new WorkItemTabBindings()))
      .toBe('The launch plan has no owner')
    cleanup()
    const bindings = new WorkItemTabBindings()
    bindings.write(sessionId, tabId, { day: '2026-11-02', problem: 'The launch brief is still unsent' })
    expect(mountTitle(undefined, bindings)).toBe('The launch brief is still unsent')
  })

  it('falls back to the page label without a resolvable item', () => {
    expect(mountTitle(undefined, new WorkItemTabBindings())).toBe('Work item')
  })
})
