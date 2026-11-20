/**
 * Host side of the system monitor: one sampled frame per interval over the
 * generated `systemMonitor` Remote namespace. The controller owns the sampling
 * cadence and the per-stream abort; `/proc`, `sysctl`, `ioreg`, `netstat`,
 * `ps`, and `pmset` reads belong to the collectors, and nothing here touches
 * the model's request path.
 * @module @tomato/api-system-monitor-controller
 */

import type { Context } from '@tomato/cordis'
import z from '@tomato/schemastery'
import { Remote, TypertRemoteService } from '@tomato/typert-protocol'
import { createCommandRunner } from './collect/command.ts'
import { SystemSampler } from './sampler.ts'
import type { SystemMonitorRequest, SystemSampleFrame } from './types.ts'

export type * from './types.ts'

declare module '@tomato/cordis' {
  interface Context {
    /** Host sampler that streams hardware and process readings to browsers. */
    systemMonitorController: SystemMonitorController
  }
}

/** Default sampling interval, in milliseconds. */
const DEFAULT_INTERVAL_MS = 1000

/** Default number of process rows per frame. */
const DEFAULT_PROCESS_LIMIT = 6

/** Default deadline for one platform probe, in milliseconds. */
const DEFAULT_COMMAND_TIMEOUT_MS = 2000

/** Shortest interval a caller may request, in milliseconds. */
const MIN_INTERVAL_MS = 250

/** Longest interval a caller may request, in milliseconds. */
const MAX_INTERVAL_MS = 10_000

/** Largest process list a caller may request. */
const MAX_PROCESS_LIMIT = 50

/** Deployment policy for sampling cost. */
export interface Config {
  /** Sampling interval in milliseconds (default 1000; clamped to 250–10,000). */
  readonly intervalMs?: number
  /** Process rows per frame, highest CPU first (default 6; 0–50). */
  readonly processLimit?: number
  /** Deadline for one platform probe in milliseconds (default 2000). */
  readonly commandTimeoutMs?: number
}

/**
 * Clamp a caller-supplied number into a closed range.
 * @param value - the requested value.
 * @param minimum - smallest accepted value.
 * @param maximum - largest accepted value.
 * @returns the value inside the range.
 */
function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum
  return Math.min(Math.max(Math.round(value), minimum), maximum)
}

/**
 * Wait for one interval, ending early when the consumer aborts.
 * @param ms - milliseconds to wait.
 * @param signal - stream cancellation.
 * @returns a promise that settles when the wait ends, by timer or abort.
 */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve()
      return
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', done)
      resolve()
    }, ms)
    const done = (): void => {
      clearTimeout(timer)
      resolve()
    }
    signal.addEventListener('abort', done, { once: true })
  })
}

/** Sampled host metrics over Typert Remote. */
export class SystemMonitorController extends TypertRemoteService {
  static inject = ['typert']

  static Config: z<Config> = z.object({
    intervalMs: z.natural().min(MIN_INTERVAL_MS).max(MAX_INTERVAL_MS).default(DEFAULT_INTERVAL_MS),
    processLimit: z.natural().max(MAX_PROCESS_LIMIT).default(DEFAULT_PROCESS_LIMIT),
    commandTimeoutMs: z.natural().min(100).max(30_000).default(DEFAULT_COMMAND_TIMEOUT_MS),
  })

  private readonly sampler: SystemSampler
  private readonly intervalMs: number
  private readonly processLimit: number

  /**
   * @param ctx - Host context carrying the Typert Remote registration.
   * @param config - sampling cadence, process limit, and probe deadline.
   */
  constructor(ctx: Context, config: Config) {
    super(ctx, 'systemMonitorController', { namespace: 'systemMonitor' })
    // schemastery has already filled every defaulted field; the assertion
    // records that resolution, not a hidden fallback.
    const resolved = config as Required<Config>
    this.intervalMs = resolved.intervalMs
    this.processLimit = resolved.processLimit
    this.sampler = new SystemSampler(createCommandRunner(resolved.commandTimeoutMs))
  }

  /**
   * Stream one frame per interval: the current reading immediately, then one
   * after each wait. The stream has no natural end; the carrier closes it when
   * the browser disconnects, and the frame already in flight settles first.
   * @param request - interval and process limit overrides for this consumer.
   * @param signal - cancellation owned by the Remote stream carrier.
   * @returns the sampled frames.
   */
  @Remote({ mode: 'stream' })
  async *sample(request: SystemMonitorRequest, signal: AbortSignal): AsyncIterable<SystemSampleFrame> {
    const intervalMs = clamp(request.intervalMs ?? this.intervalMs, MIN_INTERVAL_MS, MAX_INTERVAL_MS)
    const processLimit = clamp(request.processLimit ?? this.processLimit, 0, MAX_PROCESS_LIMIT)
    while (!signal.aborted) {
      yield await this.sampler.sample({ processLimit })
      await sleep(intervalMs, signal)
    }
  }
}

/** Host system-monitor plugin. */
export default SystemMonitorController
