/** Canvas host for the empty-session hero dot field. */

import { useLayoutEffect, useRef } from 'react'
import {
  DOT_FIELD_PARAMS, createDotGrid, cssRgba, parseCssColor, proximityColor,
  pushDotsNearPointer, samplePointer, shockDots, stepDots,
} from './dot-field.ts'
import type { DotState, PointerSample, Rgba } from './dot-field.ts'
import css from './DotField.module.css'

/** Theme token carrying the resting dot color. */
const BASE_TOKEN = '--dsw-alias-border-l3'

/** Theme token carrying the pointer-proximity dot color. */
const ACTIVE_TOKEN = '--dsw-brand-mark-end'

/** One resolved pair of field colors. */
interface Palette {
  readonly base: Rgba
  readonly active: Rgba
}

/**
 * Resolve one theme token to channels through a probe span, so `var()` chains
 * and `color-mix()` reach a computed color rather than their source text.
 * @param token - custom property name declared on the theme body.
 * @returns the parsed color, or undefined when the token is absent or unsupported.
 */
function readTokenColor(token: string): Rgba | undefined {
  const declared = getComputedStyle(document.body).getPropertyValue(token).trim()
  if (declared === '') return undefined
  const probe = document.createElement('span')
  probe.setAttribute('aria-hidden', 'true')
  probe.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden'
  probe.style.color = declared
  document.body.append(probe)
  try {
    return parseCssColor(getComputedStyle(probe).color)
  } finally {
    probe.remove()
  }
}

/** Read the resting and proximity colors from the active theme. */
function readPalette(): Palette | undefined {
  const base = readTokenColor(BASE_TOKEN)
  if (base === undefined) return undefined
  return { base, active: readTokenColor(ACTIVE_TOKEN) ?? base }
}

/**
 * Own one canvas field: size, grid, colors, pointer input, frames, and cleanup.
 * @param canvas - the hero canvas element.
 * @returns the disposer for every listener, observer, timer, and frame.
 */
