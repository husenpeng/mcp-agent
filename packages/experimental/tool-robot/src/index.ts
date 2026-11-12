/**
 * Model-facing robot tools over `ctx.robots`: `robot_create` publishes the four
 * basic fields plus any capabilities the user selected and instantiates the
 * result; `robot_update` republishes an existing robot's skill, plugin, and MCP
 * selections. Both keep every other advanced setting at its shared default.
 * @module @tomato/experimental-tool-robot
 */

import type { Context } from '@tomato/cordis'
import { emptyRobotSpec, RobotSpecValidationError } from '@tomato/experimental-robot'
import type { Robot, RobotSpec, RobotSpecRevision } from '@tomato/experimental-robot'
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
  + 'Use it after the user confirmed a concrete name and purpose. Optionally select the skills, plugins, and MCP '
  + 'servers it may use; every other setting starts from the general default and can be changed later on the robot page.'

const UPDATE_DESCRIPTION = 'Change which skills, plugins, or MCP servers an existing robot uses. '
  + 'Pass only the lists to change; an omitted list keeps its current value. '
  + 'The new revision must be installed on the robot page before it can run.'

const ROBOT_OUTPUT_SCHEMA = {
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

/** Text `emptyRobotSpec()` uses when no real mission was collected; keep equal to the shared default. */
const MISSION_PLACEHOLDER = 'Describe what this robot does.'

/** Name `emptyRobotSpec()` uses when no real name was collected. */
const NAME_PLACEHOLDER = 'New robot'

/**
 * Refuse the placeholder values a rushed creation would otherwise publish.
 * The model must ask for a real answer instead of shipping a robot that looks
 * ready and runs a stub task.
 * @param name - display name supplied by the call.
 * @param mission - one-run purpose supplied by the call.
 * @returns the trimmed values.
 * @throws `ROBOT_SPEC_INVALID` naming the field the model must collect.
 */
function requireRealBasics(name: string, mission: string): { readonly name: string; readonly mission: string } {
  const trimmedName = name.trim()
  if (trimmedName === '' || trimmedName === NAME_PLACEHOLDER) {
    throw new HarnessError('Invalid robot specification: name: ask the user for a name', 'ROBOT_SPEC_INVALID')
  }
  const trimmedMission = mission.trim()
  if (trimmedMission === '' || trimmedMission === MISSION_PLACEHOLDER) {
    throw new HarnessError(
      'Invalid robot specification: goal.mission: ask the user what the robot should accomplish on every run',
      'ROBOT_SPEC_INVALID',
    )
  }
  return { name: trimmedName, mission: trimmedMission }
}

/**
 * Normalize one capability list a caller supplied: trim, drop blanks, and
 * deduplicate, because a repeated value is a specification error the user did
 * not intend.
 * @param values - names supplied by the tool call, when any.
 * @returns the cleaned list, empty when the caller omitted it.
 */
function dependencyList(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).map(value => value.trim()).filter(value => value !== ''))]
}

/**
 * Resolve the robot one update names.
 * @param ctx - Context carrying the robot registry.
 * @param nameOrId - display name or robot identity supplied by the call.
 * @returns the single matching robot.
 * @throws `ROBOT_NOT_FOUND` when nothing matches, or `ROBOT_AMBIGUOUS` when a
 *   name matches several robots and the identity is required.
 */
async function resolveRobot(ctx: Context, nameOrId: string): Promise<Robot> {
  const needle = nameOrId.trim()
  const robots = await ctx.robots.robots()
  const byId = robots.find(robot => robot.id === needle)
  if (byId !== undefined) return byId
  const byName = robots.filter(robot => robot.name === needle)
  const [only] = byName
  if (only === undefined) throw new HarnessError(`No robot is named "${needle}".`, 'ROBOT_NOT_FOUND')
  if (byName.length > 1) {
    throw new HarnessError(
      `Several robots are named "${needle}"; pass one of their ids instead: ${byName.map(robot => robot.id).join(', ')}.`,
      'ROBOT_AMBIGUOUS',
    )
  }
  return only
}

/**
 * Render one update for the model and the generic card fallback.
 * @param _args - validated arguments, unused by this rendering.
 * @param value - the updated robot and its specification revision.
 * @returns one text block naming the robot and the install requirement.
 */
function renderUpdatedValue(_args: unknown, value: RobotCreateValue): ContentBlock[] {
  return [{
    type: 'text',
    text: `Updated robot "${value.name}" (specification ${value.specId}, revision ${value.revision}). `
      + 'Install the new revision on the robot page before starting a run.',
  }]
}

/**
 * Register `robot_update`, which republishes one robot's capability selections.
 * Only the lists the caller passes change; every other field keeps its current
 * value. Publishing a new revision clears an installation that covered the old
 * one, so the model must tell the user to install again.
 * @param ctx - Context carrying the robot registry.
 */
