import { describe, expect, it } from 'vitest'
import {
  RoomGuard, emptyRoomSpec, routeHuman, similarity, wakeMatches,
} from '../src/index.ts'
import type { A2aCandidate, AdmissionBudgets, RoomMemberId, RoomSpec } from '../src/index.ts'

/** A valid room with three members. */
function room(): RoomSpec {
  return emptyRoomSpec({
    name: 'room',
    charter: 'charter',
    members: [
      { id: 'coord', robot: 'coord-bot', revision: 1, name: '协调员', role: 'coordinator' },
      { id: 'research', robot: 'research-bot', revision: 1, name: '研究员', role: 'worker' },
      { id: 'writer', robot: 'writer-bot', revision: 1, name: '写手', role: 'worker' },
    ],
  })
}

const budgets: AdmissionBudgets = {
  episodeRemaining: 200_000,
  senderRemaining: 100_000,
  memberRemaining: new Map([
    ['research' as RoomMemberId, 50_000],
    ['writer' as RoomMemberId, 50_000],
    ['coord' as RoomMemberId, 50_000],
  ]),
}

function candidate(overrides: Partial<A2aCandidate> = {}): A2aCandidate {
  return {
    from: 'coord' as RoomMemberId,
    to: ['research'] as RoomMemberId[],
    intent: 'request',
    task: '拉取投放数据',
    context: '近 7 天',
    depth: 1,
    grantTokens: 1000,
    ...overrides,
  }
}

