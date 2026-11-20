/**
 * Running one ticket's work: the engine leases an executor, records the run it
 * got, drives it, and turns whatever comes back into a report. The executor
 * itself lives in a provider; this module owns only the sequence and the
 * containment of its failures.
 */
import { assign, recordReview, report, SuperagentError } from './engine.ts'
import { review } from './review.ts'
import { canStart, latestAssignment } from './index.ts'
import type { SuperagentStore } from './store.ts'
import type { Supervision } from './supervise.ts'
import type {
  Assignment,
  AssignmentReport,
  Mandate,
  ReviewDecision,
  ReviewVerdict,
  Ticket,
  TicketId,
  Trigger,
} from './types.ts'

/** What one executor needs to start: the work, why it may be done, and its scope. */
export interface WorkerBrief {
  /** Ticket the work belongs to. */
  readonly ticket: TicketId
  /** The request as the person stated it, bounded to one short statement. */
  readonly subject: string
  /** Why the work may be done and how far it may go. */
  readonly mandate: Mandate
  /**
   * Messages the person sent after the work was accepted — an answer, added
   * context, or a continuation after a cancelled run — oldest first. The run
   * reads them as the latest instruction on the same work.
   */
  readonly context?: readonly string[]
}

/** One executor run the engine has not recorded yet. */
export interface WorkerLease {
  /** Session the run owns; recorded on the assignment so a person can read it. */
  readonly session: string
  /** Directory the run works in. */
  readonly directory: string
  /** Drive the work and report on it. */
  run(brief: WorkerBrief): Promise<AssignmentReport>
  /**
   * Abort the run a person stopped. An in-flight turn ends aborted and `run`
   * resolves with a `dropped` report; a run that has not started resolves
   * `dropped` without driving a turn. The ticket keeps its slot released, so a
   * later message may start the next run.
   */
  cancel(): void
}

/** An executor the engine can lease a run from. */
export interface Worker {
  /**
   * Start one run for a ticket.
   * @param brief - work, authorization, and scope.
   * @returns the run, before it has produced a report.
   */
  lease(brief: WorkerBrief): Promise<WorkerLease>
}

/**
 * The brief one ticket hands its executor.
 * @param ticket - ticket to describe.
 * @param context - person messages the next run reads as its latest instruction, oldest first.
 * @returns the work, its subject, the mandate that authorizes it, and any continuation context.
 */
export function briefFor(ticket: Ticket, context?: readonly string[]): WorkerBrief {
  return {
    ticket: ticket.id,
    subject: ticket.subject,
    mandate: ticket.mandate,
    ...context === undefined || context.length === 0 ? {} : { context },
  }
}

/**
 * Run one ticket's work end to end: lease an executor, record the assignment,
 * drive it, and report what it produced. A run that throws reports itself as
 * failed rather than escaping, so the ticket keeps a truthful state.
 * @param store - storage to write through.
 * @param ticketId - ticket to run.
 * @param worker - executor to lease from.
 * @returns the updated ticket.
 * @throws {@link SuperagentError} `unknown-ticket` or `not-startable`.
 */
/** What one executed assignment left: the ticket after the report, and the report itself. */
export interface AssignmentRun {
  /** Ticket as the report left it. */
  readonly ticket: Ticket
  /** What the run reported, including a failure the run threw. */
  readonly report: AssignmentReport
}

/** What one assignment run accepts beyond the ticket and its executor. */
export interface AssignmentOptions {
  /** Person messages the run reads as its latest instruction, oldest first. */
  readonly context?: readonly string[]
  /**
   * Receives the lease once the assignment is recorded and before the run is
   * driven, so a caller can cancel the in-flight run through {@link WorkerLease.cancel}.
   */
  readonly onLease?: (lease: WorkerLease) => void
}

/**
 * Lease a worker, record the assignment, and drive one run to its report.
 * @param store - the ticket store the assignment is recorded in.
 * @param ticketId - ticket that starts another assignment.
 * @param worker - worker source the lease comes from.
 * @param options - extra context messages and the lease observer.
 * @returns the reported ticket with the outcome the run left.
 */
