/**
 * Model-facing `robot_crew_create` tool over `ctx.crews`: publish a multi-agent
 * crew graph assembled from a conversation, so chat orchestration produces the
 * same versioned specification the canvas editor edits.
 * @module @tomato/experimental-tool-robot-crew
 */

import type { Context } from '@tomato/cordis'
import { CrewSpecValidationError, emptyCrewSpec } from '@tomato/experimental-robot-crew'
import type { CrewEdge, CrewNode, CrewSpec } from '@tomato/experimental-robot-crew'
import { HarnessError } from '@tomato/llm'
import type { ContentBlock } from '@tomato/llm'
import { defineTool } from '@tomato/tools'
import type { GenericCallView } from '@tomato/tools'
import { crewToolExecution, requireDirectHuman } from './authority.ts'

/** Plugin name registered with the Loader. */
export const name = 'experimental-tool-robot-crew'

/** Host services this plugin consumes. */
export const inject = ['agents', 'crews', 'tools']

const CREATE_DESCRIPTION = 'Create a multi-agent crew workflow from a name, mission, and a small graph of agents. '
  + 'Use it when the user asks to build a team, pipeline, or workflow of agents. '
  + 'Every node runs one Agent with the shared mission and extracted memory; edges pass results forward.'

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

/** One node as the tool accepts it. */
interface NodeInput {
  readonly id: string
  readonly label: string
  readonly role: string
  readonly instruction: string
  readonly kind?: 'worker' | 'reviewer' | 'observer'
  readonly robotSpec?: string
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
 * Assemble a publishable specification from the model's graph.
 * @param args - validated arguments.
 * @returns the specification with recommended limits.
 */
function specOf(args: CreateArgs): CrewSpec {
  const nodes: CrewNode[] = args.nodes.map((node, index) => ({
    id: node.id.trim(),
    label: node.label.trim(),
    role: node.role.trim(),
    instruction: node.instruction.trim(),
    kind: node.kind ?? 'worker',
    maxTurns: 1,
    budgetTokens: 60_000,
    at: { x: 64 + index * 280, y: 96 },
    ...node.robotSpec === undefined || node.robotRevision === undefined
      ? {}
      : { robot: { spec: node.robotSpec, revision: node.robotRevision } },
  }))
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
        description: 'Two to six agents in execution order of their edges.',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: { type: 'string', required: true, description: 'Lowercase slug such as research; also the A2A address.' },
            label: { type: 'string', required: true, description: 'Short display name.' },
            role: { type: 'string', required: true, description: 'One sentence naming the responsibility.' },
            instruction: { type: 'string', required: true, description: 'Outcome this agent must produce, stated observably.' },
            kind: { type: 'string', enum: ['worker', 'reviewer', 'observer'], description: 'Reviewer checks outputs; observer reads only.' },
            robotSpec: { type: 'string', description: 'Published robot specification id whose capabilities this node borrows.' },
            robotRevision: { type: 'integer', description: 'Revision of the borrowed robot specification.' },
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
      const input = args as unknown as CreateArgs
      let revision
      try {
        revision = await ctx.crews.publish(specOf(input))
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
