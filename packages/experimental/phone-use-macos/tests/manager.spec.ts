/** The watch loop against recorded tool output: no phone, no Xcode, no clock. */
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DeviceManager } from '../src/manager.ts'
import type { ManagerConfig } from '../src/manager.ts'
import type { CommandResult, CommandRunner, CommandSpec } from '../src/types.ts'
import { DeviceManagerError } from '../src/types.ts'

const UDID = '00008130-000829091E52001C'
const DEVICE_JSON = JSON.stringify({
  result: {
    devices: [{
      identifier: UDID,
      deviceProperties: { name: '测试 iPhone', osVersionNumber: '26.5.2' },
      connectionProperties: { transportType: 'wired', tunnelState: 'connected' },
    }],
  },
})

/** A runner that answers by command prefix and records what it was asked to do. */
class FakeRunner implements CommandRunner {
  readonly calls: CommandSpec[] = []
  readonly overrides = new Map<string, CommandResult>()

  answer(prefix: string, result: Partial<CommandResult>): void {
    this.overrides.set(prefix, { code: result.code ?? 0, stdout: result.stdout ?? '', stderr: result.stderr ?? '' })
  }

  run(spec: CommandSpec, _signal: AbortSignal): Promise<CommandResult> {
    this.calls.push(spec)
    const key = spec.argv.slice(0, 3).join(' ')
    for (const [prefix, result] of this.overrides) {
      if (key.startsWith(prefix)) return Promise.resolve(result)
    }
    if (spec.argv[0] === 'security') {
      // The manager reads the profile the build produced; echo the fixture back.
      const path = spec.argv.at(-1) ?? ''
      try {
        return Promise.resolve({ code: 0, stdout: readFileSync(path, 'utf8'), stderr: '' })
      } catch {
        return Promise.resolve({ code: 1, stdout: '', stderr: 'missing profile' })
      }
    }
    if (spec.argv[0] === 'xcode-select') return Promise.resolve({ code: 0, stdout: '/Applications/Xcode.app/Contents/Developer\n', stderr: '' })
    if (spec.argv[0] === 'xcrun' && spec.argv[2] === 'list') return Promise.resolve({ code: 0, stdout: DEVICE_JSON, stderr: '' })
    return Promise.resolve({ code: 0, stdout: '', stderr: '' })
  }
}

function workspace(withXctestrun: boolean, expiry = '2026-12-01T00:00:00Z'): { dir: string; derived: string } {
  const dir = mkdtempSync(join(tmpdir(), 'phone-manager-'))
  const derived = join(dir, '.derived')
  mkdirSync(join(derived, 'Build', 'Products'), { recursive: true })
  if (withXctestrun) writeFileSync(join(derived, 'Build', 'Products', 'TomatoRunner_iphoneos26.5-arm64.xctestrun'), '{}')
  mkdirSync(join(derived, 'Build', 'Products', 'Debug-iphoneos', 'TomatoRemote.app'), { recursive: true })
  writeFileSync(
    join(derived, 'Build', 'Products', 'Debug-iphoneos', 'TomatoRemote.app', 'embedded.mobileprovision'),
    `<plist><dict><key>ExpirationDate</key><date>${expiry}</date></dict></plist>`,
  )
  return { dir, derived }
}

function config(dir: string, derived: string, overrides: Partial<ManagerConfig> = {}): ManagerConfig {
  return {
    iosProjectDir: dir,
    derivedDataDir: derived,
    renewBeforeHours: 48,
    checkIntervalMs: 0,
    launchBackoffMs: [5_000],
    xcodebuildTimeoutMs: 90_000,
    transport: 'usb',
    relayPort: 18_200,
    relayScript: join(dir, 'tests/usbmux-relay.mjs'),
    credentialEnv: 'TOMATO_PHONE_CREDENTIAL',
    ...overrides,
  }
}

const roots: AbortController[] = []
function controller(): AbortController {
  const value = new AbortController()
  roots.push(value)
  return value
}

afterEach(() => {
  for (const root of roots.splice(0)) root.abort()
  vi.useRealTimers()
})

