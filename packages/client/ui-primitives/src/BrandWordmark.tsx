import type { IconProps } from './icons/props.ts'
import { TOMATO_MARK_PATH } from './TomatoMark.tsx'

/** Display options for the official brand wordmark. */
export interface BrandWordmarkProps extends IconProps {
  /** Whether to include the leading Tomato mark; defaults to true. */
  includeMark?: boolean | undefined
}

/**
 * Render the full brand wordmark.
 * @param props.size - height in px (default 24; width follows the selected artwork).
 * @param props.className - extra class for layout placement.
 * @param props.includeMark - whether to include the leading Tomato mark.
 * @returns the wordmark svg (aria-hidden decorative brand art).
 */
export function BrandWordmark({ size = 24, className, includeMark = true }: BrandWordmarkProps) {
  const width = includeMark ? 104 : 74
  return (
    <svg
      width={(size * width) / 24}
      height={size}
      className={className}
      viewBox={includeMark ? '0 0 104 24' : '30 0 74 24'}
      fill="none"
      aria-hidden="true"
    >
      {includeMark && (
        <g transform="translate(0.612 0.434) scale(0.3559)">
          <path d={TOMATO_MARK_PATH} fill="currentColor" />
        </g>
      )}
      <text
        x="30"
        y="18.5"
        fill="currentColor"
        fontFamily="Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif"
        fontSize="18"
        fontWeight="600"
        letterSpacing="0.2"
      >
        Tomato
      </text>
    </svg>
  )
}
