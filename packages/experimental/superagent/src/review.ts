import type { ReviewDecision, ReviewFinding, ReviewVerdict } from './types.ts'

/**
 * The internal review gate: a worker's result reaches a person only after an
 * independent reviewer reads it. Findings are graded, and only an unresolved
 * blocking finding keeps the work away from the person.
 */

/** Most review rounds one ticket may spend before a person sees it. */
export const MAX_REVIEW_ROUNDS = 3

/**
 * Findings that keep the work away from a person.
 * @param verdict - reviewer conclusion.
 * @returns the blocking findings, in the order the reviewer wrote them.
 */
export function blocking(verdict: ReviewVerdict): readonly ReviewFinding[] {
  return verdict.findings.filter(finding => finding.severity === 'p0')
}

/**
 * Decide what to do with a reviewed result. A result with no blocking finding
 * goes to a person; one that keeps failing goes to the implementer until the
 * round budget is spent, then to a person who decides.
 * @param verdict - reviewer conclusion.
 * @param maxRounds - review rounds one ticket may spend.
 * @returns the decision and, when it blocks, the findings that caused it.
 */
export function review(verdict: ReviewVerdict, maxRounds: number = MAX_REVIEW_ROUNDS): ReviewDecision {
  const found = blocking(verdict)
  if (found.length === 0) return { decision: 'handoff' }
  if (verdict.rounds >= maxRounds) return { decision: 'escalate', blocking: found }
  return { decision: 'revise', blocking: found }
}
