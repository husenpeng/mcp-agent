/**
 * Tomato desktop authentication: browser sign-in against the company login
 * service, a token exchange, and the local credential copy.
 *
 * The shell never parses the token; it stores an encrypted copy so the welcome
 * flow can answer "signed in?" before the Host is reached, and writes the value
 * into the Host's credential store through the authenticated RPC channel so the
 * model relay route resolves it per request.
 */

import { createHash, randomUUID } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { app, safeStorage } from 'electron'
import type { AccountLinks, AccountView, SignInAttemptView } from '@deepseek-ai/dsh-deepseek-account/types'

/** Credential reference the model relay route resolves; kept in step with the base bundle. */
export const TOKEN_CREDENTIAL_REF = 'TOMATO_RELAY_API_KEY'

/** Base URL of the company login service; the local mock serves the same routes. */
export function authBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  return (env.TOMATO_AUTH_URL ?? 'http://127.0.0.1:4010').replace(/\/+$/u, '')
}

/** Links the account menu may open; placeholder destinations until the web accounts exist. */
const LINKS: AccountLinks = {
  usageUrl: 'http://127.0.0.1:4010/account/usage',
  topUpUrl: 'http://127.0.0.1:4010/account/usage',
}

/** Operations the welcome window and the account state stream need. */
export interface DesktopTomatoAuth {
  /** @returns the current account snapshot. */
  state(): Promise<AccountView>
  /** @param client - ignored; the company login flow needs no client metadata. @returns the started attempt. */
  start(client?: unknown): Promise<AccountView>
  /** @param id - attempt to abandon. @returns the settled state. */
  cancel(id: string): Promise<AccountView>
  /** @returns the signed-out state after removing the local token. */
  signOut(): Promise<AccountView>
  /**
   * @param listener - state recipient.
   * @param failed - transport-failure recipient (unused: the token store is local).
   * @param expired - credential-expiry recipient (unused for the same reason).
   * @param onPolicyChange - optional collection-policy recipient.
   * @returns subscription disposer.
   */
  watch(
    listener: (state: AccountView) => void,
    failed: () => void,
    expired: () => void,
    onPolicyChange?: (enabled: boolean) => void,
  ): () => void
}

/** Token persistence: one encrypted file under Electron's userData. */
class TokenStore {
  private readonly path = join(app.getPath('userData'), 'tomato-auth.json')
  private cached: string | null | undefined

  /** @returns the stored token, or null when absent or unreadable. */
  read(): string | null {
    if (this.cached !== undefined) return this.cached
    this.cached = this.load()
    return this.cached
  }

  /** @param token - credential to persist. */
  write(token: string): void {
    mkdirSync(dirname(this.path), { recursive: true, mode: 0o700 })
    const payload = safeStorage.isEncryptionAvailable()
      ? { encrypted: true, value: safeStorage.encryptString(token).toString('base64') }
      : { encrypted: false, value: token }
    writeFileSync(this.path, JSON.stringify(payload), { mode: 0o600 })
    this.cached = token
  }

  /** Remove the stored token, tolerating an absent file. */
  clear(): void {
    try { writeFileSync(this.path, '', { mode: 0o600 }) } catch { /* best effort */ }
    this.cached = null
  }

  private load(): string | null {
    if (!existsSync(this.path)) return null
    try {
      const parsed: unknown = JSON.parse(readFileSync(this.path, 'utf8'))
      if (typeof parsed !== 'object' || parsed === null) return null
      const record = parsed as { encrypted?: unknown; value?: unknown }
      if (typeof record.value !== 'string' || record.value === '') return null
      if (record.encrypted !== true) return record.value
      return safeStorage.decryptString(Buffer.from(record.value, 'base64'))
    } catch {
      return null
    }
  }
}

/** One in-flight browser sign-in. */
interface PendingSignIn {
  readonly id: string
  readonly server: Server
  readonly nonce: string
  cancelled: boolean
}

/**
 * Build the desktop authentication backend.
 * @param invoke - authenticated Host RPC caller used to write the token into the credential store.
 * @param env - process environment supplying the login-service base URL.
 * @returns sign-in operations and the account state stream.
 */
