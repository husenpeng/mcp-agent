import { Context } from '@tomato/cordis'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import { describe, expect, it } from 'vitest'
import { MemoryMediaPool, MemoryStorageBackend } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'
import {
  createRoomWorkStore, openRoomTicket, parseSelfReview, reportForTurn, ROOM_WORK_SOURCE, roomThread, roomWorkDomain,
  workRecordOf,
} from '../src/work.ts'
import { selfReviewInstruction } from '../src/prompt.ts'
import { brandString } from '@tomato/branded'
import { assign, recordReview, report } from '@tomato/superagent'
import type { ActorId, AssignmentReport, Ticket, Trigger, TriggerId } from '@tomato/superagent'

async function createContext(pool: MemoryMediaPool): Promise<Context> {
  const ctx = new Context()
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
  return ctx
}

describe('room work thread', () => {
  it('qualifies one room message so tickets of one request group together', () => {
    expect(roomThread('room-a', 7)).toEqual({ source: 'room', id: 'room-a#7' })
  })
})

describe('self-review verdict', () => {
  it('reads a passing verdict without findings', () => {
    expect(parseSelfReview('Done.\n\nREVIEW: pass')).toEqual({ passed: true, parsed: true, findings: [] })
  })

  it('reads a failing verdict and the findings under it', () => {
    const text = 'REVIEW: fail\n- the claim about pricing is unsupported\n* the next member lacks the file\nnot a finding'
    expect(parseSelfReview(text)).toEqual({
      passed: false,
      parsed: true,
      findings: ['the claim about pricing is unsupported', 'the next member lacks the file'],
    })
  })

  it('accepts a bold verdict line in any case', () => {
    expect(parseSelfReview('**review: PASS**')).toEqual({ passed: true, parsed: true, findings: [] })
  })

  it('treats a missing verdict as a failing, unparsed review', () => {
    expect(parseSelfReview('All good.')).toEqual({ passed: false, parsed: false, findings: [] })
  })

  it('stops at the finding budget and bounds each finding', () => {
    const bullets = Array.from({ length: 12 }, (_, index) => `- finding ${String(index)}`).join('\n')
    const long = parseSelfReview(`REVIEW: fail\n- ${'x'.repeat(500)}`)
    expect(long.findings[0]).toHaveLength(300)
    expect(parseSelfReview(`REVIEW: fail\n${bullets}`).findings).toHaveLength(10)
  })
})

describe('turn report', () => {
  const passing = { passed: true, parsed: true, findings: [] }

  it('reports a turn failure', () => {
    expect(reportForTurn({ text: 'partial', review: passing, failure: 'model stopped' }))
      .toEqual({ state: 'failed', summary: 'model stopped' })
  })

  it('drops an empty answer', () => {
    expect(reportForTurn({ text: '   ', review: passing })).toEqual({ state: 'dropped', summary: 'the member produced no answer' })
  })

  it('blocks a result whose self-review verdict is missing', () => {
    expect(reportForTurn({ text: 'answer', review: { passed: false, parsed: false, findings: [] } }))
      .toEqual({ state: 'blocked', summary: 'self-review verdict missing: the result was not delivered' })
  })

  it('blocks a failing self-review with its findings', () => {
    const review = { passed: false, parsed: true, findings: ['first', 'second'] }
    expect(reportForTurn({ text: 'answer', review })).toEqual({ state: 'blocked', summary: 'first; second' })
  })

  it('blocks a failing self-review that listed no finding', () => {
    expect(reportForTurn({ text: 'answer', review: { passed: false, parsed: true, findings: [] } }))
      .toEqual({ state: 'blocked', summary: 'self-review failed without findings' })
  })

  it('readies a cleared result and bounds the summary', () => {
    const report: AssignmentReport = reportForTurn({ text: 'y'.repeat(600), review: passing })
    expect(report.state).toBe('ready')
    expect(report.summary).toHaveLength(400)
  })
})

describe('room work records', () => {
  it('projects state, rounds, and the acceptance review', async () => {
    const ctx = await createContext(new MemoryMediaPool())
    const store = await createRoomWorkStore(ctx)
    const ticket = openRoomTicket({
      store,
      room: 'room-a',
      messageSeq: 4,
      subject: '整理定价',
      sender: { kind: 'human', id: 'owner' },
      supervisor: 'session-1',
      scope: 'change',
      policyVersion: 'room-1',
      now: new Date('2026-11-17T00:00:00.000Z'),
    })
    const seat = { room: 'room-a', member: 'coord', seq: 4, at: 5 }
    store.putSeat(ticket.id, seat)
    expect(workRecordOf(store.ticket(ticket.id)!, seat)).toMatchObject({
      ticket: ticket.id, room: 'room-a', thread: 'room-a#4', member: 'coord', state: 'running', rounds: 0, at: 5,
    })
    const assignment = assign(store, ticket.id, { session: 'session-1', directory: '/tmp' })
    report(store, ticket.id, assignment.id, { state: 'ready', summary: 'done' })
    recordReview(store, ticket.id, { findings: [{ summary: 'no source', severity: 'p0', file: '(room)' }], rounds: 1 })
    expect(workRecordOf(store.ticket(ticket.id)!, seat)).toMatchObject({
      state: 'ready', rounds: 1, review: { rounds: 1, findings: ['no source'] }, strength: 'explicit',
    })
    report(store, ticket.id, assignment.id, { state: 'blocked', summary: 'missing' })
    expect(workRecordOf(store.ticket(ticket.id)!, seat).state).toBe('blocked')
    await store.close()
    await ctx.fiber.dispose()
  })

  it('keeps seats across a reopen', async () => {
    const pool = new MemoryMediaPool()
    const first = await createContext(pool)
    const store = await createRoomWorkStore(first)
    const ticket = openRoomTicket({
      store, room: 'room-a', messageSeq: 1, subject: 's', sender: { kind: 'member', id: 'coord' },
      supervisor: 'session-1', scope: 'change', policyVersion: 'room-1', now: new Date('2026-11-17T00:00:00.000Z'),
    })
    store.putSeat(ticket.id, { room: 'room-a', member: 'coord', seq: 1, at: 2 })
    await store.flush()
    await store.close()
    await first.fiber.dispose()
    const second = await createContext(pool)
    const reopened = await createRoomWorkStore(second)
    expect(reopened.seat(ticket.id)).toEqual({ room: 'room-a', member: 'coord', seq: 1, at: 2 })
    await reopened.close()
    await second.fiber.dispose()
  })
})

