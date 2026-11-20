/**
 * Durable storage domain for rooms, revisions, messages, episodes, guards, and
 * approvals. A malformed record rejects opening the domain, so recovery fails
 * closed instead of inventing a room.
 * @module @tomato/experimental-robot-room-local
 */

import { brandString } from '@tomato/branded'
import { validateRoomSpec } from '@tomato/experimental-robot-room'
import type {
  A2aEnvelopeV2, Room, RoomApproval, RoomEpisode, RoomEpisodeId, RoomGuardSnapshot, RoomId, RoomMemberId, RoomMessage,
  RoomMessageId, RoomSpec,
} from '@tomato/experimental-robot-room'
import type { Domain } from '@tomato/storage-domain'
import { defineDomain, domainTable } from '@tomato/storage-domain'
import type { SessionId } from '@tomato/session'
import { deepFreeze } from '@tomato/util-values'
import { z } from 'zod'

const nonBlank = z.string().regex(/\S/u, 'must not be blank')
const roomIdSchema = nonBlank.transform(value => brandString<RoomId>(value))
const memberIdSchema = nonBlank.transform(value => brandString<RoomMemberId>(value))
const messageIdSchema = nonBlank.transform(value => brandString<RoomMessageId>(value))
const episodeIdSchema = nonBlank.transform(value => brandString<RoomEpisodeId>(value))
const roomStateSchema = z.enum(['active', 'paused', 'tripped', 'archived'])
const breakerSchema = z.enum(['closed', 'open', 'half-open'])
const tripReasonSchema = z.enum([
  'depth', 'episode-turns', 'episode-messages', 'episode-tokens', 'episode-time', 'rate', 'duplicate', 'ping-pong', 'no-progress', 'storm',
])

/** Validate one stored room specification and freeze it. */
const storedSpecSchema = z.custom<RoomSpec>((value) => {
  const result = validateRoomSpec(value as RoomSpec)
  return result.length === 0
}, { message: 'invalid stored room specification' }).transform(spec => deepFreeze(spec))

/** Validate one stored A2A envelope. */
const envelopeSchema = z.object({
  protocol: z.literal('tomato-a2a/2'),
  id: nonBlank,
  room: roomIdSchema,
  episode: episodeIdSchema,
  from: memberIdSchema,
  to: z.array(memberIdSchema).min(1),
  intent: z.enum(['request', 'delegate', 'handoff', 'inform', 'reply']),
  task: z.string(),
  context: z.string(),
  artifacts: z.array(z.string()),
  expect: z.enum(['answer', 'artifact', 'ack']).optional(),
  replyTo: nonBlank.optional(),
  status: z.enum(['done', 'partial', 'declined', 'aborted']).optional(),
  depth: z.number().int().positive(),
  grantTokens: z.number().nonnegative(),
  deadline: z.number().int().positive(),
  signature: nonBlank,
  visibility: z.enum(['room', 'private']),
}).strict()

const messageSchema = z.object({
  id: messageIdSchema,
  room: roomIdSchema,
  seq: z.number().int().positive(),
  episode: episodeIdSchema,
  author: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('human'), id: nonBlank, name: nonBlank }).strict(),
    z.object({ kind: z.literal('member'), id: memberIdSchema }).strict(),
    z.object({ kind: z.literal('system') }).strict(),
  ]),
  kind: z.enum(['chat', 'a2a', 'reply', 'activity', 'guard', 'approval', 'episode']),
  text: z.string(),
  mentions: z.array(memberIdSchema),
  a2a: envelopeSchema.optional(),
  activity: z.object({
    label: nonBlank,
    tools: z.array(nonBlank),
    tokens: z.number().int().nonnegative().optional(),
    done: z.boolean().optional(),
  }).strict().optional(),
  guard: z.object({
    code: z.string(),
    detail: nonBlank,
    members: z.array(memberIdSchema),
  }).strict().optional(),
  approval: z.object({
    id: nonBlank,
    envelope: envelopeSchema,
    at: z.number().int().nonnegative(),
    decision: z.enum(['approved', 'rejected']).optional(),
  }).strict().optional(),
  usage: z.number().int().nonnegative().optional(),
  causedBy: messageIdSchema.optional(),
  depth: z.number().int().nonnegative(),
  sessionRef: z.object({ sessionId: nonBlank, turn: z.number().int().nonnegative() }).strict().optional(),
  at: z.number().int().nonnegative(),
}).strict().transform(message => deepFreeze(message) as RoomMessage)

