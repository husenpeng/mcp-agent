/**
 * Where the monitor sits and how it is showing: its free position inside the
 * overlay layer, one of three forms (the collapsed pill, the dashboard card, or
 * the ball parked against a side edge), whether sampling is paused, and the form
 * to return to after the ball. Pure math plus a storage seam, so the drag
 * gesture only turns a pointer delta into one clamped layout.
 * @module @tomato/client-ui-system-monitor/overlay-layout
 */

/** Card width in CSS pixels. */
export const OVERLAY_WIDTH = 348

/** Card height in CSS pixels. */
export const OVERLAY_HEIGHT = 452

/** Pill width in CSS pixels, matching the three readings it shows. */
export const PILL_WIDTH = 236

/** Pill height in CSS pixels. */
export const PILL_HEIGHT = 40

/** Ball diameter in CSS pixels. */
export const BALL_SIZE = 44

/** Distance the monitor keeps from a viewport edge, in CSS pixels. */
export const OVERLAY_MARGIN = 16

/** How the monitor is showing. */
export type OverlayForm = 'pill' | 'card' | 'ball'

/** The form the ball returns to. */
export type RestingForm = Exclude<OverlayForm, 'ball'>

/** The side edge a ball is parked against. */
export type OverlayEdge = 'left' | 'right'

/** localStorage key holding the last layout. */
export const OVERLAY_STORAGE_KEY = 'tomato.system-monitor.v1'

/** Where the monitor is and how it is showing. */
export interface OverlayLayout {
  /** Left offset of the pill's or card's free position inside the overlay layer, in CSS pixels. */
  readonly x: number
  /** Top offset of the pill's or card's free position inside the overlay layer, in CSS pixels. */
  readonly y: number
  /** The form currently shown. */
  readonly form: OverlayForm
  /** The form the ball returns to. */
  readonly restore: RestingForm
  /** The side edge the ball is parked against. */
  readonly edge: OverlayEdge
  /** Offset of the ball's center from the top of the overlay layer, in CSS pixels. */
  readonly axis: number
  /** True while the consumer released the observation stream. */
  readonly paused: boolean
  /** True once the layout was written by a drag or by a user toggle. */
  readonly placed: boolean
}

/**
 * Size of one form.
 * @param form - the form to measure.
 * @returns its width and height in CSS pixels.
 */
export function formSize(form: OverlayForm): { readonly width: number; readonly height: number } {
  switch (form) {
    case 'pill': return { width: PILL_WIDTH, height: PILL_HEIGHT }
    case 'card': return { width: OVERLAY_WIDTH, height: OVERLAY_HEIGHT }
    case 'ball': return { width: BALL_SIZE, height: BALL_SIZE }
  }
}

/**
 * Keep a free position inside the window with its margin.
 * @param form - the form being placed.
 * @param x - requested left offset in CSS pixels.
 * @param y - requested top offset in CSS pixels.
 * @param viewportWidth - window inner width in CSS pixels.
 * @param viewportHeight - window inner height in CSS pixels.
 * @returns the clamped offsets.
 */
export function clampPosition(
  form: RestingForm, x: number, y: number, viewportWidth: number, viewportHeight: number,
): { readonly x: number; readonly y: number } {
  const size = formSize(form)
  const maximumX = Math.max(OVERLAY_MARGIN, viewportWidth - size.width - OVERLAY_MARGIN)
  const maximumY = Math.max(OVERLAY_MARGIN, viewportHeight - size.height - OVERLAY_MARGIN)
  return {
    x: Math.min(Math.max(x, OVERLAY_MARGIN), maximumX),
    y: Math.min(Math.max(y, OVERLAY_MARGIN), maximumY),
  }
}

/**
 * Keep a ball's center far enough from the top and bottom edges that half of it
 * stays visible.
 * @param axis - requested center offset from the top, in CSS pixels.
 * @param viewportHeight - window inner height in CSS pixels.
 * @returns the clamped center offset.
 */
export function clampAxis(axis: number, viewportHeight: number): number {
  const minimum = BALL_SIZE / 2
  const maximum = Math.max(minimum, viewportHeight - BALL_SIZE / 2)
  return Math.min(Math.max(axis, minimum), maximum)
}

/**
 * Build a parked ball's layout over another layout's free position.
 * @param previous - the layout the ball takes over from.
 * @param edge - the side edge to park against.
 * @param axis - center offset from the top, in CSS pixels.
 * @param restore - the form the ball returns to.
 * @param viewportHeight - window inner height in CSS pixels.
 * @returns the parked layout, with the free position tightened for the window.
 */
export function ballLayout(
  previous: OverlayLayout, edge: OverlayEdge, axis: number, restore: RestingForm, viewportHeight: number,
): OverlayLayout {
  return {
    ...previous,
    form: 'ball',
    edge,
    axis: clampAxis(axis, viewportHeight),
    restore,
  }
}

/**
 * Keep a whole layout inside the window: a free form is clamped as itself, and a
 * ball keeps its center between the two edges.
 * @param layout - the layout to adjust.
 * @param viewportWidth - window inner width in CSS pixels.
 * @param viewportHeight - window inner height in CSS pixels.
 * @returns the layout with its offsets inside the visible area.
 */
