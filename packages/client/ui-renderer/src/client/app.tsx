/**
 * Real-UI assembly closure. The whole layout tree hangs from the built-in
 * `root` slot, which is the only ctx-level slot render in the application.
 */
import type { ReactNode } from 'react'
import type { Context } from '@tomato/cordis'
import { PageSyncProvider, type PageSyncSource } from './page-sync.tsx'
import { SlotAssemblyError } from './errors.ts'

/** Inputs available after the UI renderer's inject set activates. */
export interface AssemblyDeps {
  /** Client context carrying the renderer-owned Slot registry. */
  ctx: Context
  /**
   * Resolve the page's client-entry synchronization source, when the shell has
   * one. Resolved per mount, because the module system may arrive after the
   * renderer's own activation.
   */
  pageSync?: () => PageSyncSource | undefined
}

/**
 * Build the assembled application factory. The root slot renders under the
 * page's synchronization state, so a client-entry swap holds the last
 * committed tree instead of rendering against a half-applied roster.
 * @param deps - Active UI-renderer dependencies.
 * @returns Factory producing the application React tree.
 */
export function buildRenderApp(deps: AssemblyDeps): () => ReactNode {
  const { ctx, pageSync } = deps
  return () => {
    // Resolved here so a missing registry still fails when the factory runs,
    // not when React commits the tree.
    const slots = ctx.get('slots')
    if (slots === undefined) throw new SlotAssemblyError('ui renderer: the slot registry is unavailable')
    return <PageSyncProvider source={pageSync?.()} render={() => slots.renderSlot('root', {})} />
  }
}
