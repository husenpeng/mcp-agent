import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SPLASH_IPC } from '../src/splash-api.ts'

interface SplashFixture {
  readonly webContents: {
    readonly mainFrame: { url: string }
    readonly on: ReturnType<typeof vi.fn>
    readonly setWindowOpenHandler: ReturnType<typeof vi.fn>
  }
  readonly loadFile: ReturnType<typeof vi.fn<(path: string) => Promise<void>>>
  readonly show: ReturnType<typeof vi.fn>
  readonly close: ReturnType<typeof vi.fn>
  readonly isDestroyed: ReturnType<typeof vi.fn>
  readonly setOpacity: ReturnType<typeof vi.fn>
  readonly once: (name: string, handler: () => void) => void
  readonly on: (name: string, handler: () => void) => void
  readonly handlers: Map<string, () => void>
}

const electron = vi.hoisted(() => ({
  create: vi.fn<(options: unknown) => SplashFixture>(),
  root: '/desktop-app',
  listeners: new Map<string, (event: unknown) => void>(),
  dark: false,
}))
vi.mock('electron', () => ({
  app: { getAppPath: () => electron.root },
  BrowserWindow: vi.fn(function (options: unknown) { return electron.create(options) }),
  ipcMain: {
    on: (name: string, handler: (event: unknown) => void) => { electron.listeners.set(name, handler) },
    removeListener: (name: string) => { electron.listeners.delete(name) },
  },
  nativeTheme: { get shouldUseDarkColors() { return electron.dark } },
}))

const {
  SPLASH_FADE_MS, SPLASH_RELEASE_FALLBACK_MS, SPLASH_HEIGHT, SPLASH_WIDTH,
  openSplashWindow, splashFadeOpacity, splashWindowOptions,
} = await import('../src/splash-window.ts')

function fixture(): SplashFixture {
  const handlers = new Map<string, () => void>()
  return {
    webContents: {
      mainFrame: { url: 'file:///desktop-app/renderer/splash.html' },
      on: vi.fn((name: string, handler: () => void) => { handlers.set(`webContents:${name}`, handler) }),
      setWindowOpenHandler: vi.fn(),
    },
    loadFile: vi.fn<(path: string) => Promise<void>>().mockResolvedValue(undefined),
    show: vi.fn(),
    close: vi.fn(),
    isDestroyed: vi.fn(() => false),
    setOpacity: vi.fn(),
    once: (name, handler) => { handlers.set(name, handler) },
    on: (name, handler) => { handlers.set(name, handler) },
    handlers,
  }
}

let window: SplashFixture
beforeEach(() => {
  electron.create.mockReset()
  electron.listeners.clear()
  electron.dark = false
  window = fixture()
  electron.create.mockReturnValue(window)
  vi.useRealTimers()
})

describe('desktop splash window options', () => {
  it('matches the main window geometry with a frameless, non-resizable, above-all window', () => {
    const options = splashWindowOptions('/desktop/preload-splash.cjs', false)
    expect(options).toMatchObject({
      width: SPLASH_WIDTH, height: SPLASH_HEIGHT,
      show: false, frame: false, resizable: false, minimizable: false, maximizable: false, fullscreenable: false,
      skipTaskbar: true, alwaysOnTop: true,
      backgroundColor: '#FBFBFB',
      webPreferences: {
        preload: '/desktop/preload-splash.cjs',
        nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true,
      },
    })
    expect(options.center).toBeUndefined()
    expect(splashWindowOptions('/desktop/preload-splash.cjs', true).backgroundColor).toBe('#1b1b1c')
  })

  it('never renders a light canvas first in the dark palette', () => {
    electron.dark = true
    openSplashWindow('/desktop/preload-splash.cjs')
    expect(electron.create).toHaveBeenCalledWith(expect.objectContaining({ backgroundColor: '#1b1b1c' }))
  })
})

