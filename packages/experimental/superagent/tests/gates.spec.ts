/** The internal review gate and the merge gate. */
import { describe, expect, it } from 'vitest'
import { MAX_REVIEW_ROUNDS, blocking, mergeChange, mergeReadiness, review } from '@tomato/superagent'
import type { ChangeRequest, ReviewFinding, TicketId } from '@tomato/superagent'

/** One finding at the given severity. */
function finding(severity: ReviewFinding['severity'], summary = 'a problem'): ReviewFinding {
  return { summary, severity, file: 'apps/web/page.tsx', line: 12 }
}

/** One change request with everything green unless overridden. */
function change(overrides: Partial<ChangeRequest> = {}): ChangeRequest {
  return {
    repository: 'TomatoAg/client-monorepo',
    draft: false,
    checks: 'passing',
    mergeable: true,
    review: [],
    ...overrides,
  }
}

describe('review gate', () => {
  it('hands the work to a person when no blocking finding remains', () => {
    expect(blocking({ findings: [finding('p1'), finding('p2')], rounds: 1 })).toEqual([])
    expect(review({ findings: [finding('p1')], rounds: 1 })).toEqual({ decision: 'handoff' })
  })

  it('sends the work back with the blocking findings while rounds remain', () => {
    const verdict = { findings: [finding('p0', 'file too long'), finding('p1')], rounds: 0 }
    expect(blocking(verdict).map(item => item.summary)).toEqual(['file too long'])
    expect(review(verdict)).toEqual({ decision: 'revise', blocking: [finding('p0', 'file too long')] })
  })

  it('escalates to a person once the round budget is spent', () => {
    const verdict = { findings: [finding('p0')], rounds: MAX_REVIEW_ROUNDS }
    expect(review(verdict)).toMatchObject({ decision: 'escalate' })
    expect(review({ findings: [finding('p0')], rounds: MAX_REVIEW_ROUNDS - 1 })).toMatchObject({ decision: 'revise' })
    expect(review({ findings: [finding('p0')], rounds: 1 }, 1)).toMatchObject({ decision: 'escalate' })
  })
})

describe('merge gate', () => {
  it('is ready when only a person approval is missing', () => {
    expect(mergeReadiness(change())).toEqual({ ready: true, blockers: [] })
    expect(mergeReadiness(change({ review: [{ severity: 'p1' }, { severity: 'p2' }] })))
      .toEqual({ ready: true, blockers: [] })
  })

  it('names every blocker in the order a person would fix them', () => {
    expect(mergeReadiness(change({
      draft: true, checks: 'failing', mergeable: false, review: [{ severity: 'p0' }],
    }))).toEqual({
      ready: false,
      blockers: ['draft', 'checks-failing', 'conflict', 'blocking-finding'],
    })
    expect(mergeReadiness(change({ checks: 'pending' }))).toEqual({ ready: false, blockers: ['checks-pending'] })
  })
})

describe('merging a change', () => {
  const change = { draft: false, checks: 'passing' as const, mergeable: true }
  const request = { ticket: 'ticket-1' as TicketId, change, review: [], approved: true, repository: 'TomatoAg/client-monorepo' }

  it('carries the merge out once a person approved and nothing blocks', async () => {
    const executor = { merge: () => Promise.resolve({ merged: true as const, commit: 'abc123' }) }
    expect(await mergeChange(request, executor)).toEqual({ merged: true, blockers: [], detail: 'abc123' })
  })

  it('refuses without a person’s approval even when everything else is clear', async () => {
    const executor = { merge: () => Promise.resolve({ merged: true as const, commit: 'abc123' }) }
    expect(await mergeChange({ ...request, approved: false }, executor)).toEqual({
      merged: false, blockers: [], detail: 'a person has not approved this merge',
    })
  })

  it('stops on the blockers before it asks the executor to act', async () => {
    const executor = { merge: () => Promise.resolve({ merged: true as const, commit: 'never' }) }
    expect(await mergeChange({
      ...request,
      change: { draft: true, checks: 'failing', mergeable: false },
      review: [{ severity: 'p0' }],
    }, executor)).toEqual({
      merged: false, blockers: ['draft', 'checks-failing', 'conflict', 'blocking-finding'], detail: undefined,
    })
  })

  it('reports why the executor could not merge', async () => {
    const executor = { merge: () => Promise.resolve({ merged: false as const, reason: 'branch protection' }) }
    expect(await mergeChange(request, executor)).toEqual({ merged: false, blockers: [], detail: 'branch protection' })
  })
})
