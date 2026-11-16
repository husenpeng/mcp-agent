/** Admission rules: who may originate work, and why a trigger is refused. */
import { describe, expect, it } from 'vitest'
import { admit } from '@tomato/superagent'
import type { ActorId, Policy, ThreadRef, Trigger, TriggerId } from '@tomato/superagent'

const POLICY: Policy = {
  version: 'p1',
  sources: [{ source: 'feishu', allowedActors: ['ou_1'] }],
}

const THREAD: ThreadRef = { source: 'feishu', id: 'oc_1:om_1' }

/** One trigger on the policy-covered source. */
function trigger(overrides: Partial<Trigger> = {}): Trigger {
  return {
    id: 'feishu:evt-1' as TriggerId,
    source: 'feishu',
    threads: [THREAD],
    actor: 'ou_1' as ActorId,
    human: true,
    addressed: 'mention',
    at: '2026-11-14T00:00:00.000Z',
    text: '加 tier 字段',
    meta: {},
    ...overrides,
  }
}

describe('admission', () => {
  it('admits an allowed person who addressed the agent and records the rule', () => {
    expect(admit(POLICY, trigger())).toEqual({ admitted: true, strength: 'explicit', rule: 'feishu:mention' })
    expect(admit(POLICY, trigger({ addressed: 'direct' }))).toEqual({
      admitted: true, strength: 'explicit', rule: 'feishu:direct',
    })
  })

  it('refuses a message the agent did not write, on a source the policy does not cover', () => {
    expect(admit(POLICY, trigger({ human: false }))).toEqual({ admitted: false, reason: 'bot-authored' })
    expect(admit(POLICY, trigger({ source: 'github' }))).toEqual({ admitted: false, reason: 'unknown-source' })
  })

  it('refuses a person the policy does not name and a message that did not address the agent', () => {
    expect(admit(POLICY, trigger({ actor: 'ou_2' as ActorId })))
      .toEqual({ admitted: false, reason: 'actor-not-allowed' })
    expect(admit(POLICY, trigger({ addressed: undefined }))).toEqual({ admitted: false, reason: 'not-addressed' })
  })

  it('admits nobody when a source has no allowed actors', () => {
    const closed: Policy = { version: 'p2', sources: [{ source: 'feishu', allowedActors: [] }] }
    expect(admit(closed, trigger())).toEqual({ admitted: false, reason: 'actor-not-allowed' })
  })
})
