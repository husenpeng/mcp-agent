/**
 * Durable storage domain for robot specifications, robots, and runs. The domain
 * validates every stored record when it opens, so recovery fails closed.
 * @module @tomato/experimental-robot-local
 */

import { brandString } from '@tomato/branded'
import { defineDomain, domainTable } from '@tomato/storage-domain'
import { deepFreeze } from '@tomato/util-values'
import { z } from 'zod'
import type { RobotId, RobotSpec, RobotSpecId, RunId, RunInput } from '@tomato/experimental-robot'
import type { SessionId } from '@tomato/session/types'
import { robotSpecSchema } from './validate.ts'

const nonBlank = z.string().regex(/\S/u, 'must not be blank')
const specIdSchema = nonBlank.transform(value => brandString<RobotSpecId>(value))
const robotIdSchema = nonBlank.transform(value => brandString<RobotId>(value))
const runIdSchema = nonBlank.transform(value => brandString<RunId>(value))
const sessionIdSchema = nonBlank.transform(value => brandString<SessionId>(value))
const specRefSchema = z.object({ spec: specIdSchema, revision: z.number().int().positive() }).strict()
const runStateSchema = z.enum(['queued', 'leased', 'running', 'waiting', 'finalizing', 'succeeded', 'failed', 'cancelled', 'timed_out'])
const runInputSchema = z.object({ message: nonBlank, task: nonBlank.optional() }).strict()

/**
 * Fill the plugin list a version-2 revision record predates. Legacy rows stay
 * readable; the next write stamps the current domain version with the field.
 * @param spec - specification read from the medium.
 * @returns the specification with a plugins list.
 */
function withPluginList(spec: RobotSpec): RobotSpec
function withPluginList(spec: unknown): unknown
function withPluginList(spec: unknown): unknown {
  if (typeof spec !== 'object' || spec === null) return spec
  const capability = (spec as { readonly capability?: unknown }).capability
  if (typeof capability !== 'object' || capability === null) return spec
  const plugins = (capability as { readonly plugins?: unknown }).plugins
  if (Array.isArray(plugins)) return spec
  return { ...spec, capability: { ...capability, plugins: [] } }
}

const storedSpecSchema = z.custom<RobotSpec>(value => robotSpecSchema.safeParse(withPluginList(value)).success, {
  message: 'invalid stored robot specification',
}).transform(spec => deepFreeze(withPluginList(spec)))
const storedInputSchema = z.custom<RunInput>(value => runInputSchema.safeParse(value).success, {
  message: 'invalid stored run input',
})

const revisionRowSchema = z.object({
  ref: specRefSchema,
  spec: storedSpecSchema,
  publishedAt: z.number().int().nonnegative(),
  supersedes: z.number().int().positive().optional(),
}).strict()

const robotRowSchema = z.object({
  id: robotIdSchema,
  name: nonBlank,
  ref: specRefSchema,
  createdAt: z.number().int().nonnegative(),
  installation: z.object({ ref: specRefSchema, installedAt: z.number().int().nonnegative() }).strict().optional(),
}).strict()

const runRowSchema = z.object({
  id: runIdSchema,
  robot: robotIdSchema,
  ref: specRefSchema,
  state: runStateSchema,
  input: storedInputSchema,
  startedAt: z.number().int().nonnegative(),
  sessionId: sessionIdSchema.optional(),
  endedAt: z.number().int().nonnegative().optional(),
  output: z.string().optional(),
  error: nonBlank.optional(),
}).strict()

/** One stored specification revision row. */
export type RevisionRow = z.infer<typeof revisionRowSchema>

/** One stored robot row. */
export type RobotRow = z.infer<typeof robotRowSchema>

/** One stored run row. */
export type RunRow = z.infer<typeof runRowSchema>

/** Durable control-plane records; a malformed record rejects opening the domain. */
export const robotDomain = defineDomain({
  name: 'tomato_robot',
  version: 3,
  // Version 2 rows predate `capability.plugins`; `withPluginList` fills it, so
  // an existing profile opens and its next write stamps version 3.
  compatibleVersions: [2],
  tables: {
    revisions: domainTable<string, RevisionRow>(revisionRowSchema),
    robots: domainTable<RobotId, RobotRow>(robotRowSchema),
    runs: domainTable<RunId, RunRow>(runRowSchema),
  },
})
