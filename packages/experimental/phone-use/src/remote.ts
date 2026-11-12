/**
 * The `phone` Remote namespace: one stream for a runner to attach, one unary
 * call to report a command result, one unary call for out-of-band events, and
 * the device list the application and the desktop GUI read.
 * @module @tomato/experimental-phone-use/src/remote
 */

import type { Context } from '@tomato/cordis'
import { Remote, TypertRemoteService } from '@tomato/typert-protocol'
import { PhoneCommandResult as PhoneCommandResultSchema } from './protocol.ts'
import type {
  PhoneAttachRequest, PhoneCommandResult, PhoneDeviceEvent, PhoneDeviceSummary, PhoneDownFrame,
} from './types.ts'
import type { PhoneDevices } from './registry.ts'

declare module '@tomato/cordis' {
  interface Context {
    /** Host phone Remote namespace owner. */
    phoneRemote: PhoneRemote
  }
}

/** Owner of the `phone` namespace. */
export class PhoneRemote extends TypertRemoteService {
  static inject = ['typert']

  /**
   * @param ctx - Host context carrying the Typert registry.
   * @param registry - attached runners and commands in flight.
   */
  constructor(ctx: Context, readonly registry: PhoneDevices) {
    super(ctx, 'phoneRemote', { namespace: 'phone' })
  }

  /**
   * Attach one runner. The stream carries ready, command, cancel, and ping
   * frames; the runner answers each command through `result`.
   * @param request - runner identity and capabilities.
   * @param signal - cancellation owned by the Remote stream carrier.
   * @returns frames for this attachment.
   * @throws RemoteError `phone/refused` when the protocol version disagrees.
   */
  @Remote({ mode: 'stream' })
  attach(request: PhoneAttachRequest, signal: AbortSignal): AsyncIterable<PhoneDownFrame> {
    return this.registry.attach(request, signal)
  }

  /**
   * Settle one command with the outcome the runner reported.
   * @param request - attach, command, and either value or failure.
   */
  @Remote('result')
  result(request: PhoneCommandResult): void {
    this.registry.accept(PhoneCommandResultSchema.parse(request))
  }

  /**
   * Record one out-of-band event from a runner.
   * @param request - attach identity and event kind.
   */
  @Remote('event')
  event(request: PhoneDeviceEvent): void {
    this.registry.event(request)
  }

  /**
   * List every attached device.
   * @returns device summaries in attach order.
   */
  @Remote('devices')
  devices(): PhoneDeviceSummary[] {
    return this.registry.list()
  }
}
