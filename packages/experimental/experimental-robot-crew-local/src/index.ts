/**
 * Storage-backed crew provider: specification publication, run acceptance,
 * durable flow ledger, and the orchestration executor. Every accepted run is
 * driven here, one Agent per node, until it settles or its guard trips.
 * @module @tomato/experimental-robot-crew-local
 */

import { randomUUID } from 'node:crypto'
import { brandString } from '@tomato/branded'
import { Service } from '@tomato/cordis'
import {
  Crews, CrewSpecValidationError, carryTaskMemory, isTerminalCrewRunState, validateCrewSpec,
} from '@tomato/experimental-robot-crew'
import type {
  BriefMemory, CarriedRun, CrewEntry, CrewRun, CrewRunId, CrewSpec, CrewSpecId, CrewSpecRevision, CrewSpecRef,
} from '@tomato/experimental-robot-crew'
import type { Domain } from '@tomato/storage-domain'
import { deepFreeze } from '@tomato/util-values'
import type {} from '@tomato/workspace'
import { executeCrew } from './execute.ts'
import type { CrewRunPatch } from './execute.ts'
import { crewDomain, entryKey, resumableState, toEntry, toRef, toRevision, toRun } from './storage.ts'
import type { CrewEntryRow, CrewRunRow } from './storage.ts'

/** Runtime specification validation, exported for callers that pre-check. */
export { validateCrewSpec } from '@tomato/experimental-robot-crew'

/** Stable Cordis plugin name. */
export const name = 'robot-crew-local'

/** Host services this provider requires. */
export const inject = ['agentDefaultModel', 'agents', 'storageDomain']

/** Finished runs one new run reads its task memory from. */
const CARRY_RUNS = 5

/** Items kept per memory kind when a new run carries earlier statements. */
const CARRY_ITEMS = 12

/**
 * Storage-backed crew provider. Load it after a storage backend and
 * `@tomato/storage-domain`; it registers as `ctx.crews`, opens the durable
 * `tomato_crew` domain, and executes accepted runs on the Host.
 */
export default class LocalCrews extends Crews {
  static inject = ['agentDefaultModel', 'agents', 'storageDomain']

  private domain!: Domain<typeof crewDomain>
  private chain: Promise<unknown> = Promise.resolve()
  private readonly controllers = new Map<CrewRunId, AbortController>()
  private readonly sequences = new Map<CrewRunId, number>()
  private readonly executions = new Set<Promise<void>>()

  protected async [Service.init](): Promise<void> {
    this.domain = await this.ctx.storageDomain.open(crewDomain)
    // Closing the domain while an executor is still settling would reject its
    // ledger writes; disposal waits for every accepted run first.
    this.ctx.effect(() => () => this.shutdown(), 'robot-crew-local: close storage domain')
    // An executor cannot survive a Host restart: its Agents are gone. Settle
    // every non-terminal run honestly instead of leaving a run that never ends.
    for (const [, row] of this.domain.table('runs').entries()) {
      if (!resumableState(row.state)) continue
      await this.writeRun(row.id, {
        ...toRun(row),
        state: 'failed',
        error: 'the Host process restarted before the run finished',
        endedAt: Date.now(),
      })
    }
  }

  /** Publish one validated specification revision. */
  async publish(spec: CrewSpec, previous?: CrewSpecRef): Promise<CrewSpecRevision> {
    const issues = validateCrewSpec(spec)
    if (issues.length > 0) throw new CrewSpecValidationError(issues)
    return await this.serialized(async () => {
      const frozen = deepFreeze(structuredClone(spec)) as CrewSpec
      const specId: CrewSpecId = previous === undefined ? brandString<CrewSpecId>(randomUUID()) : previous.spec
      let revision = 1
      if (previous !== undefined) {
        const existing = this.domain.table('revisions').get(`${previous.spec}@${previous.revision}`)
        if (existing === undefined) throw new Error(`unknown crew revision ${previous.spec}@${previous.revision}`)
        revision = previous.revision + 1
      }
      const row = {
        ref: { spec: specId, revision },
        spec: frozen,
        publishedAt: Date.now(),
        ...previous === undefined ? {} : { supersedes: previous.revision },
      }
      await this.domain.table('revisions').put(`${specId}@${revision}`, row)
      this.ctx.emit('crew/changed', 'specs')
      return toRevision(row)
    })
  }

