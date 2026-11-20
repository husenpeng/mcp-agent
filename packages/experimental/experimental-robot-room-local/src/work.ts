/**
 * Durable work records for one room: the ticket a member wake produces, the
 * store the superagent engine writes it through, and the self-review verdict
 * that decides whether a result may leave the member.
 * @module @tomato/experimental-robot-room-local
 */

import { randomUUID } from 'node:crypto'
import { brandString } from '@tomato/branded'
import type { Context } from '@tomato/cordis'
import { accept, latestAssignment } from '@tomato/superagent'
import type {
  ActorId, AssignmentReport, MandateId, MandateScope, StoredTicket, SuperagentStore,
  ThreadRef, Ticket, TicketId,
} from '@tomato/superagent'
import type { RoomWorkRecord } from '@tomato/experimental-robot-room'
import { z } from 'zod'
import { storedTicketSchema } from '@tomato/superagent-local'
import { defineDomain, domainTable } from '@tomato/storage-domain'

/** Source name room work records give their threads. */
export const ROOM_WORK_SOURCE = 'room'

/** Verdict line one self-review ends with. */
const VERDICT_LINE = /REVIEW\s*:\s*(pass|fail)\b/iu

/** Bullet line one self-review lists a finding on. */
const FINDING_LINE = /^\s*[-*]\s+(.+)$/u

/** Findings one self-review may contribute to a blocked report. */
const MAX_FINDINGS = 10

/** Longest finding text a report carries. */
const MAX_FINDING_CHARS = 300

/** Longest result summary a ready report carries. */
const MAX_SUMMARY_CHARS = 400

/** Which member and request one ticket belongs to. */
const seatSchema = z.object({
  room: z.string().min(1),
  member: z.string().min(1),
  seq: z.number().int().positive(),
  at: z.number().int().nonnegative(),
})

/** Where one ticket came from in a room. */
export type RoomWorkSeat = z.infer<typeof seatSchema>

/** Durable room work records: one ticket document and one seat record per id. */
export const roomWorkDomain = defineDomain({
  name: 'tomato_room_work',
  version: 1,
  layout: 'per-record',
  tables: {
    tickets: domainTable<TicketId, StoredTicket>(storedTicketSchema),
    seats: domainTable<TicketId, RoomWorkSeat>(seatSchema),
  },
})

/** A room work store whose queued writes can be awaited before reporting success. */
export interface RoomWorkStore extends SuperagentStore {
  /** Record which member and request one ticket belongs to. */
  putSeat(ticket: TicketId, seat: RoomWorkSeat): void
  /** Read one ticket's seat, when the store holds it. */
  seat(ticket: TicketId): RoomWorkSeat | undefined
  /** Every recorded seat. */
  seats(): readonly [TicketId, RoomWorkSeat][]
  /** Resolve once every queued write is durable. */
  flush(): Promise<void>
  /** Close the domain, after the queued writes settle. */
  close(): Promise<void>
}

/**
 * Open the durable work store over the deployment's storage domain.
 * @param ctx - context carrying `ctx.storageDomain`.
 * @returns a store the engine can write through, with flush and close.
 */
export async function createRoomWorkStore(ctx: Context): Promise<RoomWorkStore> {
  const domain = await ctx.storageDomain.open(roomWorkDomain)
  const tickets = new Map<TicketId, StoredTicket>()
  const seats = new Map<TicketId, RoomWorkSeat>()
  for (const [id, entry] of domain.table('tickets').entries()) tickets.set(id, entry)
  for (const [id, seat] of domain.table('seats').entries()) seats.set(id, seat)
  let pending: Promise<void> = Promise.resolve()
  const write = (operation: () => Promise<void>): void => {
    pending = pending.then(operation)
      /* v8 ignore start -- a backend write failure is logged and never rethrown; the room guard already admitted the turn. */
      .catch((error: unknown) => { ctx.logger.warn(`room work: durable write failed: ${String(error)}`) })
      /* v8 ignore stop */
  }
  return {
    putTrigger: () => {
      throw new Error('room work: the room guard owns admission, so the engine stores no trigger here')
    },
    trigger: () => {
      throw new Error('room work: the room guard owns admission, so the engine stores no trigger here')
    },
    triggers: () => {
      throw new Error('room work: the room guard owns admission, so the engine stores no trigger here')
    },
    putTicket: (entry) => {
      tickets.set(entry.ticket.id, entry)
      write(async () => { await domain.table('tickets').put(entry.ticket.id, entry) })
    },
    ticket: id => tickets.get(id),
    tickets: () => [...tickets.values()],
    putSeat: (ticket, seat) => {
      seats.set(ticket, seat)
      write(async () => { await domain.table('seats').put(ticket, seat) })
    },
    seat: ticket => seats.get(ticket),
    seats: () => [...seats.entries()],
    flush: async () => { await pending },
    close: async () => {
      await pending
      await domain.close()
    },
  }
}

/**
 * Thread a room message owns, so tickets from one human request group together.
 * @param room - room identity.
 * @param seq - sequence of the message that started the work.
 * @returns the source-qualified thread.
 */
export function roomThread(room: string, seq: number): ThreadRef {
  return { source: ROOM_WORK_SOURCE, id: `${room}#${seq}` }
}

