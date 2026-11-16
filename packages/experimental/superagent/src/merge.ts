/**
 * The merge gate: what has to hold before a change reaches the main branch.
 * The gate answers only whether anything but a person's approval still stands
 * in the way; merging itself is a person's action or a deterministic command
 * acting for one, never the engine's.
 */

import type { TicketId } from './types.ts'

/** State of the continuous integration a change produced. */
export type CheckState = 'pending' | 'passing' | 'failing'

/** One finding the internal review reported on a change. */
export interface MergeFinding {
  /** Severity the reviewer graded it with. */
  readonly severity: string
}

/** What one change request reports about itself. */
export interface ChangeRequest {
  /** Repository the change targets, such as `TomatoAg/client-monorepo`. */
  readonly repository: string
  /** Whether the change request is still a draft. */
  readonly draft: boolean
  /** Continuous integration state, as the code host reports it. */
  readonly checks: CheckState
  /** Whether the code host considers the change mergeable right now. */
  readonly mergeable: boolean
  /** Findings the internal review reported on this change. */
  readonly review: readonly MergeFinding[]
}

/** Why a change is not ready to be put to a person yet, in the order to fix them. */
export type MergeBlocker = 'draft' | 'checks-pending' | 'checks-failing' | 'conflict' | 'blocking-finding'

/** Whether nothing but a person's approval stands in the way. */
export interface MergeReadiness {
  /** True when the change may be offered for a person's approval. */
  readonly ready: boolean
  /** What must be fixed first; empty when the change is ready. */
  readonly blockers: readonly MergeBlocker[]
}

/**
 * Judge one change request. A merge always needs a person's approval, which is
 * never a blocker here: this gate decides when asking for that approval makes
 * sense, and an unanswered conflict or failing check never does.
 * @param request - the change request as the code host reports it.
 * @returns the readiness and the blockers that stand in the way.
 */
export function mergeReadiness(request: ChangeRequest): MergeReadiness {
  const blockers: MergeBlocker[] = []
  if (request.draft) blockers.push('draft')
  if (request.checks === 'pending') blockers.push('checks-pending')
  if (request.checks === 'failing') blockers.push('checks-failing')
  if (!request.mergeable) blockers.push('conflict')
  if (request.review.some(finding => finding.severity === 'p0')) blockers.push('blocking-finding')
  return { ready: blockers.length === 0, blockers }
}

/** What one change request says about itself, as a code host reports it. */
export interface ChangeFacts {
  /** Whether the change request is still a draft. */
  readonly draft: boolean
  /** Continuous integration state. */
  readonly checks: CheckState
  /** Whether the code host considers it mergeable right now. */
  readonly mergeable: boolean
}

/** What one merge attempt did. */
export type MergeOutcome =
  | { readonly merged: true; readonly commit: string }
  | { readonly merged: false; readonly reason: string }

/** Carries a merge out for a person who approved it. */
export interface MergeExecutor {
  /**
   * Merge one change request.
   * @param repository - repository the change targets.
   * @param ticket - ticket whose work it carries.
   * @returns the commit the merge produced, or why it did not happen.
   */
  merge(repository: string, ticket: TicketId): Promise<MergeOutcome>
}

/** What one merge attempt left, for the caller that asked for it. */
export interface MergeResult {
  /** Whether the change reached the main branch. */
  readonly merged: boolean
  /** What stands in the way when it did not. */
  readonly blockers: readonly MergeBlocker[]
  /** Explanation of a refusal, or the commit a merge produced. */
  readonly detail?: string | undefined
}

/**
 * Decide and, when a person approved, carry out one merge.
 *
 * The gate never asks the engine for approval: the caller states that a person
 * approved, so an unanswered conflict, a failing check, or a blocking review
 * finding still stops the merge before the executor runs.
 * @param request - change request facts, the ticket it carries, and the approval state.
 * @param executor - carries the merge out once the gate allows it.
 * @returns whether the change was merged and, if not, what stopped it.
 */
export async function mergeChange(
  request: {
    readonly ticket: TicketId
    readonly change: ChangeFacts
    readonly review: readonly MergeFinding[]
    readonly approved: boolean
    readonly repository: string
  },
  executor: MergeExecutor,
): Promise<MergeResult> {
  const readiness = mergeReadiness({
    repository: request.repository,
    draft: request.change.draft,
    checks: request.change.checks,
    mergeable: request.change.mergeable,
    review: request.review,
  })
  if (!readiness.ready) return { merged: false, blockers: readiness.blockers }
  // A merge is a person's decision: the gate refuses rather than merging on its own.
  if (!request.approved) return { merged: false, blockers: [], detail: 'a person has not approved this merge' }
  const outcome = await executor.merge(request.repository, request.ticket)
  return outcome.merged
    ? { merged: true, blockers: [], detail: outcome.commit }
    : { merged: false, blockers: [], detail: outcome.reason }
}
