/** Small typed client for the auth_service endpoints the gateway calls. */

import type { RedeemOutcome, SessionUser, VerifyOutcome } from './types.ts'

/** One decoded auth_service user, validated at the wire boundary. */
function userOf(value: unknown): SessionUser | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const record = value as Record<string, unknown>
  if (typeof record.id !== 'string' || record.id === '') return undefined
  if (typeof record.email !== 'string' || record.email === '') return undefined
  const name = record.name
  const avatarUrl = record.avatarUrl
  const language = record.language
  if (name !== undefined && name !== null && typeof name !== 'string') return undefined
  if (avatarUrl !== undefined && avatarUrl !== null && typeof avatarUrl !== 'string') return undefined
  if (language !== undefined && language !== null && typeof language !== 'string') return undefined
  return {
    id: record.id,
    email: record.email,
    name: typeof name === 'string' ? name : null,
    avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : null,
    language: typeof language === 'string' ? language : null,
  }
}

/**
 * Call one auth_service JSON endpoint, treating transport and server failures
 * as unavailable rather than as an authentication decision.
 */
async function postJson(
  baseURL: string,
  path: string,
  body: unknown,
  timeoutMs: number,
): Promise<{ readonly ok: true; readonly status: number; readonly value: unknown } | { readonly ok: false }> {
  try {
    const response = await fetch(`${baseURL.replace(/\/+$/u, '')}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'manual',
      cache: 'no-store',
    })
    if (response.status >= 300 && response.status < 400) return { ok: false }
    const value: unknown = await response.json().catch(() => undefined)
    return { ok: true, status: response.status, value }
  } catch {
    return { ok: false }
  }
}

/** Resolve every auth_service call from one configuration snapshot. */
export class AuthService {
  /**
   * @param baseURL - auth_service base URL; empty disables every call.
   * @param verifyTimeoutMs - session-verification timeout.
   * @param requestTimeoutMs - handoff and revoke timeout.
   */
  constructor(
    readonly baseURL: string,
    private readonly verifyTimeoutMs: number,
    private readonly requestTimeoutMs: number,
  ) {}

  /**
   * Whether an auth_service base URL is configured.
   * @returns true when calls can be attempted.
   */
  configured(): boolean {
    return this.baseURL !== ''
  }

  /**
   * Verify one session and read its user.
   * @param sessionId - auth_service session id.
   * @returns valid/invalid/unavailable; never throws.
   */
  async verify(sessionId: string): Promise<VerifyOutcome> {
    if (!this.configured()) return { kind: 'unavailable' }
    const response = await postJson(this.baseURL, '/api/v1/auth/session/verify', { sessionId }, this.verifyTimeoutMs)
    if (!response.ok || response.status !== 200) return { kind: 'unavailable' }
    if (typeof response.value !== 'object' || response.value === null) return { kind: 'unavailable' }
    const record = response.value as { valid?: unknown; user?: unknown }
    if (record.valid === false) return { kind: 'invalid' }
    if (record.valid !== true) return { kind: 'unavailable' }
    const user = userOf(record.user)
    return user === undefined ? { kind: 'unavailable' } : { kind: 'valid', user }
  }

  /**
   * Revoke one session. Callers clear local state regardless of the outcome.
   * @param sessionId - auth_service session id.
   * @returns whether auth_service confirmed the revoke.
   */
  async revoke(sessionId: string): Promise<boolean> {
    if (!this.configured()) return false
    const response = await postJson(this.baseURL, '/api/v1/auth/session/revoke', { sessionId }, this.requestTimeoutMs)
    return response.ok && response.status >= 200 && response.status < 300
  }

  /**
   * Redeem a one-time handoff code with its verifier.
   * @param code - one-time code minted by auth_service for the BFF.
   * @param verifier - local gateway secret whose challenge authorized the mint.
   * @param returnTo - exact callback URL registered at mint time.
   * @returns the auth_service session id, or a refusal/unavailable outcome.
   */
  async redeem(code: string, verifier: string, returnTo: string): Promise<RedeemOutcome> {
    if (!this.configured()) return { kind: 'unavailable' }
    const response = await postJson(this.baseURL, '/api/v1/auth/handoff/redeem',
      { code, verifier, returnTo }, this.requestTimeoutMs)
    if (!response.ok) return { kind: 'unavailable' }
    if (response.status >= 400 && response.status < 500) return { kind: 'refused' }
    if (response.status < 200 || response.status >= 300) return { kind: 'unavailable' }
    if (typeof response.value !== 'object' || response.value === null) return { kind: 'unavailable' }
    const sessionId = (response.value as { sessionId?: unknown }).sessionId
    return typeof sessionId === 'string' && sessionId !== ''
      ? { kind: 'redeemed', sessionId }
      : { kind: 'unavailable' }
  }
}
