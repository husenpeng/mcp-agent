/**
 * Host robot Remote owner: streams the robot registry as whole frames and
 * exposes specification publication, instantiation, rebinding, and run
 * control over the generated `robot` namespace. Every read is a projection of
 * `ctx.robots`; the controller holds no state of its own.
 * @module @tomato/api-robot-controller
 */

import type { Context } from '@tomato/cordis'
import type {} from '@tomato/experimental-robot'
import { RobotSpecValidationError } from '@tomato/experimental-robot'
import { Remote, RemoteError, TypertRemoteService } from '@tomato/typert-protocol'
import type {
  Robot, RobotCancelRequest, RobotInstantiateRequest, RobotPublishRequest, RobotRebindRequest,
  RobotRevisionRequest, RobotRunsRequest, RobotSnapshotFrame, RobotSpecRef, RobotSpecRevision,
  RobotStartRequest, Run,
} from './types.ts'

export type * from './types.ts'

declare module '@tomato/cordis' {
  interface Context {
    /** Host robot Remote namespace owner. */
    robotController: RobotController
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Host service backing the generated `ctx.remote.robot` namespace. */
export class RobotController extends TypertRemoteService {
  static inject = ['robots', 'typert']

  /** @param ctx - Host context carrying the robot registry. */
  constructor(ctx: Context) {
    super(ctx, 'robotController', { namespace: 'robot' })
  }

  /**
   * List the latest published revision of every specification.
   * @returns latest revisions in publication order.
   */
  @Remote('specs')
  specs(): Promise<readonly RobotSpecRevision[]> {
    return this.ctx.robots.specs()
  }

  /**
   * Read one published revision.
   * @param request - exact specification revision.
   * @returns the revision.
   * @throws RemoteError `robot/not-found` when the revision was never published.
   */
  @Remote('revision')
  async revision(request: RobotRevisionRequest): Promise<RobotSpecRevision> {
    const revision = await this.ctx.robots.revision(request.ref)
    if (revision === undefined) throw this.missing(refId(request.ref))
    return revision
  }

  /**
   * List every robot.
   * @returns robots in creation order.
   */
  @Remote('robots')
  robots(): Promise<readonly Robot[]> {
    return this.ctx.robots.robots()
  }

  /**
   * List the runs of one robot.
   * @param request - robot whose runs to read.
   * @returns runs in acceptance order.
   * @throws RemoteError `robot/not-found` for an unknown robot.
   */
  @Remote('runs')
  async runs(request: RobotRunsRequest): Promise<readonly Run[]> {
    await this.requireRobot(request.robotId)
    return this.ctx.robots.runs(request.robotId)
  }

  /**
   * Validate and publish one specification revision.
   * @param request - complete specification and the revision it supersedes.
   * @returns the immutable published revision.
   * @throws RemoteError `robot/spec-invalid` with every field issue, or
   *   `robot/conflict` when the publication conflicts with existing records.
   */
  @Remote('publish')
  async publish(request: RobotPublishRequest): Promise<RobotSpecRevision> {
    try {
      return await this.ctx.robots.publish(request.spec, request.previous)
    } catch (error: unknown) {
      if (error instanceof RobotSpecValidationError) {
        throw new RemoteError('robot/spec-invalid', error.message, { issues: [...error.issues] })
      }
      throw new RemoteError('robot/conflict', messageOf(error), { message: messageOf(error) })
    }
  }

  /**
   * Instantiate a robot bound to one published revision.
   * @param request - exact specification revision.
   * @returns the new idle robot.
   * @throws RemoteError `robot/not-found` when the revision does not exist.
   */
  @Remote('instantiate')
  async instantiate(request: RobotInstantiateRequest): Promise<Robot> {
    const revision = await this.ctx.robots.revision(request.ref)
    if (revision === undefined) throw this.missing(refId(request.ref))
    return this.ctx.robots.instantiate(request.ref)
  }

  /**
   * Bind one robot to a newer published revision without moving runs in flight.
   * @param request - robot and the revision later runs should use.
   * @returns the rebound robot.
   * @throws RemoteError `robot/not-found` for an unknown robot or revision.
   */
  @Remote('rebind')
  async rebind(request: RobotRebindRequest): Promise<Robot> {
    await this.requireRobot(request.robotId)
    const revision = await this.ctx.robots.revision(request.ref)
    if (revision === undefined) throw this.missing(refId(request.ref))
    return this.ctx.robots.rebind(request.robotId, request.ref)
  }

  /**
   * Accept one run for a robot.
   * @param request - robot and the input message.
   * @returns the accepted run.
   * @throws RemoteError `robot/not-found` for an unknown robot, or
   *   `robot/conflict` while the robot cannot accept a run.
   */
  @Remote('start')
  async start(request: RobotStartRequest): Promise<Run> {
    await this.requireRobot(request.robotId)
    try {
      return await this.ctx.robots.start(request.robotId, { message: request.message })
    } catch (error: unknown) {
      throw new RemoteError('robot/conflict', messageOf(error), { message: messageOf(error) })
    }
  }

  /**
   * Cancel a run cooperatively.
   * @param request - run to cancel.
   * @returns nothing after the cancellation is recorded.
   * @throws RemoteError `robot/not-found` for an unknown run.
   */
  @Remote('cancel')
  async cancel(request: RobotCancelRequest): Promise<void> {
    const run = await this.ctx.robots.run(request.runId)
    if (run === undefined) throw this.missing(String(request.runId))
    await this.ctx.robots.cancel(request.runId)
  }

  /**
   * Stream whole registry frames: one on open, then one after each registry
   * change. The stream has no natural end; the carrier closes it.
   * @param signal - cancellation owned by the Remote stream carrier.
   * @returns the snapshot frames.
   */
  @Remote({ mode: 'stream' })
  watch(signal: AbortSignal): AsyncIterable<RobotSnapshotFrame> {
    return this.snapshots(signal)
  }

  private missing(id: string): RemoteError {
    return new RemoteError('robot/not-found', `unknown robot record ${id}`, { id })
  }

  private async requireRobot(id: Robot['id']): Promise<Robot> {
    const robot = await this.ctx.robots.robot(id)
    if (robot === undefined) throw this.missing(String(id))
    return robot
  }

  private async readSnapshot(): Promise<RobotSnapshotFrame> {
    const [specs, robots] = await Promise.all([this.ctx.robots.specs(), this.ctx.robots.robots()])
    const runs = await Promise.all(robots.map(robot => this.ctx.robots.runs(robot.id)))
    return { specs, robots, runs: runs.flat() }
  }

  private async *snapshots(signal: AbortSignal): AsyncGenerator<RobotSnapshotFrame> {
    while (!signal.aborted) {
      // Install the wake before yielding: a change that lands while the frame
      // is in flight must produce the next frame instead of waiting for one
      // that already happened.
      let wake!: () => void
      const changed = new Promise<void>((resolve) => { wake = resolve })
      const off = this.ctx.on('robot/changed', () => { wake() })
      const abortWake = (): void => { wake() }
      signal.addEventListener('abort', abortWake, { once: true })
      try {
        yield await this.readSnapshot()
        await changed
      } finally {
        off()
        signal.removeEventListener('abort', abortWake)
      }
    }
  }
}

function refId(ref: RobotSpecRef): string {
  return `${ref.spec}@${ref.revision}`
}

export default RobotController
