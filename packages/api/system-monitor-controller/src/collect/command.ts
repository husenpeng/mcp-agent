/**
 * Host command execution shared by every collector: one `execFile` per
 * reading, argv only (never a shell), under a fixed timeout and output cap so
 * a wedged or noisy command cannot stall the sampler. Parsers receive command
 * text through {@link CommandRunner}, so tests inject fixtures instead of
 * spawning processes.
 * @module @tomato/api-system-monitor-controller/collect/command
 */

import { execFile } from 'node:child_process'

/** Per-call timeout when the caller names none, in milliseconds. */
const DEFAULT_TIMEOUT_MS = 2000

/** Output cap for one command; a real reading is a few kilobytes. */
const MAX_BUFFER_BYTES = 8 * 1024 * 1024

/** Runs one host command and returns its standard output. */
export interface CommandRunner {
  /**
   * Run an executable without shell interpretation.
   * @param file - executable path or PATH name.
   * @param args - argv array the executable receives verbatim.
   * @returns standard output decoded as UTF-8.
   */
  run(file: string, args: readonly string[]): Promise<string>
}

/**
 * Create the process-backed runner the sampler uses on a real host.
 * `LC_ALL=C` keeps command output in the locale the parsers expect.
 * @param timeoutMs - per-call timeout in milliseconds; a command still running
 * when it expires is killed with `SIGKILL` and its call rejects.
 * @returns a runner that rejects on a nonzero exit, a timeout, or a spawn
 * failure, carrying Node's `ExecFileException` so callers can inspect `code`,
 * `killed`, and `signal`.
 */
export function createCommandRunner(timeoutMs: number = DEFAULT_TIMEOUT_MS): CommandRunner {
  return {
    run(file, args) {
      return new Promise<string>((resolve, reject) => {
        execFile(
          file,
          [...args],
          {
            encoding: 'utf8',
            maxBuffer: MAX_BUFFER_BYTES,
            timeout: timeoutMs,
            killSignal: 'SIGKILL',
            env: { ...process.env, LC_ALL: 'C' },
          },
          (error, stdout) => {
            if (error !== null) {
              // Node raises an ExecFileException, an Error subclass carrying code, killed, and signal.
              // oxlint-disable-next-line typescript/prefer-promise-reject-errors -- that is the Error to reject with.
              reject(error)
              return
            }
            resolve(stdout)
          },
        )
      })
    },
  }
}
