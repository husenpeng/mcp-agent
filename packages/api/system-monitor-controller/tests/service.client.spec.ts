/** The shared observation stream: one stream per consumer set, reopen on failure, release on close. */
import { Context } from '@tomato/cordis'
import { describe, expect, it } from 'vitest'
import { RemoteStreamCarrierError } from '@tomato/api-gateway/client'
import { ClientSystemMonitorModel } from '../src/client/model.ts'
import { ClientSystemMonitor } from '../src/client/service.ts'
import type { SystemSampleFrame } from '../src/types.ts'

/** One frame with a distinctive timestamp. */
function frame(at: number): SystemSampleFrame {
  return {
    type: 'sample',
    at,
    host: {
      hostname: 'studio', platform: 'darwin', arch: 'arm64', osVersion: '25G76', model: 'Mac14,10',
      chip: 'Apple M2 Pro', cores: 12, totalMemoryBytes: 100, uptimeSeconds: 10,
    },
    cpu: { usage: 0.1, perCore: [0.1], loadAverage: [0, 0, 0] },
    memory: {
      totalBytes: 100, usedBytes: 50, freeBytes: 50, appBytes: 50, wiredBytes: 0, compressedBytes: 0,
      cachedBytes: 0, swapTotalBytes: 0, swapUsedBytes: 0,
    },
    gpu: null, disk: null, network: null, power: null, processes: [], unavailable: [],
  }
}

/** One scripted logical stream. */
class FakeStream<Frame> {
  disposed = false
  /** Model a carrier whose teardown surfaces as an iterator throw. */
  throwOnDispose = false
  private readonly frames: Frame[] = []
  private waiter: (() => void) | undefined
  private failure: unknown
  readonly accepts: number[] = []

  push(value: Frame): void {
    this.frames.push(value)
    this.waiter?.()
  }

  poison(error: unknown): void {
    this.failure = error
    this.waiter?.()
  }

  dispose(): Promise<void> {
    if (this.throwOnDispose) this.failure = new Error('carrier tore down')
    else this.disposed = true
    this.waiter?.()
    return Promise.resolve()
  }

  async *[Symbol.asyncIterator]() {
    while (!this.disposed) {
      if (this.failure !== undefined) throw this.failure
      const next = this.frames.shift()
      if (next === undefined) {
        await new Promise<void>((resolve) => { this.waiter = resolve })
        continue
      }
      yield { generation: 1, value: next, signal: new AbortController().signal, accept: () => { this.accepts.push(1) } }
    }
  }
}

interface StreamOptions {
  name: string
  open: (signal: AbortSignal) => AsyncIterable<SystemSampleFrame>
  ended: () => Error
}

/** Boot the client service over a scripted Gateway stream factory. */
function bench() {
  const ctx = new Context()
  const model = new ClientSystemMonitorModel()
  const streams: { options: StreamOptions; stream: FakeStream<SystemSampleFrame> }[] = []
  const requests: unknown[] = []
  const remote = {
    $stream: (options: StreamOptions) => {
      const stream = new FakeStream<SystemSampleFrame>()
      streams.push({ options, stream })
      return stream
    },
    systemMonitor: {
      sample: (request: unknown) => {
        requests.push(request)
        return { [Symbol.asyncIterator]: async function* () { /* the test drives frames */ } }
      },
    },
  }
  const service = new ClientSystemMonitor(ctx, remote as never, model)
  return { ctx, model, service, streams, requests }
}

const tick = () => new Promise<void>(resolve => setTimeout(resolve, 0))

describe('ClientSystemMonitor', () => {
  it('shares one stream across consumers and closes it with the last release', async () => {
    const { service, model, streams } = bench()
    const first = service.watch()
    const second = service.watch()
    expect(streams).toHaveLength(1)
    expect(streams[0]!.options.name).toBe('system monitor')
    expect(model.getSnapshot().status).toBe('live')

    streams[0]!.stream.push(frame(5))
    await tick()
    expect(model.getSnapshot().frame?.at).toBe(5)
    expect(streams[0]!.stream.accepts).toEqual([1])

    first()
    expect(streams[0]!.stream.disposed).toBe(false)
    second()
    expect(streams[0]!.stream.disposed).toBe(true)
    expect(model.getSnapshot().status).toBe('idle')
  })

  it('ignores a repeated release', () => {
    const { service, streams } = bench()
    const release = service.watch()
    release()
    release()
    expect(streams[0]!.stream.disposed).toBe(true)
  })

  it('opens the namespace stream with an empty request and treats an end as retryable', () => {
    const { service, streams, requests } = bench()
    const release = service.watch()
    const signal = new AbortController().signal
    void streams[0]!.options.open(signal)
    expect(requests).toEqual([{}])
    expect(streams[0]!.options.ended()).toBeInstanceOf(RemoteStreamCarrierError)
    release()
  })

  it('records a terminal stream failure and keeps the last frame', async () => {
    const { service, model, streams } = bench()
    const release = service.watch()
    streams[0]!.stream.push(frame(1))
    await tick()
    streams[0]!.stream.poison(new Error('carrier tore down'))
    await tick()
    expect(model.getSnapshot()).toMatchObject({ status: 'failed', failure: 'carrier tore down' })
    expect(model.getSnapshot().frame?.at).toBe(1)
    release()
    expect(model.getSnapshot().status).toBe('idle')
  })

  it('does not report a teardown that follows its own release', async () => {
    const { service, model, streams } = bench()
    const release = service.watch()
    streams[0]!.stream.throwOnDispose = true
    release()
    await tick()
    expect(model.getSnapshot().status).toBe('idle')
  })

  it('reports a carrier failure that is not an Error by value', async () => {
    const { service, model, streams } = bench()
    const release = service.watch()
    streams[0]!.stream.poison('socket closed')
    await tick()
    expect(model.getSnapshot().failure).toBe('socket closed')
    release()
  })

  it('reports stream reopening through a fresh stream after a release', async () => {
    const { service, streams, model } = bench()
    const first = service.watch()
    first()
    expect(streams).toHaveLength(1)
    const second = service.watch()
    expect(streams).toHaveLength(2)
    expect(model.getSnapshot().status).toBe('live')
    second()
  })

  it('stops opening streams once the plugin fiber is gone', async () => {
    const { ctx, service, streams } = bench()
    await ctx.fiber.dispose()
    service.watch()()
    expect(streams).toHaveLength(0)
  })

  it('disposes the open stream with the plugin fiber', async () => {
    const { ctx, service, streams } = bench()
    service.watch()
    await ctx.fiber.dispose()
    expect(streams[0]!.stream.disposed).toBe(true)
  })
})
