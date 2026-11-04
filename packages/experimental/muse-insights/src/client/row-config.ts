/**
 * Shared identity and ledger reads for the Muse bundle rows the client half
 * configures: the row key the Plugins page dispatches under, and which rows
 * already carry a configuration page so a row never shows two.
 */

import type { Context as ClientContext } from '@tomato/cordis'

/** The bundle whose rows this client half configures. */
export const MUSE_BUNDLE = '@tomato/experimental-muse-bundle'

/**
 * The key the Plugins page dispatches one row's configuration under.
 * @param bundle - the bundle's package name.
 * @param rowId - the row id the bundle's patch declares.
 * @returns the `plugins.row.config` key.
 */
export function rowConfigKey(bundle: string, rowId: string): string {
  return `${bundle}#${rowId}`
}

/**
 * Every registration key the Plugins page currently holds for bundle rows.
 * @param ctx - the browser context whose slot ledger to read.
 * @returns the keys of the live `plugins.row.config` entries.
 */
export function registeredRowKeys(ctx: ClientContext): ReadonlySet<string> {
  return new Set(ctx.slots.entries('plugins.row.config').flatMap(entry => entry.options.key === undefined ? [] : [entry.options.key]))
}
