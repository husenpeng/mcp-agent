/**
 * Model-facing `robot_create` tool over `ctx.robots`: publish a specification
 * assembled from the four basic fields and instantiate it, so a creation
 * Session can produce a robot without asking the user about advanced settings.
 * @module @tomato/experimental-tool-robot
 */

import type { Context } from '@tomato/cordis'
import { emptyRobotSpec, RobotSpecValidationError } from '@tomato/experimental-robot'
import type { RobotSpecRevision } from '@tomato/experimental-robot'
import { HarnessError } from '@tomato/llm'
import type { ContentBlock } from '@tomato/llm'
import { defineTool } from '@tomato/tools'
import type { GenericCallView } from '@tomato/tools'
import { requireDirectHuman, robotToolExecution } from './authority.ts'

/** Plugin name registered with the Loader. */
export const name = 'experimental-tool-robot'

/** Host services this plugin consumes. */
export const inject = ['agents', 'robots', 'tools']

const CREATE_DESCRIPTION = 'Create a Tomato Rbot from a name, purpose, and success criteria. '
  + 'Use it when the user asks to create a robot; every other setting starts from the general default '
  + 'and can be changed later on the robot page.'

const CREATE_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    robotId: { type: 'string', required: true },
    name: { type: 'string', required: true },
    specId: { type: 'string', required: true },
    revision: { type: 'integer', required: true },
  },
} as const

/** Canonical value of one successful creation. */
export interface RobotCreateValue {
  readonly robotId: string
  readonly name: string
  readonly specId: string
  readonly revision: number
}

/**
 * Render one successful creation for the model and the generic card fallback.
 * @param _args - validated arguments, unused by this rendering.
 * @param value - the created robot and its specification revision.
 * @returns one text block naming the robot.
 */
function renderValue(_args: unknown, value: RobotCreateValue): ContentBlock[] {
  return [{
    type: 'text',
    text: `Created robot "${value.name}" (specification ${value.specId}, revision ${value.revision}, robot ${value.robotId}).`,
  }]
}

/** Pure pending card naming the robot being created. */
function presentCall(args: { readonly name?: string }): GenericCallView {
  return { card: 'generic', title: 'Create robot', kind: 'other', ...args.name === undefined ? {} : { rawInput: args.name } }
}

/**
 * Report a provider rejection with each field path instead of the provider's
 * combined message, so the model can correct exactly those fields.
 * @param error - rejection thrown by `publish`.
 * @returns the structured tool failure.
 */
function invalidSpecification(error: RobotSpecValidationError): HarnessError {
  const detail = error.issues.map(issue => `${issue.path === '' ? 'spec' : issue.path}: ${issue.message}`).join('; ')
  return new HarnessError(`Invalid robot specification: ${detail}`, 'ROBOT_SPEC_INVALID')
}

/**
 * Register `robot_create` in the mounting scope, so a composition decides which
 * agents receive it.
 * @param ctx - Context that resolved the agents, robots, and tools services.
 */
export function apply(ctx: Context): void {
  ctx.tools.register(defineTool({
    name: 'robot_create',
    description: CREATE_DESCRIPTION,
    parameters: {
      name: { type: 'string', required: true, description: 'Display name, unique among robots.' },
      description: { type: 'string', description: 'One-line summary of what the robot is for.' },
      mission: { type: 'string', required: true, description: 'One-sentence purpose the robot pursues on every run.' },
      successCriteria: {
        type: 'array',
        items: { type: 'string' },
        description: 'Observable conditions that mean a run succeeded; omit when the user gave none.',
      },
    },
    output: { schema: CREATE_OUTPUT_SCHEMA, render: renderValue },
    presentCall: args => presentCall(args),
    async execute(args, exec): Promise<RobotCreateValue> {
      requireDirectHuman(ctx, robotToolExecution(ctx, exec))
      const spec = emptyRobotSpec({
        name: args.name,
        ...args.description === undefined || args.description.trim() === '' ? {} : { description: args.description },
        mission: args.mission,
        ...args.successCriteria === undefined ? {} : { successCriteria: args.successCriteria },
      })
      let revision: RobotSpecRevision
      try {
        revision = await ctx.robots.publish(spec)
      } catch (error) {
        if (error instanceof RobotSpecValidationError) throw invalidSpecification(error)
        throw error
      }
      const robot = await ctx.robots.instantiate(revision.ref)
      return {
        robotId: robot.id,
        name: robot.name,
        specId: revision.ref.spec,
        revision: revision.ref.revision,
      }
    },
  }))
}