describe('room work store', () => {
  it('persists one ticket across a reopen and refuses the trigger seam', async () => {
    const pool = new MemoryMediaPool()
    const ctx = await createContext(pool)
    const store = await createRoomWorkStore(ctx)
    const trigger: Trigger = {
      id: brandString<TriggerId>('trigger-1'),
      source: 'room',
      threads: [roomThread('room-a', 3)],
      actor: brandString<ActorId>('human:owner'),
      human: true,
      at: '2026-11-17T00:00:00.000Z',
      text: '整理竞品定价',
      meta: {},
    }
    const ticket = openRoomTicket({
      store,
      room: 'room-a',
      messageSeq: 3,
      subject: '整理竞品定价',
      sender: { kind: 'human', id: 'owner' },
      supervisor: 'session-supervisor',
      scope: 'change',
      policyVersion: 'room-1',
      now: new Date('2026-11-17T00:00:00.000Z'),
    })
    expect(ticket.mandate.strength).toBe('explicit')
    expect(ticket.mandate.matchedRules).toEqual(['room/human-request'])
    expect(ticket.mandate.sender).toBe('human:owner')
    expect(ticket.follows).toEqual([{ source: ROOM_WORK_SOURCE, id: 'room-a#3' }])
    expect(store.ticket(ticket.id)?.ticket.subject).toBe('整理竞品定价')
    expect(store.tickets()).toHaveLength(1)
    expect(() => store.trigger(trigger.id)).toThrow(/no trigger/u)
    expect(() => store.triggers()).toThrow(/no trigger/u)
    expect(() =>{  store.putTrigger(trigger) }).toThrow(/no trigger/u)
    await store.flush()
    await store.close()
    await ctx.fiber.dispose()

    const reopened = await createContext(pool)
    const next = await createRoomWorkStore(reopened)
    expect(next.tickets().map(entry => entry.ticket.id)).toEqual([ticket.id])
    expect(next.ticket(ticket.id)?.ticket.mandate.policyVersion).toBe('room-1')
    await next.close()
    await reopened.fiber.dispose()
  })

  it('declares the durable room work domain', () => {
    expect(roomWorkDomain.name).toBe('tomato_room_work')
    expect(roomWorkDomain.version).toBe(1)
  })
})

describe('room ticket', () => {
  const base = {
    room: 'room-a',
    messageSeq: 9,
    subject: '写周报',
    supervisor: 'session-supervisor',
    scope: 'change' as const,
    policyVersion: 'room-1',
    now: new Date('2026-11-17T00:00:00.000Z'),
  }

  it('records a peer request as a proposed mandate', async () => {
    const ctx = await createContext(new MemoryMediaPool())
    const store = await createRoomWorkStore(ctx)
    const ticket: Ticket = openRoomTicket({ ...base, store, sender: { kind: 'member', id: 'research' } })
    expect(ticket.mandate.strength).toBe('proposed')
    expect(ticket.mandate.matchedRules).toEqual(['room/peer-request'])
    expect(ticket.mandate.thread).toEqual({ source: ROOM_WORK_SOURCE, id: 'room-a#9' })
    expect(ticket.mandate.at).toBe('2026-11-17T00:00:00.000Z')
    await store.close()
    await ctx.fiber.dispose()
  })

  it('bounds a long subject', async () => {
    const ctx = await createContext(new MemoryMediaPool())
    const store = await createRoomWorkStore(ctx)
    const ticket = openRoomTicket({ ...base, subject: 'z'.repeat(900), store, sender: { kind: 'human', id: 'owner' } })
    expect(ticket.subject).toHaveLength(400)
    await store.close()
    await ctx.fiber.dispose()
  })
})

describe('self-review instruction', () => {
  it('names the verdict format and the consequence of failing', () => {
    const instruction = selfReviewInstruction()
    expect(instruction).toContain('REVIEW: pass')
    expect(instruction).toContain('returns the work to you')
  })
})
