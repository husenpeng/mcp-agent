import z from '@tomato/schemastery'

/** Where the gateway adds the verified user id to an upstream request. */
export type UserIdInjection = 'query' | 'body' | {
  /** Request field carrying the id. */
  readonly in: 'query' | 'body'
  /** Parameter name the upstream reads. */
  readonly name: string
}

/** One browser-facing service the gateway may forward to. */
export interface ServiceEntry {
  /** Absolute HTTP(S) base URL; the browser never supplies a host. */
  baseURL: string
  /** Optional verified-user injection; the internal header is always set. */
  userIdInjection?: UserIdInjection
  /** Per-request timeout; omitted uses the gateway timeout. */
  timeoutMs?: number
  /** Buffered-body cap for body injection; omitted uses the gateway cap. */
  maxRequestBodyBytes?: number
}

/** Validated gateway configuration. */
export interface Config {
  /** auth_service base URL; empty keeps login unavailable. */
  authServiceUrl: string
  /** Company Web BFF base URL; empty keeps login unavailable. */
  companyWebUrl: string
  /** Browser-facing service table, keyed by the `service` path segment. */
  services: Record<string, ServiceEntry>
  /** Session-verification timeout, in milliseconds. */
  verifyTimeoutMs: number
  /** Generic upstream request timeout, in milliseconds. */
  requestTimeoutMs: number
  /** Buffered-body cap for services that inject a user id into JSON. */
  maxRequestBodyBytes: number
  /** Lifetime of one login attempt, in milliseconds. */
  stateTtlMs: number
}

/** Validated configuration schema. */
export const Config: z<Config> = z.object({
  authServiceUrl: z.string().default(''),
  companyWebUrl: z.string().default(''),
  services: z.dict(z.object({
    baseURL: z.string().required(),
    userIdInjection: z.union([
      z.const('query'),
      z.const('body'),
      z.object({
        in: z.union([z.const('query'), z.const('body')]).required(),
        name: z.string().required(),
      }),
    ]),
    timeoutMs: z.natural().min(100),
    maxRequestBodyBytes: z.natural().min(1),
  })).default({}),
  verifyTimeoutMs: z.natural().min(100).default(2000),
  requestTimeoutMs: z.natural().min(100).default(30000),
  maxRequestBodyBytes: z.natural().min(1).default(10 * 1024 * 1024),
  stateTtlMs: z.natural().min(1000).default(10 * 60 * 1000),
})
