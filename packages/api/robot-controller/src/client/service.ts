/**
 * The `ctx.robotRuns` client service: one reconnecting `robot.watch` stream
 * feeding the registry snapshot, plus RPC passthroughs for specification
 * publication, instantiation, rebinding, and run control.
 * @module @tomato/api-robot-controller/client/service
 */

import { Service, type Context } from '@tomato/cordis'
import { RemoteStreamCarrierError, type ClientRemote } from '@tomato/api-gateway/client'
import type { RemoteResult } from '@tomato/typert-protocol'
import type {
  Robot, RobotCancelRequest, RobotCapabilitiesRequest, RobotCapabilityCatalog, RobotCorrectRequest, RobotHireRequest,
  RobotInstantiateRequest, RobotInterruptRequest, RobotPublishRequest, RobotRebindRequest, RobotRunsRequest, RobotSnapshotFrame,
  RobotSpecRevision, RobotStartRequest, Run,
} from '../types.ts'
import type { RobotRunsModel, RobotRunsSource } from './model.ts'

/** The generated `robot` namespace face the service drives. */
export interface RobotRemote {
  /**
   * Open one registry snapshot generation.
   * @param signal - generation cancellation.
   * @returns the whole-set frame sequence of one generation.
   */
  watch(signal?: AbortSignal): AsyncIterable<RobotSnapshotFrame>
  /**
   * Publish one specification revision.
   * @param request - complete specification and the revision it supersedes.
   * @returns the published revision, or the business/transport failure.
   */
  publish(request: RobotPublishRequest): Promise<RemoteResult<RobotSpecRevision>>
  /**
   * Instantiate a robot bound to one published revision.
   * @param request - exact specification revision.
   * @returns the new robot, or the business/transport failure.
   */
  instantiate(request: RobotInstantiateRequest): Promise<RemoteResult<Robot>>
  /**
   * Publish and instantiate a user-owned copy of one template.
   * @param request - template, copy locale, and optional name.
   * @returns the new robot, or the business/transport failure.
   */
  hire(request: RobotHireRequest): Promise<RemoteResult<Robot>>
  /**
   * Bind a robot to a newer revision.
   * @param request - robot and the revision later runs should use.
   * @returns the rebound robot, or the business/transport failure.
   */
  rebind(request: RobotRebindRequest): Promise<RemoteResult<Robot>>
  /**
   * Accept one manual run.
   * @param request - robot and the input message.
   * @returns the accepted run, or the business/transport failure.
   */
  start(request: RobotStartRequest): Promise<RemoteResult<Run>>
  /**
   * Cancel one run.
   * @param request - run to cancel.
   * @returns settlement, or the business/transport failure.
   */
  cancel(request: RobotCancelRequest): Promise<RemoteResult<void>>
  /**
   * Pause one executing run for a human correction.
   * @param request - run to pause.
   * @returns settlement, or the business/transport failure.
   */
  interrupt(request: RobotInterruptRequest): Promise<RemoteResult<void>>
  /**
   * Deliver one correction into an executing run.
   * @param request - run and the correction text.
   * @returns settlement, or the business/transport failure.
   */
  correct(request: RobotCorrectRequest): Promise<RemoteResult<void>>
  /**
   * List one robot's runs.
   * @param request - robot whose runs to read.
   * @returns the runs, or the business/transport failure.
   */
  runs(request: RobotRunsRequest): Promise<RemoteResult<readonly Run[]>>
  /**
   * List the local values the specification editor offers as choices.
   * @param request - Workspace whose project skills apply.
   * @returns the catalog, or the business/transport failure.
   */
  capabilities(request: RobotCapabilitiesRequest): Promise<RemoteResult<RobotCapabilityCatalog>>
}

/** Remote faces the service drives: the Gateway stream factory and the `robot` namespace. */
export interface RobotRunsRemote {
  readonly $stream: ClientRemote['$stream']
  readonly robot: RobotRemote
}

