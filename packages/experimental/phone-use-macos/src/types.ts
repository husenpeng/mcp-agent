/**
 * Device-manager vocabulary: what a command invocation and a device reading are.
 * @module @tomato/experimental-phone-use-macos/src/types
 */

/** Lossless JSON, owned here so Remote boundary types stay with their publisher. */
export type PhoneDeviceJson = null | boolean | number | string | PhoneDeviceJson[] | { [key: string]: PhoneDeviceJson }

/** One command the manager runs. */
export interface CommandSpec {
  readonly argv: readonly string[]
  readonly cwd?: string
  readonly env?: Readonly<Record<string, string>>
  readonly timeoutMs: number
  /**
   * Return this many milliseconds after the process starts, leaving it running.
   * A serving runner never exits, so the caller needs a bounded wait that does
   * not kill the session it just started.
   */
  readonly detachAfterMs?: number
}

/** Collected result of one command. */
export interface CommandResult {
  readonly code: number
  readonly stdout: string
  readonly stderr: string
}

/** Runs one command to completion with a deadline. */
export interface CommandRunner {
  /**
   * @param spec - argv, directory, environment, and deadline.
   * @param signal - caller cancellation.
   * @returns exit code and both collected streams.
   */
  run(spec: CommandSpec, signal: AbortSignal): Promise<CommandResult>
}

/** One installed phone, as `devicectl` reports it. */
export interface DeviceReading {
  readonly udid: string
  readonly name: string
  readonly osVersion: string
  readonly state: 'connected' | 'unavailable' | 'unknown'
  readonly transport: 'wired' | 'wifi' | 'none'
}

/** What the manager knows about the phone right now. */
export interface DeviceStatus {
  readonly udid?: string
  readonly deviceName?: string
  readonly online: boolean
  readonly connection: 'usb' | 'wifi' | 'offline'
  readonly locked: boolean
  readonly runner: 'attached' | 'launching' | 'absent'
  readonly profileExpiresAt?: string
  readonly lastError?: string
  readonly checkedAt: string
}

/** A failure the manager itself raises. */
export class DeviceManagerError extends Error {
  /**
   * @param code - stable code.
   * @param message - actionable diagnostic.
   * @param details - optional structured context.
   */
  constructor(readonly code: DeviceManagerErrorCode, message: string, readonly details?: Record<string, unknown>) {
    super(message)
    this.name = 'DeviceManagerError'
  }
}

/** Failure codes this package raises. */
export type DeviceManagerErrorCode =
  | 'phoneDevice/not-macos'
  | 'phoneDevice/missing-xcode'
  | 'phoneDevice/device-not-found'
  | 'phoneDevice/bundled-runtime'
  | 'phoneDevice/command-failed'
