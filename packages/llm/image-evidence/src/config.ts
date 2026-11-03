/**
 * Configuration resolution for the image-evidence plugin: engine routes,
 * evidence caps, and cache retention. Defaulting is explicit here so the
 * service and its tests receive one validated spec.
 * @module @tomato/image-evidence/src/config
 */

import z from '@tomato/schemastery'
import type { VisionEngineRef } from './types.ts'

/** Plugin configuration as written in the composition. */
export interface Config {
  /** Vision engines in priority order; an empty list disables the bridge. */
  engines?: VisionEngineRef[]
  /** Character cap applied to one image's evidence text. */
  maxChars?: number
  /** Evidence contract version; raising it retires every stored record. */
  contractVersion?: number
  /** Deadline for one engine call. */
  timeoutMs?: number
  /** How long one attachment stops retrying after every engine failed. */
  failureCooldownMs?: number
  /** Unused records older than this are pruned. */
  retentionDays?: number
  /** Total stored evidence bytes kept before least-recently-read records go. */
  maxCachedBytes?: number
  /** Byte cap for one `read_image` source. */
  maxImageBytes?: number
  /** Deadline for one `read_image` fetch or file read. */
  sourceTimeoutMs?: number
  /** Whether `read_image` may fetch loopback, private, or link-local URLs. */
  allowPrivateHosts?: boolean
}

/** Validated configuration with every default materialized. */
export interface ResolvedConfig {
  readonly engines: readonly VisionEngineRef[]
  readonly maxChars: number
  readonly contractVersion: number
  readonly timeoutMs: number
  readonly failureCooldownMs: number
  readonly retentionDays: number
  readonly maxCachedBytes: number
  readonly maxImageBytes: number
  readonly sourceTimeoutMs: number
  readonly allowPrivateHosts: boolean
}

const DEFAULT_MAX_CHARS = 8_000
const DEFAULT_CONTRACT_VERSION = 1
const DEFAULT_TIMEOUT_MS = 120_000
const DEFAULT_FAILURE_COOLDOWN_MS = 300_000
const DEFAULT_RETENTION_DAYS = 30
const DEFAULT_MAX_CACHED_BYTES = 64 * 1024 * 1024
const DEFAULT_MAX_IMAGE_BYTES = 25 * 1024 * 1024
const DEFAULT_SOURCE_TIMEOUT_MS = 30_000

/** Loader schema mirroring {@link Config}. */
export const Config: z<Config> = z.object({
  engines: z.array(z.object({ provider: z.string().required(), model: z.string().required() })),
  maxChars: z.number().step(1).min(200).max(200_000),
  contractVersion: z.number().step(1).min(1),
  timeoutMs: z.number().step(1).min(1),
  failureCooldownMs: z.number().step(1).min(0),
  retentionDays: z.number().step(1).min(1),
  maxCachedBytes: z.number().step(1).min(1),
  maxImageBytes: z.number().step(1).min(1),
  sourceTimeoutMs: z.number().step(1).min(1),
  allowPrivateHosts: z.boolean(),
})

/**
 * Apply defaults and refuse values the runtime cannot honor.
 * @param config - composition configuration, possibly empty.
 * @returns the validated spec with every default materialized.
 * @throws {Error} when a limit is not a positive integer or an engine is incomplete.
 */
export function resolveConfig(config: Config = {}): ResolvedConfig {
  const engines = (config.engines ?? []).map((engine, index) => {
    if (engine.provider.trim() === '' || engine.model.trim() === '') {
      throw new Error(`image-evidence: engines[${index}] needs a provider and a model`)
    }
    return { provider: engine.provider.trim(), model: engine.model.trim() }
  })
  return {
    engines,
    maxChars: positive('maxChars', config.maxChars ?? DEFAULT_MAX_CHARS),
    contractVersion: positive('contractVersion', config.contractVersion ?? DEFAULT_CONTRACT_VERSION),
    timeoutMs: positive('timeoutMs', config.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    failureCooldownMs: nonNegative('failureCooldownMs', config.failureCooldownMs ?? DEFAULT_FAILURE_COOLDOWN_MS),
    retentionDays: positive('retentionDays', config.retentionDays ?? DEFAULT_RETENTION_DAYS),
    maxCachedBytes: positive('maxCachedBytes', config.maxCachedBytes ?? DEFAULT_MAX_CACHED_BYTES),
    maxImageBytes: positive('maxImageBytes', config.maxImageBytes ?? DEFAULT_MAX_IMAGE_BYTES),
    sourceTimeoutMs: positive('sourceTimeoutMs', config.sourceTimeoutMs ?? DEFAULT_SOURCE_TIMEOUT_MS),
    allowPrivateHosts: config.allowPrivateHosts === true,
  }
}

function positive(name: string, value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`image-evidence: ${name} must be a positive integer`)
  }
  return value
}

function nonNegative(name: string, value: number): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`image-evidence: ${name} must be a non-negative integer`)
  }
  return value
}
