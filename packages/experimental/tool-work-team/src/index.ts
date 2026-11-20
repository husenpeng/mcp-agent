/**
 * Model-facing `work_team_create` tool: author the robots a team needs and
 * publish them as one robot crew from a conversation. Unlike
 * `robot_crew_create`, which only binds already-published Rbots, this tool
 * creates each member's Rbot (mission, model route, confinement) and then
 * publishes the crew that wires them together, so describing a team's roles in
 * chat produces a complete, runnable work team.
 * @module @tomato/tool-work-team
 */

import type { Context, Volatile } from '@tomato/cordis'
import z from '@tomato/schemastery'
import type { Agent } from '@tomato/agent'
import { emptyRobotSpec } from '@tomato/experimental-robot'
import type { RobotSpec, SandboxLevel } from '@tomato/experimental-robot'
import { CrewSpecValidationError, emptyCrewSpec } from '@tomato/experimental-robot-crew'
import type { CrewEdge, CrewNode, CrewSpec } from '@tomato/experimental-robot-crew'
import { HarnessError } from '@tomato/llm'
import type { ContentBlock } from '@tomato/llm'
import type { SessionEvent, SessionSeq } from '@tomato/session'
import { defineTool } from '@tomato/tools'
import type { GenericCallView, ToolRunContext } from '@tomato/tools'

/** Plugin name registered with the Loader. */
export const name = 'tool-work-team'

/** Host services this plugin consumes. */
export const inject = ['agents', 'crews', 'robots', 'tools']

/** Default provider route new team robots run on. */
const DEFAULT_PROVIDER = 'blueai'

/** Default model new team robots run on. */
const DEFAULT_MODEL = 'DeepSeek-V4.1-Flash-1017'

/** Default permission preset new team robots run under. */
const DEFAULT_PERMISSION_PRESET = 'workspace-write'

/** Default confinement new team robots run under. */
const DEFAULT_SANDBOX: SandboxLevel = 'workspace'

/** Turns one member takes in a run when the call names none. */
const DEFAULT_TURNS = 1

/** Tokens one member may spend in a run when the call names none. */
const DEFAULT_TOKENS = 60_000

/** Smallest team the tool authors; published crews enforce their own node ceiling. */
const MIN_MEMBERS = 2

const CREATE_DESCRIPTION = 'Create a complete work team of Tomato Rbot agents from a description of its roles. '
  + 'Use it when the user describes what a team must do and which roles it needs. '
  + 'It creates one Rbot per member (mission, model route, and confinement) and publishes the crew that wires them together. '
  + 'Ask for the team goal and the roles first if they are unclear; edges pass results forward and every member shares the mission.'

/** Plain configuration a deployment or a settings form writes. */
interface ConfigInput {
  defaultProvider?: string
  defaultModel?: string
  permissionPreset?: string
  sandbox?: SandboxLevel
}

/** Live-editable defaults applied to every robot this tool creates. */
export interface Config {
  /** Provider route new team robots use; live-editable in the work-team settings page. */
  defaultProvider?: string | Volatile<string | undefined>
  /** Model id new team robots use; live-editable in the work-team settings page. */
  defaultModel?: string | Volatile<string | undefined>
  /** Permission preset new team robots run under. */
  permissionPreset?: string | Volatile<string | undefined>
  /** Filesystem and command confinement new team robots run under. */
  sandbox?: SandboxLevel | Volatile<SandboxLevel | undefined>
}

/** Schemastery config; every field is live-editable without a remount. */
export const Config: z<ConfigInput, Config> = z.object({
  defaultProvider: z.string().default(DEFAULT_PROVIDER).volatile(),
  defaultModel: z.string().default(DEFAULT_MODEL).volatile(),
  permissionPreset: z.string().default(DEFAULT_PERMISSION_PRESET).volatile(),
  sandbox: z.union([z.const('none'), z.const('workspace'), z.const('full')]).default(DEFAULT_SANDBOX).volatile(),
})

/** Read one field the Loader publishes as a live reference or a caller passes plain. */
function current(value: SandboxLevel | Volatile<SandboxLevel | undefined> | undefined): SandboxLevel | undefined
function current(value: string | Volatile<string | undefined> | undefined): string | undefined
function current(value: string | Volatile<string | undefined> | undefined): string | undefined {
  return value === undefined || typeof value !== 'object' ? value : value.get()
}

