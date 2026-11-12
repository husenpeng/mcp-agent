/** Legacy on-disk memory formats open under the current domains, and the next write restamps them. */
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@tomato/cordis'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import type { Domain } from '@tomato/storage-domain'
import { JsonStorageBackend } from '@tomato/storage-json'
import { episodeDomain, memoryDomain } from '@tomato/experimental-memory'

const contexts: Context[] = []
const directories: string[] = []

afterEach(async () => {
  for (const ctx of contexts.splice(0)) await ctx.fiber.dispose()
  for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true })
})

/** Open both domains over a JSON root seeded with the recorded v1 documents. */
async function openLegacy(): Promise<{
  memory: Domain<typeof memoryDomain>
  episodes: Domain<typeof episodeDomain>
  root: string
}> {
  const root = await mkdtemp(join(tmpdir(), 'tomato-memory-legacy-'))
  directories.push(root)
  await cp(join(import.meta.dirname, 'fixtures', 'legacy-v1'), root, { recursive: true })
  const ctx = new Context()
  contexts.push(ctx)
  await ctx.plugin(Storage)
  const backend = new JsonStorageBackend(root)
  ctx.effect(() => {
    const unregister = ctx.storage.backend.register('json', backend)
    return async () => { unregister(); await backend.close() }
  })
  const facility = new DomainFacility(ctx, { backend: 'json' })
  return {
    memory: await facility.open(memoryDomain),
    episodes: await facility.open(episodeDomain),
    root,
  }
}

describe('legacy memory domains', () => {
  it('reads records written before the workspace-identity and version-start fields', async () => {
    const { memory } = await openLegacy()
    expect(memory.table('records').size).toBe(1)
    const [key, record] = [...memory.table('records').entries()][0]!
    expect(key).toBe(record.id)
    // A pre-v2 scope carried the canonical path alone; activation maps it later.
    expect(record.scope).toEqual({ kind: 'workspace', path: '/work/legacy-project' })
    // Pre-v3 records have no version start; activation fills it.
    expect(record.validFrom).toBeUndefined()
  })

  it('reads an episode whose concept is a stored path longer than the label bound', async () => {
    const { episodes } = await openLegacy()
    const [, record] = [...episodes.table('records').entries()][0]!
    expect(record.scope).toEqual({ kind: 'project', path: '/work/legacy-project' })
    expect(record.concepts).toContain(
      'sdk=/applications/xcode.app/contents/developer/platforms/iphoneos.platform/developer/sdks/iphoneos27.0.sdk;',
    )
  })

  it('leaves the legacy document alone and publishes the next record as its own document', async () => {
    const { memory, root } = await openLegacy()
    const path = join(root, 'tomato_memory.json')
    const readUnit = async (): Promise<{ version: number }> =>
      (JSON.parse(await readFile(path, 'utf8')) as { unit: { version: number } }).unit
    expect((await readUnit()).version).toBe(1)
    const [key, record] = [...memory.table('records').entries()][0]!
    await memory.table('records').put(key, { ...record, updatedAt: 1793000001000 })
    // The per-record layout bootstraps from the legacy whole-unit file once and
    // then writes one version-stamped document per record; the legacy file is
    // neither restamped nor deleted, so an older build can still read it.
    expect((await readUnit()).version).toBe(1)
    const document = JSON.parse(
      await readFile(join(root, 'tomato_memory', 'records', `${key}.json`), 'utf8'),
    ) as { version: number; record: { id: string; updatedAt: number } }
    expect(document.version).toBe(memoryDomain.version)
    expect(document.record.id).toBe(key)
    expect(document.record.updatedAt).toBe(1793000001000)
  })
})
