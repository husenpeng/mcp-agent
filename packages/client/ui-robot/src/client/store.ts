/** Robot page selection shared by the sidebar roster and the main page. */
import { defineStore, type EngineStoreHandle } from '@tomato/client-store'
import type { RobotId, RunId } from '@tomato/api-robot-controller/client'

/** Which robot page view is showing. */
export type RobotPageView = 'roster' | 'config'

/** Robot page selection state. */
export interface RobotPageState {
  /** The roster or the specification editor. */
  view: RobotPageView
  /** Robot the page shows or edits, when one is selected. */
  robotId?: RobotId | undefined
  /** Run whose conversation is open, when one is selected. */
  runId?: RunId | undefined
}

type RobotPageActions = {
  openRoster: (draft: RobotPageState) => void
  selectRobot: (draft: RobotPageState, robotId: RobotId) => void
  configure: (draft: RobotPageState, robotId?: RobotId) => void
  openRun: (draft: RobotPageState, runId: RunId) => void
  back: (draft: RobotPageState) => void
}

/** Handle of the page selection store the slot renderer projects as `useRobotPage`. */
export type RobotPageStore = EngineStoreHandle<RobotPageState, RobotPageActions>

/** Live page selection instance: snapshot readers plus the bound actions. */
export type RobotPageInstance = ReturnType<RobotPageStore['create']>

/**
 * Create robot page selection before the first page render.
 * @returns the registration-owned selection store handle.
 */
export function createRobotPageStore(): RobotPageStore {
  return defineStore({
    init: (): RobotPageState => ({ view: 'roster' }),
    actions: {
      openRoster: (draft) => {
        draft.view = 'roster'
        draft.runId = undefined
      },
      selectRobot: (draft, robotId) => {
        draft.view = 'roster'
        draft.robotId = robotId
        draft.runId = undefined
      },
      configure: (draft, robotId) => {
        draft.view = 'config'
        draft.robotId = robotId
        draft.runId = undefined
      },
      openRun: (draft, runId) => {
        draft.runId = runId
      },
      back: (draft) => {
        draft.view = 'roster'
        draft.runId = undefined
      },
    },
  })
}
