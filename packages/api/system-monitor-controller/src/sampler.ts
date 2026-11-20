/**
 * One sampling pass over the host: identity, processor, memory, graphics,
 * disk, network, power, and processes. The collector seam is a command runner
 * plus pure parsers, so this class owns every piece of state that outlives a
 * single frame — the previous CPU snapshot, the previous byte counters, and
 * the cached identity — and nothing in `collect/` does.
 * @module @tomato/api-system-monitor-controller/sampler
 */

import { loadavg } from 'node:os'
import { cpuUsageBetween, readCpuTimes, type CpuTimes } from './collect/cpu.ts'
import { createCommandRunner, type CommandRunner } from './collect/command.ts'
import { readDisk } from './collect/disk.ts'
import { readGpu } from './collect/gpu.ts'
import { readHostFacts } from './collect/host.ts'
import { readMemory } from './collect/memory.ts'
import { readNetworkCounters, type NetworkCounters } from './collect/network.ts'
import { readPower } from './collect/power.ts'
import { readProcesses } from './collect/processes.ts'
import type { CpuReading, HostFacts, MemoryReading, NetworkReading, SystemSampleFrame } from './types.ts'

/** How long an identity read stays current, in milliseconds. */
const HOST_FACTS_TTL_MS = 60_000

/** Frame fields one sample produces. */
export interface SampleLimits {
  /** Highest-CPU process rows to include. */
  readonly processLimit: number
}

/** Cached identity with the time it was read. */
interface CachedHost {
  readonly facts: HostFacts
  readonly at: number
}

/** Cached cumulative counters with the time they were read. */
interface CachedCounters {
  readonly counters: NetworkCounters
  readonly at: number
}

/** Per-interval host metrics with the state a single frame cannot carry. */
export class SystemSampler {
  private cpuTimes: CpuTimes | undefined
  private host: CachedHost | undefined
  private counters: CachedCounters | undefined
  private readonly commands: CommandRunner
  private readonly platform: NodeJS.Platform

  /**
   * @param commands - command runner every platform probe uses; injectable so tests read fixtures instead of the host.
   * @param platform - platform the probes target; defaults to this process's platform.
   */
  constructor(commands: CommandRunner = createCommandRunner(), platform: NodeJS.Platform = process.platform) {
    this.commands = commands
    this.platform = platform
  }

  /**
   * Collect one frame. A probe that fails leaves its field empty and its id in
   * `unavailable`; it never fails the frame.
   * @param limits - how many process rows to include.
   * @returns the frame with every probe that succeeded.
   */
  async sample(limits: SampleLimits): Promise<SystemSampleFrame> {
    const unavailable: string[] = []
    const host = await this.readHost()
    const cpu = this.readCpu()
    // These four report absence by returning null, so only a probe that can
    // refuse outright — memory, interface counters, processes — needs the
    // failure record.
    const [memory, gpu, disk, network, power, processes] = await Promise.all([
      this.attempt('memory', unavailable, () => readMemory(this.commands, this.platform)),
      readGpu(this.commands, this.platform, host.chip),
      readDisk(),
      this.attempt('network', unavailable, () => this.readNetwork()),
      readPower(this.commands, this.platform),
      this.attempt('processes', unavailable, () => readProcesses(this.commands, this.platform, limits.processLimit)),
    ])
    return {
      type: 'sample',
      at: Date.now(),
      host,
      cpu,
      memory: memory ?? emptyMemory(host.totalMemoryBytes),
      gpu,
      disk,
      network,
      power,
      processes: processes ?? [],
      unavailable,
    }
  }

  /**
   * Run one probe, recording its failure instead of propagating it.
   * @param id - collector id reported in `unavailable`.
   * @param unavailable - ids accumulated for this frame.
   * @param read - the probe.
   * @returns the probe's value, or null when it failed.
   */
  private async attempt<T>(
    id: string,
    unavailable: string[],
    read: () => Promise<T>,
  ): Promise<T | null> {
    try {
      return await read()
    } catch {
      unavailable.push(id)
      return null
    }
  }

  /** Read identity, reusing the cached facts while they are current. */
  private async readHost(): Promise<HostFacts> {
    const cached = this.host
    if (cached !== undefined && Date.now() - cached.at < HOST_FACTS_TTL_MS) return cached.facts
    const facts = await readHostFacts(this.commands, this.platform)
    this.host = { facts, at: Date.now() }
    return facts
  }

  /** Diff the processor snapshot against the previous frame. */
  private readCpu(): CpuReading {
    const next = readCpuTimes()
    const previous = this.cpuTimes
    this.cpuTimes = next
    if (previous === undefined || previous.perCore.length !== next.perCore.length) {
      return { usage: 0, perCore: next.perCore.map(() => 0), loadAverage: loadavg() }
    }
    return cpuUsageBetween(previous, next)
  }

  /** Turn cumulative interface counters into a per-second rate. */
  private async readNetwork(): Promise<NetworkReading> {
    const counters = await readNetworkCounters(this.commands, this.platform)
    if (counters === null) throw new Error('no interface counters')
    const previous = this.counters
    const at = Date.now()
    this.counters = { counters, at }
    if (previous === undefined) {
      return {
        receivedBytesPerSecond: 0,
        sentBytesPerSecond: 0,
        totalReceivedBytes: counters.receivedBytes,
        totalSentBytes: counters.sentBytes,
      }
    }
    // A counter that went backwards is an interface reset, not negative traffic.
    const seconds = Math.max((at - previous.at) / 1000, 0.001)
    return {
      receivedBytesPerSecond: rate(counters.receivedBytes - previous.counters.receivedBytes, seconds),
      sentBytesPerSecond: rate(counters.sentBytes - previous.counters.sentBytes, seconds),
      totalReceivedBytes: counters.receivedBytes,
      totalSentBytes: counters.sentBytes,
    }
  }

}

/**
 * Convert a byte delta to a per-second rate, treating a reset as zero.
 * @param delta - bytes counted since the previous sample.
 * @param seconds - elapsed time between the two samples.
 * @returns the rate in bytes per second.
 */
function rate(delta: number, seconds: number): number {
  return delta < 0 ? 0 : delta / seconds
}

/** The memory fallback used only when the memory probe throws. */
function emptyMemory(totalBytes: number): MemoryReading {
  return {
    totalBytes,
    usedBytes: 0,
    freeBytes: totalBytes,
    appBytes: 0,
    wiredBytes: 0,
    compressedBytes: 0,
    cachedBytes: 0,
    swapTotalBytes: 0,
    swapUsedBytes: 0,
  }
}
