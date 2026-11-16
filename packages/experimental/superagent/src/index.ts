/**
 * Vocabulary and pure policy of the superagent work domain: triggers land on a
 * source, a thread groups them into a conversation, an acceptance records why
 * work may be done, and a ticket holds the state of that work instead of an
 * executor's session.
 *
 * This package holds no transport, persistence, or execution. A provider that
 * stores and advances tickets, sources that translate external events, and the
 * executor that runs the work all live in their own packages.
 * @module @tomato/superagent
 */
import { review } from './review.ts'
import type { Assignment, Ticket, TicketStage } from './types.ts'

export { accept, assign, end, intake, recordReview, report, stop, SuperagentError } from './engine.ts'
export type { AcceptRequest, AssignRequest, IntakeOutcome, SuperagentErrorCode } from './engine.ts'
export { createTicketSessionAccess } from './access.ts'
export { InMemoryStore, threadKey } from './store.ts'
export type { StoredTicket, SuperagentStore } from './store.ts'

export { channelOf, contentText, pollFeishu, replyTo, reportText, threadOf, toTrigger } from './source.ts'
export type { BotEvent, BotEventsPage, BotGateway, BotThread, BotThreadMessage, PollOutcome } from './source.ts'
export { BotGatewayError, HttpBotGateway } from './http-bot-gateway.ts'
export { admit } from './policy.ts'
export type { Admission, AdmissionReason, Policy, SourcePolicy } from './policy.ts'
export { blocking, MAX_REVIEW_ROUNDS, review } from './review.ts'

export { mergeChange, mergeReadiness } from './merge.ts'
export type { ChangeFacts, MergeExecutor, MergeOutcome, MergeResult } from './merge.ts'
export { briefFor, failureText, openAssignment, runAssignment, runReview } from './executor.ts'
export type { AssignmentRun } from './executor.ts'
export type { Reviewer, ReviewerBrief, Worker, WorkerBrief, WorkerLease } from './executor.ts'
export { FINDING_MARKER, parseReview, REVIEW_MARKER, reviewerBriefText } from './review-text.ts'
export { parseReport, REPORT_MARKER, workerBriefText } from './report.ts'
export type { Supervisor, SupervisorRequest } from './executor.ts'
export { parseSupervision, releaseRequest, SUPERVISION_MARKER, SUPERVISION_SCOPES, supervisorBriefText } from './supervise.ts'
export type { Supervision, WorkPlan } from './supervise.ts'
export type { ParsedReport } from './report.ts'
export { runCycle, subjectOf } from './cycle.ts'
export type { CycleRequest, CycleResult, CycleVerdict } from './cycle.ts'
export type { ChangeRequest, CheckState, MergeBlocker, MergeFinding, MergeReadiness } from './merge.ts'
export type { BotGatewayConfig } from './http-bot-gateway.ts'

export type {
  ActorId,
  Assignment,
  AssignmentId,
  AssignmentReport,
  ChannelRef,
  Mandate,
  MandateId,
  MandateScope,
  MandateStrength,
  ReportState,
  ReviewDecision,
  ReviewFinding,
  ReviewVerdict,
  Severity,
  ThreadId,
  ThreadRef,
  Ticket,
  TicketId,
  TicketStage,
  Trigger,
  TriggerId,
} from './types.ts'

/**
 * The newest assignment of a ticket, or `undefined` when it never ran.
 * @param ticket - ticket whose assignments are read oldest first.
 * @returns the last assignment, when it has one.
 */
export function latestAssignment(ticket: Ticket): Assignment | undefined {
  return ticket.assignments.at(-1)
}

/**
 * Whether a ticket currently waits on a person: a blocking review finding that
 * spent its round budget, or a run that reported it needs help.
 * @param ticket - ticket to read.
 * @returns whether the ticket cannot continue without a person.
 */
export function waitsForPerson(ticket: Ticket): boolean {
  return ticketStage(ticket).stage === 'person'
}

/**
 * Classify one ticket's stage.
 * @param ticket - ticket to classify.
 * @returns the stage, following the documented order: ended, answer, review,
 *   blocked or failed, queued, idle, working.
 */
export function ticketStage(ticket: Ticket): TicketStage {
  if (ticket.ended) return { stage: 'ended' }
  const assignment = latestAssignment(ticket)
  const report = assignment?.report
  if (report?.question !== undefined) return { stage: 'person', action: 'answer' }
  if (report?.state === 'ready') {
    // A ready result reaches a person only after an independent review clears it;
    // until then the work is either waiting for the reviewer or back with the implementer.
    if (ticket.review === undefined) return { stage: 'working' }
    return review(ticket.review).decision === 'revise' ? { stage: 'working' } : { stage: 'person', action: 'review' }
  }
  if ((report?.state === 'blocked' || report?.state === 'failed') && !ticket.stopped) {
    return { stage: 'person', action: report.state }
  }
  if (assignment === undefined) return { stage: 'working', action: 'queued' }
  if (assignment.ended) return { stage: 'idle' }
  return { stage: 'working' }
}

/**
 * Whether new work may take the ticket now: a stopped ticket never starts
 * again, and an unfinished assignment already holds it.
 * @param ticket - ticket to read.
 * @returns whether an executor slot may be given to it.
 */
export function canStart(ticket: Ticket): boolean {
  if (ticket.ended || ticket.stopped) return false
  const assignment = latestAssignment(ticket)
  return assignment === undefined || assignment.ended
}
