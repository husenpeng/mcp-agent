/**
 * The developer settings page, browser half: a volatile recording switch, the
 * gateway exchanges observed through `ctx.connection`, and the current client
 * composition. The page registers only in the unpackaged desktop launcher
 * (`tomatoDesktop.development`), so shipped builds never show it.
 */

// Type-only: the locale plugin's Context merge (ctx.locale).
import type {} from '@tomato/client-locale/client'
// Type-only: the configForms Context merge and the settings.section SlotMap entry.
import type {} from '@tomato/client-ui-settings/client'
import type {} from '@tomato/client-ui-renderer/client'
// Type-only: ctx.remote and the forwarded-event key face.
import type {} from '@tomato/api-remotes/client'
// Type-only: ctx.connection, ctx.modules, ctx.layout, and ctx.sessions merges.
import type {} from '@tomato/client-connection/client'
import type {} from '@tomato/client-modules/client'
import type {} from '@tomato/client-ui-layout/client'
import type {} from '@tomato/api-session-controller/client'
import type { Context as ClientContext } from '@tomato/cordis'
import type { ObservableSnapshot } from '@tomato/client-store'
import type { ConnectionObservation } from '@tomato/client-connection/client'
import { DeveloperOverlay } from './DeveloperOverlay.tsx'
import { DeveloperSection } from './DeveloperSection.tsx'
import { de, en, es, fr, ja, pt, ru, zh, type DeveloperSettingsLocaleKey } from './locales.ts'
import { readPageInfo } from './page-info.ts'
import { createDeveloperStore } from './store.ts'

export type { DeveloperPageInfo, DeveloperPageSources } from './page-info.ts'
export type { DeveloperEntry, DeveloperState, DeveloperStore } from './store.ts'
export type { DeveloperSectionInjected } from './DeveloperSection.tsx'
export type { DeveloperOverlayProps } from './DeveloperOverlay.tsx'
export type { GatewayLogProps, DeveloperTranslate } from './GatewayLog.tsx'
export type { PageFactsProps } from './PageFacts.tsx'
export type { DeveloperSettingsLocaleKey } from './locales.ts'

declare module '@tomato/client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Developer-page copy. */
    'settings.developer': DeveloperSettingsLocaleKey
  }
}

/** Dictionary namespace owned by this plugin. */
export const NS = 'settings.developer'

/** Settings namespace owned by the Host half: its Loader entry id. */
export const SETTINGS_NAMESPACE = 'ui-settings-developer'

/** Required services (cordis fiber inject); the observed composition is optional. */
export const inject = ['slots', 'locale', 'remote', 'configForms']

function developmentShell(): boolean {
  const desktop = (globalThis as { readonly tomatoDesktop?: { readonly development?: unknown } }).tomatoDesktop
  return desktop?.development === true
}

/**
 * Mount the developer page when the shell is the unpackaged development launcher.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, { zh, en, ja, es, fr, de, ru, pt }), 'ui-settings-developer: dictionaries')
  if (!developmentShell()) return
  const form = ctx.configForms.get<{ enabled?: boolean }>(SETTINGS_NAMESPACE)
  const store = createDeveloperStore()
  const connection = ctx.get('connection')
  const enabled: ObservableSnapshot<boolean> = {
    getSnapshot: () => form.getSnapshot().value?.enabled ?? false,
    subscribe: (listener) => {
      let previous = enabled.getSnapshot()
      return form.subscribe(() => {
        const next = enabled.getSnapshot()
        if (next === previous) return
        previous = next
        listener()
      })
    },
  }
  // The observer lives only while the switch is on, so a closed page costs nothing per exchange.
  ctx.effect(() => {
    let dispose: (() => void) | undefined
    const sync = (): void => {
      if (enabled.getSnapshot() && connection !== undefined) {
        dispose ??= connection.observe((observation: ConnectionObservation) => { store.append(observation) })
      } else {
        dispose?.()
        dispose = undefined
      }
    }
    const off = enabled.subscribe(sync)
    sync()
    return () => {
      off()
      dispose?.()
    }
  }, 'ui-settings-developer: gateway observation')
  const refreshPageInfo = (): void => {
    store.setPage(readPageInfo({
      manifest: ctx.get('modules')?.manifest ?? { rev: '', modules: [], plugins: [] },
      connection: connection?.state.getSnapshot(),
      panel: ctx.get('layout')?.panelInfo.getSnapshot().activePanelId ?? null,
      sessions: ctx.get('sessions')?.list.getSnapshot().ids.length ?? 0,
      slotSnapshot: ctx.slots.snapshot(),
    }))
  }
  const face = () => ({
    hooks: { enabled, gateway: store.state },
    setEnabled: async (next: boolean) => {
      if (!await form.set('enabled', next)) throw new Error('developer setting was not saved')
    },
    clear: () => { store.clear() },
    refreshPageInfo,
  })
  ctx.effect(() => ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section', id: 'developer', order: 5, label: () => t('nav'), locale: NS,
    inject: face,
  }, DeveloperSection)), 'ui-settings-developer: page')
  // The frame overlay keeps the log visible after the settings page closes; closing it turns recording off.
  ctx.effect(() => ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay', id: 'developer-panel', locale: NS, inject: face,
  }, DeveloperOverlay)), 'ui-settings-developer: floating panel')
}
