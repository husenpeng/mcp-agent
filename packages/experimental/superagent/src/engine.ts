/**
 * The engine's state transitions: a trigger enters, an acceptance makes a
 * ticket, an assignment runs, a report moves it, and a person can stop it.
 * Every operation reads and writes through {@link SuperagentStore}, so the same
 * logic runs over memory in a test and over a durable medium in a deployment.
 */
import { canStart, latestAssignment } from './index.ts'
import { threadKey } from './store.ts'
import type { SuperagentStore } from './store.ts'
import type {
  ReviewVerdict,
  Assignment,
  AssignmentId,
  AssignmentReport,
  Mandate,
  ThreadRef,
  Ticket,
  TicketId,
  Trigger,
  TriggerId,
} from './types.ts'

/** Failure the engine raises when an operation cannot proceed. */
export class SuperagentError extends Error {
  /**
   * @param message - what failed, in terms a caller can act on.
   * @param code - stable failure kind.
   */
  constructor(message: string, readonly code: SuperagentErrorCode) {
    super(message)
    this.name = 'SuperagentError'
  }
}

/** Stable failure kinds the engine raises. */
export type SuperagentErrorCode = 'unknown-ticket' | 'not-startable' | 'unknown-assignment' | 'not-reviewable'

/** What one intake did. */
export interface IntakeOutcome {
  /** `duplicate` means the store already held this trigger id. */
  readonly outcome: 'stored' | 'duplicate'
  /** Tickets the trigger reached through a subscription, in no particular order. */
  readonly reached: readonly TicketId[]
}

/**
 * Store one trigger and hand it to the tickets subscribed to its threads.
 * A repeated trigger id is the same event: it reaches nobody twice.
 * @param store - storage to write through.
 * @param trigger - the normalized event.
 * @returns whether it was new, and which tickets it reached.
 */
export function intake(store: SuperagentStore, trigger: Trigger): IntakeOutcome {
  if (store.trigger(trigger.id) !== undefined) return { outcome: 'duplicate', reached: [] }
  store.putTrigger(trigger)
  const keys = new Set(trigger.threads.map(threadKey))
  const reached = store.tickets()
    .filter(entry => !entry.ticket.ended && !entry.ticket.stopped)
    .filter(entry => entry.subscriptions.some(thread => keys.has(threadKey(thread))))
    .map(entry => entry.ticket.id)
  return { outcome: 'stored', reached }
}

/** What one acceptance creates. */
export interface AcceptRequest {
  /** Identity the engine gives the new ticket. */
  readonly id: TicketId
  /** What the person asked for, as accepted. */
  readonly subject: string
  /** Why the work may be done and how far it may go. */
  readonly mandate: Mandate
  /** Thread the acceptance came from; the ticket follows it. */
  readonly thread: ThreadRef
  /** Session accepting the ticket, which becomes its supervisor. */
  readonly supervisor: string
}

/**
 * Create one ticket from an accepted trigger and subscribe it to that thread,
 * so later messages on the same conversation reach the work without a mention.
 * @param store - storage to write through.
 * @param request - identity, subject, authorization, and thread.
 * @returns the stored ticket.
 */
export function accept(store: SuperagentStore, request: AcceptRequest): Ticket {
  const ticket: Ticket = {
    id: request.id,
    subject: request.subject,
    mandate: request.mandate,
    supervisor: request.supervisor,
    follows: [request.thread],
    stopped: false,
    ended: false,
    assignments: [],
  }
  store.putTicket({ ticket, subscriptions: [request.thread] })
  return ticket
}

/** What one assignment needs to start. */
export interface AssignRequest {
  /** Executor session that will run the work. */
  readonly session: string
  /** Directory the executor works in. */
  readonly directory: string
}

/**
 * Bind the ticket to one executor run.
 * @param store - storage to write through.
 * @param ticketId - ticket to start.
 * @param request - executor session and its directory.
 * @returns the started assignment.
 * @throws {@link SuperagentError} `unknown-ticket` or `not-startable`.
 */
