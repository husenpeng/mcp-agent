/**
 * macOS floating system-monitor panel: one frameless, always-on-top window
 * that hosts the monitor surface over the desktop, remembers where the user
 * put it, and never takes keyboard focus from the app it floats above.
 *
 * Electron lives in the wiring (`main.ts`) rather than here, so the panel's
 * options, bounds handling, and show/hide state machine stay testable without
 * a display server.
 * @module apps/desktop/src/system-monitor-window
 */

import type { BrowserWindowConstructorOptions, Rectangle } from 'electron'

/** Default width of the panel in CSS pixels. */
export const PANEL_WIDTH = 360

/** Default height of the panel in CSS pixels. */
export const PANEL_HEIGHT = 480

/** Smallest size the user may resize the panel to. */
export const PANEL_MIN_WIDTH = 300

/** Smallest height the user may resize the panel to. */
export const PANEL_MIN_HEIGHT = 280

/** The form the panel's document is laid out as: the collapsed pill or the expanded card. */
export type PanelForm = 'pill' | 'card'

/**
 * Recognize a panel form reported across IPC.
 * @param value - the reported value.
 * @returns whether it is one of the panel's forms.
 */
export function isPanelForm(value: unknown): value is PanelForm {
  return value === 'pill' || value === 'card'
}

/** Native window size of a pill-only panel: the card's width by the pill's height. */
export const PANEL_PILL_WIDTH = PANEL_WIDTH

/** Native window height of a pill-only panel. */
export const PANEL_PILL_HEIGHT = 56

/** Panel sizes per form; the card keeps the stored bounds. */
export const PANEL_FORM_SIZE = {
  pill: { width: PANEL_PILL_WIDTH, height: PANEL_PILL_HEIGHT },
  card: { width: PANEL_WIDTH, height: PANEL_HEIGHT },
} as const satisfies Record<PanelForm, { readonly width: number; readonly height: number }>

/** Document path suffix the Web client reads to render only the monitor card. */
export const PANEL_SURFACE = 'system-monitor'

/** The slice of a native window the panel drives. */
export interface PanelWindow {
  /** Load the monitor document. @param url - application document URL. @returns load completion. */
  loadURL(url: string): Promise<void>
  /** Show without taking focus from the frontmost application. */
  showInactive(): void
  /** Hide without destroying the window. */
  hide(): void
  /** @returns whether the window is currently visible. */
  isVisible(): boolean
  /** @returns whether the window has been destroyed. */
  isDestroyed(): boolean
  /** Destroy the window. */
  close(): void
  /** @returns the current bounds in screen coordinates. */
  getBounds(): Rectangle
  /** @param bounds - new bounds in screen coordinates. */
  setBounds(bounds: Rectangle): void
  /** @param event - native window event. @param listener - callback. */
  on(event: 'moved' | 'resized' | 'closed', listener: () => void): void
}

/** Platform hooks and persistence the panel needs. */
export interface SystemMonitorPanelDeps {
  /** @returns the authenticated application document URL, or undefined before the Host is ready. */
  readonly readUrl: () => string | undefined
  /** Absolute path of the application preload bundle the panel document uses. */
  readonly preload: string
  /** @param bounds - initial bounds inside the screen. @returns the created window. */
  readonly createWindow: (bounds: Rectangle, options: BrowserWindowConstructorOptions) => PanelWindow
  /** @returns the work area (screen minus dock and menu bar) nearest the panel. */
  readonly readWorkArea: () => Rectangle
  /** @returns the stored bounds, or null when none were saved. */
  readonly readBounds: () => Rectangle | null
  /** @param bounds - bounds to keep for the next launch. */
  readonly writeBounds: (bounds: Rectangle) => void
  /** @param open - whether the panel is now visible. */
  readonly onChange: (open: boolean) => void
}

/**
 * Resolve the panel's native window options.
 *
 * The panel reads as a native floating surface rather than a second app
 * window: no frame or traffic lights, the sidebar vibrancy material the main
 * window already uses, rounded corners, a native shadow, and a transparent
 * page background behind that material. `acceptFirstMouse` lets the first
 * click on a control act without activating the panel first.
 * @param platform - operating system hosting Electron.
 * @param bounds - initial bounds in screen coordinates.
 * @param preload - absolute path of the application preload bundle.
 * @returns constructor options for the panel, or null on unsupported platforms.
 */
