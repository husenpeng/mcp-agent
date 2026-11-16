/** The contract one review turn writes and the engine reads. */
import { describe, expect, it } from 'vitest'
import { FINDING_MARKER, parseReview, REVIEW_MARKER, reviewerBriefText } from '@tomato/superagent'
import type { TicketId } from '@tomato/superagent'

describe('review verdict', () => {
  it('reads a failure with its findings, severities, and sites', () => {
    const text = [
      'Checked both repositories.',
      `${FINDING_MARKER} p0 apps/web/page.tsx:12 the page component exceeds 200 lines`,
      `${FINDING_MARKER} P1 lib/api.py hard-coded response field`,
      `${REVIEW_MARKER} fail`,
    ].join('\n')
    expect(parseReview(text, 2)).toEqual({
      findings: [
        { summary: 'the page component exceeds 200 lines', severity: 'p0', file: 'apps/web/page.tsx', line: 12 },
        { summary: 'hard-coded response field', severity: 'p1', file: 'lib/api.py' },
      ],
      rounds: 2,
    })
  })

  it('reads a pass as no findings, and ignores findings that name no known severity', () => {
    expect(parseReview(`${REVIEW_MARKER} pass`, 1)).toEqual({ findings: [], rounds: 1 })
    const odd = [
      `${FINDING_MARKER} blocker a.ts too broad`,
      `${FINDING_MARKER} p0`,
      `${FINDING_MARKER} p0 a.ts`,
      `${REVIEW_MARKER} fail`,
    ].join('\n')
    expect(parseReview(odd, 1)).toEqual({ findings: [], rounds: 1 })
  })

  it('reads a turn that named no verdict as a review with nothing to say', () => {
    expect(parseReview('I looked at the diff and it seemed fine.', 1)).toEqual({ findings: [], rounds: 1 })
  })
})

describe('reviewer brief', () => {
  it('names the work, the round, and the shape of the verdict', () => {
    const text = reviewerBriefText({ ticket: 'ticket-1' as TicketId, subject: '加 tier 字段', round: 0 })
    expect(text).toContain('Review the result for: 加 tier 字段')
    expect(text).toContain('This is review round 1.')
    expect(text).toContain(`${FINDING_MARKER} <p0|p1|p2> <path>:<line> <summary>`)
    expect(text).toContain(`${REVIEW_MARKER} pass`)
    expect(text).toContain('Use p0 only for a problem that must not reach a person as finished work.')
  })
})
