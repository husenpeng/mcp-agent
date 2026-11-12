/** Official Tomato Harness occupants for the generic browser-brand slots. */
import type { Context as ClientContext } from '@tomato/cordis'
import type {} from '@tomato/client-locale/client'
import type {} from '@tomato/client-ui-renderer/client'
import type {} from '@tomato/client-ui-sidebar/client'
import { OfficialBrandMark, OfficialBrandName } from './Brand.tsx'
import { NS, de, en, es, fr, ja, pt, ru, zh } from './locales.ts'

/** Required service: the UI slot registry. */
export const inject = ['slots', 'locale']

/**
 * Fill the sidebar brand slots as one declaration-aware registration set. The
 * conversation hero stays on its declaring package's animated fish fallback,
 * so the official build registers nothing there.
 * @param ctx - Client root context.
 */
export function apply(ctx: ClientContext): void {
  if (process.env.TOMATO_CLIENT_BUILD_PROFILE !== 'official') return
  ctx.effect(() => ctx.locale.register(NS, { zh, en, ja, es, fr, de, ru, pt }), 'ui-brand-official: dictionaries')
  ctx.slots.inject('sidebar.brand.mark', () =>
    ctx.slots.inject('sidebar.brand.name', function* () {
      yield ctx.slots.register({ name: 'sidebar.brand.mark' }, OfficialBrandMark)
      yield ctx.slots.register({ name: 'sidebar.brand.name', locale: NS }, OfficialBrandName)
    }))
}
