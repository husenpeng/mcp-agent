import { describe, expect, it } from 'vitest'
import {
  emptyRoomSpec, requireRoomSpec, validateRoomSpec,
} from '../src/index.ts'
import type { RoomSpec } from '../src/index.ts'

/** A valid two-member room. */
function room(): RoomSpec {
  return emptyRoomSpec({
    name: '竞品周报',
    charter: '每周产出竞品投放周报。',
    members: [
      { id: 'coord', robot: 'coordinator-bot', revision: 1, name: '协调员', role: 'coordinator' },
      { id: 'research', robot: 'research-bot', revision: 3, name: '研究员', role: 'worker' },
    ],
  })
}

describe('room specification', () => {
  it('builds a publishable room with a coordinator and balanced limits', () => {
    const spec = room()
    expect(validateRoomSpec(spec)).toEqual([])
    expect(spec.routing.coordinator).toBe('coord')
    expect(spec.members[1]?.wake).toEqual({ kind: 'mention' })
    expect(spec.members[0]?.wake).toEqual({ kind: 'all-human' })
    expect(spec.guard.episodeTokens).toBe(250_000)
    expect(() => { requireRoomSpec(spec) }).not.toThrow()
  })

  it('reports every field problem at once', () => {
    const spec = room()
    const broken: RoomSpec = {
      ...spec,
      name: ' ',
      members: spec.members.map(member => ({ ...member, id: 'Bad Id' as RoomSpec['members'][number]['id'] })),
      routing: { ...spec.routing, maxFanout: 9, floor: 9 },
      guard: { ...spec.guard, maxDepth: 0, episodeTokens: 1 },
      context: { ...spec.context, window: 0 },
    }
    const issues = validateRoomSpec(broken)
    expect(issues.map(issue => issue.path)).toEqual(expect.arrayContaining([
      'name', 'members.0.id', 'members.1.id', 'routing.maxFanout', 'routing.floor', 'guard.maxDepth', 'guard.episodeTokens', 'context.window',
    ]))
  })

  it('rejects a room with fewer than two members and a missing coordinator', () => {
    const spec = room()
    const one = { ...spec, members: [spec.members[0]!] }
    expect(validateRoomSpec(one).some(issue => issue.path === 'members')).toBe(true)
    const { coordinator: _coordinator, ...routing } = spec.routing
    const noCoordinator = { ...spec, routing }
    expect(validateRoomSpec(noCoordinator).some(issue => issue.path === 'routing.coordinator')).toBe(true)
  })

  it('applies the conservative and permissive presets', () => {
    const conservative = emptyRoomSpec({
      name: 'a',
      charter: 'b',
      members: [
        { id: 'a', robot: 'bot-a', revision: 1, name: 'A', role: 'coordinator' },
        { id: 'b', robot: 'bot-b', revision: 1, name: 'B', role: 'worker' },
      ],
      preset: 'conservative',
    })
    expect(conservative.guard.maxDepth).toBe(2)
    expect(conservative.budget.dailyTokens).toBe(1_000_000)
  })
})
