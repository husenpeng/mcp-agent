/**
 * The `phoneDevice` Remote namespace: what the application's device card reads
 * and the two repairs it can ask for.
 * @module @tomato/experimental-phone-use-macos/src/remote
 */

import type { Context } from '@tomato/cordis'
import { Remote, TypertRemoteService } from '@tomato/typert-protocol'
import type { DeviceManager } from './manager.ts'
import type { DeviceStatus } from './types.ts'
import { DeviceManagerError } from './types.ts'

declare module '@tomato/cordis' {
  interface Context {
    /** Host device-manager Remote namespace owner. */
    phoneDeviceRemote: PhoneDeviceRemote
  }
}

/** Owner of the `phoneDevice` namespace. */
export class PhoneDeviceRemote extends TypertRemoteService {
  static inject = ['typert']

  /**
   * @param ctx - Host context carrying the Typert registry.
   * @param manager - the managed phone.
   */
  constructor(ctx: Context, private readonly manager: DeviceManager) {
    super(ctx, 'phoneDeviceRemote', { namespace: 'phoneDevice' })
  }

  /**
   * Read the last known device state without touching the phone.
   * @returns the status the watch loop last recorded.
   */
  @Remote('status')
  status(): DeviceStatus {
    return this.manager.read()
  }

  /**
   * Check the toolchain and the attached phones now.
   * @returns the refreshed status.
   * @throws RemoteError `phoneDevice/*` when the toolchain or device is missing.
   */
  @Remote('doctor')
  async doctor(): Promise<DeviceStatus> {
    try {
      await this.manager.doctor(new AbortController().signal)
      const result = await this.manager.pass(new AbortController().signal)
      return result.status
    } catch (error: unknown) {
      throw asRemoteError(error)
    }
  }

  /**
   * Rebuild, reinstall, and relaunch the runner.
   * @returns the refreshed status.
   * @throws RemoteError `phoneDevice/command-failed` when a tool fails.
   */
  @Remote('renew')
  async renew(): Promise<DeviceStatus> {
    try {
      return await this.manager.renew(new AbortController().signal)
    } catch (error: unknown) {
      throw asRemoteError(error)
    }
  }

  /**
   * Launch the runner with the current credentials.
   * @returns the refreshed status.
   * @throws RemoteError `phoneDevice/command-failed` when the launch fails.
   */
  @Remote('relaunch')
  async relaunch(): Promise<DeviceStatus> {
    try {
      return await this.manager.launch(new AbortController().signal)
    } catch (error: unknown) {
      throw asRemoteError(error)
    }
  }
}

/**
 * Map a manager failure onto the wire failure the client sees.
 * @param error - failure raised by the manager.
 * @returns a Remote failure carrying the same code.
 */
function asRemoteError(error: unknown): Error {
  if (error instanceof DeviceManagerError) {
    return Object.assign(new Error(error.message), { code: error.code, details: error.details })
  }
  return error instanceof Error ? error : new Error(String(error))
}
