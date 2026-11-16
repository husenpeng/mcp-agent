/** Reading the decision a supervisor's turn wrote. */
import { describe, expect, it } from 'vitest'
import { brandString } from '@tomato/branded'
import { parseSupervision, releaseRequest, SUPERVISION_MARKER, supervisorBriefText } from '@tomato/superagent'
import type { ActorId, Trigger, TriggerId } from '@tomato/superagent'

const TRIGGER: Trigger = {
  id: brandString<TriggerId>('feishu:evt-1'),
  source: 'feishu',
  threads: [{ source: 'feishu', id: 'oc_1:om_root' }],
  actor: brandString<ActorId>('ou_1'),
  human: true,
  addressed: 'mention',
  at: '2026-11-14T00:00:00.000Z',
  text: '给达人详情页加 tier 字段',
  meta: { chatType: 'group' },
}

describe('supervision', () => {
  it('splits a request into the pieces it names, keeping their order and scope', () => {
    const text = [
      'Two repositories are involved.',
      `${SUPERVISION_MARKER} change the service field in services-monorepo-im`,
      `${SUPERVISION_MARKER} investigate whether the client needs a migration`,
    ].join('\n')
    expect(parseSupervision(text)).toEqual({
      accepted: true,
      plans: [
        { scope: 'change', subject: 'the service field in services-monorepo-im' },
        { scope: 'investigate', subject: 'whether the client needs a migration' },
      ],
    })
  })

  it('declines the whole request when any decision line declines it', () => {
    const text = [`${SUPERVISION_MARKER} change something`, `${SUPERVISION_MARKER} reject: out of scope for this team`].join('\n')
    expect(parseSupervision(text)).toEqual({
      accepted: false, reason: 'out of scope for this team', plans: [],
    })
  })

  it('declines a turn that named no work, and ignores a line with a scope but no subject', () => {
    expect(parseSupervision('I read the request.')).toEqual({
      accepted: false, reason: 'the supervisor named no work', plans: [],
    })
    expect(parseSupervision(`${SUPERVISION_MARKER} change`)).toEqual({
      accepted: false, reason: 'the supervisor named no work', plans: [],
    })
    expect(parseSupervision(`${SUPERVISION_MARKER} ponder something`)).toEqual({
      accepted: false, reason: 'the supervisor named no work', plans: [],
    })
  })
})

describe('supervisor brief', () => {
  it('names the request, its thread source, and the shape of the decision', () => {
    const text = supervisorBriefText(TRIGGER, 'p1')
    expect(text).toContain('Request from a person on feishu:')
    expect(text).toContain('给达人详情页加 tier 字段')
    expect(text).toContain('policy p1')
    expect(text).toContain(`${SUPERVISION_MARKER} <investigate|change|release> <what the work is>`)
    // An automated sender is named as one, and two threads of a source collapse.
    const automated = supervisorBriefText({
      ...TRIGGER,
      human: false,
      threads: [...TRIGGER.threads, { source: 'feishu', id: 'oc_1:om_other' }],
    }, 'p1')
    expect(automated).toContain('Request from an automation on feishu:')
  })
})

describe('release requests', () => {
  it('recognizes a request that asks for a release action, in either language', () => {
    for (const text of ['把这次改动直接发布到线上', 'deploy it now', 'release v1.2', 'roll back production', '帮我发版']) {
      expect(releaseRequest(text), text).toBe(true)
    }
    for (const text of ['给详情页加 tier 字段', 'add a column', 'fix the empty state']) {
      expect(releaseRequest(text), text).toBe(false)
    }
  })

  it('tells the supervisor that the release lane belongs to a person', () => {
    expect(supervisorBriefText(TRIGGER, 'p1')).toContain('A request to deploy, release, publish, roll back')
  })
})
