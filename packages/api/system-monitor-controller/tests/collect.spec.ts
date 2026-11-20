/**
 * Collector behavior against captured command output: every parser is pinned
 * with the real text its command prints, and every platform branch runs
 * through a fake command runner plus stubbed file reads, so no test spawns a
 * process or reads this host's counters.
 */
import type { StatsFs } from 'node:fs'
import { arch, cpus, hostname, loadavg, release, totalmem, type CpuInfo } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCommandRunner, type CommandRunner } from '../src/collect/command.ts'
import { cpuUsageBetween, readCpuTimes } from '../src/collect/cpu.ts'
import { readDisk } from '../src/collect/disk.ts'
import { parseIoregAccelerators, readGpu } from '../src/collect/gpu.ts'
import { readHostFacts } from '../src/collect/host.ts'
import { parseMeminfo, parseSwapUsage, parseVmStat, readMemory } from '../src/collect/memory.ts'
import { parseNetstatIb, parseProcNetDev, readNetworkCounters } from '../src/collect/network.ts'
import { parsePmsetBatt, parsePmsetTherm, readPower } from '../src/collect/power.ts'
import { parsePs, readProcesses } from '../src/collect/processes.ts'

const osControl = vi.hoisted(() => ({
  cpus: undefined as (() => CpuInfo[]) | undefined,
  totalmem: undefined as (() => number) | undefined,
  freemem: undefined as (() => number) | undefined,
}))

vi.mock('node:os', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:os')>()
  return {
    ...actual,
    cpus: () => (osControl.cpus === undefined ? actual.cpus() : osControl.cpus()),
    totalmem: () => (osControl.totalmem === undefined ? actual.totalmem() : osControl.totalmem()),
    freemem: () => (osControl.freemem === undefined ? actual.freemem() : osControl.freemem()),
  }
})

const fsControl = vi.hoisted(() => ({
  readFile: undefined as ((path: string) => Promise<string>) | undefined,
  readdir: undefined as ((path: string) => Promise<string[]>) | undefined,
  statfs: undefined as ((path: string) => Promise<StatsFs>) | undefined,
  reads: [] as string[],
  listings: [] as string[],
  stats: [] as string[],
}))

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>()
  return {
    ...actual,
    readFile: (path: string, encoding: 'utf8') =>
      (fsControl.readFile === undefined ? actual.readFile(path, encoding) : fsControl.readFile(path)),
    readdir: (path: string) => (fsControl.readdir === undefined ? actual.readdir(path) : fsControl.readdir(path)),
    statfs: (path: string) => (fsControl.statfs === undefined ? actual.statfs(path) : fsControl.statfs(path)),
  }
})

const execControl = vi.hoisted(() => ({
  stdout: '',
  error: null as Error | null,
  options: [] as Record<string, unknown>[],
  argv: [] as (readonly string[])[],
  files: [] as string[],
}))

vi.mock('node:child_process', () => ({
  execFile: (
    file: string,
    args: readonly string[],
    options: Record<string, unknown>,
    callback: (error: Error | null, stdout: string) => void,
  ): void => {
    execControl.files.push(file)
    execControl.argv.push(args)
    execControl.options.push(options)
    callback(execControl.error, execControl.stdout)
  },
}))

/** Linux DRM class directory, matching the collector's own constant. */
const DRM_CLASS = '/sys/class/drm'

/** Linux power-supply class directory, matching the collector's own constant. */
const POWER_CLASS = '/sys/class/power_supply'

/**
 * @param card - DRM card entry name.
 * @returns the path the collector reads that card's busy percentage from.
 */
const busyPercentPath = (card: string): string => join(DRM_CLASS, card, 'device', 'gpu_busy_percent')

/**
 * @param battery - power-supply entry name.
 * @param file - attribute file inside that supply.
 * @returns the path the collector reads that attribute from.
 */
const batteryPath = (battery: string, file: string): string => join(POWER_CLASS, battery, file)

/**
 * Build a command runner that answers by exact command line, recording each call.
 * @param answers - standard output or failure keyed by `file arg arg`.
 * @returns the runner and the command lines it was asked for.
 */
function fakeRunner(answers: Readonly<Record<string, string | Error>>): { runner: CommandRunner; calls: string[] } {
  const calls: string[] = []
  const runner: CommandRunner = {
    async run(file, args) {
      const command = [file, ...args].join(' ')
      calls.push(command)
      const answer = answers[command]
      if (answer === undefined) throw new Error(`unexpected command: ${command}`)
      if (answer instanceof Error) throw answer
      return answer
    },
  }
  return { runner, calls }
}

/**
 * Answer `readFile` calls from a path map.
 * @param files - contents or failure keyed by absolute path.
 */
function stubReadFile(files: Readonly<Record<string, string | Error>>): void {
  fsControl.readFile = async (path) => {
    fsControl.reads.push(path)
    const answer = files[path]
    if (answer === undefined) throw new Error(`ENOENT: no such file or directory, open '${path}'`)
    if (answer instanceof Error) throw answer
    return answer
  }
}

/**
 * Answer `readdir` calls with one listing.
 * @param listing - entry names, or the failure to raise.
 */
function stubReaddir(listing: readonly string[] | Error): void {
  fsControl.readdir = async (path) => {
    fsControl.listings.push(path)
    if (listing instanceof Error) throw listing
    return [...listing]
  }
}

