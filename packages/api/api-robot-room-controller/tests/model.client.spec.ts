import { describe, expect, it } from 'vitest'
import { RoomRunsModel } from '../src/client/model.ts'
import type { RoomSpec } from '@tomato/experimental-robot-room'
import type { Room, RoomId } from '../src/types.ts'

const roomSpec = {
  name: 'room', charter: 'c', members: [],
  routing: { humanDefault: 'mentioned', maxFanout: 1, floor: 1 },
  guard: {
    maxDepth: 4, episodeTurns: 12, episodeMessages: 40, episodeTokens: 250_000, wallClockMs: 1_200_000,
    memberTurnTimeoutMs: 120_000, memberTurnsPerMinute: 6, memberBurst: 3, maxPendingPerMember: 3,
    maxDuplicates: 2, pingPongLimit: 4, noProgressWindow: 3, noProgressSimilarity: 0.85,
  },
  budget: { dailyTokens: 3_000_000, softLimitRatio: 0.8 },
  context: { window: 20, messageChars: 1500, summaryChars: 1200, triggerChars: 6000 },
} satisfies RoomSpec
const room = {
  id: 'room-1' as RoomId, spec: roomSpec, revision: 1, state: 'active', createdAt: 1, updatedAt: 1,
} satisfies Room

describe('RoomRunsModel', () => {
  it('starts empty and replaces the whole snapshot', () => {
    const model = new RoomRunsModel()
    expect(model.getSnapshot().rooms).toEqual([])
    let changes = 0
    const off = model.subscribe(() => { changes += 1 })
    model.replaced({ rooms: [room] })
    expect(model.getSnapshot().rooms).toEqual([room])
    expect(changes).toBe(1)
    off()
    model.replaced({ rooms: [] })
    expect(changes).toBe(1)
  })
})
