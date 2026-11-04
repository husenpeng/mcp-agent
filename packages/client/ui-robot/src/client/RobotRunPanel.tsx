/** Session-bound host of the run detail: folds the run's Chat nodes into business steps. */
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import type { ChatSnapshot } from '@tomato/client-ui-chat/client'
import type { ObservableSnapshot } from '@tomato/client-store'
import type { InjectFace, PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
import { type RunDetailActions, RunDetail } from './RunDetail.tsx'
import { runSteps } from './run-steps.ts'
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
  /** Per-run actions owner props handed by the page. */
  readonly actions: RunDetailActions
  /** Session lifecycle seat the detail reports through. */
  readonly useSession: PropsRuntime<'robots.run'>['useSession']
}

/**
 * Render the selected run as a task with a business-language progress list.
 * @param props - owner run and actions, Session seats, the Chat hook, and copy.
 * @returns the run detail panel.
 */
export function RobotRunPanel({ run, actions, useSession, useRunChat, t }: RobotRunPanelProps): ReactNode {
  const session = useSession(value => value)
  const chat = useRunChat(value => value)
  const steps = useMemo(() => runSteps(chat), [chat])
  return (
    <RunDetail
      run={run}
      openState={session.openState}
      openError={session.openError?.message}
      steps={steps}
      actions={actions}
      t={t}
    />
  )
}