/**
 * Answer `statfs` calls with one volume.
 * @param result - filesystem statistics, or the failure to raise.
 */
function stubStatfs(result: StatsFs | Error): void {
  fsControl.statfs = async (path) => {
    fsControl.stats.push(path)
    if (result instanceof Error) throw result
    return result
  }
}

/**
 * @param blocks - total blocks on the volume.
 * @param bavail - blocks available to an unprivileged writer.
 * @returns filesystem statistics with 4 KiB blocks.
 */
function statsFs(blocks: number, bavail: number): StatsFs {
  return { type: 0, bsize: 4096, blocks, bfree: bavail, bavail, files: 0, ffree: 0 }
}

afterEach(() => {
  osControl.cpus = undefined
  osControl.totalmem = undefined
  osControl.freemem = undefined
  fsControl.readFile = undefined
  fsControl.readdir = undefined
  fsControl.statfs = undefined
  fsControl.reads.length = 0
  fsControl.listings.length = 0
  fsControl.stats.length = 0
  execControl.stdout = ''
  execControl.error = null
  execControl.options.length = 0
  execControl.argv.length = 0
  execControl.files.length = 0
  vi.unstubAllEnvs()
})

describe('createCommandRunner', () => {
  it('returns standard output and rejects with the command failure', async () => {
    const runner = createCommandRunner()
    execControl.stdout = 'Mach Virtual Memory Statistics: (page size of 16384 bytes)\n'
    await expect(runner.run('vm_stat', [])).resolves.toBe(execControl.stdout)

    const failure = Object.assign(new Error('Command failed: vm_stat'), { code: 1, killed: false })
    execControl.error = failure
    await expect(runner.run('vm_stat', [])).rejects.toBe(failure)
  })

  it('runs argv without a shell, in the C locale, under the default limits', async () => {
    await createCommandRunner().run('pmset', ['-g', 'batt'])

    expect(execControl.files).toEqual(['pmset'])
    expect(execControl.argv).toEqual([['-g', 'batt']])
    expect(execControl.options[0]).toMatchObject({
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024,
      timeout: 2000,
      killSignal: 'SIGKILL',
    })
    expect((execControl.options[0] as { env?: Record<string, string> }).env).toMatchObject({ LC_ALL: 'C' })
  })

  it('rejects a command that the timeout killed', async () => {
    const runner = createCommandRunner(50)
    execControl.error = Object.assign(new Error('Command failed: vm_stat'), { killed: true, signal: 'SIGKILL' })
    await expect(runner.run('vm_stat', [])).rejects.toMatchObject({ killed: true, signal: 'SIGKILL' })
    expect(execControl.options[0]).toMatchObject({ timeout: 50, killSignal: 'SIGKILL' })
  })
})

describe('readCpuTimes', () => {
  it('sums user, nice, sys, idle, and irq ticks into the core total', () => {
    osControl.cpus = () => [{ model: 'Apple M2 Pro', speed: 2400, times: { user: 100, nice: 10, sys: 20, idle: 30, irq: 5 } }]
    expect(readCpuTimes()).toEqual({ perCore: [{ idle: 30, total: 165 }] })
  })

  it('reports one entry per logical core the host exposes', () => {
    const times = readCpuTimes()
    expect(times.perCore).toHaveLength(cpus().length)
    for (const core of times.perCore) expect(core.total).toBeGreaterThanOrEqual(core.idle)
  })

  it('reports no cores when the platform exposes none', () => {
    osControl.cpus = () => []
    expect(readCpuTimes()).toEqual({ perCore: [] })
  })
})

describe('cpuUsageBetween', () => {
  it('reports the overall and per-core busy shares with the load averages', () => {
    const previous = { perCore: [{ idle: 100, total: 200 }, { idle: 0, total: 100 }, { idle: 50, total: 100 }] }
    const next = { perCore: [{ idle: 100, total: 200 }, { idle: 100, total: 300 }, { idle: 50, total: 300 }] }

    const reading = cpuUsageBetween(previous, next)

    expect(reading.usage).toBeCloseTo(0.75)
    expect(reading.perCore).toEqual([0.75, 0.5, 1])
    expect(reading.loadAverage).toEqual(loadavg())
  })

  it('reports zero when no ticks elapsed', () => {
    const snapshot = { perCore: [{ idle: 10, total: 20 }] }
    expect(cpuUsageBetween(snapshot, snapshot)).toMatchObject({ usage: 0, perCore: [0] })
  })

  it('uses the overall share for a core that appeared since the previous snapshot', () => {
    const previous = { perCore: [{ idle: 0, total: 100 }, { idle: 0, total: 100 }] }
    const next = { perCore: [{ idle: 0, total: 200 }, { idle: 0, total: 200 }, { idle: 0, total: 200 }] }

    expect(cpuUsageBetween(previous, next)).toMatchObject({ usage: 1, perCore: [1, 1, 1] })
  })

  it('clamps shares after a counter reset instead of reporting impossible usage', () => {
    const busy = cpuUsageBetween({ perCore: [{ idle: 0, total: 100 }] }, { perCore: [{ idle: 100, total: 150 }] })
    expect(busy.usage).toBe(0)

    const overFull = cpuUsageBetween({ perCore: [{ idle: 100, total: 200 }] }, { perCore: [{ idle: 50, total: 250 }] })
    expect(overFull.usage).toBe(1)
  })
})