/** One member as the tool accepts it. */
interface MemberInput {
  readonly id: string
  readonly label: string
  readonly role: string
  readonly instruction: string
  readonly kind?: 'worker' | 'reviewer' | 'observer'
  readonly provider?: string
  readonly model?: string
  /** Turns this member may take in one run; defaults to one. */
  readonly maxTurns?: number
  /** Tokens this member may spend in one run; defaults to the crew node default. */
  readonly budgetTokens?: number
}

/** One edge as the tool accepts it. */
interface EdgeInput {
  readonly from: string
  readonly to: string
  readonly kind?: 'handoff' | 'delegate' | 'review'
}

/** Arguments the tool accepts. */
interface CreateArgs {
  readonly name: string
  readonly mission: string
  readonly description?: string
  readonly successCriteria?: readonly string[]
  readonly members: readonly MemberInput[]
  readonly edges?: readonly EdgeInput[]
}

/** One robot this tool created for the team. */
export interface CreatedRobot {
  readonly robotId: string
  readonly name: string
  readonly spec: string
  readonly revision: number
}

/** Canonical value of one successful team creation. */
export interface WorkTeamCreateValue {
  readonly specId: string
  readonly revision: number
  readonly name: string
  readonly nodeCount: number
  readonly robots: CreatedRobot[]
}

const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    specId: { type: 'string', required: true },
    revision: { type: 'integer', required: true },
    name: { type: 'string', required: true },
    nodeCount: { type: 'integer', required: true },
    robots: {
      type: 'array',
      required: true,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          robotId: { type: 'string', required: true },
          name: { type: 'string', required: true },
          spec: { type: 'string', required: true },
          revision: { type: 'integer', required: true },
        },
      },
    },
  },
} as const

/**
 * Render one successful creation for the model and the generic card fallback.
 * @param _args - validated arguments, unused by this rendering.
 * @param value - the published team.
 * @returns one text block naming the team and its new robots.
 */
function renderValue(_args: unknown, value: WorkTeamCreateValue): ContentBlock[] {
  const robots = value.robots.map(robot => robot.name).join(', ')
  return [{
    type: 'text',
    text: `Created work team "${value.name}" with ${value.nodeCount} agents (specification ${value.specId}, revision ${value.revision}). New robots: ${robots}.`,
  }]
}

/** Pure pending card naming the team being created. */
function presentCall(args: { readonly name?: string }): GenericCallView {
  return { card: 'generic', title: 'Create work team', kind: 'other', ...args.name === undefined ? {} : { rawInput: args.name } }
}

/** The calling agent plus the immutable event cut and open-turn start seq used for authority checks. */
interface TeamToolExecution {
  readonly agent: Agent
  readonly events: readonly SessionEvent[]
  readonly openTurnStartSeq: SessionSeq
}

/** Throw one structured tool-policy failure. */
function reject(message: string, code = 'WORK_TEAM_AUTHORITY_REQUIRED'): never {
  throw new HarnessError(message, code)
}

/**
 * Resolve and authenticate the calling agent and its driver boundary.
 * @param ctx - Context carrying the live agent registry.
 * @param exec - Tool execution metadata supplied by the registry.
 * @returns the authenticated agent, immutable event cut, and open-turn boundary.
 */
function teamToolExecution(ctx: Context, exec: ToolRunContext): TeamToolExecution {
  const agent = exec.agent
  if (agent === undefined) return reject('work-team creation requires a calling agent', 'WORK_TEAM_AGENT_REQUIRED')
  if (ctx.agents.get(agent.id) !== agent || agent.status !== 'running'
    || ctx.agents.currentInitiator() !== agent) {
    return reject('work-team creation requires the exact live calling agent inside its active driver', 'WORK_TEAM_DRIVER_REQUIRED')
  }
  // oxlint-disable-next-line typescript/no-deprecated -- Existing Session history read; migration deferred.
  const events = agent.session.snapshotEvents()
  const boundary = ctx.agents.turnBoundaryOf(agent.session)
  if (boundary.openTurnStartSeq === null) {
    reject('work-team creation requires an open model turn', 'WORK_TEAM_DRIVER_REQUIRED')
  }
  return { agent, events, openTurnStartSeq: boundary.openTurnStartSeq }
}

