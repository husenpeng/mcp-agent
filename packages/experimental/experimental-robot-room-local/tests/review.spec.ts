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
        { id: 'reviewer', robot: 'review-bot', revision: 1, name: '审核员', role: 'reviewer' },
      ],
    }),
    routing: { humanDefault: 'coordinator', coordinator: 'coord' as RoomMemberId, maxFanout: 1, floor: 1 },
  }
}

interface Script {
  readonly answer: string
  readonly review: readonly string[]
  readonly acceptance?: readonly string[]
}

async function contextOf(pool: MemoryMediaPool, script: Script, delivered: string[]): Promise<Context> {
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
  const reviews = [...script.review]
  const acceptances = [...(script.acceptance ?? [])]
  const agent = {
    id: 'agent-1',
    session: { id: 'agent-1' },
    followup: (message: { content: readonly { type: string; text?: string }[] }) => {
      const text = message.content.map(block => block.text ?? '').join('')
      delivered.push(text)
      const reviewing = text.includes('## Self-review')
      const accepting = text.includes('## Acceptance')
      const answer = accepting
        ? (acceptances.shift() ?? 'REVIEW: pass')
        : reviewing ? (reviews.shift() ?? 'REVIEW: pass') : script.answer
      ctx.emit('session/event', agent.session as never, {
        type: 'assistant/message',
        data: { message: { content: [{ type: 'text', text: answer }] } },
      } as never)
    },
    whenIdle: async () => {},
    cancel: () => {},
  }
  ctx.provide('agents', {
    get: () => undefined,
    resume: async () => { throw new Error('no persisted session') },
    create: async () => ({ agent, dispose: async () => {} }),
    list: () => [],
    turnBoundaryOf: () => ({ openTurnStartSeq: null, lastStepStartSeq: null, lastStepBoundary: null, lastTurn: 0 }),
  } as never)
  ctx.provide('agentDefaultModel', { currentSelection: () => ({ provider: 'test', model: 'test' }) } as never)
  await ctx.plugin(LocalRooms)
  return ctx
}

async function systemLines(ctx: Context, room: string): Promise<string[]> {
  const messages = await ctx.rooms.messages(room as never)
  return messages.filter(message => message.author.kind === 'system').map(message => message.text)
}