const VM_STAT = [
  'Mach Virtual Memory Statistics: (page size of 16384 bytes)',
  'Pages free:                                   129940.',
  'Pages active:                                 283854.',
  'Pages inactive:                               275439.',
  'Pages speculative:                              6951.',
  'Pages throttled:                                   0.',
  'Pages wired down:                             148161.',
  'Pages purgeable:                               30828.',
  '"Translation faults":                       28040956.',
  'Pages occupied by compressor:                 162447.',
].join('\n')

describe('parseVmStat', () => {
  it('reads the page size and the page counts', () => {
    const { pageSize, pages } = parseVmStat(VM_STAT)
    expect(pageSize).toBe(16384)
    expect(pages['Pages free']).toBe(129940)
    expect(pages['Pages wired down']).toBe(148161)
    expect(pages['Pages occupied by compressor']).toBe(162447)
  })

  it('strips the quotes from labels that contain spaces', () => {
    expect(parseVmStat(VM_STAT).pages['Translation faults']).toBe(28040956)
  })

  it('ignores malformed lines and reports a zero page size when the header is missing', () => {
    const text = ['Mach Virtual Memory Statistics', ': 5.', 'Pages broken: nope', 'Pages active: 12'].join('\n')
    expect(parseVmStat(text)).toEqual({ pageSize: 0, pages: { 'Pages active': 12 } })
    expect(parseVmStat('')).toEqual({ pageSize: 0, pages: {} })
  })
})

describe('parseSwapUsage', () => {
  it('reads decimal values with their unit suffixes', () => {
    expect(parseSwapUsage('total = 2048.00M  used = 870.56M  free = 1177.44M  (encrypted)')).toEqual({
      totalBytes: 2048 * 1024 ** 2,
      usedBytes: Math.round(870.56 * 1024 ** 2),
    })
  })

  it('accepts every suffix and a value with no suffix', () => {
    expect(parseSwapUsage('total = 2.00G  used = 1.50K')).toEqual({ totalBytes: 2 * 1024 ** 3, usedBytes: 1.5 * 1024 })
    expect(parseSwapUsage('total = 1.00T  used = 512')).toEqual({ totalBytes: 1024 ** 4, usedBytes: 512 })
  })

  it('reports zero for a field the output omits', () => {
    expect(parseSwapUsage('(encrypted)')).toEqual({ totalBytes: 0, usedBytes: 0 })
    expect(parseSwapUsage('total = 512.00M')).toEqual({ totalBytes: 512 * 1024 ** 2, usedBytes: 0 })
  })
})

const MEMINFO = [
  'MemTotal:       16332884 kB',
  'MemFree:          412316 kB',
  'MemAvailable:    9384812 kB',
  'Buffers:          132456 kB',
  'Cached:          5123456 kB',
  'SwapCached:            0 kB',
  'SwapTotal:       2097152 kB',
  'SwapFree:        1567890 kB',
  'HugePages_Total:       0',
].join('\n')

describe('parseMeminfo', () => {
  it('reads every numeric field in the kB unit the kernel reports', () => {
    expect(parseMeminfo(MEMINFO)).toMatchObject({
      MemTotal: 16332884,
      MemFree: 412316,
      MemAvailable: 9384812,
      Buffers: 132456,
      Cached: 5123456,
      SwapTotal: 2097152,
      SwapFree: 1567890,
      HugePages_Total: 0,
    })
  })

  it('ignores lines without a numeric field', () => {
    expect(parseMeminfo('Malformed line\nMemTotal:    not a number kB\n')).toEqual({})
  })
})

