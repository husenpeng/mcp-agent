/**
 * Default specification for a new Tomato Rbot in the browser editor.
 *
 * Keep these values identical to `emptyRobotSpec()` in
 * `@tomato/experimental-robot`: the model-facing `robot_create` tool builds
 * conversation-created robots from the same general configuration, and the
 * client bundle cannot inline the experimental package that owns it.
 * @module @tomato/client-ui-robot
 */

import type { RobotSpec } from '@tomato/api-robot-controller/client'

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
