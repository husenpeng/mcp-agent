/**
 * Presentation of one recap work status, shared by the list row and the item's
 * own page so both name the same outcome with the same indicator.
 * @module @tomato/experimental-muse-insights/client/status
 */

import type { StateDotState } from '@tomato/client-ui-primitives'
import type { RecapWorkStatus } from '../types.ts'

/** One status's state dot and the copy key that names it. */
export interface RecapStatus {
  readonly state: StateDotState
  readonly key: 'recap.status.done' | 'recap.status.ongoing' | 'recap.status.blocked' | 'recap.status.unknown'
}

/**
 * Choose the indicator for one recap work status.
 * @param status - whether the work finished, continued, or stopped on a blocker.
 * @returns the state dot and the dictionary key naming it.
 */
export function recapStatus(status: RecapWorkStatus): RecapStatus {
  switch (status) {
    case 'done': return { state: 'done', key: 'recap.status.done' }
    case 'ongoing': return { state: 'ongoing', key: 'recap.status.ongoing' }
    case 'blocked': return { state: 'warning', key: 'recap.status.blocked' }
    case 'unknown': return { state: 'idle', key: 'recap.status.unknown' }
  }
}
