/**
 * Tomato desktop authentication through the local gateway.
 *
 * The shell opens the Host's `/api/auth/start` in an isolated Electron window,
 * follows the company Feishu flow, and reads the gateway's `tomato_session`
 * cookie once the callback lands. The session id is encrypted into `userData`
 * and injected as `X-Tomato-Session` on forwarded Host requests; the renderer
 * never receives it.
 */

import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { app, BrowserWindow, safeStorage, session } from 'electron'
import type { AccountLinks, SignInAttemptView } from '@tomato/deepseek-account/types'
import type { WelcomeAccountView, WelcomeFeishuFailure, WelcomeSignInAttempt } from './welcome-api.ts'

/** Gateway session cookie set by `/api/auth/callback`. */
const SESSION_COOKIE = 'tomato_session'

/** How long one sign-in attempt may stay open before it expires. */
const ATTEMPT_TIMEOUT_MS = 10 * 60 * 1000

/**
 * How long the gateway cookie may take to land after the callback commits.
 * The success page closes itself immediately, so the Set-Cookie can still be
 * settling when the shell first reads the partition.
 */
const COOKIE_READ_ATTEMPTS = 20

/** Delay between cookie reads while the callback's Set-Cookie settles. */
const COOKIE_READ_INTERVAL_MS = 50

/** Company web application used for legal pages; sign-in itself goes through the Host gateway. */
export function webBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.TOMATO_WEB_URL?.trim()
  return (configured === undefined || configured === '' ? 'https://test.tomatoai.vip' : configured).replace(/\/+$/u, '')
}

/** Links the account menu may open; the company web app owns account pages. */
function links(origin: string): AccountLinks {
  return { usageUrl: `${origin}/`, topUpUrl: `${origin}/` }
}

/** Operations the welcome window and workspace account bridge need. */
export interface DesktopTomatoAuth {
  /** @returns the current account snapshot. */
  state(): Promise<WelcomeAccountView>
  /** @returns the started attempt. */
  start(): Promise<WelcomeAccountView>
  /** @param id - attempt to abandon. @returns the settled state. */
  cancel(id: string): Promise<WelcomeAccountView>
  /** @returns the signed-out state after removing the local session. */
  signOut(): Promise<WelcomeAccountView>
  /** @returns the sign-in window currently owning the attempt. */
  window(): BrowserWindow | undefined
  /** @returns the stored auth_service session id, without reading the gateway. */
  sessionId(): string | undefined
  /**
   * @param listener - state recipient.
   * @param failed - transport-failure recipient (unused: the store is local).
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

/** Constructor facts from the authenticated Host launch. */
export interface DesktopTomatoAuthOptions {
  /** Host origin that owns `/api/auth/*`. */
  origin: string
  /** Host authentication cookie (`name=value`), or null before authentication. */
  hostCookie: string | null
  /** Authenticated fetch into the Host; Electron net.fetch retains the Host cookie. */
  request: (input: string, init?: RequestInit) => Promise<Response>
}

/** Session persistence: one encrypted file under Electron's userData. */
class SessionStore {
  private readonly path = join(app.getPath('userData'), 'tomato-auth.json')
  private cached: string | null | undefined

  /** @returns the stored session id, or null when absent or unreadable. */
  read(): string | null {
    if (this.cached !== undefined) return this.cached
    this.cached = this.load()
    return this.cached
  }

  /** @param value - auth_service session id. */
  write(value: string): void {
    mkdirSync(dirname(this.path), { recursive: true, mode: 0o700 })
    const payload = safeStorage.isEncryptionAvailable()
      ? { encrypted: true, value: safeStorage.encryptString(value).toString('base64') }
      : { encrypted: false, value }
    writeFileSync(this.path, JSON.stringify(payload), { mode: 0o600 })
    this.cached = value
  }

