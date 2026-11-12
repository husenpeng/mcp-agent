/**
 * The two model-facing tools: read the phone's screen, and perform one action.
 *
 * Two tools rather than one per gesture: a single action tool keeps the first
 * request small, and an action answer carries the settled screen so the model
 * rarely needs a second call.
 * @module @tomato/experimental-phone-use/src/tools
 */

import type { Context } from '@tomato/cordis'
import { z } from 'zod'
import { defineTool } from '@tomato/tools'
import type { ToolExecution } from '@tomato/tools'
import type { JsonValue } from '@tomato/util-values'
import {
  PhoneAction as PhoneActionSchema, PhoneActResult as PhoneActResultSchema,
  PhoneObservation as PhoneObservationSchema,
} from './protocol.ts'
import { confirmRisk, refusalOf } from './consent.ts'
import type { PhoneDevices } from './registry.ts'

const OBSERVE_DESCRIPTION = [
  'Read the screen of an attached iPhone: the frontmost app, its visible elements with stable refs,',
  'and OCR text when the accessibility tree is thin. Refs are valid only for this answer.',
  'Read again after any action that changes the screen; do not reuse a ref across answers.',
].join(' ')

const ACT_DESCRIPTION = [
  'Perform one action on the attached iPhone and return the settled screen.',
  'Actions that pay, send, delete, or share are refused and must be confirmed by a person;',
  'the refusal names what would happen, and a confirmation repeats the same action.',
  'Prefer tapping a ref over tapping coordinates: coordinates are screen points and fragile.',
].join(' ')

/** Both answers are the protocol documents themselves; `render` is the human view. */
const OBSERVATION_SCHEMA = { type: 'json' as const }
const ACT_SCHEMA = { type: 'json' as const }

const ACTION_PARAMETERS = {
  type: 'object' as const,
  required: true as const,
  additionalProperties: false,
  description: 'One action. `type` selects which other fields apply.',
  properties: {
    type: {
      type: 'string' as const,
      required: true as const,
      enum: ['tap', 'longPress', 'swipe', 'type', 'press', 'launch', 'openUrl', 'wait'],
      description: 'tap/longPress/swipe/type/press/launch/openUrl/wait.',
    },
    ref: { type: 'string' as const, description: 'Element ref from the latest observation.' },
    point: {
      type: 'object' as const,
      additionalProperties: false,
      description: 'Screen point in points, for a tap or long press without a ref.',
      properties: {
        x: { type: 'number' as const, required: true as const },
        y: { type: 'number' as const, required: true as const },
      },
    },
    from: {
      type: 'object' as const,
      additionalProperties: false,
      properties: {
        x: { type: 'number' as const, required: true as const },
        y: { type: 'number' as const, required: true as const },
      },
    },
    to: {
      type: 'object' as const,
      additionalProperties: false,
      properties: {
        x: { type: 'number' as const, required: true as const },
        y: { type: 'number' as const, required: true as const },
      },
    },
    direction: { type: 'string' as const, enum: ['up', 'down', 'left', 'right'] },
    durationMs: { type: 'number' as const, description: 'Gesture length in milliseconds.' },
    count: { type: 'number' as const, description: '1 for a tap, 2 for a double tap.' },
    text: { type: 'string' as const, description: 'Text to enter; up to 4000 characters.' },
    submit: { type: 'boolean' as const, description: 'Send Return after the text.' },
    clear: { type: 'boolean' as const },
    button: { type: 'string' as const, enum: ['home', 'volumeUp', 'volumeDown'] },
    bundleId: { type: 'string' as const, description: 'Application to launch, by bundle id.' },
    name: { type: 'string' as const, description: 'Application to launch, by name, e.g. 设置.' },
    fresh: { type: 'boolean' as const, description: 'Terminate before launching so the app opens at its root.' },
    url: { type: 'string' as const },
    ms: { type: 'number' as const, description: 'Milliseconds to wait.' },
    untilText: { type: 'string' as const, description: 'Wait until this text appears.' },
    timeoutMs: { type: 'number' as const },
  },
}

/** Strip optional members that hold `undefined` and produce the wire value. */
function jsonOf(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue
}

