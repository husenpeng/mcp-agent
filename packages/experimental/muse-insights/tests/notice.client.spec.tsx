// @vitest-environment jsdom
/** The frame-wide notice opens both detail views and closes independently. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { allowAllAccess, makeTranslate } from '@tomato/client-test-runtime'
import type { GlobalStandardProps, SnapshotSelectorHook } from '@tomato/client-ui-slots'
import { InsightNotice, type NoticeProps } from '../src/client/InsightNotice.tsx'
import { en, zh } from '../src/client/locales.ts'
import type { InsightsState } from '../src/client/source.ts'
import type { DailyRecap, UnfinishedTask } from '../src/types.ts'

afterEach(() => { cleanup() })

const unused = (): never => { throw new Error('This isolated notice does not read that framework hook') }
const standard: GlobalStandardProps = {
  usePanelInfo: unused, useSessions: unused, useSessionStatus: unused,
  useSessionRetainInfo: unused, useResource: unused, useWorkspaces: unused,
  ...allowAllAccess,
}

const recap: DailyRecap = {
  day: '2026-11-02',
  generatedAt: 10,
  source: 'model',
  headline: 'Launch ready',
  summary: 'Prepared the launch.',
  workItems: [],
  openTasks: [],
  sessions: [],
  messageCount: 2,
}

const tasks: UnfinishedTask[] = [
  { id: 'a', title: 'Send the brief', detail: '', status: 'pending', source: 'todo', sessionId: 's1', sessionTitle: 'Launch' },
  { id: 'b', title: 'Ask legal', detail: '', status: 'in_progress', source: 'recap', sessionId: null, sessionTitle: null },
]

function mount(notice: InsightsState['notice'], chinese = false) {
  const state: InsightsState = { status: 'ready', snapshot: null, notice, refreshing: false }
  const onOpen = vi.fn<(view: 'recap' | 'unfinished') => void>()
  const onDismiss = vi.fn<() => void>()
  const useInsights: SnapshotSelectorHook<InsightsState> = select => select(state)
  const props = {
    ...standard,
    useInsights,
    onOpen,
    onDismiss,
    t: makeTranslate(chinese ? zh : en),
  } as NoticeProps
  render(<InsightNotice {...props} />)
  return { onOpen, onDismiss }
}

describe('InsightNotice', () => {
  it('renders a recap headline and opens the recap view from the card', () => {
    const { onOpen } = mount({ id: 1, kind: 'recap', recap })
    expect(screen.getByText('Your recap is ready')).toBeTruthy()
    expect(screen.getByText('Launch ready')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Your recap is ready/ }))
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('recap')
  })

  it('renders the unfinished count, first task, and translated copy', () => {
    mount({ id: 2, kind: 'unfinished', tasks }, true)
    expect(screen.getByText('有 2 个未完成任务')).toBeTruthy()
    expect(screen.getByText('Send the brief · 另有 1 个')).toBeTruthy()
    expect(screen.getByRole('button', { name: '关闭' })).toBeTruthy()
  })

  it('closes without opening details', () => {
    const { onDismiss, onOpen } = mount({ id: 3, kind: 'recap', recap })
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('renders nothing without a notice', () => {
    mount(null)
    expect(screen.queryByRole('status')).toBeNull()
  })
})