describe('splash fade curve', () => {
  it('starts opaque and reaches transparent exactly at the fade duration', () => {
    expect(splashFadeOpacity(-10)).toBe(1)
    expect(splashFadeOpacity(0)).toBe(1)
    expect(splashFadeOpacity(SPLASH_FADE_MS / 2)).toBeCloseTo((0.5) ** 3, 5)
    expect(splashFadeOpacity(SPLASH_FADE_MS)).toBe(0)
    expect(splashFadeOpacity(SPLASH_FADE_MS * 2)).toBe(0)
  })
})

describe('desktop splash lifecycle', () => {
  it('loads the local document and shows on the first painted frame', () => {
    openSplashWindow('/desktop/preload-splash.cjs')
    expect(window.loadFile).toHaveBeenCalledWith(join('/desktop-app', 'renderer', 'splash.html'))
    expect(window.show).not.toHaveBeenCalled()
    window.handlers.get('ready-to-show')?.()
    expect(window.show).toHaveBeenCalledOnce()
  })

  it('waits for release and the renderer completion report before fading', () => {
    vi.useFakeTimers()
    const splash = openSplashWindow('/desktop/preload-splash.cjs')
    window.handlers.get('ready-to-show')?.()
    splash.release()
    vi.advanceTimersByTime(SPLASH_FADE_MS * 2)
    expect(window.setOpacity).not.toHaveBeenCalled()
    expect(window.close).not.toHaveBeenCalled()

    electron.listeners.get(SPLASH_IPC.animationDone)?.({
      sender: window.webContents, senderFrame: window.webContents.mainFrame,
    })
    vi.advanceTimersByTime(SPLASH_FADE_MS + 32)
    expect(window.setOpacity.mock.calls.length).toBeGreaterThan(0)
    expect(window.close).toHaveBeenCalledOnce()
    expect(electron.listeners.has(SPLASH_IPC.animationDone)).toBe(false)
  })

  it('fades once the animation ends before the target window is ready', () => {
    vi.useFakeTimers()
    const splash = openSplashWindow('/desktop/preload-splash.cjs')
    electron.listeners.get(SPLASH_IPC.animationDone)?.({
      sender: window.webContents, senderFrame: window.webContents.mainFrame,
    })
    vi.advanceTimersByTime(SPLASH_FADE_MS)
    expect(window.close).not.toHaveBeenCalled()
    splash.release()
    vi.advanceTimersByTime(SPLASH_FADE_MS + 32)
    expect(window.close).toHaveBeenCalledOnce()
  })

  it('ignores completion reports from foreign frames and from the wrong document', () => {
    vi.useFakeTimers()
    const splash = openSplashWindow('/desktop/preload-splash.cjs')
    splash.release()
    const listener = electron.listeners.get(SPLASH_IPC.animationDone)
    listener?.({ sender: {}, senderFrame: window.webContents.mainFrame })
    window.webContents.mainFrame.url = 'file:///desktop-app/renderer/welcome.html'
    listener?.({ sender: window.webContents, senderFrame: window.webContents.mainFrame })
    vi.advanceTimersByTime(SPLASH_RELEASE_FALLBACK_MS - 1)
    expect(window.setOpacity).not.toHaveBeenCalled()
    vi.advanceTimersByTime(SPLASH_FADE_MS + 32)
    expect(window.close).toHaveBeenCalledOnce()
  })

  it('closes immediately on dispose and on renderer exit', () => {
    const splash = openSplashWindow('/desktop/preload-splash.cjs')
    splash.dispose()
    expect(window.close).toHaveBeenCalledOnce()
    expect(electron.listeners.has(SPLASH_IPC.animationDone)).toBe(false)

    const second = fixture()
    electron.create.mockReturnValue(second)
    openSplashWindow('/desktop/preload-splash.cjs')
    second.handlers.get('webContents:render-process-gone')?.()
    expect(second.close).toHaveBeenCalledOnce()
  })

  it('stays alive when the document fails to load only until the first failure is logged', async () => {
    const failing = fixture()
    failing.loadFile.mockRejectedValue(new Error('missing document'))
    electron.create.mockReturnValue(failing)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    openSplashWindow('/desktop/preload-splash.cjs')
    await vi.waitFor(() => { expect(failing.close).toHaveBeenCalledOnce() })
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })
})