export async function runAssignment(
  store: SuperagentStore,
  ticketId: TicketId,
  worker: Worker,
  options?: AssignmentOptions,
): Promise<AssignmentRun> {
  const entry = store.ticket(ticketId)
  if (entry === undefined) throw new SuperagentError(`unknown ticket "${ticketId}"`, 'unknown-ticket')
  if (!canStart(entry.ticket)) {
    throw new SuperagentError(`ticket "${ticketId}" cannot start another assignment now`, 'not-startable')
  }
  const brief = briefFor(entry.ticket, options?.context)
  const lease = await worker.lease(brief)
  const assignment = assign(store, ticketId, { session: lease.session, directory: lease.directory })
  options?.onLease?.(lease)
  let outcome: AssignmentReport
  try {
    outcome = await lease.run(brief)
  } catch (error: unknown) {
    outcome = { state: 'failed', summary: failureText(error) }
  }
  return { ticket: report(store, ticketId, assignment.id, outcome), report: outcome }
}

/**
 * Text a failed run leaves for the person and the next attempt.
 * @param error - whatever the run threw.
 * @returns a one-line explanation that never loses the case of a plain string.
 */
export function failureText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * The assignment a ticket currently holds open, when it has one.
 * @param ticket - the ticket to inspect.
 * @returns its latest assignment while that assignment has not ended.
 */
export function openAssignment(ticket: Ticket): Assignment | undefined {
  const latest = latestAssignment(ticket)
  return latest === undefined || latest.ended ? undefined : latest
}

/** What a reviewer is asked to read. */
export interface ReviewerBrief {
  /** Ticket whose ready result is being reviewed. */
  readonly ticket: TicketId
  /** What the work was meant to do, so the review checks the request too. */
  readonly subject: string
  /** How many reviews the work already had; zero on the first. */
  readonly round: number
}

/** What one supervision turn reads. */
export interface SupervisorRequest {
  /** Request to judge. */
  readonly trigger: Trigger
  /** Policy the team runs under, so the decision can name it. */
  readonly policyVersion: string
}

/**
 * The decision-making half of admission: whether a request is work this team
 * takes, and what pieces it becomes. The rule-based `admit` still decides how
 * much authority an accepted piece earns.
 */
export interface Supervisor {
  /**
   * Judge one request.
   * @param request - the request and the policy in force.
   * @returns the decision the engine acts on.
   */
  supervise(request: SupervisorRequest): Promise<Supervision>
}

/** An independent reviewer the engine can consult. */
export interface Reviewer {
  /**
   * Read one ready result and report what it found.
   * @param brief - what to review and which round this is.
   * @returns the verdict; an empty findings list clears the work.
   */
  review(brief: ReviewerBrief): Promise<ReviewVerdict>
}

/**
 * Have an independent reviewer read one ready result and record the verdict.
 * Only a ready result can be reviewed: reviewing work that is still running
 * would grade a result the implementer has not finished.
 * @param store - storage to write through.
 * @param ticketId - ticket whose result is ready.
 * @param reviewer - independent reviewer.
 * @returns the updated ticket and what the review decided.
 * @throws {@link SuperagentError} `unknown-ticket` or `not-reviewable`.
 */
export async function runReview(
  store: SuperagentStore,
  ticketId: TicketId,
  reviewer: Reviewer,
): Promise<{ readonly ticket: Ticket; readonly decision: ReviewDecision }> {
  const entry = store.ticket(ticketId)
  if (entry === undefined) throw new SuperagentError(`unknown ticket "${ticketId}"`, 'unknown-ticket')
  const assignment = latestAssignment(entry.ticket)
  if (assignment?.report?.state !== 'ready') {
    throw new SuperagentError(`ticket "${ticketId}" has no ready result to review`, 'not-reviewable')
  }
  const verdict = await reviewer.review({
    ticket: ticketId,
    subject: entry.ticket.subject,
    round: entry.ticket.review?.rounds ?? 0,
  })
  const ticket = recordReview(store, ticketId, verdict)
  return { ticket, decision: review(verdict) }
}
