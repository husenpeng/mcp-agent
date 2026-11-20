/**
 * System monitor plugin, browser half: contributes the floating monitor card
 * to the root `shell.overlay` seat. Frames arrive through the `systemMonitor`
 * client service; the card owns only its own geometry, expansion, and pause.
 * @module @tomato/client-ui-system-monitor/client
 */

import type { Context as ClientContext } from '@tomato/cordis'
import type {} from '@tomato/api-system-monitor-controller/client'
// Type-only: pulls the frame's root-scoped `shell.overlay` slot declaration.
import type {} from '@tomato/client-ui-layout/client'
import type {} from '@tomato/client-locale/client'
import type {} from '@tomato/client-ui-renderer/client'
import { SystemMonitorDock } from './Dock.tsx'
import { NS, de, en, es, fr, ja, pt, ru, zh, type SystemMonitorKey } from './locales.ts'

declare module '@tomato/client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Monitor overlay copy. */
    systemMonitor: SystemMonitorKey
  }
}

/** The slice of the desktop shell bridge this plugin drives. */
interface DesktopSystemMonitorBridge {
  /** Show the floating panel, or hide it when visible. */
  toggle(): Promise<boolean>
  /** Close the floating panel, keeping its position. */
  close(): Promise<void>
  /**
   * Size the panel's native window to the form it shows; a shell that predates
   * the ball has no resizer.
   * @param form - the form the panel's document is laid out as.
   */
  resize?(form: 'pill' | 'card'): Promise<void>
}

/** Query flag the desktop panel document carries. */
const WINDOW_SURFACE_PARAM = 'system-monitor'

/**
 * Read the desktop monitor bridge.
 * @returns the bridge, or undefined outside the desktop shell.
 */
function readDesktopBridge(): DesktopSystemMonitorBridge | undefined {
  return (window as Window & { tomatoDesktop?: { systemMonitor?: DesktopSystemMonitorBridge } })
    .tomatoDesktop?.systemMonitor
}

/** Required services: the shared observation stream, the slot registry, and dictionaries. */
export const inject = ['systemMonitor', 'slots', 'locale']

/**
 * Client plugin body: register the dictionaries and the overlay entry.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  const surface = new URLSearchParams(window.location.search).get('surface') === WINDOW_SURFACE_PARAM
    ? 'window' as const
    : 'overlay' as const
  const desktop = readDesktopBridge()
  // The panel document is the same page; this attribute lets the surface CSS
  // strip the application chrome so only the monitor card paints.
  if (surface === 'window') {
    ctx.effect(() => {
      document.documentElement.dataset.systemMonitorWindow = ''
      return () => { delete document.documentElement.dataset.systemMonitorWindow }
    }, 'ui-system-monitor: window surface')
  }
  ctx.effect(() => ctx.locale.register(NS, { zh, en, ja, es, fr, de, ru, pt }), 'ui-system-monitor: dictionaries')
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'system-monitor',
    locale: NS,
    // Above the action toasts, so a toast never covers a live reading.
    order: 40,
    inject: () => ({
      hooks: { monitor: ctx.systemMonitor.state },
      watch: () => ctx.systemMonitor.watch(),
      surface,
      floatPanel: desktop === undefined ? null : () => { void desktop.toggle() },
      closeWindow: surface === 'window' && desktop !== undefined ? () => { void desktop.close() } : null,
      resizeWindow: surface === 'window' && desktop?.resize !== undefined
        ? (form: 'pill' | 'card') => { void desktop.resize?.(form) }
        : null,
    }),
  }, SystemMonitorDock))
}
