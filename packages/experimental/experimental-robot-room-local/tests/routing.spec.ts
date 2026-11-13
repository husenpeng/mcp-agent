import { Context } from '@tomato/cordis'
import { emptyRoomSpec } from '@tomato/experimental-robot-room'
import type { RoomMemberId, RoomSpec } from '@tomato/experimental-robot-room'
import SessionStore from '@tomato/session'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import { describe, expect, it, vi } from 'vitest'
import { MemoryMediaPool, MemoryStorageBackend } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'
import LocalRooms from '../src/index.ts'

function spec(): RoomSpec {
  return {
    ...emptyRoomSpec({
      name: 'room', charter: 'charter',
      members: [
        { id: 'coord', robot: 'coord-bot', revision: 1, name: '协调员', role: 'coordinator' },
        { id: 'research', robot: 'research-bot', revision: 1, name: '研究员', role: 'worker' },
      ],
    }),
    routing: { humanDefault: 'coordinator', coordinator: 'coord' as RoomMemberId, maxFanout: 1, floor: 1 },
  }
}

async function contextOf(pool: MemoryMediaPool, delivered: string[], hang = false, withLlm = false): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  await ctx.plugin(Storage)
  const backend = new MemoryStorageBackend(pool)
  ctx.effect(() => ctx.storage.backend.register('fixture', backend))
  const facility = new DomainFacility(ctx, { backend: 'fixture' })
  ctx.effect(() => {
    const unmount = ctx.storage.mount('domain', facility)
    ctx.provide('storageDomain', facility)
    return async () => {
      await facility.closeAll()
      unmount()
    }
  })
  const agent = {
    id: 'agent-1',
    session: { id: 'agent-1' },
    followup: (message: { content: readonly { type: string; text?: string }[] }) => {
      delivered.push(message.content.map(block => block.text ?? '').join(''))
    },
    whenIdle: hang ? () => new Promise<void>(() => {}) : async () => {},
    cancel: () => {},
  }
  ctx.provide('agents', {
    get: () => hang ? agent : undefined,
    resume: async () => { throw new Error('no persisted session') },
    create: async () => ({ agent, dispose: async () => {} }),
    list: () => [],
    turnBoundaryOf: () => ({ openTurnStartSeq: null, lastStepStartSeq: null, lastStepBoundary: null, lastTurn: 0 }),
  } as never)
  ctx.provide('agentDefaultModel', { currentSelection: () => ({ provider: 'test', model: 'test' }) } as never)
  if (withLlm) {
    const llm = {
      prepareCall: async () => ({
        config: { provider: 'test', model: 'test' },
        stream: async function* () {
          yield { type: 'block-end', index: 0, block: { type: 'text', text: 'MODEL SUMMARY' } }
        },
      }),
    }
    ctx.provide('llm', llm as never)
  }
  await ctx.plugin(LocalRooms)
  return ctx
}

describe('room routing', () => {
  it('wakes the coordinator, delivers a bounded input, and records the turn', async () => {
    const delivered: string[] = []
    const ctx = await contextOf(new MemoryMediaPool(), delivered)
    try {
      const room = await ctx.rooms.publish(undefined, spec())
      const message = await ctx.rooms.post({ room: room.id, text: '请出本周周报', author: { id: 'alice', name: 'Alice' } })
      expect(message.seq).toBe(1)
      await vi.waitFor(() => { expect(delivered).toHaveLength(1) })
      expect(delivered[0]).toContain('请出本周周报')
      expect(delivered[0]).toContain('Why you were woken')
      const messages = await ctx.rooms.messages(room.id)
      const activities = messages.filter(item => item.kind === 'activity' && item.author.kind === 'member' && item.author.id === 'coord')
      expect(activities.length).toBeGreaterThan(0)
      expect(activities.every(item => item.sessionRef?.sessionId === 'agent-1')).toBe(true)
      expect(activities[0]?.sessionRef?.turn).toBe(1)
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('uses the model summary for older messages and falls back on failure', async () => {
    const delivered: string[] = []
    const ctx = await contextOf(new MemoryMediaPool(), delivered, false, true)
    try {
      const base = spec()
      const room = await ctx.rooms.publish(undefined, {
        ...base,
        context: { ...base.context, window: 1 },
      })
      for (const text of ['第一条', '第二条', '第三条']) {
        await ctx.rooms.post({ room: room.id, text, author: { id: 'alice', name: 'Alice' } })
      }
      await vi.waitFor(() => { expect(delivered.length).toBeGreaterThanOrEqual(2) })
      expect(delivered.at(-1)).toContain('MODEL SUMMARY')
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('trips on a member turn that never settles', async () => {
    const delivered: string[] = []
    const ctx = await contextOf(new MemoryMediaPool(), delivered, true)
    try {
      const notices: { room: string; kind: string; text: string }[] = []
      ctx.on('room/notice', (notice) => { notices.push(notice) })
      const room = await ctx.rooms.publish(undefined, {
        ...spec(),
        guard: { ...spec().guard, memberTurnTimeoutMs: 1000 },
      })
      await ctx.rooms.post({ room: room.id, text: '会卡住吗', author: { id: 'alice', name: 'Alice' } })
      await vi.waitFor(async () => {
        expect(await ctx.rooms.room(room.id)).toMatchObject({ state: 'tripped' })
      }, { timeout: 4000 })
      const messages = await ctx.rooms.messages(room.id)
      expect(messages.some(message => message.kind === 'guard' && message.text.includes('did not settle'))).toBe(true)
      expect(notices).toContainEqual(expect.objectContaining({ room: room.id, kind: 'tripped' }))
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('starts a new episode after the operator ends the current one', async () => {
    const delivered: string[] = []
    const ctx = await contextOf(new MemoryMediaPool(), delivered)
    try {
      const room = await ctx.rooms.publish(undefined, spec())
      const first = await ctx.rooms.post({ room: room.id, text: '第一回合', author: { id: 'alice', name: 'Alice' } })
      await ctx.rooms.endEpisode(room.id)
      const second = await ctx.rooms.post({ room: room.id, text: '第二回合', author: { id: 'alice', name: 'Alice' } })
      expect(second.episode).not.toBe(first.episode)
      expect((await ctx.rooms.room(room.id))?.state).toBe('active')
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('queues messages while paused and delivers them after resume', async () => {
    const delivered: string[] = []
    const ctx = await contextOf(new MemoryMediaPool(), delivered)
    try {
      const room = await ctx.rooms.publish(undefined, spec())
      await ctx.rooms.post({ room: room.id, text: '第一条', author: { id: 'alice', name: 'Alice' } })
      await vi.waitFor(() => { expect(delivered).toHaveLength(1) })
      await ctx.rooms.pause(room.id, true)
      await ctx.rooms.post({ room: room.id, text: '暂停期间的消息', author: { id: 'alice', name: 'Alice' } })
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(delivered).toHaveLength(1)
      await ctx.rooms.resume(room.id)
      await vi.waitFor(() => { expect(delivered).toHaveLength(2) })
      expect(delivered[1]).toContain('暂停期间的消息')
    } finally {
      await ctx.fiber.dispose()
    }
  })
})
