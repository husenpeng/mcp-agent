/**
 * The shared default specification for a new Tomato Rbot.
 *
 * Manual creation and the conversation `robot_create` tool both start from
 * these values, so a form that leaves advanced blocks untouched and a robot
 * created from chat run with the same general configuration. The browser
 * editor keeps an identical copy in `@tomato/client-ui-robot`, because a
 * non-experimental client bundle cannot inline this package; keep both in
 * sync.
 * @module @tomato/experimental-robot
 */

import type { RobotSpec } from './types.ts'

/**
 * Build a complete specification with every advanced block at its general default.
 *
 * Defaults: a manual trigger, plan strategy, fail-on-failure policy, a
 * 100k-token/600s/100-tool-call budget, one concurrent run, every tool
 * available (an empty allow list restricts nothing), workspace sandbox and the
 * `workspace-write` permission preset shipped by @tomato/base, no network, no
 * memory recall, and no agent-to-agent intents. Callers override only the basic
 * fields and leave the rest untouched.
 * @param basic - name and purpose a caller collected; omitted fields keep the neutral placeholder.
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
