import { Context } from '@tomato/cordis'
import { RoomSpecValidationError } from '@tomato/experimental-robot-room'
import type { Room, RoomEpisodeId, RoomId, RoomMessage, RoomMessageId, RoomSpec } from '@tomato/experimental-robot-room'
import { describe, expect, it } from 'vitest'
import RoomController from '../src/index.ts'

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
  id: 'room-1' as RoomId, spec: roomSpec, revision: 1,
  state: 'active', createdAt: 1, updatedAt: 1,
} satisfies Room
const message = {
  id: 'm1' as RoomMessageId, room: 'room-1' as RoomId, seq: 1, episode: 'ep-1' as RoomEpisodeId,
  author: { kind: 'human', id: 'alice', name: 'Alice' }, kind: 'chat', text: 'hi',
  mentions: [], depth: 0, at: 1,
} satisfies RoomMessage

function boot(options: { publishError?: unknown } = {}) {
  const ctx = new Context()
  const rooms = {
    list: async () => [room],
    room: async (id: RoomId) => id === room.id ? room : undefined,
    publish: async () => {
      if (options.publishError !== undefined) throw options.publishError
      return room
    },
    post: async () => message,
    messages: async () => [message],
    pause: async () => room,
    resume: async () => room,
    relaxOnce: async () => room,
    endEpisode: async () => room,
    approve: async () => room,
  }
  ctx.provide('rooms', rooms as never)
  const controller = new RoomController(ctx)
  return { ctx, controller }
}

describe('RoomController', () => {
  it('lists, reads, and posts through the room service', async () => {
    const { ctx, controller } = boot()
    try {
      expect(await controller.rooms()).toEqual([room])
      expect(await controller.room({ room: room.id })).toEqual(room)
      expect(await controller.messages({ room: room.id })).toEqual([message])
      expect(await controller.post({ room: room.id, text: 'hi' })).toEqual(message)
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('maps missing rooms and specification rejections to typed Remote errors', async () => {
    const { ctx, controller } = boot({
      publishError: new RoomSpecValidationError([{ path: 'name', message: 'name is blank' }]),
    })
    try {
      await expect(controller.room({ room: 'missing' as RoomId })).rejects.toMatchObject({ code: 'room/not-found' })
      await expect(controller.publish({ spec: { name: '' } as RoomSpec })).rejects.toMatchObject({
        code: 'room/spec-invalid',
        details: { issues: [{ path: 'name', message: 'name is blank' }] },
      })
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('streams a snapshot on open and after each room change until aborted', async () => {
    const { ctx, controller } = boot()
    const abort = new AbortController()
    try {
      const frames = controller.watch(abort.signal)[Symbol.asyncIterator]()
      expect(await frames.next()).toMatchObject({ done: false, value: { rooms: [room] } })
      const next = frames.next()
      ctx.emit('room/changed', room.id)
      expect(await next).toMatchObject({ done: false, value: { rooms: [room] } })
      abort.abort()
      expect(await frames.next()).toMatchObject({ done: true })
    } finally {
      await ctx.fiber.dispose()
    }
  })
})
