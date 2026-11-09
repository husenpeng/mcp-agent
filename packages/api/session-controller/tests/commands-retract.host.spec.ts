import { Context } from '@tomato/cordis'
import AgentRegistry from '@tomato/agent'
import type { Agent } from '@tomato/agent'
import { createMessage, createUserMessage } from '@tomato/llm'
import SessionStore, { SessionId } from '@tomato/session'
import { SessionQueryError } from '@tomato/session-query'
import { describe, expect, it, vi } from 'vitest'
import { ApiSessionAgentController } from '../src/agent.ts'
import { SessionCommandController } from '../src/commands.ts'
import { installSessionReadTestServices } from './test-remote.ts'

type FixtureStatus = 'idle' | 'running'

/** Build one completed human exchange and a controller whose Agent resolution is fixed. */
async function retractFixture(status: FixtureStatus = 'idle', queued = false) {
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  await ctx.plugin(AgentRegistry)
  installSessionReadTestServices(ctx)
  ctx.provide('workspaceRegistry', { get: () => undefined, list: () => [], archivedSessionIds: [] } as never)
  const session = ctx.sessions.create(SessionId('retract-session'), { meta: { cwd: '/cwd' } })
  session.append('turn/start', { turn: 1 })
  const human = createUserMessage({ content: [{ type: 'text', text: 'typed by mistake' }], source: { kind: 'user' } })
  const humanSeq = session.append('user/message', human, { surfaceOp: 'append' }).seq
  const replySeq = session.append('assistant/message', {
    turn: 1, step: 1, stream: [],
    message: createMessage({
      role: 'assistant',
      content: [{ type: 'text', text: 'answer to remove' }],
      source: { kind: 'model', provider: 'mock', model: 'mock' },
    }),
  }, { surfaceOp: 'append' }).seq
  session.append('turn/end', { turn: 1, reason: { kind: 'completed' } })
  const cancel = vi.fn()
  const whenIdle = vi.fn(async () => {})
  const partial: Partial<Agent> = {
    id: session.id,
    session,
    status,
    ctx,
    inbox: {
      nextTurn: queued
        ? [createUserMessage({ content: [{ type: 'text', text: 'later' }], source: { kind: 'user' } })]
        : [],
      nextStep: [],
      clear: () => {},
      append: () => {},
      prepend: () => {},
      replace: () => false,
      remove: () => false,
      splice: () => [],
    },
    cancel,
    whenIdle,
    runMaintenance: async <T>(task: (signal: AbortSignal) => Promise<T>): Promise<T> =>
      task(new AbortController().signal),
  }
  const agent = partial as Agent
  const agents = new ApiSessionAgentController(ctx)
  vi.spyOn(agents, 'resolveAgent').mockResolvedValue({ agent })
  const controller = new SessionCommandController(ctx, agents, '/cwd')
  return { ctx, session, controller, agent, human, humanSeq, replySeq, cancel, whenIdle }
}

describe('SessionCommandController.retract', () => {
  it('removes the trailing exchange and reports its exact range', async () => {
    const fixture = await retractFixture()
    await expect(fixture.controller.retract({ sessionId: fixture.session.id, atSeq: fixture.humanSeq }))
      .resolves.toEqual({
        accepted: true,
        startSeq: fixture.humanSeq,
        endSeq: fixture.replySeq,
      })
    expect(fixture.session.surface.nodes).toEqual([])
    expect(fixture.session.deriveMessages()).toEqual([])
    expect(fixture.session.snapshotEvents().at(-1)?.type).toBe('conversation/retraction')
    await fixture.ctx.fiber.dispose()
  })

  it('cancels a running turn and waits for it to settle before retracting', async () => {
    const fixture = await retractFixture('running')
    await fixture.controller.retract({ sessionId: fixture.session.id, atSeq: fixture.humanSeq })
    expect(fixture.cancel).toHaveBeenCalledWith({ kind: 'user' })
    expect(fixture.whenIdle).toHaveBeenCalledOnce()
    expect(fixture.session.surface.nodes).toEqual([])
    await fixture.ctx.fiber.dispose()
  })

  it('refuses instead of discarding queued next-turn input', async () => {
    const fixture = await retractFixture('idle', true)
    await expect(fixture.controller.retract({ sessionId: fixture.session.id, atSeq: fixture.humanSeq }))
      .rejects.toMatchObject({ code: 'session/retract-unavailable' })
    expect(fixture.session.snapshotEvents().some(event => event.type === 'conversation/retraction')).toBe(false)
    await fixture.ctx.fiber.dispose()
  })

  it('refuses a prompt that does not open the last turn', async () => {
    const fixture = await retractFixture()
    await expect(fixture.controller.retract({ sessionId: fixture.session.id, atSeq: fixture.replySeq }))
      .rejects.toMatchObject({ code: 'session/retract-unavailable' })
    await fixture.ctx.fiber.dispose()
  })

  it('refuses an earlier turn once a later turn has opened', async () => {
    const fixture = await retractFixture()
    fixture.session.append('turn/start', { turn: 2 })
    fixture.session.append('user/message', createUserMessage({
      content: [{ type: 'text', text: 'later' }], source: { kind: 'user' },
    }), { surfaceOp: 'append' })
    fixture.session.append('turn/end', { turn: 2, reason: { kind: 'completed' } })
    await expect(fixture.controller.retract({ sessionId: fixture.session.id, atSeq: fixture.humanSeq }))
      .rejects.toMatchObject({ code: 'session/retract-unavailable' })
    await fixture.ctx.fiber.dispose()
  })

  it('maps observation, maintenance, and generic failures to retract-unavailable', async () => {
    const observed = await retractFixture()
    vi.spyOn(observed.ctx.sessionQuery, 'observeSession').mockRejectedValueOnce(
      new SessionQueryError('unavailable', 'SESSION_QUERY_PERSISTENCE_FAILED'),
    )
    await expect(observed.controller.retract({ sessionId: observed.session.id, atSeq: observed.humanSeq }))
      .rejects.toMatchObject({ code: 'session/retract-unavailable' })
    vi.spyOn(observed.ctx.sessionQuery, 'observeSession').mockRejectedValueOnce(new Error('boom'))
    await expect(observed.controller.retract({ sessionId: observed.session.id, atSeq: observed.humanSeq }))
      .rejects.toMatchObject({ code: 'session/retract-unavailable' })
    await observed.ctx.fiber.dispose()

    const busy = await retractFixture()
    vi.spyOn(busy.agent, 'runMaintenance').mockImplementation(() => {
      throw new Error('a turn owns the agent')
    })
    await expect(busy.controller.retract({ sessionId: busy.session.id, atSeq: busy.humanSeq }))
      .rejects.toMatchObject({ code: 'session/retract-unavailable' })
    await busy.ctx.fiber.dispose()
  })

  it('rejects a malformed atSeq before resolving the Agent', async () => {
    const fixture = await retractFixture()
    await expect(fixture.controller.retract({ sessionId: fixture.session.id, atSeq: -1 }))
      .rejects.toMatchObject({ code: 'gateway/bad-request' })
    await fixture.ctx.fiber.dispose()
  })

  it('refuses to fork at a boundary that would resurrect the retracted exchange', async () => {
    const fixture = await retractFixture()
    await fixture.controller.retract({ sessionId: fixture.session.id, atSeq: fixture.humanSeq })
    await expect(fixture.controller.fork({ sessionId: fixture.session.id, atSeq: fixture.replySeq }))
      .rejects.toMatchObject({ code: 'session/fork-unavailable' })
    await fixture.ctx.fiber.dispose()
  })
})
