import { describe, expect, it } from 'vitest'
import { CrewLoopGuard, NO_PROGRESS_SIMILARITY, similarity } from '../src/index.ts'
import type { CrewGuardSpec } from '../src/index.ts'

const limits: CrewGuardSpec = {
  maxSteps: 3,
  maxMessages: 4,
  maxHops: 2,
  maxDuplicates: 1,
  noProgressWindow: 3,
  wallClockMs: 10_000,
  tokens: 1000,
}

const a2a = { intents: ['request', 'delegate'] as const, peers: [] }
const knownNodes = new Set(['alpha', 'beta'])

function admission(overrides: Partial<Parameters<CrewLoopGuard['admitMessage']>[0]> = {}) {
  return {
    from: 'alpha',
    to: 'beta',
    intent: 'request' as const,
    signature: 'alpha>beta:request:one:none',
    hop: 1,
    a2a: { intents: [...a2a.intents], peers: [] },
    knownNodes,
    ...overrides,
  }
}

describe('crew loop guard', () => {
  it('admits the first delivery and refuses the repeated signature', () => {
    const guard = new CrewLoopGuard(limits)
    expect(guard.admitMessage(admission())).toEqual({ ok: true })
    expect(guard.admitMessage(admission())).toMatchObject({ ok: false, refusal: 'duplicate' })
    expect(guard.snapshot().messages).toBe(1)
  })

  it('refuses a self message, an unknown peer, an excluded peer, and an unaccepted intent', () => {
    const guard = new CrewLoopGuard(limits)
    expect(guard.admitMessage(admission({ to: 'alpha' }))).toMatchObject({ refusal: 'self' })
    expect(guard.admitMessage(admission({ to: 'gamma' }))).toMatchObject({ refusal: 'unknown-peer' })
    expect(guard.admitMessage(admission({ a2a: { intents: ['request'], peers: ['gamma'] } }))).toMatchObject({ refusal: 'scope' })
    expect(guard.admitMessage(admission({ a2a: { intents: ['event'], peers: [] } }))).toMatchObject({ refusal: 'intent' })
    expect(guard.snapshot().messages).toBe(0)
  })

  it('refuses a hop over the limit and a message over the count ceiling', () => {
    const guard = new CrewLoopGuard({ ...limits, maxMessages: 1 })
    expect(guard.admitMessage(admission({ hop: 3 }))).toMatchObject({ refusal: 'hops' })
    expect(guard.admitMessage(admission())).toEqual({ ok: true })
    const second = guard.admitMessage(admission({ signature: 'alpha>beta:request:two:none' }))
    expect(second).toMatchObject({ refusal: 'messages' })
  })

  it('trips on activations, tokens, and wall clock', () => {
    let now = 0
    const guard = new CrewLoopGuard(limits, () => now)
    expect(guard.recordStep('a')).toBeUndefined()
    expect(guard.recordStep('b')).toBeUndefined()
    expect(guard.recordStep('c')).toBeUndefined()
    expect(guard.recordStep('d')).toMatchObject({ reason: 'steps' })
    expect(new CrewLoopGuard(limits).recordTokens(1200)).toMatchObject({ reason: 'tokens' })
    const clockGuard = new CrewLoopGuard(limits, () => now)
    now = 11_000
    expect(clockGuard.check()).toMatchObject({ reason: 'wall-clock' })
  })

  it('trips when every step in the window says the same thing', () => {
    const guard = new CrewLoopGuard({ ...limits, maxSteps: 12 })
    const text = 'The same long paragraph appears again with the same words and no new evidence.'
    guard.recordStep(text)
    guard.recordStep(text)
    expect(guard.recordStep(text)).toMatchObject({ reason: 'no-progress' })
    expect(similarity(text, text)).toBe(1)
    expect(similarity('alpha beta', 'gamma delta')).toBeLessThan(NO_PROGRESS_SIMILARITY)
  })

  it('keeps the first trip and reports it on later admissions', () => {
    const guard = new CrewLoopGuard({ ...limits, maxSteps: 0 })
    expect(guard.recordStep('x')).toMatchObject({ reason: 'steps' })
    expect(guard.admitMessage(admission())).toMatchObject({ refusal: 'scope' })
    expect(guard.snapshot().trip).toMatchObject({ reason: 'steps' })
  })
})
