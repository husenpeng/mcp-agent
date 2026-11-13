/** Official Tomato Harness occupants: the profile-gated sidebar brand slots and the home whale frame layer. */
import type { Context as ClientContext } from '@tomato/cordis'
import type {} from '@tomato/client-locale/client'
import type {} from '@tomato/client-ui-renderer/client'
import type {} from '@tomato/client-ui-sidebar/client'
import type {} from '@tomato/client-ui-conversation/client'
import { PixelWhale } from './home-whale/PixelWhale.tsx'
import { OfficialBrandMark, OfficialBrandName } from './Brand.tsx'
import { NS, de, en, es, fr, ja, pt, ru, zh } from './locales.ts'

/** Required service: the UI slot registry. */
export const inject = ['slots', 'locale']

/**
 * Fill official sidebar artwork and frame the blank home with the whale decoration.
 * @param ctx - Client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.slots.inject('conversation.hero.frame', () => ctx.slots.register({
    name: 'conversation.hero.frame',
    id: 'pixel-whale',
  }, PixelWhale))
  if (process.env.TOMATO_CLIENT_BUILD_PROFILE !== 'official') return
  ctx.effect(() => ctx.locale.register(NS, { zh, en, ja, es, fr, de, ru, pt }), 'ui-brand-official: dictionaries')
  ctx.slots.inject('sidebar.brand.mark', () =>
    ctx.slots.inject('sidebar.brand.name', function* () {
      yield ctx.slots.register({ name: 'sidebar.brand.mark' }, OfficialBrandMark)
      yield ctx.slots.register({ name: 'sidebar.brand.name', locale: NS }, OfficialBrandName)
    }))
}
