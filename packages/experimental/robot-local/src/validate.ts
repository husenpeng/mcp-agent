/**
 * Runtime validation for robot specifications submitted to a provider.
 * @module @tomato/experimental-robot-local
 */

import { z } from 'zod'
import { deepFreeze } from '@tomato/util-values'
import { RobotSpecValidationError } from '@tomato/experimental-robot'
import type { RobotSpec, RobotSpecIssue } from '@tomato/experimental-robot'

export { RobotSpecValidationError } from '@tomato/experimental-robot'
export type { RobotSpecIssue } from '@tomato/experimental-robot'

const nonBlank = z.string().regex(/\S/u, 'must not be blank')

const budgetSchema = z.object({
  tokens: z.number().int().nonnegative(),
  millis: z.number().int().nonnegative(),
  cost: z.number().nonnegative(),
  toolCalls: z.number().int().nonnegative(),
}).strict()

const triggerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('manual') }).strict(),
  z.object({ kind: z.literal('cron'), expression: nonBlank, timeZone: nonBlank }).strict(),
  z.object({ kind: z.literal('event'), topic: nonBlank }).strict(),
  z.object({ kind: z.literal('webhook'), name: nonBlank }).strict(),
  z.object({ kind: z.literal('dependency'), task: nonBlank }).strict(),
  z.object({ kind: z.literal('threshold'), metric: nonBlank, above: z.number() }).strict(),
])

const positionSchema = z.object({
  owner: nonBlank,
  reportsTo: nonBlank.optional(),
  callers: z.array(nonBlank),
  callees: z.array(nonBlank),
  escalation: z.array(nonBlank),
  visibility: z.enum(['private', 'team', 'organization']),
}).strict()

const goalSchema = z.object({
  mission: nonBlank,
  successCriteria: z.array(nonBlank),
  triggers: z.array(triggerSchema),
  strategy: z.union([z.enum(['plan', 'loop']), z.object({ workflow: nonBlank }).strict()]),
  stopConditions: z.array(nonBlank),
  failurePolicy: z.enum(['retry', 'pause', 'fail', 'escalate']),
  budget: budgetSchema,
  maxConcurrentRuns: z.number().int().positive(),
}).strict()

const capabilitySchema = z.object({
  tools: z.object({ allow: z.array(nonBlank), deny: z.array(nonBlank) }).strict(),
  mcpServers: z.array(nonBlank),
  skills: z.array(nonBlank),
  workspaceRoots: z.array(nonBlank),
  dataClasses: z.array(z.enum(['public', 'internal', 'confidential'])),
  credentials: z.array(nonBlank),
  sandbox: z.enum(['none', 'workspace', 'full']),
  permissionPreset: nonBlank,
  network: z.enum(['none', 'allowlist', 'any']),
}).strict()

const ioSchema = z.object({
  input: z.object({ schema: nonBlank, version: z.number().int().positive() }).strict(),
  output: z.object({
    schema: nonBlank,
    format: z.enum(['text', 'markdown', 'json', 'file']),
    delivery: z.enum(['chat', 'task', 'artifact', 'webhook']),
  }).strict(),
  acceptance: z.array(nonBlank),
}).strict()

const memorySchema = z.object({
  read: z.array(nonBlank),
  write: z.array(nonBlank),
  retentionDays: z.number().int().positive().optional(),
  recall: z.enum(['none', 'keyword', 'hybrid']),
}).strict()

const a2aSchema = z.object({
  intents: z.array(z.enum(['request', 'delegate', 'event'])),
  peers: z.array(z.object({ peer: nonBlank, budget: budgetSchema, requiresApproval: z.boolean() }).strict()),
}).strict()

/** Structural schema for one robot specification; cross-field invariants are checked separately. */
export const robotSpecSchema = z.object({
  name: nonBlank,
  description: nonBlank.optional(),
  position: positionSchema,
  goal: goalSchema,
  capability: capabilitySchema,
  io: ioSchema,
  memory: memorySchema,
  a2a: a2aSchema,
}).strict()

function firstDuplicate(values: readonly string[]): string | undefined {
  const seen = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) return value
    seen.add(value)
  }
  return undefined
}

function invariantIssues(spec: RobotSpec): RobotSpecIssue[] {
  const issues: RobotSpecIssue[] = []
  const uniqueFields: readonly (readonly [string, readonly string[]])[] = [
    ['position.callers', spec.position.callers],
    ['position.callees', spec.position.callees],
    ['position.escalation', spec.position.escalation],
    ['capability.tools.allow', spec.capability.tools.allow],
    ['capability.tools.deny', spec.capability.tools.deny],
    ['capability.mcpServers', spec.capability.mcpServers],
    ['capability.skills', spec.capability.skills],
    ['capability.workspaceRoots', spec.capability.workspaceRoots],
    ['capability.dataClasses', spec.capability.dataClasses],
    ['capability.credentials', spec.capability.credentials],
    ['memory.read', spec.memory.read],
    ['memory.write', spec.memory.write],
    ['a2a.intents', spec.a2a.intents],
    ['a2a.peers', spec.a2a.peers.map(entry => entry.peer)],
  ]
  for (const [path, values] of uniqueFields) {
    const duplicate = firstDuplicate(values)
    if (duplicate !== undefined) issues.push({ path, message: `duplicate value "${duplicate}"` })
  }
  const overlap = spec.capability.tools.allow.filter(tool => spec.capability.tools.deny.includes(tool))
  if (overlap.length > 0) issues.push({ path: 'capability.tools', message: `tools in both allow and deny: ${overlap.join(', ')}` })
  if (spec.goal.triggers.length === 0) issues.push({ path: 'goal.triggers', message: 'at least one trigger is required' })
  return issues
}

/**
 * Validate one specification and return its frozen copy.
 * @param spec - specification submitted for publication.
 * @returns a deeply frozen copy safe to publish as an immutable revision.
 * @throws {RobotSpecValidationError} when the specification has structural or invariant violations.
 */
export function parseRobotSpec(spec: RobotSpec): RobotSpec {
  const result = robotSpecSchema.safeParse(spec)
  if (!result.success) {
    throw new RobotSpecValidationError(result.error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })))
  }
  const issues = invariantIssues(spec)
  if (issues.length > 0) throw new RobotSpecValidationError(issues)
  return deepFreeze(structuredClone(spec))
}
