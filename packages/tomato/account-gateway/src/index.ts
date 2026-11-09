/**
 * Account provider backed by the local Feishu gateway. It projects the
 * gateway's verified browser account into the Host account seam; it owns no
 * browser session or credential and cannot mint model credentials.
 * @module @tomato/account-gateway
 */

import { randomUUID } from 'node:crypto'
import { release } from 'node:os'
import type { Context } from '@tomato/cordis'
import z from '@tomato/schemastery'
import { Account, type AccountBonusBatch, type AccountBonusOrderId, type AccountClientMetadata, type AccountEntitlements,
  type AccountUserId, type AccountView, type AccountWallet, type PlatformSession, type SignInAttemptId,
  type SignInAttemptView } from '@tomato/account-service'
import { getOrCreateAnonymousUserId } from '@tomato/anonymous-user-id'
import type { CurrentAccount } from '@tomato/gateway'

/** Provider configuration. */
export interface Config {
  /** Usage page opened from the account surface. */
  usageUrl?: string
  /** Top-up page opened from the account surface. */
  topUpUrl?: string
}

export const Config: z<Config> = z.object({
  usageUrl: z.string().default(''),
  topUpUrl: z.string().default(''),
})

type ResolvedConfig = Required<Config>

/** Plugin name used in loader diagnostics. */
export const name = 'account-gateway'

/** Wait for the gateway's verified-account view before providing `ctx.account`. */
export const inject = ['tomatoAccount']

/**
 * Read the signed-in user's platform identity.
 * @param account - current gateway account state.
 * @returns the gateway user when signed in.
 */
function isSignedIn(account: CurrentAccount): account is Extract<CurrentAccount, { status: 'signed-in' }> {
  return account.status === 'signed-in'
}

/** Project one gateway account state into the account seam's view. */
function viewOf(account: CurrentAccount, attempt: SignInAttemptView | null, config: ResolvedConfig): AccountView {
  return {
    status: isSignedIn(account) ? 'credential-stored' : 'signed-out',
    links: { usageUrl: config.usageUrl, topUpUrl: config.topUpUrl },
    attempt,
  }
}

/** Concrete account provider over the gateway's read-only account state. */
export class GatewayAccount extends Account {
  private attempt: SignInAttemptView | null = null
  private signedInState = false

  /**
   * @param ctx - context carrying `tomatoAccount`.
   * @param config - account links.
   */
  constructor(ctx: Context, private readonly config: ResolvedConfig) {
    super(ctx)
    this.signedInState = isSignedIn(ctx.tomatoAccount.current())
    ctx.tomatoAccount.watch((account) => {
      const wasSignedIn = this.signedInState
      this.signedInState = isSignedIn(account)
      if (this.attempt?.phase === 'waiting-browser') {
        this.attempt = this.signedInState
          ? { ...this.attempt, phase: 'succeeded' }
          : { ...this.attempt, phase: 'failed', errorCode: 'expired' }
      }
      if (wasSignedIn && !this.signedInState) {
        ctx.emit('account/session-expired')
        ctx.emit('account/signed-out')
      }
    })
  }

  private view(): AccountView {
    return viewOf(this.ctx.tomatoAccount.current(), this.attempt, this.config)
  }

  override async getState(): Promise<AccountView> {
    return this.view()
  }

  override async getEntitlements(): Promise<AccountEntitlements | null> {
    const account = this.ctx.tomatoAccount.current()
    if (!isSignedIn(account)) return null
    return { roles: account.user.roles ?? [], quotas: account.user.quotas ?? {} }
  }

  override async getProfile(_client: AccountClientMetadata): Promise<{
    readonly status: 'ready'
    readonly value: {
      readonly id: AccountUserId | null
      readonly name: string | null
      readonly contact: string | null
      readonly avatarUrl?: string | null
    }
  } | null> {
    const account = this.ctx.tomatoAccount.current()
    if (!isSignedIn(account)) return null
    return { status: 'ready', value: {
      id: account.user.id as AccountUserId,
      name: account.user.name,
      contact: account.user.email,
      avatarUrl: account.user.avatarUrl,
    } }
  }

  override async getBalance(_client: AccountClientMetadata): Promise<{
    readonly status: 'ready'
    readonly value: readonly AccountWallet[]
    readonly bonusWallets: readonly AccountWallet[]
  } | null> {
    return null
  }

  override async getUnnotifiedBonuses(_client: AccountClientMetadata): Promise<AccountBonusBatch | null> {
    return null
  }

  override async ackBonusNotified(_accountId: AccountUserId, _orderId: AccountBonusOrderId,
    _client: AccountClientMetadata): Promise<boolean> {
    return false
  }

  override async startSignIn(_client: AccountClientMetadata, callbackOrigin: string,
    loginSource: 'web' | 'desktop'): Promise<AccountView> {
    const id = randomUUID() as SignInAttemptId
    this.attempt = {
      id,
      phase: 'waiting-browser',
      authorizeUrl: `${callbackOrigin}/api/auth/start${loginSource === 'desktop' ? '?desktop=1' : ''}`,
    }
    return this.view()
  }

  override async cancelSignIn(id: SignInAttemptId): Promise<AccountView> {
    if (this.attempt?.id === id && this.attempt.phase === 'waiting-browser') {
      this.attempt = { ...this.attempt, phase: 'cancelled' }
    }
    return this.view()
  }

  override async signOut(_client: AccountClientMetadata): Promise<AccountView> {
    this.attempt = null
    return this.view()
  }

  override async *watch(signal: AbortSignal, _includeIdentityChanges = false): AsyncIterable<AccountView> {
    const queue: AccountView[] = [this.view()]
    let wake: (() => void) | undefined
    const listener = (account: CurrentAccount): void => {
      queue.push(viewOf(account, this.attempt, this.config))
      wake?.()
    }
    const dispose = this.ctx.tomatoAccount.watch(listener)
    try {
      while (!signal.aborted) {
        if (queue.length > 0) {
          const next = queue.shift()
          if (next === undefined) continue
          yield next
          continue
        }
        await new Promise<void>((resolve) => { wake = resolve })
        wake = undefined
      }
    } finally {
      dispose()
    }
  }

  override async resolveToken(_url: string): Promise<string | undefined> {
    return undefined
  }

  override async rejectToken(_token: string): Promise<void> {
    // The gateway owns the Feishu session; a model request cannot revoke it.
  }

  override async getPlatformSession(): Promise<PlatformSession | null> {
    return null
  }

  override async getDeviceIdentity(): Promise<{ deviceId?: string; userId?: AccountUserId; osVersion: string }> {
    const account = this.ctx.tomatoAccount.current()
    return {
      deviceId: getOrCreateAnonymousUserId(),
      ...isSignedIn(account) ? { userId: account.user.id as AccountUserId } : {},
      osVersion: release(),
    }
  }
}

/**
 * Provide `ctx.account` from the gateway's verified account.
 * @param ctx - context that has `tomatoAccount`.
 * @param config - account link destinations after defaulting.
 */
export function apply(ctx: Context, config: Config): void {
  new GatewayAccount(ctx, { usageUrl: config.usageUrl ?? '', topUpUrl: config.topUpUrl ?? '' })
}
