/**
 * Session projection naming the robot run a Session's log records. The state
 * advances once per `plugin:robot/run` record and stays null for ordinary
 * Sessions, so a Session list can recognize a robot-run Session without
 * replaying its log.
 * @module @tomato/experimental-robot-runtime
 */

import { brandString } from '@tomato/branded'
import type { RobotId, RunId } from '@tomato/experimental-robot'
import { pluginRecordOf, type SessionEvent } from '@tomato/session'
import type { ProjectionDefinition } from '@tomato/session-projection'
import { z } from 'zod'

const robotRunRecordSchema = z.object({
  robotId: z.string().min(1).transform(value => brandString<RobotId>(value)),
  runId: z.string().min(1).transform(value => brandString<RunId>(value)),
}).strict()

const robotRunStateSchema = robotRunRecordSchema.nullable()

/** Projected robot-run identity of one Session. */
export type RobotRunState = z.infer<typeof robotRunRecordSchema>

/** Current run identity, or null for a Session no robot run drives. */
export const robotRunProjectionDefinition = {
  key: 'robotRun',
  stateVersion: 1,
  stateSchema: robotRunStateSchema,
  init: () => null,
  apply: (state, event: SessionEvent) => {
    const record = pluginRecordOf(event)
    if (record?.type !== 'plugin:robot/run') return state
    // A malformed record is skipped; throwing would fail every later read of this Session.
    const parsed = robotRunRecordSchema.safeParse(record.data)
    return parsed.success ? parsed.data : state
  },
  wire: { viewSchema: robotRunStateSchema, view: state => state },
} satisfies ProjectionDefinition<'robotRun', RobotRunState | null>
