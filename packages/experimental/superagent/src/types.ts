/**
 * Vocabulary of the superagent work domain: the value a person states, the
 * conversation it arrives on, the authorization it carries, the unit of work
 * it becomes, and what an executor reports back. Types only; the engine that
 * stores and advances them lives beside this module.
 */
import type { Branded } from '@tomato/branded'

/** One accepted unit of external input. */
export type TriggerId = Branded<'TriggerId'>
/** One conversation a source groups triggers into. */
export type ThreadId = Branded<'ThreadId'>
/** One unit of authorized work. */
export type TicketId = Branded<'TicketId'>
/** One authorization recorded when a ticket was accepted. */
export type MandateId = Branded<'MandateId'>
/** One binding of a ticket to an executor run. */
export type AssignmentId = Branded<'AssignmentId'>
/** Identity a source gives an actor, in that source's own namespace. */
export type ActorId = Branded<'ActorId'>

/**
 * Identifies one conversation inside one source. The path never crosses
 * sources: a source resolves its own thread keys and the engine stores the
 * pair, so two sources cannot collide on an id they both chose.
 */
export interface ThreadRef {
  /** Source that owns the key, such as `feishu` or `github`. */
  readonly source: string
  /** Source-native conversation key. */
  readonly id: string
}

/** Where a reply to one thread is written. */
export interface ChannelRef {
  /** Source that can send to this address. */
  readonly source: string
  /** Source-native address fields, such as a chat and a message id. */
  readonly address: Readonly<Record<string, string>>
}

/** One immutable external event, as the receiving source normalized it. */
export interface Trigger {
  /** Source-assigned identity; a repeat of the same id is the same event. */
  readonly id: TriggerId
  /** Source that produced it. */
  readonly source: string
  /** Threads it belongs to; the first hosts its evaluation. */
  readonly threads: readonly ThreadRef[]
  /** Who wrote it, in the source's namespace. */
  readonly actor: ActorId
  /** Whether a person, rather than a bot, CI, or this agent, wrote it. */
  readonly human: boolean
  /** How the writer addressed the agent, when the source can tell. */
  readonly addressed?: 'mention' | 'direct' | undefined
  /** When the source saw it, as an ISO 8601 instant. */
  readonly at: string
  /** Text the source extracted for the agent. */
  readonly text: string
  /** Where a reply belongs, when the source knows. */
  readonly channel?: ChannelRef | undefined
  /** Source-native details; the engine never interprets them. */
  readonly meta: Readonly<Record<string, string>>
}

/** How far one acceptance authorizes work to go. */
export type MandateScope = 'investigate' | 'change' | 'release'
/** How firmly a person asked for the work. */
export type MandateStrength = 'explicit' | 'proposed'

/** Why the work may be done, and how far it may go. Immutable once accepted. */
export interface Mandate {
  readonly id: MandateId
  /** Version of the rules the acceptance was judged under. */
  readonly policyVersion: string
  /** How far the ticket may go. */
  readonly scope: MandateScope
  /** How firmly the request was made. */
  readonly strength: MandateStrength
  /** Rules the acceptance matched, for audit. */
  readonly matchedRules: readonly string[]
  /** The sender's identity on the source that carried the trigger. */
  readonly sender: ActorId
  /** Source and thread the acceptance came from. */
  readonly thread: ThreadRef
  /** When it was granted, as an ISO 8601 instant. */
  readonly at: string
}

/**
 * Where an open ticket stands, decided by what it waits for. The engine
 * derives it from the latest report and the person's answers; it is never
 * stored independently.
 */
export type TicketStage =
  | { readonly stage: 'person'; readonly action: 'delivery' | 'answer' | 'review' | 'blocked' | 'failed' }
  | { readonly stage: 'working'; readonly action?: 'queued' }
  | { readonly stage: 'idle' }
  | { readonly stage: 'ended' }

/** What one assignment reported back to the ticket. */
export type ReportState = 'progress' | 'waiting' | 'ready' | 'blocked' | 'failed' | 'dropped'

/** One executor report. Only `ready` hands the work back for a person to review. */
export interface AssignmentReport {
  readonly state: ReportState
  /** Result text the person reads, when the executor produced one. */
  readonly summary?: string | undefined
  /** The one question that needs an answer, kept separate from the summary. */
  readonly question?: string | undefined
}

/** One binding of a ticket to an executor run. */
export interface Assignment {
  readonly id: AssignmentId
  /** Executor session the work ran in. */
  readonly session: string
  /** Directory the executor worked in. */
  readonly directory: string
  /** Whether the run is still going. */
  readonly ended: boolean
  /** Latest report, once the executor made one. */
  readonly report?: AssignmentReport | undefined
}

/** One unit of authorized work and the state it holds instead of an executor's. */
export interface Ticket {
  readonly id: TicketId
  /** What the person asked for, as accepted. */
  readonly subject: string
  /** Why it may be done. */
  readonly mandate: Mandate
  /** Session that accepted the ticket; it may read every Session the work used. */
  readonly supervisor: string
  /** Threads followed for context or for their own change requests. */
  readonly follows: readonly ThreadRef[]
  /** Whether a person stopped it; a stopped ticket never resumes. */
  readonly stopped: boolean
  /** Whether the work reached its end. */
  readonly ended: boolean
  /** Assignments it had, oldest first. */
  readonly assignments: readonly Assignment[]
  /** Latest review of a ready result; absent until a reviewer read one. */
  readonly review?: ReviewVerdict | undefined
}

/** How severe one review finding is. */
export type Severity = 'p0' | 'p1' | 'p2'

/** One thing the reviewer found, addressed to a place in the work. */
export interface ReviewFinding {
  /** Statement of the problem, in terms the implementer can act on. */
  readonly summary: string
  readonly severity: Severity
  /** Repository-relative file it applies to. */
  readonly file: string
  /** Line the finding starts at, when the reviewer could name one. */
  readonly line?: number | undefined
}

/** What one reviewer concluded about the work. */
export interface ReviewVerdict {
  /** Findings, most severe first when the reviewer ordered them. */
  readonly findings: readonly ReviewFinding[]
  /** How many review rounds the work has already had. */
  readonly rounds: number
}

/** What happens to a reviewed result. */
export type ReviewDecision =
  /** Hand it to a person: no blocking finding remains. */
  | { readonly decision: 'handoff' }
  /** Send it back to the implementer with the blocking findings. */
  | { readonly decision: 'revise'; readonly blocking: readonly ReviewFinding[] }
  /** Stop looping and let a person decide what to do with it. */
  | { readonly decision: 'escalate'; readonly blocking: readonly ReviewFinding[] }
