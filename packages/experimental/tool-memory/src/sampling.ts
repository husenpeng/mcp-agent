/**
 * Deterministic sampling of finished tool calls for model-compressed episode
 * capture. A call's content fingerprint decides its bucket, so a retried call
 * makes the same decision; a per-Session budget bounds the captures one agent
 * may start. The deterministic observation cards are unaffected: they run for
 * every observed call and cost no model request.
 */
import { createHash } from 'node:crypto'

/** Share of eligible calls to capture and the captures one Session may start. */
export interface EpisodeSamplingPolicy {
  /** Share of eligible calls to capture, from 0 to 1. */
  readonly rate: number
  /** Most captures one Session may start; `0` means unlimited. */
  readonly budget: number
}

/** One eligible call as the sampler sees it. */
export interface EpisodeSamplingInput {
  /** Stable fingerprint of the call's tool, input, and output. */
  readonly fingerprint: string
  /** Captures already started for this Session. */
  readonly used: number
}

/** Size of the 32-bit bucket space one fingerprint maps into. */
const BUCKETS = 0x1_0000_0000

/**
 * Whether one eligible tool call should start an episode capture.
 * @param input - call fingerprint and captures already started for the Session.
 * @param policy - capture rate and per-Session budget.
 * @returns true when the Session budget allows another capture and the fingerprint falls inside the rate.
 */
export function shouldCaptureEpisode(input: EpisodeSamplingInput, policy: EpisodeSamplingPolicy): boolean {
  if (policy.rate <= 0) return false
  if (policy.budget > 0 && input.used >= policy.budget) return false
  if (policy.rate >= 1) return true
  const bucket = createHash('sha256').update(input.fingerprint).digest().readUInt32BE(0)
  return bucket / BUCKETS < policy.rate
}
