/** Frameless startup splash window: the brand animation surface and its exit handshake. */

import { join } from 'node:path'
import {
  app, BrowserWindow, ipcMain, nativeTheme, type BrowserWindowConstructorOptions, type IpcMainEvent,
} from 'electron'
import { SPLASH_IPC } from './splash-api.ts'

/** Splash geometry; matching the main window keeps the handoff from moving any window edge. */
export const SPLASH_WIDTH = 1280
export const SPLASH_HEIGHT = 760

/** Exit fade duration in milliseconds. */
export const SPLASH_FADE_MS = 300

/** How long the shell waits for the renderer's completion report once the target window is visible. */
export const SPLASH_RELEASE_FALLBACK_MS = 6000

/**
 * Resolve the splash window's native options.
 * @param preload - absolute path of the splash preload bundle.
 * @param dark - whether the system palette is dark when the window is created.
 * @returns a frameless, fixed-size window that paints the canvas color before its first frame.
 */
export function splashWindowOptions(preload: string, dark: boolean): BrowserWindowConstructorOptions {
  return {
    width: SPLASH_WIDTH,
    height: SPLASH_HEIGHT,
    title: 'Tomato AI',
    show: false,
    frame: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    backgroundColor: dark ? '#1b1b1c' : '#FBFBFB',
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  }
}

/**
 * Opacity of the splash window partway through its exit fade.
 * @param elapsedMs - milliseconds since the fade began.
 * @returns 1 before the fade, 0 at or after `SPLASH_FADE_MS`, and a cubic-eased value between.
 */
export function splashFadeOpacity(elapsedMs: number): number {
  const progress = Math.min(1, Math.max(0, elapsedMs / SPLASH_FADE_MS))
  return (1 - progress) ** 3
}

/** Shell-owned lifecycle handle of the startup splash window. */
export interface DesktopSplash {
  /**
   * Reveal the target window, then exit once the renderer reports its animation complete.
   * Idempotent; a renderer that never reports falls back to exit after `SPLASH_RELEASE_FALLBACK_MS`.
   */
  release(): void
  /** Close immediately without fading, for fatal recovery, mandatory updates, and quit. */
  dispose(): void
}

/**
 * Open the startup splash window and load its local document.
 * @param preload - absolute path of the splash preload bundle.
 * @returns the lifecycle handle; a load or renderer failure closes the window without failing startup.
 */
export function openSplashWindow(preload: string): DesktopSplash {
  const window = new BrowserWindow(splashWindowOptions(preload, nativeTheme.shouldUseDarkColors))
  let animationDone = false
  let released = false
  let finished = false
  let fading = false
  let fadeTimer: NodeJS.Timeout | undefined
  let fallbackTimer: NodeJS.Timeout | undefined

  function clearTimers(): void {
    if (fadeTimer !== undefined) clearInterval(fadeTimer)
    if (fallbackTimer !== undefined) clearTimeout(fallbackTimer)
    fadeTimer = undefined
    fallbackTimer = undefined
  }

  function close(): void {
    if (finished) return
    finished = true
    clearTimers()
    ipcMain.removeListener(SPLASH_IPC.animationDone, onAnimationDone)
    if (!window.isDestroyed()) window.close()
  }

  function startFade(): void {
    // A reloaded splash document can report twice; a second fade would leak its timer.
    if (finished || fading) return
    fading = true
    if (fallbackTimer !== undefined) {
      clearTimeout(fallbackTimer)
      fallbackTimer = undefined
    }
    // `setOpacity` exists on Windows and macOS only; elsewhere the splash exits without a fade.
    if (process.platform === 'linux') {
      close()
      return
    }
    const startedAt = Date.now()
    fadeTimer = setInterval(() => {
      if (finished) return
      if (window.isDestroyed()) {
        close()
        return
      }
      const elapsed = Date.now() - startedAt
      try {
        window.setOpacity(splashFadeOpacity(elapsed))
      } catch {
        close()
        return
      }
      if (elapsed >= SPLASH_FADE_MS) close()
    }, 16)
  }

  function onAnimationDone(event: IpcMainEvent): void {
    if (finished) return
    // The splash document is the only owned frame; product documents cannot end the animation.
    const frame = event.senderFrame
    if (event.sender !== window.webContents || frame === null || frame !== window.webContents.mainFrame) return
    if (!frame.url.endsWith('/renderer/splash.html')) return
    animationDone = true
    if (released) startFade()
  }

  ipcMain.on(SPLASH_IPC.animationDone, onAnimationDone)
  // The splash is a sealed local document; it must not navigate or open windows.
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-navigate', (event) => { event.preventDefault() })
  window.once('ready-to-show', () => {
    if (!finished && !window.isDestroyed()) window.show()
  })
  window.on('closed', () => {
    finished = true
    clearTimers()
    ipcMain.removeListener(SPLASH_IPC.animationDone, onAnimationDone)
  })
  window.webContents.on('render-process-gone', () => { close() })
  void window.loadFile(join(app.getAppPath(), 'renderer', 'splash.html')).catch((error: unknown) => {
    console.error('desktop splash: failed to load', error)
    close()
  })
  return {
    release: () => {
      if (finished || released) return
      released = true
      if (animationDone) startFade()
      else fallbackTimer = setTimeout(() => { animationDone = true; startFade() }, SPLASH_RELEASE_FALLBACK_MS)
    },
    dispose: close,
  }
}
