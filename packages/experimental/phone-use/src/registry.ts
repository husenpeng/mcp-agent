/**
 * Attached runners, command correlation, and the device list.
 *
 * One runner holds one attach stream open and reports every command result over
 * a unary call. This registry owns that pairing: it queues frames for the
 * stream, settles the promise of a command by id, and fails everything still
 * waiting when the stream ends. No input is ever replayed after a reconnect.
 * @module @tomato/experimental-phone-use/src/registry
 */

import { randomUUID } from 'node:crypto'
import { brandString } from '@tomato/branded'
import type { JsonValue } from '@tomato/util-values'
import {
  DEFAULT_COMMAND_TIMEOUT_MS, PHONE_PROTOCOL_VERSION,
  type PhoneAttachRequest, type PhoneCommandResult, type PhoneDeviceSummary, type PhoneDownFrame,
} from './protocol.ts'
import { PhoneUseError, type PhoneAttachId, type PhoneCommandId, type PhoneDeviceId } from './types.ts'

/** One stream of host-to-runner frames that a Remote stream can iterate. */
class FrameQueue {
  private readonly frames: PhoneDownFrame[] = []
  private waiting: ((result: IteratorResult<PhoneDownFrame>) => void) | undefined
  private closed = false

  /** Append one frame; a closed queue drops it. */
  push(frame: PhoneDownFrame): void {
    if (this.closed) return
    const waiting = this.waiting
    if (waiting !== undefined) {
      this.waiting = undefined
      waiting({ value: frame, done: false })
      return
    }
    this.frames.push(frame)
  }

  /** End the iteration for every reader. */
  close(): void {
    this.closed = true
    const waiting = this.waiting
    this.waiting = undefined
    waiting?.({ value: undefined, done: true })
  }

  /** Iterate until the queue closes. */
  async *iterate(): AsyncGenerator<PhoneDownFrame> {
    for (;;) {
      const queued = this.frames.shift()
      if (queued !== undefined) {
        yield queued
        continue
      }
      if (this.closed) return
      const next = await new Promise<IteratorResult<PhoneDownFrame>>((resolve) => {
        this.waiting = resolve
      })
      if (next.done) return
      yield next.value
    }
  }
}

/** What one pending command settles with. */
type CommandOutcome =
  | { readonly ok: true; readonly value?: JsonValue }
  | { readonly ok: false; readonly error: { readonly code: string; readonly message: string; readonly retryable: boolean } }

/** One pending command's settlement. */
interface Pending {
  settle: (outcome: CommandOutcome) => void
  timer: ReturnType<typeof setTimeout>
  detach: () => void
}

/** One attached runner. */
class Session {
  readonly attachId: PhoneAttachId = brandString<PhoneAttachId>(randomUUID())
  readonly attachedAt = new Date().toISOString()
  readonly queue = new FrameQueue()
  readonly pending = new Map<string, Pending>()
  halted = false
  closed = false

  constructor(readonly request: PhoneAttachRequest) {}

  /** Whether a newer attach replaced this one. */
  get deviceId(): PhoneDeviceId {
    return this.request.deviceId as PhoneDeviceId
  }

  /** Queue one frame for the runner. */
  send(frame: PhoneDownFrame): void {
    if (this.closed) throw new PhoneUseError('phone/disconnected', `设备 ${this.request.deviceName} 已经断开`)
    this.queue.push(frame)
  }

  /** Fail every command still waiting and close the stream. */
  close(reason: string): void {
    if (this.closed) return
    this.closed = true
    this.queue.close()
    for (const [commandId, entry] of this.pending) {
      clearTimeout(entry.timer)
      entry.detach()
      entry.settle({ ok: false, error: { code: 'DISCONNECTED', message: reason, retryable: true } })
      this.pending.delete(commandId)
    }
  }
}

/** Every attached runner and the commands in flight. */
export class PhoneDevices {
  private readonly sessions = new Map<string, Session>()
  private readonly timeoutMs: number

  /**
   * @param options - command timeout override from the plugin configuration.
   */
  constructor(options: { commandTimeoutMs?: number } = {}) {
    this.timeoutMs = options.commandTimeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS
  }

  /**
   * Attach one runner, replacing any earlier attachment of the same device.
   * @param request - runner identity and capabilities.
   * @param signal - cancellation owned by the Remote stream carrier.
   * @returns the frames the Host sends down this attachment.
   */
  attach(request: PhoneAttachRequest, signal: AbortSignal): AsyncIterable<PhoneDownFrame> {
    if (request.protocol !== PHONE_PROTOCOL_VERSION) {
      throw new PhoneUseError(
        'phone/refused',
        `设备协议 ${request.protocol} 与本机 ${PHONE_PROTOCOL_VERSION} 不一致`,
        { protocol: request.protocol },
      )
    }
    const previous = this.sessions.get(request.deviceId)
    previous?.close('新的连接替换了这次连接')
    const session = new Session(request)
    this.sessions.set(request.deviceId, session)
    signal.addEventListener('abort', () => {
      session.close('Host 关闭了连接')
      if (this.sessions.get(request.deviceId) === session) this.sessions.delete(request.deviceId)
    }, { once: true })
    return (async function* frames() {
      const ready: PhoneDownFrame = { type: 'ready', attachId: session.attachId }
      yield ready
      yield* session.queue.iterate()
    })()
  }

