/** Localized relative age and duration labels shared by the robot roster and one run's detail. */
import type { Run } from '@tomato/api-robot-controller/client'
import { relativeTime } from '@tomato/client-ui-primitives'
import type { PropsLocale } from '@tomato/client-ui-slots'
import { NS } from './locales.ts'

/** Translate seat of the robot namespace. */
export type Translate = PropsLocale<typeof NS>['t']

const MINUTE_SECONDS = 60

/**
 * Read how long a run took, or has been running.
 * @param run - run whose clock is measured.
 * @param now - current epoch milliseconds.
 * @returns elapsed milliseconds, never negative.
 */
export function runElapsed(run: Run, now: number): number {
  return Math.max(0, (run.endedAt ?? now) - run.startedAt)
}

/**
 * Localize a short relative age, such as "3 minutes ago".
 * @param at - epoch milliseconds of the dated moment.
 * @param now - current epoch milliseconds.
 * @param t - robot page translate seat.
 * @returns the relative label.
 */
export function ageLabel(at: number, now: number, t: Translate): string {
  const { unit, n } = relativeTime(at, now)
  return unit === 'now' ? t('time.now') : t(`time.${unit}`, { n })
}

/**
 * Localize an elapsed duration at second, minute, or hour resolution.
 * @param millis - elapsed milliseconds.
 * @param t - robot page translate seat.
 * @returns the duration label.
 */
export function durationLabel(millis: number, t: Translate): string {
  const seconds = Math.max(0, Math.round(millis / 1000))
  if (seconds < MINUTE_SECONDS) return t('run.duration.seconds', { n: seconds })
  const minutes = Math.floor(seconds / MINUTE_SECONDS)
  if (minutes < 60) return t('run.duration.minutes', { m: minutes, s: seconds % MINUTE_SECONDS })
  return t('run.duration.hours', { h: Math.floor(minutes / 60), m: minutes % 60 })
}

/**
 * Compose the run meta line under the conversation title.
 * @param run - run whose clock is described.
 * @param stepCount - folded action count, omitted from the line when zero.
 * @param failedCount - failed action count, omitted from the line when zero.
 * @param now - current epoch milliseconds.
 * @param t - robot page translate seat.
 * @returns the meta parts, to be joined by a middle dot.
 */
export function runMeta(
  run: Run,
  stepCount: number,
  failedCount: number,
  now: number,
  t: Translate,
): readonly string[] {
  const parts = [
    t('run.startedAgo', { age: ageLabel(run.startedAt, now, t) }),
    run.endedAt === undefined
      ? t('run.elapsed', { duration: durationLabel(runElapsed(run, now), t) })
      : t('run.usedFor', { duration: durationLabel(runElapsed(run, now), t) }),
  ]
  if (stepCount > 0) parts.push(t('run.stepCount', { n: stepCount }))
  if (failedCount > 0) parts.push(t('run.failedCount', { n: failedCount }))
  return parts
}