function startDotField(canvas: HTMLCanvasElement): () => void {
  const params = DOT_FIELD_PARAMS
  const reduced = typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches

  let width = 0
  let height = 0
  let dots: DotState[] = []
  let palette: Palette | undefined
  let context: CanvasRenderingContext2D | null = null
  let contextUnavailable = false
  let pointer = { active: false, x: 0, y: 0 }
  let previousPointer: PointerSample | undefined
  let lastPointerAt = 0
  let frameId = 0
  let lastFrameAt = 0
  let resizeTimer: ReturnType<typeof setTimeout> | undefined
  let resizeObserver: ResizeObserver | undefined
  let themeObserver: MutationObserver | undefined
  let disposed = false

  /**
   * Draw one resting frame. Setting `data-ready` hides the CSS dot fallback
   * only after pixels actually landed, so a missing context keeps the fallback.
   * @returns whether the frame was drawn.
   */
  function draw(): boolean {
    if (context === null || palette === undefined || dots.length === 0) {
      canvas.removeAttribute('data-ready')
      return false
    }
    const colors = palette
    const base = cssRgba(colors.base)
    context.clearRect(0, 0, width, height)
    for (const dot of dots) {
      const tinted = pointer.active
        ? proximityColor(Math.hypot(dot.cx - pointer.x, dot.cy - pointer.y), params.proximity, colors.base, colors.active)
        : undefined
      context.fillStyle = tinted === undefined ? base : cssRgba(tinted)
      context.beginPath()
      context.arc(dot.cx + dot.x, dot.cy + dot.y, params.dotSize / 2, 0, Math.PI * 2)
      context.fill()
    }
    canvas.setAttribute('data-ready', '')
    return true
  }

  /** Schedule one animation frame unless the field is reduced, idle, or drawing. */
  function ensureFrame(): void {
    if (disposed || reduced || frameId !== 0) return
    frameId = requestAnimationFrame(frame)
  }

  /** Advance the spring and draw; stop scheduling once every dot rests. */
  function frame(time: number): void {
    frameId = 0
    if (disposed) return
    const elapsed = lastFrameAt === 0 ? 1 / 60 : (time - lastFrameAt) / 1000
    lastFrameAt = time
    const moving = stepDots(dots, elapsed, params)
    if (!draw()) {
      lastFrameAt = 0
      return
    }
    if (moving) ensureFrame()
    else lastFrameAt = 0
  }

  /** Drop the drawn field and backing store, keeping the CSS fallback visible. */
  function release(): void {
    canvas.removeAttribute('data-ready')
    dots = []
    width = 0
    height = 0
    lastFrameAt = 0
    if (frameId !== 0) {
      cancelAnimationFrame(frameId)
      frameId = 0
    }
    canvas.width = 0
    canvas.height = 0
  }

  /** Measure the canvas, rebuild the grid, resolve colors, and draw once. */
  function build(): void {
    const measured = canvas.getBoundingClientRect()
    width = measured.width
    height = measured.height
    if (!(width > 0) || !(height > 0)) {
      release()
      return
    }
    const ratio = Math.min(params.maxDpr, Math.max(1, window.devicePixelRatio || 1))
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    if (context === null && !contextUnavailable) {
      context = canvas.getContext('2d')
      if (context === null) contextUnavailable = true
    }
    if (context === null) {
      canvas.removeAttribute('data-ready')
      return
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    dots = createDotGrid(width, height, params)
    palette = readPalette()
    draw()
  }

  /** Debounce resize-driven rebuilds; a scrollbar change fires many events. */
  function scheduleBuild(): void {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(build, params.resizeDebounceMs)
  }

  /** Track a throttled pointer reading and push dots around a fast move. */
  function onMove(event: MouseEvent): void {
    if (disposed) return
    const now = performance.now()
    if (now - lastPointerAt < params.pointerThrottleMs) return
    lastPointerAt = now
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      if (pointer.active) {
        pointer = { active: false, x: 0, y: 0 }
        previousPointer = undefined
        ensureFrame()
      }
      return
    }
    const sample = samplePointer(previousPointer, x, y, now, params)
    previousPointer = sample
    pointer = { active: true, x, y }
    pushDotsNearPointer(dots, pointer, sample, params)
    ensureFrame()
  }

  /** Send a shockwave through a click inside the field. */
  function onClick(event: MouseEvent): void {
    if (disposed || event.detail === 0) return
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return
    pointer = { active: true, x, y }
    shockDots(dots, x, y, params)
    ensureFrame()
  }

  /** Clear the proximity tint when the pointer leaves the document. */
  function onLeave(): void {
    if (!pointer.active) return
    pointer = { active: false, x: 0, y: 0 }
    previousPointer = undefined
    ensureFrame()
  }

  /** Re-resolve theme colors when the theme presenter rewrites the body projection. */
  function onThemeChange(): void {
    const next = readPalette()
    if (next === undefined) {
      palette = undefined
      canvas.removeAttribute('data-ready')
      return
    }
    palette = next
    if (reduced) draw()
    else ensureFrame()
  }

  build()
  if (!reduced) {
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('click', onClick)
    document.documentElement.addEventListener('mouseleave', onLeave)
  }
  window.addEventListener('resize', scheduleBuild)
  if (typeof ResizeObserver === 'function') {
    resizeObserver = new ResizeObserver(scheduleBuild)
    resizeObserver.observe(canvas)
  }
  if (typeof MutationObserver === 'function') {
    themeObserver = new MutationObserver(onThemeChange)
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme', 'style'] })
  }

  return () => {
    disposed = true
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('click', onClick)
    window.removeEventListener('resize', scheduleBuild)
    document.documentElement.removeEventListener('mouseleave', onLeave)
    clearTimeout(resizeTimer)
    resizeObserver?.disconnect()
    themeObserver?.disconnect()
    if (frameId !== 0) cancelAnimationFrame(frameId)
    canvas.removeAttribute('data-ready')
    canvas.width = 0
    canvas.height = 0
  }
}

/**
 * Decorative dot field behind the empty-session hero. Dots tint toward the
 * pointer, a fast move pushes them away with a spring return, and a click
 * sends a shockwave. The CSS dot background stays as the fallback until the
 * first canvas frame lands, and reduced motion keeps a static canvas frame.
 * @returns the field canvas, hidden from the accessibility tree.
 */
export function DotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    return canvas === null ? undefined : startDotField(canvas)
  }, [])
  return <canvas ref={canvasRef} className={css.dotField} data-dot-field="" aria-hidden="true" />
}