  /**
   * Settle one command with the result its runner reported.
   * @param result - command outcome.
   */
  accept(result: PhoneCommandResult): void {
    const session = this.byAttach(result.attachId)
    const entry = session?.pending.get(result.commandId)
    if (!session || !entry) {
      // A late or duplicated result never reopens a settled command.
      return
    }
    clearTimeout(entry.timer)
    entry.detach()
    session.pending.delete(result.commandId)
    const failure = result.error
    if (result.ok) {
      entry.settle(result.value === undefined ? { ok: true } : { ok: true, value: result.value })
    } else {
      entry.settle({
        ok: false,
        error: {
          code: failure?.code ?? 'INTERNAL',
          message: failure?.message ?? 'runner 没有给出原因',
          retryable: failure?.retryable ?? false,
        },
      })
    }
  }

  /**
   * Record one out-of-band event.
   * @param event - attach identity, kind, and optional detail.
   */
  event(event: { attachId: string; type: 'halted' | 'locked' | 'unlocked' | 'leaseChanged' }): void {
    const session = this.byAttach(event.attachId)
    if (!session) return
    if (event.type === 'halted') session.halted = true
    if (event.type === 'unlocked') session.halted = false
  }

  /**
   * Resolve one device reference.
   * @param deviceId - explicit identity, or undefined for the only attached phone.
   * @returns the live session.
   * @throws PhoneUseError `phone/no-device` or `phone/ambiguous-device`.
   */
  require(deviceId?: string): Session {
    if (deviceId !== undefined) {
      const session = this.sessions.get(deviceId)
      if (!session) throw new PhoneUseError('phone/no-device', `设备 ${deviceId} 没有连接`)
      return session
    }
    const all = [...this.sessions.values()]
    if (all.length === 0) throw new PhoneUseError('phone/no-device', '没有已连接的手机')
    if (all.length > 1) {
      throw new PhoneUseError('phone/ambiguous-device', '连接了多台手机，请指定 device', {
        devices: all.map(session => ({ deviceId: session.deviceId, deviceName: session.request.deviceName })),
      })
    }
    const only = all[0]
    if (only === undefined) throw new PhoneUseError('phone/no-device', '没有已连接的手机')
    return only
  }

  /**
   * List every attached device.
   * @returns summaries in attach order.
   */
  list(): PhoneDeviceSummary[] {
    return [...this.sessions.values()].map(session => ({
      deviceId: session.deviceId,
      deviceName: session.request.deviceName,
      protocol: session.request.protocol,
      runnerVersion: session.request.runnerVersion,
      screen: session.request.screen,
      capabilities: session.request.capabilities,
      attachedAt: session.attachedAt,
      halted: session.halted,
    }))
  }

  /**
   * Run one engine method on an attached device.
   * @param deviceId - explicit identity, or undefined for the only attached phone.
   * @param method - engine method name.
   * @param params - method parameters.
   * @param signal - caller cancellation.
   * @param timeoutMs - deadline override.
   * @returns the method's raw value.
   */
  async call(
    deviceId: string | undefined,
    method: string,
    params: JsonValue,
    signal: AbortSignal,
    timeoutMs?: number,
  ): Promise<JsonValue> {
    const session = this.require(deviceId)
    if (session.halted) throw new PhoneUseError('phone/halted', '设备所有者在手机上停止了控制')
    if (signal.aborted) throw new PhoneUseError('phone/rejected', '调用已取消')
    const commandId: PhoneCommandId = brandString<PhoneCommandId>(randomUUID())
    const deadline = timeoutMs ?? this.timeoutMs
    const outcome = new Promise<CommandOutcome>((resolve) => {
      // A closed session throws from `send`; the command is already failing, so
      // the cancel frame is best-effort and never replaces the outcome.
      const cancelOnDevice = () => {
        try {
          session.send({ type: 'cancel', commandId })
        } catch {
          // The stream is gone; nothing is left to cancel on the device.
        }
      }
      const timer = setTimeout(() => {
        session.pending.delete(commandId)
        cancelOnDevice()
        resolve({ ok: false, error: { code: 'TIMEOUT', message: `命令 ${method} 超时`, retryable: true } })
      }, deadline)
      const onAbort = () => {
        clearTimeout(timer)
        session.pending.delete(commandId)
        cancelOnDevice()
        resolve({ ok: false, error: { code: 'CANCELLED', message: '调用已取消', retryable: false } })
      }
      signal.addEventListener('abort', onAbort, { once: true })
      session.pending.set(commandId, {
        settle: resolve,
        timer,
        detach: () => {
          signal.removeEventListener('abort', onAbort)
        },
      })
    })
    session.send({ type: 'command', commandId, method, params, deadlineMs: deadline })
    // Annotated: the outcome is settled from the result call, the deadline, and
    // the disconnect path, and only the last two narrow to a failure.
    const settled: CommandOutcome = await outcome
    if (settled.ok) return settled.value ?? null
    const { code, message, retryable } = settled.error
    if (code === 'TIMEOUT') throw new PhoneUseError('phone/timeout', message)
    if (code === 'DISCONNECTED') throw new PhoneUseError('phone/disconnected', message)
    if (code === 'CANCELLED') throw new PhoneUseError('phone/rejected', '调用已取消')
    throw Object.assign(new Error(message), { code, retryable })
  }

  /** Fail every command and detach every runner. */
  dispose(): void {
    for (const session of this.sessions.values()) session.close('Host 正在关闭')
    this.sessions.clear()
  }

  private byAttach(attachId: string): Session | undefined {
    for (const session of this.sessions.values()) {
      if (session.attachId === attachId) return session
    }
    return undefined
  }
}
