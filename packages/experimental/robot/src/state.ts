/**
 * Run-state predicates shared by robot providers and consumers.
 * @module @tomato/experimental-robot
 */

import type { RunState } from './types.ts'

const TERMINAL_RUN_STATES: ReadonlySet<RunState> = new Set<RunState>(['succeeded', 'failed', 'cancelled', 'timed_out'])

/**
 * Whether a run can no longer change state.
 * @param state - run state to test.
 * @returns `true` for `succeeded`, `failed`, `cancelled`, and `timed_out`.
 */
export function isTerminalRunState(state: RunState): boolean {
  return TERMINAL_RUN_STATES.has(state)
}
