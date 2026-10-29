/** Startup splash document: star field, waiting indicator, skip handling, and the completion handshake. */

import { SPLASH_TIMINGS, splashAnimationDoneAt, splashStars, type SplashStar } from './splash-timeline.ts'
import type { SplashApi } from '../splash-api.ts'

declare global {
  interface Window {
    tomatoSplash?: SplashApi
  }
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Map a CSS custom property holding an `r g b` triplet onto numbers.
 * @param value - computed property value.
 * @returns the three channels; missing input falls back to black.
 */
function parseRgb(value: string): [number, number, number] {
  const [red = 0, green = 0, blue = 0] = value.trim().split(/\s+/u).map(Number)
  return [red, green, blue]
}

/**
 * Paint the depth field behind the lockup.
 * @param canvas - full-window canvas.
 * @returns a disposer that stops the frame loop and clears handlers.
 */
function startStars(canvas: HTMLCanvasElement): () => void {
  const context = canvas.getContext('2d')
  if (context === null) return () => {}
  const style = getComputedStyle(document.documentElement)
  const neutral = parseRgb(style.getPropertyValue('--splash-star-rgb'))
  const accent = parseRgb(style.getPropertyValue('--splash-star-red-rgb'))
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const stars = splashStars()
  const igniteTimes = new Map<SplashStar, number>()
  const startedAt = performance.now()
  let width = 0
  let height = 0
  let centre = { x: 0, y: 0 }
  let frame = 0

  const distanceToCentre = (star: SplashStar): number =>
    Math.hypot(star.x * width - centre.x, star.y * height - centre.y)

  const measure = (): void => {
    const ratio = Math.min(2, window.devicePixelRatio || 1)
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    canvas.style.width = `${String(width)}px`
    canvas.style.height = `${String(height)}px`
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    const mark = document.querySelector('.mark')?.getBoundingClientRect()
    centre = mark === undefined
      ? { x: width / 2, y: height * 0.46 }
      : { x: mark.x + mark.width / 2, y: mark.y + mark.height / 2 }
    igniteTimes.clear()
    if (reducedMotion) return
    // The twelve stars nearest the mark flare as the ink trace reaches their side.
    const ranked = [...stars].sort((left, right) => distanceToCentre(left) - distanceToCentre(right)).slice(0, 12)
    const farthest = Math.max(1, ...ranked.map(star => distanceToCentre(star)))
    for (const star of ranked) {
      igniteTimes.set(star, SPLASH_TIMINGS.traceMs * (0.18 + (distanceToCentre(star) / farthest) * 0.7))
    }
  }

  const draw = (elapsed: number): void => {
    context.clearRect(0, 0, width, height)
    const pulse = elapsed >= SPLASH_TIMINGS.pulseAtMs && elapsed <= SPLASH_TIMINGS.pulseAtMs + SPLASH_TIMINGS.pulseMs
      ? 1 + 0.22 * Math.sin(Math.PI * (elapsed - SPLASH_TIMINGS.pulseAtMs) / SPLASH_TIMINGS.pulseMs)
      : 1
    for (const star of stars) {
      const drift = reducedMotion ? 0 : elapsed * (0.0015 + star.depth * 0.003)
      const y = ((star.y * height - drift) % height + height) % height
      const x = star.x * width
      const [red, green, blue] = star.red ? accent : neutral
      let alpha = (dark ? 0.09 + star.intensity * 0.37 : 0.05 + star.intensity * 0.13) * pulse
      if (star.red) alpha *= 0.9
      if (!reducedMotion) {
        alpha *= 1 + 0.3 * Math.sin(elapsed / 1000 * star.twinkle * 2 * Math.PI + star.phase)
        const igniteAt = igniteTimes.get(star)
        if (igniteAt !== undefined && elapsed >= igniteAt) {
          alpha += 0.4 * Math.exp(-(elapsed - igniteAt) / 220)
        }
      }
      context.beginPath()
      context.arc(x, y, star.radius, 0, 2 * Math.PI)
      context.fillStyle = `rgba(${String(red)}, ${String(green)}, ${String(blue)}, ${Math.min(1, Math.max(0, alpha)).toFixed(3)})`
      context.fill()
    }
  }

  const tick = (): void => {
    draw(performance.now() - startedAt)
    frame = requestAnimationFrame(tick)
  }

  measure()
  window.addEventListener('resize', measure)
  if (reducedMotion) draw(0)
  else frame = requestAnimationFrame(tick)
  return () => {
    cancelAnimationFrame(frame)
    window.removeEventListener('resize', measure)
  }
}

/**
 * Jump the document to its final frame and report completion once.
 * @param waiting - waiting indicator, revealed after `waitingDelayMs` when the shell has not exited yet.
 * @param doneAt - completion time in milliseconds from document start.
 * @returns the finish action used by skip input and the stop action used when the page is unloaded.
 */
function installCompletion(waiting: HTMLElement | null, doneAt: number): { finish(): void; stop(): void } {
  let done = false
  let waitingTimer: number | undefined
  const doneTimer = window.setTimeout(() => { finish() }, doneAt)
  function finish(): void {
    if (done) return
    done = true
    window.clearTimeout(doneTimer)
    document.documentElement.dataset.splash = 'done'
    waitingTimer = window.setTimeout(() => { waiting?.classList.add('visible') }, SPLASH_TIMINGS.waitingDelayMs)
    window.tomatoSplash?.notifyAnimationDone()
  }
  return {
    finish,
    stop: () => {
      window.clearTimeout(doneTimer)
      if (waitingTimer !== undefined) window.clearTimeout(waitingTimer)
    },
  }
}

const canvas = document.querySelector<HTMLCanvasElement>('#stars')
const stopStars = canvas === null ? (): void => {} : startStars(canvas)
const completion = installCompletion(document.querySelector<HTMLElement>('#waiting'), splashAnimationDoneAt(reducedMotion))
const skip = (): void => { completion.finish() }
window.addEventListener('pointerdown', skip)
window.addEventListener('keydown', (event) => { if (event.key === 'Escape') skip() })
window.addEventListener('pagehide', () => {
  completion.stop()
  stopStars()
}, { once: true })