describe('readMemory', () => {
  it('maps macOS pages into application, wired, compressed, cached, and used bytes', async () => {
    const { runner } = fakeRunner({
      vm_stat: [
        'Mach Virtual Memory Statistics: (page size of 4096 bytes)',
        'Pages active: 200.',
        'Pages inactive: 50.',
        'Pages speculative: 25.',
        'Pages wired down: 40.',
        'Pages purgeable: 10.',
        'Pages occupied by compressor: 15.',
      ].join('\n'),
      'sysctl -n vm.swapusage': 'total = 2048.00M  used = 512.00M  free = 1536.00M  (encrypted)',
    })

    const memory = await readMemory(runner, 'darwin')

    expect(memory.totalBytes).toBe(totalmem())
    expect(memory.appBytes).toBe(200 * 4096)
    expect(memory.wiredBytes).toBe(40 * 4096)
    expect(memory.compressedBytes).toBe(15 * 4096)
    expect(memory.cachedBytes).toBe((50 + 25 + 10) * 4096)
    expect(memory.usedBytes).toBe((200 + 40 + 15 - 10) * 4096)
    expect(memory.freeBytes).toBe(totalmem() - memory.usedBytes)
    expect(memory.swapTotalBytes).toBe(2048 * 1024 ** 2)
    expect(memory.swapUsedBytes).toBe(512 * 1024 ** 2)
  })

  it('treats pages the system omits as zero', async () => {
    const { runner } = fakeRunner({
      vm_stat: 'Mach Virtual Memory Statistics: (page size of 4096 bytes)\nPages active: 10.',
      'sysctl -n vm.swapusage': '(encrypted)',
    })

    const memory = await readMemory(runner, 'darwin')

    expect(memory.appBytes).toBe(10 * 4096)
    expect(memory.wiredBytes).toBe(0)
    expect(memory.compressedBytes).toBe(0)
    expect(memory.cachedBytes).toBe(0)
    expect(memory.usedBytes).toBe(10 * 4096)
    expect(memory.swapTotalBytes).toBe(0)
    expect(memory.swapUsedBytes).toBe(0)
  })

  it('clamps used bytes to the machine capacity', async () => {
    const { runner } = fakeRunner({
      vm_stat: 'Mach Virtual Memory Statistics: (page size of 4096 bytes)\nPages active: 1099511627776.',
      'sysctl -n vm.swapusage': 'total = 0.00M  used = 0.00M',
    })

    const memory = await readMemory(runner, 'darwin')

    expect(memory.usedBytes).toBe(totalmem())
    expect(memory.freeBytes).toBe(0)
  })

  it('keeps purgeable pages out of used bytes', async () => {
    const { runner } = fakeRunner({
      vm_stat: 'Mach Virtual Memory Statistics: (page size of 4096 bytes)\nPages active: 1.\nPages purgeable: 2.',
      'sysctl -n vm.swapusage': 'total = 0.00M  used = 0.00M',
    })

    expect((await readMemory(runner, 'darwin')).usedBytes).toBe(0)
  })

  it('rejects when a macOS probe fails', async () => {
    const { runner } = fakeRunner({
      vm_stat: new Error('vm_stat: permission denied'),
      'sysctl -n vm.swapusage': new Error('vm_stat: permission denied'),
    })
    await expect(readMemory(runner, 'darwin')).rejects.toThrow('permission denied')
  })

  it('maps /proc/meminfo into used, available, and cached bytes', async () => {
    stubReadFile({ '/proc/meminfo': MEMINFO })
    const total = 16332884 * 1024
    const { runner, calls } = fakeRunner({})

    const memory = await readMemory(runner, 'linux')

    expect(calls).toEqual([])
    expect(memory.totalBytes).toBe(total)
    expect(memory.usedBytes).toBe(total - 9384812 * 1024)
    expect(memory.freeBytes).toBe(total - memory.usedBytes)
    expect(memory.appBytes).toBe(total - (412316 + 132456 + 5123456) * 1024)
    expect(memory.cachedBytes).toBe((132456 + 5123456) * 1024)
    expect(memory.wiredBytes).toBe(0)
    expect(memory.compressedBytes).toBe(0)
    expect(memory.swapTotalBytes).toBe(2097152 * 1024)
    expect(memory.swapUsedBytes).toBe((2097152 - 1567890) * 1024)
  })

  it('falls back to MemFree when /proc/meminfo has no MemAvailable', async () => {
    stubReadFile({ '/proc/meminfo': 'MemTotal: 1000 kB\nMemFree: 400 kB\n' })

    const memory = await readMemory(fakeRunner({}).runner, 'linux')

    expect(memory.usedBytes).toBe(600 * 1024)
    expect(memory.cachedBytes).toBe(0)
    expect(memory.swapTotalBytes).toBe(0)
    expect(memory.swapUsedBytes).toBe(0)
  })

  it('reports nothing available when /proc/meminfo omits both availability fields', async () => {
    stubReadFile({ '/proc/meminfo': 'MemTotal: 1000 kB\n' })

    const memory = await readMemory(fakeRunner({}).runner, 'linux')

    expect(memory.usedBytes).toBe(1000 * 1024)
    expect(memory.freeBytes).toBe(0)
    expect(memory.appBytes).toBe(1000 * 1024)
  })

  it('clamps occupancy when available memory exceeds the capacity', async () => {
    stubReadFile({ '/proc/meminfo': 'MemTotal: 100 kB\nMemAvailable: 200 kB\nMemFree: 900 kB\n' })

    expect((await readMemory(fakeRunner({}).runner, 'linux')).usedBytes).toBe(0)
  })

  it('rejects when /proc/meminfo cannot be read', async () => {
    stubReadFile({})
    await expect(readMemory(fakeRunner({}).runner, 'linux')).rejects.toThrow('ENOENT')
  })

  it('uses the node:os totals on other platforms', async () => {
    osControl.totalmem = () => 1024 ** 3
    osControl.freemem = () => 256 * 1024 ** 2

    const memory = await readMemory(fakeRunner({}).runner, 'freebsd')

    expect(memory.totalBytes).toBe(1024 ** 3)
    expect(memory.usedBytes).toBe(768 * 1024 ** 2)
    expect(memory.freeBytes).toBe(256 * 1024 ** 2)
    expect(memory.appBytes).toBe(0)
    expect(memory.wiredBytes).toBe(0)
    expect(memory.compressedBytes).toBe(0)
    expect(memory.cachedBytes).toBe(0)
    expect(memory.swapTotalBytes).toBe(0)
    expect(memory.swapUsedBytes).toBe(0)
  })

  it('never reports a negative free total when the platform over-reports free memory', async () => {
    osControl.totalmem = () => 1024 ** 3
    osControl.freemem = () => 2 * 1024 ** 3

    const memory = await readMemory(fakeRunner({}).runner, 'freebsd')

    expect(memory.freeBytes).toBe(1024 ** 3)
    expect(memory.usedBytes).toBe(0)
  })
})

