/** The client half installs `ctx.systemMonitor` over the generated Remote namespace. */
import { Context } from '@tomato/cordis'
import { afterEach, describe, expect, it } from 'vitest'
import { apply, inject } from '../src/client/index.ts'
import type { SystemSampleFrame } from '../src/types.ts'

/** Boot the client plugin over a fake `remote` face. */
function bench() {
  const ctx = new Context()
  const opened: string[] = []
  const remote = {
    $stream: (options: { name: string }) => {
      opened.push(options.name)
      return { dispose: () => Promise.resolve(), [Symbol.asyncIterator]: async function* () { /* no frames */ } }
    },
    systemMonitor: {
      sample: () => ({ [Symbol.asyncIterator]: async function* (): AsyncGenerator<SystemSampleFrame> { /* none */ } }),
    },
  }
  ctx.provide('remote', remote)
  ctx.provide('remote.systemMonitor', remote.systemMonitor)
  return { ctx, opened }
}

afterEach(() => {})

describe('api-system-monitor-controller client plugin', () => {
  it('installs the shared monitor service', async () => {
    const { ctx, opened } = bench()
    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    expect(ctx.systemMonitor.state.getSnapshot().status).toBe('idle')
    const release = ctx.systemMonitor.watch()
    expect(opened).toEqual(['system monitor'])
    release()
    expect(ctx.systemMonitor.state.getSnapshot().status).toBe('idle')
    await ctx.fiber.dispose()
  })
})
