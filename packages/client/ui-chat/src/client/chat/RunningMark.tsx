/** Static Tomato mark for the running Chat status. */
import { TOMATO_MARK_PATH, TOMATO_MARK_VIEWBOX } from '@tomato/client-ui-primitives'
import css from './ChatView.module.css'

/**
 * Render the decorative running mark.
 * @returns the mark svg inside its fixed-footprint seat.
 */
export function RunningMark() {
  return (
    <span className={css.runningIcon} aria-hidden="true">
      <svg
        className={css.runningMarkStill}
        width="100%"
        height="100%"
        viewBox={`3.9 4.4 ${TOMATO_MARK_VIEWBOX.width} ${TOMATO_MARK_VIEWBOX.height}`}
        fill="none"
      >
        <path d={TOMATO_MARK_PATH} fill="currentColor" />
      </svg>
    </span>
  )
}
