/**
 * The device manager: doctor, renew, install, launch, and watch.
 *
 * It exists because a free developer profile on iOS expires after seven days
 * and a reboot drops the mounted developer image. Both failures look like "the
 * runner stopped" from the Host, and both are repaired from the Mac.
 * @module @tomato/experimental-phone-use-macos/src/manager
 */

import { readdirSync } from 'node:fs'
import { nextAction, parseDeviceList, parseProfileExpiry } from './decide.ts'
import type { CommandResult, CommandRunner, CommandSpec, DeviceReading, DeviceStatus } from './types.ts'
import { DeviceManagerError } from './types.ts'

/** Resolved configuration the manager runs with. */
export interface ManagerConfig {
  /** Absolute path to `apps/ios`. */
  readonly iosProjectDir: string
  /** Device to manage; omitted when exactly one phone is attached. */
  readonly udid?: string
  /** Derived data directory for the runner build. */
  readonly derivedDataDir: string
  /** Renew when the profile has less than this many hours left. */
  readonly renewBeforeHours: number
  /** Watch interval in milliseconds; 0 disables the loop. */
  readonly checkIntervalMs: number
  /** Launch backoff stages in milliseconds. */
  readonly launchBackoffMs: readonly number[]
  /** Deadline for one xcodebuild invocation. */
  readonly xcodebuildTimeoutMs: number
  /** How the Host reaches the runner: a USB relay it owns, or an outbound VPN link. */
  readonly transport: 'usb' | 'vpn'
  /** Loopback port the USB relay listens on. */
  readonly relayPort: number
  /** The repository's usbmuxd relay script, used by the `usb` transport. */
  readonly relayScript: string
  /** Runner environment: Host base URL, used only by the `vpn` transport. */
  readonly hostBase?: string
  /** Runner environment: name of the variable holding the runner credential. */
  readonly credentialEnv: string
  /** Runner environment: this device's Host identity. */
  readonly deviceId?: string
}

/** What the manager reports after one pass. */
export interface PassResult {
  readonly action: string
  readonly status: DeviceStatus
}

/** One managed phone. */
export class DeviceManager {
  private status: DeviceStatus = {
    online: false,
    connection: 'offline',
    locked: false,
    runner: 'absent',
    checkedAt: new Date().toISOString(),
  }
  private readonly failures: { readonly at: Date; readonly reason: string }[] = []
  private timer: ReturnType<typeof setInterval> | undefined
  private running = false

