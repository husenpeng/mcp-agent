// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { useLiveNow } from '../src/client/use-live-now.ts'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

/** Probe that prints the hook's current reading. */
function Probe({ active }: { readonly active: boolean }): React.ReactNode {
  return <span>{useLiveNow(active)}</span>
}

describe('live clock', () => {
  it('ticks every second while active and stops when idle', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
    const { container, rerender } = render(<Probe active />)
    expect(container.textContent).toBe('1000000')
    act(() => { vi.advanceTimersByTime(2_000) })
    expect(container.textContent).toBe('1002000')
    // A run that settled stops the clock instead of re-rendering forever.
    rerender(<Probe active={false} />)
    act(() => { vi.advanceTimersByTime(5_000) })
    expect(container.textContent).toBe('1002000')
    // A newly live run reads the current time at once, not the frozen one.
    rerender(<Probe active />)
    act(() => { vi.advanceTimersByTime(1_000) })
    expect(container.textContent).toBe('1008000')
  })
})
