/**
 * Wire types of the generated `systemMonitor` Remote namespace: one sampling
 * request and the frame each interval carries. Client-safe: no Host imports,
 * and every field is plain JSON.
 * @module @tomato/api-system-monitor-controller/types
 */

/** One `systemMonitor.sample` stream request. */
export interface SystemMonitorRequest {
  /**
   * Sampling interval in milliseconds. Clamped to 250–10,000; omitted, the
   * deployment interval applies.
   */
  readonly intervalMs?: number
  /**
   * How many processes the frame lists, highest CPU first. Clamped to 0–50;
   * omitted, the deployment process limit applies.
   */
  readonly processLimit?: number
}

/** Machine identity that does not change while the Host runs. */
export interface HostFacts {
  /** Network name of the machine. */
  readonly hostname: string
  /** `process.platform` of the Host: `darwin`, `linux`, `win32`, or another Node platform. */
  readonly platform: string
  /** `process.arch` of the Host. */
  readonly arch: string
  /** Host operating-system release, as the platform reports it. */
  readonly osVersion: string
  /** Hardware model, such as `Mac14,10`; empty when the platform exposes none. */
  readonly model: string
  /** Processor marketing name, such as `Apple M2 Pro`; empty when unavailable. */
  readonly chip: string
  /** Logical core count. */
  readonly cores: number
  /** Installed physical memory in bytes. */
  readonly totalMemoryBytes: number
  /** Seconds since the Host booted. */
  readonly uptimeSeconds: number
}

/** Processor load over the interval since the previous frame. */
export interface CpuReading {
  /** Busy share of all cores, 0–1. */
  readonly usage: number
  /** Busy share of each logical core, 0–1, in `os.cpus()` order. */
  readonly perCore: readonly number[]
  /** One-, five-, and fifteen-minute load averages. */
  readonly loadAverage: readonly number[]
}

/** Physical memory and swap occupancy. */
export interface MemoryReading {
  /** Installed physical memory in bytes. */
  readonly totalBytes: number
  /** Bytes the operating system cannot hand to a new allocation without reclaiming. */
  readonly usedBytes: number
  /** Bytes reclaimable without pressure: free pages plus file cache. */
  readonly freeBytes: number
  /** Resident application pages. */
  readonly appBytes: number
  /** Pages that cannot be paged out. */
  readonly wiredBytes: number
  /** Bytes held by the compressed-memory store. */
  readonly compressedBytes: number
  /** File cache and purgeable pages. */
  readonly cachedBytes: number
  /** Configured swap space in bytes; zero when the platform reports none. */
  readonly swapTotalBytes: number
  /** Swap space in bytes currently in use. */
  readonly swapUsedBytes: number
}

/** Graphics-processor utilization, when the platform exposes it without elevation. */
export interface GpuReading {
  /** Display name, such as `Apple M2 Pro GPU`. */
  readonly name: string
  /** Overall device busy share, 0–1. */
  readonly utilization: number
  /** Renderer busy share, 0–1; null when the platform reports none. */
  readonly renderer: number | null
  /** Tiler busy share, 0–1; null when the platform reports none. */
  readonly tiler: number | null
  /** GPU memory in use in bytes; null when the platform reports none. */
  readonly inUseMemoryBytes: number | null
  /** GPU memory the driver allocated in bytes; null when the platform reports none. */
  readonly allocatedMemoryBytes: number | null
}

/** One mounted volume's capacity. */
export interface DiskReading {
  /** Mount point or volume label as the platform reports it. */
  readonly mount: string
  /** Volume capacity in bytes. */
  readonly totalBytes: number
  /** Bytes available to a non-privileged writer. */
  readonly freeBytes: number
}

/** Host network throughput since the previous frame. */
export interface NetworkReading {
  /** Received bytes per second since the previous frame. */
  readonly receivedBytesPerSecond: number
  /** Sent bytes per second since the previous frame. */
  readonly sentBytesPerSecond: number
  /** Cumulative received bytes across non-loopback interfaces. */
  readonly totalReceivedBytes: number
  /** Cumulative sent bytes across non-loopback interfaces. */
  readonly totalSentBytes: number
}

/** Portable power state. */
export interface PowerReading {
  /** Battery charge percentage, 0–100; null when the machine has no battery. */
  readonly batteryPercent: number | null
  /** Whether the battery is charging; null when the machine has no battery. */
  readonly charging: boolean | null
  /** Highest thermal pressure the platform reports: `nominal`, `fair`, `serious`, or `critical`. */
  readonly thermalPressure: string
}

/** One process row, highest CPU first. */
export interface ProcessReading {
  /** Operating-system process id. */
  readonly pid: number
  /** Executable basename, shortened on the Host. */
  readonly name: string
  /** CPU share of one core since the process started, 0–100. */
  readonly cpuPercent: number
  /** Resident memory as a share of physical memory, 0–100. */
  readonly memoryPercent: number
}

/** One `systemMonitor.sample` frame. */
export interface SystemSampleFrame {
  /** Discriminator carried by every frame of this stream. */
  readonly type: 'sample'
  /** Host wall-clock time the frame was collected, in epoch milliseconds. */
  readonly at: number
  /** Machine identity that does not change while the Host runs. */
  readonly host: HostFacts
  /** Processor load since the previous frame. */
  readonly cpu: CpuReading
  /** Physical memory and swap occupancy. */
  readonly memory: MemoryReading
  /** Graphics utilization; null when this platform exposes none without elevation. */
  readonly gpu: GpuReading | null
  /** Root volume capacity; null when the platform refused the stat. */
  readonly disk: DiskReading | null
  /** Network throughput; null when the platform reports no counters. */
  readonly network: NetworkReading | null
  /** Power state; null when the platform reports none. */
  readonly power: PowerReading | null
  /** Highest-CPU processes, at most the requested limit. */
  readonly processes: readonly ProcessReading[]
  /** Collector ids that failed this frame, so a partial frame is still honest. */
  readonly unavailable: readonly string[]
}
