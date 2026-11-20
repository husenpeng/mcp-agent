/**
 * Cumulative interface byte counters, the previous side of the frame's
 * throughput rate: `netstat -ib` on macOS and `/proc/net/dev` on Linux.
 * Loopback traffic is excluded because it never crosses the network.
 * @module @tomato/api-system-monitor-controller/collect/network
 */

import { readFile } from 'node:fs/promises'
import type { CommandRunner } from './command.ts'

/** Cumulative bytes across the non-loopback interfaces. */
export interface NetworkCounters {
  /** Bytes received since boot. */
  readonly receivedBytes: number
  /** Bytes sent since boot. */
  readonly sentBytes: number
}

/** `netstat -ib`'s per-interface link row label, such as `<Link#7>`. */
const LINK_NETWORK = /^<Link#\d+>$/

/** Linux interface whose traffic must not count as network throughput. */
const LOOPBACK = 'lo'

/**
 * Parse macOS `netstat -ib` output.
 *
 * Only `<Link#N>` rows are counter rows; the per-address rows that follow each
 * link row repeat the same counters. The Address column is empty for most link
 * rows and holds a MAC address for physical interfaces, so the numeric columns
 * are read from the end of the row: `... ipkts ierrs ibytes opkts oerrs obytes
 * coll`. Rows for interfaces whose name starts with `lo` are loopback.
 * @param text - standard output of `netstat -ib`.
 * @returns summed receive and transmit bytes across non-loopback interfaces.
 */
export function parseNetstatIb(text: string): NetworkCounters {
  let receivedBytes = 0
  let sentBytes = 0
  for (const line of text.split('\n')) {
    const fields = line.trim().split(/\s+/)
    if (fields.length < 10) continue
    // Past the length check every column is present; the trailing numbers are
    // counted from the end because the Address column may hold a MAC address.
    if (!LINK_NETWORK.test(fields[2] as string)) continue
    if ((fields[0] as string).startsWith(LOOPBACK)) continue
    const received = Number.parseInt(fields[fields.length - 5] as string, 10)
    const sent = Number.parseInt(fields[fields.length - 2] as string, 10)
    if (Number.isNaN(received) || Number.isNaN(sent)) continue
    receivedBytes += received
    sentBytes += sent
  }
  return { receivedBytes, sentBytes }
}

/**
 * Parse Linux `/proc/net/dev` output.
 *
 * Each data line starts with `interface:`; the receive byte count is the first
 * field after the colon and the transmit byte count the ninth. Header lines
 * carry no colon and are ignored.
 * @param text - contents of `/proc/net/dev`.
 * @returns summed receive and transmit bytes across non-loopback interfaces.
 */
export function parseProcNetDev(text: string): NetworkCounters {
  let receivedBytes = 0
  let sentBytes = 0
  for (const line of text.split('\n')) {
    const colon = line.indexOf(':')
    if (colon === -1) continue
    const name = line.slice(0, colon).trim()
    if (name === LOOPBACK) continue
    const fields = line.slice(colon + 1).trim().split(/\s+/)
    const received = Number.parseInt(fields[0] as string, 10)
    const sent = Number.parseInt(fields.at(8) ?? '', 10)
    if (Number.isNaN(received) || Number.isNaN(sent)) continue
    receivedBytes += received
    sentBytes += sent
  }
  return { receivedBytes, sentBytes }
}

/**
 * Read cumulative interface counters for one platform.
 * @param runner - command runner for the macOS probe.
 * @param platform - platform to read; other platforms report no counters.
 * @returns the counters, or null when the platform is unsupported or its
 * counters cannot be read.
 */
export async function readNetworkCounters(
  runner: CommandRunner,
  platform: NodeJS.Platform,
): Promise<NetworkCounters | null> {
  if (platform === 'darwin') {
    try {
      return parseNetstatIb(await runner.run('netstat', ['-ib']))
    } catch {
      // No routing table (or no permission to read it) means no counters this frame.
      return null
    }
  }
  if (platform === 'linux') {
    try {
      return parseProcNetDev(await readFile('/proc/net/dev', 'utf8'))
    } catch {
      // Network namespaces without a procfs mount expose no counter file.
      return null
    }
  }
  return null
}
