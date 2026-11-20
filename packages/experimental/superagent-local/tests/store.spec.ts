/** The durable store: what survives a restart, and what a repeated trigger does not replay. */
import { describe, expect, it, vi } from 'vitest'
import { Context } from '@tomato/cordis'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import { MemoryMediaPool, MemoryStorageBackend } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'
import { accept, intake, report, assign } from '@tomato/superagent'
import type { ActorId, Mandate, MandateId, TicketId, Trigger, TriggerId } from '@tomato/superagent'
import { createStorageStore } from '../src/index.ts'

const MANDATE: Mandate = {
  id: 'mandate-1' as MandateId,
  policyVersion: 'p1',
  scope: 'change',
  strength: 'explicit',
  matchedRules: ['feishu:mention'],
  sender: 'ou_1' as ActorId,
  thread: { source: 'feishu', id: 'oc_1:om_root' },
  at: '2026-11-14T00:00:00.000Z',
}

const TRIGGER: Trigger = {
  id: 'feishu:evt-1' as TriggerId,
  source: 'feishu',
  threads: [{ source: 'feishu', id: 'oc_1:om_root' }],
  actor: 'ou_1' as ActorId,
  human: true,
  addressed: 'mention',
  at: '2026-11-14T00:00:00.000Z',
  text: '给达人详情页加 tier 字段',
  channel: { source: 'feishu', address: { chatId: 'oc_1', messageId: 'om_root' } },
  meta: { chatType: 'group' },
}

/** One mounted context over the given medium; a new context is a restart. */
async function harness(pool: MemoryMediaPool = new MemoryMediaPool()): Promise<{ ctx: Context; pool: MemoryMediaPool }> {
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
  return { ctx, pool }
}

describe('durable store', () => {
  it('keeps triggers and tickets across a restart, and never replays a trigger', async () => {
    const first = await harness()
    const store = await createStorageStore(first.ctx)
    expect(intake(store, TRIGGER)).toMatchObject({ outcome: 'stored', reached: [] })
    const ticket = accept(store, {
      id: 'ticket-1' as TicketId,
      subject: '加 tier 字段',
      mandate: MANDATE,
      thread: { source: 'feishu', id: 'oc_1:om_root' },
      supervisor: 'supervisor-session',
    })
    assign(store, ticket.id, { session: 'worker-1', directory: '/work/one' })
    report(store, ticket.id, 'assignment-1' as never, { state: 'ready', summary: 'PR open' })
    await store.flush()

    // A restart is a new Host over the same medium: everything is still there.
    await first.ctx.fiber.dispose()
    const second = await harness(first.pool)
    const reopened = await createStorageStore(second.ctx)
    expect(reopened.trigger('feishu:evt-1' as TriggerId)?.text).toBe('给达人详情页加 tier 字段')
    expect(reopened.triggers().map(trigger => trigger.id)).toEqual(['feishu:evt-1'])
    const stored = reopened.ticket('ticket-1' as TicketId)
    expect(stored?.ticket.assignments[0]).toMatchObject({ session: 'worker-1', report: { state: 'ready' } })
    expect(stored?.subscriptions).toEqual([{ source: 'feishu', id: 'oc_1:om_root' }])
    // The same trigger arriving again is a duplicate, not a second event.
    // The same trigger arriving again is a duplicate that reaches nobody a second time.
    expect(intake(reopened, TRIGGER)).toEqual({ outcome: 'duplicate', reached: [] })
    // Closing waits for the queued writes, so nothing is lost on the way out.
    await reopened.close()
    await second.ctx.fiber.dispose()
  })

  it('keeps the first write of a trigger and reports a durable write that the medium refuses', async () => {
    const { ctx } = await harness()
    const store = await createStorageStore(ctx)
    store.putTrigger(TRIGGER)
    store.putTrigger({ ...TRIGGER, text: 'second write' })
    expect(store.trigger(TRIGGER.id)?.text).toBe('给达人详情页加 tier 字段')
    expect(store.triggers()).toEqual([TRIGGER])

    // A medium that refuses the write is logged, and the caller keeps running.
    const warn = vi.spyOn(ctx.logger, 'warn')
    await ctx.fiber.dispose()
    store.putTicket({ ticket: { id: 'ticket-bad' }, subscriptions: [] } as never)
    await store.flush()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('durable write failed'))
  })

  it('exposes its own domain so a deployment can provision it', async () => {
    const { ctx } = await harness()
    const store = await createStorageStore(ctx)
    expect(store.tickets()).toEqual([])
    await store.flush()
    await ctx.fiber.dispose()
  })
})
