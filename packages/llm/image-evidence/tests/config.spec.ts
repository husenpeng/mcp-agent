import { describe, expect, it } from 'vitest'
import { resolveConfig } from '../src/config.ts'

describe('resolveConfig', () => {
  it('materializes every default and keeps the engine order', () => {
    const config = resolveConfig({ engines: [{ provider: 'acme', model: 'vision-1' }] })
    expect(config.engines).toEqual([{ provider: 'acme', model: 'vision-1' }])
    expect(config).toMatchObject({
      maxChars: 8_000,
      contractVersion: 1,
      timeoutMs: 120_000,
      failureCooldownMs: 300_000,
      retentionDays: 30,
      maxCachedBytes: 64 * 1024 * 1024,
    })
  })

  it('trims engine fields and rejects an incomplete engine', () => {
    expect(resolveConfig({ engines: [{ provider: ' acme ', model: ' vision ' }] }).engines)
      .toEqual([{ provider: 'acme', model: 'vision' }])
    expect(() => resolveConfig({ engines: [{ provider: '', model: 'vision' }] }))
      .toThrow(/engines\[0\]/)
  })

  it('refuses limits the runtime cannot honor', () => {
    expect(() => resolveConfig({ maxChars: 0 })).toThrow(/maxChars/)
    expect(() => resolveConfig({ contractVersion: 1.5 })).toThrow(/contractVersion/)
    expect(() => resolveConfig({ failureCooldownMs: -1 })).toThrow(/failureCooldownMs/)
  })

  it('keeps the bridge disabled with no engines', () => {
    expect(resolveConfig().engines).toEqual([])
  })
})