/** Verdict and findings one member produced about its own work. */
export interface SelfReview {
  /** Whether the member cleared its result. */
  readonly passed: boolean
  /** Whether a verdict line was present; absent is fail-closed. */
  readonly parsed: boolean
  /** Findings listed after the verdict, in the order the member wrote them. */
  readonly findings: readonly string[]
}

/**
 * Read the verdict and findings from one self-review turn.
 * @param text - the self-review turn's assistant text.
 * @returns the verdict; a missing verdict parses as a failing, unparsed review.
 */
export function parseSelfReview(text: string): SelfReview {
  const lines = text.split(/\r?\n/u)
  const index = lines.findIndex(line => VERDICT_LINE.test(line))
  if (index < 0) return { passed: false, parsed: false, findings: [] }
  const verdict = lines[index] ?? ''
  const findings: string[] = []
  for (const line of lines.slice(index + 1)) {
    if (findings.length >= MAX_FINDINGS) break
    const finding = FINDING_LINE.exec(line)?.[1]
    if (finding === undefined) continue
    findings.push(finding.trim().slice(0, MAX_FINDING_CHARS))
  }
  return { passed: /REVIEW\s*:\s*pass\b/iu.test(verdict), parsed: true, findings }
}

/** What one member turn hands the engine as its report. */
export interface TurnReportInput {
  /** Assistant text the member produced for the room. */
  readonly text: string
  /** Self-review the member ran after producing it. */
  readonly review: SelfReview
  /** Failure the turn ended with, when it ended badly. */
  readonly failure?: string | undefined
}

/**
 * Decide the assignment state one finished member turn reports.
 * @param input - result text, self-review, and any turn failure.
 * @returns the report the engine records for the assignment.
 */
export function reportForTurn(input: TurnReportInput): AssignmentReport {
  if (input.failure !== undefined) return { state: 'failed', summary: input.failure }
  const text = input.text.trim()
  if (text === '') return { state: 'dropped', summary: 'the member produced no answer' }
  if (!input.review.parsed) {
    return { state: 'blocked', summary: 'self-review verdict missing: the result was not delivered' }
  }
  if (!input.review.passed) {
    const summary = input.review.findings.length === 0
      ? 'self-review failed without findings'
      : input.review.findings.join('; ')
    return { state: 'blocked', summary: summary.slice(0, MAX_SUMMARY_CHARS) }
  }
  return { state: 'ready', summary: text.slice(0, MAX_SUMMARY_CHARS) }
}

/** What one member wake needs to open its work ticket. */
export interface RoomTicketInput {
  /** Store the ticket is written to. */
  readonly store: SuperagentStore
  /** Room identity. */
  readonly room: string
  /** Sequence of the message that caused the wake. */
  readonly messageSeq: number
  /** What the member was asked to do, as its subject. */
  readonly subject: string
  /** Who authorized the work. */
  readonly sender: { readonly kind: 'human' | 'member'; readonly id: string }
  /** Session that accepted the work and may read what it used. */
  readonly supervisor: string
  /** How far the work may go. */
  readonly scope: MandateScope
  /** Policy version the acceptance is recorded under. */
  readonly policyVersion: string
  /** Start of the ticket. */
  readonly now: Date
}

/**
 * Open the ticket one member wake produces and record it as accepted.
 * @param input - room, message, member, and authorization facts.
 * @returns the accepted ticket.
 */
export function openRoomTicket(input: RoomTicketInput): Ticket {
  const thread = roomThread(input.room, input.messageSeq)
  const explicit = input.sender.kind === 'human'
  return accept(input.store, {
    id: brandString<TicketId>(`room-ticket-${randomUUID()}`),
    subject: input.subject.slice(0, MAX_SUMMARY_CHARS),
    supervisor: input.supervisor,
    thread,
    mandate: {
      id: brandString<MandateId>(`room-mandate-${randomUUID()}`),
      policyVersion: input.policyVersion,
      scope: input.scope,
      strength: explicit ? 'explicit' : 'proposed',
      matchedRules: [explicit ? 'room/human-request' : 'room/peer-request'],
      sender: brandString<ActorId>(`${input.sender.kind}:${input.sender.id}`),
      thread,
      at: input.now.toISOString(),
    },
  })
}

/**
 * Project one stored ticket and its seat as the room's work record.
 * @param entry - stored ticket.
 * @param seat - member and request the ticket came from.
 * @returns the record the room reports.
 */
export function workRecordOf(entry: StoredTicket, seat: RoomWorkSeat): RoomWorkRecord {
  const report = latestAssignment(entry.ticket)?.report
  const state: RoomWorkRecord['state'] = report === undefined
    ? 'running'
    : report.state === 'ready' || report.state === 'blocked' || report.state === 'failed' || report.state === 'dropped'
      ? report.state
      : 'running'
  return {
    ticket: entry.ticket.id,
    room: seat.room,
    thread: entry.ticket.follows[0]?.id ?? '',
    member: seat.member,
    subject: entry.ticket.subject,
    sender: entry.ticket.mandate.sender,
    strength: entry.ticket.mandate.strength,
    state,
    rounds: entry.ticket.assignments.length,
    ...entry.ticket.review === undefined
      ? {}
      : { review: { rounds: entry.ticket.review.rounds, findings: entry.ticket.review.findings.map(finding => finding.summary) } },
    at: seat.at,
  }
}
