/**
 * Host robot Remote owner: streams the robot registry as whole frames and
 * exposes specification publication, instantiation, rebinding, and run
 * control over the generated `robot` namespace. Every read is a projection of
 * `ctx.robots`; the controller holds no state of its own.
 * @module @tomato/api-robot-controller
 */

import { randomUUID } from 'node:crypto'
import { dirname } from 'node:path'
import type { Agent } from '@tomato/agent'
import type {} from '@tomato/api-session-controller'
import type { SessionRequestId } from '@tomato/api-session-controller'
import { brandString } from '@tomato/branded'
import type { Context } from '@tomato/cordis'
import type {} from '@tomato/experimental-robot'
import type {} from '@tomato/experimental-robot/templates'
import type { PluginInventorySnapshot } from '@tomato/host-plugin-inventory'
import type {} from '@tomato/mcp-resources'
import type {} from '@tomato/skill'
import type {} from '@tomato/tools'
import type {} from '@tomato/workspace'
import { Remote, RemoteError, TypertRemoteService } from '@tomato/typert-protocol'
import type {
  Robot, RobotCancelRequest, RobotCapabilitiesRequest, RobotCapabilityCatalog, RobotCapabilityOption, RobotCorrectRequest,
  RobotDependency, RobotDependencyKind, RobotHireRequest, RobotInstallRequest, RobotInstantiateRequest, RobotInterruptRequest,
  RobotPublishRequest, RobotRebindRequest, RobotRemoveRequest, RobotRevisionRequest, RobotRunsRequest, RobotSnapshotFrame,
  RobotSpec, RobotSpecIssue, RobotSpecRef, RobotSpecRevision, RobotStartRequest, RobotTemplate, Run, RunId,
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

/**
 * Project one local value onto the option an editor lists.
 * @param value - stored specification value.
 * @param label - display label.
 * @param description - optional detail; an empty string is omitted.
 * @param path - optional source folder; an empty string is omitted.
 * @returns the option.
 */
function option(value: string, label: string, description?: string, path?: string): RobotCapabilityOption {
  return {
    value,
    label,
    ...(description === undefined || description === '' ? {} : { description }),
    ...(path === undefined || path === '' ? {} : { path }),
  }
}

/**
 * Read the field issues of a provider's specification rejection. The rejection
 * is recognized by its `RobotSpecValidationError` name and `issues` list rather
 * than by `instanceof`, so a provider loaded from another package copy is still
 * reported as `robot/spec-invalid`.
 * @param error - value a provider's `publish` rejected with.
 * @returns the issues, or `undefined` when the error is not a specification rejection.
 */
function specIssuesOf(error: unknown): readonly RobotSpecIssue[] | undefined {
  if (!(error instanceof Error) || error.name !== 'RobotSpecValidationError' || !('issues' in error)) return undefined
  return Array.isArray(error.issues) ? error.issues : undefined
}

/**
 * Project dependency names onto the pairs an installation report lists.
 * @param kind - dependency family the names belong to.
 * @param names - declared names that the deployment does not offer.
 * @returns one dependency per name.
 */
function dependencies(kind: RobotDependencyKind, names: readonly string[]): RobotDependency[] {
  return names.map(name => ({ kind, name }))
}

/**
 * Whether one specification declares anything a run must resolve before it can
 * start in this deployment.
 * @param spec - specification bound to the robot.
 * @returns whether the specification declares a skill, plugin, or MCP server.
 */
function declaresDependencies(spec: RobotSpec): boolean {
  return spec.capability.skills.length > 0
    || spec.capability.plugins.length > 0
    || spec.capability.mcpServers.length > 0
}

/**
 * Whether the recorded installation covers the robot's bound revision.
 * @param robot - robot whose installation to read.
 * @returns whether this exact revision was verified.
 */
function isInstalled(robot: Robot): boolean {
  const installed = robot.installation
  return installed !== undefined
    && installed.ref.spec === robot.spec.spec
    && installed.ref.revision === robot.spec.revision
}

/**
 * Render missing dependencies for one failure message.
 * @param missing - dependency pairs the deployment does not offer.
 * @returns a comma-separated list naming each family.
 */
function describeMissing(missing: readonly RobotDependency[]): string {
  return missing.map(entry => `${entry.kind} "${entry.name}"`).join(', ')
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
   * List the runs of one robot. A deleted robot keeps its recorded runs, so an
   * identity that no longer appears in the roster still answers with history.
   * @param request - robot whose runs to read.
   * @returns runs in acceptance order; empty for an identity with no run.
   */
  @Remote('runs')
  async runs(request: RobotRunsRequest): Promise<readonly Run[]> {
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
      const issues = specIssuesOf(error)
      if (issues !== undefined) throw new RemoteError('robot/spec-invalid', messageOf(error), { issues: [...issues] })
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
   * Verify the robot's declared skills, plugins, MCP servers, and permission
   * preset against this deployment and record the installation of its bound
   * revision. A revision that declares nothing resolvable installs immediately.
   * Installation does not start a run; the runtime still resolves every
   * dependency when the run begins.
   * @param request - robot to install.
   * @returns the robot with an installation naming its bound revision.
   * @throws RemoteError `robot/not-found` for an unknown robot or revision, or
   *   `robot/capabilities-missing` with every dependency this deployment lacks.
   */
  @Remote('installRobot')
  async install(request: RobotInstallRequest): Promise<Robot> {
    const robot = await this.requireRobot(request.robotId)
    const revision = await this.ctx.robots.revision(robot.spec)
    if (revision === undefined) throw this.missing(refId(robot.spec))
    const missing = await this.capabilityGaps(revision.spec)
    if (missing.length > 0) {
      throw new RemoteError(
        'robot/capabilities-missing',
        `${robot.name} cannot be installed; this deployment does not offer ${describeMissing(missing)}.`
          + ' Install missing plugins under Settings → Plugins, or edit the specification, then retry.',
        { missing },
      )
    }
    return this.ctx.robots.install(robot.id)
  }

  /**
   * Delete one robot instance. Its published specifications and recorded runs
   * stay, so the history it produced remains readable; a robot that still owns
   * a non-terminal run refuses removal.
   * @param request - robot to delete.
   * @returns nothing after the robot is deleted.
   * @throws RemoteError `robot/not-found` for an unknown robot, or
   *   `robot/conflict` while a run is still executing.
   */
  @Remote('removeRobot')
  async remove(request: RobotRemoveRequest): Promise<void> {
    await this.requireRobot(request.robotId)
    try {
      await this.ctx.robots.remove(request.robotId)
    } catch (error: unknown) {
      throw new RemoteError('robot/conflict', messageOf(error), { message: messageOf(error) })
    }
  }

  /**
   * Publish a user-owned copy of one registered template and instantiate it.
   * The copy is an ordinary specification: later template changes never
   * modify it, and editing it never modifies the template.
   * @param request - template, locale for its copy, an optional name, and the
   *   Workspace directory a rootless template inherits.
   * @returns the new idle robot.
   * @throws RemoteError `robot/not-found` for an unknown template or a missing
   *   template registry, `robot/spec-invalid` when the template does not
   *   validate, or `robot/conflict` when publication conflicts.
   */
  @Remote('hire')
  async hire(request: RobotHireRequest): Promise<Robot> {
    const template = this.ctx.get('robotTemplates')?.hireSpec(request.templateId, request.locale, request.name)
    if (template === undefined) throw this.missing(String(request.templateId))
    // A hired robot works in the calling page's Workspace unless the template
    // already pins its own roots.
    const spec = request.workspaceRoot === undefined || template.capability.workspaceRoots.length > 0
      ? template
      : { ...template, capability: { ...template.capability, workspaceRoots: [request.workspaceRoot] } }
    const taken = new Set((await this.ctx.robots.specs()).map(revision => revision.spec.name))
    const name = request.name ?? uniqueName(spec.name, taken)
    const revision = await this.publish({ spec: { ...spec, name } })
    return this.ctx.robots.instantiate(revision.ref)
  }

  /**
   * Accept one run for a robot. A specification that declares skills, plugins,
   * or MCP servers must be installed for its bound revision first; installing
   * verifies the deployment can resolve what the run will need.
   * @param request - robot and the input message.
   * @returns the accepted run.
   * @throws RemoteError `robot/not-found` for an unknown robot, or
   *   `robot/conflict` while the robot cannot accept a run, including when its
   *   declared dependencies were never installed.
   */
  @Remote('start')
  async start(request: RobotStartRequest): Promise<Run> {
    const robot = await this.requireRobot(request.robotId)
    const revision = await this.ctx.robots.revision(robot.spec)
    if (revision !== undefined && declaresDependencies(revision.spec) && !isInstalled(robot)) {
      throw new RemoteError(
        'robot/conflict',
        `${robot.name} is not installed; install it on the robot page before starting a run.`,
        { message: 'not-installed' },
      )
    }
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
   * Pause an executing run: record it as `waiting`, then abort its active turn
   * so the user can correct the robot before it continues. The Session, its
   * history, and the Agent stay alive, so a later `correct` continues the same
   * run instead of starting from an empty Session.
   * @param request - run to pause.
   * @returns nothing after the run is waiting for input.
   * @throws RemoteError `robot/not-found` for an unknown run, or
   *   `robot/conflict` while the run has no live Agent to pause.
   */
  @Remote('interrupt')
  async interrupt(request: RobotInterruptRequest): Promise<void> {
    const run = await this.requireRun(request.runId)
    if (run.state === 'waiting') return
    const agent = this.liveAgent(run)
    if (agent === undefined) {
      throw new RemoteError('robot/conflict', 'the run has no executing Agent to pause', { message: 'not-executing' })
    }
    // Record the pause before aborting the turn: the executor settles a run
    // whose turn ended, and it must read `waiting` first.
    await this.ctx.robots.advance(run.id, 'waiting')
    agent.cancel({ kind: 'user' }, { keepInbox: true })
  }

  /**
   * Deliver the user's correction to a run. A waiting run receives it as the
   * next turn; a running run receives it as steering for the next step, which
   * leaves the current work in place.
   * @param request - run and the correction text.
   * @returns nothing after the Agent accepted the message.
   * @throws RemoteError `robot/not-found` for an unknown run,
   *   `robot/conflict` while the run is not executing, or
   *   `gateway/bad-request` when the correction has no text.
   */
  @Remote('correct')
  async correct(request: RobotCorrectRequest): Promise<void> {
    const run = await this.requireRun(request.runId)
    if (request.message.trim() === '') {
      throw new RemoteError('gateway/bad-request', 'a correction must carry non-blank text', {})
    }
    const sessionId = run.sessionId
    // The message must reach the Agent this run owns; a cold resume would start
    // a detached turn no executor settles.
    if (sessionId === undefined || this.liveAgent(run) === undefined) {
      throw new RemoteError('robot/conflict', 'the run is not executing right now', { message: 'not-executing' })
    }
    const sessions = this.ctx.get('sessionController')
    if (sessions === undefined) {
      throw new RemoteError('gateway/internal', 'corrections need the Session controller, which this deployment does not mount', {})
    }
    await sessions.prompt({
      requestId: brandString<SessionRequestId>(`robot-correct-${randomUUID()}`),
      sessionId,
      mode: run.state === 'waiting' ? 'queue' : 'steer',
      content: [{ type: 'text', text: request.message }],
    }, new AbortController().signal)
    // The message starts the next turn; record that the run is driving again.
    await this.ctx.robots.advance(run.id, 'running')
  }

  private async requireRun(id: RunId): Promise<Run> {
    const run = await this.ctx.robots.run(id)
    if (run === undefined) throw this.missing(String(id))
    return run
  }

  /**
   * Read the Agent a run is executing with. Paused runs keep their Agent alive,
   * so a non-terminal run without one is not executing and cannot be steered.
   * @param run - run whose executing Agent to read.
   * @returns the live Agent, or `undefined` when none is attached.
   */
  private liveAgent(run: Run): Agent | undefined {
    if (run.sessionId === undefined) return undefined
    // The Agent registry is a composition peer of the executor, not of this
    // controller, so a deployment without it reports "not executing" instead
    // of failing to load.
    return this.ctx.get('agents')?.get(run.sessionId)
  }

  /**
   * List the local values the specification editor offers as choices. Each
   * source is optional: a deployment without the skill, plugin, tool, MCP, or
   * Workspace service contributes an empty list instead of failing the read.
   * @param request - Workspace whose project skills apply.
   * @returns skill, plugin, tool, MCP-server, and Workspace-directory options.
   */
  @Remote('capabilities')
  async capabilities(request: RobotCapabilitiesRequest): Promise<RobotCapabilityCatalog> {
    const skills = this.ctx.get('skills')
    const summaries = skills === undefined
      ? []
      : await skills.list(request.cwd === undefined ? {} : { cwd: request.cwd })
    const tools = this.ctx.get('tools')?.definitions() ?? []
    const mcpServers = this.ctx.get('mcpResources')?.list() ?? []
    const workspaces = this.ctx.get('workspaceRegistry')?.list() ?? []
    const plugins = [...this.activePluginNames(await this.ctx.get('pluginInventory')?.list())]
      .sort((left, right) => left.localeCompare(right))
    return {
      skills: summaries.map(skill => option(
        skill.name,
        skill.name,
        skill.description,
        // A skill's instruction file identifies the folder a person recognizes;
        // virtual skills have no folder and keep the name-only option.
        skill.path === undefined || skill.path === '' ? undefined : dirname(skill.path),
      )),
      plugins: plugins.map(name => option(name, name)),
      tools: tools
        .map(tool => option(tool.name, tool.name, tool.description))
        .sort((left, right) => left.value.localeCompare(right.value)),
      mcpServers: mcpServers.map(name => option(name, name)),
      workspaceRoots: workspaces.map(workspace => option(workspace.path, workspace.title, undefined, workspace.path)),
    }
  }

  /**
   * Resolve the directory a run will work in, matching the runtime's order:
   * the specification's first Workspace root, the deployment's first registered
   * Workspace, then the Host process directory. Installation must inspect the
   * skills the run will actually see.
   * @param spec - specification bound to the robot being installed.
   * @returns the absolute working directory.
   */
  private runCwd(spec: RobotSpec): string {
    return spec.capability.workspaceRoots[0]
      ?? this.ctx.get('workspaceRegistry')?.list()[0]?.path
      ?? process.cwd()
  }

  /**
   * Read the module names of plugins this deployment runs.
   * @param snapshot - plugin inventory, or `undefined` when no inventory is mounted.
   * @returns active plugin module names.
   */
  private activePluginNames(snapshot: PluginInventorySnapshot | undefined): Set<string> {
    return new Set((snapshot?.entries ?? [])
      .filter(entry => entry.enabled && entry.fiberPhase === 'active')
      .map(entry => entry.moduleName))
  }

  /**
   * Compare one specification's declared dependencies with the live deployment.
   * Every dependency family is checked against its live source; a source that is
   * not mounted supplies nothing, so a declared dependency it would own is missing.
   * @param spec - specification bound to the robot being installed.
   * @returns every dependency this deployment does not offer.
   */
  private async capabilityGaps(spec: RobotSpec): Promise<readonly RobotDependency[]> {
    const missing: RobotDependency[] = []
    const cwd = this.runCwd(spec)
    if (spec.capability.skills.length > 0) {
      const registry = this.ctx.get('skills')
      const available = new Set(registry === undefined
        ? []
        : (await registry.list({ cwd })).map(skill => skill.name))
      missing.push(...dependencies('skill', spec.capability.skills.filter(name => !available.has(name))))
    }
    if (spec.capability.plugins.length > 0) {
      const active = this.activePluginNames(await this.ctx.get('pluginInventory')?.list())
      missing.push(...dependencies('plugin', spec.capability.plugins.filter(name => !active.has(name))))
    }
    if (spec.capability.mcpServers.length > 0) {
      const mounted = this.ctx.get('mcpResources')?.list() ?? []
      missing.push(...dependencies('mcpServer', spec.capability.mcpServers.filter(name => !mounted.includes(name))))
    }
    const presets = this.ctx.get('permissionPresets')
    if (presets !== undefined) {
      try {
        presets.resolve(spec.capability.permissionPreset)
      } catch {
        // An unregistered preset is a dependency this deployment cannot satisfy;
        // the gap names it so the caller can republish with an offered preset.
        missing.push({ kind: 'permissionPreset', name: spec.capability.permissionPreset })
      }
    }
    return missing
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
    const templates: readonly RobotTemplate[] = this.ctx.get('robotTemplates')?.list() ?? []
    return { specs, robots, runs: runs.flat(), templates }
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

/**
 * Pick the first free display name in the sequence `base`, `base 2`, `base 3`, ….
 * @param base - preferred name.
 * @param taken - names already used by published specifications.
 * @returns a name absent from `taken`.
 */
function uniqueName(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base
  let index = 2
  while (taken.has(`${base} ${index}`)) index += 1
  return `${base} ${index}`
}

export default RobotController