/** The client robot service face. */
export interface IRobotRuns {
  /** Registry snapshot state. */
  readonly state: RobotRunsSource
  /**
   * Publish one specification revision.
   * @param request - complete specification and the revision it supersedes.
   * @returns the published revision, or the business/transport failure.
   */
  publish(request: RobotPublishRequest): Promise<RemoteResult<RobotSpecRevision>>
  /**
   * Instantiate a robot bound to one published revision.
   * @param request - exact specification revision.
   * @returns the new robot, or the business/transport failure.
   */
  instantiate(request: RobotInstantiateRequest): Promise<RemoteResult<Robot>>
  /**
   * Publish and instantiate a user-owned copy of one template.
   * @param request - template, copy locale, and optional name.
   * @returns the new robot, or the business/transport failure.
   */
  hire(request: RobotHireRequest): Promise<RemoteResult<Robot>>
  /**
   * Bind a robot to a newer revision.
   * @param request - robot and the revision later runs should use.
   * @returns the rebound robot, or the business/transport failure.
   */
  rebind(request: RobotRebindRequest): Promise<RemoteResult<Robot>>
  /**
   * Accept one manual run.
   * @param request - robot and the input message.
   * @returns the accepted run, or the business/transport failure.
   */
  start(request: RobotStartRequest): Promise<RemoteResult<Run>>
  /**
   * Cancel one run.
   * @param request - run to cancel.
   * @returns settlement, or the business/transport failure.
   */
  cancel(request: RobotCancelRequest): Promise<RemoteResult<void>>
  /**
   * Pause one executing run for a human correction.
   * @param request - run to pause.
   * @returns settlement, or the business/transport failure.
   */
  interrupt(request: RobotInterruptRequest): Promise<RemoteResult<void>>
  /**
   * Deliver one correction into an executing run.
   * @param request - run and the correction text.
   * @returns settlement, or the business/transport failure.
   */
  correct(request: RobotCorrectRequest): Promise<RemoteResult<void>>
  /**
   * List one robot's runs.
   * @param request - robot whose runs to read.
   * @returns the runs, or the business/transport failure.
   */
  runs(request: RobotRunsRequest): Promise<RemoteResult<readonly Run[]>>
  /**
   * List the local values the specification editor offers as choices.
   * @param request - Workspace whose project skills apply.
   * @returns the catalog, or the business/transport failure.
   */
  capabilities(request: RobotCapabilitiesRequest): Promise<RemoteResult<RobotCapabilityCatalog>>
}

declare module '@tomato/cordis' {
  interface Context {
    /** React-free client robot registry and control. */
    robotRuns: IRobotRuns
  }
}

/** Owns the registry snapshot stream and the RPC passthroughs. */
export class ClientRobotRuns extends Service implements IRobotRuns {
  readonly state: RobotRunsSource

  /**
   * @param ctx - client root Context.
   * @param remote - the Gateway stream factory plus the generated `robot` namespace, both resolved by the caller.
   * @param model - shared client robot model.
   */
  constructor(
    ctx: Context,
    private readonly remote: RobotRunsRemote,
    model: RobotRunsModel,
  ) {
    super(ctx, 'robotRuns')
    this.state = model
    const name = 'robot registry'
    const stream = remote.$stream<RobotSnapshotFrame>({
      name,
      open: signal => remote.robot.watch(signal),
      // The registry has no natural end while watched: an end after the first
      // frame is a carrier interruption (a Host reload closes the generation)
      // and the next generation's whole set loses nothing.
      ended: accepted => accepted
        ? new RemoteStreamCarrierError(`${name} ended before release`)
        : new Error(`${name} ended before its first frame`),
    })
    ctx.effect(() => () => stream.dispose(), 'robot-controller.client.registry')
    void (async () => {
      try {
        for await (const item of stream) {
          model.replaced(item.value)
          item.accept()
        }
      } catch {
        // A terminal stream failure keeps the last whole frame; a reconnect
        // replaces it with the next generation's truth.
      }
    })()
  }

  publish(request: RobotPublishRequest): Promise<RemoteResult<RobotSpecRevision>> {
    return this.remote.robot.publish(request)
  }

  instantiate(request: RobotInstantiateRequest): Promise<RemoteResult<Robot>> {
    return this.remote.robot.instantiate(request)
  }

  rebind(request: RobotRebindRequest): Promise<RemoteResult<Robot>> {
    return this.remote.robot.rebind(request)
  }

  hire(request: RobotHireRequest): Promise<RemoteResult<Robot>> {
    return this.remote.robot.hire(request)
  }

  start(request: RobotStartRequest): Promise<RemoteResult<Run>> {
    return this.remote.robot.start(request)
  }

  cancel(request: RobotCancelRequest): Promise<RemoteResult<void>> {
    return this.remote.robot.cancel(request)
  }

  interrupt(request: RobotInterruptRequest): Promise<RemoteResult<void>> {
    return this.remote.robot.interrupt(request)
  }

  correct(request: RobotCorrectRequest): Promise<RemoteResult<void>> {
    return this.remote.robot.correct(request)
  }

  runs(request: RobotRunsRequest): Promise<RemoteResult<readonly Run[]>> {
    return this.remote.robot.runs(request)
  }

  /**
   * List the local values the specification editor offers as choices.
   * @param request - Workspace whose project skills apply.
   * @returns the catalog, or the business/transport failure.
   */
  capabilities(request: RobotCapabilitiesRequest): Promise<RemoteResult<RobotCapabilityCatalog>> {
    return this.remote.robot.capabilities(request)
  }
}
