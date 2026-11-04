/** Browser-stored choice of whether the run detail shows tool names and raw arguments. */

const STORAGE_KEY = 'tomato.robot.run.technical'

/**
 * Read the stored technical-detail choice.
 * @returns whether the previous session chose to show technical detail; `false` by default.
 */
export function readTechnicalDetail(): boolean {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) === '1'
  } catch {
    // Storage can be unavailable (sandboxed frame or disabled cookies); the
    // choice then stays in memory for this page.
    return false
  }
}

/**
 * Remember the technical-detail choice for later visits.
 * @param value - whether technical detail should be shown.
 */
export function writeTechnicalDetail(value: boolean): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, value ? '1' : '0')
  } catch {
    // Same unavailable-storage case as the read; the current page still honors the choice.
  }
}
