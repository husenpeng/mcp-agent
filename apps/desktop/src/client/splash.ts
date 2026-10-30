/** Startup splash: 3D city lifecycle, wordmark decode, skip, and completion handshake. */

import { SPLASH_TIMINGS, splashAnimationDoneAt } from './splash-timeline.ts'
import { decodeSplashText } from './splash-decode.ts'
import { startSplashScene, type SplashScene } from './splash-scene.ts'
import type { SplashApi } from '../splash-api.ts'

declare global {
  interface Window {
    tomatoSplash?: SplashApi
  }
}

/** A timed DOM effect that waits for the shared clock before scheduling itself. */
interface ClockedEffect {
  /** Schedule from the moment the 3D timeline starts. */
  start(): void
  /** Resolve to the final state immediately. */
  finish(): void
  /** Cancel pending work when the page is unloaded. */
  stop(): void
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Decode the visible brand name without changing its accessible label.
 * @param element - visual wordmark carrying its final value in `data-text`.
 * @returns clock-driven start, immediate finish, and cancellation on unload.
 */
function createWordmarkDecode(element: HTMLElement | null): ClockedEffect {
  if (element === null || reducedMotion) return { start: () => {}, finish: () => {}, stop: () => {} }
  const target = element.dataset.text ?? element.textContent
  let delayTimer: number | undefined
  let frameTimer: number | undefined
  let finished = false
  const clearTimers = (): void => {
    window.clearTimeout(delayTimer)
    if (frameTimer !== undefined) window.clearInterval(frameTimer)
  }
  return {
    start: () => {
      if (finished) return
      delayTimer = window.setTimeout(() => {
        const startedAt = performance.now()
        const render = (): void => {
          const progress = (performance.now() - startedAt) / SPLASH_TIMINGS.wordmarkMs
          element.textContent = decodeSplashText(target, progress)
          if (progress >= 1 && frameTimer !== undefined) {
            window.clearInterval(frameTimer)
            frameTimer = undefined
          }
        }
        render()
        frameTimer = window.setInterval(render, 40)
      }, SPLASH_TIMINGS.wordmarkDelayMs)
    },
    finish: () => {
      finished = true
      clearTimers()
      element.textContent = target
    },
    stop: clearTimers,
  }
}

/**
 * Jump the document to its final frame and report completion once.
 * @param waiting - waiting indicator, revealed after `waitingDelayMs` when the shell has not exited yet.
 * @param doneAt - completion time in milliseconds from the start of the shared clock.
 * @param completeScene - resolves the 3D camera and pending decode before the final frame is exposed.
 * @returns clock-driven start, the finish action used by skip input, and cancellation on unload.
 */
function createCompletion(waiting: HTMLElement | null, doneAt: number, completeScene: () => void): ClockedEffect {
  let done = false
  let doneTimer: number | undefined
  let waitingTimer: number | undefined
  const finish = (): void => {
    if (done) return
    done = true
    window.clearTimeout(doneTimer)
    completeScene()
    document.documentElement.dataset.splash = 'done'
    waitingTimer = window.setTimeout(() => { waiting?.classList.add('visible') }, SPLASH_TIMINGS.waitingDelayMs)
    window.tomatoSplash?.notifyAnimationDone()
  }
  return {
    start: () => {
      if (!done) doneTimer = window.setTimeout(finish, doneAt)
    },
    finish,
    stop: () => {
      window.clearTimeout(doneTimer)
      if (waitingTimer !== undefined) window.clearTimeout(waitingTimer)
    },
  }
}

// Completion exists before the scene: a WebGL failure reports readiness while the scene is still being created.
let scene: SplashScene = { finish: () => {}, stop: () => {} }
const wordmarkDecode = createWordmarkDecode(document.querySelector<HTMLElement>('.wordmark-name'))
const completion = createCompletion(
  document.querySelector<HTMLElement>('#waiting'),
  splashAnimationDoneAt(reducedMotion),
  () => {
    scene.finish()
    wordmarkDecode.finish()
  },
)
scene = startSplashScene(document.querySelector<HTMLCanvasElement>('#city-3d'), reducedMotion, () => {
  // CSS animations stay paused until the first 3D frame, so slow shader warm-up cannot desynchronize them.
  document.documentElement.dataset.clock = 'running'
  wordmarkDecode.start()
  completion.start()
})
const skip = (): void => { completion.finish() }
window.addEventListener('pointerdown', skip)
window.addEventListener('keydown', (event) => { if (event.key === 'Escape') skip() })
window.addEventListener('pagehide', () => {
  completion.stop()
  wordmarkDecode.stop()
  scene.stop()
}, { once: true })
