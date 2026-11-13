/**
 * Host-plane owner of the remembered creator feedback. The storage-domain
 * facility admits one open handle per domain name per process, so this row
 * belongs to the Host composition and opens `creator_search_feedback` once;
 * every preset's `tool-creator-search` row reads and writes the same store
 * through `ctx.creatorFeedback`.
 * @module @tomato/tool-creator-search/host
 */

import type { Context } from '@tomato/cordis'
import type {} from '@tomato/storage-domain'
import { creatorFeedbackDomainSpec, CreatorFeedbackStore } from './feedback.ts'

declare module '@tomato/cordis' {
  interface Context {
    /** Durable creator decisions shared by every preset that mounts the creator tools. */
    creatorFeedback: CreatorFeedbackStore
  }
}

/** Cordis plugin name used by loader diagnostics. */
export const name = 'creator-feedback'

/** The durable storage the store opens its domain through. */
export const inject = ['storageDomain']

/**
 * Open the feedback domain and publish its store as `creatorFeedback`. The
 * service is withdrawn before the domain closes, so no consumer writes to a
 * closed table.
 * @param ctx - Host composition context.
 */
export async function apply(ctx: Context): Promise<void> {
  const domain = await ctx.storageDomain.open(creatorFeedbackDomainSpec)
  ctx.effect(() => () => domain.close(), 'creator-feedback.domain')
  ctx.provide('creatorFeedback', new CreatorFeedbackStore(domain.table('feedback')))
}
