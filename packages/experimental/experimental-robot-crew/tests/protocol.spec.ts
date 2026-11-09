import { describe, expect, it } from 'vitest'
import { A2A_MAX_TEXT, A2A_PROTOCOL, a2aSignature, clampText, createEnvelope, isEnvelope, normalizeA2aText } from '../src/index.ts'
import type { CrewRunId } from '../src/index.ts'

const run = 'run-1' as CrewRunId

function envelope(overrides: Partial<Parameters<typeof createEnvelope>[0]> = {}) {
  return createEnvelope({
    id: 'm-1',
    run,
    from: 'alpha',
    to: 'beta',
    intent: 'request',
    task: 'check the budget',
    payload: 'budget is 20k',
    hop: 1,
    at: 7,
    ...overrides,
  })
}

describe('A2A protocol', () => {
  it('carries the protocol version and freezes the envelope', () => {
    const message = envelope()
    expect(message.protocol).toBe(A2A_PROTOCOL)
    expect(message.hop).toBe(1)
    expect(Object.isFrozen(message)).toBe(true)
    expect(isEnvelope(message)).toBe(true)
  })

  it('rejects a hop that is not positive', () => {
    expect(() => envelope({ hop: 0 })).toThrow(/hop/u)
    expect(() => envelope({ hop: 1.5 })).toThrow(/hop/u)
  })

  it('bounds long tasks while keeping both ends', () => {
    const text = `${'start '.repeat(3000)}${'end '.repeat(3000)}`
    const clamped = clampText(text)
    expect(clamped.length).toBeLessThanOrEqual(A2A_MAX_TEXT + 3)
    expect(clamped).toContain('…')
    expect(clamped.startsWith('start')).toBe(true)
    expect(clamped.trimEnd().endsWith('end')).toBe(true)
  })

  it('normalizes punctuation and whitespace for the duplicate signature', () => {
    expect(normalizeA2aText('  Check  the BUDGET!  ')).toBe('check the budget')
    expect(a2aSignature({ from: 'a', to: 'b', intent: 'request', task: 'Check it!', payload: 'x' }))
      .toBe(a2aSignature({ from: 'a', to: 'b', intent: 'request', task: 'check it', payload: 'X' }))
    expect(a2aSignature({ from: 'a', to: 'b', intent: 'request', task: 'x', payload: 'y' }))
      .not.toBe(a2aSignature({ from: 'a', to: 'c', intent: 'request', task: 'x', payload: 'y' }))
  })

  it('recognizes only envelopes of this protocol', () => {
    expect(isEnvelope({ protocol: 'other', id: 'x' })).toBe(false)
    expect(isEnvelope(null)).toBe(false)
    expect(isEnvelope({ ...envelope(), intent: 'nope' })).toBe(false)
  })
})
