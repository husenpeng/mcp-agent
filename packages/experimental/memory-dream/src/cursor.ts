/**
 * Cursor persistence for incremental dream runs.
 * Stored in the dream domain's global slot.
 * @module @tomato/memory-dream/cursor
 */

import { z } from 'zod'
import { defineDomain } from '@tomato/storage-domain'
import type { DreamCursor } from './types.ts'

/** Schema for the persisted cursor. */
export const dreamCursorSchema = z.object({
  index: z.number().int().nonnegative(),
  targetDigest: z.string(),
  shrinkStreak: z.number().int().nonnegative(),
  lastRunAt: z.number().int().nonnegative(),
  watermark: z.number().int().nonnegative(),
}).strict()

/** Initial cursor state. */
export const INITIAL_CURSOR: DreamCursor = {
  index: 0,
  targetDigest: '',
  shrinkStreak: 0,
  lastRunAt: 0,
  watermark: 0,
}

/** Dream domain: cursor and run records. */
export const dreamDomain = defineDomain({
  name: 'tomato_memory_dreams',
  version: 1,
  layout: 'single',
  global: {
    schema: dreamCursorSchema,
    initial: INITIAL_CURSOR,
  },
  tables: {},
})
