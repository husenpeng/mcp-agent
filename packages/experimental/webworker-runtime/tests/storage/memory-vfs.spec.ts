/**
 * The identity, timestamp, link, mutation, and durability-sink guarantees
 * MemoryVfs owes its consumers, asserted directly rather than through the
 * `node:fs` bridge.
 *
 * `@tomato/fs-local` builds a version token from `dev:ino:size:mtimeNs:ctimeNs` and
 * refuses a write whose token moved since it read. Two properties carry that:
 * `ino` identifies the entry at a path, and `mtimeMs` moves on every write. The
 * timestamp cases freeze the clock, because these writes are in memory and two
 * revisions routinely land in the same millisecond — a real-clock test passes
 * whether or not the strict increment exists.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryVfs } from '../../src/storage/memory.ts'
import type { VfsBigIntStats, VfsMutation, VfsMutationSink, VfsStats } from '../../src/storage/types.ts'

const identity = (vfs: MemoryVfs, path: string): bigint =>
  (vfs.statSync(path, { bigint: true }) as VfsBigIntStats).ino

const linkCount = (vfs: MemoryVfs, path: string): bigint =>
  (vfs.statSync(path, { bigint: true }) as VfsBigIntStats).nlink

const modified = (vfs: MemoryVfs, path: string): number => (vfs.statSync(path) as VfsStats).mtimeMs

afterEach(() => { vi.restoreAllMocks() })

describe('entry identity', () => {
  it('distinguishes paths and holds each identity across repeated stats', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/tomato/one.txt', 'one')
    vfs.seed('/tomato/two.txt', 'two')
    const first = identity(vfs, '/tomato/one.txt')
    expect(identity(vfs, '/tomato/two.txt')).not.toBe(first)
    expect(identity(vfs, '/tomato/one.txt')).toBe(first)
  })

  it('forgets the identities under a directory removed as a subtree', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/tomato/skills/git/SKILL.md', '# git\n')
    const before = identity(vfs, '/tomato/skills/git/SKILL.md')
    vfs.rmSync('/tomato/skills', { recursive: true })
    vfs.seed('/tomato/skills/git/SKILL.md', '# git rebuilt\n')
    expect(identity(vfs, '/tomato/skills/git/SKILL.md')).not.toBe(before)
  })

  it('moves the source identity when a file replaces another path', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/tomato/from.txt', 'moved')
    vfs.seed('/tomato/to.txt', 'replaced')
    const [source, destination] = [identity(vfs, '/tomato/from.txt'), identity(vfs, '/tomato/to.txt')]
    vfs.renameSync('/tomato/from.txt', '/tomato/to.txt')
    const renamed = identity(vfs, '/tomato/to.txt')
    expect(vfs.readFileSync('/tomato/to.txt', 'utf8')).toBe('moved')
    expect([renamed === source, renamed === destination]).toEqual([true, false])
  })
})

describe('modification time', () => {
  it('hydrates explicit metadata without confusing timestamps with permission bits', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/tomato/restored', 'value', { mode: 0o600, mtimeMs: 1_600_000_000_000 })
    vfs.seedDirectory('/tomato/restored-directory', { mode: 0o700, mtimeMs: 1_600_000_000_001 })
    const stats = vfs.statSync('/tomato/restored') as VfsStats
    const directory = vfs.statSync('/tomato/restored-directory') as VfsStats
    expect([stats.mode & 0o777, stats.mtimeMs]).toEqual([0o600, 1_600_000_000_000])
    expect([directory.mode & 0o777, directory.mtimeMs]).toEqual([0o700, 1_600_000_000_001])
  })

  it('advances on every write even while the clock stands still', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    const vfs = new MemoryVfs()
    vfs.seed('/tomato/log.jsonl', 'first\n')
    const seeded = modified(vfs, '/tomato/log.jsonl')
    vfs.writeFileSync('/tomato/log.jsonl', 'second\n')
    const written = modified(vfs, '/tomato/log.jsonl')
    vfs.appendFileSync('/tomato/log.jsonl', 'third\n')
    const appended = modified(vfs, '/tomato/log.jsonl')
    vfs.truncateSync('/tomato/log.jsonl', 6)
    const truncated = modified(vfs, '/tomato/log.jsonl')
    expect([written > seeded, appended > written, truncated > appended]).toEqual([true, true, true])
    // One millisecond per revision: the increment is the minimum that separates
    // two tokens, not a coarser bump that would skew a real timestamp.
    expect(truncated - seeded).toBe(3)
  })

  it('takes the clock once the clock has passed the entry', () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    const vfs = new MemoryVfs()
    vfs.seed('/tomato/log.jsonl', 'first\n')
    clock.mockReturnValue(1_700_000_005_000)
    vfs.writeFileSync('/tomato/log.jsonl', 'second\n')
    expect(modified(vfs, '/tomato/log.jsonl')).toBe(1_700_000_005_000)
  })

  it('extends truncation with zero bytes', async () => {
    const vfs = new MemoryVfs()
    vfs.seed('/tomato/file', new Uint8Array([1, 2]))
    vfs.truncateSync('/tomato/file', 5)
    expect([...vfs.readFileSync('/tomato/file') as Uint8Array]).toEqual([1, 2, 0, 0, 0])
    const handle = vfs.open('/tomato/file', 'r+')
    await handle.truncate(7)
    expect([...vfs.readFileSync('/tomato/file') as Uint8Array]).toEqual([1, 2, 0, 0, 0, 0, 0])
  })

  it('advances a directory only when its immediate entry set changes', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    const vfs = new MemoryVfs()
    vfs.seedDirectory('/tomato/workspace')
    const empty = modified(vfs, '/tomato/workspace')
    vfs.writeFileSync('/tomato/workspace/file.txt', 'one')
    const created = modified(vfs, '/tomato/workspace')
    vfs.writeFileSync('/tomato/workspace/file.txt', 'two')
    const rewritten = modified(vfs, '/tomato/workspace')
    vfs.rmSync('/tomato/workspace/file.txt')
    const removed = modified(vfs, '/tomato/workspace')
    expect([created > empty, rewritten === created, removed > rewritten]).toEqual([true, true, true])
  })
})

describe('mutation publication', () => {
  it('publishes only committed runtime changes and keeps image seeding silent', () => {
    const vfs = new MemoryVfs()
    const mutations: VfsMutation[] = []
    vfs.subscribe((mutation) => { mutations.push(mutation) })
    vfs.seed('/tomato/seeded.txt', 'seeded')
    expect(mutations).toEqual([])
    vfs.writeFileSync('/tomato/seeded.txt', 'changed')
    vfs.mkdirSync('/tomato/created')
    vfs.chmodSync('/tomato/created', 0o700)
    vfs.renameSync('/tomato/seeded.txt', '/tomato/renamed.txt')
    vfs.rmSync('/tomato/created', { recursive: true })
    expect(mutations.map(mutation => ({
      kind: mutation.kind,
      path: mutation.path,
      ...mutation.kind === 'write' ? { entryChanged: mutation.entryChanged } : {},
      ...mutation.kind === 'chmod' ? { mode: mutation.mode } : {},
    }))).toEqual([
      { kind: 'write', path: '/tomato/seeded.txt', entryChanged: false },
      { kind: 'mkdir', path: '/tomato/created' },
      { kind: 'chmod', path: '/tomato/created', mode: 0o700 },
      { kind: 'remove', path: '/tomato/seeded.txt' },
      { kind: 'write', path: '/tomato/renamed.txt', entryChanged: true },
      { kind: 'remove', path: '/tomato/created' },
    ])
    const renamed = mutations[4]
    expect(renamed?.kind === 'write' && new TextDecoder().decode(renamed.bytes)).toBe('changed')
    expect(() => { vfs.writeFileSync('/missing/file', 'no') }).toThrow(/ENOENT/)
    expect(mutations).toHaveLength(6)
  })

  it('contains a faulty observer and lets disposal stop later notifications', () => {
    const vfs = new MemoryVfs()
    vfs.seedDirectory('/tomato')
    const reported = vi.spyOn(console, 'error').mockImplementation(() => {})
    const first = vfs.subscribe(() => { throw new Error('observer failed') })
    const seen: string[] = []
    const second = vfs.subscribe((mutation) => { seen.push(mutation.path) })
    vfs.writeFileSync('/tomato/one', '1')
    first()
    second()
    vfs.writeFileSync('/tomato/two', '2')
    expect(seen).toEqual(['/tomato/one'])
    expect(reported).toHaveBeenCalledOnce()
  })

  it('feeds the same complete mutations to a durable sink and live subscribers', async () => {
    const recorded: VfsMutation[] = []
    let flushes = 0
    const sink: VfsMutationSink = {
      record: (mutation) => { recorded.push(mutation) },
      flush: async () => { flushes += 1 },
    }
    const vfs = new MemoryVfs({ sink })
    vfs.seedDirectory('/tomato')
    const observed: VfsMutation[] = []
    vfs.subscribe((mutation) => { observed.push(mutation) })
    vfs.writeFileSync('/tomato/log', 'a')
    vfs.appendFileSync('/tomato/log', 'bc')
    await vfs.flush()
    expect(observed).toEqual(recorded)
    expect(observed[0]).toBe(recorded[0])
    expect(recorded[0]).toMatchObject({ kind: 'write', path: '/tomato/log', mode: 0o644, entryChanged: true })
    expect(recorded[1]).toMatchObject({ kind: 'write', path: '/tomato/log', mode: 0o644, entryChanged: false, appendedFrom: 1 })
    expect(recorded[1]?.kind === 'write' && new TextDecoder().decode(recorded[1].bytes)).toBe('abc')
    expect(flushes).toBe(1)
  })

  it('publishes descriptor writes at the file identity current path', () => {
    const mutations: VfsMutation[] = []
    const vfs = new MemoryVfs()
    vfs.seed('/tomato/source', 'old')
    const descriptor = vfs.openFileSync('/tomato/source', 'r+')
    vfs.subscribe((mutation) => { mutations.push(mutation) })
    vfs.renameSync('/tomato/source', '/tomato/destination')
    mutations.length = 0
    descriptor.write(0, new TextEncoder().encode('new'))
    expect(mutations.map(mutation => mutation.path)).toEqual(['/tomato/destination'])
    expect(vfs.readFileSync('/tomato/destination', 'utf8')).toBe('new')
    vfs.unlinkSync('/tomato/destination')
    mutations.length = 0
    descriptor.write(0, new TextEncoder().encode('detached'))
    expect(mutations).toEqual([])
    expect(new TextDecoder().decode(descriptor.read(0, descriptor.stat().size))).toBe('detached')
  })

  it('reports the path identity through a BigInt file handle stat', async () => {
    const vfs = new MemoryVfs()
    vfs.seed('/tomato/session.lock', '')
    const handle = vfs.open('/tomato/session.lock', 'w')
    const held = await handle.stat({ bigint: true }) as VfsBigIntStats
    const current = vfs.statSync('/tomato/session.lock', { bigint: true }) as VfsBigIntStats

    expect([held.dev, held.ino]).toEqual([current.dev, current.ino])
    await handle.chmod(0o600)
    expect((vfs.statSync('/tomato/session.lock') as VfsStats).mode & 0o777).toBe(0o600)
    await handle.close()
  })

  it('decomposes a directory rename into replayable destination state', () => {
    const recorded: VfsMutation[] = []
    const vfs = new MemoryVfs({
      sink: { record: (mutation) => { recorded.push(mutation) }, flush: () => Promise.resolve() },
    })
    vfs.seedDirectory('/tomato/staging/nested', { mode: 0o700 })
    vfs.seed('/tomato/staging/nested/file', 'value', { mode: 0o600 })
    vfs.renameSync('/tomato/staging', '/tomato/published')

    expect(recorded.map(mutation => [mutation.kind, mutation.path])).toEqual([
      ['remove', '/tomato/staging'],
      ['mkdir', '/tomato/published'],
      ['mkdir', '/tomato/published/nested'],
      ['write', '/tomato/published/nested/file'],
    ])
    expect(recorded[3]).toMatchObject({ kind: 'write', mode: 0o600, entryChanged: true })
    expect(recorded[3]?.kind === 'write' && new TextDecoder().decode(recorded[3].bytes)).toBe('value')
  })
})

describe('directory rename', () => {
  it('rejects file, non-empty directory, and missing-parent destinations before mutation', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/tomato/source/nested/file', 'source')
    vfs.seed('/tomato/file', 'destination')
    vfs.seed('/tomato/non-empty/child', 'destination')
    const mutations: VfsMutation[] = []
    vfs.subscribe((mutation) => { mutations.push(mutation) })

    expect(() => { vfs.renameSync('/tomato/source', '/tomato/file') })
      .toThrow(expect.objectContaining({ code: 'ENOTDIR' }))
    expect(() => { vfs.renameSync('/tomato/source', '/tomato/non-empty') })
      .toThrow(expect.objectContaining({ code: 'ENOTEMPTY' }))
    expect(() => { vfs.renameSync('/tomato/source', '/missing/destination') })
      .toThrow(expect.objectContaining({ code: 'ENOENT' }))

    expect(vfs.readFileSync('/tomato/source/nested/file', 'utf8')).toBe('source')
    expect(vfs.readFileSync('/tomato/file', 'utf8')).toBe('destination')
    expect(vfs.readFileSync('/tomato/non-empty/child', 'utf8')).toBe('destination')
    expect(mutations).toEqual([])
  })

  it('replaces an empty directory with the source subtree', () => {
    const vfs = new MemoryVfs()
    vfs.seedDirectory('/tomato/source/nested', { mode: 0o700 })
    vfs.seed('/tomato/source/nested/file', 'source')
    vfs.seedDirectory('/tomato/destination', { mode: 0o711 })

    vfs.renameSync('/tomato/source', '/tomato/destination')

    expect(vfs.existsSync('/tomato/source')).toBe(false)
    expect(vfs.readFileSync('/tomato/destination/nested/file', 'utf8')).toBe('source')
    expect((vfs.statSync('/tomato/destination') as VfsStats).mode & 0o777).toBe(0o755)
    expect((vfs.statSync('/tomato/destination/nested') as VfsStats).mode & 0o777).toBe(0o700)
  })
})

describe('hard links', () => {
  it('shares identity, bytes, and mode until one name is removed', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/tomato/session.jsonl', 'committed\n')
    vfs.linkSync('/tomato/session.jsonl', '/tomato/session-latest.jsonl')
    vfs.linkSync('/tomato/session-latest.jsonl', '/tomato/session-archive.jsonl')
    expect(identity(vfs, '/tomato/session-latest.jsonl')).toBe(identity(vfs, '/tomato/session.jsonl'))
    expect(linkCount(vfs, '/tomato/session.jsonl')).toBe(3n)
    expect(vfs.readFileSync('/tomato/session-latest.jsonl', 'utf8')).toBe('committed\n')
    const changedPaths: string[] = []
    vfs.subscribe((mutation) => { changedPaths.push(mutation.path) })
    vfs.appendFileSync('/tomato/session.jsonl', 'appended\n')
    expect(changedPaths).toEqual([
      '/tomato/session.jsonl',
      '/tomato/session-latest.jsonl',
      '/tomato/session-archive.jsonl',
    ])
    expect(vfs.readFileSync('/tomato/session.jsonl', 'utf8')).toBe('committed\nappended\n')
    expect(vfs.readFileSync('/tomato/session-latest.jsonl', 'utf8')).toBe('committed\nappended\n')
    vfs.chmodSync('/tomato/session-latest.jsonl', 0o600)
    expect((vfs.statSync('/tomato/session.jsonl') as VfsStats).mode & 0o777).toBe(0o600)
    vfs.unlinkSync('/tomato/session-latest.jsonl')
    expect(linkCount(vfs, '/tomato/session.jsonl')).toBe(2n)
    vfs.unlinkSync('/tomato/session-archive.jsonl')
    expect(linkCount(vfs, '/tomato/session.jsonl')).toBe(1n)
    expect(vfs.readFileSync('/tomato/session.jsonl', 'utf8')).toBe('committed\nappended\n')
  })

  it('treats rename between names of the same node as a no-op', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/tomato/source', 'value')
    vfs.linkSync('/tomato/source', '/tomato/alias')
    const mutations: VfsMutation[] = []
    vfs.subscribe((mutation) => { mutations.push(mutation) })

    vfs.renameSync('/tomato/source', '/tomato/alias')

    expect(vfs.readFileSync('/tomato/source', 'utf8')).toBe('value')
    expect(vfs.readFileSync('/tomato/alias', 'utf8')).toBe('value')
    expect(linkCount(vfs, '/tomato/source')).toBe(2n)
    expect(mutations).toEqual([])
  })

  it('retargets linked names through file replacement and directory moves', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/tomato/replacement', 'replacement')
    vfs.seed('/tomato/target', 'old')
    vfs.linkSync('/tomato/target', '/tomato/target-alias')
    const replaced = vfs.openFileSync('/tomato/target', 'r+')
    vfs.renameSync('/tomato/replacement', '/tomato/target')
    const mutations: VfsMutation[] = []
    vfs.subscribe((mutation) => { mutations.push(mutation) })

    replaced.write(0, new TextEncoder().encode('changed'))
    expect(mutations.map(mutation => mutation.path)).toEqual(['/tomato/target-alias'])
    expect(vfs.readFileSync('/tomato/target', 'utf8')).toBe('replacement')
    expect(vfs.readFileSync('/tomato/target-alias', 'utf8')).toBe('changed')
    expect(linkCount(vfs, '/tomato/target-alias')).toBe(1n)

    vfs.seed('/tomato/tree/file', 'tree')
    vfs.linkSync('/tomato/tree/file', '/tomato/outside')
    const moved = vfs.openFileSync('/tomato/tree/file', 'r+')
    vfs.renameSync('/tomato/tree', '/tomato/moved')
    mutations.length = 0
    moved.write(0, new TextEncoder().encode('moved'))
    expect(mutations.map(mutation => mutation.path)).toEqual(['/tomato/outside', '/tomato/moved/file'])
    expect(linkCount(vfs, '/tomato/moved/file')).toBe(2n)

    vfs.rmSync('/tomato/moved', { recursive: true })
    mutations.length = 0
    moved.write(0, new TextEncoder().encode('kept!'))
    expect(mutations.map(mutation => mutation.path)).toEqual(['/tomato/outside'])
    expect(vfs.readFileSync('/tomato/outside', 'utf8')).toBe('kept!')
    expect(linkCount(vfs, '/tomato/outside')).toBe(1n)
  })

  it('rejects renaming a file over an existing directory', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/tomato/file', 'value')
    vfs.seedDirectory('/tomato/directory')
    expect(() => { vfs.renameSync('/tomato/file', '/tomato/directory') }).toThrow(expect.objectContaining({ code: 'EISDIR' }))
    expect(vfs.readFileSync('/tomato/file', 'utf8')).toBe('value')
    expect(vfs.statSync('/tomato/directory').isDirectory()).toBe(true)
  })
})
