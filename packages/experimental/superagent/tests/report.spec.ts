/** Reading what a worker's turn said. */
import { describe, expect, it } from 'vitest'
import { brandString } from '@tomato/branded'
import { parseReport, REPORT_MARKER, workerBriefText } from '@tomato/superagent'
import type { ActorId, MandateId, TicketId } from '@tomato/superagent'

describe('worker report', () => {
  it('reads the state and summary a marker line carries', () => {
    const text = 'Changed the server field.\n\nREPORT: ready - PR opened for both repositories'
    expect(parseReport(text)).toEqual({
      report: { state: 'ready', summary: 'PR opened for both repositories' },
      body: 'Changed the server field.',
    })
  })

  it('accepts every documented state and keeps a summary separator out of it', () => {
    expect(parseReport('REPORT: blocked: needs a shared client change').report)
      .toEqual({ state: 'blocked', summary: 'needs a shared client change' })
    expect(parseReport('REPORT: progress').report).toEqual({ state: 'progress' })
    expect(parseReport('REPORT: dropped').report).toEqual({ state: 'dropped' })
  })

  it('treats a turn that said nothing, or named no known state, as waiting', () => {
    expect(parseReport('I looked around.').report).toEqual({ state: 'waiting' })
    expect(parseReport('REPORT: done').report).toEqual({ state: 'waiting' })
  })

  it('uses the last marker when a turn wrote more than one', () => {
    expect(parseReport('REPORT: progress\nlater\nREPORT: ready').report).toEqual({ state: 'ready' })
  })
})

describe('worker brief', () => {
  it('states the work, its authorization, and how to end the turn', () => {
    const text = workerBriefText({
      ticket: brandString<TicketId>('ticket-1'),
      subject: '给达人详情页加 tier 字段',
      mandate: {
        id: brandString<MandateId>('mandate-1'),
        policyVersion: 'p1', scope: 'change', strength: 'explicit', matchedRules: ['feishu:mention'],
        sender: brandString<ActorId>('ou_1'), thread: { source: 'feishu', id: 'oc_1:om_root' },
        at: '2026-11-14T00:00:00.000Z',
      },
    })
    expect(text).toContain('Work: 给达人详情页加 tier 字段')
    expect(text).toContain('policy p1, scope change, strength explicit')
    expect(text).toContain(`${REPORT_MARKER} <state>`)
    expect(text).toContain('progress, waiting, ready, blocked, failed, dropped')
  })
})

describe('worker report edge cases', () => {
  it('reads an empty marker line as waiting with no detail', () => {
    expect(parseReport('REPORT:')).toEqual({ report: { state: 'waiting' }, body: '' })
  })

  it('keeps a state that carries no separator before its return value', () => {
    // A word that only looks like a state after its summary is kept as the summary.
    expect(parseReport('REPORT: ready PR #12').report).toEqual({ state: 'ready', summary: 'PR #12' })
    expect(parseReport('REPORT:ready - fast').report).toEqual({ state: 'ready', summary: 'fast' })
    // A separator with no following space is still a separator.
    expect(parseReport('REPORT: ready -fast').report).toEqual({ state: 'ready', summary: 'fast' })
  })
})
