// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Cookie jar entries the fake partition returns. */
const jar = new Map<string, string>()

/** Windows the auth module opened, newest last. */
const windows: FakeWindow[] = []

/** Navigation listeners registered per window. */
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

  constructor(readonly options: { webPreferences: { partition: string } }) {}

  isDestroyed(): boolean { return this.destroyed }
  show(): void { this.shown = true }
  focus(): void { this.focused = true }
  destroy(): void {
    this.destroyed = true
    for (const listener of this.listeners.get('closed') ?? []) listener({}, '')
  }
  once(name: string, listener: () => void): void {
    this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener as unknown as Listener])
  }
  async loadURL(url: string): Promise<void> {
    this.currentUrl = url
  }
  currentUrl = ''

  /** Fire one navigation, as Electron does after the page commits. */
  navigate(url: string): void {
    this.currentUrl = url
    for (const listener of this.listeners.get('did-navigate') ?? []) listener({}, url)
  }
}

/** Fresh userData per test so stored tokens never leak between cases. */
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
          const value = jar.get(name)
          return value === undefined ? [] : [{ name, value }]
        },
      },
      clearStorageData: async () => undefined,
    }),
  },
}))

/**
 * Load the module fresh so its module-level state matches this test.
 * @returns the auth factory and the env it should read.
 */
async function load() {
  vi.resetModules()
  const module = await import('../src/tomato-auth.ts')
  return module
}

const ENV = { TOMATO_AUTH_URL: 'http://auth.test', TOMATO_WEB_URL: 'http://web.test' }

beforeEach(async () => {
  jar.clear()
  windows.length = 0
  const { mkdtempSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  userData = mkdtempSync(join(tmpdir(), 'tomato-auth-'))
  vi.stubGlobal('fetch', vi.fn())
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('desktop Feishu authentication', () => {
  it('opens the hosted start page and reports a waiting attempt', async () => {
    const { desktopTomatoAuth } = await load()
    const auth = desktopTomatoAuth(async () => undefined, ENV)
    vi.mocked(fetch).mockRejectedValue(new Error('no request expected yet'))
    const state = await auth.start()
    expect(state.attempt?.phase).toBe('waiting-browser')
    expect(state.attempt?.authorizeUrl).toBe('http://web.test/api/auth/feishu/start')
    expect(windows).toHaveLength(1)
    expect(windows[0]?.currentUrl).toBe('http://web.test/api/auth/feishu/start')
    expect(state.status).toBe('signed-out')
    await auth.cancel(state.attempt!.id)
  })

  it('stores the exchanged token and writes it into the Host credential store', async () => {
    vi.useFakeTimers()
    const { desktopTomatoAuth } = await load()
    const invoke = vi.fn(async () => undefined)
    const auth = desktopTomatoAuth(invoke, ENV)
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ valid: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: 'desktop-token' }), { status: 200 }))
    const started = auth.start()
    jar.set('session_id', 'session-abc')
    await vi.advanceTimersByTimeAsync(900)
    const state = await started
    await vi.waitFor(async () => { expect((await auth.state()).attempt?.phase).toBe('succeeded') }, { timeout: 2000 })
    expect(invoke).toHaveBeenCalledWith({ namespace: 'credentials', method: 'set', args: { ref: 'TOMATO_RELAY_API_KEY', value: 'desktop-token' } })
    expect((await auth.state()).status).toBe('credential-stored')
    expect(windows[0]?.destroyed).toBe(true)
    expect(state.attempt?.phase).toBe('waiting-browser')
  })

  it('ignores a cookie the login service rejects', async () => {
    vi.useFakeTimers()
    const { desktopTomatoAuth } = await load()
    const auth = desktopTomatoAuth(async () => undefined, ENV)
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ valid: false }), { status: 200 }))
    void auth.start()
    jar.set('session_id', 'stale')
    await vi.advanceTimersByTimeAsync(2000)
    expect((await auth.state()).status).toBe('signed-out')
    expect((await auth.state()).attempt?.phase).toBe('waiting-browser')
    await auth.cancel((await auth.state()).attempt!.id)
  })

  it('falls back to the session id when the login service has no desktop endpoint', async () => {
    vi.useFakeTimers()
    const { desktopTomatoAuth } = await load()
    const invoke = vi.fn(async () => undefined)
    const auth = desktopTomatoAuth(invoke, ENV)
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ valid: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response('', { status: 404 }))
    void auth.start()
    jar.set('session_id', 'session-abc')
    await vi.advanceTimersByTimeAsync(900)
    await vi.waitFor(async () => { expect((await auth.state()).attempt?.phase).toBe('succeeded') }, { timeout: 2000 })
    expect(invoke).toHaveBeenCalledWith({ namespace: 'credentials', method: 'set', args: { ref: 'TOMATO_RELAY_API_KEY', value: 'session-abc' } })
  })

  it.each([
    ['http://web.test/login?error=feishu_denied', 'denied'],
    ['http://web.test/login?error=feishu_email_missing', 'email-missing'],
    ['http://web.test/login?error=feishu_failed', 'failed'],
    ['http://web.test/login', 'failed'],
  ] as const)('maps the BFF failure %s to %s', async (url, feishuFailure) => {
    const { desktopTomatoAuth } = await load()
    const auth = desktopTomatoAuth(async () => undefined, ENV)
    void auth.start()
    windows[0]?.navigate(url)
    await vi.waitFor(async () => { expect((await auth.state()).attempt?.phase).toBe('failed') }, { timeout: 2000 })
    expect((await auth.state()).attempt?.feishuFailure).toBe(feishuFailure)
    expect(windows[0]?.destroyed).toBe(true)
  })

  it('clears the stored token on sign-out', async () => {
    const { desktopTomatoAuth } = await load()
    const invoke = vi.fn(async () => undefined)
    const auth = desktopTomatoAuth(invoke, ENV)
    const signedOut = await auth.signOut()
    expect(signedOut.status).toBe('signed-out')
    expect(invoke).toHaveBeenCalledWith({ namespace: 'credentials', method: 'unset', args: { ref: 'TOMATO_RELAY_API_KEY' } })
  })
})
