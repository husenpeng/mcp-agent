/**
 * Highest-CPU processes from `ps`: a portable row set the sampler sorts and
 * truncates per frame. CPU percentages are relative to one core, so a busy
 * multithreaded process can exceed 100.
 * @module @tomato/api-system-monitor-controller/collect/processes
 */

import { basename } from 'node:path'
import type { ProcessReading } from '../types.ts'
import type { CommandRunner } from './command.ts'

/** Longest process name a frame carries. */
const MAX_NAME_LENGTH = 40

/** One `ps -Ao pid=,pcpu=,pmem=,comm=` row. */
const PS_ROW = /^\s*(\d+)\s+([\d.]+)\s+([\d.]+)\s+(.+?)\s*$/

/**
 * Parse `ps -Ao pid=,pcpu=,pmem=,comm=` output.
 *
 * The first three fields are the pid and the CPU and memory percentages; the
 * rest of the line is the command path, which may itself contain spaces, so it
 * becomes the process name through its basename. Names longer than 40
 * characters are truncated.
 * @param text - standard output of the `ps` query.
 * @returns one reading per data row, in the order `ps` printed them.
 */
export function parsePs(text: string): ProcessReading[] {
  const readings: ProcessReading[] = []
  for (const line of text.split('\n')) {
    const match = PS_ROW.exec(line)
    if (match === null) continue
    // The anchored row pattern guarantees all four captures once it matches.
    const command = match[4] as string
    const name = basename(command)
    readings.push({
      pid: Number.parseInt(match[1] as string, 10),
      name: name.length > MAX_NAME_LENGTH ? name.slice(0, MAX_NAME_LENGTH) : name,
      cpuPercent: Number.parseFloat(match[2] as string),
      memoryPercent: Number.parseFloat(match[3] as string),
    })
  }
  return readings
}

/**
 * Read the highest-CPU processes for one platform.
 *
 * A failed `ps` rejects so the sampler can mark the collector unavailable
 * instead of publishing an empty list that looks like an idle machine.
 * @param runner - command runner for the `ps` query.
 * @param platform - platform to read; other platforms report no processes.
 * @param limit - how many rows to keep, highest CPU first; zero or less
 * reports none.
 * @returns at most `limit` readings, sorted by descending CPU percentage.
 */
export async function readProcesses(
  runner: CommandRunner,
  platform: NodeJS.Platform,
  limit: number,
): Promise<ProcessReading[]> {
  if (limit <= 0) return []
  if (platform !== 'darwin' && platform !== 'linux') return []
  const readings = parsePs(await runner.run('ps', ['-Ao', 'pid=,pcpu=,pmem=,comm=']))
  return readings.sort((left, right) => right.cpuPercent - left.cpuPercent).slice(0, limit)
}
