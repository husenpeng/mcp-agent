/**
 * Default specification for a new Tomato Rbot in the browser editor.
 *
 * Keep these values identical to `emptyRobotSpec()` in
 * `@tomato/experimental-robot`: the model-facing `robot_create` tool builds
 * conversation-created robots from the same general configuration, and the
 * client bundle cannot inline the experimental package that owns it.
 * @module @tomato/client-ui-robot
 */

import type { Robot, RobotSpec } from '@tomato/api-robot-controller/client'

/**
 * Whether this specification declares dependencies a run must resolve before it
 * can start. A robot that declares none needs no installation step.
 * @param spec - specification bound to the robot.
 * @returns whether it declares a skill, plugin, or MCP server.
 */
export function needsInstallation(spec: RobotSpec): boolean {
  return spec.capability.skills.length > 0
    || spec.capability.plugins.length > 0
    || spec.capability.mcpServers.length > 0
}

/**
 * Whether the robot's recorded installation covers the revision it now runs.
 * @param robot - robot whose installation to read.
 * @returns whether this exact revision was verified.
 */
export function isInstalled(robot: Robot): boolean {
  const installed = robot.installation
  return installed !== undefined
    && installed.ref.spec === robot.spec.spec
    && installed.ref.revision === robot.spec.revision
}

/**
 * Mission text `emptyRobotSpec()` fills when no real answer was collected.
 * The browser editor treats it as missing, so an unfinished draft can never
 * become a robot that runs a placeholder task.
 */
export const MISSION_STUB = 'Describe what this robot does.'

/**
 * Name `emptyRobotSpec()` fills when no real answer was collected.
 * Creation requires a name the user chose rather than this placeholder.
 */
export const NAME_STUB = 'New robot'

/**
 * Build a complete specification with every advanced block at its general default.
 * The default names no model; every run uses the deployment default until the
 * advanced configuration selects a route.
 * @param basic - optional basic fields to fill; omitted fields keep the neutral placeholder.
 * @returns a new mutable specification value.
 */
export function emptyRobotSpec(basic: {
  readonly name?: string
  readonly description?: string
  readonly mission?: string
  readonly successCriteria?: readonly string[]
} = {}): RobotSpec {
  return {
    name: basic.name ?? NAME_STUB,
    ...basic.description === undefined ? {} : { description: basic.description },
    position: { owner: 'me', callers: [], callees: [], escalation: [], visibility: 'team' },
    goal: {
      mission: basic.mission ?? MISSION_STUB,
      successCriteria: [...basic.successCriteria ?? []],
      triggers: [{ kind: 'manual' }],
      strategy: 'plan',
      stopConditions: [],
      failurePolicy: 'fail',
      budget: { tokens: 100_000, millis: 600_000, cost: 0, toolCalls: 100 },
      maxConcurrentRuns: 1,
    },
    capability: {
      tools: { allow: [], deny: [] },
      mcpServers: [],
      plugins: [],
      skills: [],
      workspaceRoots: [],
      dataClasses: [],
      credentials: [],
      sandbox: 'workspace',
      permissionPreset: 'workspace-write',
      network: 'none',
    },
    io: {
      input: { schema: 'robot.request', version: 1 },
      output: { schema: 'robot.result', format: 'markdown', delivery: 'chat' },
      acceptance: [],
    },
    memory: { read: [], write: [], recall: 'none' },
    a2a: { intents: [], peers: [] },
  }
}
