/**
 * The account most recently verified by auth_service on this Host. Desktop
 * runs one Host per signed-in person, so Host plugins that scope data by
 * person read it here instead of from a browser request.
 */

import type { SessionUser, VerifyOutcome } from './types.ts'

/** Current account state as last observed by the gateway. */
export type CurrentAccount =
  | { readonly status: 'signed-in'; readonly user: SessionUser }
  | { readonly status: 'signed-out' }
  | { readonly status: 'unknown' }

/** Listener for account changes. */
export type AccountListener = (account: CurrentAccount) => void

/**
 * `ctx.tomatoAccount`: the read side of the Host's verified account. The
 * state changes only when the gateway verifies a browser session or learns
 * that the browser has none (a logout, or a session request without a
 * session); an `unavailable` verification keeps the previous state, because
 * auth_service being unreachable decides nothing about who is signed in.
 */
export interface TomatoAccount {
  /**
   * Read the current account.
   * @returns `signed-in` with the verified user, `signed-out`, or `unknown` before any verification.
   */
  current(): CurrentAccount
  /**
   * Subscribe to account changes.
   * @param listener - called with each new account state; listener failures are contained.
   * @returns the disposer that removes the listener.
   */
  watch(listener: AccountListener): () => void
}

/** Gateway-owned account record; only the gateway's verification and sign-out paths write it. */
export class AccountState implements TomatoAccount {
  private value: CurrentAccount = { status: 'unknown' }
  private readonly listeners = new Set<AccountListener>()

  current(): CurrentAccount {
    return this.value
  }

  watch(listener: AccountListener): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /**
   * The read-only view published as `ctx.tomatoAccount`.
   * @returns an object exposing only `current` and `watch`.
   */
  view(): TomatoAccount {
    return { current: () => this.current(), watch: listener => this.watch(listener) }
  }

  /**
   * Record one auth_service verification.
   * @param outcome - the verification result.
   */
  observe(outcome: VerifyOutcome): void {
    switch (outcome.kind) {
      case 'valid':
        this.set({ status: 'signed-in', user: outcome.user })
        return
      case 'invalid':
        this.set({ status: 'signed-out' })
        return
      case 'unavailable':
        return
      /* v8 ignore next 2 -- VerifyOutcome is closed and every member is handled above */
      default:
        throw new TypeError(`unknown verification outcome: ${String((outcome as { kind: unknown }).kind)}`)
    }
  }

  /** Record a logout. */
  signOut(): void {
    this.set({ status: 'signed-out' })
  }

  /** Publish a changed state; an equal state publishes nothing. */
  private set(next: CurrentAccount): void {
    if (sameAccount(this.value, next)) return
    this.value = next
    for (const listener of [...this.listeners]) {
      try {
        listener(next)
      } catch (_error: unknown) {
        // A failing subscriber must not undo the recorded state or starve later subscribers.
      }
    }
  }
}

/** Whether two states name the same account with the same public fields. */
function sameAccount(left: CurrentAccount, right: CurrentAccount): boolean {
  if (left.status !== right.status) return false
  if (left.status !== 'signed-in' || right.status !== 'signed-in') return true
  const [a, b] = [left.user, right.user]
  return a.id === b.id && a.email === b.email && a.name === b.name && a.avatarUrl === b.avatarUrl && a.language === b.language
}
