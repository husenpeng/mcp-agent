/**
 * Root volume capacity from `statfs`: the bytes a non-privileged writer can
 * still place on the volume the Host runs from.
 * @module @tomato/api-system-monitor-controller/collect/disk
 */

import { statfs } from 'node:fs/promises'
import type { DiskReading } from '../types.ts'

/** Volume Linux and macOS report for the Host's own filesystem. */
const ROOT_MOUNT = '/'

/** Windows system drive when the environment does not name one. */
const DEFAULT_WINDOWS_DRIVE = 'C:\\'

/**
 * Read the capacity of the Host's root volume.
 *
 * macOS and Linux stat `/`; Windows stats the system drive from
 * `SystemDrive`, falling back to `C:\`. A failed stat, or a volume that reports
 * no capacity, yields null so the frame can omit the field instead of
 * publishing a zero-capacity disk.
 * @param platform - platform to read; defaults to this process's platform.
 * @returns the volume's capacity and available bytes, or null when it cannot
 * be read.
 */
export async function readDisk(platform: NodeJS.Platform = process.platform): Promise<DiskReading | null> {
  const mount = platform === 'win32' ? process.env.SystemDrive ?? DEFAULT_WINDOWS_DRIVE : ROOT_MOUNT
  try {
    const stats = await statfs(mount)
    const totalBytes = stats.blocks * stats.bsize
    if (totalBytes <= 0) return null
    return { mount, totalBytes, freeBytes: stats.bavail * stats.bsize }
  } catch {
    // A missing or unmounted root (or a drive letter this Host does not resolve) has no capacity to report.
    return null
  }
}
