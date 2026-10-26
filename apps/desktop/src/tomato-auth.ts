/**
 * Tomato desktop authentication through the company Feishu sign-in.
 *
 * The shell opens the BFF's Feishu start page in an isolated Electron window,
 * waits for the BFF to place its `session_id` cookie in that window's partition,
 * and exchanges the cookie for a desktop token. The token never reaches the
 * renderer: it is encrypted into `userData` and written to the Host credential
 * store, where the model relay route resolves it per request.
 *
 * The sign-in window is the company login page itself, so the Feishu application
 * needs no loopback redirect URI and the desktop holds no Feishu secrets.
 */

import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { app, BrowserWindow, safeStorage, session } from 'electron'
import type { AccountLinks, SignInAttemptView } from '@deepseek-ai/dsh-deepseek-account/types'
import type { WelcomeAccountView, WelcomeFeishuFailure, WelcomeSignInAttempt } from './welcome-api.ts'

/** Credential reference the model relay route resolves; kept in step with the base bundle. */
export const TOKEN_CREDENTIAL_REF = 'TOMATO_RELAY_API_KEY'

/** Base URL of the company login service. */
export function authBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  return (env.TOMATO_AUTH_URL ?? 'http://127.0.0.1:4010').replace(/\/+$/u, '')
}

/** Base URL of the company web application that hosts the Feishu BFF routes. */
export function webBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  return (env.TOMATO_WEB_URL ?? 'https://test.tomatoai.vip').replace(/\/+$/u, '')
}

/** Name of the opaque session cookie the BFF issues. */
const SESSION_COOKIE = 'session_id'

/** How long one sign-in attempt may stay open before it expires. */
const ATTEMPT_TIMEOUT_MS = 10 * 60 * 1000

/** Cookie poll interval while the sign-in window is open. */
const COOKIE_POLL_MS = 750

/** Links the account menu may open; the company web app owns account pages. */
function links(env: NodeJS.ProcessEnv): AccountLinks {
  const web = webBaseUrl(env)
  return { usageUrl: `${web}/account/usage`, topUpUrl: `${web}/account/usage` }
}

