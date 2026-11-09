/**
 * The remote-access settings page, browser half: the Desktop shell's phone
 * tunnel, its pairing link, and the QR code the phone scans. The page exists in
 * every composition; outside the Desktop shell it only explains that the
 * connection must be hosted there.
 */

// Type-only: the locale plugin's Context merge (ctx.locale).
import type {} from '@tomato/client-locale/client'
// Type-only: the configForms Context merge and the settings.section SlotMap entry.
import type {} from '@tomato/client-ui-settings/client'
import type {} from '@tomato/client-ui-renderer/client'
import type { Context as ClientContext } from '@tomato/cordis'
import { RemoteSection } from './RemoteSection.tsx'
import { de, en, es, fr, ja, pt, ru, zh, type RemoteSettingsLocaleKey } from './locales.ts'
import { createRemotePageStore, desktopRemoteBridge } from './state.ts'

export type { RemoteSectionInjected, RemoteSectionProps } from './RemoteSection.tsx'
export type { DesktopRemoteBridge, RemotePageState, RemotePageStore, RemotePhase } from './state.ts'
export type { RemoteSettingsLocaleKey } from './locales.ts'

declare module '@tomato/client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Remote-access page copy. */
    'settings.remote': RemoteSettingsLocaleKey
  }
}

/** Dictionary namespace owned by this plugin. */
export const NS = 'settings.remote'

/** Required services (cordis fiber inject). */
export const inject = ['slots', 'locale']

/**
 * Mount the remote-access page and its shell-backed state.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, { zh, en, ja, es, fr, de, ru, pt }), 'ui-settings-remote: dictionaries')
  const store = createRemotePageStore(desktopRemoteBridge())
  ctx.effect(() => () => { store.dispose() }, 'ui-settings-remote: shell state')
  ctx.effect(() => ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section', id: 'remote', order: 6, label: () => t('nav'), locale: NS,
    inject: () => ({ hooks: { remote: store.snapshot }, start: () => store.start(), stop: () => store.stop() }),
  }, RemoteSection)), 'ui-settings-remote: page')
}