describe('DeviceManager', () => {
  it('refuses a toolchain that is not full Xcode', async () => {
    const runner = new FakeRunner()
    runner.answer('xcode-select', { code: 0, stdout: '/Library/Developer/CommandLineTools\n' })
    const { dir, derived } = workspace(true)
    const manager = new DeviceManager(config(dir, derived), runner)
    await expect(manager.doctor(controller().signal)).rejects.toBeInstanceOf(DeviceManagerError)
  })

  it('launches a serving runner and starts the USB relay', async () => {
    const runner = new FakeRunner()
    const { dir, derived } = workspace(true, '2026-12-01T00:00:00Z')
    const manager = new DeviceManager(config(dir, derived), runner, () => new Date('2026-11-11T00:00:00Z'))

    const result = await manager.pass(controller().signal)
    expect(result.action).toMatch(/^launch/)
    expect(result.status.runner).toBe('launching')

    const launch = runner.calls.find(call => call.argv[0] === 'xcodebuild' && call.argv[1] === 'test-without-building')
    expect(launch?.argv).toContain(`id=${UDID}`)
    expect(launch?.detachAfterMs).toBe(20_000)
    // The runner always serves; the USB transport never asks it to dial out.
    expect(launch?.env?.TOMATO_RUNNER_SERVE).toBe('1')
    expect(launch?.env?.TOMATO_HOST_BASE).toBeUndefined()
    const relay = runner.calls.find(call => call.argv[1]?.endsWith('usbmux-relay.mjs'))
    expect(relay?.argv).toEqual([process.execPath, join(dir, 'tests/usbmux-relay.mjs'), '18200', '8200'])
  })

  it('renews and reinstalls both applications before launching an expired profile', async () => {
    const runner = new FakeRunner()
    const { dir, derived } = workspace(true, '2026-11-12T00:00:00Z')
    const manager = new DeviceManager(config(dir, derived), runner, () => new Date('2026-11-11T00:00:00Z'))

    const result = await manager.pass(controller().signal)
    expect(result.action).toMatch(/^renew/)
    const build = runner.calls.find(call => call.argv.includes('build-for-testing'))
    expect(build?.argv).toContain('-allowProvisioningUpdates')
    const installs = runner.calls.filter(call => call.argv[0] === 'xcrun' && call.argv[3] === 'install')
    expect(installs.map(call => call.argv.at(-1))).toEqual([
      join(derived, 'Build/Products/Debug-iphoneos/TomatoRemote.app'),
      join(derived, 'Build/Products/Debug-iphoneos/TomatoRunner-Runner.app'),
    ])
  })

  it('waits instead of relaunching while a launch is in flight', async () => {
    const runner = new FakeRunner()
    const { dir, derived } = workspace(true, '2026-12-01T00:00:00Z')
    const manager = new DeviceManager(config(dir, derived), runner, () => new Date('2026-11-11T00:00:00Z'))
    await manager.launch(controller().signal)

    const result = await manager.pass(controller().signal)
    expect(result.action).toMatch(/^wait/)
    expect(result.status.runner).toBe('launching')
  })

  it('reports a failed launch and backs off instead of hammering the phone', async () => {
    const runner = new FakeRunner()
    runner.answer('xcodebuild test-without-building', { code: 65, stderr: '设备已锁定' })
    const { dir, derived } = workspace(true, '2026-12-01T00:00:00Z')
    let now = new Date('2026-11-11T00:00:00Z')
    const manager = new DeviceManager(config(dir, derived), runner, () => now)

    const first = await manager.pass(controller().signal)
    expect(first.action).toMatch(/^launch/)
    expect(first.status.runner).toBe('absent')
    expect(first.status.lastError).toContain('设备已锁定')

    const second = await manager.pass(controller().signal)
    expect(second.action).toBe('backoff')

    now = new Date('2026-11-11T00:10:00Z')
    const third = await manager.pass(controller().signal)
    expect(third.action).toMatch(/^launch/)
  })

  it('waits for an offline phone without launching anything', async () => {
    const runner = new FakeRunner()
    runner.answer('xcrun devicectl list', { code: 0, stdout: JSON.stringify({ result: { devices: [] } }) })
    const { dir, derived } = workspace(true)
    const manager = new DeviceManager(config(dir, derived), runner)

    const result = await manager.pass(controller().signal)
    expect(result.action).toMatch(/^wait/)
    expect(runner.calls.some(call => call.argv[0] === 'xcodebuild')).toBe(false)
  })
})
