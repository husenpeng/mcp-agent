/** The shared fallback walk: which published version `tomato plugin` and the Plugins page install. */
import { describe, expect, it } from 'vitest'
import { candidateVersions, resolveCompatibleVersion, RESOLUTION_LIMIT } from '../src/resolution.ts'

const RUNTIME = '0.2.1-rc.3'

/** A manifest one TOMATO release admits, keyed by the peer range it declares. */
function manifestRequiring(range: string): object {
  return { name: 'plugin', version: '1.0.0', peerDependencies: { '@tomato/agent': range } }
}

const OLD = manifestRequiring('^0.2.1-rc.1')
const NEW = manifestRequiring('^0.2.2-rc.1')

describe('candidateVersions', () => {
  it('orders newest first and puts the requested version in front', () => {
    expect(candidateVersions(['0.28.2', '0.30.1', '0.30.0'], { requested: '0.28.2' }))
      .toEqual(['0.28.2', '0.30.1', '0.30.0'])
    expect(candidateVersions(['0.28.2', '0.30.1', '0.30.0'])).toEqual(['0.30.1', '0.30.0', '0.28.2'])
  })

  it('tries versions inside the named range before the rest', () => {
    expect(candidateVersions(['0.30.1', '0.28.2'], { range: '^0.28.0' })).toEqual(['0.28.2', '0.30.1'])
  })

  it('leaves out malformed versions and a malformed range', () => {
    expect(candidateVersions(['0.28.2', 'nightly'], {})).toEqual(['0.28.2'])
    expect(candidateVersions(['0.28.2'], { range: 'not a range' })).toEqual(['0.28.2'])
  })
})

describe('resolveCompatibleVersion', () => {
  it('selects the newest version the runtime admits', async () => {
    const resolution = await resolveCompatibleVersion({
      versions: ['0.30.1', '0.28.2'],
      runtimeVersion: RUNTIME,
      async manifestOf(version) { return version === '0.28.2' ? OLD : NEW },
    })
    expect(resolution).toEqual({
      status: 'resolved',
      runtimeVersion: RUNTIME,
      selected: '0.28.2',
      rejected: [{ version: '0.30.1', requirements: { '@tomato/agent': '^0.2.2-rc.1' } }],
    })
  })

  it('tries the requested version first and falls back with its requirements', async () => {
    const resolution = await resolveCompatibleVersion({
      versions: ['0.30.1', '0.28.2'],
      requested: '0.30.1',
      runtimeVersion: RUNTIME,
      async manifestOf(version) { return version === '0.28.2' ? OLD : NEW },
    })
    expect(resolution.status).toBe('resolved')
    expect(resolution.requested).toBe('0.30.1')
    expect(resolution.selected).toBe('0.28.2')
    expect(resolution.rejected.map(entry => entry.version)).toEqual(['0.30.1'])
  })

  it('reports none when every candidate is incompatible', async () => {
    const resolution = await resolveCompatibleVersion({
      versions: ['0.30.1', '0.30.0'],
      runtimeVersion: RUNTIME,
      async manifestOf() { return NEW },
    })
    expect(resolution.status).toBe('none')
    expect(resolution.rejected).toHaveLength(2)
  })

  it('reports none for an empty version list', async () => {
    const resolution = await resolveCompatibleVersion({
      versions: [],
      runtimeVersion: RUNTIME,
      async manifestOf() { return OLD },
    })
    expect(resolution).toEqual({ status: 'none', runtimeVersion: RUNTIME, rejected: [] })
  })

  it('leaves the first unreadable candidate unknown and later ones rejected', async () => {
    const unknown = await resolveCompatibleVersion({
      versions: ['0.30.1'],
      runtimeVersion: RUNTIME,
      async manifestOf() { throw new Error('registry unavailable') },
    })
    expect(unknown.status).toBe('unknown')
    expect(unknown.reason).toBe('registry unavailable')

    const later = await resolveCompatibleVersion({
      versions: ['0.30.1', '0.29.0', '0.28.2'],
      runtimeVersion: RUNTIME,
      async manifestOf(version) {
        if (version === '0.29.0') throw new Error('registry unavailable')
        return version === '0.28.2' ? OLD : NEW
      },
    })
    expect(later.status).toBe('resolved')
    expect(later.rejected).toEqual([
      { version: '0.30.1', requirements: { '@tomato/agent': '^0.2.2-rc.1' } },
      { version: '0.29.0', reason: 'registry unavailable' },
    ])
  })

  it('reports a non-Error refusal by its text', async () => {
    const resolution = await resolveCompatibleVersion({
      versions: ['0.30.1'],
      runtimeVersion: RUNTIME,
      async manifestOf() { throw 'the registry is closed' },
    })
    expect(resolution).toMatchObject({ status: 'unknown', reason: 'the registry is closed' })
  })

  it('treats a version the profile exempts as admitted', async () => {
    const resolution = await resolveCompatibleVersion({
      versions: ['0.30.1'],
      runtimeVersion: RUNTIME,
      exemptions: { 'plugin@1.0.0': [RUNTIME] },
      async manifestOf() { return NEW },
    })
    expect(resolution.status).toBe('resolved')
    expect(resolution.selected).toBe('0.30.1')
  })

  it('skips a candidate the caller cannot install and keeps walking', async () => {
    const resolution = await resolveCompatibleVersion({
      versions: ['0.30.1', '0.29.0', '0.28.2'],
      runtimeVersion: RUNTIME,
      async manifestOf() { return OLD },
      skip: (_manifest, version) => version === '0.30.1' ? 'prerelease version' : undefined,
    })
    expect(resolution.status).toBe('resolved')
    expect(resolution.selected).toBe('0.29.0')
    expect(resolution.rejected).toEqual([{ version: '0.30.1', reason: 'prerelease version' }])
  })

  it('reads at most the resolution limit of versions', async () => {
    const read: string[] = []
    const versions = Array.from({ length: RESOLUTION_LIMIT + 4 }, (_, index) => `0.1.${index}`)
    const resolution = await resolveCompatibleVersion({
      versions,
      runtimeVersion: RUNTIME,
      async manifestOf(version) { read.push(version); return NEW },
    })
    expect(resolution.status).toBe('none')
    expect(read).toHaveLength(RESOLUTION_LIMIT)
  })
})
