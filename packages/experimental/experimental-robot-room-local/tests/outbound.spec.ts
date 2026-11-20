import { Context } from '@tomato/cordis'
import { emptyRoomSpec } from '@tomato/experimental-robot-room'
import type { RoomMemberId, RoomSpec } from '@tomato/experimental-robot-room'
import SessionStore from '@tomato/session'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import type { ToolDefinition } from '@tomato/tools'
import { describe, expect, it, vi } from 'vitest'
import { MemoryMediaPool, MemoryStorageBackend } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'
import LocalRooms from '../src/index.ts'

function spec(): RoomSpec {
  return {
    ...emptyRoomSpec({
      name: 'room', charter: 'charter',
      members: [
        { id: 'coord', robot: 'coord-bot', revision: 1, name: '协调员', role: 'coordinator' },
        { id: 'reviewer', robot: 'review-bot', revision: 1, name: '审核员', role: 'reviewer' },
      ],
    }),
    routing: { humanDefault: 'coordinator', coordinator: 'coord' as RoomMemberId, maxFanout: 1, floor: 1 },
  }
}

async function contextOf(pool: MemoryMediaPool, review: readonly string[]): Promise<{
  readonly ctx: Context
  readonly tools: readonly ToolDefinition[]
}> {
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
  const tools: ToolDefinition[] = []
  const toolService = {
    get: () => undefined,
    restrict: () => {},
    register: (definition: ToolDefinition) => { tools.push(definition) },
  }
  const reviews = [...review]
  let asked = false
  let pending: Promise<void> = Promise.resolve()
  const agent = {
    id: 'agent-1',
    session: { id: 'agent-1' },
    followup: (message: { content: readonly { type: string; text?: string }[] }) => {
      const text = message.content.map(block => block.text ?? '').join('')
      if (text.includes('## Acceptance')) {
        ctx.emit('session/event', agent.session as never, {
          type: 'assistant/message',
          data: { message: { content: [{ type: 'text', text: 'REVIEW: pass' }] } },
        } as never)
        return
      }
      if (text.includes('## Self-review')) {
        const answer = reviews.shift() ?? 'REVIEW: pass'
        ctx.emit('session/event', agent.session as never, {
          type: 'assistant/message',
          data: { message: { content: [{ type: 'text', text: answer }] } },
        } as never)
        return
      }
      ctx.emit('session/event', agent.session as never, {
        type: 'assistant/message',
        data: { message: { content: [{ type: 'text', text: 'the answer' }] } },
      } as never)
      if (asked) return
      asked = true
      const ask = tools.find(definition => definition.name === 'room_ask')
      pending = ask === undefined
        ? Promise.resolve()
        : ask.execute({ to: ['reviewer'], intent: 'request', task: 'check the draft' }, {} as never)
          .then(() => {})
    },
    whenIdle: async () => { await pending },
    cancel: () => {},
  }
  ctx.provide('agents', {
    get: () => undefined,
    resume: async () => { throw new Error('no persisted session') },
    create: async (options: { setup?: (context: unknown, agent: unknown) => void }) => {
      options.setup?.({
        get: (name: string) => name === 'tools' ? toolService : undefined,
        systemPrompt: { section: () => {} },
      }, agent)
      return { agent, dispose: async () => {} }
    },
    list: () => [],
    turnBoundaryOf: () => ({ openTurnStartSeq: null, lastStepStartSeq: null, lastStepBoundary: null, lastTurn: 0 }),
  } as never)
  ctx.provide('agentDefaultModel', { currentSelection: () => ({ provider: 'test', model: 'test' }) } as never)
  await ctx.plugin(LocalRooms)
  return { ctx, tools }
}

describe('outbound A2A review gate', () => {
  it('delivers a held request once the self-review passes', async () => {
    const { ctx } = await contextOf(new MemoryMediaPool(), ['REVIEW: pass'])
    try {
      const room = await ctx.rooms.publish(undefined, spec())
      await ctx.rooms.post({ room: room.id, text: '请出周报', author: { id: 'alice', name: 'Alice' } })
      await vi.waitFor(async () => {
        const messages = await ctx.rooms.messages(room.id)
        expect(messages.some(message => message.kind === 'a2a' && message.a2a?.task === 'check the draft')).toBe(true)
      })
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('drops a held request when the self-review never passes', async () => {
    const { ctx } = await contextOf(new MemoryMediaPool(), ['REVIEW: fail\n- no source', 'REVIEW: fail\n- no source', 'REVIEW: fail\n- no source'])
    try {
      const room = await ctx.rooms.publish(undefined, spec())
      await ctx.rooms.post({ room: room.id, text: '请出周报', author: { id: 'alice', name: 'Alice' } })
      await vi.waitFor(async () => {
        const messages = await ctx.rooms.messages(room.id)
        expect(messages.some(message => message.kind === 'a2a')).toBe(false)
        expect(messages.some(message => message.text === '1 message(s) were not delivered because self-review did not pass'))
          .toBe(true)
      })
    } finally {
      await ctx.fiber.dispose()
    }
  })
})
