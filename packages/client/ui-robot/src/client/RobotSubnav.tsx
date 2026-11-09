/**
 * Robot roster nested under the Tomato Rbot panel row: the same panel-level
 * selection the page edits, reported as a second-level list while that panel
 * is the selected one.
 */
import type { ReactNode } from 'react'
import type { InjectFace, PropsStore, PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
import type { RobotRunsSource } from '@tomato/api-robot-controller/client'
import type { RobotPageInstance, RobotPageStore } from './store.ts'
import { NS } from './locales.ts'
import { RobotAvatar } from './RobotAvatar.tsx'
import css from './RobotSubnav.module.css'

/** Injected face of the nested roster. */
export interface RobotSubnavInjected {
  readonly hooks: {
    /** Registry snapshot source. */
    readonly registry: RobotRunsSource
    /** Page selection snapshot source. */
    readonly robotPage: RobotPageInstance
  }
  /** Reveal the robot page in the main column. */
  readonly selectPanel: () => void
}

/** Props of the nested roster. */
export type RobotSubnavProps =
  PropsRuntime<'sidebar.panellist.subnav'>
  & PropsStore<RobotPageStore>
  & InjectFace<RobotSubnavInjected>
  & PropsLocale<typeof NS>

/**
 * Render the defined robots under their panel row. The rows exist only for the
 * selected panel with at least one robot in the wide column: the rail has no
 * label column to nest under, and another panel's launcher must not list
 * robots it does not own. The empty case is the page's gallery's to state.
 * @param props - panel owner state, injected registry, and copy.
 * @returns the nested roster rows, or null when there is nothing to nest.
 */
export function RobotSubnav({ active, wide, useRegistry, useRobotPage, actions, selectPanel, t }: RobotSubnavProps): ReactNode {
  const registry = useRegistry(snapshot => snapshot)
  const activeId = useRobotPage(snapshot => snapshot.robotId)
  if (!wide || !active || registry.robots.length === 0) return null
  const specOf = new Map(registry.specs.map(revision => [revision.ref.spec, revision.spec] as const))
  return (
    <div className={css.roster} role="group" aria-label={t('nav')}>
      {registry.robots.map(robot => (
        <button
          key={robot.id}
          type="button"
          className={css.row}
          data-active={robot.id === activeId}
          aria-current={robot.id === activeId ? 'true' : undefined}
          onClick={() => {
            actions.selectRobot(robot.id)
            selectPanel()
          }}
        >
          <RobotAvatar name={robot.name} skills={specOf.get(robot.spec.spec)?.capability.skills ?? []} size={18} />
          <span className={css.name}>{robot.name}</span>
          {robot.state === 'running' && (
            <span className={css.running}>
              <span className={css.visuallyHidden}>{t('roster.running')}</span>
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
