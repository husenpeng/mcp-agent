/**
 * Session-log record and client projection linking one robot run to the
 * Session that executed it. The record is an experimental plugin record, so
 * readers that do not know it retain and skip it without a Session format
 * change.
 * @module @tomato/experimental-robot/session
 */

import type {} from '@tomato/session/types'
import type {} from '@tomato/session-projection/types'
import type { RobotId, RunId } from './types.ts'

/** Identity facts a run Session records about the run that drives it. */
export interface RobotRunRecord {
  /** Robot that owns the run. */
  readonly robotId: RobotId
  /** Run the Session executes. */
  readonly runId: RunId
}

declare module '@tomato/session/types' {
  interface PluginRecordMap {
    /** Link from the run record to the Session whose log records its execution. */
    'plugin:robot/run': RobotRunRecord
  }
}

declare module '@tomato/session-projection/types' {
  interface SessionProjectionMap {
    /** Robot run owning the projected Session; null for an ordinary Session. */
    robotRun: RobotRunRecord | null
  }
}