  /**
   * @param config - resolved deployment configuration.
   * @param runner - command runner, real or recorded.
   * @param now - clock, injectable for tests.
   */
  constructor(
    private readonly config: ManagerConfig,
    private readonly runner: CommandRunner,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /**
   * Current reading.
   * @returns the runner's latest status.
   */
  read(): DeviceStatus {
    return this.status
  }

  /**
   * Check the toolchain and the attached phones.
   * @param signal - cancellation.
   * @returns the resolved device, or a failure naming what is missing.
   */
  async doctor(signal: AbortSignal): Promise<DeviceReading> {
    const xcode = await this.run({ argv: ['xcode-select', '-p'], timeoutMs: 15_000 }, signal)
    if (xcode.code !== 0) {
      throw new DeviceManagerError('phoneDevice/missing-xcode', '没有可用的 Xcode 开发者目录，运行 xcode-select --install 或在 Xcode 设置里选择命令行工具')
    }
    if (!/Xcode/u.test(xcode.stdout)) {
      throw new DeviceManagerError('phoneDevice/missing-xcode', `当前命令行工具不是完整 Xcode：${xcode.stdout.trim()}`)
    }
    const devices = await this.readDevices(signal)
    const device = this.pick(devices)
    if (device === undefined) {
      throw new DeviceManagerError('phoneDevice/device-not-found', this.config.udid === undefined
        ? '没有已配对的 iPhone'
        : `找不到设备 ${this.config.udid}`)
    }
    return device
  }

  /**
   * Rebuild, reinstall, and relaunch the runner on the phone.
   * @param signal - cancellation.
   * @returns the refreshed status.
   */
  async renew(signal: AbortSignal): Promise<DeviceStatus> {
    const device = await this.doctor(signal)
    const build = await this.run({
      argv: ['xcodebuild', '-project', 'TomatoRemote.xcodeproj', '-scheme', 'TomatoRunner', '-destination', `id=${device.udid}`, '-derivedDataPath', this.config.derivedDataDir, '-allowProvisioningUpdates', 'build-for-testing'],
      cwd: this.config.iosProjectDir,
      timeoutMs: this.config.xcodebuildTimeoutMs,
    }, signal)
    if (build.code !== 0) {
      throw new DeviceManagerError('phoneDevice/command-failed', '构建 runner 失败', { stderr: tail(build.stderr) })
    }
    const products = `${this.config.derivedDataDir}/Build/Products`
    for (const [bundle, path] of [
      ['TomatoRemote', `${products}/Debug-iphoneos/TomatoRemote.app`],
      ['TomatoRunner-Runner', `${products}/Debug-iphoneos/TomatoRunner-Runner.app`],
    ] as const) {
      const installed = await this.run({
        argv: ['xcrun', 'devicectl', 'device', 'install', 'app', '--device', device.udid, path],
        timeoutMs: 300_000,
      }, signal)
      if (installed.code !== 0) {
        throw new DeviceManagerError('phoneDevice/command-failed', `安装 ${bundle} 失败`, { stderr: tail(installed.stderr) })
      }
    }
    this.failures.length = 0
    return this.refresh(device, signal, this.status.runner)
  }

  /**
   * Start the runner for the current credentials.
   * @param signal - cancellation.
   * @returns the refreshed status.
   */
  async launch(signal: AbortSignal): Promise<DeviceStatus> {
    const device = await this.doctor(signal)
    const xctestrun = findXctestrun(this.config.derivedDataDir)
    if (xctestrun === undefined) {
      throw new DeviceManagerError('phoneDevice/command-failed', '没有 .xctestrun 产物，先执行一次 renew（build-for-testing）')
    }
    // The runner always serves; how the Host reaches it differs by transport.
    const env: Record<string, string> = { TOMATO_RUNNER_SERVE: '1' }
    const credential = process.env[this.config.credentialEnv]
    if (credential !== undefined && credential !== '') env.TOMATO_RUNNER_CREDENTIAL = credential
    if (this.config.transport === 'vpn') {
      if (this.config.hostBase !== undefined) env.TOMATO_HOST_BASE = this.config.hostBase
      if (this.config.deviceId !== undefined) env.TOMATO_DEVICE_ID = this.config.deviceId
    }
    const status = await this.refresh(device, signal, 'launching')
    const launch = await this.run({
      argv: ['xcodebuild', 'test-without-building', '-xctestrun', xctestrun, '-destination', `id=${device.udid}`],
      cwd: this.config.iosProjectDir,
      timeoutMs: 120_000,
      // The serving test never exits; wait only long enough to see it start.
      detachAfterMs: 20_000,
      ...Object.keys(env).length === 0 ? {} : { env },
    }, signal)
    // A launched runner keeps serving after xcodebuild reports the session; a
    // non-zero exit here means the phone refused (locked, expired profile).
    if (launch.code !== 0) {
      this.recordFailure(launch.stderr)
      this.status = { ...status, runner: 'absent', lastError: tail(launch.stderr) }
      return this.status
    }
    // `xcodebuild test-without-building` returns only when the test session
    // ends, so a clean exit here means the runner already stopped. The real
    // attach signal is `phone/devices` in the phone-use namespace; this status
    // stops at `launching` rather than claiming a connection it cannot see.
    if (this.config.transport === 'usb') await this.startRelay(signal)
    this.status = { ...status, runner: 'launching' }
    return this.status
  }

  /**
   * One watch pass: choose and perform the next action.
   * @param signal - cancellation.
   * @returns the action taken and the resulting status.
   */
  async pass(signal: AbortSignal): Promise<PassResult> {
    if (this.running) return { action: 'busy', status: this.status }
    this.running = true
    try {
      const devices = await this.readDevices(signal).catch(() => [])
      const device = this.pick(devices)
      const expiresAt = await this.readExpiry(device, signal)
      const action = nextAction({
        device,
        expiresAt,
        renewBeforeHours: this.config.renewBeforeHours,
        runner: this.status.runner,
        now: this.now(),
      })
      switch (action.kind) {
        case 'renew': {
          const status = await this.renew(signal)
          return { action: `renew: ${action.reason}`, status }
        }
        case 'launch': {
          if (this.backingOff()) return { action: 'backoff', status: this.status }
          const status = await this.launch(signal)
          return { action: `launch: ${action.reason}`, status }
        }
        case 'wait': {
          const status = device === undefined
            ? (this.status = { ...this.status, online: false, connection: 'offline', checkedAt: this.now().toISOString() })
            : await this.refresh(device, signal, this.status.runner)
          return { action: `wait: ${action.reason}`, status }
        }
        case 'idle':
        default: {
          const status = device === undefined ? this.status : await this.refresh(device, signal, 'attached')
          return { action: 'idle', status }
        }
      }
    } finally {
      this.running = false
    }
  }

  /**
   * Start the USB relay that lets the Host dial the runner.
   *
   * The runner listens on its own loopback; usbmuxd carries that port to a Mac
   * loopback port, which needs no VPN and no Local Network permission — the
   * permission iOS never grants a UI-test runner for outbound traffic.
   * @param signal - cancellation.
   */
  private async startRelay(signal: AbortSignal): Promise<void> {
    const result = await this.runner.run({
      argv: [process.execPath, this.config.relayScript, String(this.config.relayPort), String(PhoneRunnerPort)],
      timeoutMs: 30_000,
      // It listens until stopped; leave it running.
      detachAfterMs: 1_500,
    }, signal)
    if (result.code !== 0) {
      this.status = { ...this.status, lastError: `USB 转发没有启动：${result.stderr || result.stdout}` }
    }
  }

  /**
   * Start the watch loop; a no-op when the interval is zero.
   * @param signal - aborts the pass this manager runs.
   */
  start(signal: AbortSignal): void {
    if (this.config.checkIntervalMs === 0 || this.timer !== undefined) return
    this.timer = setInterval(() => {
      void this.pass(signal).catch(() => {})
    }, this.config.checkIntervalMs)
  }

  /** Stop the watch loop. */
  stop(): void {
    if (this.timer !== undefined) clearInterval(this.timer)
    this.timer = undefined
  }

  // MARK: - Steps

  private async refresh(device: DeviceReading, signal: AbortSignal, runner: DeviceStatus['runner']): Promise<DeviceStatus> {
    const expiresAt = await this.readExpiry(device, signal)
    const next: DeviceStatus = {
      udid: device.udid,
      deviceName: device.name,
      online: device.state === 'connected',
      connection: device.transport === 'wired' ? 'usb' : device.transport === 'wifi' ? 'wifi' : 'offline',
      locked: this.status.locked,
      runner,
      ...expiresAt === undefined ? {} : { profileExpiresAt: expiresAt.toISOString() },
      checkedAt: this.now().toISOString(),
    }
    this.status = next
    return next
  }

  private async readDevices(signal: AbortSignal): Promise<DeviceReading[]> {
    const result = await this.run({
      argv: ['xcrun', 'devicectl', 'list', 'devices', '--json-output', '/dev/stdout'],
      timeoutMs: 60_000,
    }, signal)
    if (result.code !== 0) {
      throw new DeviceManagerError('phoneDevice/command-failed', 'devicectl list devices 失败', { stderr: tail(result.stderr) })
    }
    const start = result.stdout.indexOf('{')
    const end = result.stdout.lastIndexOf('}')
    if (start < 0 || end <= start) return []
    try {
      return parseDeviceList(result.stdout.slice(start, end + 1))
    } catch {
      return []
    }
  }

  private pick(devices: readonly DeviceReading[]): DeviceReading | undefined {
    if (this.config.udid !== undefined) return devices.find(device => device.udid === this.config.udid)
    return devices.length === 1 ? devices[0] : devices.find(device => device.state === 'connected')
  }

  private async readExpiry(device: DeviceReading | undefined, signal: AbortSignal): Promise<Date | undefined> {
    if (device === undefined) return undefined
    const app = `${this.config.derivedDataDir}/Build/Products/Debug-iphoneos/TomatoRemote.app/embedded.mobileprovision`
    const decoded = await this.run({ argv: ['security', 'cms', '-D', '-i', app], timeoutMs: 30_000 }, signal).catch(() => undefined)
    if (decoded === undefined) return undefined
    if (decoded.code !== 0) return undefined
    return parseProfileExpiry(decoded.stdout)
  }

  private backingOff(): boolean {
    const last = this.failures.at(-1)
    if (last === undefined) return false
    const index = Math.min(this.failures.length, this.config.launchBackoffMs.length) - 1
    const wait = this.config.launchBackoffMs[index] ?? 0
    return this.now().getTime() - last.at.getTime() < wait
  }

  private recordFailure(reason: string): void {
    this.failures.push({ at: this.now(), reason: reason.slice(-500) })
    if (this.failures.length > 8) this.failures.shift()
  }

  private async run(spec: CommandSpec, signal: AbortSignal): Promise<CommandResult> {
    const result = await this.runner.run(spec, signal)
    if (result.code !== 0) {
      this.status = { ...this.status, lastError: tail(result.stderr) }
    }
    return result
  }
}

/** The port the runner listens on inside the phone. */
const PhoneRunnerPort = 8200

/** Keep the last `limit` characters of a diagnostic. */
function tail(text: string, limit = 2000): string {
  return text.length <= limit ? text : text.slice(-limit)
}

/**
 * Find the newest `.xctestrun` under the derived data products.
 * @param derivedDataDir - derived data directory the build used.
 * @returns the file path, or undefined when the build never ran.
 */
function findXctestrun(derivedDataDir: string): string | undefined {
  try {
    const entries = readdirSync(`${derivedDataDir}/Build/Products`)
    const match = entries.filter(entry => entry.endsWith('.xctestrun')).sort().at(-1)
    return match === undefined ? undefined : `${derivedDataDir}/Build/Products/${match}`
  } catch {
    return undefined
  }
}
