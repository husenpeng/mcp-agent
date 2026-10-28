import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Context } from '@tomato/cordis'
import type {} from '@tomato/subagent'

export const name = 'subagent-settlement-marker'

/** Publish a workspace marker after a subagent lifecycle end. */
export function apply(ctx: Context): void {
  ctx.on('subagent/end', () => {
    writeFileSync(join(process.cwd(), '.tomato-snapshot-subagent-settled'), '')
  })
}
