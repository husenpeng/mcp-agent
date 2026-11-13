import { Context } from '@tomato/cordis'
import { emptyRoomSpec } from '@tomato/experimental-robot-room'
import type {
  RoomEpisodeId, RoomId, RoomMemberId, RoomMessage, RoomMessageId, RoomSpec,
} from '@tomato/experimental-robot-room'
import SessionStore from '@tomato/session'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import { describe, expect, it } from 'vitest'
import { MemoryMediaPool, MemoryStorageBackend } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'
import LocalRooms from '../src/index.ts'
import { memberSessionOf, withMemberSession } from '../src/storage.ts'

function spec(): RoomSpec {
  return {
    ...emptyRoomSpec({
      name: '竞品周报',
      charter: '每周产出竞品投放周报。',
      members: [
        { id: 'coord', robot: 'coord-bot', revision: 1, name: '协调员', role: 'coordinator' },
        { id: 'research', robot: 'research-bot', revision: 1, name: '研究员', role: 'worker' },
      ],
    }),
    routing: { humanDefault: 'mentioned', maxFanout: 1, floor: 1 },
  }
}

async function createContext(pool: MemoryMediaPool): Promise<Context> {
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
  await ctx.plugin(LocalRooms)
  return ctx
}

describe('room-local persistence', () => {
  it('publishes a room, records a human message, and reads it back after reopening', async () => {
    const pool = new MemoryMediaPool()
    let id: RoomId
    {
      const ctx = await createContext(pool)
      try {
        const room = await ctx.rooms.publish(undefined, spec())
        id = room.id
        expect(room.revision).toBe(1)
        expect(await ctx.rooms.list()).toHaveLength(1)
        const message = await ctx.rooms.post({ room: id, text: '请出本周周报', author: { id: 'alice', name: 'Alice' } })
        expect(message.seq).toBe(1)
        expect(message.kind).toBe('chat')
        expect(message.author).toEqual({ kind: 'human', id: 'alice', name: 'Alice' })
        expect(await ctx.rooms.messages(id)).toEqual([message])
      } finally {
        await ctx.fiber.dispose()
      }
    }
    const reopened = await createContext(pool)
    try {
      const rooms = await reopened.rooms.list()
      expect(rooms).toHaveLength(1)
      const messages = await reopened.rooms.messages(id!)
      expect(messages.map(message => message.text)).toEqual(['请出本周周报'])
      expect(messages[0]?.seq).toBe(1)
    } finally {
      await reopened.fiber.dispose()
    }
  })

  it('saves a superseding revision without changing the room identity', async () => {
    const ctx = await createContext(new MemoryMediaPool())
    try {
      const first = await ctx.rooms.publish(undefined, spec())
      const next = { ...spec(), name: '竞品周报 v2' }
      const saved = await ctx.rooms.publish(first.id, next)
      expect(saved.id).toBe(first.id)
      expect(saved.revision).toBe(2)
      expect(saved.spec.name).toBe('竞品周报 v2')
      expect((await ctx.rooms.room(first.id))?.revision).toBe(2)
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('refuses an invalid specification before allocating a room', async () => {
    const ctx = await createContext(new MemoryMediaPool())
    try {
      const invalid = { ...spec(), name: ' ' }
      await expect(ctx.rooms.publish(undefined, invalid)).rejects.toThrow('name')
      expect(await ctx.rooms.list()).toEqual([])
    } finally {
      await ctx.fiber.dispose()
    }
  })
})

describe('member Session links', () => {
  const room = 'room-1' as RoomId
  const member = 'research' as RoomMemberId
  const base: RoomMessage = {
    id: 'room-1-2' as RoomMessageId, room, seq: 2, episode: 'episode-1' as RoomEpisodeId,
    author: { kind: 'member', id: member }, kind: 'chat', text: '周报已生成', mentions: [], depth: 0, at: 1,
  }

  it('derives the stable member Session identity', () => {
    expect(memberSessionOf(room, member)).toBe('room-room-1-research')
  })

  it('adds the member Session to a member message stored before turn tracking', () => {
    expect(withMemberSession(room, base).sessionRef).toEqual({ sessionId: 'room-room-1-research', turn: 0 })
  })

  it('keeps an existing turn reference and leaves non-member messages unchanged', () => {
    const recorded = { ...base, sessionRef: { sessionId: 'room-room-1-research', turn: 3 } }
    expect(withMemberSession(room, recorded)).toBe(recorded)
    const human: RoomMessage = { ...base, author: { kind: 'human', id: 'alice', name: 'Alice' } }
    expect(withMemberSession(room, human)).toBe(human)
  })
})
