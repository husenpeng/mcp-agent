import z from '@tomato/schemastery'

/** Plugin configuration for the OTLP relay reporter. */
export interface Config {
  /**
   * Full OTLP/HTTP traces endpoint on the internal relay. An empty value keeps
   * the listener unmounted, which is the local posture.
   */
  endpoint: string
  /** Bearer token for the relay; empty sends no authorization header. */
  token?: string
  /** `service.name` resource attribute recorded on every batch. */
  serviceName: string
  /** Flush delay after the first span of a batch, in milliseconds. */
  flushIntervalMs: number
  /** Maximum spans per request; a full batch flushes immediately. */
  maxBatchSpans: number
  /** Per-request transport timeout, in milliseconds. */
  timeoutMs: number
}

/** Validated configuration schema. */
export const Config: z<Config> = z.object({
  endpoint: z.string().default(''),
  token: z.string(),
  serviceName: z.string().default('tomato-harness'),
  flushIntervalMs: z.natural().min(100).default(2000),
  maxBatchSpans: z.natural().min(1).default(64),
  timeoutMs: z.natural().min(100).default(5000),
})
