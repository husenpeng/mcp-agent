/**
 * Image evidence card plugin, browser half: one status entry under each
 * durable user-message image, read from the Host-computed `imageEvidence`
 * projection. The entry renders nothing until the Session records a read for
 * that attachment, so images the bridge never touched keep their plain
 * thumbnail.
 * @module @tomato/client-ui-image-evidence/client
 */

import type { Context } from '@tomato/cordis'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@tomato/client-locale/client'
// Type-only: pulls the SlotRegistry service merge (ctx.slots).
import type {} from '@tomato/client-ui-renderer/client'
// Type-only: pulls the `conversation.chat.user.image-meta` declaration.
import type {} from '@tomato/client-ui-chat/client'
// Type-only: pulls the Session-scope standard props (useProjection).
import type {} from '@tomato/client-ui-session/client'
import { ImageEvidenceBadge } from './ImageEvidenceBadge.tsx'
import { de, en, es, fr, ja, pt, ru, zh } from './locales.ts'

/** Dictionary namespace owned by this plugin. */
const NS = 'imageEvidence'

/** Required services: the slot registry and the copy. */
export const inject = ['slots', 'locale']

/**
 * Register the evidence entry beside each pasted image.
 * @param ctx - client plugin context carrying slots and locale.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en, ja, es, fr, de, ru, pt }), 'ui-image-evidence: dictionaries')
  ctx.slots.inject('conversation.chat.user.image-meta', () => ctx.slots.register({
    name: 'conversation.chat.user.image-meta',
    id: 'image-evidence',
    order: 10,
    locale: NS,
  }, ImageEvidenceBadge))
}
