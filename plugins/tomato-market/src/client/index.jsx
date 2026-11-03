/**
 * Plugin Market, browser half: a `plugins.tab` entry that browses the open
 * DeepSeek Harness catalog and hands Tomato-compatible versions to the
 * Plugins page's own install flow. The page owns the tab strip and install
 * dialog; this plugin owns the catalog view.
 */
import { installI18n, NS } from './i18n.js'
import { createController } from './store.js'
import { MarketTab } from './market.jsx'

/** The shell supplies the tab ledger and the locale; the host half is called over `api/tomato-market`. */
export const inject = ['slots', 'locale']

/**
 * Mount the Plugin Market tab.
 * @param {object} ctx - browser plugin context.
 */
export function apply(ctx) {
  const { t, language } = installI18n(ctx)
  const controller = createController({ t, language })
  ctx.effect(() => ctx.locale.subscribe(() => { controller.setLanguage(language()) }), 'tomato-market: active language')
  const Tab = props => <MarketTab {...props} controller={controller} t={t} />
  ctx.effect(() => ctx.slots.inject('plugins.tab', () => ctx.slots.register({
    name: 'plugins.tab',
    id: 'market',
    order: -1,
    label: () => t('tab'),
    locale: NS,
  }, Tab)), 'tomato-market: plugin market tab')
}