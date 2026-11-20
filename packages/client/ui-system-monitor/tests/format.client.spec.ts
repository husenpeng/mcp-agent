/** Number formatting behind the monitor overlay. */
import { describe, expect, it } from 'vitest'
import { formatBytes, formatPercent, formatRate, formatUptime, shortProcessName } from '../src/client/format.ts'

describe('formatBytes', () => {
  it.each([
    [0, '0 B'],
    [512, '512 B'],
    [1024, '1.0 KB'],
    [100 * 1024, '100 KB'],
    [1536, '1.5 KB'],
    [1_500_000, '1.4 MB'],
    [12.5 * 1024 ** 3, '12.5 GB'],
    [3 * 1024 ** 4, '3.0 TB'],
    [2048 * 1024 ** 5, '2048 PB'],
  ])('formats %d bytes as %s', (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected)
  })

  it('clamps negative and non-finite input', () => {
    expect(formatBytes(-5)).toBe('0 B')
    expect(formatBytes(Number.NaN)).toBe('0 B')
  })
})

describe('formatRate', () => {
  it('appends the per-second unit', () => {
    expect(formatRate(820 * 1024)).toBe('820 KB/s')
  })
})

describe('formatPercent', () => {
  it.each([
    [0, '0%'],
    [0.634, '63%'],
    [1, '100%'],
    [-1, '0%'],
    [4, '100%'],
    [Number.NaN, '0%'],
  ])('formats %d as %s', (ratio, expected) => {
    expect(formatPercent(ratio)).toBe(expected)
  })
})

describe('formatUptime', () => {
  it.each([
    [3 * 86_400 + 4 * 3_600, '3d 4h'],
    [4 * 3_600 + 12 * 60, '4h 12m'],
    [12 * 60, '12m'],
    [-10, '0m'],
    [Number.NaN, '0m'],
  ])('formats %d seconds as %s', (seconds, expected) => {
    expect(formatUptime(seconds)).toBe(expected)
  })
})

describe('shortProcessName', () => {
  it('keeps the executable basename', () => {
    expect(shortProcessName('/usr/libexec/WindowServer')).toBe('WindowServer')
    expect(shortProcessName('C:\\Program Files\\App\\app.exe')).toBe('app.exe')
  })

  it('keeps a bare command and truncates a long one', () => {
    expect(shortProcessName('node')).toBe('node')
    expect(shortProcessName('')).toBe('')
    expect(shortProcessName(`/bin/${'a'.repeat(40)}`)).toBe(`${'a'.repeat(27)}…`)
  })
})
