/**
 * Client-visible evidence projection: one entry per image the Session read,
 * folded from the durable `image/evidence` event.
 *
 * @module @tomato/image-evidence/src/projection
 */

import { z } from 'zod'
import type { ProjectionDefinition } from '@tomato/session-projection'
import type { SessionEvent } from '@tomato/session/types'
import type { ImageEvidenceAttempt } from './spec.ts'
import type {
  ImageEvidenceProjection,
  ImageEvidenceProjectionEntry,
} from './projection-types.ts'

export type {
  ImageEvidenceProjection,
  ImageEvidenceProjectionEntry,
} from './projection-types.ts'

/** Wire and persisted shape of one entry; the fold keeps exactly these fields. */
const entrySchema = z.object({
  engine: z.object({ provider: z.string(), model: z.string() }),
  attempts: z.number().int().nonnegative(),
  failed: z.boolean(),
  truncated: z.boolean(),
  cached: z.boolean(),
  durationMs: z.number().nonnegative(),
})

/** Wire and persisted shape of the whole map. */
const imageEvidenceProjectionSchema: z.ZodType<ImageEvidenceProjection> = z.record(
  z.string(),
  entrySchema,
)

/**
 * Whether an `image/evidence` event describes a failed read. A record reused
 * from storage performs no attempt, and a chain that produced a record ends
 * with a successful attempt; only a chain that produced none leaves every
 * attempt failed.
 * @param attempts - attempts the event recorded, in order.
 * @returns true when at least one attempt ran and none succeeded.
 */
function failedRead(attempts: readonly ImageEvidenceAttempt[]): boolean {
  return attempts.length > 0 && attempts.every(attempt => !attempt.ok)
}

/**
 * Fold one Session's evidence events into the map the image card reads. An
 * event for an attachment already present replaces its entry, so a later read
 * (a different engine, or a retry after a failure) wins over an earlier one.
 */
export const imageEvidenceProjectionDefinition = {
  key: 'imageEvidence',
  stateVersion: 1,
  stateSchema: imageEvidenceProjectionSchema,
  init: () => ({}),
  apply: (state: ImageEvidenceProjection, event: SessionEvent): ImageEvidenceProjection => {
    if (event.type !== 'image/evidence') return state
    const entry: ImageEvidenceProjectionEntry = {
      engine: {
        provider: event.data.engine.provider,
        model: event.data.engine.model,
      },
      attempts: event.data.attempts.length,
      failed: failedRead(event.data.attempts),
      truncated: event.data.truncated,
      cached: event.data.cached,
      durationMs: event.data.durationMs,
    }
    return { ...state, [event.data.attachmentId]: entry }
  },
  wire: {
    summary: false,
    viewSchema: imageEvidenceProjectionSchema,
    view: (state: ImageEvidenceProjection) => state,
  },
} satisfies ProjectionDefinition<'imageEvidence', ImageEvidenceProjection>