describe('room admission', () => {
  it('admits the first request and refuses the repeated signature', () => {
    const spec = { ...room(), guard: { ...room().guard, maxDuplicates: 1 } }
    const guard = new RoomGuard(spec, () => 0)
    guard.beginEpisode(0)
    expect(guard.admit(candidate(), budgets)).toEqual({ ok: true })
    expect(guard.admit(candidate(), budgets)).toMatchObject({ ok: false, refusal: 'duplicate' })
    expect(guard.snapshot().messages).toBe(1)
  })

  it('refuses self, unknown peers, ACL, and unaccepted intents before changing counters', () => {
    const spec = room()
    const guard = new RoomGuard(spec, () => 0)
    guard.beginEpisode(0)
    expect(guard.admit(candidate({ to: ['coord'] as RoomMemberId[] }), budgets)).toMatchObject({ refusal: 'self' })
    expect(guard.admit(candidate({ to: ['ghost'] as RoomMemberId[] }), budgets)).toMatchObject({ refusal: 'unknown-peer' })
    const narrow: RoomSpec = { ...spec, members: spec.members.map(member => member.id === 'coord' ? { ...member, a2a: { ...member.a2a, canAddress: ['writer'] as RoomMemberId[] } } : member) }
    expect(new RoomGuard(narrow, () => 0).admit(candidate(), budgets)).toMatchObject({ refusal: 'acl' })
    const noDelegate: RoomSpec = { ...spec, members: spec.members.map(member => member.id === 'research' ? { ...member, a2a: { ...member.a2a, accepts: ['reply'] as const } } : member) }
    expect(new RoomGuard(noDelegate, () => 0).admit(candidate(), budgets)).toMatchObject({ refusal: 'intent' })
    expect(guard.snapshot().messages).toBe(0)
  })

  it('refuses depth over the limit and fanout over the limit', () => {
    const guard = new RoomGuard(room(), () => 0)
    guard.beginEpisode(0)
    expect(guard.admit(candidate({ depth: 5 }), budgets)).toMatchObject({ refusal: 'depth' })
    expect(guard.admit(candidate({ to: ['research', 'writer'] as RoomMemberId[] }), budgets)).toMatchObject({ ok: true })
    const fanout = new RoomGuard({ ...room(), routing: { ...room().routing, maxFanout: 1 } }, () => 0)
    expect(fanout.admit(candidate({ to: ['research', 'writer'] as RoomMemberId[] }), budgets)).toMatchObject({ refusal: 'fanout' })
  })

  it('refuses when the episode message, turn, token, or time limit is exhausted', () => {
    const spec = room()
    const guard = new RoomGuard(spec, () => 0)
    guard.beginEpisode(0)
    guard.recordMessage(spec.guard.episodeMessages)
    expect(guard.admit(candidate(), budgets)).toMatchObject({ refusal: 'episode-messages' })

    const turnGuard = new RoomGuard(spec, () => 0)
    turnGuard.beginEpisode(0)
    for (let index = 0; index < spec.guard.episodeTurns; index += 1) {
      turnGuard.recordTurn({ member: 'research' as RoomMemberId, tokens: 1, output: `turn ${index}` })
    }
    expect(turnGuard.admit(candidate(), budgets)).toMatchObject({ refusal: 'episode-turns' })

    const tokenGuard = new RoomGuard(spec, () => 0)
    tokenGuard.beginEpisode(0)
    // Exactly the ceiling does not trip `recordTurn`, so admission reports the exhausted episode.
    tokenGuard.recordTurn({ member: 'research' as RoomMemberId, tokens: spec.guard.episodeTokens, output: 'x'.repeat(100) })
    expect(tokenGuard.admit(candidate(), budgets)).toMatchObject({ refusal: 'episode-tokens' })

    let now = 0
    const timeGuard = new RoomGuard(spec, () => now)
    timeGuard.beginEpisode(0)
    now = spec.guard.wallClockMs + 1
    expect(timeGuard.admit(candidate(), budgets)).toMatchObject({ refusal: 'episode-time' })
  })

  it('refuses over-rate sends and over-pending receivers', () => {
    const spec = room()
    const guard = new RoomGuard(spec, () => 0)
    guard.beginEpisode(0)
    for (let index = 0; index < spec.guard.memberBurst; index += 1) {
      expect(guard.admit(candidate({ signature: `s${index}` }), budgets)).toEqual({ ok: true })
    }
    expect(guard.admit(candidate({ signature: 'over' }), budgets)).toMatchObject({ refusal: 'rate' })

    const pendingSpec: RoomSpec = { ...spec, guard: { ...spec.guard, maxPendingPerMember: 1 } }
    const pending = new RoomGuard(pendingSpec, () => 0)
    pending.beginEpisode(0)
    expect(pending.admit(candidate({ signature: 'one' }), budgets)).toEqual({ ok: true })
    expect(pending.admit(candidate({ signature: 'two' }), budgets)).toMatchObject({ refusal: 'pending-limit' })
  })

  it('refuses a ping-pong pair and pauses it for ten minutes', () => {
    const spec: RoomSpec = { ...room(), guard: { ...room().guard, pingPongLimit: 2, memberBurst: 10 } }
    const guard = new RoomGuard(spec, () => 0)
    guard.beginEpisode(0)
    expect(guard.admit(candidate({ signature: 'a1' }), budgets)).toEqual({ ok: true })
    expect(guard.admit(candidate({ from: 'research' as RoomMemberId, to: ['coord'] as RoomMemberId[], signature: 'a2' }), budgets)).toEqual({ ok: true })
    expect(guard.admit(candidate({ signature: 'a3' }), budgets)).toMatchObject({ refusal: 'ping-pong' })
    expect(guard.admit(candidate({ signature: 'a4' }), budgets)).toMatchObject({ refusal: 'ping-pong' })
  })

  it('refuses a grant larger than the sender may delegate, and accepts attenuation down the chain', () => {
    const guard = new RoomGuard(room(), () => 0)
    guard.beginEpisode(0)
    expect(guard.admit(candidate({ grantTokens: 60_000 }), budgets)).toMatchObject({ refusal: 'grant' })
    expect(guard.admit(candidate({ grantTokens: 40_000 }), budgets)).toEqual({ ok: true })
  })

  it('trips on no-progress output and recovers through half-open', () => {
    const guard = new RoomGuard(room(), () => 0)
    guard.beginEpisode(0)
    const text = 'The same long paragraph appears again with the same words and no new evidence.'
    guard.recordTurn({ member: 'research' as RoomMemberId, tokens: 10, output: text })
    guard.recordTurn({ member: 'writer' as RoomMemberId, tokens: 10, output: text })
    const trip = guard.recordTurn({ member: 'coord' as RoomMemberId, tokens: 10, output: text })
    expect(trip).toMatchObject({ reason: 'no-progress' })
    expect(guard.snapshot().breaker).toBe('open')
    expect(guard.admit(candidate(), budgets)).toMatchObject({ refusal: 'breaker-open' })
    guard.resume()
    expect(guard.snapshot().breaker).toBe('half-open')
    guard.settle()
    expect(guard.snapshot().breaker).toBe('closed')
  })

  it('trips on the wall clock before the next wake', () => {
    let now = 0
    const spec = room()
    const guard = new RoomGuard(spec, () => now)
    guard.beginEpisode(0)
    now = spec.guard.wallClockMs + 1
    expect(guard.check()).toMatchObject({ reason: 'episode-time' })
  })

  it('exports and restores counters, breaker, and pending requests', () => {
    const spec = room()
    const guard = new RoomGuard(spec, () => 1000)
    guard.beginEpisode(0)
    expect(guard.admit(candidate({ signature: 'restore-one' }), budgets)).toEqual({ ok: true })
    guard.recordTurn({ member: 'research' as RoomMemberId, tokens: 42, output: 'a result' })
    guard.trip('episode-tokens', 'over budget')
    const state = guard.export()
    const restored = new RoomGuard(spec, () => 1000)
    restored.restore(state)
    expect(restored.snapshot()).toMatchObject({ breaker: 'open', reason: 'episode-tokens', turns: 1, messages: 1, tokens: 42 })
    expect(restored.pendingOf('research' as RoomMemberId)).toBe(1)
    expect(restored.admit(candidate({ signature: 'restore-two' }), budgets)).toMatchObject({ refusal: 'breaker-open' })
    restored.resume()
    expect(restored.snapshot().breaker).toBe('half-open')
  })

  it('relaxes only the current episode', () => {
    const spec = room()
    const guard = new RoomGuard(spec, () => 0)
    guard.beginEpisode(0)
    guard.relaxOnce()
    for (let index = 0; index < spec.guard.episodeTurns; index += 1) {
      guard.recordTurn({ member: 'research' as RoomMemberId, tokens: 1, output: `turn ${index}` })
    }
    expect(guard.recordTurn({ member: 'research' as RoomMemberId, tokens: 1, output: 'one more' })).toBeUndefined()
    guard.beginEpisode(1)
    expect(guard.recordTurn({ member: 'research' as RoomMemberId, tokens: 1, output: 'fresh' })).toBeUndefined()
  })
})

