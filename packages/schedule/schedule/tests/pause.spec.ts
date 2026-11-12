/**
 * Pause and resume behavior of a stored reminder: the state the phone's schedule
 * page toggles, and the rule that survives a pause.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { SessionId } from '@tomato/session'
import type { Context } from '@tomato/cordis'
import type { ScheduleService } from '../src/index.ts'
import { harness } from './harness.ts'

const contexts: Context[] = []
const sessionId = SessionId('pause-session')

afterEach(async () => {
  await Promise.all(contexts.splice(0).map(ctx => ctx.fiber.dispose()))
})

/** Mount the service against a fresh fixture. */
async function setup(): Promise<ScheduleService> {
  const test = await harness({ onContext: ctx => contexts.push(ctx) })
  return test.service
}

describe('schedule pause and resume', () => {
  it('pauses an active task, keeps its rule, and resumes at a future occurrence', async () => {
    const service = await setup()
    const created = await service.createReminder({
      sessionId, title: '每小时检查', prompt: '检查一次', every_seconds: 3600,
    })
    expect(await service.pause({ sessionId, id: created.id })).toMatchObject({ updated: true, paused: true })

    const paused = (await service.catalog()).find(entry => entry.id === created.id)
    expect(paused).toMatchObject({ paused: true, status: 'active', everySeconds: 3600 })
    expect(paused?.pausedAt).toBeDefined()

    expect(await service.resume({ sessionId, id: created.id })).toMatchObject({ updated: true, paused: false })
    const resumed = (await service.catalog()).find(entry => entry.id === created.id)
    expect(resumed?.paused).toBe(false)
    expect(resumed !== undefined && 'everySeconds' in resumed ? resumed.everySeconds : undefined).toBe(3600)
    // A resumed recurring task points at a future occurrence rather than a backlog.
    expect(Date.parse(resumed!.scheduledAt)).toBeGreaterThan(Date.now())
  })

  it('reports an unknown task instead of changing it', async () => {
    const service = await setup()
    expect(await service.pause({ sessionId, id: 'schedule-missing' as never }))
      .toMatchObject({ updated: false, code: 'schedule_not_found' })
    expect(await service.resume({ sessionId, id: 'schedule-missing' as never }))
      .toMatchObject({ updated: false, code: 'schedule_not_found' })
  })

  it('reports the same state when the requested one already holds', async () => {
    const service = await setup()
    const created = await service.createReminder({
      sessionId, title: '每天', prompt: '日报', daily: { time: '09:00:00', time_zone: 'Asia/Shanghai' },
    })
    expect(await service.pause({ sessionId, id: created.id })).toMatchObject({ updated: true, paused: true })
    expect(await service.pause({ sessionId, id: created.id })).toMatchObject({ updated: false, paused: true })
    expect(await service.resume({ sessionId, id: created.id })).toMatchObject({ updated: true, paused: false })
    expect(await service.resume({ sessionId, id: created.id })).toMatchObject({ updated: false, paused: false })
  })
})
