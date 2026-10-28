/**
 * Tomato account plugin, browser half: the sidebar launcher and Account
 * settings section over the local gateway's `/api/auth/*` routes.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the settings shell's SlotMap merge (`settings.launcher`, `settings.section`).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: pulls the locale namespace map into this program.
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { AccountController } from './account-controller.ts'
import { AccountLauncher, type AccountInjected } from './AccountLauncher.tsx'
import { AccountSection } from './AccountSection.tsx'
import { de, en, es, fr, ja, pt, ru, zh, type AccountKey } from './locales.ts'

export type { AccountLauncherProps, AccountInjected } from './AccountLauncher.tsx'
export type { AccountSectionProps } from './AccountSection.tsx'
export type { AccountSnapshot, AccountUser, DesktopAccountBridge } from './account-controller.ts'
export type { AccountKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Account launcher and settings page copy. */
    'settings.account': AccountKey
  }
}

/** Dictionary namespace owned by this plugin. */
export const NS = 'settings.account'

/** Required services (cordis fiber inject). */
export const inject = ['slots', 'locale']

/**
 * Register the account launcher and settings section.
 * @param ctx - Client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en, ja, es, fr, de, ru, pt }), 'tomato-account: dictionaries')
  const t = ctx.locale.bind(NS)
  const controller = new AccountController()
  ctx.effect(() => () => { controller.dispose() }, 'tomato-account: listeners')
  void controller.refresh(false)
  const injected = (): AccountInjected => ({
    hooks: { account: controller.store },
    startSignIn: () => controller.startSignIn(),
    signOut: () => controller.signOut(),
    refresh: quiet => controller.refresh(quiet),
    dismissNotice: () => { controller.dismissNotice() },
  })
  ctx.slots.inject('settings.launcher', () => ctx.slots.register({
    name: 'settings.launcher',
    locale: NS,
    inject: injected,
  }, AccountLauncher))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'account',
    order: -10,
    label: () => t('nav'),
    locale: NS,
    inject: injected,
  }, AccountSection))
}
