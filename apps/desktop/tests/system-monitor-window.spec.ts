/** The desktop floating monitor panel: native options, bounds persistence, and show/hide state. */
import type { BrowserWindowConstructorOptions, Rectangle } from 'electron'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  PANEL_FORM_SIZE, SystemMonitorPanel, clampPanelBounds, defaultPanelBounds,
  fitPanelBounds, isPanelForm, panelWindowOptions, parsePanelBounds, resizePanelBounds, type PanelWindow, type SystemMonitorPanelDeps,
} from '../src/system-monitor-window.ts'

const AREA: Rectangle = { x: 0, y: 25, width: 1440, height: 875 }
const PRELOAD = '/app/lib/preload-app.cjs'

/** One scripted native window with the events the panel listens to. */
function fakeWindow(initial: Rectangle) {
  const listeners = new Map<string, Set<() => void>>()
  let bounds = { ...initial }
  let visible = false
  let destroyed = false
  const window: PanelWindow & {
    emit(event: string): void
    loaded: string[]
    destroyed: () => boolean
  } = {
    loaded: [],
    destroyed: () => destroyed,
    async loadURL(url: string) { this.loaded.push(url) },
    showInactive() { visible = true },
    hide() { visible = false },
    isVisible: () => visible,
    isDestroyed: () => destroyed,
    close() {
      destroyed = true
      for (const listener of listeners.get('closed') ?? []) listener()
    },
    getBounds: () => ({ ...bounds }),
    setBounds(next: Rectangle) { bounds = { ...next } },
    on(event, listener) {
      const set = listeners.get(event) ?? new Set()
      set.add(listener)
      listeners.set(event, set)
    },
    emit(event: string) {
      for (const listener of listeners.get(event) ?? []) listener()
    },
  }
  return window
}

/** Deps that record every native call the panel makes. */
function bench(overrides: Partial<SystemMonitorPanelDeps> & { area?: Rectangle } = {}) {
  const area = overrides.area ?? AREA
  const created: { options: BrowserWindowConstructorOptions; window: ReturnType<typeof fakeWindow> }[] = []
  const writes: Rectangle[] = []
  const changes: boolean[] = []
  const deps: SystemMonitorPanelDeps = {
    preload: PRELOAD,
    readUrl: () => 'tomato-app://app/',
    createWindow: (bounds, options) => {
      const window = fakeWindow(bounds)
      created.push({ options, window })
      return window
    },
    readWorkArea: () => area,
    readBounds: () => null,
    writeBounds: (bounds) => { writes.push(bounds) },
    onChange: (open) => { changes.push(open) },
    ...overrides,
  }
  return { deps, created, writes, changes, panel: new SystemMonitorPanel(deps) }
}

afterEach(() => { vi.unstubAllGlobals() })

describe('panelWindowOptions', () => {
  it('gives macOS a frameless, transparent, always-on-top vibrancy panel', () => {
    const options = panelWindowOptions('darwin', { x: 10, y: 20, width: 360, height: 480 }, PRELOAD)
    expect(options).toMatchObject({
      x: 10,
      y: 20,
      width: 360,
      height: 480,
      frame: false,
      transparent: true,
      hasShadow: true,
      resizable: true,
      skipTaskbar: true,
      alwaysOnTop: true,
      acceptFirstMouse: true,
      vibrancy: 'sidebar',
      visualEffectState: 'active',
    })
    expect(options?.webPreferences).toMatchObject({ preload: PRELOAD, contextIsolation: true, sandbox: true })
  })

  it.each(['win32', 'linux'] as const)('has no panel on %s', (platform) => {
    expect(panelWindowOptions(platform, { x: 0, y: 0, width: 360, height: 480 }, PRELOAD)).toBeNull()
  })
})

describe('clampPanelBounds', () => {
  it('keeps bounds already inside the work area', () => {
    const bounds = { x: 100, y: 100, width: 400, height: 400 }
    expect(clampPanelBounds(bounds, AREA)).toEqual(bounds)
  })

  it('pulls an off-screen panel back, keeping any size that fits', () => {
    // A pill-sized window is smaller than the card minimum and keeps its size.
    expect(clampPanelBounds({ x: -50, y: 5_000, width: 360, height: PANEL_FORM_SIZE.pill.height }, AREA)).toEqual({
      x: 0,
      y: 25 + 875 - PANEL_FORM_SIZE.pill.height,
      width: 360,
      height: PANEL_FORM_SIZE.pill.height,
    })
  })

  it('caps a panel larger than the work area', () => {
    const small: Rectangle = { x: 0, y: 0, width: 200, height: 200 }
    expect(clampPanelBounds({ x: 10, y: 10, width: 400, height: 400 }, small)).toEqual({
      x: 0,
      y: 0,
      width: 200,
      height: 200,
    })
  })
})

