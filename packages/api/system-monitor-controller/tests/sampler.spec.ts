/** One sampling pass: probe failures degrade a field, they never fail the frame. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SystemSampler } from '../src/sampler.ts'
import type { CommandRunner } from '../src/collect/command.ts'

const IOREG = `+-o AGXAcceleratorG14X  <class AGXAcceleratorG14X>
    {
      "PerformanceStatistics" = {"In use system memory (driver)"=0,"Alloc system memory"=2831466496,"Tiler Utilization %"=36,"Renderer Utilization %"=35,"Device Utilization %"=36,"In use system memory"=753614848}
      "IONameMatched" = "gpu,t6020"
    }
`

const VM_STAT = `Mach Virtual Memory Statistics: (page size of 16384 bytes)
Pages free:                                     6832.
Pages active:                                 331528.
Pages inactive:                               349901.
Pages speculative:                             26414.
Pages wired down:                             141976.
Pages purgeable:                               16782.
Pages occupied by compressor:                 200000.
`

const SWAP = 'total = 2048.00M  used = 950.56M  free = 1097.44M  (encrypted)'

const NETSTAT = `Name       Mtu   Network       Address            Ipkts Ierrs     Ibytes    Opkts Oerrs     Obytes  Coll
lo0        16384 <Link#1>                         50087     0   57537948    50087     0   57537948     0
en0        1500  <Link#5>    a4:83:e7:00:00:01   100000     0   1000000   90000     0    2000000     0
`

const BATT = "Now drawing from 'AC Power'\n -InternalBattery-0 (id=1)\t80%; discharging; 2:00 remaining present: true\n"

const THERM = 'Note: No thermal warning level has been recorded\n'

/** Canned command output keyed by the exact argv the collectors run. */
function fixtureRunner(overrides: Partial<Record<string, string | Error>> = {}): CommandRunner & {
  calls: string[]
  table: Record<string, string>
} {
  const table: Record<string, string> = {
    'sysctl -n hw.model': 'Mac14,10\n',
    'vm_stat': VM_STAT,
    'sysctl -n vm.swapusage': SWAP,
    'ioreg -r -d 1 -w 0 -c IOAccelerator': IOREG,
    'netstat -ib': NETSTAT,
    'pmset -g batt': BATT,
    'pmset -g therm': THERM,
    'ps -Ao pid=,pcpu=,pmem=,comm=': '  350  12.5  1.2 /usr/libexec/WindowServer\n  1  0.3  0.1 /sbin/launchd\n',
  }
  const calls: string[] = []
  return {
    calls,
    table,
    async run(file, args) {
      const key = [file, ...args].join(' ')
      calls.push(key)
      const override = overrides[key]
      if (override instanceof Error) throw override
      const output = override ?? table[key]
      if (output === undefined) throw new Error(`unexpected command: ${key}`)
      return output
    },
  }
}

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(1_000) })
afterEach(() => { vi.useRealTimers() })

describe('SystemSampler', () => {
  it('reports identity, memory, GPU, disk, network, power, and processes', async () => {
    const sampler = new SystemSampler(fixtureRunner(), 'darwin')
    const frame = await sampler.sample({ processLimit: 5 })
    expect(frame.type).toBe('sample')
    expect(frame.host).toMatchObject({ platform: 'darwin', model: 'Mac14,10' })
    expect(frame.host.cores).toBeGreaterThan(0)
    expect(frame.host.chip.length).toBeGreaterThan(0)
    expect(frame.memory.totalBytes).toBeGreaterThan(0)
    expect(frame.memory.swapUsedBytes).toBeGreaterThan(0)
    expect(frame.gpu?.utilization).toBeCloseTo(0.36)
    expect(frame.gpu?.name).toMatch(/GPU$/u)
    expect(frame.network).toMatchObject({ receivedBytesPerSecond: 0, totalReceivedBytes: 1_000_000 })
    expect(frame.power?.batteryPercent).toBe(80)
    expect(frame.processes).toHaveLength(2)
    expect(frame.processes[0]?.name).toBe('WindowServer')
    expect(frame.unavailable).toEqual([])
    expect(frame.disk === null || frame.disk.totalBytes > 0).toBe(true)
  })

  it('turns the second pass into per-second rates and processor deltas', async () => {
    const runner = fixtureRunner()
    const sampler = new SystemSampler(runner, 'darwin')
    await sampler.sample({ processLimit: 5 })
    vi.setSystemTime(2_000)
    runner.table['netstat -ib'] = NETSTAT.replace('1000000', '1500000')
    const frame = await sampler.sample({ processLimit: 5 })
    expect(frame.network?.receivedBytesPerSecond).toBeCloseTo(500_000)
    expect(frame.cpu.perCore.length).toBeGreaterThan(0)
    expect(frame.cpu.usage).toBeGreaterThanOrEqual(0)
    expect(frame.cpu.usage).toBeLessThanOrEqual(1)

    // A counter that went backwards is an interface reset, not negative traffic.
    vi.setSystemTime(3_000)
    runner.table['netstat -ib'] = NETSTAT
    const reset = await sampler.sample({ processLimit: 5 })
    expect(reset.network?.receivedBytesPerSecond).toBe(0)
  })

  it('reuses the identity read until its window expires', async () => {
    const runner = fixtureRunner()
    const sampler = new SystemSampler(runner, 'darwin')
    await sampler.sample({ processLimit: 1 })
    vi.setSystemTime(2_000)
    await sampler.sample({ processLimit: 1 })
    expect(runner.calls.filter(call => call === 'sysctl -n hw.model')).toHaveLength(1)
    vi.setSystemTime(70_000)
    await sampler.sample({ processLimit: 1 })
    expect(runner.calls.filter(call => call === 'sysctl -n hw.model')).toHaveLength(2)
  })

  it('records probes a platform cannot serve', async () => {
    const frame = await new SystemSampler(fixtureRunner(), 'win32').sample({ processLimit: 3 })
    expect(frame.host).toMatchObject({ platform: 'win32', model: '' })
    expect(frame.gpu).toBeNull()
    expect(frame.processes).toEqual([])
    expect(frame.unavailable).toContain('network')
  })

  it('records failed probes and keeps the rest of the frame', async () => {
    const runner = fixtureRunner({
      'ps -Ao pid=,pcpu=,pmem=,comm=': new Error('ps denied'),
      'vm_stat': new Error('vm_stat denied'),
      'ioreg -r -d 1 -w 0 -c IOAccelerator': new Error('no accelerator'),
    })
    const frame = await new SystemSampler(runner, 'darwin').sample({ processLimit: 5 })
    expect(frame.processes).toEqual([])
    expect([...frame.unavailable].sort()).toEqual(['memory', 'processes'])
    expect(frame.gpu).toBeNull()
    expect(frame.memory.totalBytes).toBeGreaterThan(0)
    expect(frame.memory).toMatchObject({ usedBytes: 0, swapUsedBytes: 0 })
    expect(frame.cpu.loadAverage).toHaveLength(3)
  })
})