/** One rendered element line, shared by both tools. */
function elementLine(element: { ref: string; role: string; label: string; frame: number[] }): string {
  const [x, y, width, height] = element.frame
  return `${element.ref} ${element.role.toLowerCase()} "${element.label}" (${Math.round(x ?? 0)},${Math.round(y ?? 0)},${Math.round(width ?? 0)},${Math.round(height ?? 0)})`
}

/**
 * Register both tools on the Host.
 * @param ctx - Host context carrying the tool registry.
 * @param registry - attached runners.
 * @param options - observation and rendering bounds from the plugin configuration.
 */
export function registerTools(
  ctx: Context,
  registry: PhoneDevices,
  options: { observeMaxElements: number; maxRenderElements: number },
): void {
  ctx.tools.register(defineTool({
    name: 'phone_observe',
    description: OBSERVE_DESCRIPTION,
    parameters: {
      device: { type: 'string', description: 'Device id from phone_act history; omit when one phone is attached.' },
      maxElements: { type: 'number', description: `Most elements to return; up to ${options.observeMaxElements}.` },
      includeOcr: { type: 'string', enum: ['auto', 'always', 'never'], description: 'OCR policy; auto reads it only when the tree is thin.' },
    },
    output: {
      schema: OBSERVATION_SCHEMA,
      render: (_args, value) => {
        const observation = PhoneObservationSchema.parse(value)
        const lines = [
          `${observation.foreground?.name ?? observation.foreground?.bundleId ?? 'unknown app'} · ${observation.elements.length} elements${observation.truncated ? ' (truncated)' : ''}${observation.keyboardVisible ? ' · keyboard' : ''}`,
          ...observation.elements.slice(0, options.maxRenderElements).map(elementLine),
        ]
        if (observation.alert) lines.push(`alert: ${observation.alert.title ?? ''} [${observation.alert.buttons.join(', ')}]`)
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    isConcurrencySafe: () => true,
    async execute(args, exec: Readonly<ToolExecution>): Promise<JsonValue> {
      const device = registry.require(args.device)
      const params = {
        maxElements: Math.min(args.maxElements ?? options.observeMaxElements, options.observeMaxElements),
        includeOcr: args.includeOcr ?? 'auto',
      }
      const value = await registry.call(device.deviceId, 'observe', jsonOf(params), exec.signal)
      const observation = PhoneObservationSchema.parse(value)
      return jsonOf({ deviceId: device.deviceId, ...observation })
    },
  }))

  ctx.tools.register(defineTool({
    name: 'phone_act',
    description: ACT_DESCRIPTION,
    parameters: {
      device: { type: 'string', description: 'Device id from phone_observe; omit when one phone is attached.' },
      action: ACTION_PARAMETERS,
      observeAfter: { type: 'boolean', description: 'Return the settled screen; defaults to true.' },
    },
    output: {
      schema: ACT_SCHEMA,
      render: (_args, value) => {
        const result = PhoneActResultSchema.parse(value)
        const title = result.hint ?? (result.ok ? 'done' : 'failed')
        const lines = [`${title}${result.pageChanged ? ' · screen changed' : ' · screen unchanged'}`]
        const observation = result.observation
        if (observation) {
          lines.push(`${observation.foreground?.name ?? observation.foreground?.bundleId ?? 'unknown app'} · ${observation.elements.length} elements`)
          lines.push(...observation.elements.slice(0, options.maxRenderElements).map(elementLine))
        }
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    async execute(args, exec: Readonly<ToolExecution>): Promise<JsonValue> {
      const device = registry.require(args.device)
      const request = {
        action: PhoneActionSchema.parse(args.action),
        observeAfter: args.observeAfter ?? true,
      }
      const run = async (confirmToken?: string) => PhoneActResultSchema.parse(await registry.call(
        device.deviceId,
        'act',
        jsonOf(confirmToken === undefined ? request : { ...request, confirmToken }),
        exec.signal,
      ))
      let result: z.infer<typeof PhoneActResultSchema>
      try {
        result = await run()
      } catch (error: unknown) {
        const refusal = refusalOf(error)
        if (refusal === undefined) throw error
        const token = await confirmRisk(ctx, exec.agent, refusal, exec.signal)
        result = await run(token)
      }
      return jsonOf({ deviceId: device.deviceId, ...result })
    },
  }))
}