export function assign(store: SuperagentStore, ticketId: TicketId, request: AssignRequest): Assignment {
  const entry = require(store, ticketId)
  if (!canStart(entry.ticket)) {
    throw new SuperagentError(`ticket "${ticketId}" cannot start another assignment now`, 'not-startable')
  }
  const assignment: Assignment = {
    id: `assignment-${entry.ticket.assignments.length + 1}` as AssignmentId,
    session: request.session,
    directory: request.directory,
    ended: false,
  }
  const ticket: Ticket = { ...entry.ticket, assignments: [...entry.ticket.assignments, assignment] }
  store.putTicket({ ticket, subscriptions: entry.subscriptions })
  return assignment
}

/**
 * Record what one executor run reports. A report that hands the work back or
 * ends it also ends the assignment, which frees the ticket's slot.
 * @param store - storage to write through.
 * @param ticketId - ticket the run belongs to.
 * @param assignmentId - run that reported.
 * @param report - the report itself.
 * @returns the updated ticket.
 * @throws {@link SuperagentError} `unknown-ticket` or `unknown-assignment`.
 */
export function report(
  store: SuperagentStore,
  ticketId: TicketId,
  assignmentId: AssignmentId,
  report: AssignmentReport,
): Ticket {
  const entry = require(store, ticketId)
  const latest = latestAssignment(entry.ticket)
  if (latest === undefined || latest.id !== assignmentId) {
    throw new SuperagentError(`ticket "${ticketId}" has no assignment "${assignmentId}"`, 'unknown-assignment')
  }
  // A turn that ended for any reason releases the ticket's slot; only a run that
  // says it is still working keeps it.
  const settled = report.state !== 'progress'
  const assignments = entry.ticket.assignments.map(assignment => assignment.id === assignmentId
    ? { ...assignment, report, ended: settled }
    : assignment)
  const ticket: Ticket = { ...entry.ticket, assignments }
  store.putTicket({ ticket, subscriptions: entry.subscriptions })
  return ticket
}

/**
 * Record what an independent reviewer concluded about a ready result. A
 * blocking finding sends the work back; the round budget decides when it stops
 * looping and a person takes over.
 * @param store - storage to write through.
 * @param ticketId - ticket the review read.
 * @param verdict - the reviewer's conclusion.
 * @returns the updated ticket.
 * @throws {@link SuperagentError} `unknown-ticket`.
 */
export function recordReview(store: SuperagentStore, ticketId: TicketId, verdict: ReviewVerdict): Ticket {
  const entry = require(store, ticketId)
  const ticket: Ticket = { ...entry.ticket, review: verdict }
  store.putTicket({ ticket, subscriptions: entry.subscriptions })
  return ticket
}

/**
 * Mark a ticket stopped. A stopped ticket takes no new work and no further
 * messages, and never resumes; the work it already produced stays as it is.
 * @param store - storage to write through.
 * @param ticketId - ticket to stop.
 * @returns the updated ticket.
 * @throws {@link SuperagentError} `unknown-ticket`.
 */
export function stop(store: SuperagentStore, ticketId: TicketId): Ticket {
  const entry = require(store, ticketId)
  const ticket: Ticket = { ...entry.ticket, stopped: true }
  store.putTicket({ ticket, subscriptions: entry.subscriptions })
  return ticket
}

/**
 * Mark a ticket ended, which is what a closed conversation or a person does.
 * @param store - storage to write through.
 * @param ticketId - ticket to end.
 * @returns the updated ticket.
 * @throws {@link SuperagentError} `unknown-ticket`.
 */
export function end(store: SuperagentStore, ticketId: TicketId): Ticket {
  const entry = require(store, ticketId)
  const ticket: Ticket = { ...entry.ticket, ended: true }
  store.putTicket({ ticket, subscriptions: entry.subscriptions })
  return ticket
}

/**
 * Read one ticket or raise.
 * @param store - storage to read.
 * @param ticketId - ticket to read.
 * @returns the stored entry.
 * @throws {@link SuperagentError} `unknown-ticket`.
 */
function require(store: SuperagentStore, ticketId: TicketId) {
  const entry = store.ticket(ticketId)
  if (entry === undefined) throw new SuperagentError(`unknown ticket "${ticketId}"`, 'unknown-ticket')
  return entry
}

/** Trigger the engine stored, for a caller that needs the original event. */
export type { Trigger, TriggerId }
