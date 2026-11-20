/**
 * macOS device manager for phone-use: renewal, installation, runner launch, and
 * the health the application's device card shows.
 *
 * A free developer profile expires after seven days and a reboot drops the
 * mounted developer image; from the Host both look like "the runner stopped".
 * This package owns the repair: rebuild and reinstall with provisioning updates,
 * launch the runner with the Host credentials in its environment, and watch.
 * @module @tomato/experimental-phone-use-macos
 */

import { homedir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@tomato/cordis'
import Schema from '@tomato/schemastery'
import type {} from '@tomato/subprocess'
import { DeviceManager } from './manager.ts'
import { PhoneDeviceRemote } from './remote.ts'
import { requireSubprocess, subprocessRunner } from './runner.ts'
import { DeviceManagerError } from './types.ts'

export { DeviceManager } from './manager.ts'
export { PhoneDeviceRemote } from './remote.ts'
export { parseDeviceList, parseProfileExpiry, nextAction } from './decide.ts'
export type { NextAction } from './decide.ts'
export { subprocessRunner } from './runner.ts'
export { DeviceManagerError } from './types.ts'
export type { CommandResult, CommandRunner, CommandSpec, DeviceReading, DeviceStatus } from './types.ts'

/** Plugin configuration. */
export interface Config {
  /** Absolute path to `apps/ios`; the packaged Desktop ships no sources, so it must be set explicitly there. */
  iosProjectDir: string
  /** Device to manage; omitted when exactly one phone is attached. */
  udid?: string
  /** Derived data directory for the runner build. */
  derivedDataDir?: string
  /** Renew when the provisioning profile has less than this many hours left. */
  renewBeforeHours: number
  /** Watch interval in milliseconds; 0 disables the loop. */
  checkIntervalMs: number
  /** Launch backoff stages in milliseconds. */
  launchBackoffMs: number[]
  /** Deadline for one xcodebuild invocation. */
  xcodebuildTimeoutMs: number
  /** How the Host reaches the runner: `usb` owns a usbmuxd relay, `vpn` dials out. */
  transport: 'usb' | 'vpn'
  /** Loopback port the USB relay listens on. */
  relayPort: number
  /** The repository's usbmuxd relay script; defaults to `<iosProjectDir>/tests/usbmux-relay.mjs`. */
  relayScript?: string
  /** Host base URL injected into the runner environment; `vpn` transport only. */
  hostBase?: string
  /** Host-side environment variable holding the runner credential. */
  credentialEnv: string
  /** This device's Host identity; `vpn` transport only. */
  deviceId?: string
}

/** Validated configuration with deployment defaults. */
export const Config: Schema<Config> = Schema.object({
  iosProjectDir: Schema.string().default(''),
  udid: Schema.string(),
  derivedDataDir: Schema.string(),
  renewBeforeHours: Schema.number().step(1).min(0).max(720).default(48),
  checkIntervalMs: Schema.number().step(1).min(0).max(86_400_000).default(300_000),
  launchBackoffMs: Schema.array(Schema.number()).default([5_000, 60_000, 300_000, 900_000]),
  xcodebuildTimeoutMs: Schema.number().step(1).min(60_000).max(3_600_000).default(900_000),
  transport: Schema.union(['usb', 'vpn']).default('usb'),
  relayPort: Schema.number().step(1).min(1024).max(65_535).default(18_200),
  relayScript: Schema.string(),
  hostBase: Schema.string(),
  credentialEnv: Schema.string().default('TOMATO_PHONE_CREDENTIAL'),
  deviceId: Schema.string(),
})

export const name = 'phone-use-macos'
export const inject = ['subprocess']

/**
 * Mount the manager and its Remote namespace.
 * @param ctx - Host context with `subprocess` and the Typert registry.
 * @param config - validated paths and policy.
 * @throws DeviceManagerError `phoneDevice/not-macos` off macOS.
 */
export function apply(ctx: Context, config: Config): void {
  if (process.platform !== 'darwin') {
    throw new DeviceManagerError('phoneDevice/not-macos', '手机设备管家只能在 macOS 上运行')
  }
  if (config.iosProjectDir === '') {
    throw new DeviceManagerError('phoneDevice/bundled-runtime', 'iosProjectDir 未设置：打包后的 Desktop 不含源码，需要在配置里指向 apps/ios')
  }
  const runner = subprocessRunner(requireSubprocess(ctx))
  const manager = new DeviceManager({
    iosProjectDir: config.iosProjectDir,
    ...config.udid === undefined ? {} : { udid: config.udid },
    derivedDataDir: config.derivedDataDir ?? join(config.iosProjectDir, '.derived'),
    renewBeforeHours: config.renewBeforeHours,
    checkIntervalMs: config.checkIntervalMs,
    launchBackoffMs: config.launchBackoffMs,
    xcodebuildTimeoutMs: config.xcodebuildTimeoutMs,
    transport: config.transport,
    relayPort: config.relayPort,
    relayScript: config.relayScript ?? join(config.iosProjectDir, 'tests/usbmux-relay.mjs'),
    ...config.hostBase === undefined ? {} : { hostBase: config.hostBase },
    credentialEnv: config.credentialEnv,
    ...config.deviceId === undefined ? {} : { deviceId: config.deviceId },
  }, runner)
  new PhoneDeviceRemote(ctx, manager)
  const lifetime = new AbortController()
  ctx.effect(() => {
    manager.start(lifetime.signal)
    return () => {
      lifetime.abort()
      manager.stop()
    }
  })
}

/**
 * Default database-free path used only by diagnostics.
 * @returns the Xcode DerivedData directory under the current home.
 */
export const defaultDerivedData = (): string => join(homedir(), 'Library/Developer/Xcode/DerivedData')
