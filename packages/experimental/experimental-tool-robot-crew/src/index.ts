/**
 * Model-facing `robot_crew_create` tool over `ctx.crews`: orchestrate published
 * Tomato Rbot agents into a versioned crew, so a conversation produces the same
 * specification the collaboration page edits.
 * @module @tomato/experimental-tool-robot-crew
 */

import type { Context } from '@tomato/cordis'
import { CrewSpecValidationError, emptyCrewSpec } from '@tomato/experimental-robot-crew'
import type { CrewEdge, CrewNode, CrewRobotRef, CrewSpec } from '@tomato/experimental-robot-crew'
import type {} from '@tomato/experimental-robot'
import { HarnessError } from '@tomato/llm'
import type { ContentBlock } from '@tomato/llm'
import { defineTool } from '@tomato/tools'
import type { GenericCallView } from '@tomato/tools'
import { crewToolExecution, requireDirectHuman } from './authority.ts'

/** Plugin name registered with the Loader. */
export const name = 'experimental-tool-robot-crew'

/** Host services this plugin consumes. */
export const inject = ['agents', 'crews', 'robots', 'tools']

const CREATE_DESCRIPTION = 'Orchestrate published Tomato Rbot agents into a multi-agent crew. '
  + 'Use it when the user asks to build a team, pipeline, or workflow of agents. '
  + 'Every member names the existing Rbot it runs as; create missing agents in Tomato Rbot first. '
  + 'Edges pass results forward, and every member receives the shared mission and extracted memory.'

const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    specId: { type: 'string', required: true },
    revision: { type: 'integer', required: true },
    name: { type: 'string', required: true },
    nodeCount: { type: 'integer', required: true },
  },
} as const

/** Canonical value of one successful creation. */
export interface CrewCreateValue {
  readonly specId: string
  readonly revision: number
  readonly name: string
  readonly nodeCount: number
}

/** One member as the tool accepts it. */
interface NodeInput {
  readonly id: string
  readonly label: string
  readonly role: string
  readonly instruction: string
  readonly kind?: 'worker' | 'reviewer' | 'observer'
  /** Published Rbot name or specification id this member runs as. */
  readonly robot: string
  /** Published revision of that Rbot; omitted uses its latest revision. */
  readonly robotRevision?: number
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
  readonly nodes: readonly NodeInput[]
  readonly edges?: readonly EdgeInput[]
}

/**
 * Render one successful creation for the model and the generic card fallback.
 * @param _args - validated arguments, unused by this rendering.
 * @param value - the published crew.
 * @returns one text block naming the crew.
 */
function renderValue(_args: unknown, value: CrewCreateValue): ContentBlock[] {
  return [{
    type: 'text',
    text: `Created crew "${value.name}" with ${value.nodeCount} agents (specification ${value.specId}, revision ${value.revision}).`,
  }]
}

/** Pure pending card naming the crew being created. */
function presentCall(args: { readonly name?: string }): GenericCallView {
  return { card: 'generic', title: 'Create crew', kind: 'other', ...args.name === undefined ? {} : { rawInput: args.name } }
}

/**
 * Resolve every member's Rbot name or specification id to one published
 * revision and assemble its node.
 * @param ctx - Context carrying the robot registry.
 * @param args - validated arguments.
 * @returns one member per input node, each bound to its Rbot revision.
 * @throws when a member names no published Rbot.
 */
async function resolveNodes(ctx: Context, args: CreateArgs): Promise<readonly CrewNode[]> {
  const published = await ctx.robots.specs()
  const known = published.map(revision => revision.spec.name).join(', ') || 'none'
  return await Promise.all(args.nodes.map(async (node): Promise<CrewNode> => {
    const wanted = node.robot.trim()
    const latest = published.find(revision => revision.ref.spec === wanted)
      ?? published.find(revision => revision.spec.name === wanted)
    if (latest === undefined) {
      throw new HarnessError(
        `Unknown Rbot "${wanted}". Published Rbots: ${known}. Create the agent in Tomato Rbot first.`,
        'CREW_RBOT_UNKNOWN',
      )
    }
    const revision = node.robotRevision ?? latest.ref.revision
    if (revision !== latest.ref.revision) {
      const exact = await ctx.robots.revision({ spec: latest.ref.spec, revision })
      if (exact === undefined) {
        throw new HarnessError(
          `Rbot "${latest.spec.name}" has no published revision ${revision}.`,
          'CREW_RBOT_UNKNOWN',
        )
      }
    }
    const robot: CrewRobotRef = { spec: latest.ref.spec, revision }
    return {
      id: node.id.trim(),
      label: node.label.trim(),
      role: node.role.trim(),
      instruction: node.instruction.trim(),
      kind: node.kind ?? 'worker',
      maxTurns: 1,
      budgetTokens: 60_000,
      robot,
    }
  }))
}

