/**
 * The Marketing settings page, browser half: one switch per advertising or
 * marketing provider and its credential controls, over the `marketing`
 * namespace its Host plugin serves. The page registers into the Plugins page's
 * `plugins.item` slot while that namespace is served, so a deployment without
 * the Host plugin shows no trace of it.
 */

// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@tomato/client-locale/client'
// Type-only: the ctx.configForms Context merge. Cross-plugin collaboration
// goes through the service, never a value import (client bundle purity gate).
import type {} from '@tomato/client-ui-settings/client'
// Type-only: the Plugins page's SlotMap merge (the 'plugins.item' entry).
import type {} from '@tomato/client-ui-plugin-manager/client'
import type {} from '@tomato/client-ui-renderer/client'
// Type-only: the ctx.remote Context merge and the forwarded-event key face.
import type {} from '@tomato/api-remotes/client'
import type { Context as ClientContext } from '@tomato/cordis'
import { MarketingCard } from './MarketingCard.tsx'
import { MARKETING_NS, MarketingCardController } from './marketing-card-controller.ts'
import { en, zh, type MarketingSettingsLocaleKey } from './locales.ts'

export type { MarketingCardProps } from './MarketingCard.tsx'
export type {
  MarketingCardFace, MarketingCardState, MarketingProviderState, MarketingSecretState, MarketingSettings, ProviderId,
} from './marketing-card-controller.ts'
export type { MarketingSettingsLocaleKey } from './locales.ts'

declare module '@tomato/client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Marketing settings page copy. */
    'settings.marketing': MarketingSettingsLocaleKey
  }
}

/** Dictionary namespace owned by this plugin. */
export const NS = 'settings.marketing'

/** Required services (cordis fiber inject). */
export const inject = ['slots', 'locale', 'remote', 'remote.credentials', 'configForms']

/**
 * Mount the Marketing settings page while the Host serves its namespace.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-settings-marketing: dictionaries')
  const card = new MarketingCardController(ctx.configForms.get(MARKETING_NS), {
    describe: async (refs) => {
      const response = await ctx.remote.credentials.describe(refs)
      return response.ok ? response.value : {}
    },
    set: async (ref, value) => { await ctx.remote.credentials.set(ref, value) },
  })
  ctx.effect(() => () => { card.dispose() }, 'ui-settings-marketing: form subscription')
  // A credential written on another surface changes no settings section, so
  // this is the only signal that the Host now holds a key the page reports.
  ctx.effect(
    () => ctx.remote.$on('credentials/reference-updated', (ref) => { card.refreshCredential(ref) }),
    'ui-settings-marketing: credential invalidations',
  )
  ctx.effect(() => ctx.configForms.whileServed([MARKETING_NS], () => ctx.slots.inject('plugins.item', () => ctx.slots.register({
    name: 'plugins.item', id: 'marketing', order: 30, label: () => t('title'), locale: NS, inject: () => card.inject(),
  }, MarketingCard))), 'ui-settings-marketing: page')
}
