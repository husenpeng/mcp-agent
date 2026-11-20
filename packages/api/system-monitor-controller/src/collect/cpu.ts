/**
 * Processor usage from `node:os` tick snapshots. The sampler keeps the
 * previous snapshot across frames; this module diffs two snapshots and holds
 * no state of its own.
 * @module @tomato/api-system-monitor-controller/collect/cpu
 */

import { cpus, loadavg } from 'node:os'
import type { CpuReading } from '../types.ts'

/** Cumulative processor ticks of every logical core at one instant. */
export interface CpuTimes {
  /** Idle and total tick counts per logical core, in `os.cpus()` order. */
  readonly perCore: readonly {
    /** Cumulative idle ticks. */
    readonly idle: number
    /** Cumulative ticks of every kind: user, nice, sys, idle, and irq. */
    readonly total: number
  }[]
}

/** One logical core's tick counts. */
type CoreTimes = CpuTimes['perCore'][number]

/**
 * Read cumulative processor ticks from `node:os`.
 * @returns one entry per logical core, with `total` summed over every tick kind.
 */
export function readCpuTimes(): CpuTimes {
  return {
    perCore: cpus().map(({ times }) => ({
      idle: times.idle,
      total: times.user + times.nice + times.sys + times.idle + times.irq,
    })),
  }
}

/**
 * Diff two tick snapshots into the frame's processor reading.
 *
 * A core with no ticks since the previous snapshot reports the overall share
 * instead of dividing by zero, and so does a core absent from the previous
 * snapshot. A snapshot with no ticks at all reports zero rather than a stale
 * value. Shares are clamped to 0–1, so a counter reset cannot produce negative
 * or over-full usage.
 * @param previous - tick counts carried from the previous frame.
 * @param next - tick counts read for this frame.
 * @returns overall and per-core busy shares plus the current load averages.
 */
export function cpuUsageBetween(previous: CpuTimes, next: CpuTimes): CpuReading {
  const usage = busyShare(totalTicks(previous.perCore), totalTicks(next.perCore)) ?? 0
  const perCore = next.perCore.map((core, index) => {
    const before = previous.perCore[index]
    if (before === undefined) return usage
    return busyShare(before, core) ?? usage
  })
  return { usage, perCore, loadAverage: loadavg() }
}

/**
 * Sum per-core ticks into one aggregate.
 * @param cores - tick counts to add up.
 * @returns the summed idle and total ticks.
 */
function totalTicks(cores: CpuTimes['perCore']): CoreTimes {
  let idle = 0
  let total = 0
  for (const core of cores) {
    idle += core.idle
    total += core.total
  }
  return { idle, total }
}

/**
 * Busy share between two tick counts.
 * @param previous - earlier idle and total ticks.
 * @param next - later idle and total ticks.
 * @returns the busy share clamped to 0–1, or null when no ticks elapsed.
 */
function busyShare(previous: CoreTimes, next: CoreTimes): number | null {
  const total = next.total - previous.total
  if (total <= 0) return null
  const idle = next.idle - previous.idle
  return Math.min(Math.max((total - idle) / total, 0), 1)
}