describe('human routing', () => {
  it('prefers explicit mentions and caps fanout', () => {
    const spec = room()
    expect(routeHuman(spec, { text: 'hello', mentions: ['writer'] as RoomMemberId[] }).targets).toEqual(['writer'])
    const capped: RoomSpec = { ...spec, routing: { ...spec.routing, maxFanout: 1 } }
    expect(routeHuman(capped, { text: 'hello', mentions: ['writer', 'research'] as RoomMemberId[] }).targets).toEqual(['writer'])
  })

  it('routes an unmentioned message to the coordinator', () => {
    expect(routeHuman(room(), { text: 'hello', mentions: [] }).targets).toEqual(['coord'])
  })

  it('matches keyword and all-human wake rules, never observers', () => {
    const spec = room()
    const keyword: RoomSpec = {
      ...spec,
      routing: { ...spec.routing, humanDefault: 'all-eligible', maxFanout: 3 },
      members: spec.members.map(member => member.id === 'research' ? { ...member, wake: { kind: 'keywords', keywords: ['投放'] } } : member),
    }
    expect(routeHuman(keyword, { text: '投放数据', mentions: [] }).targets).toEqual(['coord', 'research'])
    const observer: RoomSpec = { ...spec, members: spec.members.map(member => member.id === 'writer' ? { ...member, role: 'observer' } : member) }
    expect(wakeMatches(observer.members[2]!, 'hi', true)).toBe(false)
  })
})

describe('similarity', () => {
  it('scores identical text at one and unrelated text below the threshold', () => {
    expect(similarity('same words here', 'same words here')).toBe(1)
    expect(similarity('alpha beta', 'gamma delta')).toBeLessThan(0.2)
  })
})
