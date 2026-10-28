/** Public account fields returned by auth_service `session/verify`. */
export interface SessionUser {
  readonly id: string
  readonly email: string
  readonly name: string | null
  readonly avatarUrl: string | null
  readonly language: string | null
}

/** Three-state account projection the browser can render. */
export type SessionView =
  | { readonly status: 'signed-in'; readonly user: SessionUser }
  | { readonly status: 'signed-out' }
  | { readonly status: 'unavailable' }

/** One stored login attempt. */
export interface LoginAttempt {
  /** Verifier kept server-side; never sent to the BFF. */
  readonly verifier: string
  /** Callback URL registered with auth_service, including the state query. */
  readonly returnTo: string
  /** Epoch milliseconds after which the attempt is discarded. */
  readonly expiresAt: number
}

/** Result of verifying one session against auth_service. */
export type VerifyOutcome =
  | { readonly kind: 'valid'; readonly user: SessionUser }
  | { readonly kind: 'invalid' }
  | { readonly kind: 'unavailable' }

/** Result of redeeming one handoff code. */
export type RedeemOutcome =
  | { readonly kind: 'redeemed'; readonly sessionId: string }
  | { readonly kind: 'refused' }
  | { readonly kind: 'unavailable' }

/** Failure codes the login page can report without upstream details. */
export type LoginFailure = 'denied' | 'email-missing' | 'failed'