  /** Read one published revision. */
  async revision(ref: CrewSpecRef): Promise<CrewSpecRevision | undefined> {
    const row = this.domain.table('revisions').get(`${ref.spec}@${ref.revision}`)
    return row === undefined ? undefined : toRevision(row)
  }

  /** List the latest revision of every crew. */
  async specs(): Promise<readonly CrewSpecRevision[]> {
    const latest = new Map<CrewSpecId, CrewSpecRevision>()
    const revisions = [...this.domain.table('revisions').entries()].map(([, row]) => toRevision(row))
    revisions.sort((left, right) => left.publishedAt - right.publishedAt || left.ref.revision - right.ref.revision)
    for (const revision of revisions) latest.set(revision.ref.spec, revision)
    return [...latest.values()]
  }

  /** Accept one run and start executing it on the Host. */
  async start(ref: CrewSpecRef, input: { readonly message: string }): Promise<CrewRun> {
    const message = input.message.trim()
    if (message === '') throw new Error('a crew run needs a non-blank message')
    const revision = await this.revision(ref)
    if (revision === undefined) throw new Error(`unknown crew revision ${ref.spec}@${ref.revision}`)
    const run: CrewRun = Object.freeze({
      id: brandString<CrewRunId>(randomUUID()),
      spec: toRef(revision.ref),
      name: revision.spec.name,
      state: 'queued',
      input: message,
      startedAt: Date.now(),
      nodes: revision.spec.nodes.map(node => ({ id: node.id, state: 'pending' as const, turns: 0 })),
      tokens: 0,
      messages: 0,
      steps: 0,
    })
    await this.serialized(async () => {
      await this.domain.table('runs').put(run.id, toRow(run))
      this.sequences.set(run.id, 0)
    })
    this.ctx.emit('crew/changed', 'runs')
    const controller = new AbortController()
    this.controllers.set(run.id, controller)
    const cwd = revision.spec.workspaceRoot
      ?? this.ctx.get('workspaceRegistry')?.list()[0]?.path
      ?? process.cwd()
    const carried = await this.carriedMemory(ref.spec)
    const execution = executeCrew({
      ctx: this.ctx,
      revision,
      run,
      signal: controller.signal,
      cwd,
      carried,
      record: async (entry) => { await this.append(run.id, entry) },
      patch: async (patch) => { await this.applyPatch(run.id, patch) },
    }).finally(() => {
      this.controllers.delete(run.id)
      this.executions.delete(execution)
    })
    this.executions.add(execution)
    return run
  }

  /**
   * Read the task memory earlier finished runs of one crew left in their ledgers.
   * @param spec - crew specification whose runs contribute.
   * @returns the carried memory; empty when the crew never finished a run.
   */
  private async carriedMemory(spec: CrewSpecId): Promise<BriefMemory> {
    const finished = (await this.runs(spec)).filter(candidate => isTerminalCrewRunState(candidate.state)).slice(-CARRY_RUNS)
    const carried: CarriedRun[] = await Promise.all(finished.map(async candidate => ({
      run: candidate,
      entries: await this.entries(candidate.id),
    })))
    return carryTaskMemory(carried, { maxRuns: CARRY_RUNS, maxItems: CARRY_ITEMS })
  }

  /** Cancel one run cooperatively. */
  async cancel(run: CrewRunId): Promise<void> {
    const stored = await this.run(run)
    if (stored === undefined || isTerminalCrewRunState(stored.state)) return
    this.controllers.get(run)?.abort()
    this.controllers.delete(run)
    await this.applyPatch(run, { state: 'cancelled', error: 'the run was cancelled', endedAt: Date.now() })
    this.ctx.emit('crew/changed', 'runs')
  }

  /** Read one run. */
  async run(run: CrewRunId): Promise<CrewRun | undefined> {
    const row = this.domain.table('runs').get(run)
    return row === undefined ? undefined : toRun(row)
  }