/**
 * Assemble a publishable specification from the model's graph.
 * @param args - validated arguments.
 * @param nodes - members already bound to their Rbot revisions.
 * @returns the specification with recommended limits.
 */
function specOf(args: CreateArgs, nodes: readonly CrewNode[]): CrewSpec {
  const edges: CrewEdge[] = (args.edges ?? []).map(edge => ({
    from: edge.from.trim(),
    to: edge.to.trim(),
    kind: edge.kind ?? 'handoff',
    when: 'always',
  }))
  const base = emptyCrewSpec({
    name: args.name,
    mission: args.mission,
    ...args.description === undefined ? {} : { description: args.description },
    nodes,
    edges,
  })
  return {
    ...base,
    successCriteria: args.successCriteria ?? [],
  }
}

/**
 * Report a provider rejection with each field path so the model can correct
 * exactly those fields.
 * @param error - rejection thrown by `publish`.
 * @returns the structured tool failure.
 */
function invalidSpecification(error: CrewSpecValidationError): HarnessError {
  const detail = error.issues.map(issue => `${issue.path === '' ? 'spec' : issue.path}: ${issue.message}`).join('; ')
  return new HarnessError(`Invalid crew specification: ${detail}`, 'CREW_SPEC_INVALID')
}

/**
 * Register `robot_crew_create` in the mounting scope.
 * @param ctx - Context that resolved the agents, crews, and tools services.
 */
export function apply(ctx: Context): void {
  ctx.tools.register(defineTool({
    name: 'robot_crew_create',
    description: CREATE_DESCRIPTION,
    parameters: {
      name: { type: 'string', required: true, description: 'Display name, unique among crews.' },
      mission: { type: 'string', required: true, description: 'One-sentence purpose every agent keeps in view.' },
      description: { type: 'string', description: 'One-line summary shown in the crew list.' },
      successCriteria: {
        type: 'array',
        items: { type: 'string' },
        description: 'Observable conditions that mean the whole crew succeeded.',
      },
      nodes: {
        type: 'array',
        required: true,
        description: 'Two to six Rbot members in execution order of their edges.',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: { type: 'string', required: true, description: 'Lowercase slug such as research; also the A2A address.' },
            label: { type: 'string', required: true, description: 'Short display name; the Rbot name is a good default.' },
            role: { type: 'string', required: true, description: 'One sentence naming the part this member plays.' },
            instruction: { type: 'string', required: true, description: 'Outcome this member must produce, stated observably.' },
            kind: { type: 'string', enum: ['worker', 'reviewer', 'observer'], description: 'Reviewer checks outputs; observer reads only.' },
            robot: {
              type: 'string',
              required: true,
              description: 'Name or specification id of the published Tomato Rbot this member runs as.',
            },
            robotRevision: { type: 'integer', description: 'Published revision of that Rbot; omitted uses the latest.' },
          },
        },
      },
      edges: {
        type: 'array',
        description: 'Directed handoffs; the graph must stay acyclic.',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            from: { type: 'string', required: true, description: 'Source node id.' },
            to: { type: 'string', required: true, description: 'Target node id.' },
            kind: { type: 'string', enum: ['handoff', 'delegate', 'review'], description: 'What the edge carries.' },
          },
        },
      },
    },
    output: { schema: OUTPUT_SCHEMA, render: renderValue },
    presentCall: args => presentCall(args),
    async execute(args, exec): Promise<CrewCreateValue> {
      requireDirectHuman(ctx, crewToolExecution(ctx, exec))
      const input = args as CreateArgs
      const nodes = await resolveNodes(ctx, input)
      let revision
      try {
        revision = await ctx.crews.publish(specOf(input, nodes))
      } catch (error) {
        if (error instanceof CrewSpecValidationError) throw invalidSpecification(error)
        throw error
      }
      return {
        specId: revision.ref.spec,
        revision: revision.ref.revision,
        name: revision.spec.name,
        nodeCount: revision.spec.nodes.length,
      }
    },
  }))
}
