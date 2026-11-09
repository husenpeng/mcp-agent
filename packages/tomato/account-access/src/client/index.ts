/** Feishu account access section: verified roles and quotas from the gateway session. */
import type { Context as ClientContext } from '@tomato/cordis'
import type {} from '@tomato/client-locale/client'
import type {} from '@tomato/client-ui-settings/client'
import type {} from '@tomato/client-ui-slots'
import type {} from '@tomato/client-ui-renderer/client'
import { AccessSection } from './AccessSection.tsx'
import { de, en, es, fr, ja, pt, ru, zh, type AccessKey } from './locales.ts'

declare module '@tomato/client-ui-slots' {
  interface LocaleNamespaceMap { 'settings.accountAccess': AccessKey }
}

export const NS = 'settings.accountAccess'
export const inject = ['slots', 'locale']

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en, ja, es, fr, de, ru, pt }), 'account-access: dictionaries')
  const t = ctx.locale.bind(NS)
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'account-access',
    order: -9,
    label: () => t('nav'),
    locale: NS,
  }, AccessSection))
}
