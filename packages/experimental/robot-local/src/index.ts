/**
 * Storage-backed provider for the `ctx.robots` service definition: specification
 * publication, immutable revisions, robot instantiation, and run acceptance.
 * It executes no work; accepted runs stay queued until a runtime provider takes over.
 * @module @tomato/experimental-robot-local
 */

import { randomUUID } from 'node:crypto'
import { brandString } from '@tomato/branded'
import { Service } from '@tomato/cordis'
import Robots, { isTerminalRunState } from '@tomato/experimental-robot'
import type {
  Robot, RobotId, RobotSpec, RobotSpecId, RobotSpecRef, RobotSpecRevision, Run, RunId, RunInput, RunOutcome,
} from '@tomato/experimental-robot'
import type { SessionId } from '@tomato/session/types'
import type { Domain } from '@tomato/storage-domain'
import { robotDomain } from './storage.ts'
import type { RobotRow, RevisionRow, RunRow } from './storage.ts'
import { parseRobotSpec } from './validate.ts'

/** Runtime specification validation, exported for callers that pre-check before publishing. */
export { parseRobotSpec, RobotSpecValidationError } from './validate.ts'
export type { RobotSpecIssue } from './validate.ts'

function toRef(row: { readonly spec: RobotSpecId; readonly revision: number }): RobotSpecRef {
  return Object.freeze({ spec: row.spec, revision: row.revision })
}

function toRevision(row: RevisionRow): RobotSpecRevision {
  return Object.freeze({
    ref: toRef(row.ref),
    spec: row.spec,
    publishedAt: row.publishedAt,
    ...(row.supersedes === undefined ? {} : { supersedes: row.supersedes }),
  })
}

function toRobot(row: RobotRow, state: Robot['state']): Robot {
  return Object.freeze({
    id: row.id,
    name: row.name,
    spec: toRef(row.ref),
    state,
    createdAt: row.createdAt,
  })
}

function toRun(row: RunRow): Run {
  return Object.freeze({
    id: row.id,
    robot: row.robot,
    spec: toRef(row.ref),
    state: row.state,
    input: row.input,
    startedAt: row.startedAt,
    ...(row.sessionId === undefined ? {} : { sessionId: row.sessionId }),
    ...(row.endedAt === undefined ? {} : { endedAt: row.endedAt }),
    ...(row.output === undefined ? {} : { output: row.output }),
    ...(row.error === undefined ? {} : { error: row.error }),
  })
}

/**
 * Storage-backed robot provider. Load it as a plugin after a storage backend and
 * `@tomato/storage-domain`; it registers as `ctx.robots` and opens the durable
 * `tomato_robot` domain. It adds no prompt, tool, or transport.
 */
export default class LocalRobots extends Robots {
  static inject = ['storageDomain']

  private domain!: Domain<typeof robotDomain>
  private chain: Promise<unknown> = Promise.resolve()

  protected async [Service.init](): Promise<void> {
    this.domain = await this.ctx.storageDomain.open(robotDomain)
    this.ctx.effect(() => () => this.domain.close(), 'robot-local: close storage domain')
  }

  private get revisions() {
    return this.domain.table('revisions')
  }

  private get robotsTable() {
    return this.domain.table('robots')
  }

  private get runsTable() {
    return this.domain.table('runs')
  }

  private key(ref: RobotSpecRef): string {
    return `${ref.spec}@${ref.revision}`
  }

  private serialized<T>(work: () => Promise<T>): Promise<T> {
    const result = this.chain.then(work)
    this.chain = result.then(() => undefined, () => undefined)
    return result
  }

  private changed(kind: 'specs' | 'robots' | 'runs'): void {
    this.ctx.emit('robot/changed', kind)
  }