export function desktopTomatoAuth(
  invoke: (request: { namespace: string; method: string; args: Record<string, unknown> }) => Promise<unknown>,
  env: NodeJS.ProcessEnv = process.env,
): DesktopTomatoAuth {
  const store = new TokenStore()
  const listeners = new Set<(state: AccountView) => void>()
  let pending: PendingSignIn | undefined
  let attempt: SignInAttemptView | null = null

  const snapshot = (): AccountView => ({
    status: store.read() === null ? 'signed-out' : 'credential-stored',
    links: LINKS,
    attempt,
  })
  const publish = (): void => {
    const state = snapshot()
    for (const listener of listeners) listener(state)
  }
  const settle = (next: SignInAttemptView | null): void => {
    attempt = next
    publish()
  }

  async function exchange(code: string): Promise<void> {
    const response = await fetch(`${authBaseUrl(env)}/desktop/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) throw new Error(`token exchange failed with HTTP ${String(response.status)}`)
    const body: unknown = await response.json()
    if (typeof body !== 'object' || body === null || typeof (body as { token?: unknown }).token !== 'string') {
      throw new Error('token exchange returned no token')
    }
    const token = (body as { token: string }).token
    store.write(token)
    await invoke({ namespace: 'credentials', method: 'set', args: { ref: TOKEN_CREDENTIAL_REF, value: token } })
  }

  function finish(pendingSignIn: PendingSignIn, code: string | null, failure: string | null): void {
    pendingSignIn.server.close()
    if (pending === pendingSignIn) pending = undefined
    if (pendingSignIn.cancelled) { settle({ id: attemptId(pendingSignIn.id), phase: 'cancelled' }); return }
    if (code === null) {
      settle({ id: attemptId(pendingSignIn.id), phase: 'failed', errorCode: failure === 'expired' ? 'expired' : 'protocol' })
      return
    }
    settle({ id: attemptId(pendingSignIn.id), phase: 'committing' })
    void exchange(code).then(() => {
      settle({ id: attemptId(pendingSignIn.id), phase: 'succeeded' })
    }).catch(() => {
      settle({ id: attemptId(pendingSignIn.id), phase: 'failed', errorCode: 'network' })
    })
  }

  async function start(): Promise<AccountView> {
    if (pending !== undefined) return snapshot()
    const nonce = createHash('sha256').update(randomUUID()).digest('hex')
    const server = createServer((request, response) => {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1')
      if (url.pathname !== '/callback') { response.writeHead(404).end(); return }
      const active = pending
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      response.end('<!doctype html><meta charset="utf-8"><title>Tomato Harness</title><p>Sign-in complete. You can close this window.')
      if (active === undefined || url.searchParams.get('state') !== active.nonce) return
      const error = url.searchParams.get('error')
      finish(active, error === null ? url.searchParams.get('code') : null, error)
    })
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', () => { resolve() })
    })
    const address = server.address()
    if (address === null || typeof address === 'string') {
      server.close()
      throw new Error('desktop auth: loopback listener has no port')
    }
    const created: PendingSignIn = { id: randomUUID(), server, nonce, cancelled: false }
    pending = created
    const redirect = `http://127.0.0.1:${String(address.port)}/callback`
    const authorizeUrl = `${authBaseUrl(env)}/desktop/authorize?redirect_uri=${encodeURIComponent(redirect)}&state=${nonce}`
    attempt = { id: attemptId(created.id), phase: 'waiting-browser', authorizeUrl, expiresAt: Date.now() + 600_000 }
    publish()
    return snapshot()
  }

  return {
    state: () => Promise.resolve(snapshot()),
    start,
    cancel(rawId) {
      const id = rawId as SignInAttemptView['id']
      if (pending !== undefined && attemptId(pending.id) === id) {
        pending.cancelled = true
        pending.server.close()
        pending = undefined
      }
      settle({ id, phase: 'cancelled' })
      return Promise.resolve(snapshot())
    },
    async signOut() {
      store.clear()
      await invoke({ namespace: 'credentials', method: 'unset', args: { ref: TOKEN_CREDENTIAL_REF } }).catch(() => undefined)
      pending?.server.close()
      pending = undefined
      settle(null)
      return snapshot()
    },
    watch(listener, _failed, _expired, onPolicyChange) {
      listeners.add(listener)
      onPolicyChange?.(false)
      listener(snapshot())
      return () => { listeners.delete(listener) }
    },
  }
}

/** Brand a raw attempt id for the wire type. */
function attemptId(value: string): SignInAttemptView['id'] {
  return value as SignInAttemptView['id']
}
