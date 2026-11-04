/**
 * Plugin markets, browser half: two `plugins.tab` entries. General plugins
 * browses the open DeepSeek Harness catalog; Marketing plugins browses the
 * curated marketing catalog that ships with this package. Both hand plugin
 * packages to the Plugins page's own install flow; the page owns the tab strip
 * and install dialog, and this plugin owns the catalog views.
 */
import { installI18n, NS } from './i18n.js'
import { createController } from './store.js'
import { createMarketingController } from './marketing-store.js'
import { MarketTab } from './market.jsx'
import { MarketingTab } from './marketing.jsx'

/** The shell supplies the tab ledger, the locale, and Plugin Manager's change events; the host half is called over `api/tomato-market`. */
export const inject = ['slots', 'locale', 'remote']

/**
 * Mount both market tabs: Marketing plugins first, then General plugins, ahead of Discover.
 * @param {object} ctx - browser plugin context.
 */
export function apply(ctx) {
  const { t, language } = installI18n(ctx)
  const general = createController({ t, language })
  const marketing = { ...createMarketingController({ language }), plugins: createController({ t, language }) }
  ctx.effect(() => ctx.locale.subscribe(() => {
    general.setLanguage(language())
    marketing.setLanguage(language())
    marketing.plugins.setLanguage(language())
  }), 'tomato-market: active language')
  ctx.effect(() => ctx.remote.$on('plugin-manager/changed', () => { marketing.reload() }), 'tomato-market: installed plugins')
  const General = props => <MarketTab {...props} controller={general} t={t} />
  const Marketing = props => <MarketingTab {...props} controller={marketing} t={t} />
  ctx.effect(() => ctx.slots.inject('plugins.tab', function* () {
    yield ctx.slots.register({ name: 'plugins.tab', id: 'marketing', order: -2, label: () => t('marketingTab'), locale: NS }, Marketing)
    yield ctx.slots.register({ name: 'plugins.tab', id: 'market', order: -1, label: () => t('tab'), locale: NS }, General)
  }), 'tomato-market: market tabs')
}
