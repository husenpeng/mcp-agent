/**
 * Physical memory and swap occupancy from the platform's own accounting:
 * `vm_stat` and `vm.swapusage` on macOS, `/proc/meminfo` on Linux, and the
 * `node:os` totals elsewhere. Every parser is pure so the mapping is pinned
 * against captured command output.
 * @module @tomato/api-system-monitor-controller/collect/memory
 */

import { readFile } from 'node:fs/promises'
import { freemem, totalmem } from 'node:os'
import type { MemoryReading } from '../types.ts'
import type { CommandRunner } from './command.ts'

/** Bytes in the kB unit the kernel reports memory pages and sizes in. */
const KIB = 1024

/** `vm_stat`'s header line naming the page size. */
const VM_STAT_PAGE_SIZE = /page size of (\d+) bytes/

/** `vm.swapusage`'s total field, with its decimal value and optional unit suffix. */
const SWAP_TOTAL = /total\s*=\s*(\d+(?:\.\d+)?)\s*([KMGT])?/i

/** `vm.swapusage`'s used field, with its decimal value and optional unit suffix. */
const SWAP_USED = /used\s*=\s*(\d+(?:\.\d+)?)\s*([KMGT])?/i

/** Byte multiplier of each `vm.swapusage` unit suffix. */
const SWAP_UNIT_BYTES: Readonly<Record<string, number>> = {
  K: KIB,
  M: KIB ** 2,
  G: KIB ** 3,
  T: KIB ** 4,
}

/**
 * Parse macOS `vm_stat` output.
 *
 * The header carries the page size; every page-count line becomes one entry
 * keyed by its label without the surrounding quotes, which is why keys such as
 * `Translation faults` keep their space. Lines without a count are ignored.
 * @param text - standard output of `vm_stat`.
 * @returns the reported page size in bytes and the page counts by label.
 */
export function parseVmStat(text: string): { pageSize: number; pages: Readonly<Record<string, number>> } {
  const pageSize = VM_STAT_PAGE_SIZE.exec(text)?.[1]
  const pages: Record<string, number> = {}
  for (const line of text.split('\n')) {
    const colon = line.indexOf(':')
    if (colon === -1) continue
    const key = unquoteLabel(line.slice(0, colon).trim())
    const count = line.slice(colon + 1).trim().replace(/\.$/, '')
    if (key === '' || !/^\d+$/.test(count)) continue
    pages[key] = Number.parseInt(count, 10)
  }
  return { pageSize: pageSize === undefined ? 0 : Number.parseInt(pageSize, 10), pages }
}

/**
 * Parse macOS `sysctl -n vm.swapusage` output, such as
 * `total = 2048.00M  used = 870.56M  free = 1177.44M  (encrypted)`.
 *
 * Both fields are decimal values with an optional K/M/G/T suffix, so the byte
 * counts are rounded; a value without a suffix counts as bytes. A field the
 * output omits counts as zero.
 * @param text - standard output of `sysctl -n vm.swapusage`.
 * @returns configured and in-use swap bytes.
 */
export function parseSwapUsage(text: string): { totalBytes: number; usedBytes: number } {
  return { totalBytes: swapBytes(SWAP_TOTAL.exec(text)), usedBytes: swapBytes(SWAP_USED.exec(text)) }
}

/**
 * Parse Linux `/proc/meminfo` into its numeric fields.
 *
 * Values stay in the kernel's kB unit, matching the file, and keys keep their
 * exact spelling such as `MemAvailable` and `SwapFree`.
 * @param text - contents of `/proc/meminfo`.
 * @returns one entry per reported field, in kB.
 */
export function parseMeminfo(text: string): Record<string, number> {
  const values: Record<string, number> = {}
  for (const line of text.split('\n')) {
    const colon = line.indexOf(':')
    if (colon === -1) continue
    const kilobytes = /^(\d+)(?:\s*kB)?$/.exec(line.slice(colon + 1).trim())?.[1]
    if (kilobytes === undefined) continue
    values[line.slice(0, colon).trim()] = Number.parseInt(kilobytes, 10)
  }
  return values
}

/**
 * Read physical memory and swap for one platform.
 *
 * macOS derives `usedBytes` as application, wired, and compressed pages minus
 * purgeable pages, so purgeable memory is not counted twice in `cachedBytes`.
 * Linux takes `MemTotal` as the capacity and `MemAvailable` as reclaimable.
 * A failure reading the platform's own accounting rejects; the sampler turns
 * that into an `unavailable` entry.
 * @param runner - command runner for the macOS probes.
 * @param platform - platform to read; other platforms use the `node:os` totals.
 * @returns the frame's memory reading.
 */
