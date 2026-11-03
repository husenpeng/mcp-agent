/** Robot roster rows in the left sidebar, above the workspace browser. */
import type { ReactNode } from 'react'
import type { InjectFace, PropsStore, PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
import type { RobotRunsSource } from '@tomato/api-robot-controller/client'
import type { RobotPageInstance, RobotPageStore } from './store.ts'
import { NS } from './locales.ts'
import css from './RobotSidebar.module.css'

/** Injected face of the sidebar roster. */
export interface RobotSidebarInjected {
  readonly hooks: {
    /** Registry snapshot source. */
    readonly registry: RobotRunsSource
    /** Page selection snapshot source. */
    readonly robotPage: RobotPageInstance
  }
  /** Reveal the robot page in the main column. */
  readonly selectPanel: () => void
}

/** Props of the sidebar roster. */
export type RobotSidebarProps =
  PropsRuntime<'sidebar.robots'>
  & PropsStore<RobotPageStore>
  & InjectFace<RobotSidebarInjected>
  & PropsLocale<typeof NS>

/**
 * Render the defined robots as sidebar rows; the rail shows nothing and keeps
 * the panel icon as its entry.
 * @param props - owner column state, injected registry, and copy.
 * @returns the roster rows.
 */
export function RobotSidebar({ wide, useRegistry, useRobotPage, actions, selectPanel, t }: RobotSidebarProps): ReactNode {
  const registry = useRegistry(snapshot => snapshot)
  const activeId = useRobotPage(snapshot => snapshot.robotId)
  if (!wide) return null
  return (
    <div className={css.roster}>
      <div className={css.heading}>{t('nav')}</div>
      {registry.robots.map(robot => (
        <button
          key={robot.id}
          type="button"
          className={css.row}
          data-active={robot.id === activeId}
          onClick={() => {
            actions.selectRobot(robot.id)
            selectPanel()
          }}
        >
          <span className={css.status} data-running={robot.state === 'running'} />
          {robot.name}
        </button>
      ))}
    </div>
  )
}
