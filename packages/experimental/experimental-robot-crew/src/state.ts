/**
 * Crew run state predicates shared by the provider, the controller, and the
 * client. Pure.
 * @module @tomato/experimental-robot-crew
 */

import type { CrewRunState } from './types.ts'

/** Every terminal crew run state. */
const TERMINAL: ReadonlySet<CrewRunState> = new Set<CrewRunState>([
  'succeeded', 'failed', 'tripped', 'cancelled',
])

/**
 * Whether a run state has no further work.
 * @param state - run state.
 * @returns whether the state is terminal.
 */
export function isTerminalCrewRunState(state: CrewRunState): boolean {
  return TERMINAL.has(state)
}
