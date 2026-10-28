// @vitest-environment node
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Cookie jar entries the fake partition returns. */
const jar = new Map<string, string>()

/** Number of upcoming reads served as an empty jar, simulating a late Set-Cookie. */
let emptyCookieReads = 0

/** Cookies installed by the auth module into a partition. */
const installed: { url: string; name: string; value: string }[] = []

/** Windows the auth module opened, newest last. */
const windows: FakeWindow[] = []

type Listener = (event: unknown, url: string) => void

class FakeWindow {
  readonly listeners = new Map<string, Listener[]>()
  readonly webContents = {
    setWindowOpenHandler: vi.fn(),
    on: (name: string, listener: Listener) => {
      this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener])
    },
  }
  destroyed = false
  shown = false
  focused = false
  currentUrl = ''

  constructor(readonly options: { webPreferences: { partition: string } }) {}

  isDestroyed(): boolean { return this.destroyed }
  show(): void { this.shown = true }
  focus(): void { this.focused = true }
  destroy(): void {
    this.destroyed = true
    for (const listener of this.listeners.get('closed') ?? []) listener({}, '')
  }
  once(name: string, listener: () => void): void {
    this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener])
  }
  async loadURL(url: string): Promise<void> { this.currentUrl = url }

  /** Fire one committed navigation. */
  navigate(url: string): void {
    this.currentUrl = url
    for (const listener of this.listeners.get('did-navigate') ?? []) listener({}, url)
  }

  /** Fire one server-side redirect target before the navigation commits. */
  redirect(url: string): void {
    for (const listener of this.listeners.get('will-redirect') ?? []) listener({}, url)
  }
}

let userData = ''

vi.mock('electron', () => ({
  app: { getPath: () => userData },
  safeStorage: {
    isEncryptionAvailable: () => false,
    encryptString: (value: string) => Buffer.from(value),
    decryptString: (value: Buffer) => value.toString(),
  },
  BrowserWindow: class extends FakeWindow {
    constructor(options: { webPreferences: { partition: string } }) {
      super(options)
      windows.push(this)
    }
  },
  session: {
    fromPartition: () => ({
      cookies: {
        get: async ({ name }: { url: string; name: string }) => {
          if (emptyCookieReads > 0) { emptyCookieReads -= 1; return [] }
          const value = jar.get(name)
          return value === undefined ? [] : [{ name, value }]
        },
        set: async (cookie: { url: string; name: string; value: string }) => {
          installed.push({ url: cookie.url, name: cookie.name, value: cookie.value })
          return undefined
        },
      },
      clearStorageData: async () => undefined,
    }),
  },
}))

beforeEach(async () => {
  jar.clear()
  installed.length = 0
  windows.length = 0
  emptyCookieReads = 0
  userData = mkdtempSync(join(tmpdir(), 'tomato-auth-'))
})
afterEach(() => { vi.useRealTimers() })

/** Build the backend against the local gateway origin. */
function authOf(request: (input: string, init?: RequestInit) => Promise<Response> = async () => new Response(null, { status: 204 })) {
  return import('../src/tomato-auth.ts').then(({ desktopTomatoAuth }) =>
    desktopTomatoAuth({ origin: 'http://host.test', hostCookie: 'host_auth=cookie', request }))
}

describe('desktop gateway authentication', () => {
  it('opens the Host gateway start page and installs the Host cookie in its partition', async () => {
    const auth = await authOf()
    const state = await auth.start()
    expect(state.status).toBe('signed-out')
    expect(state.attempt?.phase).toBe('waiting-browser')
    expect(state.attempt?.authorizeUrl).toBe('http://host.test/api/auth/start?desktop=1')
    expect(windows).toHaveLength(1)
    expect(windows[0]?.currentUrl).toBe('http://host.test/api/auth/start?desktop=1')
    expect(installed).toEqual([{ url: 'http://host.test', name: 'host_auth', value: 'cookie' }])
    await auth.cancel(state.attempt!.id)
  })

  it('stores the gateway session cookie and reports a succeeded attempt', async () => {
    const auth = await authOf()
    await auth.start()
    jar.set('tomato_session', 'session-abc')
    windows[0]?.navigate('http://host.test/api/auth/callback?state=s&code=c')
    await vi.waitFor(async () => { expect((await auth.state()).attempt?.phase).toBe('succeeded') }, { timeout: 2000 })
    expect((await auth.state()).status).toBe('credential-stored')
    expect(auth.sessionId()).toBe('session-abc')
    expect(windows[0]?.destroyed).toBe(true)
  })

  it('does not settle on a redirect that merely targets the callback', async () => {
    const auth = await authOf()
    await auth.start()
    windows[0]?.redirect('http://host.test/api/auth/callback?state=s&code=c')
    await new Promise(resolve => setTimeout(resolve, 20))
    expect((await auth.state()).attempt?.phase).toBe('waiting-browser')
    expect(windows[0]?.destroyed).toBe(false)
    jar.set('tomato_session', 'session-abc')
    windows[0]?.navigate('http://host.test/api/auth/callback?state=s&code=c')
    await vi.waitFor(async () => { expect((await auth.state()).attempt?.phase).toBe('succeeded') }, { timeout: 2000 })
  })

  it('waits for a callback cookie that lands after the navigation commits', async () => {
    const auth = await authOf()
    await auth.start()
    jar.set('tomato_session', 'session-late')
    emptyCookieReads = 3
    windows[0]?.navigate('http://host.test/api/auth/callback?state=s&code=c')
    await vi.waitFor(async () => { expect((await auth.state()).attempt?.phase).toBe('succeeded') }, { timeout: 2000 })
    expect(auth.sessionId()).toBe('session-late')
  })

  it('maps a denied callback and stores nothing', async () => {
    const auth = await authOf()
    await auth.start()
    windows[0]?.navigate('http://host.test/api/auth/callback?state=s&error=feishu_denied')
    await vi.waitFor(async () => { expect((await auth.state()).attempt?.phase).toBe('failed') }, { timeout: 2000 })
    expect((await auth.state()).attempt?.feishuFailure).toBe('denied')
    expect((await auth.state()).status).toBe('signed-out')
    expect(auth.sessionId()).toBeUndefined()
  })

  it('clears the stored session and asks the gateway to revoke it on sign-out', async () => {
    const request = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(
      async () => new Response(JSON.stringify({ remoteRevoked: true }), { status: 200 }),
    )
    const auth = await authOf(request)
    await auth.start()
    jar.set('tomato_session', 'session-abc')
    windows[0]?.navigate('http://host.test/api/auth/callback?state=s&code=c')
    await vi.waitFor(async () => { expect((await auth.state()).status).toBe('credential-stored') }, { timeout: 2000 })
    const signedOut = await auth.signOut()
    expect(signedOut.status).toBe('signed-out')
    expect(auth.sessionId()).toBeUndefined()
    expect(request).toHaveBeenCalledOnce()
    const [url, init] = request.mock.calls[0]!
    expect(url).toBe('http://host.test/api/auth/logout')
    expect(init?.method).toBe('POST')
    const headers = new Headers(init?.headers)
    expect(headers.get('x-tomato-session')).toBe('session-abc')
    expect(headers.get('cookie')).toBe('host_auth=cookie')
  })
})
