/**
 * Host side of phone-use: the `phone` Remote namespace and the two tools that
 * observe and operate an attached iPhone.
 *
 * The runner connects out to this Host, so a phone behind a LAN, a tailnet, or
 * the desktop tunnel is reachable without an inbound port on the device. This
 * package owns the attachment registry, the command deadline, and the
 * confirmation of irreversible actions; the device-side engine owns everything
 * that touches the screen.
 * @module @tomato/experimental-phone-use
 */

import type { Context } from '@tomato/cordis'
import Schema from '@tomato/schemastery'
import type {} from '@tomato/tools'
import type {} from '@tomato/user-questions'
import { DEFAULT_COMMAND_TIMEOUT_MS, MAX_OBSERVATION_ELEMENTS } from './protocol.ts'
import { PhoneDevices } from './registry.ts'
import { PhoneRemote } from './remote.ts'
import { registerTools } from './tools.ts'

export { PhoneDevices } from './registry.ts'
export { PhoneRemote } from './remote.ts'
export { confirmRisk, refusalOf } from './consent.ts'
export type { RiskRefusal } from './consent.ts'
export { PhoneUseError } from './types.ts'
export type { PhoneAttachId, PhoneCommandId, PhoneDeviceId, PhoneUseErrorCode } from './types.ts'
export * from './protocol.ts'

/** Plugin configuration. */
export interface Config {
  /** Deadline for one engine command; the Host cancels and fails it after this. */
  commandTimeoutMs: number
  /** Most elements one observation asks for. */
  observeMaxElements: number
  /** Most element lines either tool renders back to the model. */
  maxRenderElements: number
}

/** Validated configuration with deployment defaults. */
export const Config: Schema<Config> = Schema.object({
  commandTimeoutMs: Schema.number().step(1).min(1000).max(120_000).default(DEFAULT_COMMAND_TIMEOUT_MS),
  observeMaxElements: Schema.number().step(1).min(1).max(MAX_OBSERVATION_ELEMENTS).default(80),
  maxRenderElements: Schema.number().step(1).min(1).max(200).default(40),
})

export const name = 'phone-use'
export const inject = ['tools']

/**
 * Mount the Remote namespace and both tools.
 * @param ctx - Host context with the tool registry and the Typert registry.
 * @param config - validated command deadline and rendering bounds.
 */
export function apply(ctx: Context, config: Config): void {
  const registry = new PhoneDevices({ commandTimeoutMs: config.commandTimeoutMs })
  ctx.effect(() => () => {
    registry.dispose()
  })
  // The service registers its own namespace on construction.
  new PhoneRemote(ctx, registry)
  registerTools(ctx, registry, config)
}