describe('member self-review', () => {
  it('returns a rejected acceptance to the worker and passes on the next round', async () => {
    const delivered: string[] = []
    const ctx = await contextOf(new MemoryMediaPool(), {
      answer: 'draft',
      review: ['REVIEW: pass', 'REVIEW: pass'],
      acceptance: ['REVIEW: fail\n- the draft has no price', 'REVIEW: pass'],
    }, delivered)
    try {
      const room = await ctx.rooms.publish(undefined, spec())
      await ctx.rooms.post({ room: room.id, text: '请出周报', author: { id: 'alice', name: 'Alice' } })
      await vi.waitFor(async () => { expect(await systemLines(ctx, room.id)).toContain('acceptance passed for request #1') })
      const work = await ctx.rooms.work(room.id)
      expect(work).toHaveLength(1)
      expect(work[0]).toMatchObject({ room: room.id, member: 'coord', thread: `${room.id}#1`, state: 'ready', rounds: 2 })
      expect(work[0]?.review?.rounds).toBe(2)
      const lines = await systemLines(ctx, room.id)
      expect(lines).toContain('acceptance failed; rework round 2')
      expect(delivered.some(text => text.includes('the draft has no price'))).toBe(true)
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('waits for a reviewer member when the room has none', async () => {
    const delivered: string[] = []
    const ctx = await contextOf(new MemoryMediaPool(), { answer: 'done', review: ['REVIEW: pass'] }, delivered)
    try {
      const base = spec()
      const room = await ctx.rooms.publish(undefined, {
        ...base,
        members: base.members.map(member => member.role === 'reviewer'
          ? { ...member, role: 'worker' as const }
          : member),
      })
      await ctx.rooms.post({ room: room.id, text: '请出周报', author: { id: 'alice', name: 'Alice' } })
      await vi.waitFor(async () => {
        expect(await systemLines(ctx, room.id)).toContain('the request is ready; acceptance waits for a reviewer member')
      })
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('stops at the configured round budget', async () => {
    const delivered: string[] = []
    const ctx = await contextOf(new MemoryMediaPool(), {
      answer: 'draft',
      review: ['REVIEW: fail\n- no source', 'REVIEW: pass'],
    }, delivered)
    try {
      const room = await ctx.rooms.publish(undefined, {
        ...spec(),
        review: { selfReview: true, acceptance: true, maxRounds: 1 },
      })
      await ctx.rooms.post({ room: room.id, text: '请出周报', author: { id: 'alice', name: 'Alice' } })
      await vi.waitFor(async () => {
        expect(await systemLines(ctx, room.id))
          .toContain('self-review did not pass after 1 rounds; the task waits for the operator')
      })
      expect(delivered.filter(text => text.includes('## Self-review'))).toHaveLength(1)
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('accepts the result without a review turn when the room disables self-review', async () => {
    const delivered: string[] = []
    const ctx = await contextOf(new MemoryMediaPool(), { answer: 'done', review: [] }, delivered)
    try {
      const room = await ctx.rooms.publish(undefined, {
        ...spec(),
        review: { selfReview: false, acceptance: true, maxRounds: 3 },
      })
      await ctx.rooms.post({ room: room.id, text: '请出周报', author: { id: 'alice', name: 'Alice' } })
      await vi.waitFor(async () => {
        expect(await systemLines(ctx, room.id)).toContain('result accepted without self-review')
      })
      expect(delivered.filter(text => !text.includes('## Acceptance'))).toHaveLength(1)
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('passes a cleared result and records the pass', async () => {
    const delivered: string[] = []
    const ctx = await contextOf(new MemoryMediaPool(), { answer: 'the answer', review: ['REVIEW: pass'] }, delivered)
    try {
      const room = await ctx.rooms.publish(undefined, spec())
      await ctx.rooms.post({ room: room.id, text: '请出周报', author: { id: 'alice', name: 'Alice' } })
      await vi.waitFor(() => { expect(delivered.filter(text => !text.includes('## Acceptance'))).toHaveLength(2) })
      await vi.waitFor(async () => { expect(await systemLines(ctx, room.id)).toContain('self-review passed in round 1') })
      await vi.waitFor(async () => { expect(await systemLines(ctx, room.id)).toContain('acceptance passed for request #1') })
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('returns a failing review to the same member with its findings', async () => {
    const delivered: string[] = []
    const ctx = await contextOf(new MemoryMediaPool(), {
      answer: 'draft',
      review: ['REVIEW: fail\n- the pricing figure has no source', 'REVIEW: pass'],
    }, delivered)
    try {
      const room = await ctx.rooms.publish(undefined, spec())
      await ctx.rooms.post({ room: room.id, text: '请出周报', author: { id: 'alice', name: 'Alice' } })
      await vi.waitFor(async () => { expect(await systemLines(ctx, room.id)).toContain('self-review passed in round 2') })
      const rework = delivered.filter(text => text.includes('did not pass'))
      expect(rework).toHaveLength(1)
      expect(rework[0]).toContain('the pricing figure has no source')
      expect(await systemLines(ctx, room.id)).toContain('self-review failed; rework round 2')
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('waits for the operator after the round budget', async () => {
    const delivered: string[] = []
    const ctx = await contextOf(new MemoryMediaPool(), {
      answer: 'draft',
      review: ['REVIEW: fail\n- still missing sources', 'REVIEW: fail\n- still missing sources', 'REVIEW: fail\n- still missing sources'],
    }, delivered)
    try {
      const room = await ctx.rooms.publish(undefined, spec())
      await ctx.rooms.post({ room: room.id, text: '请出周报', author: { id: 'alice', name: 'Alice' } })
      await vi.waitFor(async () => {
        expect(await systemLines(ctx, room.id))
          .toContain('self-review did not pass after 3 rounds; the task waits for the operator')
      })
      expect(delivered.filter(text => text.includes('## Self-review'))).toHaveLength(3)
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('treats a missing verdict as a failing, undelivered result', async () => {
    const delivered: string[] = []
    const ctx = await contextOf(new MemoryMediaPool(), {
      answer: 'draft',
      review: ['no verdict here', 'no verdict here', 'no verdict here'],
    }, delivered)
    try {
      const room = await ctx.rooms.publish(undefined, spec())
      await ctx.rooms.post({ room: room.id, text: '请出周报', author: { id: 'alice', name: 'Alice' } })
      await vi.waitFor(async () => {
        expect(await systemLines(ctx, room.id))
          .toContain('self-review did not pass after 3 rounds; the task waits for the operator')
      })
    } finally {
      await ctx.fiber.dispose()
    }
  })
})
