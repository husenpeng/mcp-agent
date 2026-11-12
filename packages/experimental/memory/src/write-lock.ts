/**
 * Cross-process advisory lock over one memory home. Host processes share a
 * storage directory, so a read-modify-write sequence (look up the current
 * version of an identity, then store the next one) must exclude the same
 * sequence in another process. The lock is a file created with `wx`: the
 * filesystem decides the winner, no lock state lives in memory, and a lock
 * left behind by a crashed process is stolen once it is older than
 * `staleMs`.
 * @module @tomato/experimental-memory/src/write-lock
 */

import { mkdir, open, stat, unlink } from 'node:fs/promises'
import { dirname } from 'node:path'

/** Timing bounds of one acquisition. */
export interface WriteLockOptions {
  /** Milliseconds to wait for a live holder before reporting the failure. */
  readonly timeoutMs: number
  /** Age after which a lock file belongs to a crashed process and may be removed. */
  readonly staleMs: number
}

/** Raised when a live process holds the lock past {@link WriteLockOptions.timeoutMs}. */
export class WriteLockTimeoutError extends Error {
  /**
   * @param path - Lock file that stayed held.
   * @param timeoutMs - Wait that expired.
   */
  constructor(readonly path: string, readonly timeoutMs: number) {
    super(`experimental-memory: another process holds the memory write lock '${path}' after ${timeoutMs}ms`)
    this.name = 'WriteLockTimeoutError'
  }
}

/**
 * Run one operation while holding the lock file at `path`.
 * @param path - Absolute lock file path; its parent directory is created on demand.
 * @param options - wait and staleness bounds.
 * @param operation - the sequence that must not interleave with another process.
 * @returns the operation's result.
 * @throws {@link WriteLockTimeoutError} when a live holder keeps the lock past the timeout.
 */
export async function withWriteLock<T>(
  path: string,
  options: WriteLockOptions,
  operation: () => Promise<T>,
): Promise<T> {
  const release = await acquire(path, options)
  try {
    return await operation()
  } finally {
    await release()
  }
}

/**
 * Create the lock file, waiting for a live holder and stealing an abandoned one.
 * @param path - Absolute lock file path.
 * @param options - wait and staleness bounds.
 * @returns the release callback; it removes only this process's lock file.
 */
async function acquire(path: string, options: WriteLockOptions): Promise<() => Promise<void>> {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 })
  const deadline = Date.now() + options.timeoutMs
  for (;;) {
    try {
      const handle = await open(path, 'wx', 0o600)
      try {
        await handle.writeFile(`${process.pid}\n${Date.now()}\n`)
      } finally {
        await handle.close()
      }
      return async () => {
        try {
          await unlink(path)
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
    }
    if (await stealIfStale(path, options.staleMs)) continue
    if (Date.now() >= deadline) throw new WriteLockTimeoutError(path, options.timeoutMs)
    await new Promise(resolve => setTimeout(resolve, 10 + Math.floor(Math.random() * 20)))
  }
}

/**
 * Remove a lock file whose holder is gone.
 * @param path - Absolute lock file path.
 * @param staleMs - Age after which the file is abandoned.
 * @returns whether the caller may retry immediately.
 */
async function stealIfStale(path: string, staleMs: number): Promise<boolean> {
  let age: number
  try {
    age = Date.now() - (await stat(path)).mtimeMs
  } catch (error) {
    /* v8 ignore next 2 -- the holder may release between the failed create and this stat */
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return true
    /* v8 ignore next -- a medium failure other than a missing file is environmental */
    throw error
  }
  if (age <= staleMs) return false
  try {
    await unlink(path)
    return true
  } catch (error) {
    /* v8 ignore next 2 -- a competing waiter may have stolen the file first */
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return true
    /* v8 ignore next -- a medium failure other than a missing file is environmental */
    throw error
  }
}
