/**
 * Mount the generated `crew` Remote contribution. The contribution lives in
 * this optional client row rather than the shared client assembly, so a build
 * without the crew bundle references no crew package.
 * @module @tomato/experimental-robot-crew-remote/client
 */

import type { Context } from '@tomato/cordis'
// Type-only: the ctx.remote service merge from the generated Client carrier.
import type {} from '@tomato/api-gateway/client'
import crewRemote from '@tomato/api-robot-crew-controller/remote'

/** Required Client service: the typed Remote contribution mount. */
export const inject = ['remote']

/**
 * Mount the contribution and keep it installed for this plugin's lifetime.
 * @param ctx - Client root Context.
 * @returns disposer that unmounts the contribution.
 */
export async function apply(ctx: Context): Promise<() => Promise<void>> {
  return await ctx.remote.$mount(crewRemote)
}
