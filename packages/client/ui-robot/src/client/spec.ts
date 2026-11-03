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
    name: basic.name ?? 'New robot',
    ...basic.description === undefined ? {} : { description: basic.description },
    position: { owner: 'me', callers: [], callees: [], escalation: [], visibility: 'team' },
    goal: {
      mission: basic.mission ?? 'Describe what this robot does.',
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
      permissionPreset: 'workspace',
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
