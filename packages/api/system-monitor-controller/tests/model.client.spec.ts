/** Client monitor state: bounded history, status transitions, and stable snapshots. */
import { describe, expect, it, vi } from 'vitest'
import { ClientSystemMonitorModel } from '../src/client/model.ts'
import type { SystemSampleFrame } from '../src/types.ts'

/** One frame with the given headline percentages. */
function frame(at: number, cpu: number, gpu: number | null, used: number, total = 100): SystemSampleFrame {
  return {
    type: 'sample',
    at,
    host: {
      hostname: 'studio', platform: 'darwin', arch: 'arm64', osVersion: '25G76', model: 'Mac14,10',
      chip: 'Apple M2 Pro', cores: 12, totalMemoryBytes: total, uptimeSeconds: 10,
    },
    cpu: { usage: cpu, perCore: [cpu], loadAverage: [0, 0, 0] },
    memory: {
      totalBytes: total, usedBytes: used, freeBytes: total - used, appBytes: used, wiredBytes: 0,
      compressedBytes: 0, cachedBytes: 0, swapTotalBytes: 0, swapUsedBytes: 0,
    },
    gpu: gpu === null ? null : {
      name: 'Apple M2 Pro GPU', utilization: gpu, renderer: null, tiler: null,
      inUseMemoryBytes: null, allocatedMemoryBytes: null,
    },
    disk: null,
    network: null,
    power: null,
    processes: [],
    unavailable: [],
  }
}

describe('ClientSystemMonitorModel', () => {
  it('keeps the newest frame, a bounded history, and stable snapshots', () => {
    const model = new ClientSystemMonitorModel()
    const before = model.getSnapshot()
    expect(before).toEqual({ frame: null, points: [], status: 'idle', failure: null })
    expect(model.getSnapshot()).toBe(before)

    model.frameReceived(frame(1, 0.5, 0.25, 40))
    const live = model.getSnapshot()
    expect(live.status).toBe('live')
    expect(live.points).toEqual([{ at: 1, cpu: 0.5, gpu: 0.25, memory: 0.4 }])
    expect(model.getSnapshot()).toBe(live)

    for (let index = 0; index < 100; index += 1) model.frameReceived(frame(10 + index, 0, null, 0))
    expect(model.getSnapshot().points).toHaveLength(90)
    expect(model.getSnapshot().points.at(-1)?.at).toBe(109)
  })

  it('records an interrupted stream without dropping the last frame', () => {
    const model = new ClientSystemMonitorModel()
    model.frameReceived(frame(1, 0.5, null, 40))
    model.interrupted()
    const snapshot = model.getSnapshot()
    expect(snapshot.status).toBe('reconnecting')
    expect(snapshot.frame?.at).toBe(1)
    model.failed('host went away')
    expect(model.getSnapshot()).toMatchObject({ status: 'failed', failure: 'host went away' })
    model.opened()
    expect(model.getSnapshot().status).toBe('live')
    model.closed()
    expect(model.getSnapshot()).toMatchObject({ status: 'idle', failure: null })
  })

  it('reports zero occupancy for a frame with no capacity', () => {
    const model = new ClientSystemMonitorModel()
    model.frameReceived(frame(1, 0.1, 0.2, 0, 0))
    expect(model.getSnapshot().points[0]).toEqual({ at: 1, cpu: 0.1, gpu: 0.2, memory: 0 })
  })

  it('notifies subscribers until they unsubscribe', () => {
    const model = new ClientSystemMonitorModel()
    const seen = vi.fn()
    const stop = model.subscribe(seen)
    model.frameReceived(frame(1, 0.1, null, 1))
    expect(seen).toHaveBeenCalledTimes(1)
    stop()
    model.frameReceived(frame(2, 0.1, null, 1))
    expect(seen).toHaveBeenCalledTimes(1)
  })
})