  /** List runs, optionally for one crew specification. */
  async runs(spec?: CrewSpecId): Promise<readonly CrewRun[]> {
    const rows = [...this.domain.table('runs').entries()]
      .map(([, row]) => toRun(row))
      .filter(run => spec === undefined || run.spec.spec === spec)
    rows.sort((left, right) => left.startedAt - right.startedAt)
    return rows
  }

  /** Read one run's complete flow ledger. */
  async entries(run: CrewRunId): Promise<readonly CrewEntry[]> {
    const prefix = `${run}#`
    return [...this.domain.table('entries').entries()]
      .filter(([key]) => key.startsWith(prefix))
      .map(([, row]) => toEntry(row))
      .sort((left, right) => left.seq - right.seq)
  }

  /** Append one ledger entry with the next sequence. */
  async append(run: CrewRunId, entry: Omit<CrewEntry, 'run' | 'seq'>): Promise<CrewEntry> {
    const stored = await this.serialized(async () => {
      const seq = (this.sequences.get(run) ?? 0) + 1
      this.sequences.set(run, seq)
      const row: CrewEntryRow = {
        run,
        seq,
        kind: entry.kind,
        at: entry.at,
        ...entry.node === undefined ? {} : { node: entry.node },
        ...entry.text === undefined ? {} : { text: entry.text },
        ...entry.data === undefined ? {} : { data: { ...entry.data } },
      }
      await this.domain.table('entries').put(entryKey(run, seq), row)
      return toEntry(row)
    })
    this.ctx.emit('crew/changed', 'entries')
    return stored
  }

  /** Merge one executor patch into the stored run. */
  private async applyPatch(run: CrewRunId, patch: CrewRunPatch): Promise<void> {
    await this.serialized(async () => {
      const row = this.domain.table('runs').get(run)
      if (row === undefined) return
      if (isTerminalCrewRunState(row.state)) return
      const next: CrewRun = {
        ...toRun(row),
        ...patch.state === undefined ? {} : { state: patch.state },
        ...patch.output === undefined ? {} : { output: patch.output },
        ...patch.error === undefined ? {} : { error: patch.error },
        ...patch.trip === undefined ? {} : { trip: patch.trip },
        ...patch.nodes === undefined ? {} : { nodes: patch.nodes },
        ...patch.tokens === undefined ? {} : { tokens: patch.tokens },
        ...patch.messages === undefined ? {} : { messages: patch.messages },
        ...patch.steps === undefined ? {} : { steps: patch.steps },
        ...patch.endedAt === undefined ? {} : { endedAt: patch.endedAt },
      }
      await this.domain.table('runs').put(run, toRow(next))
    })
    this.ctx.emit('crew/changed', 'runs')
  }

  /** Write one complete run row, used by startup reconciliation. */
  private async writeRun(run: CrewRunId, next: CrewRun): Promise<void> {
    await this.serialized(async () => {
      await this.domain.table('runs').put(run, toRow(next))
    })
  }

  /** Wait for accepted runs, then close the domain. */
  private async shutdown(): Promise<void> {
    await Promise.all([...this.executions])
    await this.domain.close()
  }

  private serialized<T>(work: () => Promise<T>): Promise<T> {
    const result = this.chain.then(work)
    this.chain = result.then(() => undefined, () => undefined)
    return result
  }
}

/**
 * Project one run onto its stored row.
 * @param run - immutable run view.
 * @returns the storage row.
 */
function toRow(run: CrewRun): CrewRunRow {
  return {
    id: run.id,
    spec: run.spec,
    name: run.name,
    state: run.state,
    input: run.input,
    startedAt: run.startedAt,
    ...run.endedAt === undefined ? {} : { endedAt: run.endedAt },
    ...run.output === undefined ? {} : { output: run.output },
    ...run.error === undefined ? {} : { error: run.error },
    ...run.trip === undefined ? {} : { trip: run.trip },
    nodes: run.nodes.map(node => ({
      id: node.id,
      state: node.state,
      turns: node.turns,
      ...node.summary === undefined ? {} : { summary: node.summary },
    })),
    tokens: run.tokens,
    messages: run.messages,
    steps: run.steps,
  }
}