/**
 * Require a human request accepted by a runtime root agent in the open turn, so
 * no unattended or delegated turn can create a team on its own.
 * @param ctx - Context carrying the live agent graph.
 * @param execution - Authenticated current tool execution.
 */
function requireDirectHuman(ctx: Context, execution: TeamToolExecution): void {
  if (!ctx.agents.roots().includes(execution.agent)) {
    reject('work-team creation requires a direct human turn on a top-level agent')
  }
  for (let seq = execution.openTurnStartSeq + 1; seq < execution.events.length; seq += 1) {
    const event = execution.events[seq]
    if (event !== undefined && event.type === 'user/message' && event.data.source.kind === 'user') return
  }
  reject('work-team creation requires a direct human turn on a top-level agent')
}

/**
 * Choose a robot display name that no published specification already uses.
 * @param taken - names already published.
 * @param label - the member's preferred display name.
 * @returns the label, or the label with a numeric suffix when it is taken.
 */
function uniqueRobotName(taken: ReadonlySet<string>, label: string): string {
  if (!taken.has(label)) return label
  for (let suffix = 2; ; suffix += 1) {
    const candidate = `${label} (${suffix})`
    if (!taken.has(candidate)) return candidate
  }
}

/**
 * Build the robot specification for one member, applying the live team defaults.
 * @param member - the member the model described.
 * @param name - a display name unique among published robots.
 * @param defaults - the live team default route and confinement.
 * @returns a complete specification ready to publish.
 */
function robotSpecFor(
  member: MemberInput,
  name: string,
  defaults: { provider: string; model: string; permissionPreset: string; sandbox: SandboxLevel },
): RobotSpec {
  const base = emptyRobotSpec({
    name,
    description: member.role,
    mission: member.role,
    successCriteria: [member.instruction],
  })
  return {
    ...base,
    goal: {
      ...base.goal,
      model: { provider: member.provider ?? defaults.provider, model: member.model ?? defaults.model },
    },
    capability: {
      ...base.capability,
      permissionPreset: defaults.permissionPreset,
      sandbox: defaults.sandbox,
    },
  }
}

/**
 * Default handoffs when the model names none: a straight chain in member order.
 * @param members - the team's members in execution order.
 * @returns one handoff edge between each consecutive pair.
 */
function chainEdges(members: readonly MemberInput[]): CrewEdge[] {
  const edges: CrewEdge[] = []
  for (let index = 0; index + 1 < members.length; index += 1) {
    const from = members[index]
    const to = members[index + 1]
    if (from === undefined || to === undefined) continue
    edges.push({ from: from.id, to: to.id, kind: 'handoff', when: 'always' })
  }
  return edges
}

/**
 * Report a provider rejection with each field path so the model can correct exactly those fields.
 * @param error - rejection thrown by `publish`.
 * @returns the structured tool failure.
 */
function invalidSpecification(error: CrewSpecValidationError): HarnessError {
  const detail = error.issues.map(issue => `${issue.path === '' ? 'spec' : issue.path}: ${issue.message}`).join('; ')
  return new HarnessError(`Invalid work-team specification: ${detail}`, 'WORK_TEAM_SPEC_INVALID')
}

/**
 * Register `work_team_create` in the mounting scope.
 * @param ctx - Context that resolved the agents, crews, robots, and tools services.
 * @param config - live team defaults the settings page edits.
 */
