/**
 * Presentation of one recap work status, shared by the list row and the item's
 * own page so both name the same outcome with the same tone.
 * @module @tomato/experimental-muse-insights/client/status
 */

import type { TagTone } from '@tomato/client-ui-primitives'
import type { RecapWorkStatus } from '../types.ts'

/** One status's tag tone and the copy key that names it. */
export interface RecapStatusTag {
  readonly tone: TagTone
  readonly key: 'recap.status.done' | 'recap.status.ongoing' | 'recap.status.blocked' | 'recap.status.unknown'
}

/**
 * Choose the tag for one recap work status.
 * @param status - whether the work finished, continued, or stopped on a blocker.
 * @returns the tone and the dictionary key naming it.
 */
export function recapStatusTag(status: RecapWorkStatus): RecapStatusTag {
  switch (status) {
    case 'done': return { tone: 'success', key: 'recap.status.done' }
    case 'ongoing': return { tone: 'info', key: 'recap.status.ongoing' }
    case 'blocked': return { tone: 'warning', key: 'recap.status.blocked' }
    case 'unknown': return { tone: 'quiet', key: 'recap.status.unknown' }
  }
}
