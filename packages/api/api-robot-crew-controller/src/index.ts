/**
 * Host crew Remote owner: streams the crew roster as whole frames and exposes
 * specification publication, run start, cancellation, and flow-ledger reads
 * over the generated `crew` namespace. Every read is a projection of
 * `ctx.crews`; the controller holds no state of its own.
 * @module @tomato/api-robot-crew-controller
 */

import type { Context } from '@tomato/cordis'
import type {} from '@tomato/experimental-robot-crew'
import { Remote, RemoteError, TypertRemoteService } from '@tomato/typert-protocol'
import type {
  CrewCancelRequest, CrewEntriesRequest, CrewEntry, CrewPublishRequest, CrewRevisionRequest, CrewRun, CrewRunsRequest,
  CrewSnapshotFrame, CrewSpecIssue, CrewSpecRef, CrewSpecRevision, CrewStartRequest,
} from './types.ts'

export type * from './types.ts'

declare module '@tomato/cordis' {
  interface Context {
    /** Host crew Remote namespace owner. */
    crewController: CrewController
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Read the field issues of a provider's specification rejection, recognized by
 * name rather than `instanceof` so a provider loaded from another package copy
 * is still reported as `crew/spec-invalid`.
 * @param error - value a provider's `publish` rejected with.
 * @returns the issues, or `undefined` when the error is not a specification rejection.
 */
function specIssuesOf(error: unknown): readonly CrewSpecIssue[] | undefined {
  if (!(error instanceof Error) || error.name !== 'CrewSpecValidationError' || !('issues' in error)) return undefined
  return Array.isArray(error.issues) ? error.issues : undefined
}

function refId(ref: CrewSpecRef): string {
  return `${ref.spec}@${ref.revision}`
}

/** Host service backing the generated `ctx.remote.crew` namespace. */
export class CrewController extends TypertRemoteService {
  static inject = ['crews', 'typert']

  /** @param ctx - Host context carrying the crew registry. */
  constructor(ctx: Context) {
    super(ctx, 'crewController', { namespace: 'crew' })
  }

  /**
   * List the latest published revision of every crew.
   * @returns latest revisions in publication order.
   */
  @Remote('specs')
  specs(): Promise<readonly CrewSpecRevision[]> {
    return this.ctx.crews.specs()
  }

  /**
   * Read one published revision.
   * @param request - exact revision.
   * @returns the revision.
   * @throws RemoteError `crew/not-found` when the revision was never published.
   */
  @Remote('revision')
  async revision(request: CrewRevisionRequest): Promise<CrewSpecRevision> {
    const revision = await this.ctx.crews.revision(request.ref)
    if (revision === undefined) throw this.missing(refId(request.ref))
    return revision
  }

  /**
   * Validate and publish one specification revision.
   * @param request - complete specification and the revision it supersedes.
   * @returns the immutable published revision.
   * @throws RemoteError `crew/spec-invalid` with every field issue, or
   *   `crew/conflict` when the publication conflicts with existing records.
   */
  @Remote('publish')
  async publish(request: CrewPublishRequest): Promise<CrewSpecRevision> {
    try {
      return await this.ctx.crews.publish(request.spec, request.previous)
    } catch (error: unknown) {
      const issues = specIssuesOf(error)
      if (issues !== undefined) throw new RemoteError('crew/spec-invalid', messageOf(error), { issues: [...issues] })
      throw new RemoteError('crew/conflict', messageOf(error), { message: messageOf(error) })
    }
  }

  /**
   * Accept one run for a published crew revision.
   * @param request - revision and goal message.
   * @returns the accepted run.
   * @throws RemoteError `crew/not-found` for an unknown revision, or
   *   `crew/conflict` when the run cannot be accepted.
   */
  @Remote('start')
  async start(request: CrewStartRequest): Promise<CrewRun> {
    const revision = await this.ctx.crews.revision(request.ref)
    if (revision === undefined) throw this.missing(refId(request.ref))
    try {
      return await this.ctx.crews.start(request.ref, { message: request.message })
    } catch (error: unknown) {
      throw new RemoteError('crew/conflict', messageOf(error), { message: messageOf(error) })
    }
  }

  /**
   * Cancel a run cooperatively.
   * @param request - run to cancel.
   * @returns nothing after the cancellation is recorded.
   * @throws RemoteError `crew/not-found` for an unknown run.
   */
  @Remote('cancel')
  async cancel(request: CrewCancelRequest): Promise<void> {
    const run = await this.ctx.crews.run(request.runId)
    if (run === undefined) throw this.missing(String(request.runId))
    await this.ctx.crews.cancel(request.runId)
  }

  /**
   * List runs.
   * @param request - optional crew specification filter.
   * @returns runs in acceptance order.
   */
  @Remote('runs')
  runs(request: CrewRunsRequest): Promise<readonly CrewRun[]> {
    return this.ctx.crews.runs(request.spec)
  }

  /**
   * Read one run's complete flow ledger.
   * @param request - run whose ledger to read.
   * @returns entries in sequence order.
   * @throws RemoteError `crew/not-found` for an unknown run.
   */
  @Remote('entries')
  async entries(request: CrewEntriesRequest): Promise<readonly CrewEntry[]> {
    const stored = await this.ctx.crews.run(request.runId)
    if (stored === undefined) throw this.missing(String(request.runId))
    return this.ctx.crews.entries(request.runId)
  }

  /**
   * Stream whole roster frames: one on open, then one after each crew change.
   * The stream has no natural end; the carrier closes it.
   * @param signal - cancellation owned by the Remote stream carrier.
   * @returns the snapshot frames.
   */
  @Remote({ mode: 'stream' })
  watch(signal: AbortSignal): AsyncIterable<CrewSnapshotFrame> {
    return this.snapshots(signal)
  }

  private missing(id: string): RemoteError {
    return new RemoteError('crew/not-found', `unknown crew record ${id}`, { id })
  }

  private async readSnapshot(): Promise<CrewSnapshotFrame> {
    const [specs, runs] = await Promise.all([this.ctx.crews.specs(), this.ctx.crews.runs()])
    return { specs, runs }
  }

  private async *snapshots(signal: AbortSignal): AsyncGenerator<CrewSnapshotFrame> {
    while (!signal.aborted) {
      let wake!: () => void
      const changed = new Promise<void>((resolve) => { wake = resolve })
      const off = this.ctx.on('crew/changed', () => { wake() })
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

export default CrewController