describe('parsePanelBounds', () => {
  it('reads a stored rectangle', () => {
    expect(parsePanelBounds('{"x":1,"y":2,"width":360,"height":480}')).toEqual({ x: 1, y: 2, width: 360, height: 480 })
  })

  it.each([null, '{broken', 'null', '42', '{"x":"1","y":2,"width":360,"height":480}',
    '{"x":1,"y":2,"width":10,"height":480}'])('rejects an unusable payload %s', (raw) => {
    expect(parsePanelBounds(raw)).toBeNull()
  })
})

describe('defaultPanelBounds', () => {
  it('rests the panel near the top-right corner of the work area', () => {
    expect(defaultPanelBounds(AREA)).toMatchObject({ x: 1440 - 360 - 16, y: 25 + 48, width: 360 })
  })
})

describe('resizePanelBounds', () => {
  it('folds the card into a pill against the edge it hugs, keeping its vertical center', () => {
    const window = fakeWindow({ x: 1_064, y: 313, width: 360, height: 480 })
    // The card's right edge stays put and its center line is kept.
    // The panel spans y 313..793, so the pill's center line stays at 553.
    expect(resizePanelBounds(window, 'pill', AREA)).toEqual({
      x: 1_064, y: 553 - PANEL_FORM_SIZE.pill.height / 2, width: 360, height: PANEL_FORM_SIZE.pill.height,
    })
  })

  it('grows a left-hugging pill back from its left edge', () => {
    const window = fakeWindow({ x: 20, y: 700, width: 360, height: PANEL_FORM_SIZE.pill.height })
    // The pill spans y 700..756, so the card's center line stays at 728; the card
    // reaches past the bottom of the work area and stops there instead.
    expect(resizePanelBounds(window, 'card', AREA)).toEqual({ x: 20, y: 25 + 875 - 480, width: 360, height: 480 })
  })

  it('keeps a pill inside a work area shorter than the card', () => {
    const small = { x: 0, y: 0, width: 1_000, height: 300 }
    expect(fitPanelBounds({ x: 10, y: 250, width: 360, height: 480 }, 'pill', small)).toEqual({
      x: 10, y: 300 - PANEL_FORM_SIZE.pill.height, width: 360, height: PANEL_FORM_SIZE.pill.height,
    })
  })
})

describe('isPanelForm', () => {
  it('recognizes the two forms the panel resizes between', () => {
    expect(isPanelForm('card')).toBe(true)
    expect(isPanelForm('pill')).toBe(true)
    expect(isPanelForm('ball')).toBe(false)
    expect(isPanelForm(undefined)).toBe(false)
  })
})

