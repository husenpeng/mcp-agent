/** A ticking clock for labels that describe a run still in flight. */
import { useEffect, useState } from 'react'

/**
 * Read the current time and re-read it every second while a displayed clock is
 * still moving, so elapsed labels do not freeze between unrelated renders.
 * @param active - whether any label on screen measures a live run.
 * @returns epoch milliseconds of the most recent tick.
 */
export function useLiveNow(active: boolean): number {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (!active) return
    // The first tick refreshes a value captured before the run turned live.
    setNow(Date.now())
    const timer = setInterval(() => { setNow(Date.now()) }, 1_000)
    return () => { clearInterval(timer) }
  }, [active])
  return now
}
