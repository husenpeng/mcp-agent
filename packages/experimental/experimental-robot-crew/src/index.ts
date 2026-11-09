/**
 * Service definition for the `ctx.crews` capability seam: versioned crew
 * specifications, run acceptance, cancellation, and the durable flow ledger.
 * Orchestration, persistence, and transport belong to the installed provider.
 * @module @tomato/experimental-robot-crew
 */

import { Context, Service } from '@tomato/cordis'
import type {
  CrewChangeKind, CrewEntry, CrewRun, CrewRunId, CrewSpec, CrewSpecRevision, CrewSpecRef,
} from './types.ts'

export type * from './types.ts'
export { A2A_PROTOCOL } from './types.ts'
export { CrewSpecValidationError } from './types.ts'
export {
  A2A_MAX_TEXT, a2aSignature, clampText, createEnvelope, isEnvelope, normalizeA2aText,
} from './protocol.ts'
export type { EnvelopeInput } from './protocol.ts'
export {
  CrewLoopGuard, NO_PROGRESS_SIMILARITY, similarity,
} from './guard.ts'
export type { GuardLimits, GuardSnapshot, GuardTrip, GuardVerdict, MessageAdmission } from './guard.ts'
export {
  bound, composeBrief, extractMemory, summarize,
} from './brief.ts'
export type { BriefArtifact, BriefMemory, BriefOptions, ExtractedMemory } from './brief.ts'
export {
  DEFAULT_GUARD, DEFAULT_MEMORY, MAX_NODES, emptyCrewSpec, entryNodes, starterCrewSpec, starterGraph,
  topologicalOrder, validateCrewSpec,
} from './spec.ts'
export type { EmptyCrewInput } from './spec.ts'
export { renderProjectHistory } from './project-history.ts'
export type { ProjectHistoryItem } from './project-history.ts'
export { carriedCount, carryTaskMemory } from './task-memory.ts'
export type { CarriedRun, CarryLimits } from './task-memory.ts'
export { isTerminalCrewRunState } from './state.ts'

declare module '@tomato/cordis' {
  interface Context {
    crews: Crews
  }

  interface Events {
    /**
     * A crew record family observers re-read.
     * @param kind - family that changed: specifications, runs, or ledger entries.
     * @mode emit
     */
    'crew/changed'(kind: CrewChangeKind): void
  }
}

/** One input a run accepts. */
export interface CrewRunInput {
  /** Goal or instruction handed to the first node. */
  readonly message: string
}

/**
 * Abstract crew domain service. Subclass it, implement every operation, and
 * load the subclass as the provider; it registers as `ctx.crews`.
 *
 * Implementations must honor these semantics:
 * - {@link publish} validates the complete specification and returns an
 *   immutable revision; a rejected publication allocates no identity.
 * - Revisions are append-only and never change after publication.
 * - {@link start} accepts a run only for a published revision and returns
 *   before the run executes; observers follow {@link run} and the ledger.
 * - {@link cancel} is cooperative; a terminal run keeps its state.
 * - Ledger sequences are contiguous per run and never rewritten.
 */
export abstract class Crews extends Service {
  constructor(ctx: Context) {
    super(ctx, 'crews')
  }

  /**
   * Validate and publish one crew specification revision.
   * @param spec - complete specification.
   * @param previous - revision this publication supersedes; omitted for a new crew.
   * @returns the immutable published revision.
   */
  abstract publish(spec: CrewSpec, previous?: CrewSpecRef): Promise<CrewSpecRevision>

  /**
   * Read one published revision.
   * @param ref - exact revision.
   * @returns the revision, or `undefined` when it was never published.
   */
  abstract revision(ref: CrewSpecRef): Promise<CrewSpecRevision | undefined>

  /**
   * List the latest revision of every crew.
   * @returns latest revisions in publication order.
   */
  abstract specs(): Promise<readonly CrewSpecRevision[]>

  /**
   * Accept one run.
   * @param ref - published revision to execute.
   * @param input - goal message.
   * @returns the accepted run before execution starts.
   */
  abstract start(ref: CrewSpecRef, input: CrewRunInput): Promise<CrewRun>

  /**
   * Cancel one run cooperatively.
   * @param run - run identity.
   */
  abstract cancel(run: CrewRunId): Promise<void>

  /**
   * Read one run.
   * @param run - run identity.
   * @returns the run, or `undefined` when it does not exist.
   */
  abstract run(run: CrewRunId): Promise<CrewRun | undefined>

  /**
   * List runs.
   * @param spec - restrict to one crew specification; omitted lists every run.
   * @returns runs in acceptance order.
   */
  abstract runs(spec?: CrewSpecRef['spec']): Promise<readonly CrewRun[]>

  /**
   * Read one run's complete flow ledger.
   * @param run - run identity.
   * @returns entries in sequence order.
   */
  abstract entries(run: CrewRunId): Promise<readonly CrewEntry[]>

  /**
   * Append one ledger entry. Providers expose it to the orchestrator and keep
   * the sequence themselves; consumers never choose a sequence number.
   * @param run - run identity.
   * @param entry - entry without its run and sequence.
   * @returns the stored entry.
   */
  abstract append(run: CrewRunId, entry: Omit<CrewEntry, 'run' | 'seq'>): Promise<CrewEntry>
}