function registerUpdateTool(ctx: Context): void {
  ctx.tools.register(defineTool({
    name: 'robot_update',
    description: UPDATE_DESCRIPTION,
    parameters: {
      robot: { type: 'string', required: true, description: 'Robot name or id, as the robot page lists it.' },
      skills: {
        type: 'array',
        items: { type: 'string' },
        description: 'Complete list of skills the robot should load; omit to keep the current list.',
      },
      plugins: {
        type: 'array',
        items: { type: 'string' },
        description: 'Complete list of plugins the robot depends on; omit to keep the current list.',
      },
      mcpServers: {
        type: 'array',
        items: { type: 'string' },
        description: 'Complete list of MCP servers the robot may use; omit to keep the current list.',
      },
    },
    output: {
      schema: ROBOT_OUTPUT_SCHEMA,
      render: renderUpdatedValue,
      presentationMeta: (_args, value) => ({ robotId: value.robotId, name: value.name }),
    },
    presentCall: args => ({ card: 'generic', title: 'Update robot', kind: 'other', rawInput: args.robot }),
    async execute(args, exec): Promise<RobotCreateValue> {
      requireDirectHuman(ctx, robotToolExecution(ctx, exec))
      const lists = [args.skills, args.plugins, args.mcpServers]
      if (lists.every(list => list === undefined)) {
        throw new HarnessError('Pass at least one of skills, plugins, or mcpServers.', 'ROBOT_UPDATE_EMPTY')
      }
      const robot = await resolveRobot(ctx, args.robot)
      const latest = (await ctx.robots.specs()).find(entry => entry.ref.spec === robot.spec.spec)
      const current = latest ?? await ctx.robots.revision(robot.spec)
      if (current === undefined) {
        throw new HarnessError(`Robot "${robot.name}" has no readable specification revision.`, 'ROBOT_SPEC_MISSING')
      }
      const spec: RobotSpec = {
        ...current.spec,
        capability: {
          ...current.spec.capability,
          ...(args.skills === undefined ? {} : { skills: dependencyList(args.skills) }),
          ...(args.plugins === undefined ? {} : { plugins: dependencyList(args.plugins) }),
          ...(args.mcpServers === undefined ? {} : { mcpServers: dependencyList(args.mcpServers) }),
        },
      }
      let revision: RobotSpecRevision
      try {
        revision = await ctx.robots.publish(spec, current.ref)
      } catch (error) {
        if (error instanceof RobotSpecValidationError) throw invalidSpecification(error)
        throw error
      }
      await ctx.robots.rebind(robot.id, revision.ref)
      return {
        robotId: robot.id,
        name: robot.name,
        specId: revision.ref.spec,
        revision: revision.ref.revision,
      }
    },
  }))
}

/**
 * Register `robot_create` and `robot_update` in the mounting scope, so a
 * composition decides which agents receive them.
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
      skills: {
        type: 'array',
        items: { type: 'string' },
        description: 'Skills the robot loads on every run; omit when the user named none.',
      },
      plugins: {
        type: 'array',
        items: { type: 'string' },
        description: 'Plugins the robot depends on, named as the deployment loads them; omit when the user named none.',
      },
      mcpServers: {
        type: 'array',
        items: { type: 'string' },
        description: 'MCP servers the robot may use; omit when the user named none.',
      },
    },
    output: {
      schema: ROBOT_OUTPUT_SCHEMA,
      render: renderValue,
      presentationMeta: (_args, value) => ({ robotId: value.robotId, name: value.name }),
    },
    presentCall: args => presentCall(args),
    async execute(args, exec): Promise<RobotCreateValue> {
      requireDirectHuman(ctx, robotToolExecution(ctx, exec))
      const basics = requireRealBasics(args.name, args.mission)
      const successCriteria = (args.successCriteria ?? []).map(item => item.trim()).filter(item => item !== '')
      const created = emptyRobotSpec({
        name: basics.name,
        ...args.description === undefined || args.description.trim() === '' ? {} : { description: args.description.trim() },
        mission: basics.mission,
        successCriteria,
      })
      // A robot created from a conversation works in that conversation's
      // Workspace unless the user names another one later; an explicit root
      // keeps the run directory, its history, and its outputs inspectable.
      const cwd = exec.agent?.session.header.cwd
      const spec: RobotSpec = {
        ...created,
        capability: {
          ...created.capability,
          skills: dependencyList(args.skills),
          plugins: dependencyList(args.plugins),
          mcpServers: dependencyList(args.mcpServers),
          ...(cwd === undefined ? {} : { workspaceRoots: [cwd] }),
        },
      }
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
  registerUpdateTool(ctx)
}
