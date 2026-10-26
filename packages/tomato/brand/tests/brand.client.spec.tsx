// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { TomatoBrandName, TomatoMark, TomatoSidebarMark } from '../src/client/Brand.tsx'

afterEach(cleanup)

describe('tomato brand', () => {
  it('renders each mark with a unique theme gradient id', () => {
    const { container } = render(<><TomatoMark size={24} /><TomatoSidebarMark size={20} /></>)
    const marks = [...container.querySelectorAll('svg')]
    expect(marks).toHaveLength(2)
    for (const mark of marks) expect(mark.getAttribute('aria-hidden')).toBe('true')
    const ids = [...container.querySelectorAll('linearGradient')].map(gradient => gradient.id)
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
    for (const [index, mark] of marks.entries()) {
      expect(mark.querySelector('path')?.getAttribute('fill')).toBe(`url(#${ids[index]!})`)
    }
  })

  it('colors both stops through the theme brand-mark variables', () => {
    const css = readFileSync('packages/tomato/brand/src/client/Brand.module.css', 'utf8')
    expect(css).toContain('stop-color: var(--dsw-brand-mark-start')
    expect(css).toContain('stop-color: var(--dsw-brand-mark-end')
  })

  it('keeps the product name as fixed, non-translatable text', () => {
    const { getByText } = render(<TomatoBrandName />)
    expect(getByText('Tomato AI').getAttribute('translate')).toBe('no')
  })
})