const episodeSchema = z.object({
  id: episodeIdSchema,
  room: roomIdSchema,
  startedBy: messageIdSchema,
  startedAt: z.number().int().nonnegative(),
  turns: z.number().int().nonnegative(),
  messages: z.number().int().nonnegative(),
  tokens: z.number().int().nonnegative(),
  depth: z.number().int().nonnegative(),
  ended: z.object({ at: z.number().int().nonnegative(), reason: z.enum(['completed', 'tripped', 'interrupted']) }).strict().optional(),
}).strict()

const guardSchema = z.object({
  room: roomIdSchema,
  breaker: breakerSchema,
  reason: tripReasonSchema.optional(),
  startedAt: z.number().int().nonnegative(),
  turns: z.number().int().nonnegative(),
  messages: z.number().int().nonnegative(),
  tokens: z.number().int().nonnegative(),
  depth: z.number().int().nonnegative(),
  signatures: z.record(z.string(), z.number().int().nonnegative()),
  pairs: z.record(z.string(), z.object({
    alternations: z.number().int().nonnegative(),
    brokenUntil: z.number().int().optional(),
  }).strict()),
  pending: z.record(z.string(), z.number().int().nonnegative()),
}).strict()

const readSchema = z.object({
  room: roomIdSchema,
  member: memberIdSchema,
  seq: z.number().int().nonnegative(),
}).strict()

const approvalSchema = z.object({
  id: nonBlank,
  room: roomIdSchema,
  envelope: envelopeSchema,
  at: z.number().int().nonnegative(),
  decision: z.enum(['approved', 'rejected']).optional(),
}).strict()

const roomRowSchema = z.object({
  id: roomIdSchema,
  spec: storedSpecSchema,
  revision: z.number().int().positive(),
  state: roomStateSchema,
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  nextSeq: z.number().int().positive(),
  episodeNumber: z.number().int().nonnegative(),
  activeEpisode: episodeIdSchema.optional(),
}).strict()

const revisionRowSchema = z.object({
  room: roomIdSchema,
  revision: z.number().int().positive(),
  spec: storedSpecSchema,
  savedAt: z.number().int().nonnegative(),
}).strict()

/** One stored room row. */
export type RoomRow = z.infer<typeof roomRowSchema>

/** One stored revision row. */
export type RevisionRow = z.infer<typeof revisionRowSchema>

/** One stored message row. */
export type MessageRow = z.infer<typeof messageSchema>

/** One stored episode row. */
export type EpisodeRow = z.infer<typeof episodeSchema>

/** One stored guard row. */
export type GuardRow = z.infer<typeof guardSchema>

/** One stored member read cursor. */
export type ReadRow = z.infer<typeof readSchema>

/** One stored approval row. */
export type ApprovalRow = z.infer<typeof approvalSchema>

/** Durable Room records. */
export const roomDomain = defineDomain({
  name: 'tomato_room',
  version: 1,
  tables: {
    rooms: domainTable<string, RoomRow>(roomRowSchema),
    revisions: domainTable<string, RevisionRow>(revisionRowSchema),
    messages: domainTable<string, MessageRow>(messageSchema),
    episodes: domainTable<string, EpisodeRow>(episodeSchema),
    guards: domainTable<string, GuardRow>(guardSchema),
    approvals: domainTable<string, ApprovalRow>(approvalSchema),
    reads: domainTable<string, ReadRow>(readSchema),
  },
})

/** One opened room domain. */
export type RoomStore = Domain<typeof roomDomain>

