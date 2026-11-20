/**
 * The General plugins and Marketing plugins tabs of the Plugins page. General plugins browses the open Tomato plugin
 * catalog; Marketing plugins browses the curated marketing catalog that ships with `@tomato/plugin-tomato-market`. Both
 * ask the Host for facts over the authenticated market route and hand plugin packages to the page's own install flow.
 */
import type { Context as ClientContext } from '@tomato/cordis'
import type {} from '@tomato/client-locale/client'
import type {} from '@tomato/client-ui-renderer/client'
// Type-only: the ctx.remote Context merge and the forwarded events.
import type {} from '@tomato/api-remotes/client'
// Type-only: the Plugins page's `plugins.tab` declaration and owner props.
import type {} from '@tomato/client-ui-plugin-manager/client'
import { GeneralMarket } from './GeneralMarket.tsx'
import { MarketingMarket } from './MarketingMarket.tsx'
import { en, ja, zh, type TomatoMarketLocaleKey } from './locales.ts'
import { GeneralController } from './general-controller.ts'
import { MarketingController } from './marketing-controller.ts'
import { marketClient } from './api.ts'

export type { GeneralFace, GeneralState } from './general-controller.ts'
export type { MarketingFace, MarketingState } from './marketing-controller.ts'
export type { TomatoMarketLocaleKey } from './locales.ts'

declare module '@tomato/client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Plugin market tabs copy: the tabs' own dictionary, and the shared chrome their lists fall back to. */
    'tomatoMarket': TomatoMarketLocaleKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'tomatoMarket'

/** Services the tabs read. */
export const inject = ['slots', 'locale', 'remote']

/**
 * Register both market tabs ahead of Discover and keep them current on Host changes.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  // The namespace carries the tabs' own copy; the shell's lookup chain supplies the shared chrome vocabulary.
  ctx.effect(() => ctx.locale.register(NS, { zh, en, ja }), 'ui-tomato-market: dictionaries')
  const t = ctx.locale.bind(NS)
  const market = marketClient(() => document.baseURI)
  const general = new GeneralController(ctx, market, () => t)
  const marketing = new MarketingController(ctx, market, general, () => t)
  const language = (): string => ctx.locale.getSnapshot().active
  general.setLanguage(language())
  marketing.setLanguage(language())
  ctx.effect(() => ctx.locale.subscribe(() => {
    general.setLanguage(language())
    marketing.setLanguage(language())
  }), 'ui-tomato-market: language')
  ctx.effect(() => {
    const dispose = ctx.remote.$on('plugin-manager/changed', () => { marketing.face().reload() })
    return () => { dispose() }
  }, 'ui-tomato-market: installed plugins')
  ctx.effect(() => () => {
    general.dispose()
    marketing.dispose()
  }, 'ui-tomato-market: controllers')
  const generalFace = general.face()
  const marketingFace = marketing.face()
  // General plugins first, then the curated marketing catalog, both ahead of Discover.
  ctx.slots.inject('plugins.tab', function* () {
    yield ctx.slots.register({
      name: 'plugins.tab', id: 'market', order: -2, label: () => t('tab'), locale: NS, inject: () => generalFace,
    }, GeneralMarket)
    yield ctx.slots.register({
      name: 'plugins.tab', id: 'marketing', order: -1, label: () => t('marketingTab'), locale: NS, inject: () => marketingFace,
    }, MarketingMarket)
  })
}
