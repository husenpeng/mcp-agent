/**
 * Developer mode for the Electron shell.
 *
 * Turning it on keeps DevTools reachable in a packaged build, adds a Developer
 * submenu (open DevTools, pick an element, open the log file), and records the
 * renderer console into the diagnostics log. Client bundles are served with
 * sourcemaps whose `sourcesContent` carries the original TSX, so a logged
 * `bundle:line` resolves back to the source file in DevTools → Sources.
 */

import { shell, type BrowserWindow, type MenuItemConstructorOptions } from 'electron'
import type { DiagnosticsLog } from './diagnostics-log.ts'
import type { DesktopMessages } from './locale.ts'

/** Environment switch that turns developer mode on for one launch. */
export const DEVELOPER_MODE_ENV = 'TOMATO_DEVELOPER_MODE'

/**
 * Whether developer mode is on for this launch.
 * @param environment - process environment.
 * @param development - unpackaged launch, which always counts as developer mode.
 * @returns whether the Developer menu and DevTools access are enabled.
 */
export function developerModeEnabled(environment: NodeJS.ProcessEnv, development: boolean): boolean {
  if (development) return environment[DEVELOPER_MODE_ENV] !== '0'
  return environment[DEVELOPER_MODE_ENV] === '1'
}

/** Menu rows and shortcuts added while developer mode is on. */
export interface DeveloperModeOptions {
  readonly enabled: boolean
  readonly log: DiagnosticsLog
  /** Window whose web contents the commands act on. */
  readonly window: () => BrowserWindow | undefined
  readonly messages: () => DesktopMessages
}

/**
 * Build the Developer submenu, or nothing when the mode is off.
 * @param options - mode flag, log handle, and window accessor.
 * @returns menu items appended to the application menu.
 */
export function developerMenuItems(options: DeveloperModeOptions): MenuItemConstructorOptions[] {
  if (!options.enabled) return []
  const contents = (): Electron.WebContents | undefined => {
    const window = options.window()
    return window === undefined || window.isDestroyed() ? undefined : window.webContents
  }
  /** Open the renderer's DevTools and switch them to the element picker. */
  const openPicker = (): void => {
    const target = contents()
    if (target === undefined) return
    target.openDevTools({ mode: 'detach', activate: true })
    target.devToolsWebContents?.executeJavaScript('inspect(document.body)').catch(() => undefined)
  }
  return [{
    label: options.messages().developerMenu,
    submenu: [
      {
        label: options.messages().developerDevTools,
        accelerator: 'CmdOrCtrl+Alt+I',
        click: () => { contents()?.openDevTools({ mode: 'detach', activate: true }) },
      },
      {
        label: options.messages().developerInspect,
        // DevTools' own element picker shortcut; the accelerator only names it.
        accelerator: 'CmdOrCtrl+Shift+C',
        click: () => { openPicker() },
      },
      { type: 'separator' },
      {
        label: options.messages().developerReload,
        accelerator: 'CmdOrCtrl+R',
        click: () => { contents()?.reload() },
      },
      {
        label: options.messages().developerOpenLog,
        click: () => { shell.showItemInFolder(options.log.path) },
      },
      {
        label: options.messages().developerCopyLogPath,
        click: () => { void shell.openPath(options.log.path) },
      },
    ],
  }]
}