export async function readMemory(runner: CommandRunner, platform: NodeJS.Platform): Promise<MemoryReading> {
  if (platform === 'darwin') return readDarwinMemory(runner)
  if (platform === 'linux') return readLinuxMemory()
  return readFallbackMemory()
}

/**
 * Read macOS memory accounting from `vm_stat` and `vm.swapusage`.
 * @param runner - command runner for both probes.
 * @returns the macOS memory reading.
 */
async function readDarwinMemory(runner: CommandRunner): Promise<MemoryReading> {
  const [vmStatText, swapText] = await Promise.all([
    runner.run('vm_stat', []),
    runner.run('sysctl', ['-n', 'vm.swapusage']),
  ])
  const { pageSize, pages } = parseVmStat(vmStatText)
  const swap = parseSwapUsage(swapText)
  const bytes = (label: string): number => (pages[label] ?? 0) * pageSize
  const totalBytes = totalmem()
  const appBytes = bytes('Pages active')
  const wiredBytes = bytes('Pages wired down')
  const compressedBytes = bytes('Pages occupied by compressor')
  const purgeableBytes = bytes('Pages purgeable')
  const cachedBytes = bytes('Pages inactive') + bytes('Pages speculative') + purgeableBytes
  const usedBytes = Math.min(Math.max(appBytes + wiredBytes + compressedBytes - purgeableBytes, 0), totalBytes)
  return {
    totalBytes,
    usedBytes,
    freeBytes: totalBytes - usedBytes,
    appBytes,
    wiredBytes,
    compressedBytes,
    cachedBytes,
    swapTotalBytes: swap.totalBytes,
    swapUsedBytes: swap.usedBytes,
  }
}

/**
 * Read Linux memory accounting from `/proc/meminfo`.
 *
 * `usedBytes` is the capacity minus `MemAvailable`; application bytes are the
 * capacity minus free, buffered, and cached pages, so the three buckets stay
 * distinguishable. Wired and compressed memory have no portable Linux
 * equivalent here and report zero.
 * @returns the Linux memory reading.
 */
async function readLinuxMemory(): Promise<MemoryReading> {
  const meminfo = parseMeminfo(await readFile('/proc/meminfo', 'utf8'))
  const kib = (label: string): number => (meminfo[label] ?? 0) * KIB
  const totalBytes = kib('MemTotal')
  const freeKib = kib('MemFree')
  const cachedBytes = kib('Buffers') + kib('Cached')
  // Kernels before 3.14 have no MemAvailable; free plus cache approximates it.
  const availableBytes = (meminfo.MemAvailable ?? meminfo.MemFree ?? 0) * KIB
  const usedBytes = Math.min(Math.max(totalBytes - availableBytes, 0), totalBytes)
  const swapTotalBytes = kib('SwapTotal')
  return {
    totalBytes,
    usedBytes,
    freeBytes: totalBytes - usedBytes,
    appBytes: Math.min(Math.max(totalBytes - freeKib - cachedBytes, 0), totalBytes),
    wiredBytes: 0,
    compressedBytes: 0,
    cachedBytes,
    swapTotalBytes,
    swapUsedBytes: Math.min(Math.max(swapTotalBytes - kib('SwapFree'), 0), swapTotalBytes),
  }
}

/**
 * Read memory from the portable `node:os` totals, without platform detail.
 * @returns the fallback memory reading, with the detailed buckets at zero.
 */
function readFallbackMemory(): MemoryReading {
  const totalBytes = totalmem()
  const freeBytes = Math.min(Math.max(freemem(), 0), totalBytes)
  return {
    totalBytes,
    usedBytes: totalBytes - freeBytes,
    freeBytes,
    appBytes: 0,
    wiredBytes: 0,
    compressedBytes: 0,
    cachedBytes: 0,
    swapTotalBytes: 0,
    swapUsedBytes: 0,
  }
}

/**
 * Convert one `vm.swapusage` field to bytes; a value with no suffix counts as bytes.
 * @param match - a matched field with its value and optional unit suffix, or null.
 * @returns the rounded byte count, or zero when the field is absent.
 */
function swapBytes(match: RegExpExecArray | null): number {
  const value = match?.[1] ?? '0'
  const unit = match?.[2] ?? ''
  return Math.round(Number.parseFloat(value) * (SWAP_UNIT_BYTES[unit] ?? 1))
}

/**
 * Strip the quotes `vm_stat` places around labels that contain spaces.
 * @param label - label as printed, with or without surrounding quotes.
 * @returns the label without its quotes.
 */
function unquoteLabel(label: string): string {
  return label.startsWith('"') && label.endsWith('"') ? label.slice(1, -1) : label
}
