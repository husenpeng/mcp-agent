/** Operations available to the isolated native welcome renderer. */

import type { AccountView, SignInAttemptId, SignInAttemptView } from '@deepseek-ai/dsh-deepseek-account/types'
import type { ProductEventMap } from '@deepseek-ai/dsh-client-product-analytics/types'
import type { DesktopLocale } from './locale.ts'

/** Private native welcome channels, installed only while its window exists. */
export const WELCOME_IPC = {
  saveApiKey: 'dsh-welcome:save-api-key',
  analytics: 'dsh-welcome:analytics',
  analyticsEnabled: 'dsh-welcome:analytics-enabled',
  skip: 'dsh-welcome:skip',
  start: 'dsh-welcome:start',
  cancel: 'dsh-welcome:cancel',
  copyLink: 'dsh-welcome:copy-link',
  openLegal: 'dsh-welcome:open-legal',
  state: 'dsh-welcome:state',
  takeNotice: 'dsh-welcome:take-notice',
} as const

/** Legal pages the welcome card may open in the system browser. */
export type WelcomeLegalDocument = 'terms' | 'privacy'

/** Why the BFF returned to its login page after a Feishu authorization attempt. */
export type WelcomeFeishuFailure = 'denied' | 'email-missing' | 'failed'

/** Attempt projection carrying the desktop-only Feishu reason without widening the shared platform codes. */
export type WelcomeSignInAttempt = SignInAttemptView & { readonly feishuFailure?: WelcomeFeishuFailure }

/** Account projection the welcome renderer may receive. */
export interface WelcomeAccountView extends Omit<AccountView, 'attempt'> {
  readonly attempt: WelcomeSignInAttempt | null
}

/** Credential writes return a safe outcome without exposing Host diagnostics. */
export type WelcomeSaveResult = { readonly ok: true } | { readonly ok: false }

/** One-time notification retained by the main process until Welcome receives it. */
export type WelcomeNotice = 'session-expired'

type WelcomeEventName = 'auth_page_view' | 'auth_page_click' | 'api_key_save_click'

/** Host-owned operations used by the welcome window. */
export interface WelcomeOperations {
  /** @param eventName - allowed welcome event. @param attributes - approved fields without credentials. */
  analytics?<K extends WelcomeEventName>(eventName: K, attributes: ProductEventMap[K]): Promise<void>
  /** @returns the Host's current effective collection policy. */
  analyticsEnabled(): Promise<boolean>
  /** @returns the pending notification, clearing it before another renderer can receive it. */
  takeNotice(): Promise<WelcomeNotice | undefined>
  /** @returns account state after starting a login attempt. */
  startSignIn(): Promise<WelcomeAccountView>
  /** @param id - attempt to cancel. @returns the settled state. */
  cancelSignIn(id: SignInAttemptId): Promise<WelcomeAccountView>
  /** @param id - current waiting attempt whose authorization URL is copied to the system clipboard. */
  copySignInLink(id: SignInAttemptId): Promise<void>
  /**
   * Open a legal page in the system browser.
   * @param document - fixed page identity; the main process builds the URL.
   */
  openLegal(document: WelcomeLegalDocument): Promise<void>

  /**
   * Store the official provider's key before entering the workspace.
   * @param value - validated, trimmed API key.
   * @returns whether the write completed, without private error details.
   */
  saveApiKey(value: string): Promise<WelcomeSaveResult>
  /**
   * Enter the workspace without writing an onboarding-completion setting.
   * @returns completion after the workspace opens.
   */
  skip(): Promise<void>
}

/** The renderer receives localized copy, login operations, and safe account snapshots. */
export type WelcomeApi = DesktopLocale & WelcomeOperations & {
  /** Shell platform for chrome-specific layout branches (published as `html[data-platform]`). */
  readonly platform: string
  /** @param listener - safe account snapshot recipient. @returns subscription disposer. */
  onAccountState(listener: (state: WelcomeAccountView) => void): () => void
}

/** Authentication facts supplied at cold start or after a completed sign-out. */
export interface WelcomeAuthentication {
  readonly loggedIn: boolean
  readonly hasApiKey: boolean
}

/**
 * Decide whether a startup or sign-out requires the welcome entry.
 * @param authentication - current account and independently stored API-key facts.
 * @returns true only when neither authentication route is configured.
 */
export function needsWelcome(authentication: WelcomeAuthentication): boolean {
  return !authentication.loggedIn && !authentication.hasApiKey
}