const IOREG = [
  '+-o AGXAcceleratorG14X  <class AGXAcceleratorG14X, id 0x1000004b5, registered, matched, active, busy 0 (220 ms), retain 54>',
  '    {',
  '      "MetalPluginName" = "AGXMetalG14X"',
  '      "PerformanceStatistics" = {"In use system memory (driver)"=0,"Alloc system memory"=3293020160,"Tiler Utilization %"=32,"recoveryCount"=0,"Renderer Utilization %"=32,"TiledSceneBytes"=2097152,"Device Utilization %"=32,"In use system memory"=801275904}',
  '      "IOGLBundleName" = "AppleMetalOpenGLRenderer"',
  '    }',
].join('\n')

const BUSY_IOREG_LINE = '      "PerformanceStatistics" = {"Alloc system memory"=2,"Tiler Utilization %"=70,"Renderer Utilization %"=80,"Device Utilization %"=87,"In use system memory"=1}'

describe('parseIoregAccelerators', () => {
  it('reads one accelerator performance dictionary', () => {
    expect(parseIoregAccelerators(IOREG)).toEqual([{
      name: '',
      utilization: 0.32,
      renderer: 0.32,
      tiler: 0.32,
      inUseMemoryBytes: 801275904,
      allocatedMemoryBytes: 3293020160,
    }])
  })

  it('reads one entry per accelerator', () => {
    const readings = parseIoregAccelerators(`${IOREG}\n${BUSY_IOREG_LINE}`)
    expect(readings).toHaveLength(2)
    expect(readings[1]?.utilization).toBe(0.87)
  })

  it('reports unknown utilization and memory as zero or null', () => {
    expect(parseIoregAccelerators('"PerformanceStatistics" = {"Alloc system memory"=100}')).toEqual([{
      name: '',
      utilization: 0,
      renderer: null,
      tiler: null,
      inUseMemoryBytes: null,
      allocatedMemoryBytes: 100,
    }])
    expect(parseIoregAccelerators('"PerformanceStatistics" = {"Device Utilization %"=5}')).toEqual([{
      name: '',
      utilization: 0.05,
      renderer: null,
      tiler: null,
      inUseMemoryBytes: null,
      allocatedMemoryBytes: null,
    }])
  })

  it('ignores output without a complete performance dictionary', () => {
    expect(parseIoregAccelerators('')).toEqual([])
    expect(parseIoregAccelerators('"PerformanceStatistics" = {"Device Utilization %"=5')).toEqual([])
    expect(parseIoregAccelerators('"MetalPluginName" = "AGXMetalG14X"')).toEqual([])
  })
})

describe('readGpu', () => {
  it('labels the busiest macOS accelerator after the chip', async () => {
    const { runner, calls } = fakeRunner({ 'ioreg -r -d 1 -w 0 -c IOAccelerator': `${IOREG}\n${BUSY_IOREG_LINE}` })

    const gpu = await readGpu(runner, 'darwin', 'Apple M2 Pro')

    expect(calls).toEqual(['ioreg -r -d 1 -w 0 -c IOAccelerator'])
    expect(gpu).toMatchObject({ name: 'Apple M2 Pro GPU', utilization: 0.87 })
  })

  it('keeps the first accelerator when a later one is quieter', async () => {
    const { runner } = fakeRunner({ 'ioreg -r -d 1 -w 0 -c IOAccelerator': `${BUSY_IOREG_LINE}\n${IOREG}` })

    expect((await readGpu(runner, 'darwin', 'Apple M2 Pro'))?.utilization).toBe(0.87)
  })

  it('names the GPU generically when the chip is unknown', async () => {
    const { runner } = fakeRunner({ 'ioreg -r -d 1 -w 0 -c IOAccelerator': IOREG })

    expect((await readGpu(runner, 'darwin', ''))?.name).toBe('GPU')
    expect((await readGpu(runner, 'darwin', '   '))?.name).toBe('GPU')
  })

  it('reports null when the macOS probe fails or finds no accelerator', async () => {
    const failure = fakeRunner({ 'ioreg -r -d 1 -w 0 -c IOAccelerator': new Error('ioreg: not found') })
    expect(await readGpu(failure.runner, 'darwin', 'Apple M2 Pro')).toBeNull()

    const empty = fakeRunner({ 'ioreg -r -d 1 -w 0 -c IOAccelerator': '"MetalPluginName" = "AGXMetalG14X"' })
    expect(await readGpu(empty.runner, 'darwin', 'Apple M2 Pro')).toBeNull()
  })

  it('reads the first Linux card that publishes a busy percentage', async () => {
    stubReaddir(['card0', 'card1', 'card0-DP-1', 'renderD128'])
    stubReadFile({
      [busyPercentPath('card0')]: new Error('ENOENT: no such file'),
      [busyPercentPath('card1')]: '37\n',
    })

    const gpu = await readGpu(fakeRunner({}).runner, 'linux', 'Apple M2 Pro')

    expect(gpu).toEqual({
      name: 'GPU',
      utilization: 0.37,
      renderer: null,
      tiler: null,
      inUseMemoryBytes: null,
      allocatedMemoryBytes: null,
    })
    expect(fsControl.listings).toEqual([DRM_CLASS])
    expect(fsControl.reads).toEqual([busyPercentPath('card0'), busyPercentPath('card1')])
  })

  it('checks cards in numeric order', async () => {
    stubReaddir(['card10', 'card2'])
    stubReadFile({ [busyPercentPath('card2')]: '5\n' })

    expect((await readGpu(fakeRunner({}).runner, 'linux', ''))?.utilization).toBe(0.05)
    expect(fsControl.reads).toEqual([busyPercentPath('card2')])
  })

  it('reports null when no card exposes a readable busy percentage', async () => {
    stubReaddir(new Error('ENOENT: no such file or directory'))
    expect(await readGpu(fakeRunner({}).runner, 'linux', '')).toBeNull()

    stubReaddir([])
    expect(await readGpu(fakeRunner({}).runner, 'linux', '')).toBeNull()

    stubReaddir(['card0'])
    stubReadFile({ [busyPercentPath('card0')]: 'unknown\n' })
    expect(await readGpu(fakeRunner({}).runner, 'linux', '')).toBeNull()
  })

  it('reports null on a platform that exposes no GPU', async () => {
    expect(await readGpu(fakeRunner({}).runner, 'freebsd', 'Apple M2 Pro')).toBeNull()
  })
})