export function apply(ctx: Context, config: Config): void {
  ctx.tools.register(defineTool({
    name: 'work_team_create',
    description: CREATE_DESCRIPTION,
    parameters: {
      name: { type: 'string', required: true, description: 'Display name, unique among crews.' },
      mission: { type: 'string', required: true, description: 'One-sentence purpose every member keeps in view.' },
      description: { type: 'string', description: 'One-line summary shown in the team list.' },
      successCriteria: {
        type: 'array',
        items: { type: 'string' },
        description: 'Observable conditions that mean the whole team succeeded.',
      },
      members: {
        type: 'array',
        required: true,
        description: 'At least two roles; one new Rbot is created for each.',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: { type: 'string', required: true, description: 'Lowercase slug such as research; also the A2A address.' },
            label: { type: 'string', required: true, description: 'Short display name; also the new Rbot name.' },
            role: { type: 'string', required: true, description: 'One sentence naming the part this member plays; becomes the Rbot mission.' },
            instruction: { type: 'string', required: true, description: 'Outcome this member must produce, stated observably.' },
            kind: { type: 'string', enum: ['worker', 'reviewer', 'observer'], description: 'Reviewer checks outputs; observer reads only.' },
            provider: { type: 'string', description: 'Override the team default provider route for this member.' },
            model: { type: 'string', description: 'Override the team default model for this member.' },
            maxTurns: { type: 'integer', description: 'Turns this member may take in one run, 1 to 8; defaults to one.' },
            budgetTokens: { type: 'integer', description: 'Tokens this member may spend in one run; omitted uses the crew node default.' },
          },
        },
      },
      edges: {
        type: 'array',
        description: 'Directed handoffs; the graph must stay acyclic. Omitted chains the members in order.',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            from: { type: 'string', required: true, description: 'Source member id.' },
            to: { type: 'string', required: true, description: 'Target member id.' },
            kind: { type: 'string', enum: ['handoff', 'delegate', 'review'], description: 'What the edge carries.' },
          },
        },
      },
    },
    output: { schema: OUTPUT_SCHEMA, render: renderValue },
    presentCall: args => presentCall(args),
    async execute(args, exec): Promise<WorkTeamCreateValue> {
      requireDirectHuman(ctx, teamToolExecution(ctx, exec))
      const input = args as CreateArgs
      if (input.members.length < MIN_MEMBERS) {
        throw new HarnessError('A work team needs at least two members.', 'WORK_TEAM_MEMBER_COUNT')
      }
      const defaults = {
        provider: current(config.defaultProvider) ?? DEFAULT_PROVIDER,
        model: current(config.defaultModel) ?? DEFAULT_MODEL,
        permissionPreset: current(config.permissionPreset) ?? DEFAULT_PERMISSION_PRESET,
        sandbox: current(config.sandbox) ?? DEFAULT_SANDBOX,
      }
      const published = await ctx.robots.specs()
      const taken = new Set(published.map(revision => revision.spec.name))
      const robots: CreatedRobot[] = []
      const nodes: CrewNode[] = []
      for (const member of input.members) {
        const name = uniqueRobotName(taken, member.label.trim())
        taken.add(name)
        const spec = robotSpecFor(member, name, defaults)
        const revision = await ctx.robots.publish(spec)
        const robot = await ctx.robots.instantiate(revision.ref)
        robots.push({ robotId: String(robot.id), name, spec: revision.ref.spec, revision: revision.ref.revision })
        nodes.push({
          id: member.id.trim(),
          label: member.label.trim(),
          role: member.role.trim(),
          instruction: member.instruction.trim(),
          kind: member.kind ?? 'worker',
          maxTurns: member.maxTurns ?? DEFAULT_TURNS,
          budgetTokens: member.budgetTokens ?? DEFAULT_TOKENS,
          robot: { spec: revision.ref.spec, revision: revision.ref.revision },
        })
      }
      const edges: CrewEdge[] = input.edges === undefined || input.edges.length === 0
        ? chainEdges(input.members)
        : input.edges.map(edge => ({ from: edge.from.trim(), to: edge.to.trim(), kind: edge.kind ?? 'handoff', when: 'always' }))
      const base = emptyCrewSpec({
        name: input.name,
        mission: input.mission,
        ...input.description === undefined ? {} : { description: input.description },
        nodes,
        edges,
      })
      const spec: CrewSpec = { ...base, successCriteria: input.successCriteria ?? [] }
      let revision
      try {
        revision = await ctx.crews.publish(spec)
      } catch (error) {
        if (error instanceof CrewSpecValidationError) throw invalidSpecification(error)
        throw error
      }
      return {
        specId: revision.ref.spec,
        revision: revision.ref.revision,
        name: revision.spec.name,
        nodeCount: revision.spec.nodes.length,
        robots,
      }
    },
  }))
}
