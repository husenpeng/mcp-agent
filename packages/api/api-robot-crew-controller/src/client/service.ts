/**
 * The `ctx.crewRuns` client service: one reconnecting `crew.watch` stream
 * feeding the roster snapshot, plus RPC passthroughs for publication, run
 * start, cancellation, and flow-ledger reads.
 * @module @tomato/api-robot-crew-controller/client/service
 */

import { Service, type Context } from '@tomato/cordis'
import { RemoteStreamCarrierError, type ClientRemote } from '@tomato/api-gateway/client'
import type { RemoteResult } from '@tomato/typert-protocol'
import type {
  CrewCancelRequest, CrewEntriesRequest, CrewEntry, CrewPublishRequest, CrewRevisionRequest, CrewRun, CrewRunsRequest,
  CrewSnapshotFrame, CrewSpecRevision, CrewStartRequest,
} from '../types.ts'
import type { CrewRunsModel, CrewRunsSource } from './model.ts'

/** The generated `crew` namespace face the service drives. */
export interface CrewRemote {
  /**
   * Open one roster snapshot generation.
   * @param signal - generation cancellation.
   * @returns the whole-set frame sequence of one generation.
   */
  watch(signal?: AbortSignal): AsyncIterable<CrewSnapshotFrame>
  /**
   * Read one published revision.
   * @param request - exact revision.
   * @returns the revision, or the business/transport failure.
   */
  revision(request: CrewRevisionRequest): Promise<RemoteResult<CrewSpecRevision>>
  /**
   * Publish one specification revision.
   * @param request - complete specification and the revision it supersedes.
   * @returns the published revision, or the business/transport failure.
   */
  publish(request: CrewPublishRequest): Promise<RemoteResult<CrewSpecRevision>>
  /**
   * Accept one run.
   * @param request - revision and goal message.
   * @returns the accepted run, or the business/transport failure.
   */
  start(request: CrewStartRequest): Promise<RemoteResult<CrewRun>>
  /**
   * Cancel one run.
   * @param request - run to cancel.
   * @returns settlement, or the business/transport failure.
   */
  cancel(request: CrewCancelRequest): Promise<RemoteResult<void>>
  /**
   * List runs.
   * @param request - optional crew specification filter.
   * @returns runs, or the business/transport failure.
   */
  runs(request: CrewRunsRequest): Promise<RemoteResult<readonly CrewRun[]>>
  /**
   * Read one run's complete flow ledger.
   * @param request - run whose ledger to read.
   * @returns entries, or the business/transport failure.
   */
  entries(request: CrewEntriesRequest): Promise<RemoteResult<readonly CrewEntry[]>>
}

/** Remote faces the service drives: the Gateway stream factory and the `crew` namespace. */
export interface CrewRunsRemote {
  readonly $stream: ClientRemote['$stream']
  readonly crew: CrewRemote
}

/** The client crew service face. */
export interface ICrewRuns {
  /** Roster snapshot state. */
  readonly state: CrewRunsSource
  /**
   * Read one published revision.
   * @param request - exact revision.
   * @returns the revision, or the business/transport failure.
   */
  revision(request: CrewRevisionRequest): Promise<RemoteResult<CrewSpecRevision>>
  /**
   * Publish one specification revision.
   * @param request - complete specification and the revision it supersedes.
   * @returns the published revision, or the business/transport failure.
   */
  publish(request: CrewPublishRequest): Promise<RemoteResult<CrewSpecRevision>>
  /**
   * Accept one run.
   * @param request - revision and goal message.
   * @returns the accepted run, or the business/transport failure.
   */
  start(request: CrewStartRequest): Promise<RemoteResult<CrewRun>>
  /**
   * Cancel one run.
   * @param request - run to cancel.
   * @returns settlement, or the business/transport failure.
   */
  cancel(request: CrewCancelRequest): Promise<RemoteResult<void>>
  /**
   * Read one run's complete flow ledger.
   * @param request - run whose ledger to read.
   * @returns entries, or the business/transport failure.
   */
  entries(request: CrewEntriesRequest): Promise<RemoteResult<readonly CrewEntry[]>>
}

declare module '@tomato/cordis' {
  interface Context {
    /** Client crew roster and control. */
    crewRuns: ICrewRuns
  }
}

/** Owns the roster snapshot stream and the RPC passthroughs. */
export class ClientCrewRuns extends Service implements ICrewRuns {
  readonly state: CrewRunsSource

  /**
   * @param ctx - client root Context.
   * @param remote - the Gateway stream factory plus the generated `crew` namespace.
   * @param model - shared client crew model.
   */
  constructor(
    ctx: Context,
    private readonly remote: CrewRunsRemote,
    model: CrewRunsModel,
  ) {
    super(ctx, 'crewRuns')
    this.state = model
    const name = 'crew roster'
    const stream = remote.$stream<CrewSnapshotFrame>({
      name,
      open: signal => remote.crew.watch(signal),
      ended: accepted => accepted
        ? new RemoteStreamCarrierError(`${name} ended before release`)
        : new Error(`${name} ended before its first frame`),
    })
    ctx.effect(() => () => stream.dispose(), 'crew-controller.client.roster')
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

  revision(request: CrewRevisionRequest): Promise<RemoteResult<CrewSpecRevision>> {
    return this.remote.crew.revision(request)
  }

  publish(request: CrewPublishRequest): Promise<RemoteResult<CrewSpecRevision>> {
    return this.remote.crew.publish(request)
  }

  start(request: CrewStartRequest): Promise<RemoteResult<CrewRun>> {
    return this.remote.crew.start(request)
  }

  cancel(request: CrewCancelRequest): Promise<RemoteResult<void>> {
    return this.remote.crew.cancel(request)
  }

  entries(request: CrewEntriesRequest): Promise<RemoteResult<readonly CrewEntry[]>> {
    return this.remote.crew.entries(request)
  }
}
