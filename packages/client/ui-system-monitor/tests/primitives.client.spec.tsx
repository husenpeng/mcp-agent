// @vitest-environment jsdom
/** The sparkline and meter primitives of the monitor card. */
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Meter } from '../src/client/Meter.tsx'
import { Sparkline, sparkPaths } from '../src/client/Sparkline.tsx'

afterEach(cleanup)

describe('sparkPaths', () => {
  it('draws a flat line for no values', () => {
    expect(sparkPaths([])).toEqual({
      line: 'M0.00 30.00',
      area: 'M0.00 30.00 L0.00 30 L0 30 Z',
    })
  })

  it('draws a single value across the full width', () => {
    expect(sparkPaths([0.5])).toEqual({
      line: 'M0.00 15.00',
      area: 'M0.00 15.00 L0.00 30 L0 30 Z',
    })
  })

  it('spreads several values and clamps out-of-range input', () => {
    const { line, area } = sparkPaths([0, 2, -1])
    expect(line).toBe('M0.00 30.00 L50.00 0.00 L100.00 30.00')
    expect(area.endsWith('L100.00 30 L0 30 Z')).toBe(true)
  })

  it('treats a non-finite value as zero', () => {
    expect(sparkPaths([Number.NaN]).line).toBe('M0.00 30.00')
  })
})

describe('Sparkline', () => {
  it('renders a decorative svg with the series paths', () => {
    const { container } = render(<Sparkline values={[0.2, 0.8]} className="series" />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(svg?.getAttribute('class')).toBe('series')
    expect(container.querySelectorAll('path')).toHaveLength(2)
  })
})

describe('Meter', () => {
  it('fills the rail by the clamped ratio', () => {
    const { container } = render(<Meter value={0.42} tone="memory" />)
    const fill = container.querySelector('[data-tone]')?.firstElementChild as HTMLElement
    expect(parseFloat(fill.style.width)).toBeCloseTo(42)
    expect(container.firstElementChild?.getAttribute('data-tone')).toBe('memory')
  })

  it.each([[2, 100], [-1, 0], [Number.NaN, 0]])('clamps %d to %s%%', (value, width) => {
    const { container } = render(<Meter value={value} tone="cpu" />)
    const fill = container.querySelector('[data-tone]')?.firstElementChild as HTMLElement
    expect(parseFloat(fill.style.width)).toBeCloseTo(width)
  })
})
