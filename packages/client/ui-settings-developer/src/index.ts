/** Host half of the development-only developer page: owns the volatile recording switch. */
import type {} from '@tomato/settings'
import type { Context, Volatile } from '@tomato/cordis'
import z from '@tomato/schemastery'

/** Runtime switch projected to the browser. */
export interface Config {
  /** Whether the developer page records this page's gateway exchanges. */
  enabled: Volatile<boolean>
}

/** Live switch; volatile so the development page never writes a profile. */
export const Config = z.object({
  enabled: z.boolean().default(false).volatile(),
})

/**
 * Register the settings namespace without a generated page; the browser half owns the page.
 * @param ctx - Host plugin context.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (child) => { child.effect(() => child.settings.configure({ auto: false }, ctx.fiber)) })
}
