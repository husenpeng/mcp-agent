/**
 * The `ctx.systemMonitor` client service: one reference-counted observation
 * stream over the `systemMonitor` namespace, so every surface of the overlay
 * shares one sampler and the Host stops sampling when the last consumer
 * leaves. A carrier interruption keeps the last frame on screen and reopens.
 * @module @tomato/api-system-monitor-controller/client/service
 */

import { Service, type Context } from '@tomato/cordis'
import { RemoteStreamCarrierError, type ClientRemote } from '@tomato/api-gateway/client'
import type { SystemMonitorRequest, SystemSampleFrame } from '../types.ts'
import type { ClientSystemMonitorModel, SystemMonitorSource } from './model.ts'

/** The generated `systemMonitor` namespace face the stream runner drives. */
export interface SystemMonitorRemote {
  /**
   * Open one sampling generation.
   * @param request - interval and process-limit overrides.
   * @param signal - generation cancellation.
   * @returns the frame sequence of one generation.
   */
  sample(request: SystemMonitorRequest, signal?: AbortSignal): AsyncIterable<SystemSampleFrame>
}

/** Remote faces the runner drives: the Gateway stream factory and the namespace. */
export interface SystemMonitorRemoteFace {
  readonly $stream: ClientRemote['$stream']
  readonly systemMonitor: SystemMonitorRemote
}

/** The client monitor service face. */
export interface ISystemMonitor {
  /** Latest frame, retained history, and stream state. */
  readonly state: SystemMonitorSource
  /**
   * Keep one observation stream open while any consumer holds it.
   * @returns stop function releasing this consumer's reference.
   */
  watch(): () => void
}

declare module '@tomato/cordis' {
  interface Context {
    /** Host hardware and process readings, shared by every overlay surface. */
    systemMonitor: ISystemMonitor
  }
}

/** Owns the single reference-counted observation stream. */
export class ClientSystemMonitor extends Service implements ISystemMonitor {
  readonly state: SystemMonitorSource
  private refs = 0
  private stream: { dispose(): Promise<void> } | undefined
  private stopped = false

  /**
   * @param ctx - client root Context.
   * @param remote - the Gateway stream factory plus the generated namespace, both resolved by the caller.
   * @param model - shared client monitor model.
   */
  constructor(
    ctx: Context,
    private readonly remote: SystemMonitorRemoteFace,
    private readonly model: ClientSystemMonitorModel,
  ) {
    super(ctx, 'systemMonitor')
    this.state = model
    ctx.effect(() => async () => {
      this.stopped = true
      const open = this.stream
      this.stream = undefined
      if (open !== undefined) await open.dispose()
    }, 'system-monitor-client.stream')
  }

  watch(): () => void {
    this.refs += 1
    if (this.refs === 1) this.start()
    let released = false
    return () => {
      if (released) return
      released = true
      this.refs -= 1
      if (this.refs > 0) return
      this.stop()
    }
  }

  /** Open the stream and pump frames into the model until it ends. */
  private start(): void {
    if (this.stopped) return
    const stream = this.remote.$stream<SystemSampleFrame>({
      name: 'system monitor',
      open: signal => this.remote.systemMonitor.sample({}, signal),
      // Samples are independent readings with no cursor, so an end at any
      // point is a carrier interruption the next generation fully replaces.
      ended: () => new RemoteStreamCarrierError('system monitor stream ended'),
    })
    this.stream = stream
    this.model.opened()
    void (async () => {
      try {
        for await (const item of stream) {
          this.model.frameReceived(item.value)
          item.accept()
        }
      } catch (error) {
        // A stopped stream is our own release, not a failure to report.
        if (!this.stopped && this.refs > 0) {
          this.model.failed(error instanceof Error ? error.message : String(error))
        }
      } finally {
        if (this.stream === stream) this.stream = undefined
        void stream.dispose()
      }
    })()
  }

  /** Close the stream and clear the model's transient state. */
  private stop(): void {
    const open = this.stream
    this.stream = undefined
    if (open !== undefined) void open.dispose()
    this.model.closed()
  }
}
