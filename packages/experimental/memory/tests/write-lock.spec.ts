/** Cross-process write lock: mutual exclusion, stale takeover, and failure bounds. */
import { mkdir, mkdtemp, rm, unlink, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { WriteLockTimeoutError, withWriteLock } from '@tomato/experimental-memory'

const directories: string[] = []

afterEach(async () => {
  for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true })
})

/** A lock path inside a fresh temporary directory. */
async function lockPath(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'tomato-memory-lock-'))
  directories.push(directory)
  return join(directory, 'write.lock')
}

describe('memory write lock', () => {
  it('runs the operation and removes the lock file', async () => {
    const path = await lockPath()
    await expect(withWriteLock(path, { timeoutMs: 500, staleMs: 10_000 }, async () => 'done')).resolves.toBe('done')
    await expect(unlink(path)).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('waits for a live holder to release it', async () => {
    const path = await lockPath()
    let holding!: () => void
    const started = new Promise<void>((resolve) => { holding = resolve })
    const held = withWriteLock(path, { timeoutMs: 500, staleMs: 10_000 }, async () => {
      holding()
      await new Promise(resolve => setTimeout(resolve, 50))
      return 'holder'
    })
    await started
    const waiter = withWriteLock(path, { timeoutMs: 500, staleMs: 10_000 }, async () => 'waiter')
    await expect(Promise.all([held, waiter])).resolves.toEqual(['holder', 'waiter'])
  })

  it('reports a live holder that outlasts the timeout', async () => {
    const path = await lockPath()
    let holding!: () => void
    const started = new Promise<void>((resolve) => { holding = resolve })
    const held = withWriteLock(path, { timeoutMs: 2_000, staleMs: 10_000 }, async () => {
      holding()
      await new Promise(resolve => setTimeout(resolve, 150))
    })
    await started
    await expect(withWriteLock(path, { timeoutMs: 20, staleMs: 10_000 }, async () => 'never'))
      .rejects.toBeInstanceOf(WriteLockTimeoutError)
    await held
  })

  it('steals a lock left behind by a crashed process', async () => {
    const path = await lockPath()
    await writeFile(path, '999999\n1\n')
    const old = new Date(Date.now() - 60_000)
    await utimes(path, old, old)
    await expect(withWriteLock(path, { timeoutMs: 500, staleMs: 10_000 }, async () => 'stolen')).resolves.toBe('stolen')
  })

  it('fails loudly when the lock path cannot be created', async () => {
    const path = await lockPath()
    // A regular file where the lock's directory would be: creating beneath it fails.
    const blocked = join(path, 'blocked')
    await writeFile(path, 'blocked\n')
    const failure = await withWriteLock(blocked, { timeoutMs: 500, staleMs: 10_000 }, async () => 'never').then(
      () => new Error('expected the lock to fail'),
      (error: unknown) => error,
    )
    expect(failure).toBeInstanceOf(Error)
    expect((failure as NodeJS.ErrnoException).code).toMatch(/^(ENOTDIR|EEXIST)$/u)
  })

  it('releases a lock the operation removed itself', async () => {
    const path = await lockPath()
    await expect(withWriteLock(path, { timeoutMs: 500, staleMs: 10_000 }, async () => {
      await unlink(path)
      return 'gone'
    })).resolves.toBe('gone')
  })

  it('surfaces a release that cannot remove the lock', async () => {
    const path = await lockPath()
    const failure = await withWriteLock(path, { timeoutMs: 500, staleMs: 10_000 }, async () => {
      // Replace the file with a directory: releasing it cannot unlink the path.
      await unlink(path)
      await mkdir(path)
    }).then(() => undefined, (error: unknown) => error)
    expect(failure).toBeInstanceOf(Error)
    await rm(path, { recursive: true, force: true })
  })

  it('reports a create that fails for a reason other than an existing lock', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'tomato-memory-lock-'))
    directories.push(directory)
    // A file name no filesystem accepts: creating it fails before any lock exists.
    const path = join(directory, `${'x'.repeat(300)}.lock`)
    const failure = await withWriteLock(path, { timeoutMs: 500, staleMs: 10_000 }, async () => 'never')
      .then(() => undefined, (error: unknown) => error)
    expect(failure).toBeInstanceOf(Error)
    expect(failure).not.toBeInstanceOf(WriteLockTimeoutError)
  })
})

