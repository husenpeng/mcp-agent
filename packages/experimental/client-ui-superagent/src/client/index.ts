/** Bind the generated superagent Remote descriptors to the source-tested browser lifecycle. */

import type { Context as ClientContext } from '@tomato/cordis'
import remote from '@tomato/superagent-runtime/remote'
import { mountSuperagentTickets } from './mount.ts'

export { inject } from './mount.ts'

/**
 * Mount the ticket panel and its Remote.
 * @param ctx - browser plugin context.
 * @returns disposer for the panel and Remote contribution.
 */
export async function apply(ctx: ClientContext): Promise<() => Promise<void>> {
  return await mountSuperagentTickets(ctx, remote)
}
