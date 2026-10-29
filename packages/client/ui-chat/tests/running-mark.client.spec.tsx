// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { RunningMark } from '../src/client/chat/RunningMark.tsx'

afterEach(cleanup)

describe('RunningMark', () => {
  it('renders one decorative Tomato mark without inline styles', () => {
    const view = render(<RunningMark />)
    const seat = view.container.firstElementChild!
    expect(seat.tagName).toBe('SPAN')
    expect(seat.getAttribute('aria-hidden')).toBe('true')
    const svg = seat.querySelector('svg')!
    expect(svg.getAttribute('viewBox')).toBe('3.9 4.4 56.2 56.2')
    expect(svg.querySelectorAll('path')).toHaveLength(1)
    expect(svg.querySelector('path')?.getAttribute('fill')).toBe('currentColor')
    expect(view.container.querySelector('animate')).toBeNull()
    expect(view.container.querySelector('[style]')).toBeNull()
  })
})
