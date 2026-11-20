/**
 * Portable power state: battery charge and charging status from `pmset` on
 * macOS and the power-supply class on Linux, with a coarse thermal-pressure
 * proxy for platforms that expose one.
 * @module @tomato/api-system-monitor-controller/collect/power
 */

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { PowerReading } from '../types.ts'
import type { CommandRunner } from './command.ts'

/** Directory the Linux power class exposes one entry per supply under. */
const POWER_CLASS_PATH = '/sys/class/power_supply'

/** Entry-name prefix of Linux battery supplies. */
const BATTERY_PREFIX = 'BAT'

/** Percentage of the `pmset -g batt` battery line. */
const BATTERY_PERCENT = /(\d+)%/

/** Status word that follows the battery percentage on the same line. */
const BATTERY_STATUS = /%\s*;\s*([^;\n]+)/

/** `pmset -g therm`'s limiter percentage lines, such as `CPU_Speed_Limit = 100`. */
const THERMAL_LIMIT = /[A-Za-z_]\w*_Limit\s*=\s*(\d+)/g

/** Status words that mean the battery is gaining or holding charge on power. */
const CHARGING_STATES = ['charging', 'charged']

/**
 * Parse the battery line of macOS `pmset -g batt`.
 *
 * The line looks like ` -InternalBattery-0 (id=38928483)\t100%; charged; 0:00
 * remaining present: true`. A machine with no battery prints only the
 * `Now drawing from ...` line, so both fields are null there. `charging` and
 * `charged` mean on power; `discharging` does not, even though the word
 * contains `charging`.
 * @param text - standard output of `pmset -g batt`.
 * @returns the charge percentage clamped to 0–100 and the charging state, or
 * nulls when no battery is reported.
 */
export function parsePmsetBatt(text: string): { batteryPercent: number | null; charging: boolean | null } {
  const percent = BATTERY_PERCENT.exec(text)?.[1]
  if (percent === undefined) return { batteryPercent: null, charging: null }
  const batteryPercent = Math.min(Math.max(Number.parseInt(percent, 10), 0), 100)
  const status = (BATTERY_STATUS.exec(text)?.[1] ?? '').toLowerCase().split(/\s+/)
  const charging = CHARGING_STATES.some(state => status.includes(state)) || text.includes('AC Power')
  return { batteryPercent, charging }
}

/**
 * Parse macOS `pmset -g therm` into the frame's coarse thermal pressure.
 *
 * The mapping is deliberately coarse: any reported limiter below 100 means the
 * system is throttling and reports `serious`; limiter lines that exist without
 * a throttling value report `fair`; no limiter line at all — including the all
 * `Note:` output a machine under no pressure prints — reports `nominal`.
 * `pmset` never reports `critical`, which the wire vocabulary reserves.
 * @param text - standard output of `pmset -g therm`.
 * @returns `nominal`, `fair`, or `serious`.
 */
export function parsePmsetTherm(text: string): string {
  let reported = false
  let throttled = false
  for (const match of text.matchAll(THERMAL_LIMIT)) {
    reported = true
    if (Number.parseInt(match[1] as string, 10) < 100) throttled = true
  }
  if (throttled) return 'serious'
  return reported ? 'fair' : 'nominal'
}

/**
 * Read power state for one platform.
 *
 * macOS runs both `pmset` probes, so a failed command rejects and the sampler
 * marks the collector unavailable. Linux reads the first battery supply with a
 * readable capacity; a Host without one — a desktop or container — reports
 * null. Other platforms report null.
 * @param runner - command runner for the macOS probes.
 * @param platform - platform to read.
 * @returns the power reading, or null when the platform reports none.
 */
export async function readPower(
  runner: CommandRunner,
  platform: NodeJS.Platform,
): Promise<PowerReading | null> {
  if (platform === 'darwin') {
    const [batteryText, thermalText] = await Promise.all([
      runner.run('pmset', ['-g', 'batt']),
      runner.run('pmset', ['-g', 'therm']),
    ])
    const battery = parsePmsetBatt(batteryText)
    return {
      batteryPercent: battery.batteryPercent,
      charging: battery.charging,
      thermalPressure: parsePmsetTherm(thermalText),
    }
  }
  if (platform === 'linux') return readLinuxPower()
  return null
}

/**
 * Read the first Linux battery supply that publishes a capacity.
 * @returns the battery reading, or null when no battery is readable.
 */
async function readLinuxPower(): Promise<PowerReading | null> {
  for (const battery of await listBatteries()) {
    const batteryPercent = await readCapacity(battery)
    if (batteryPercent === null) continue
    return {
      batteryPercent: Math.min(Math.max(batteryPercent, 0), 100),
      charging: await readCharging(battery),
      thermalPressure: 'nominal',
    }
  }
  return null
}

/**
 * List the Linux battery supply entries.
 * @returns entry names such as `BAT0`, or an empty list when the class
 * directory is unreadable.
 */
async function listBatteries(): Promise<string[]> {
  let entries: string[]
  try {
    entries = await readdir(POWER_CLASS_PATH)
  } catch {
    // Hosts without a power class (containers, most virtual machines) report no battery.
    return []
  }
  return entries.filter(entry => entry.startsWith(BATTERY_PREFIX))
}

/**
 * Read one battery's capacity percentage.
 * @param battery - power-supply entry name.
 * @returns the reported percentage, or null when it is unreadable or unparsable.
 */
async function readCapacity(battery: string): Promise<number | null> {
  try {
    const percent = Number.parseInt((await readFile(join(POWER_CLASS_PATH, battery, 'capacity'), 'utf8')).trim(), 10)
    return Number.isNaN(percent) ? null : percent
  } catch {
    // Supplies that publish no capacity (for example a UPS) are skipped.
    return null
  }
}

/**
 * Read whether one battery reports itself as charging.
 * @param battery - power-supply entry name.
 * @returns true for `Charging`, false for any other reported status, or null
 * when the status file is unreadable.
 */
async function readCharging(battery: string): Promise<boolean | null> {
  try {
    return (await readFile(join(POWER_CLASS_PATH, battery, 'status'), 'utf8')).trim() === 'Charging'
  } catch {
    // A missing status file leaves the charging state unknown rather than false.
    return null
  }
}
