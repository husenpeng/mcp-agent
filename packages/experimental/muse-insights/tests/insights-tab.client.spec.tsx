// @vitest-environment jsdom
/** The Sidebar page renders both views from the shared snapshot and reports explicit refreshes. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { allowAllAccess, makeTranslate } from '@tomato/client-test-runtime'
import { SessionId } from '@tomato/session/types'
import type { SidebarRightTabActions, SidebarRightTabInfo } from '@tomato/client-ui-sidebar-right/client'
import type { GlobalStandardProps, SessionStandardProps, SnapshotSelectorHook } from '@tomato/client-ui-slots'
import { InsightsTab, type InsightsTabProps } from '../src/client/InsightsTab.tsx'
import { en, zh } from '../src/client/locales.ts'
import type { InsightsState } from '../src/client/source.ts'
import type { DailyRecap, MuseInsightsSnapshot, UnfinishedTask } from '../src/types.ts'

afterEach(() => { cleanup() })

const unused = (): never => { throw new Error('This isolated page does not read that framework hook') }
const standard: GlobalStandardProps & SessionStandardProps = {
  sessionId: SessionId('session-1'),
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
  summary: 'Prepared the launch and left one brief to send.',
  workItems: [
    { title: 'Draft the plan', detail: 'The launch plan is ready.', status: 'done' },
    { title: 'Send the brief', detail: '', status: 'ongoing' },
  ],
  openTasks: ['Send the brief'],
  sessions: [{ sessionId: 's1', title: 'Launch plan', summary: 'Drafted the plan.', messageCount: 4 }],
  messageCount: 8,
}

const tasks: UnfinishedTask[] = [
  { id: 'a', title: 'Send the brief', detail: '', status: 'pending', source: 'todo', sessionId: 's1', sessionTitle: 'Launch plan' },
  { id: 'b', title: 'Ask legal', detail: 'Confirm the claims.', status: 'in_progress', source: 'recap', sessionId: null, sessionTitle: null },
]

function snapshot(overrides: Partial<MuseInsightsSnapshot> = {}): MuseInsightsSnapshot {
  return {
    available: true,
    day: '2026-11-02',
    recap,
    unfinished: { analyzedAt: new Date(2026, 10, 2, 18, 10).getTime(), tasks },
    analyzing: false,
    ...overrides,
  }
}

function tabInfo(params: unknown, revision = 1): SidebarRightTabInfo {
  const actions: SidebarRightTabActions = { bindCommands: vi.fn(() => vi.fn()), openResource: vi.fn(), openTab: vi.fn(), close: vi.fn() }
  return {
    sidebar: { expanded: true, fullscreen: false },
    panel: { id: 'pane-1' },
    tab: {
      id: 'tab-1',
      kind: 'muse-insights',
      contentId: 'sidebar://muse-insights',
      title: 'Daily recap',
      navigation: { address: 'sidebar://muse-insights', params, revision },
      actions,
    },
  } as SidebarRightTabInfo
}

function mount(state: InsightsState, params: unknown = { view: 'recap' }, chinese = false) {
  const onRefresh = vi.fn<(signal?: AbortSignal) => Promise<void>>(async () => {})
  const info = tabInfo(params)
  const useInsights: SnapshotSelectorHook<InsightsState> = select => select(state)
  const props = {
    ...standard,
    useTabInfo: () => info,
    useInsights,
    onRefresh,
    t: makeTranslate(chinese ? zh : en),
  } as InsightsTabProps
  const view = render(<InsightsTab {...props} />)
  return { onRefresh, view, info }
}

describe('InsightsTab', () => {
  it('centers a bare loading state before the first read', () => {
    mount({ status: 'loading', snapshot: null, notice: null, refreshing: false })
    expect(screen.getByRole('status', { name: 'Loading insights' })).toBeTruthy()
  })

  it('offers a retry for a failed first read', () => {
    const { onRefresh } = mount({ status: 'error', snapshot: null, notice: null, refreshing: false })
    expect(screen.getByRole('heading', { name: 'Could not load your insights' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('renders the daily recap with work item status, open tasks, and sessions', () => {
    mount({ status: 'ready', snapshot: snapshot(), notice: null, refreshing: false })
    expect(screen.getByRole('heading', { name: 'Launch ready' })).toBeTruthy()
    expect(screen.getByText(/1 session · 8 messages/u)).toBeTruthy()
    expect(screen.getByText('Draft the plan')).toBeTruthy()
    expect(screen.getByText('Done')).toBeTruthy()
    expect(screen.getByText('Ongoing')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Open tasks' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Sessions' })).toBeTruthy()
    expect(screen.getByText('Launch plan')).toBeTruthy()
    expect(screen.getByText('Drafted the plan.')).toBeTruthy()
  })

  it('switches to unfinished tasks and labels their source', () => {
    mount({ status: 'ready', snapshot: snapshot(), notice: null, refreshing: false })
    fireEvent.click(screen.getByRole('tab', { name: 'Unfinished tasks' }))
    expect(screen.getByRole('heading', { name: 'Unfinished tasks' })).toBeTruthy()
    expect(screen.getByText(/2 unfinished tasks/u)).toBeTruthy()
    expect(screen.getByText('Send the brief')).toBeTruthy()
    expect(screen.getByText(/Session todo · Launch plan/u)).toBeTruthy()
    expect(screen.getByText('Ask legal')).toBeTruthy()
    expect(screen.getByText(/From recap/u)).toBeTruthy()
    expect(screen.getByText('Confirm the claims.')).toBeTruthy()
  })

  it('opens the view its navigation parameters name without a switch', () => {
    mount({ status: 'ready', snapshot: snapshot(), notice: null, refreshing: false }, { view: 'unfinished' })
    expect(screen.getByRole('tab', { name: 'Unfinished tasks' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('heading', { name: 'Unfinished tasks' })).toBeTruthy()
  })

  it('renders localized empty states for a missing recap, no tasks, and a signed-out Host', () => {
    const noRecap = snapshot({ recap: null })
    mount({ status: 'ready', snapshot: noRecap, notice: null, refreshing: false }, { view: 'recap' }, true)
    expect(screen.getByRole('heading', { name: '今天还没有回顾' })).toBeTruthy()
    cleanup()
    mount({ status: 'ready', snapshot: snapshot({ unfinished: { analyzedAt: 1, tasks: [] } }), notice: null, refreshing: false }, { view: 'unfinished' }, true)
    expect(screen.getByRole('heading', { name: '没有未完成任务' })).toBeTruthy()
    cleanup()
    mount({ status: 'ready', snapshot: snapshot({ available: false }), notice: null, refreshing: false }, { view: 'recap' }, true)
    expect(screen.getByRole('heading', { name: '登录后查看回顾' })).toBeTruthy()
  })

  it('notes a deterministic recap and refreshes the Host from the toolbar', () => {
    const local = { ...snapshot(), recap: { ...recap, source: 'local' as const, headline: '', summary: '', workItems: [] } }
    const { onRefresh } = mount({ status: 'ready', snapshot: local, notice: null, refreshing: false })
    expect(screen.getByText('Written without a model route; showing the session record.')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Today’s work' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Refresh insights' }))
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('shows a waiting state while the first analysis runs', () => {
    mount({
      status: 'ready',
      snapshot: snapshot({ unfinished: { analyzedAt: 0, tasks: [] }, analyzing: true }),
      notice: null,
      refreshing: false,
    }, { view: 'unfinished' })
    expect(screen.getByRole('heading', { name: 'The first analysis is still running.' })).toBeTruthy()
  })

  it('renders the two tabs as one tablist and points the panel at the selected tab', () => {
    mount({ status: 'ready', snapshot: snapshot(), notice: null, refreshing: false })
    const list = screen.getByRole('tablist', { name: 'Insight view' })
    expect(within(list).getAllByRole('tab')).toHaveLength(2)
    const panel = screen.getByRole('tabpanel')
    expect(panel.getAttribute('aria-labelledby')).toBe('muse-insights-tab-1-recap')
  })
})
