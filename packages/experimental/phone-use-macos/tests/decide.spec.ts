/** Recorded tool output drives every decision; these are the recordings. */
import { describe, expect, it } from 'vitest'
import { nextAction, parseDeviceList, parseProfileExpiry } from '../src/decide.ts'
import type { DeviceReading } from '../src/types.ts'

const DEVICECTL = JSON.stringify({
  result: {
    devices: [
      {
        identifier: 'C592B0A9-DF92-54AF-AD55-9A0A26F523A4',
        hardwareProperties: { udid: '00008130-000829091E52001C' },
        deviceProperties: { name: '测试 iPhone', osVersionNumber: '26.5.2' },
        connectionProperties: { transportType: 'wired', tunnelState: 'connected' },
      },
      {
        identifier: 'E04D7F03',
        deviceProperties: { name: 'Simulator', osVersionNumber: '27.0' },
        connectionProperties: { transportType: 'sameMachine', tunnelState: 'disconnected' },
      },
    ],
  },
})

const PROFILE = `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict>
  <key>Name</key><string>iOS Team Provisioning Profile</string>
  <key>ExpirationDate</key><date>2026-11-18T09:12:33Z</date>
</dict></plist>`

const device: DeviceReading = {
  udid: '00008130-000829091E52001C',
  name: '测试 iPhone',
  osVersion: '26.5.2',
  state: 'connected',
  transport: 'wired',
}

describe('device readings', () => {
  it('reads name, version, state, and transport from devicectl output', () => {
    const devices = parseDeviceList(DEVICECTL)
    expect(devices).toHaveLength(2)
    expect(devices[0]).toMatchObject({ name: '测试 iPhone', osVersion: '26.5.2', state: 'connected', transport: 'wired' })
    expect(devices[1]).toMatchObject({ state: 'unavailable', transport: 'wifi' })
    // A paired device whose tunnel never connected stays unavailable.
    expect(parseDeviceList(JSON.stringify({ result: { devices: [{
      identifier: 'X', deviceProperties: { name: 'Stale' },
      connectionProperties: { transportType: 'wired', pairingState: 'paired', tunnelState: 'disconnected' },
    }] } }))[0]).toMatchObject({ state: 'unavailable' })
  })

  it('reads the profile expiry, and reports absence instead of inventing one', () => {
    expect(parseProfileExpiry(PROFILE)?.toISOString()).toBe('2026-11-18T09:12:33.000Z')
    expect(parseProfileExpiry('<plist></plist>')).toBeUndefined()
  })
})

describe('next action', () => {
  const now = new Date('2026-11-11T00:00:00Z')
  const base = { device, renewBeforeHours: 48, runner: 'absent' as const, now }

  it('launches a missing runner while the profile is fresh', () => {
    expect(nextAction({ ...base, expiresAt: new Date('2026-11-18T00:00:00Z') })).toEqual({ kind: 'launch', reason: 'runner 没有连接' })
  })

  it('renews before launching when the profile is inside the window', () => {
    // Renewal runs first because a launch on an expired profile only fails.
    expect(nextAction({ ...base, expiresAt: new Date('2026-11-12T00:00:00Z') })).toMatchObject({ kind: 'renew' })
  })

  it('does nothing while the runner is attached and the profile is fresh', () => {
    expect(nextAction({ ...base, runner: 'attached', expiresAt: new Date('2026-11-18T00:00:00Z') })).toEqual({ kind: 'idle' })
  })

  it('waits for an offline phone instead of launching', () => {
    expect(nextAction({ ...base, device: undefined, expiresAt: undefined })).toMatchObject({ kind: 'wait' })
    expect(nextAction({ ...base, device: { ...device, state: 'unavailable' }, expiresAt: undefined })).toMatchObject({ kind: 'wait' })
  })

  it('does not relaunch while a launch is already in flight', () => {
    expect(nextAction({ ...base, runner: 'launching', expiresAt: undefined })).toMatchObject({ kind: 'wait' })
  })
})