/** Operations the welcome window and the account state stream need. */
export interface DesktopTomatoAuth {
  /** @returns the current account snapshot. */
  state(): Promise<WelcomeAccountView>
  /** @param client - ignored; the Feishu flow needs no client metadata. @returns the started attempt. */
  start(client?: unknown): Promise<WelcomeAccountView>
  /** @param id - attempt to abandon. @returns the settled state. */
  cancel(id: string): Promise<WelcomeAccountView>
  /** @returns the signed-out state after removing the local token. */
  signOut(): Promise<WelcomeAccountView>
  /** @returns the sign-in window currently owning the attempt, for focus and lifecycle. */
  window(): BrowserWindow | undefined
  /**
   * @param listener - state recipient.
   * @param failed - transport-failure recipient (unused: the token store is local).
   * @param expired - credential-expiry recipient (unused for the same reason).
   * @param onPolicyChange - optional collection-policy recipient.
   * @returns subscription disposer.
   */
  watch(
    listener: (state: WelcomeAccountView) => void,
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

/** One in-flight Feishu sign-in. */
interface PendingSignIn {
  readonly id: string
  readonly window: BrowserWindow
  readonly partition: string
  poll?: ReturnType<typeof setInterval>
  timeout?: ReturnType<typeof setTimeout>
  cancelled: boolean
  settled: boolean
}

/** A verified desktop credential. */
interface ExchangeResult {
  readonly token: string
}

/**
 * Build the desktop authentication backend.
 * @param invoke - authenticated Host RPC caller used to write the token into the credential store.
 * @param env - process environment supplying the login-service and web base URLs.
 * @returns sign-in operations and the account state stream.
 */
export function desktopTomatoAuth(
  invoke: (request: { namespace: string; method: string; args: Record<string, unknown> }) => Promise<unknown>,
  env: NodeJS.ProcessEnv = process.env,
): DesktopTomatoAuth {
  const store = new TokenStore()
  const listeners = new Set<(state: WelcomeAccountView) => void>()
  let pending: PendingSignIn | undefined
  let attempt: WelcomeSignInAttempt | null = null

  const snapshot = (): WelcomeAccountView => ({
    status: store.read() === null ? 'signed-out' : 'credential-stored',
    links: links(env),
    attempt,
  })
  const publish = (): void => {
    const state = snapshot()
    for (const listener of listeners) listener(state)
  }
  const settle = (next: WelcomeSignInAttempt | null): void => {
    attempt = next
    publish()
  }

  /**
   * Confirm the cookie names a live session and return its user, so a stale or
   * forged cookie never becomes a stored credential.
   * @param sessionId - value read from the sign-in window's cookie jar.
   * @returns whether the login service accepted the session.
   */
  async function verifySession(sessionId: string): Promise<boolean> {
    const response = await fetch(`${authBaseUrl(env)}/api/v1/auth/session/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) return false
    const body: unknown = await response.json()
    return typeof body === 'object' && body !== null && (body as { valid?: unknown }).valid === true
  }

  /**
   * Exchange the BFF session for a desktop token. A deployment without the
   * desktop endpoint yet answers 404; the session id then stands in as the
   * credential so sign-in still works, and the caller logs that degradation.
   * @param sessionId - verified BFF session cookie value.
   * @returns the credential to store.
   */
  async function exchange(sessionId: string): Promise<ExchangeResult> {
    const response = await fetch(`${authBaseUrl(env)}/api/v1/auth/desktop/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId }),
      signal: AbortSignal.timeout(15_000),
    })
    if (response.status === 404 || response.status === 405) {
      console.warn('desktop auth: the login service has no desktop token endpoint; storing the session id as the credential')
      return { token: sessionId }
    }
    if (!response.ok) throw new Error(`desktop token exchange failed with HTTP ${String(response.status)}`)
    const body: unknown = await response.json()
    if (typeof body !== 'object' || body === null || typeof (body as { token?: unknown }).token !== 'string'
      || (body as { token: string }).token === '') {
      throw new Error('desktop token exchange returned no token')
    }
    return { token: (body as { token: string }).token }
  }

  /** Discard one attempt's window and its storage partition without awaiting. */
  function disposeAttempt(target: PendingSignIn): void {
    if (target.poll !== undefined) clearInterval(target.poll)
    if (target.timeout !== undefined) clearTimeout(target.timeout)
    if (!target.window.isDestroyed()) target.window.destroy()
    void session.fromPartition(target.partition).clearStorageData().catch(() => undefined)
  }

  /**
   * Settle one attempt exactly once.
   * @param target - the attempt being finished.
   * @param sessionId - verified cookie value, or null when the attempt failed.
   * @param failure - why the attempt failed, when it did.
   */
  function finish(target: PendingSignIn, sessionId: string | null, failure: 'expired' | 'protocol' | 'network', feishuFailure?: WelcomeFeishuFailure): void {
    if (target.settled) return
    target.settled = true
    if (pending === target) pending = undefined
    disposeAttempt(target)
    if (target.cancelled) { settle({ id: attemptId(target.id), phase: 'cancelled' }); return }
    if (sessionId === null) {
      settle({ id: attemptId(target.id), phase: 'failed', errorCode: failure,
        ...feishuFailure === undefined ? {} : { feishuFailure } })
      return
    }
    settle({ id: attemptId(target.id), phase: 'committing' })
    void exchange(sessionId).then(async ({ token }) => {
      store.write(token)
      await invoke({ namespace: 'credentials', method: 'set', args: { ref: TOKEN_CREDENTIAL_REF, value: token } })
        .catch((error: unknown) => { console.warn('desktop auth: credential write failed', error) })
      settle({ id: attemptId(target.id), phase: 'succeeded' })
    }).catch(() => {
      settle({ id: attemptId(target.id), phase: 'failed', errorCode: 'network' })
    })
  }

  /** Watch one attempt's window for a finished sign-in. */
  function watch(target: PendingSignIn): void {
    const jar = session.fromPartition(target.partition)
    const origin = webBaseUrl(env)
    const poll = setInterval(() => {
      if (target.settled) return
      void jar.cookies.get({ url: origin, name: SESSION_COOKIE }).then(async (cookies) => {
        const value = cookies[0]?.value
        if (value === undefined || value === '' || target.settled) return
        if (!await verifySession(value)) return
        finish(target, value, 'protocol')
      }).catch(() => undefined)
    }, COOKIE_POLL_MS)
    target.poll = poll
    poll.unref()
  }

  async function start(): Promise<WelcomeAccountView> {
    if (pending !== undefined) {
      if (!pending.window.isDestroyed()) pending.window.focus()
      return snapshot()
    }
    const partition = `persist:tomato-auth-${randomUUID()}`
    const window = new BrowserWindow({
      width: 520,
      height: 720,
      minWidth: 420,
      minHeight: 560,
      title: 'Tomato Harness',
      autoHideMenuBar: true,
      show: false,
      webPreferences: {
        partition,
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        // A hosted sign-in page needs no Node bridge and no preload.
        webviewTag: false,
      },
    })
    window.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:\/\//u.test(url)) void window.loadURL(url)
      return { action: 'deny' }
    })
    const started: PendingSignIn = { id: randomUUID(), window, partition, cancelled: false, settled: false }
    started.timeout = setTimeout(() => { finish(started, null, 'expired') }, ATTEMPT_TIMEOUT_MS)
    pending = started
    const authorizeUrl = `${webBaseUrl(env)}/api/auth/feishu/start`
    attempt = { id: attemptId(started.id), phase: 'waiting-browser', authorizeUrl, expiresAt: Date.now() + ATTEMPT_TIMEOUT_MS }
    publish()
    // A BFF failure lands on its login page with a reason code; fail fast instead of
    // waiting out the timeout.
    window.webContents.on('did-navigate', (_event, url) => {
      // The BFF returns to its login page with a reason code when sign-in failed.
      if (url.includes('/login')) finish(started, null, 'protocol', feishuFailure(url))
    })
    window.once('ready-to-show', () => { window.show() })
    window.once('closed', () => {
      if (!started.settled) finish(started, null, 'protocol')
    })
    await window.loadURL(authorizeUrl)
    watch(started)
    return snapshot()
  }

  return {
    state: () => Promise.resolve(snapshot()),
    start,
    cancel(rawId) {
      const id = rawId as SignInAttemptView['id']
      if (pending !== undefined && attemptId(pending.id) === id) {
        pending.cancelled = true
        finish(pending, null, 'protocol')
      }
      settle({ id, phase: 'cancelled' })
      return Promise.resolve(snapshot())
    },
    async signOut() {
      store.clear()
      await invoke({ namespace: 'credentials', method: 'unset', args: { ref: TOKEN_CREDENTIAL_REF } }).catch(() => undefined)
      if (pending !== undefined) {
        pending.cancelled = true
        finish(pending, null, 'protocol')
      }
      settle(null)
      return snapshot()
    },
    window: () => pending !== undefined && !pending.window.isDestroyed() ? pending.window : undefined,
    watch(listener, _failed, _expired, onPolicyChange) {
      listeners.add(listener)
      onPolicyChange?.(false)
      listener(snapshot())
      return () => { listeners.delete(listener) }
    },
  }
}

/** Map the BFF's login-page reason code to the welcome renderer's copy key. */
function feishuFailure(url: string): WelcomeFeishuFailure {
  let parsed: URL
  try { parsed = new URL(url) } catch { return 'failed' }
  switch (parsed.searchParams.get('error')) {
    case 'feishu_denied': return 'denied'
    case 'feishu_email_missing': return 'email-missing'
    case 'feishu_failed': return 'failed'
    default: return 'failed'
  }
}

/** Brand a raw attempt id for the wire type. */
function attemptId(value: string): SignInAttemptView['id'] {
  return value as SignInAttemptView['id']
}