  /** Remove the stored session, tolerating an absent file. */
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

/** One in-flight gateway sign-in. */
interface PendingSignIn {
  readonly id: string
  readonly window: BrowserWindow
  readonly partition: string
  timeout?: ReturnType<typeof setTimeout>
  cancelled: boolean
  settled: boolean
}

/** Split the Host cookie header into the one cookie Electron should install. */
function splitCookie(header: string | null): { name: string; value: string } | undefined {
  if (header === null) return undefined
  const separator = header.indexOf('=')
  if (separator <= 0) return undefined
  const value = header.slice(separator + 1).trim()
  return value === '' ? undefined : { name: header.slice(0, separator).trim(), value }
}

/** Map the gateway callback's reason to the welcome renderer's copy key. */
function failureOf(url: URL): WelcomeFeishuFailure | undefined {
  switch (url.searchParams.get('error')) {
    case 'feishu_denied': return 'denied'
    case 'feishu_email_missing': return 'email-missing'
    case 'feishu_failed': return 'failed'
    default: return undefined
  }
}

/**
 * Build the desktop authentication backend over the local gateway.
 * @param options - Host origin, Host cookie, and authenticated fetch.
 * @returns sign-in operations and the account state stream.
 */
export function desktopTomatoAuth(options: DesktopTomatoAuthOptions): DesktopTomatoAuth {
  const store = new SessionStore()
  const listeners = new Set<(state: WelcomeAccountView) => void>()
  let pending: PendingSignIn | undefined
  let attempt: WelcomeSignInAttempt | null = null

  const snapshot = (): WelcomeAccountView => ({
    status: store.read() === null ? 'signed-out' : 'credential-stored',
    links: links(options.origin),
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

  /** Discard one attempt's window and its storage partition without awaiting. */
  function disposeAttempt(target: PendingSignIn): void {
    if (target.timeout !== undefined) clearTimeout(target.timeout)
    if (!target.window.isDestroyed()) target.window.destroy()
    void session.fromPartition(target.partition).clearStorageData().catch(() => undefined)
  }

  /**
   * Settle one attempt exactly once.
   * @param target - the attempt being finished.
   * @param sessionId - verified gateway cookie value, or null when the attempt failed.
   * @param failure - why the attempt failed, when it did.
   */
  function finish(
    target: PendingSignIn,
    sessionId: string | null,
    failure: 'expired' | 'protocol' | 'network',
    feishuFailure?: WelcomeFeishuFailure,
  ): void {
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
    store.write(sessionId)
    settle({ id: attemptId(target.id), phase: 'succeeded' })
  }

  /** Read the gateway cookie, retrying while the callback's Set-Cookie settles. */
  async function waitForGatewayCookie(target: PendingSignIn): Promise<string | undefined> {
    for (let attempt = 0; attempt < COOKIE_READ_ATTEMPTS; attempt += 1) {
      const cookies = await session.fromPartition(target.partition).cookies.get({ url: options.origin, name: SESSION_COOKIE })
      const value = cookies[0]?.value
      if (value !== undefined && value !== '') return value
      if (attempt + 1 < COOKIE_READ_ATTEMPTS) {
        await new Promise((resolve) => { setTimeout(resolve, COOKIE_READ_INTERVAL_MS) })
      }
    }
    return undefined
  }

  /** Read the gateway callback's cookie and settle the attempt. */
  async function completeFromCallback(target: PendingSignIn, url: URL): Promise<void> {
    if (target.settled) return
    let value: string | undefined
    try {
      value = await waitForGatewayCookie(target)
    } catch {
      finish(target, null, 'network')
      return
    }
    if (value !== undefined) { finish(target, value, 'protocol'); return }
    finish(target, null, 'protocol', failureOf(url))
  }

  /** Watch one attempt's window for a finished sign-in. */
  function watch(target: PendingSignIn): void {
    const trackAuthorize = (url: string): void => {
      let parsed: URL
      try { parsed = new URL(url) } catch { return }
      if (attempt !== null && attempt.id === attemptId(target.id)
        && parsed.pathname === '/api/auth/feishu/start' && attempt.authorizeUrl !== url) {
        settle({ ...attempt, authorizeUrl: url })
      }
    }
    /** Only a committed navigation has received the callback's Set-Cookie. */
    const complete = (url: string): void => {
      let parsed: URL
      try { parsed = new URL(url) } catch { return }
      if (parsed.origin === options.origin && parsed.pathname === '/api/auth/callback') {
        void completeFromCallback(target, parsed)
      }
    }
    target.window.webContents.on('will-redirect', (_event, url) => { trackAuthorize(url) })
    target.window.webContents.on('did-navigate', (_event, url) => {
      trackAuthorize(url)
      complete(url)
    })
    target.window.webContents.on('did-fail-load', (_event, code) => {
      if (code === -3) return
      finish(target, null, 'network')
    })
    target.window.once('closed', () => {
      if (!target.settled) void completeFromCallback(target, new URL(`${options.origin}/api/auth/callback`))
    })
  }

  async function start(): Promise<WelcomeAccountView> {
    if (pending !== undefined) {
      if (!pending.window.isDestroyed()) pending.window.focus()
      return snapshot()
    }
    const cookie = splitCookie(options.hostCookie)
    if (cookie === undefined) throw new Error('desktop auth: Host authentication cookie is unavailable')
    const partition = `tomato-auth-${randomUUID()}`
    const window = new BrowserWindow({
      width: 520,
      height: 720,
      minWidth: 420,
      minHeight: 560,
      title: 'Tomato AI',
      autoHideMenuBar: true,
      show: false,
      webPreferences: {
        partition,
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        webviewTag: false,
      },
    })
    window.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:\/\//u.test(url)) void window.loadURL(url)
      return { action: 'deny' }
    })
    const jar = session.fromPartition(partition)
    await jar.cookies.set({
      url: options.origin,
      name: cookie.name,
      value: cookie.value,
      path: '/',
      httpOnly: true,
      secure: options.origin.startsWith('https:'),
      sameSite: 'strict',
    })
    const started: PendingSignIn = { id: randomUUID(), window, partition, cancelled: false, settled: false }
    started.timeout = setTimeout(() => { finish(started, null, 'expired') }, ATTEMPT_TIMEOUT_MS)
    started.timeout.unref()
    pending = started
    attempt = { id: attemptId(started.id), phase: 'waiting-browser',
      authorizeUrl: `${options.origin}/api/auth/start?desktop=1`, expiresAt: Date.now() + ATTEMPT_TIMEOUT_MS }
    publish()
    watch(started)
    window.once('ready-to-show', () => { window.show() })
    try {
      await window.loadURL(`${options.origin}/api/auth/start?desktop=1`)
    } catch {
      finish(started, null, 'network')
    }
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
      const sessionId = store.read()
      store.clear()
      settle(null)
      if (sessionId !== null) {
        await options.request(`${options.origin}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'x-tomato-session': sessionId,
            ...options.hostCookie === null ? {} : { cookie: options.hostCookie },
          },
          signal: AbortSignal.timeout(5000),
        }).catch(() => undefined)
      }
      return snapshot()
    },
    window: () => pending !== undefined && !pending.window.isDestroyed() ? pending.window : undefined,
    sessionId: () => store.read() ?? undefined,
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