export function panelWindowOptions(
  platform: NodeJS.Platform,
  bounds: Rectangle,
  preload: string,
): BrowserWindowConstructorOptions | null {
  if (platform !== 'darwin') return null
  return {
    ...bounds,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: true,
    roundedCorners: true,
    resizable: true,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    acceptFirstMouse: true,
    title: 'Tomato AI',
    vibrancy: 'sidebar',
    visualEffectState: 'active',
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
 * Bounds of one form's window, keeping the edge the panel rests against and its
 * vertical center, so shrinking to a pill reads as folding in place.
 * @param window - the panel window whose current bounds anchor the new ones.
 * @param form - the form its document now shows.
 * @param area - work area the panel must stay inside.
 * @returns the clamped bounds.
 */
export function resizePanelBounds(window: PanelWindow, form: PanelForm, area: Rectangle): Rectangle {
  return fitPanelBounds(window.getBounds(), form, area)
}

/**
 * Bounds of one form's window around a current rectangle.
 * @param current - the rectangle the new form folds from.
 * @param form - the form to size.
 * @param area - work area the panel must stay inside.
 * @returns the clamped bounds.
 */
export function fitPanelBounds(current: Rectangle, form: PanelForm, area: Rectangle): Rectangle {
  const size = PANEL_FORM_SIZE[form]
  const width = Math.min(size.width, Math.max(area.width, PANEL_MIN_WIDTH))
  const height = Math.min(size.height, Math.max(area.height, PANEL_MIN_HEIGHT))
  const center = current.y + current.height / 2
  const huggingRight = current.x + current.width / 2 >= area.x + area.width / 2
  const x = huggingRight ? current.x + current.width - width : current.x
  const y = Math.round(center - height / 2)
  // Moving a form to keep its center must not push it off screen; the window
  // keeps that much of the center line instead.
  const bottom = area.y + area.height
  return {
    x: Math.min(Math.max(x, area.x), Math.max(area.x, area.x + area.width - width)),
    y: Math.min(Math.max(y, area.y), Math.max(area.y, bottom - height)),
    width,
    height,
  }
}

/**
 * Keep the panel fully inside a work area.
 * @param bounds - requested bounds in screen coordinates.
 * @param area - work area the panel must stay inside.
 * @returns bounds with both edges clamped into the work area.
 */
export function clampPanelBounds(bounds: Rectangle, area: Rectangle): Rectangle {
  // A stacked card asks for less than the card minimum; either has to fit the work area.
  const width = Math.min(Math.max(bounds.width, 1), Math.max(area.width, 1))
  const height = Math.min(Math.max(bounds.height, 1), Math.max(area.height, 1))
  const x = Math.min(Math.max(bounds.x, area.x), Math.max(area.x, area.x + area.width - width))
  const y = Math.min(Math.max(bounds.y, area.y), Math.max(area.y, area.y + area.height - height))
  return { x, y, width, height }
}

/**
 * Read stored panel bounds.
 * @param raw - the persisted JSON document.
 * @returns the stored bounds, or null when the value is absent or unusable.
 */
export function parsePanelBounds(raw: string | null): Rectangle | null {
  if (raw === null) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const record = parsed as Record<string, unknown>
    const { x, y, width, height } = record
    if (![x, y, width, height].every(value => typeof value === 'number' && Number.isFinite(value))) return null
    if ((width as number) < PANEL_MIN_WIDTH || (height as number) < PANEL_MIN_HEIGHT) return null
    return { x: x as number, y: y as number, width: width as number, height: height as number }
  } catch {
    return null
  }
}

/**
 * Rest the panel above the right edge of the work area.
 * @param area - work area of the screen the panel opens on.
 * @returns default bounds.
 */
export function defaultPanelBounds(area: Rectangle): Rectangle {
  const width = Math.min(PANEL_WIDTH, Math.max(area.width, PANEL_MIN_WIDTH))
  return {
    x: Math.max(area.x, area.x + area.width - width - 16),
    y: area.y + 48,
    width,
    height: Math.min(PANEL_HEIGHT, Math.max(area.height, PANEL_MIN_HEIGHT)),
  }
}

/** Owns the one panel window and its persisted position. */
export class SystemMonitorPanel {
  private window: PanelWindow | null = null
  private open = false
  /**
   * The form the panel's document shows before its first report. A panel starts
   * as the collapsed pill until the document asks for the card, which the dock
   * does once it has read the stored form.
   */
  private form: PanelForm = 'pill'
  /** Bounds to restore when the next open expands the pill back into the card. */
  private cardBounds: Rectangle | null = null

  /** @param deps - platform hooks and persistence. */
  constructor(private readonly deps: SystemMonitorPanelDeps) {}

  /** @returns whether the panel is currently visible. */
  isOpen(): boolean {
    return this.open
  }

  /**
   * Show the panel, hide it when it is already visible, or create it on first use.
   * @returns the resulting visibility, or null when this platform has no panel.
   */
  async toggle(): Promise<boolean | null> {
    if (this.open) {
      this.window?.hide()
      this.setOpen(false)
      return false
    }
    const window = this.window ?? await this.create()
    if (window === null) return null
    if (!window.isVisible()) this.applyForm(window)
    window.showInactive()
    this.setOpen(true)
    return true
  }

  /** Close the panel and keep its position; only a card-sized window's bounds stand in for the card. */
  close(): void {
    const window = this.window
    this.window = null
    this.setOpen(false)
    if (window !== null && !window.isDestroyed()) {
      this.deps.writeBounds(this.form === 'card' ? window.getBounds() : this.cardBounds ?? window.getBounds())
      window.close()
    }
  }

  /**
   * Size the panel window to the form its document now shows.
   * @param form - the pill or the expanded card.
   */
  resize(form: PanelForm): void {
    const window = this.window
    if (window === null || window.isDestroyed()) {
      this.form = form
      return
    }
    // The document toggles show/hide itself, so the host only records the form
    // here; the window follows on its next open, or immediately through
    // {@link apply}.
    this.form = form
  }

  /**
   * Show or hide the pill-sized and card-sized window now, for a visible change.
   * The host calls this for a live panel; a hidden one keeps the form and applies
   * it when it next opens.
   */
  apply(): void {
    const window = this.window
    if (window === null || window.isDestroyed() || !window.isVisible()) return
    this.applyForm(window)
  }

  /** Release the window on application quit. */
  dispose(): void {
    const window = this.window
    this.window = null
    this.open = false
    if (window !== null && !window.isDestroyed()) window.close()
  }

  /** Create the native window at the remembered or default position. */
  private async create(): Promise<PanelWindow | null> {
    const url = this.deps.readUrl()
    if (url === undefined) return null
    const area = this.deps.readWorkArea()
    const stored = this.deps.readBounds()
    const bounds = clampPanelBounds(stored ?? defaultPanelBounds(area), area)
    // Every panel document starts as the pill it shows first, so a new window is
    // pill-sized; the dock asks for the card once it has read the stored form.
    const initial = fitPanelBounds(bounds, 'pill', area)
    const options = panelWindowOptions(process.platform, initial, this.deps.preload)
    if (options === null) return null
    const window = this.deps.createWindow(initial, options)
    this.window = window
    // The stored bounds are what the card would open at, whatever this run shows.
    this.cardBounds = bounds
    const keep = (): void => {
      if (this.form !== 'card') return
      this.cardBounds = window.getBounds()
      this.deps.writeBounds(clampPanelBounds(window.getBounds(), this.deps.readWorkArea()))
    }
    window.on('moved', keep)
    window.on('resized', keep)
    window.on('closed', () => {
      if (this.window === window) {
        this.window = null
        this.setOpen(false)
      }
    })
    await window.loadURL(`${url}?surface=${PANEL_SURFACE}`)
    return window
  }

  /**
   * Move one live window to the recorded form's size. Opening the card after a
   * pill-only run uses the card's own remembered bounds, because the pill window
   * cannot stand in for them.
   * @param window - the panel window.
   */
  private applyForm(window: PanelWindow): void {
    const area = this.deps.readWorkArea()
    if (this.form === 'card') {
      // The card restores the bounds it had before the pill; without any, the stored ones.
      const stored = this.cardBounds ?? this.deps.readBounds() ?? defaultPanelBounds(area)
      window.setBounds(stored)
      this.cardBounds = window.getBounds()
      return
    }
    // The stored card bounds stay the reference; a user move of the pill updates them.
    window.setBounds(resizePanelBounds(window, 'pill', area))
  }

  /** @param open - publish one visibility change. */
  private setOpen(open: boolean): void {
    if (this.open === open) return
    this.open = open
    this.deps.onChange(open)
  }
}
