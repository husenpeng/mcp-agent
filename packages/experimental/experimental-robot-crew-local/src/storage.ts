/**
 * Durable crew storage: published revisions, runs, and the flow ledger. Every
 * stored record is validated when the domain opens, so recovery fails closed.
 * @module @tomato/experimental-robot-crew-local
 */

import { brandString } from '@tomato/branded'
import { defineDomain, domainTable } from '@tomato/storage-domain'
import { deepFreeze } from '@tomato/util-values'
import { z } from 'zod'
import { isTerminalCrewRunState } from '@tomato/experimental-robot-crew'
import type {
  CrewEntry, CrewNodeProgress, CrewRun, CrewRunId, CrewSpec, CrewSpecId, CrewSpecRef, CrewSpecRevision,
} from '@tomato/experimental-robot-crew'
import { validateCrewSpec } from '@tomato/experimental-robot-crew'

const nonBlank = z.string().regex(/\S/u, 'must not be blank')
const specIdSchema = nonBlank.transform(value => brandString<CrewSpecId>(value))
const runIdSchema = nonBlank.transform(value => brandString<CrewRunId>(value))
const specRefSchema = z.object({ spec: specIdSchema, revision: z.number().int().positive() }).strict()

/**
 * Validate one stored specification structurally.
 *
 * Publication additionally requires every member to bind an Rbot. Stored
 * revisions published before that rule keep opening, so the provider's
 * recovery is not blocked by older collaborations.
 * @param value - stored value.
 * @returns whether the value is a structurally valid crew specification.
 */
function isStoredSpec(value: unknown): boolean {
  try {
    return validateCrewSpec(value as CrewSpec).length === 0
  } catch {
    return false
  }
}

const storedSpecSchema = z.custom<CrewSpec>(isStoredSpec, { message: 'invalid stored crew specification' })
  .transform(spec => deepFreeze(spec))

const revisionRowSchema = z.object({
  ref: specRefSchema,
  spec: storedSpecSchema,
  publishedAt: z.number().int().nonnegative(),
  supersedes: z.number().int().positive().optional(),
}).strict()

const nodeProgressSchema = z.object({
  id: nonBlank,
  state: z.enum(['pending', 'running', 'succeeded', 'failed', 'skipped']),
  turns: z.number().int().nonnegative(),
  summary: z.string().optional(),
}).strict()

const runStateSchema = z.enum(['queued', 'running', 'succeeded', 'failed', 'tripped', 'cancelled'])

const runRowSchema = z.object({
  id: runIdSchema,
  spec: specRefSchema,
  name: nonBlank,
  state: runStateSchema,
  input: nonBlank,
  startedAt: z.number().int().nonnegative(),
  endedAt: z.number().int().nonnegative().optional(),
  output: z.string().optional(),
  error: nonBlank.optional(),
  trip: z.enum(['steps', 'messages', 'hops', 'duplicates', 'tokens', 'wall-clock', 'no-progress']).optional(),
  nodes: z.array(nodeProgressSchema),
  tokens: z.number().int().nonnegative(),
  messages: z.number().int().nonnegative(),
  steps: z.number().int().nonnegative(),
}).strict()

const entryRowSchema = z.object({
  run: runIdSchema,
  seq: z.number().int().positive(),
  kind: z.enum([
    'run-start', 'brief', 'step-start', 'step-result', 'memory', 'drift', 'a2a-request', 'a2a-reply', 'handoff',
    'guard', 'run-end',
  ]),
  at: z.number().int().nonnegative(),
  node: nonBlank.optional(),
  text: z.string().optional(),
  data: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
}).strict()

/** One stored revision row. */
export type CrewRevisionRow = z.infer<typeof revisionRowSchema>

/** One stored run row. */
export type CrewRunRow = z.infer<typeof runRowSchema>

/** One stored ledger row. */
export type CrewEntryRow = z.infer<typeof entryRowSchema>

/** Durable crew records; a malformed record rejects opening the domain. */
export const crewDomain = defineDomain({
  name: 'tomato_crew',
  version: 1,
  tables: {
    revisions: domainTable<string, CrewRevisionRow>(revisionRowSchema),
    runs: domainTable<CrewRunId, CrewRunRow>(runRowSchema),
    entries: domainTable<string, CrewEntryRow>(entryRowSchema),
  },
})

/**
 * Build the immutable revision view of one stored revision.
 * @param row - stored revision.
 * @returns the revision with its frozen reference.
 */
export function toRevision(row: CrewRevisionRow): CrewSpecRevision {
  return Object.freeze({
    ref: Object.freeze({ spec: row.ref.spec, revision: row.ref.revision }),
    spec: row.spec,
    publishedAt: row.publishedAt,
    ...row.supersedes === undefined ? {} : { supersedes: row.supersedes },
  })
}

/**
 * Copy a stored specification reference into its frozen form.
 * @param row - stored reference.
 * @returns the frozen reference.
 */
export function toRef(row: CrewSpecRef): CrewSpecRef {
  return Object.freeze({ spec: row.spec, revision: row.revision })
}

/**
 * Build the immutable run view of one stored run, including its frozen node progress.
 * @param row - stored run.
 * @returns the run view.
 */
export function toRun(row: CrewRunRow): CrewRun {
  const nodes: CrewNodeProgress[] = row.nodes.map(node => Object.freeze({
    id: node.id,
    state: node.state,
    turns: node.turns,
    ...node.summary === undefined ? {} : { summary: node.summary },
  }))
  return Object.freeze({
    id: row.id,
    spec: toRef(row.spec),
    name: row.name,
    state: row.state,
    input: row.input,
    startedAt: row.startedAt,
    ...row.endedAt === undefined ? {} : { endedAt: row.endedAt },
    ...row.output === undefined ? {} : { output: row.output },
    ...row.error === undefined ? {} : { error: row.error },
    ...row.trip === undefined ? {} : { trip: row.trip },
    nodes: Object.freeze(nodes),
    tokens: row.tokens,
    messages: row.messages,
    steps: row.steps,
  })
}

/**
 * Build the immutable view of one stored ledger entry.
 * @param row - stored ledger entry.
 * @returns the entry view.
 */
export function toEntry(row: CrewEntryRow): CrewEntry {
  return Object.freeze({
    run: row.run,
    seq: row.seq,
    kind: row.kind,
    at: row.at,
    ...row.node === undefined ? {} : { node: row.node },
    ...row.text === undefined ? {} : { text: row.text },
    ...row.data === undefined ? {} : { data: Object.freeze({ ...row.data }) },
  })
}

/**
 * Key one ledger row inside the run.
 * @param run - run the row belongs to.
 * @param seq - entry sequence within that run.
 * @returns the zero-padded key, so keys sort in log order.
 */
export function entryKey(run: CrewRunId, seq: number): string {
  return `${run}#${String(seq).padStart(8, '0')}`
}

/**
 * Whether a run state must not survive a process restart.
 * @param state - the run's current state.
 * @returns whether a restart settles the run as failed.
 */
export function resumableState(state: CrewRun['state']): boolean {
  return state === 'queued' || state === 'running'
}

export { isTerminalCrewRunState }
