/**
 * The one place this package starts a process.
 *
 * Everything the manager knows comes from Xcode's own tools, so the manager
 * takes a {@link CommandRunner} and tests substitute a recorded one. No tool is
 * invoked through a shell: argv is passed through and never re-parsed.
 * @module @tomato/experimental-phone-use-macos/src/runner
 */

import type { Context } from '@tomato/cordis'
import type { SubprocessRuntime } from '@tomato/subprocess'
import type { CommandResult, CommandRunner, CommandSpec } from './types.ts'

/** Largest stdout/stderr tail kept per command; a build log is far bigger. */
const MAX_OUTPUT_BYTES = 256 * 1024

/**
 * Build the production runner over the harness subprocess seam.
 * @param subprocess - provider-managed process service.
 * @returns a runner that collects both streams and honours the deadline.
 */
export function subprocessRunner(subprocess: SubprocessRuntime): CommandRunner {
  return {
    async run(spec: CommandSpec, signal: AbortSignal): Promise<CommandResult> {
      const controller = new AbortController()
      const abort = () => {
        controller.abort()
      }
      signal.addEventListener('abort', abort, { once: true })
      const timer = setTimeout(abort, spec.timeoutMs)
      let detach: ReturnType<typeof setTimeout> | undefined
      try {
        const handle = subprocess.spawn({
          argv: spec.argv,
          cwd: spec.cwd ?? process.cwd(),
          stdio: {
            stdin: 'ignore',
            stdout: { maxBytes: MAX_OUTPUT_BYTES },
            stderr: { maxBytes: MAX_OUTPUT_BYTES },
          },
          graceMs: 5_000,
          signal: controller.signal,
          ...spec.env === undefined ? {} : { env: { ...spec.env } },
        })
        if (spec.detachAfterMs !== undefined) {
          const detached = await Promise.race([
            handle.done.then(() => false),
            new Promise<boolean>((resolve) => {
              detach = setTimeout(() => {
                resolve(true)
              }, spec.detachAfterMs)
            }),
          ])
          if (detached) {
            return { code: 0, stdout: 'detached', stderr: '' }
          }
        }
        const outcome = await handle.done
        return {
          code: outcome.exitCode ?? -1,
          stdout: handle.collected.stdout?.readFrom(0).text ?? '',
          stderr: handle.collected.stderr?.readFrom(0).text ?? '',
        }
      } finally {
        clearTimeout(timer)
        if (detach !== undefined) clearTimeout(detach)
        signal.removeEventListener('abort', abort)
      }
    },
  }
}

/**
 * Resolve the runner from the context, failing loud when it is absent.
 * @param ctx - Host context.
 * @returns the subprocess service.
 * @throws Error when no subprocess provider is mounted.
 */
export function requireSubprocess(ctx: Context): SubprocessRuntime {
  const subprocess = ctx.get('subprocess')
  if (subprocess === undefined) throw new Error('@tomato/experimental-phone-use-macos requires a subprocess provider')
  return subprocess
}
