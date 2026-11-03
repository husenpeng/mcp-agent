/**
 * Service Definition for the `ctx.robots` capability seam: specification publication,
 * robot instantiation, and run control. Execution, persistence, and transport belong
 * to the installed provider.
 * @module @tomato/experimental-robot
 */

import { Context, Service } from '@tomato/cordis'
import type { SessionId } from '@tomato/session/types'
import type {
  Robot, RobotId, RobotSpec, RobotSpecRef, RobotSpecRevision, Run, RunId, RunInput, RunOutcome,
} from './types.ts'

export type * from './types.ts'
export { RobotSpecValidationError } from './types.ts'
export { emptyRobotSpec } from './spec.ts'
export type { RobotRunRecord } from './session.ts'
export { isTerminalRunState } from './state.ts'

declare module '@tomato/cordis' {
  interface Context {
    robots: Robots
  }

  interface Events {
    /**
     * A robot registry mutation observers re-read.
     * @param kind - record family that changed: specifications, robots, or runs.
     * @mode emit
     */
    'robot/changed'(kind: 'specs' | 'robots' | 'runs'): void
  }
}

/**
 * Abstract robot domain service. Subclass it, implement every operation, and load the
 * subclass as the provider; it registers as `ctx.robots`.
 *
 * Implementations must honor these semantics:
 * - {@link publish} validates the specification and returns an immutable revision;
 *   a failed validation rejects without allocating an identity.
 * - Revisions are append-only: revision `n + 1` supersedes `n`, and a published
 *   revision never changes.
 * - {@link instantiate} binds one robot to one exact revision; later revisions do not
 *   move an existing robot unless {@link rebind} names the new revision explicitly.
 * - {@link rebind} changes the revision later runs use; a run keeps the revision
 *   it was accepted with.
 * - {@link attachSession} records the Session an executor drives for one run;
 *   the link is write-once and a later different Session is refused.
 * - {@link start} accepts a run only from `idle` and rejects while the robot is
 *   `provisioning`, `paused`, `failed`, or `stopped`.
 * - {@link cancel} is cooperative and settles the run as `cancelled` unless it already
 *   reached a terminal state.
 * - {@link finish} records the executor's terminal state; a terminal run keeps its
 *   existing state.
 */
export abstract class Robots extends Service {
  constructor(ctx: Context) {
    super(ctx, 'robots')
  }

  /**
   * Validate and publish one specification revision.
   * @param spec - complete specification to publish.
   * @param previous - revision this publication supersedes; omitted for a new specification.
   * @returns the immutable published revision.
   * @throws when validation fails or `previous` does not exist.
   */
  abstract publish(spec: RobotSpec, previous?: RobotSpecRef): Promise<RobotSpecRevision>

  /**
   * Read one published revision.
   * @param ref - exact specification revision.
   * @returns the revision, or `undefined` when it was never published.
   */
  abstract revision(ref: RobotSpecRef): Promise<RobotSpecRevision | undefined>

  /**
   * List the latest published revision of every specification.
   * @returns latest revisions in publication order.
   */
  abstract specs(): Promise<readonly RobotSpecRevision[]>

  /**
   * Instantiate a robot bound to one published revision.
   * @param ref - exact specification revision.
   * @returns the new provisioned robot in `idle` state.
   * @throws when the revision does not exist or a dependency is unavailable.
   */
  abstract instantiate(ref: RobotSpecRef): Promise<Robot>

  /**
   * Bind one robot to a newer published revision. Runs already accepted keep
   * the revision they started with; later runs use `ref`.
   * @param robot - robot identity.
   * @param ref - revision to bind.
   * @returns the rebound robot.
   * @throws when the robot or the revision does not exist.
   */
  abstract rebind(robot: RobotId, ref: RobotSpecRef): Promise<Robot>

  /**
   * Read one robot.
   * @param id - robot identity.
   * @returns the robot, or `undefined` when it does not exist.
   */
  abstract robot(id: RobotId): Promise<Robot | undefined>

  /**
   * List every robot.
   * @returns robots in creation order.
   */
  abstract robots(): Promise<readonly Robot[]>

  /**
   * Accept one run for a robot.
   * @param robot - robot identity.
   * @param input - run input.
   * @returns the accepted run.
   * @throws when the robot does not exist or cannot accept a run in its current state.
   */
  abstract start(robot: RobotId, input: RunInput): Promise<Run>

  /**
   * Cancel a run cooperatively.
   * @param run - run identity.
   * @returns nothing after the cancellation is recorded.
   * @throws when the run does not exist.
   */
  abstract cancel(run: RunId): Promise<void>

  /**
   * Settle one run with its executor's outcome.
   * @param run - run identity.
   * @param outcome - terminal state and any output or failure detail.
   * @returns nothing after the outcome is recorded.
   * @throws when the run does not exist.
   */
  abstract finish(run: RunId, outcome: RunOutcome): Promise<void>

  /**
   * Record the Session one run's execution logs to.
   * @param run - run identity.
   * @param session - Session the executor drives for this run.
   * @returns nothing after the link is recorded.
   * @throws when the run does not exist or already names a different Session.
   */
  abstract attachSession(run: RunId, session: SessionId): Promise<void>

  /**
   * Read one run.
   * @param id - run identity.
   * @returns the run, or `undefined` when it does not exist.
   */
  abstract run(id: RunId): Promise<Run | undefined>

  /**
   * List runs owned by one robot.
   * @param robot - robot identity.
   * @returns runs in acceptance order.
   */
  abstract runs(robot: RobotId): Promise<readonly Run[]>
}

export default Robots
