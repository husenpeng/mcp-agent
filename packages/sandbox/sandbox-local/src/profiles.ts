/**
 * Internal platform-profile builders for the local sandbox provider.
 *
 * @module @tomato/sandbox-local/profiles
 */

import { existsSync, statSync } from 'node:fs'
import { grantArgs as landlockGrantArgs } from '@tomato/node-addon-system/landlock-run'
import { workspaceWritableRoots, writableRoots } from '@tomato/sandbox'
import type { SandboxPolicy } from '@tomato/sandbox'

/**
 * Mask one protected installation root inside the bwrap namespace: an empty tmpfs over a directory, the null
 * device over a file (an ASAR archive is a file). A missing root hides nothing and is skipped.
 * @param root - absolute protected path.
 * @returns bwrap arguments for the root, or none when it is absent.
 */
function bwrapProtectedReadArgs(root: string): string[] {
  // A missing root protects no bytes. A root that disappears between this check and the stat fails the profile
  // build instead of silently running without the mask.
  if (!existsSync(root)) return []
  return statSync(root).isDirectory() ? ['--tmpfs', root] : ['--ro-bind', '/dev/null', root]
}

/**
 * Build the bwrap profile arguments for one file-effect policy.
 * @param policy - file-effect policy to express as bwrap mounts.
 * @returns profile arguments before the trailing separator and command argv.
 */
export function bwrapProfileArgs(policy: SandboxPolicy): string[] {
  const args = ['--ro-bind', '/', '/', '--dev', '/dev', '--unshare-pid', '--proc', '/proc', '--die-with-parent']
  if (policy.mode === 'workspace-write') {
    args.push('--tmpfs', '/tmp')
    for (const root of workspaceWritableRoots(policy)) args.push('--bind', root, root)
  }
  for (const root of policy.protectedReadRoots ?? []) args.push(...bwrapProtectedReadArgs(root))
  return args
}

/**
 * Build the Landlock launcher grants for one file-effect policy. Landlock carries allow-lists only, so a
 * protected installation root cannot be denied here; the filesystem fence still refuses it, while shell reads
 * of the archive bytes stay possible on hosts whose profile language has no deny rule.
 * @param policy - file-effect policy to express as Landlock allow-list grants.
 * @returns launcher grant arguments before the trailing separator and command argv.
 */
export function landlockProfileArgs(policy: SandboxPolicy): string[] {
  const readWrite = ['/dev/null']
  if (policy.mode === 'workspace-write') {
    readWrite.push('/tmp', ...workspaceWritableRoots(policy))
  }
  return landlockGrantArgs({ readOnly: ['/'], readWrite })
}

/** Quote one path as an SBPL string literal. */
function sbplString(path: string): string {
  return `"${path.replaceAll('\\', String.raw`\\`).replaceAll('"', String.raw`\"`)}"`
}

/**
 * Build the sandbox-exec arguments and SBPL profile for one policy. The
 * workspace-owned writable roots (workspace plus explicit extra directories)
 * come from the shared {@link writableRoots} helper (canonical, deduplicated)
 * so the Seatbelt grant and the in-process fs fence
 * (`@tomato/fs-sandbox`) can never drift apart; the helper adds the
 * documented Seatbelt temp areas. Protected installation roots become
 * `file-read*` denials, which the profile language can express directly.
 * @param policy - file-effect policy to express as an SBPL profile.
 * @returns sandbox-exec arguments before the trailing separator and command argv.
 */
export function seatbeltProfileArgs(policy: SandboxPolicy): string[] {
  const forms = ['(version 1)', '(allow default)', '(deny file-write*)', `(allow file-write* (literal ${sbplString('/dev/null')}))`]
  const roots = writableRoots(policy)
  if (roots.length > 0) {
    forms.push(`(allow file-write* ${roots.map(root => `(subpath ${sbplString(root)})`).join(' ')})`)
  }
  // Read denials come after `(allow default)`; a later rule wins, and nothing below re-allows reads.
  for (const root of policy.protectedReadRoots ?? []) forms.push(`(deny file-read* (subpath ${sbplString(root)}))`)
  return ['-p', forms.join(' ')]
}