describe('SystemMonitorPanel', () => {
  it('opens pill-sized after a parked run and restores the card bounds once the card shows', async () => {
    const f = bench({ readBounds: () => ({ x: 40, y: 60, width: 360, height: 480 }) })
    await f.panel.toggle()
    f.panel.resize('card')
    f.panel.apply()
    const window = f.created[0]!.window
    f.panel.resize('pill')
    f.panel.apply()
    expect(window.getBounds()).toMatchObject({ width: 360, height: PANEL_FORM_SIZE.pill.height })
    f.panel.resize('card')
    f.panel.apply()
    // The card returns to the bounds it had before the pill.
    expect(window.getBounds()).toMatchObject({ x: 40, height: 480 })
    expect(window.getBounds().y).toBe(60)
    f.panel.close()
    // Closing a card stores the card's own bounds.
    expect(f.writes.at(-1)).toEqual({ x: 40, y: 60, width: 360, height: 480 })
  })

  it('records the form of a hidden panel and folds the next open into a pill', async () => {
    const f = bench({ readBounds: () => ({ x: 40, y: 60, width: 360, height: 480 }) })
    await f.panel.toggle()
    const window = f.created[0]!.window
    f.panel.resize('card')
    f.panel.apply()
    f.panel.resize('pill')
    f.panel.apply()
    expect(window.getBounds().height).toBe(PANEL_FORM_SIZE.pill.height)
    // Hiding keeps the form; the next open applies it before showing.
    await f.panel.toggle()
    f.panel.resize('card')
    await f.panel.toggle()
    expect(f.changes).toEqual([true, false, true])
  })

  it('closes a pill at the card bounds it would return to', async () => {
    const f = bench({ readBounds: () => ({ x: 40, y: 60, width: 360, height: 480 }) })
    await f.panel.toggle()
    f.panel.resize('card')
    f.panel.apply()
    f.panel.resize('pill')
    f.panel.apply()
    f.panel.close()
    // A pill-only run closes at the stored card bounds.
    expect(f.writes.at(-1)).toMatchObject({ x: 40, width: 360, height: 480 })
  })

  it('ignores a resize before the window exists, and a hidden one', () => {
    const f = bench()
    f.panel.resize('pill')
    f.panel.apply()
    expect(f.created).toHaveLength(0)
  })

  it('creates the panel on first toggle and marks the page surface', async () => {
    const f = bench()
    await expect(f.panel.toggle()).resolves.toBe(true)
    expect(f.created).toHaveLength(1)
    expect(f.created[0]!.window.loaded).toEqual(['tomato-app://app/?surface=system-monitor'])
    expect(f.changes).toEqual([true])
    expect(f.panel.isOpen()).toBe(true)
  })

  it('hides an open panel on the next toggle', async () => {
    const f = bench()
    await f.panel.toggle()
    await expect(f.panel.toggle()).resolves.toBe(false)
    expect(f.changes).toEqual([true, false])
    expect(f.panel.isOpen()).toBe(false)
  })

  it('refuses before the Host publishes a URL, and on platforms without a panel', async () => {
    await expect(bench({ readUrl: () => undefined }).panel.toggle()).resolves.toBeNull()
    vi.stubGlobal('process', { ...process, platform: 'linux' })
    await expect(bench().panel.toggle()).resolves.toBeNull()
  })

  it('restores the remembered position through the clamp', async () => {
    const f = bench({ readBounds: () => ({ x: 2_000, y: 3_000, width: 400, height: 400 }) })
    await f.panel.toggle()
    f.panel.resize('card')
    f.panel.apply()
    // The card opens at the clamped stored bounds.
    expect(f.created[0]!.window.getBounds()).toEqual({
      x: AREA.x + AREA.width - 400, y: AREA.y + AREA.height - 400, width: 400, height: 400,
    })
  })

  it('opens a fresh panel as the pill its document shows first', async () => {
    const f = bench({ readBounds: () => ({ x: 40, y: 60, width: 360, height: 480 }) })
    await f.panel.toggle()
    expect(f.created[0]!.options).toMatchObject({
      x: 40, y: 60 + 240 - PANEL_FORM_SIZE.pill.height / 2, height: PANEL_FORM_SIZE.pill.height,
    })
  })

  it('persists moves, resizes, and closes', async () => {
    const f = bench()
    f.panel.resize('card')
    await f.panel.toggle()
    const window = f.created[0]!.window
    window.setBounds({ x: 40, y: 60, width: 360, height: 480 })
    window.emit('moved')
    window.emit('resized')
    expect(f.writes).toEqual([
      { x: 40, y: 60, width: 360, height: 480 },
      { x: 40, y: 60, width: 360, height: 480 },
    ])
    f.panel.close()
    expect(f.writes).toHaveLength(3)
    expect(f.changes).toEqual([true, false])
    expect(window.destroyed()).toBe(true)
  })

  it('reports an externally closed window and releases the panel on dispose', async () => {
    const first = bench()
    await first.panel.toggle()
    first.created[0]!.window.close()
    expect(first.panel.isOpen()).toBe(false)

    const second = bench()
    await second.panel.toggle()
    second.panel.dispose()
    expect(second.created[0]!.window.destroyed()).toBe(true)
    expect(second.panel.isOpen()).toBe(false)
    // Quitting does not publish a visibility change to windows that are already going away.
    expect(second.changes).toEqual([true])
  })
})