const NETSTAT = [
  'Name       Mtu   Network       Address            Ipkts Ierrs     Ibytes    Opkts Oerrs     Obytes  Coll',
  'lo0        16384 <Link#1>                         58131     0   69774515    58131     0   69774515     0',
  'lo0        16384 127           localhost          58131     -   69774515    58131     -   69774515     -',
  'anpi2      1500  <Link#4>    f6:1b:ed:29:b3:5c        0     0          0        0     0          0     0',
  'en0        1500  <Link#7>    a4:83:e7:11:22:33      100     1   11111111      200     2   22222222     0',
  'utun3      1500  <Link#9>     -                      -      -          -        -     -          -     -',
  'gif1       1280  <Link#10>',
].join('\n')

const PROC_NET_DEV = [
  'Inter-|   Receive                                                |  Transmit',
  ' face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed',
  '    lo: 1000 1 0 0 0 0 0 0 2000 1 0 0 0 0 0 0',
  '  eth0: 5555 10 0 0 0 0 0 0 6666 12 0 0 0 0 0 0',
  '  eth1: 111 1 0 0 0 0 0 0 222 1 0 0 0 0 0 0',
  '  eth2: 100 1',
].join('\n')

describe('parseNetstatIb', () => {
  it('sums the link rows of non-loopback interfaces', () => {
    expect(parseNetstatIb(NETSTAT)).toEqual({ receivedBytes: 11111111, sentBytes: 22222222 })
  })

  it('reports no counters for a header alone', () => {
    expect(parseNetstatIb('Name       Mtu   Network       Address            Ipkts Ierrs')).toEqual({
      receivedBytes: 0,
      sentBytes: 0,
    })
  })
})

describe('parseProcNetDev', () => {
  it('sums every non-loopback interface', () => {
    expect(parseProcNetDev(PROC_NET_DEV)).toEqual({ receivedBytes: 5666, sentBytes: 6888 })
  })

  it('ignores a truncated row', () => {
    expect(parseProcNetDev('  eth2: 100 1')).toEqual({ receivedBytes: 0, sentBytes: 0 })
  })
})

describe('readNetworkCounters', () => {
  it('reads macOS interface counters', async () => {
    const { runner, calls } = fakeRunner({ 'netstat -ib': NETSTAT })

    expect(await readNetworkCounters(runner, 'darwin')).toEqual({ receivedBytes: 11111111, sentBytes: 22222222 })
    expect(calls).toEqual(['netstat -ib'])
  })

  it('reports null when the macOS counters cannot be read', async () => {
    const { runner } = fakeRunner({ 'netstat -ib': new Error('netstat: no kernel support') })
    expect(await readNetworkCounters(runner, 'darwin')).toBeNull()
  })

  it('reads Linux interface counters from /proc/net/dev', async () => {
    stubReadFile({ '/proc/net/dev': PROC_NET_DEV })
    expect(await readNetworkCounters(fakeRunner({}).runner, 'linux')).toEqual({ receivedBytes: 5666, sentBytes: 6888 })
  })

  it('reports null when /proc/net/dev cannot be read', async () => {
    stubReadFile({})
    expect(await readNetworkCounters(fakeRunner({}).runner, 'linux')).toBeNull()
  })

  it('reports null on a platform without counters', async () => {
    expect(await readNetworkCounters(fakeRunner({}).runner, 'freebsd')).toBeNull()
  })
})

describe('readDisk', () => {
  it('reports the root volume capacity', async () => {
    stubStatfs(statsFs(1000, 300))

    expect(await readDisk('linux')).toEqual({ mount: '/', totalBytes: 4096 * 1000, freeBytes: 4096 * 300 })
    expect(fsControl.stats).toEqual(['/'])
  })

  it('stats the Windows system drive named by the environment', async () => {
    vi.stubEnv('SystemDrive', 'D:')
    stubStatfs(statsFs(10, 5))

    expect(await readDisk('win32')).toEqual({ mount: 'D:', totalBytes: 4096 * 10, freeBytes: 4096 * 5 })
    expect(fsControl.stats).toEqual(['D:'])
  })

  it('falls back to the C drive when the environment names none', async () => {
    vi.stubEnv('SystemDrive', undefined)
    stubStatfs(statsFs(10, 5))

    expect((await readDisk('win32'))?.mount).toBe('C:\\')
    expect(fsControl.stats).toEqual(['C:\\'])
  })

  it('omits a volume that reports no capacity', async () => {
    stubStatfs(statsFs(0, 0))
    expect(await readDisk('linux')).toBeNull()
  })

  it('reports null when the volume cannot be statted', async () => {
    stubStatfs(new Error('ENOENT: no such file or directory'))
    expect(await readDisk('linux')).toBeNull()
  })

  it('defaults to this process platform', async () => {
    stubStatfs(statsFs(100, 50))
    const mount = process.platform === 'win32' ? process.env.SystemDrive ?? 'C:\\' : '/'

    expect((await readDisk())?.mount).toBe(mount)
  })
})

