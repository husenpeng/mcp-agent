/**
 * Pure decisions: parse what the tools printed, and choose the next action.
 *
 * Keeping these free of I/O is what lets the watch loop be tested against
 * recorded tool output instead of a tethered phone.
 * @module @tomato/experimental-phone-use-macos/src/decide
 */

import type { DeviceReading } from './types.ts'

/** What the watch loop should do next. */
export type NextAction =
  | { readonly kind: 'renew'; readonly reason: string }
  | { readonly kind: 'launch'; readonly reason: string }
  | { readonly kind: 'wait'; readonly reason: string }
  | { readonly kind: 'idle' }

/**
 * Parse `xcrun devicectl list devices --json-output` output.
 * @param json - the tool's JSON document.
 * @returns every device the document mentions.
 */
export function parseDeviceList(json: string): DeviceReading[] {
  const document = JSON.parse(json) as {
    result?: { devices?: Array<Record<string, unknown>> }
  }
  const devices = document.result?.devices ?? []
  return devices.flatMap((entry) => {
    const properties = (entry.deviceProperties ?? {}) as Record<string, unknown>
    const connection = (entry.connectionProperties ?? {}) as Record<string, unknown>
    const hardware = (entry.hardwareProperties ?? {}) as Record<string, unknown>
    // `identifier` is a CoreDevice UUID; `xcodebuild -destination id=` wants the
    // hardware UDID, which only hardwareProperties carries.
    const udid = typeof hardware.udid === 'string'
      ? hardware.udid
      : typeof entry.identifier === 'string' ? entry.identifier : undefined
    const name = typeof properties.name === 'string' ? properties.name : undefined
    if (udid === undefined || name === undefined) return []
    // A paired phone whose tunnel never came up is still unusable: only the
    // tunnel state proves the Host can reach it.
    const state = connection.tunnelState === 'connected' ? 'connected' : 'unavailable'
    const transport = connection.transportType === 'wired'
      ? 'wired'
      : connection.transportType === 'localNetwork' || connection.transportType === 'sameMachine' ? 'wifi' : 'none'
    return [{
      udid,
      name,
      osVersion: typeof properties.osVersionNumber === 'string' ? properties.osVersionNumber : '',
      state,
      transport,
    }]
  })
}

/**
 * Read a provisioning profile's expiry out of its decoded plist text.
 * @param plist - `security cms -D` output, or any XML plist carrying ExpirationDate.
 * @returns the expiry, or undefined when the document has none.
 */
export function parseProfileExpiry(plist: string): Date | undefined {
  const match = /<key>ExpirationDate<\/key>\s*<date>([^<]+)<\/date>/u.exec(plist)
  if (match?.[1] === undefined) return undefined
  const parsed = new Date(match[1])
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

/**
 * Choose the next action for one phone.
 * @param input - device reading, expiry, runner state, and the current time.
 * @returns the action to take now.
 */
export function nextAction(input: {
  readonly device: DeviceReading | undefined
  readonly expiresAt: Date | undefined
  readonly renewBeforeHours: number
  readonly runner: 'attached' | 'launching' | 'absent'
  readonly now: Date
}): NextAction {
  const { device, expiresAt, renewBeforeHours, runner, now } = input
  if (device === undefined || device.state !== 'connected') {
    return { kind: 'wait', reason: '手机不在线或未配对' }
  }
  if (expiresAt !== undefined) {
    const remainingHours = (expiresAt.getTime() - now.getTime()) / 3_600_000
    if (remainingHours <= renewBeforeHours) {
      return { kind: 'renew', reason: `证书还剩 ${Math.max(0, Math.round(remainingHours))} 小时` }
    }
  }
  if (runner === 'attached') return { kind: 'idle' }
  if (runner === 'launching') return { kind: 'wait', reason: 'runner 正在拉起' }
  return { kind: 'launch', reason: 'runner 没有连接' }
}
