/** Session-bound host of the run detail: folds the run's Chat nodes into business steps. */
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import type { ChatSnapshot } from '@tomato/client-ui-chat/client'
import type { ObservableSnapshot } from '@tomato/client-store'
import type { InjectFace, PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
import { type RobotIdentity, type RunDetailActions, RunDetail } from './RunDetail.tsx'
import { runSteps } from './run-steps.ts'
import { useLiveNow } from './use-live-now.ts'
import type { NS } from './locales.ts'
import type { Run } from '@tomato/api-robot-controller/client'

/** Bare observable of the run Session's Chat snapshot, bound as `useRunChat`. */
export interface RobotRunPanelInjected {
  readonly hooks: {
    readonly runChat: ObservableSnapshot<ChatSnapshot | undefined>
  }
}

/** Props of the run detail slot: owner run and actions, runtime seats, inject face, and copy. */
export interface RobotRunPanelProps extends InjectFace<RobotRunPanelInjected>, PropsLocale<typeof NS> {
  /** Run owner props handed by the page. */
  readonly run: Run
  /** Robot identity owner props handed by the page. */
  readonly robot: RobotIdentity
  /** Per-run actions owner props handed by the page. */
  readonly actions: RunDetailActions
  /** Whether another run of this robot still holds the execution slot. */
  readonly startBlocked: boolean
  /** Whether the robot has any run to select. */
  readonly hasRuns: boolean
  /** Session lifecycle seat the detail reports through. */
  readonly useSession: PropsRuntime<'robots.run'>['useSession']
}

/**
 * Render the selected run as a conversation with its process folded between messages.
 * @param props - owner run, robot identity, and actions, Session seats, the Chat hook, and copy.
 * @returns the run conversation panel.
 */
export function RobotRunPanel({ run, robot, actions, startBlocked, hasRuns, useSession, useRunChat, t }: RobotRunPanelProps): ReactNode {
  const session = useSession(value => value)
  const chat = useRunChat(value => value)
  const steps = useMemo(() => runSteps(chat), [chat])
  // A live run's elapsed label must keep counting between Session frames.
  const now = useLiveNow(run.endedAt === undefined)
  return (
    <RunDetail
      run={run}
      robot={robot}
      openState={session.openState}
      openError={session.openError?.message}
      steps={steps}
      actions={actions}
      startBlocked={startBlocked}
      hasRuns={hasRuns}
      now={now}
      t={t}
    />
  )
}