/**
 * Build a room row from a saved room.
 * @param room - the room to store.
 * @param nextSeq - sequence number the next message takes.
 * @param episodeNumber - number of the episode the room is in.
 * @param activeEpisode - episode currently open, when one is.
 * @returns the row to persist.
 */
export function roomRowOf(room: Room, nextSeq: number, episodeNumber: number, activeEpisode?: RoomEpisodeId): RoomRow {
  return {
    id: room.id,
    spec: room.spec,
    revision: room.revision,
    state: room.state,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    nextSeq,
    episodeNumber,
    ...activeEpisode === undefined ? {} : { activeEpisode },
  }
}

/**
 * Build a published room from its row.
 * @param row - stored row.
 * @returns the frozen room view.
 */
export function roomOf(row: RoomRow): Room {
  return deepFreeze({
    id: row.id,
    spec: row.spec,
    revision: row.revision,
    state: row.state,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

/**
 * Build the stored guard row from a snapshot and maps.
 * @param input - the guard snapshot with its signature counts and pending requests.
 * @returns the row to persist.
 */
export function guardRowOf(input: {
  readonly room: RoomId
  readonly snapshot: RoomGuardSnapshot
  readonly signatures: ReadonlyMap<string, number>
  readonly pairs: ReadonlyMap<string, { readonly alternations: number; readonly brokenUntil?: number }>
  readonly pending: ReadonlyMap<RoomMemberId, number>
  readonly startedAt: number
}): GuardRow {
  return {
    room: input.room,
    breaker: input.snapshot.breaker,
    ...input.snapshot.reason === undefined ? {} : { reason: input.snapshot.reason },
    startedAt: input.startedAt,
    turns: input.snapshot.turns,
    messages: input.snapshot.messages,
    tokens: input.snapshot.tokens,
    depth: input.snapshot.depth,
    signatures: Object.fromEntries(input.signatures),
    pairs: Object.fromEntries([...input.pairs].map(([key, pair]) => [key, {
      alternations: pair.alternations,
      ...pair.brokenUntil === undefined ? {} : { brokenUntil: pair.brokenUntil },
    }])),
    pending: Object.fromEntries(input.pending),
  }
}

/**
 * Build one stored message row from a message.
 * @param message - the message to store.
 * @returns the row to persist.
 */
export function messageOf(message: RoomMessage): MessageRow {
  return message
}

/**
 * Stable Session identity of one room member.
 * @param room - room identity.
 * @param member - member identity.
 * @returns the Session id the provider resumes and creates.
 */
export function memberSessionOf(room: RoomId, member: RoomMemberId): SessionId {
  return brandString<SessionId>(`room-${room}-${member}`)
}

/**
 * Attach the producing member Session to a member message that has no recorded reference.
 * @param room - room identity.
 * @param message - stored message.
 * @returns the message; a member message recorded before turn tracking carries turn 0.
 */
export function withMemberSession(room: RoomId, message: RoomMessage): RoomMessage {
  if (message.sessionRef !== undefined || message.author.kind !== 'member') return message
  return { ...message, sessionRef: { sessionId: memberSessionOf(room, message.author.id), turn: 0 } }
}

/**
 * Build one stored episode row from an episode.
 * @param episode - the episode to store.
 * @returns the row to persist.
 */
export function episodeRowOf(episode: RoomEpisode): EpisodeRow {
  return episode
}

/**
 * Build one stored approval row.
 * @param approval - the approval to store.
 * @returns the row to persist.
 */
export function approvalRowOf(approval: RoomApproval): ApprovalRow {
  return {
    id: approval.id,
    room: approval.envelope.room,
    envelope: approval.envelope as ApprovalRow['envelope'],
    at: approval.at,
    ...approval.decision === undefined ? {} : { decision: approval.decision },
  }
}

/**
 * Build one approval from its row.
 * @param row - stored row.
 * @returns the approval view.
 */
export function approvalOf(row: ApprovalRow): RoomApproval {
  return deepFreeze({
    id: row.id,
    envelope: row.envelope as A2aEnvelopeV2,
    at: row.at,
    ...row.decision === undefined ? {} : { decision: row.decision },
  })
}
