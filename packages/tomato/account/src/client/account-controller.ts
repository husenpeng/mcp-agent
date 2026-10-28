/** React-free account state over the gateway's same-origin auth routes. */

import { createSnapshotStore, type SnapshotStore } from '@deepseek-ai/dsh-client-store'

/** User fields the account surface renders. */
export interface AccountUser {
  readonly id: string
  readonly email: string
  readonly name: string | null
  readonly avatarUrl: string | null
}

/** Three-state account projection plus transient notices. */
export interface AccountSnapshot {
  readonly status: 'loading' | 'signed-in' | 'signed-out' | 'unavailable'
  readonly user: AccountUser | null
  readonly busy: boolean
  readonly notice: 'loginFailed' | 'remoteUnconfirmed' | 'signoutFailed' | null
}

/** Desktop-owned commands exposed through the preload bridge. */
export interface DesktopAccountBridge {
  /** Open the native consent/sign-in entry. */
  openSignIn(): Promise<void>
  /** Clear the stored session and refresh the workspace state. */
  signOut(): Promise<void>
  /** @param listener - account-change recipient. @returns subscription disposer. */
  subscribe(listener: () => void): () => void
}

/** Read the optional Desktop bridge without assuming a Desktop runtime. */
function desktopBridge(): DesktopAccountBridge | undefined {
  if (typeof globalThis === 'undefined') return undefined
  const page = globalThis as { dshDesktop?: { account?: DesktopAccountBridge } }
  const account = page.dshDesktop?.account
  if (account === undefined) return undefined
  if (typeof account.openSignIn !== 'function' || typeof account.signOut !== 'function'
    || typeof account.subscribe !== 'function') return undefined
  return account
}

/** Decode one untrusted `/api/auth/session` body. */
function userOf(value: unknown): AccountUser | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const record = value as Record<string, unknown>
  const id = record.id
  const email = record.email
  const name = record.name
  const avatarUrl = record.avatarUrl
  if (typeof id !== 'string' || id === '' || typeof email !== 'string' || email === '') return undefined
  if (name !== null && name !== undefined && typeof name !== 'string') return undefined
  if (avatarUrl !== null && avatarUrl !== undefined && typeof avatarUrl !== 'string') return undefined
  return {
    id,
    email,
    name: typeof name === 'string' ? name : null,
    avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : null,
  }
}

/** Own the snapshot, login entry, sign-out, and pushed refresh signals. */
export class AccountController {
  /** Observable account state bound by the slot renderer. */
  readonly store: SnapshotStore<AccountSnapshot> = createSnapshotStore<AccountSnapshot>({
    status: 'loading', user: null, busy: false, notice: null,
  })

  private disposed = false
  private readonly desktop = desktopBridge()
  private readonly disposers: (() => void)[] = []

  /** Read the gateway projection on mount and on focus. */
  constructor() {
    if (typeof window !== 'undefined') {
      const onFocus = (): void => { void this.refresh() }
      window.addEventListener('focus', onFocus)
      this.disposers.push(() => { window.removeEventListener('focus', onFocus) })
      const onMessage = (event: MessageEvent): void => {
        if (event.origin !== window.location.origin) return
        const data: unknown = event.data
        if (typeof data !== 'object' || data === null) return
        const message = data as { type?: unknown; ok?: unknown }
        if (message.type !== 'tomato-auth-result') return
        if (message.ok === true) { void this.refresh() }
        else this.update({ notice: 'loginFailed' })
      }
      window.addEventListener('message', onMessage)
      this.disposers.push(() => { window.removeEventListener('message', onMessage) })
    }
    if (this.desktop !== undefined) {
      this.disposers.push(this.desktop.subscribe(() => { void this.refresh() }))
    }
  }

  /** Merge one partial snapshot. */
  private update(change: Partial<AccountSnapshot>): void {
    if (this.disposed) return
    this.store.update((draft) => { Object.assign(draft, change) })
  }

  /**
   * Read the gateway projection. `quiet` keeps the previous status during a
   * focus or pushed refresh so the launcher does not flash.
   * @param quiet - whether to keep the current status while reading.
   */
  async refresh(quiet = true): Promise<void> {
    if (this.disposed) return
    if (!quiet) this.update({ status: 'loading' })
    try {
      const response = await fetch('api/auth/session', {
        credentials: 'include',
        cache: 'no-store',
        headers: { accept: 'application/json' },
      })
      if (response.status === 503) {
        this.update({ status: 'unavailable', user: null })
        return
      }
      const body: unknown = await response.json().catch(() => undefined)
      if (!response.ok || typeof body !== 'object' || body === null) {
        this.update({ status: 'unavailable', user: null })
        return
      }
      const record = body as { status?: unknown; user?: unknown }
      if (record.status === 'signed-in') {
        const user = userOf(record.user)
        this.update(user === undefined
          ? { status: 'unavailable', user: null }
          : { status: 'signed-in', user, notice: null })
        return
      }
      this.update({ status: record.status === 'signed-out' ? 'signed-out' : 'unavailable', user: null })
    } catch {
      this.update({ status: 'unavailable', user: null })
    }
  }

  /** Start the Web popup or hand off to the Desktop welcome entry. */
  async startSignIn(): Promise<void> {
    if (this.disposed) return
    if (this.desktop !== undefined) {
      this.update({ busy: true, notice: null })
      try { await this.desktop.openSignIn() }
      catch { this.update({ notice: 'loginFailed' }) }
      finally { this.update({ busy: false }) }
      return
    }
    if (typeof window === 'undefined') return
    const popup = window.open('api/auth/start', 'tomato-auth', 'popup,width=520,height=720')
    if (popup === null) {
      window.location.assign('api/auth/start')
      return
    }
    popup.focus()
  }

  /** Revoke the gateway session, clear local state, and refresh the projection. */
  async signOut(): Promise<void> {
    if (this.disposed) return
    this.update({ busy: true, notice: null })
    try {
      if (this.desktop !== undefined) {
        await this.desktop.signOut()
      } else {
        const response = await fetch('api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
        })
        if (!response.ok) {
          this.update({ notice: 'signoutFailed' })
          return
        }
        const body: unknown = await response.json().catch(() => undefined)
        const remoteRevoked = typeof body === 'object' && body !== null
          && (body as { remoteRevoked?: unknown }).remoteRevoked === true
        if (!remoteRevoked) this.update({ notice: 'remoteUnconfirmed' })
      }
      await this.refresh(true)
    } catch {
      this.update({ notice: 'signoutFailed' })
    } finally {
      this.update({ busy: false })
    }
  }

  /** Clear the one-shot notice. */
  dismissNotice(): void {
    this.update({ notice: null })
  }

  /** Release browser and Desktop listeners. */
  dispose(): void {
    this.disposed = true
    for (const dispose of this.disposers.splice(0)) dispose()
  }
}
