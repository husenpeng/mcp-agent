/** Tomato brand plugin, browser half: sidebar mark, sidebar name, and hero mark. */
import type { Context as ClientContext } from '@tomato/cordis'
import type {} from '@tomato/client-ui-renderer/client'
import type {} from '@tomato/client-ui-sidebar/client'
import type {} from '@tomato/client-ui-conversation/client'
import { TomatoBrandName, TomatoSidebarMark, TomatoMark } from './Brand.tsx'

/** Required service: the UI slot registry. */
export const inject = ['slots']

/**
 * Fill the three generic brand slots. Each registration waits on its owner's
 * declaration, so the occupants follow the sidebar and conversation lifetimes
 * and leave no partial brand during reload.
 * @param ctx - Client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.slots.inject('sidebar.brand.mark', () =>
    ctx.slots.inject('sidebar.brand.name', function* () {
      yield ctx.slots.register({ name: 'sidebar.brand.mark' }, TomatoSidebarMark)
      yield ctx.slots.register({ name: 'sidebar.brand.name' }, TomatoBrandName)
    }))
  ctx.slots.inject('conversation.hero.brand.mark', () =>
    ctx.slots.register({ name: 'conversation.hero.brand.mark' }, TomatoMark))
}
