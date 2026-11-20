/**
 * Percentage meter of the monitor overlay: one normalized value drawn as a
 * filled rail whose color states what it measures.
 * @module @tomato/client-ui-system-monitor/Meter
 */

import css from './Dock.module.css'

/** What one meter measures; the stylesheet owns the tone. */
export type MeterTone = 'cpu' | 'gpu' | 'memory' | 'swap' | 'disk' | 'warn'

/** Props of {@link Meter}. */
export interface MeterProps {
  /** Filled share, 0–1; values outside the range are clamped. */
  readonly value: number
  /** Which tone the filled rail uses. */
  readonly tone: MeterTone
}

/**
 * Draw one percentage rail.
 * @param props - the filled share and its tone.
 * @returns the rail element.
 */
export function Meter({ value, tone }: MeterProps) {
  const ratio = Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0
  return (
    <div className={css.meter} data-tone={tone}>
      <div className={css.meterFill} style={{ width: `${(ratio * 100).toFixed(1)}%` }} />
    </div>
  )
}
