/**
 * Sparkline primitive of the monitor overlay: one normalized value series
 * drawn as a line with a soft area fill, in the color of its containing
 * element.
 * @module @tomato/client-ui-system-monitor/Sparkline
 */

/** Width of the normalized view box. */
const VIEW_WIDTH = 100

/** Height of the normalized view box. */
const VIEW_HEIGHT = 30

/** Props of {@link Sparkline}. */
export interface SparklineProps {
  /** Values in 0–1, oldest first; fewer than two values draw a flat line. */
  readonly values: readonly number[]
  /** Extra class applied to the SVG, used for its stroke color. */
  readonly className?: string
}

/**
 * Build the line and area paths for one series.
 * @param values - normalized values, oldest first.
 * @returns the line path and the closed area path.
 */
export function sparkPaths(values: readonly number[]): { line: string; area: string } {
  const points = values.length === 0 ? [0] : values
  const step = points.length > 1 ? VIEW_WIDTH / (points.length - 1) : VIEW_WIDTH
  const coordinates = points.map((value, index) => {
    const clamped = Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0
    const x = index * step
    const y = VIEW_HEIGHT - clamped * VIEW_HEIGHT
    return `${x.toFixed(2)} ${y.toFixed(2)}`
  })
  const line = `M${coordinates.join(' L')}`
  const lastX = points.length > 1 ? VIEW_WIDTH : 0
  return { line, area: `${line} L${lastX.toFixed(2)} ${VIEW_HEIGHT} L0 ${VIEW_HEIGHT} Z` }
}

/**
 * Draw one value series.
 * @param props - the series and its color class.
 * @returns the sparkline SVG.
 */
export function Sparkline({ values, className }: SparklineProps) {
  const { line, area } = sparkPaths(values)
  return (
    <svg
      className={className}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      data-sparkline
    >
      <path d={area} className="sparkArea" fill="currentColor" opacity="0.12" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
