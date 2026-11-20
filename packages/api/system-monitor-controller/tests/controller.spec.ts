/** The Remote stream cadence, clamping, and abort behavior. */
import { Context } from '@tomato/cordis'
import { describe, expect, it } from 'vitest'
import { SystemMonitorController, type Config } from '../src/index.ts'

const config: Config = { intervalMs: 250, processLimit: 2, commandTimeoutMs: 500 }

/** Collect frames until the consumer aborts, then stop. */
async function take(controller: SystemMonitorController, count: number, request = {}): Promise<number[]> {
  const abort = new AbortController()
  const times: number[] = []
  for await (const frame of controller.sample(request, abort.signal)) {
    times.push(frame.at)
    if (times.length >= count) abort.abort()
  }
  return times
}

describe('SystemMonitorController', () => {
  it('streams one frame per interval and stops when the consumer aborts', async () => {
    const controller = new SystemMonitorController(new Context(), config)
    const times = await take(controller, 2)
    expect(times).toHaveLength(2)
    expect(times[1]! - times[0]!).toBeGreaterThanOrEqual(200)
  })

  it('clamps out-of-range overrides instead of rejecting them', async () => {
    const controller = new SystemMonitorController(new Context(), config)
    await expect(take(controller, 1, { intervalMs: Number.NaN, processLimit: 9_999 })).resolves.toHaveLength(1)
    await expect(take(controller, 1, { intervalMs: 60_000, processLimit: -3 })).resolves.toHaveLength(1)
  })

  it('ends a wait when the consumer aborts between frames', async () => {
    const controller = new SystemMonitorController(new Context(), { ...config, intervalMs: 5_000 })
    const abort = new AbortController()
    const frames: unknown[] = []
    for await (const frame of controller.sample({}, abort.signal)) {
      frames.push(frame)
      // Abort during the interval wait, not during the sample.
      setTimeout(() => { abort.abort() }, 20)
    }
    expect(frames).toHaveLength(1)
  })

  it('yields nothing when the stream is already cancelled', async () => {
    const controller = new SystemMonitorController(new Context(), config)
    const abort = new AbortController()
    abort.abort()
    const frames: unknown[] = []
    for await (const frame of controller.sample({}, abort.signal)) frames.push(frame)
    expect(frames).toEqual([])
  })
})