  private latestRevisions(): RobotSpecRevision[] {
    const revisions = [...this.revisions.entries()].map(([, row]) => toRevision(row))
    revisions.sort((left, right) => left.ref.revision - right.ref.revision)
    const latest = new Map<RobotSpecId, RobotSpecRevision>()
    for (const revision of revisions) latest.set(revision.ref.spec, revision)
    return [...latest.values()]
  }

  private activeRun(robot: RobotId): Run | undefined {
    for (const [, row] of this.runsTable.entries()) {
      if (row.robot === robot && !isTerminalRunState(row.state)) return toRun(row)
    }
    return undefined
  }

  private view(row: RobotRow): Robot {
    return this.activeRun(row.id) === undefined ? toRobot(row, 'idle') : toRobot(row, 'running')
  }

  private async publishRevision(spec: RobotSpec, previous?: RobotSpecRef): Promise<RobotSpecRevision> {
    const parsed = parseRobotSpec(spec)
    let specId: RobotSpecId
    let revisionNumber: number
    let supersedes: number | undefined
    if (previous === undefined) {
      specId = brandString<RobotSpecId>(`robot-spec-${randomUUID()}`)
      revisionNumber = 1
    } else {
      const current = this.revisions.get(this.key(previous))
      if (current === undefined) {
        const known = this.latestRevisions().some(revision => revision.ref.spec === previous.spec)
        if (!known) throw new Error(`unknown robot specification ${previous.spec}`)
        throw new Error(`revision ${previous.revision} is not the latest revision of ${previous.spec}`)
      }
      const isLatest = this.latestRevisions().some(revision =>
        revision.ref.spec === previous.spec && revision.ref.revision === previous.revision)
      if (!isLatest) throw new Error(`revision ${previous.revision} is not the latest revision of ${previous.spec}`)
      specId = previous.spec
      revisionNumber = previous.revision + 1
      supersedes = previous.revision
    }
    if (this.latestRevisions().some(revision => revision.ref.spec !== specId && revision.spec.name === parsed.name)) {
      throw new Error(`a robot named "${parsed.name}" already exists`)
    }
    const ref: RobotSpecRef = Object.freeze({ spec: specId, revision: revisionNumber })
    const revision: RobotSpecRevision = Object.freeze({
      ref,
      spec: parsed,
      publishedAt: Date.now(),
      ...(supersedes === undefined ? {} : { supersedes }),
    })
    await this.revisions.put(this.key(ref), {
      ref,
      spec: parsed,
      publishedAt: revision.publishedAt,
      ...(supersedes === undefined ? {} : { supersedes }),
    })
    this.changed('specs')
    return revision
  }

  private async instantiateRobot(ref: RobotSpecRef): Promise<Robot> {
    const row = this.revisions.get(this.key(ref))
    if (row === undefined) {
      throw new Error(`unknown robot specification revision ${ref.spec}@${ref.revision}`)
    }
    const robot: RobotRow = {
      id: brandString<RobotId>(`robot-${randomUUID()}`),
      name: row.spec.name,
      ref: toRef(row.ref),
      createdAt: Date.now(),
    }
    await this.robotsTable.put(robot.id, robot)
    this.changed('robots')
    return toRobot(robot, 'idle')
  }

  private async rebindRobot(robot: RobotId, ref: RobotSpecRef): Promise<Robot> {
    const row = this.robotsTable.get(robot)
    if (row === undefined) throw new Error(`unknown robot ${robot}`)
    const revision = this.revisions.get(this.key(ref))
    if (revision === undefined) {
      throw new Error(`unknown robot specification revision ${ref.spec}@${ref.revision}`)
    }
    const rebound: RobotRow = { ...row, name: revision.spec.name, ref: toRef(revision.ref) }
    await this.robotsTable.update(robot, () => rebound)
    this.changed('robots')
    return this.view(rebound)
  }

