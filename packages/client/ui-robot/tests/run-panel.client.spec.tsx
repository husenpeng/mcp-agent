// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { makeTranslate } from '@tomato/client-test-runtime'
import { zh as commonZh } from '@tomato/client-locale/src/locales/zh.ts'
import { brandString } from '@tomato/branded'
import type { Run } from '@tomato/api-robot-controller/client'
import type { RobotId, RobotSpecId, RunId } from '@tomato/experimental-robot/types'
import type { ChatSnapshot } from '@tomato/client-ui-chat/client'
import { EMPTY_CHAT_SNAPSHOT } from '@tomato/client-ui-chat/client'
import type { SessionSnapshot } from '@tomato/api-session-controller/client'
import { RobotRunPanel, type RobotRunPanelProps } from '../src/client/RobotRunPanel.tsx'
import type { RunDetailActions } from '../src/client/RunDetail.tsx'
import { zh } from '../src/client/locales.ts'

afterEach(cleanup)

const t = makeTranslate({ ...commonZh, ...zh })

const RUN: Run = {
  id: brandString<RunId>('run-1'),
  robot: brandString<RobotId>('robot-1'),
  spec: { spec: brandString<RobotSpecId>('spec-1'), revision: 1 },
  state: 'succeeded',
  input: { message: '整理报告' },
  startedAt: 0,
  output: '报告已生成',
}

const ACTIONS: RunDetailActions = { interrupt: () => {}, correct: () => {}, stop: () => {} }

/** Selector hook over one fixed Session snapshot. */
const sessionHook = (session: SessionSnapshot) =>
  <T,>(selector: (snapshot: SessionSnapshot) => T): T => selector(session)

/** Selector hook over one fixed Chat snapshot. */
const chatHook = (chat: ChatSnapshot | undefined) =>
  <T,>(selector: (snapshot: ChatSnapshot | undefined) => T): T => selector(chat)

describe('robot run panel', () => {
  it('binds the run Session state and the folded Chat snapshot', () => {
    const session = { openState: 'open', openError: null } as SessionSnapshot
    const chat: ChatSnapshot = EMPTY_CHAT_SNAPSHOT
    const props: RobotRunPanelProps = {
      run: RUN,
      actions: ACTIONS,
      useSession: sessionHook(session),
      useRunChat: chatHook(chat),
      t,
    }
    render(<RobotRunPanel {...props} />)
    expect(screen.getByText('已完成')).toBeDefined()
    expect(screen.getByText('报告已生成')).toBeDefined()
    expect(screen.getByText('等待机器人开始执行…')).toBeDefined()
  })

  it('reports the Session open error through the detail', () => {
    const session = { openState: 'error', openError: { message: 'history unavailable' } } as SessionSnapshot
    const props: RobotRunPanelProps = {
      run: RUN,
      actions: ACTIONS,
      useSession: sessionHook(session),
      useRunChat: chatHook(undefined),
      t,
    }
    render(<RobotRunPanel {...props} />)
    expect(screen.getByRole('alert').textContent).toContain('history unavailable')
  })
})