const BATT_CHARGED = "Now drawing from 'AC Power'\n -InternalBattery-0 (id=38928483)\t100%; charged; 0:00 remaining present: true"
const BATT_CHARGING = "Now drawing from 'AC Power'\n -InternalBattery-0 (id=1)\t37%; charging; 0:42 remaining present: true"
const BATT_DISCHARGING = "Now drawing from 'Battery Power'\n -InternalBattery-0 (id=1)\t42%; discharging; 3:12 remaining present: true"
const BATT_FINISHING = "Now drawing from 'AC Power'\n -InternalBattery-0 (id=1)\t60%; finishing charge; 0:00 remaining present: true"
const BATT_NO_STATUS = "Now drawing from 'Battery Power'\n -InternalBattery-0 (id=1)\t55%;"
const BATT_NONE = "Now drawing from 'AC Power'"
const THERM_QUIET = [
  'Note: No thermal warning level has been recorded',
  'Note: No performance warning level has been recorded',
  'Note: No CPU power status has been recorded',
].join('\n')

describe('parsePmsetBatt', () => {
  it('reads charge and the on-power state', () => {
    expect(parsePmsetBatt(BATT_CHARGED)).toEqual({ batteryPercent: 100, charging: true })
    expect(parsePmsetBatt(BATT_CHARGING)).toEqual({ batteryPercent: 37, charging: true })
  })

  it('does not treat discharging as charging', () => {
    expect(parsePmsetBatt(BATT_DISCHARGING)).toEqual({ batteryPercent: 42, charging: false })
  })

  it('treats reported AC power as charging even without a status word', () => {
    expect(parsePmsetBatt(BATT_FINISHING)).toEqual({ batteryPercent: 60, charging: true })
  })

  it('reports a missing status and clamps an impossible percentage', () => {
    expect(parsePmsetBatt(BATT_NO_STATUS)).toEqual({ batteryPercent: 55, charging: false })
    expect(parsePmsetBatt(' -InternalBattery-0 (id=1)\t150%; charging;')).toEqual({ batteryPercent: 100, charging: true })
  })

  it('reports nulls when the machine has no battery', () => {
    expect(parsePmsetBatt(BATT_NONE)).toEqual({ batteryPercent: null, charging: null })
  })
})

describe('parsePmsetTherm', () => {
  it('reports nominal when no limiter is reported', () => {
    expect(parsePmsetTherm(THERM_QUIET)).toBe('nominal')
    expect(parsePmsetTherm('')).toBe('nominal')
  })

  it('reports fair when limiters are present but none throttles', () => {
    expect(parsePmsetTherm('CPU_Speed_Limit = 100\nCPU_Available_CPUs = 8')).toBe('fair')
  })

  it('reports serious for any limiter below 100', () => {
    expect(parsePmsetTherm('CPU_Speed_Limit = 80')).toBe('serious')
    expect(parsePmsetTherm('CPU_Scheduler_Limit = 90')).toBe('serious')
    expect(parsePmsetTherm('CPU_Speed_Limit = 100\nCPU_Scheduler_Limit = 60')).toBe('serious')
  })
})

describe('readPower', () => {
  it('reads macOS battery and thermal state', async () => {
    const { runner, calls } = fakeRunner({
      'pmset -g batt': BATT_DISCHARGING,
      'pmset -g therm': THERM_QUIET,
    })

    expect(await readPower(runner, 'darwin')).toEqual({
      batteryPercent: 42,
      charging: false,
      thermalPressure: 'nominal',
    })
    expect(calls).toEqual(['pmset -g batt', 'pmset -g therm'])
  })

  it('rejects when a macOS probe fails', async () => {
    const { runner } = fakeRunner({
      'pmset -g batt': new Error('pmset: not found'),
      'pmset -g therm': new Error('pmset: not found'),
    })
    await expect(readPower(runner, 'darwin')).rejects.toThrow('pmset: not found')
  })

  it('reads the first Linux battery that publishes a capacity', async () => {
    stubReaddir(['AC', 'BAT0', 'BAT1'])
    stubReadFile({
      [batteryPath('BAT0', 'capacity')]: new Error('ENOENT: no such file'),
      [batteryPath('BAT1', 'capacity')]: '77\n',
      [batteryPath('BAT1', 'status')]: 'Charging\n',
    })

    expect(await readPower(fakeRunner({}).runner, 'linux')).toEqual({
      batteryPercent: 77,
      charging: true,
      thermalPressure: 'nominal',
    })
    expect(fsControl.listings).toEqual([POWER_CLASS])
  })

  it('reports a battery that is not charging', async () => {
    stubReaddir(['BAT0'])
    stubReadFile({
      [batteryPath('BAT0', 'capacity')]: '12\n',
      [batteryPath('BAT0', 'status')]: 'Discharging\n',
    })

    expect((await readPower(fakeRunner({}).runner, 'linux'))?.charging).toBe(false)
  })

  it('leaves the charging state unknown when the status file is unreadable', async () => {
    stubReaddir(['BAT0'])
    stubReadFile({ [batteryPath('BAT0', 'capacity')]: '12\n' })

    expect((await readPower(fakeRunner({}).runner, 'linux'))?.charging).toBeNull()
  })

  it('reports null when no battery is readable', async () => {
    stubReaddir(new Error('ENOENT: no such file or directory'))
    expect(await readPower(fakeRunner({}).runner, 'linux')).toBeNull()

    stubReaddir([])
    expect(await readPower(fakeRunner({}).runner, 'linux')).toBeNull()

    stubReaddir(['BAT0'])
    stubReadFile({ [batteryPath('BAT0', 'capacity')]: 'unknown\n' })
    expect(await readPower(fakeRunner({}).runner, 'linux')).toBeNull()
  })

  it('reports null on a platform without a power probe', async () => {
    expect(await readPower(fakeRunner({}).runner, 'freebsd')).toBeNull()
  })
})