  private async startRun(robot: RobotId, input: RunInput): Promise<Run> {
    const target = this.robotsTable.get(robot)
    if (target === undefined) throw new Error(`unknown robot ${robot}`)
    if (this.activeRun(robot) !== undefined) throw new Error(`robot ${robot} is already running`)
    const run: RunRow = {
      id: brandString<RunId>(`run-${randomUUID()}`),
      robot,
      ref: toRef(target.ref),
      state: 'queued',
      input,
      startedAt: Date.now(),
    }
    await this.runsTable.put(run.id, run)
    this.changed('runs')
    return toRun(run)
  }

  private async attachSessionToRun(run: RunId, session: SessionId): Promise<void> {
    const row = this.runsTable.get(run)
    if (row === undefined) throw new Error(`unknown run ${run}`)
    if (row.sessionId !== undefined) {
      if (row.sessionId === session) return
      throw new Error(`run ${run} is already attached to session ${row.sessionId}`)
    }
    await this.runsTable.update(run, current => ({ ...current, sessionId: session }))
    this.changed('runs')
  }

  private async cancelRun(run: RunId): Promise<void> {
    const row = this.runsTable.get(run)
    if (row === undefined) throw new Error(`unknown run ${run}`)
    if (isTerminalRunState(row.state)) return
    await this.runsTable.update(run, current => ({ ...current, state: 'cancelled', endedAt: Date.now() }))
    this.changed('runs')
  }

  private async finishRun(run: RunId, outcome: RunOutcome): Promise<void> {
    const row = this.runsTable.get(run)
    if (row === undefined) throw new Error(`unknown run ${run}`)
    if (isTerminalRunState(row.state)) return
    await this.runsTable.update(run, current => ({
      ...current,
      state: outcome.state,
      endedAt: Date.now(),
      ...(outcome.output === undefined ? {} : { output: outcome.output }),
      ...(outcome.error === undefined ? {} : { error: outcome.error }),
    }))
    this.changed('runs')
  }

  override publish(spec: RobotSpec, previous?: RobotSpecRef): Promise<RobotSpecRevision> {
    return this.serialized(() => this.publishRevision(spec, previous))
  }

  override revision(ref: RobotSpecRef): Promise<RobotSpecRevision | undefined> {
    const row = this.revisions.get(this.key(ref))
    return Promise.resolve(row === undefined ? undefined : toRevision(row))
  }

  override specs(): Promise<readonly RobotSpecRevision[]> {
    return Promise.resolve(this.latestRevisions())
  }

  override instantiate(ref: RobotSpecRef): Promise<Robot> {
    return this.serialized(() => this.instantiateRobot(ref))
  }

  override rebind(robot: RobotId, ref: RobotSpecRef): Promise<Robot> {
    return this.serialized(() => this.rebindRobot(robot, ref))
  }

  override robot(id: RobotId): Promise<Robot | undefined> {
    const row = this.robotsTable.get(id)
    return Promise.resolve(row === undefined ? undefined : this.view(row))
  }

  override robots(): Promise<readonly Robot[]> {
    return Promise.resolve([...this.robotsTable.entries()].map(([, row]) => this.view(row)))
  }

  override start(robot: RobotId, input: RunInput): Promise<Run> {
    return this.serialized(() => this.startRun(robot, input))
  }

  override cancel(run: RunId): Promise<void> {
    return this.serialized(() => this.cancelRun(run))
  }

  override finish(run: RunId, outcome: RunOutcome): Promise<void> {
    return this.serialized(() => this.finishRun(run, outcome))
  }

  override attachSession(run: RunId, session: SessionId): Promise<void> {
    return this.serialized(() => this.attachSessionToRun(run, session))
  }

  override run(id: RunId): Promise<Run | undefined> {
    const row = this.runsTable.get(id)
    return Promise.resolve(row === undefined ? undefined : toRun(row))
  }

  override runs(robot: RobotId): Promise<readonly Run[]> {
    const runs = [...this.runsTable.entries()].filter(([, row]) => row.robot === robot).map(([, row]) => toRun(row))
    return Promise.resolve(runs)
  }
}
