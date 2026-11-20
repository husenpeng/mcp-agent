/**
 * Machine identity for a frame: names and capacities the Host reports once and
 * the sampler caches. Nothing here caches; a caller that wants the values to
 * stay stable across frames owns that.
 * @module @tomato/api-system-monitor-controller/collect/host
 */

import { readFile } from 'node:fs/promises'
import { arch, cpus, hostname, release, totalmem, uptime } from 'node:os'
import type { HostFacts } from '../types.ts'
import type { CommandRunner } from './command.ts'

/** Linux DMI file naming the hardware model. */
const DMI_MODEL_PATH = '/sys/devices/virtual/dmi/id/product_name'

/**
 * Read the machine identity a frame reports.
 *
 * The processor name comes from `node:os`. The hardware model comes from
 * `sysctl -n hw.model` on macOS and the DMI product name on Linux; both are
 * best-effort, and an unreadable model yields an empty string rather than a
 * failed frame.
 * @param runner - command runner for the macOS model probe.
 * @param platform - platform to report and read the model for.
 * @returns this machine's identity, with an empty model when unavailable.
 */
export async function readHostFacts(runner: CommandRunner, platform: NodeJS.Platform): Promise<HostFacts> {
  const cores = cpus()
  return {
    hostname: hostname(),
    platform,
    arch: arch(),
    osVersion: release(),
    model: await readModel(runner, platform),
    chip: cores[0]?.model ?? '',
    cores: cores.length,
    totalMemoryBytes: totalmem(),
    uptimeSeconds: uptime(),
  }
}

/**
 * Read the hardware model for one platform.
 * @param runner - command runner for the macOS probe.
 * @param platform - platform to read the model for.
 * @returns the model as reported, or an empty string when this platform
 * exposes none or the read fails.
 */
async function readModel(runner: CommandRunner, platform: NodeJS.Platform): Promise<string> {
  if (platform === 'darwin') {
    try {
      return (await runner.run('sysctl', ['-n', 'hw.model'])).trim()
    } catch {
      // A sandboxed Host may be denied sysctl; identity still reports without a model.
      return ''
    }
  }
  if (platform === 'linux') {
    try {
      return (await readFile(DMI_MODEL_PATH, 'utf8')).trim()
    } catch {
      // Containers and some ARM boards expose no DMI product name.
      return ''
    }
  }
  return ''
}
