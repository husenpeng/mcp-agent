// Run Session resolution: a run row can leave the Client catalog when its Agent
// ends, so the page must pull the Host catalog once instead of retaining a
// Session the Client refuses (which crashed the main slot entry).
import { describe, expect, it, onTestFinished } from 'vitest'
import { Context } from '@tomato/cordis'
import { brandString } from '@tomato/branded'
import { TestSessions } from '@tomato/client-test-runtime'
import type { SessionId } from '@tomato/session/types'
import { retainRunSession } from '../src/client/run-session.ts'

const RUN = brandString<SessionId>('robot-run-42')

/**
 * Mount a real Session Controller double that records catalog pulls.
 * @param make - Session double factory receiving the owning Context.
 * @returns the double, with teardown registered on the current test.
 */
function bench(make: (ctx: Context) => TestSessions): TestSessions {
  const ctx = new Context()
  const sessions = make(ctx)
  onTestFinished(async () => {
    await sessions.disposeScopes()
    await ctx.fiber.dispose()
  })
  return sessions
}

describe('robot run Session resolution', () => {
  it('retains a listed Session without pulling the catalog', async () => {
    const sessions = bench(ctx => new TestSessions(async (action) => { await action() }, ctx))
    await sessions.add({ id: RUN, summary: { title: '竞品报告' } })

    const reference = await retainRunSession(sessions, RUN)

    expect(reference).toBeDefined()
    expect(sessions.calls.filter(call => call.method === 'refresh')).toHaveLength(0)
    expect(sessions.retainInfo(RUN).getSnapshot().retainedBy.robotRun).toBe(1)
    reference?.release()
    expect(sessions.retainInfo(RUN).getSnapshot().referenceCount).toBe(0)
  })

  it('pulls the catalog once and reports an unknown Session as unresolvable', async () => {
    const sessions = bench(ctx => new TestSessions(async (action) => { await action() }, ctx))

    await expect(retainRunSession(sessions, RUN)).resolves.toBeUndefined()

    expect(sessions.calls.filter(call => call.method === 'refresh')).toHaveLength(1)
    expect(sessions.retainInfo(RUN).getSnapshot().referenceCount).toBe(0)
  })

  it('retains the persisted row the catalog pull restores', async () => {
    class RestoringSessions extends TestSessions {
      override async refresh(): Promise<void> {
        await super.refresh()
        await this.add({ id: RUN, summary: { title: '竞品报告' } })
      }
    }
    const sessions = bench(ctx => new RestoringSessions(async (action) => { await action() }, ctx))

    const reference = await retainRunSession(sessions, RUN)

    expect(reference).toBeDefined()
    expect(sessions.calls.filter(call => call.method === 'refresh')).toHaveLength(1)
    expect(sessions.retainInfo(RUN).getSnapshot().retainedBy.robotRun).toBe(1)
    reference?.release()
  })
})