const PS = [
  '  123  1.2  0.5 /usr/libexec/foo bar',
  '  456 12.5  1.5 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '  789  0.0  0.1 /opt/homebrew/bin/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  '',
  'garbage',
].join('\n')

describe('parsePs', () => {
  it('reads the pid, percentages, and command basename', () => {
    const processes = parsePs(PS)

    expect(processes).toHaveLength(3)
    expect(processes[0]).toEqual({ pid: 123, name: 'foo bar', cpuPercent: 1.2, memoryPercent: 0.5 })
    expect(processes[1]).toEqual({ pid: 456, name: 'Google Chrome', cpuPercent: 12.5, memoryPercent: 1.5 })
  })

  it('truncates a long process name at 40 characters', () => {
    expect(parsePs(PS)[2]?.name).toHaveLength(40)
    expect(parsePs(PS)[2]?.name).toBe('a'.repeat(40))
  })

  it('reports no rows for output without process rows', () => {
    expect(parsePs('')).toEqual([])
  })
})

describe('readProcesses', () => {
  it('sorts by descending CPU and keeps the requested number of rows', async () => {
    const { runner, calls } = fakeRunner({ 'ps -Ao pid=,pcpu=,pmem=,comm=': PS })

    const processes = await readProcesses(runner, 'darwin', 2)

    expect(processes.map(row => row.pid)).toEqual([456, 123])
    expect(calls).toEqual(['ps -Ao pid=,pcpu=,pmem=,comm='])
  })

  it('reports no processes for a non-positive limit without running ps', async () => {
    const { runner, calls } = fakeRunner({})

    expect(await readProcesses(runner, 'linux', 0)).toEqual([])
    expect(await readProcesses(runner, 'linux', -1)).toEqual([])
    expect(calls).toEqual([])
  })

  it('reports no processes on a platform without ps rows', async () => {
    const { runner, calls } = fakeRunner({})

    expect(await readProcesses(runner, 'freebsd', 5)).toEqual([])
    expect(calls).toEqual([])
  })

  it('propagates a failed ps so the sampler marks the collector unavailable', async () => {
    const { runner } = fakeRunner({ 'ps -Ao pid=,pcpu=,pmem=,comm=': new Error('ps: not permitted') })
    await expect(readProcesses(runner, 'darwin', 5)).rejects.toThrow('ps: not permitted')
  })
})

describe('readHostFacts', () => {
  it('reports identity and the macOS hardware model', async () => {
    osControl.cpus = () => [{ model: 'Apple M2 Pro', speed: 2400, times: { user: 1, nice: 0, sys: 1, idle: 1, irq: 0 } }]
    const { runner, calls } = fakeRunner({ 'sysctl -n hw.model': 'Mac14,10\n' })

    const facts = await readHostFacts(runner, 'darwin')

    expect(facts).toMatchObject({
      hostname: hostname(),
      platform: 'darwin',
      arch: arch(),
      osVersion: release(),
      model: 'Mac14,10',
      chip: 'Apple M2 Pro',
      cores: 1,
      totalMemoryBytes: totalmem(),
    })
    expect(facts.uptimeSeconds).toBeGreaterThan(0)
    expect(calls).toEqual(['sysctl -n hw.model'])
  })

  it('reports an empty chip and model when the platform exposes neither', async () => {
    osControl.cpus = () => []
    const { runner, calls } = fakeRunner({})

    const facts = await readHostFacts(runner, 'freebsd')

    expect(facts).toMatchObject({ chip: '', model: '', cores: 0, platform: 'freebsd' })
    expect(calls).toEqual([])
  })

  it('reads the Linux DMI product name', async () => {
    stubReadFile({ '/sys/devices/virtual/dmi/id/product_name': '20XW0000US\n' })

    expect((await readHostFacts(fakeRunner({}).runner, 'linux')).model).toBe('20XW0000US')
  })

  it('reports an empty model when the model read fails', async () => {
    const { runner } = fakeRunner({ 'sysctl -n hw.model': new Error('sysctl: denied') })
    expect((await readHostFacts(runner, 'darwin')).model).toBe('')

    stubReadFile({})
    expect((await readHostFacts(fakeRunner({}).runner, 'linux')).model).toBe('')
  })
})