export function clampLayout(layout: OverlayLayout, viewportWidth: number, viewportHeight: number): OverlayLayout {
  if (layout.form === 'ball') {
    const axis = clampAxis(layout.axis, viewportHeight)
    return axis === layout.axis ? layout : { ...layout, axis }
  }
  const { x, y } = clampPosition(layout.form, layout.x, layout.y, viewportWidth, viewportHeight)
  return x === layout.x && y === layout.y ? layout : { ...layout, x, y }
}

/**
 * Rest the monitor above the bottom-right corner of the window.
 * @param viewportWidth - window inner width in CSS pixels.
 * @param viewportHeight - window inner height in CSS pixels.
 * @returns the default collapsed layout with no stored position.
 */
export function defaultLayout(viewportWidth: number, viewportHeight: number): OverlayLayout {
  const { x, y } = clampPosition('pill', viewportWidth - PILL_WIDTH - OVERLAY_MARGIN, viewportHeight - PILL_HEIGHT - OVERLAY_MARGIN, viewportWidth, viewportHeight)
  return { x, y, form: 'pill', restore: 'pill', edge: 'right', axis: viewportHeight / 2, paused: false, placed: false }
}

/**
 * Park a free form against the nearer side edge, entering the ball form. The
 * free position is kept for when the ball expands again.
 * @param layout - the pill or card layout to park.
 * @param viewportWidth - window inner width in CSS pixels.
 * @param viewportHeight - window inner height in CSS pixels.
 * @returns the parked layout.
 */
export function parkLayout(layout: OverlayLayout, viewportWidth: number, viewportHeight: number): OverlayLayout {
  const size = formSize(layout.form === 'card' ? 'card' : 'pill')
  const center = layout.x + size.width / 2
  const edge: OverlayEdge = center < viewportWidth / 2 ? 'left' : 'right'
  const restore: RestingForm = layout.form === 'card' ? 'card' : 'pill'
  return { ...ballLayout(layout, edge, layout.y + size.height / 2, restore, viewportHeight), placed: true }
}

/**
 * Expand a parked ball back into a form.
 * @param layout - the parked layout.
 * @param form - the form to expand into.
 * @param viewportWidth - window inner width in CSS pixels.
 * @param viewportHeight - window inner height in CSS pixels.
 * @returns the layout in the requested form, at its last free position.
 */
export function expandLayout(
  layout: OverlayLayout, form: RestingForm, viewportWidth: number, viewportHeight: number,
): OverlayLayout {
  const { x, y } = clampPosition(form, layout.x, layout.y, viewportWidth, viewportHeight)
  return { ...layout, form, restore: form, x, y }
}

/**
 * Translate a stored payload into a layout, accepting the earlier records that
 * only carried an `expanded` flag.
 * @param raw - the raw localStorage value.
 * @returns the stored layout, or null when the value is absent or unusable.
 */
export function parseLayout(raw: string | null): OverlayLayout | null {
  if (raw === null) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const record = parsed as Record<string, unknown>
    const { x, y, form, restore, edge, axis } = record
    if (typeof x !== 'number' || typeof y !== 'number') return null
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null
    const paused = record.paused === true
    const placed = record.placed === true
    if (form === 'ball') {
      if (typeof axis !== 'number' || !Number.isFinite(axis)) return null
      return {
        x, y, form, axis,
        edge: edge === 'left' ? 'left' : 'right',
        restore: restore === 'card' ? 'card' : 'pill',
        paused, placed,
      }
    }
    // An unstored ball parks against the right edge; a resting form is never a ball.
    const shown: RestingForm = form === 'card' || record.expanded === true ? 'card' : 'pill'
    return { x, y, form: shown, restore: shown, edge: 'right', axis: BALL_SIZE / 2, paused, placed }
  } catch (_malformedStoredLayout) {
    return null
  }
}

/**
 * Read the last layout from a storage face.
 * @param storage - the storage to read, usually `window.localStorage`.
 * @returns the stored layout, or null when nothing usable was stored.
 */
export function readLayout(storage: Pick<Storage, 'getItem'>): OverlayLayout | null {
  try {
    return parseLayout(storage.getItem(OVERLAY_STORAGE_KEY))
  } catch (_unreadableStorage) {
    return null
  }
}

/**
 * Persist one layout through a storage face.
 * @param storage - the storage to write, usually `window.localStorage`.
 * @param layout - the layout to keep for the next mount.
 */
export function writeLayout(storage: Pick<Storage, 'setItem'>, layout: OverlayLayout): void {
  try {
    storage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify(layout))
  } catch (_unwritableStorage) {
    // A full or refused storage costs the next mount this position, nothing else.
  }
}
/**
 * The ball's colour band: green below 60% processor load, amber up to 85%, red
 * above it, and neutral while sampling is paused or no reading has arrived.
 * @param cpu - latest processor usage as a 0–1 share, or undefined without a frame.
 * @param paused - whether sampling is paused.
 * @returns the tone name the stylesheet paints.
 */
export function ballTone(cpu: number | undefined, paused: boolean): 'neutral' | 'calm' | 'busy' | 'hot' {
  if (paused || cpu === undefined) return 'neutral'
  if (cpu >= 0.85) return 'hot'
  return cpu >= 0.6 ? 'busy' : 'calm'
}
