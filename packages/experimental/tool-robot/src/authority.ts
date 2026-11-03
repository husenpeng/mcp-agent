/** Execution-time authority checks for the model-facing robot creation tool. */

import type { Context } from '@tomato/cordis'
import type { Agent } from '@tomato/agent'
import { HarnessError } from '@tomato/llm'
import type { SessionEvent, SessionSeq } from '@tomato/session'
import type { ToolRunContext } from '@tomato/tools'

/** The calling agent plus the immutable event cut and open-turn start seq used for authority checks. */
export interface RobotToolExecution {
  readonly agent: Agent
  readonly events: readonly SessionEvent[]
  readonly openTurnStartSeq: SessionSeq
}

/** Throw one structured tool-policy failure. */
function reject(message: string, code = 'ROBOT_TOOL_AUTHORITY_REQUIRED'): never {
  throw new HarnessError(message, code)
}

/**
 * Resolve and authenticate the calling agent and its driver boundary.
 * @param ctx - Context carrying the live agent registry.
 * @param exec - Tool execution metadata supplied by the registry.
 * @returns the authenticated agent, immutable event cut, and open-turn boundary.
 */
export function robotToolExecution(ctx: Context, exec: ToolRunContext): RobotToolExecution {
  const agent = exec.agent
  if (agent === undefined) {
    return reject('robot creation requires a calling agent', 'ROBOT_TOOL_AGENT_REQUIRED')
  }
  if (ctx.agents.get(agent.id) !== agent || agent.status !== 'running'
    || ctx.agents.currentInitiator() !== agent) {
    return reject(
      'robot creation requires the exact live calling agent inside its active driver',
      'ROBOT_TOOL_DRIVER_REQUIRED',
    )
  }
  // oxlint-disable-next-line typescript/no-deprecated -- Existing Session history read; migration deferred.
  const events = agent.session.snapshotEvents()
  const boundary = ctx.agents.turnBoundaryOf(agent.session)
  if (boundary.openTurnStartSeq === null) {
    reject('robot creation requires an open model turn', 'ROBOT_TOOL_DRIVER_REQUIRED')
  }
  return { agent, events, openTurnStartSeq: boundary.openTurnStartSeq }
}

/** Whether the captured open turn contains a host-attested human message. */
function hasDirectHumanInput(ctx: Context, execution: RobotToolExecution): boolean {
  if (!ctx.agents.roots().includes(execution.agent)) return false
  for (let seq = execution.openTurnStartSeq + 1; seq < execution.events.length; seq += 1) {
    const event = execution.events[seq]
    if (event !== undefined && event.type === 'user/message' && event.data.source.kind === 'user') return true
  }
  return false
}

/**
 * Require a human request accepted by a runtime root agent in the open turn, so
 * no unattended or delegated turn can create robots on its own.
 * @param ctx - Context carrying the live agent graph.
 * @param execution - Authenticated current tool execution.
 */
export function requireDirectHuman(ctx: Context, execution: RobotToolExecution): void {
  if (hasDirectHumanInput(ctx, execution)) return
  reject('robot creation requires a direct human turn on a top-level agent')
}
