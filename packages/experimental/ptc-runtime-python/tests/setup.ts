import { Context } from '@tomato/cordis'
import Sandbox from '@tomato/sandbox-local'
import SandboxPolicy from '@tomato/sandbox-policy'
import SessionProjections from '@tomato/session-projection'
import { onTestFinished } from 'vitest'
import type { SandboxMode } from '@tomato/sandbox'

/** Mount the Python runtime's policy and confinement providers with owned teardown. */
export async function createRuntimeContext(policy: { mode?: SandboxMode; workspaceRoot?: string } = {}): Promise<Context> {
  const ctx = new Context()
  onTestFinished(async () => { await ctx.fiber.dispose() })
  await ctx.plugin(Sandbox, {})
  await ctx.plugin(SessionProjections)
  await ctx.plugin(SandboxPolicy, { mode: 'danger-full-access', ...policy })
  return ctx
}
