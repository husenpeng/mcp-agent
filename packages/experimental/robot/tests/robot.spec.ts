import { Context } from '@tomato/cordis'
import { describe, expect, it } from 'vitest'
import type { SessionId } from '@tomato/session'
import Robots, { isTerminalRunState } from '../src/index.ts'
import type {
  ActiveRunState, Robot, RobotId, RobotSpec, RobotSpecRef, RobotSpecRevision, Run, RunId, RunInput, RunOutcome, RunState,
} from '../src/index.ts'

const unreachable = (): never => {
  throw new Error('the service definition has no implementation')
}

class StubRobots extends Robots {
  override publish(_spec: RobotSpec, _previous?: RobotSpecRef): Promise<RobotSpecRevision> {
    return unreachable()
  }

  override revision(_ref: RobotSpecRef): Promise<RobotSpecRevision | undefined> {
    return unreachable()
  }

  override specs(): Promise<readonly RobotSpecRevision[]> {
    return unreachable()
  }

  override instantiate(_ref: RobotSpecRef): Promise<Robot> {
    return unreachable()
  }

  override rebind(_robot: RobotId, _ref: RobotSpecRef): Promise<Robot> {
    return unreachable()
  }

  override robot(_id: RobotId): Promise<Robot | undefined> {
    return unreachable()
  }

  override robots(): Promise<readonly Robot[]> {
    return unreachable()
  }

  override start(_robot: RobotId, _input: RunInput): Promise<Run> {
    return unreachable()
  }

  override cancel(_run: RunId): Promise<void> {
    return unreachable()
  }

  override advance(_run: RunId, _state: ActiveRunState): Promise<void> {
    return unreachable()
  }

  override finish(_run: RunId, _outcome: RunOutcome): Promise<void> {
    return unreachable()
  }

  override attachSession(_run: RunId, _session: SessionId): Promise<void> {
    return unreachable()
  }

  override run(_id: RunId): Promise<Run | undefined> {
    return unreachable()
  }

  override runs(_robot: RobotId): Promise<readonly Run[]> {
    return unreachable()
  }
}

describe('robot service definition', () => {
  it('registers a provider as ctx.robots', async () => {
    const ctx = new Context()
    try {
      await ctx.plugin(StubRobots)
      expect(ctx.robots).toBeInstanceOf(StubRobots)
    } finally {
      await ctx.fiber.dispose()
    }
  })
})

describe('isTerminalRunState', () => {
  it('reports settled states as terminal', () => {
    const settled: readonly RunState[] = ['succeeded', 'failed', 'cancelled', 'timed_out']
    for (const state of settled) expect(isTerminalRunState(state)).toBe(true)
  })

  it('reports states that can still change as non-terminal', () => {
    const active: readonly RunState[] = ['queued', 'leased', 'running', 'waiting', 'finalizing']
    for (const state of active) expect(isTerminalRunState(state)).toBe(false)
  })
})
