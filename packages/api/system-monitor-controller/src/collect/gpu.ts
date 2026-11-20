/**
 * Graphics utilization from the platform's driver accounting: the
 * `IOAccelerator` performance statistics on macOS and
 * `gpu_busy_percent` on Linux. Both probes are best-effort — a machine with no
 * GPU, or one that hides it, reports null instead of failing the frame.
 * @module @tomato/api-system-monitor-controller/collect/gpu
 */

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { GpuReading } from '../types.ts'
import type { CommandRunner } from './command.ts'

/** Label that introduces one accelerator's performance dictionary. */
const PERFORMANCE_STATISTICS = '"PerformanceStatistics" = {'

/** Dictionary key holding the overall busy share as a percentage. */
const DEVICE_UTILIZATION = 'Device Utilization %'

/** Dictionary key holding the renderer busy share as a percentage. */
const RENDERER_UTILIZATION = 'Renderer Utilization %'

/** Dictionary key holding the tiler busy share as a percentage. */
const TILER_UTILIZATION = 'Tiler Utilization %'

/** Dictionary key holding the GPU memory in use, in bytes. */
const IN_USE_MEMORY = 'In use system memory'

/** Dictionary key holding the driver-allocated GPU memory, in bytes. */
const ALLOCATED_MEMORY = 'Alloc system memory'

/** Directory the Linux DRM class exposes one entry per graphics card under. */
const DRM_CLASS_PATH = '/sys/class/drm'

/**
 * Parse macOS `ioreg -r -d 1 -w 0 -c IOAccelerator` output.
 *
 * Each accelerator prints one single-line `PerformanceStatistics` dictionary
 * of `"key"=value` pairs with no nested objects, so the first closing brace
 * ends the dictionary. `name` stays empty because `ioreg` does not label the
 * accelerator in a portable way; the caller fills it from the chip name.
 * @param text - standard output of the `ioreg` query.
 * @returns one reading per accelerator dictionary, in the order printed.
 */
export function parseIoregAccelerators(text: string): GpuReading[] {
  const readings: GpuReading[] = []
  for (const line of text.split('\n')) {
    const label = line.indexOf(PERFORMANCE_STATISTICS)
    if (label === -1) continue
    const open = label + PERFORMANCE_STATISTICS.length - 1
    const close = line.indexOf('}', open)
    if (close === -1) continue
    const fields = numericProperties(line.slice(open + 1, close))
    readings.push({
      name: '',
      utilization: percentRatio(fields.get(DEVICE_UTILIZATION)) ?? 0,
      renderer: percentRatio(fields.get(RENDERER_UTILIZATION)),
      tiler: percentRatio(fields.get(TILER_UTILIZATION)),
      inUseMemoryBytes: fields.get(IN_USE_MEMORY) ?? null,
      allocatedMemoryBytes: fields.get(ALLOCATED_MEMORY) ?? null,
    })
  }
  return readings
}

/**
 * Read GPU utilization for one platform.
 *
 * macOS reports the accelerator with the highest utilization under the chip
 * name; Linux reports the first graphics card whose busy percentage is
 * readable, without a name of its own. Any probe failure — no driver, no
 * permission, unparsable output — yields null, never a rejection.
 * @param runner - command runner for the macOS probe.
 * @param platform - platform to read.
 * @param chip - processor marketing name used to label the macOS GPU; empty
 * when unknown, in which case the reading is named `GPU`.
 * @returns the GPU reading, or null when this platform exposes none.
 */
export async function readGpu(
  runner: CommandRunner,
  platform: NodeJS.Platform,
  chip: string,
): Promise<GpuReading | null> {
  if (platform === 'darwin') return readDarwinGpu(runner, chip)
  if (platform === 'linux') return readLinuxGpu()
  return null
}

/**
 * Read the busiest macOS accelerator and label it with the chip name.
 * @param runner - command runner for the `ioreg` query.
 * @param chip - processor marketing name; empty when unknown.
 * @returns the busiest accelerator, named, or null when the query fails or
 * reports no accelerator.
 */
async function readDarwinGpu(runner: CommandRunner, chip: string): Promise<GpuReading | null> {
  let text: string
  try {
    text = await runner.run('ioreg', ['-r', '-d', '1', '-w', '0', '-c', 'IOAccelerator'])
  } catch {
    // A machine whose driver exposes no IOAccelerator class has no reading to report.
    return null
  }
  let busiest: GpuReading | undefined
  for (const reading of parseIoregAccelerators(text)) {
    if (busiest === undefined || reading.utilization > busiest.utilization) busiest = reading
  }
  if (busiest === undefined) return null
  const name = chip.trim() === '' ? 'GPU' : `${chip.trim()} GPU`
  return { ...busiest, name }
}

/**
 * Read the first Linux graphics card that publishes a busy percentage.
 * @returns the card's utilization, or null when no card is readable.
 */
async function readLinuxGpu(): Promise<GpuReading | null> {
  const cards = await listDrmCards()
  for (const card of cards) {
    const busy = await readBusyPercent(card)
    if (busy === null) continue
    return {
      name: 'GPU',
      utilization: Math.min(Math.max(busy / 100, 0), 1),
      renderer: null,
      tiler: null,
      inUseMemoryBytes: null,
      allocatedMemoryBytes: null,
    }
  }
  return null
}

/**
 * List the DRM card entries in ascending numeric order.
 * @returns card names such as `card0`, or an empty list when the directory is
 * unreadable.
 */
async function listDrmCards(): Promise<string[]> {
  let entries: string[]
  try {
    entries = await readdir(DRM_CLASS_PATH)
  } catch {
    // Systems without DRM (containers, headless hosts) expose no class directory.
    return []
  }
  return entries
    .filter(entry => /^card\d+$/.test(entry))
    .sort((left, right) => Number.parseInt(left.slice(4), 10) - Number.parseInt(right.slice(4), 10))
}

/**
 * Read one card's busy percentage.
 * @param card - DRM card entry name.
 * @returns the percentage as reported, or null when the file is unreadable or
 * does not hold a number.
 */
async function readBusyPercent(card: string): Promise<number | null> {
  try {
    const text = await readFile(join(DRM_CLASS_PATH, card, 'device', 'gpu_busy_percent'), 'utf8')
    const percent = Number.parseInt(text.trim(), 10)
    return Number.isNaN(percent) ? null : percent
  } catch {
    // Cards without a busy-percent attribute (or without permission to read it) are skipped.
    return null
  }
}

/**
 * Collect a dictionary's numeric `"key"=value` pairs.
 * @param dict - dictionary text without its surrounding braces.
 * @returns numeric values by key; quoted string values are not collected.
 */
function numericProperties(dict: string): Map<string, number> {
  const values = new Map<string, number>()
  for (const match of dict.matchAll(/"([^"]*)"=(-?\d+(?:\.\d+)?)/g)) {
    // The pattern only matches a quoted key with a numeric value, so both captures are present.
    values.set(match[1] as string, Number.parseFloat(match[2] as string))
  }
  return values
}

/**
 * Convert a reported percentage to a 0–1 share.
 * @param percent - percentage as the driver reports it, or undefined.
 * @returns the clamped share, or null when the driver reported no value.
 */
function percentRatio(percent: number | undefined): number | null {
  if (percent === undefined) return null
  return Math.min(Math.max(percent / 100, 0), 1)
}
