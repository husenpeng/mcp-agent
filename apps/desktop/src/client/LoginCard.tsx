/** Feishu-only login card mirroring the company web login page. */
import type { DesktopMessages } from '../locale.ts'
import type { WelcomeLegalDocument } from '../welcome-api.ts'

/** Props for the initial sign-in card. */
export interface LoginCardProps {
  readonly messages: DesktopMessages
  readonly consented: boolean
  readonly busy: boolean
  readonly error: string
  /** @param value - explicit legal-consent choice. */
  readonly onConsent: (value: boolean) => void
  /** Start the hosted Feishu authorization. */
  readonly onStart: () => void
  /** @param document - legal page to open in the system browser. */
  readonly onLegal: (document: WelcomeLegalDocument) => void
}

/**
 * Render the login heading, Feishu panel, consent gate, and skip error.
 * @param props - copy, consent state, and shell actions.
 * @returns the login card contents.
 */
export function LoginCard({ messages: m, consented, busy, error, onConsent, onStart, onLegal }: LoginCardProps) {
  return (
    <div className="loginCard">
      <h1 id="welcome-heading" className="loginHeading">{m.welcomeAuthHeading}</h1>
      <p id="welcome-description" className="loginSubheading">{m.welcomeAuthSubheading}</p>

      <div className="feishuPanel">
        <span className="feishuTile">
          <img src="assets/feishu.svg" alt="" aria-hidden="true" width="34" height="34" />
        </span>
        <p className="feishuTip">{m.welcomeAuthFeishuTip}</p>
        <button id="sign-in" className="primary feishuButton" type="button"
          disabled={!consented || busy}
          onClick={onStart}>{m.welcomeAuthFeishuButton}</button>
      </div>

      <div className="consent">
        <input id="auth-consent" className="consentBox" type="checkbox" checked={consented}
          onChange={(event) => { onConsent(event.target.checked) }} />
        <label htmlFor="auth-consent" className="consentLabel">
          {m.welcomeAuthConsentPrefix}
          <button id="terms-link" className="legalLink" type="button"
            onClick={(event) => { event.preventDefault(); onLegal('terms') }}>{m.welcomeAuthConsentTerms}</button>
          {m.welcomeAuthConsentMid}
          <button id="privacy-link" className="legalLink" type="button"
            onClick={(event) => { event.preventDefault(); onLegal('privacy') }}>{m.welcomeAuthConsentPrivacy}</button>
          {m.welcomeAuthConsentSuffix}
        </label>
      </div>

      <p id="entry-error" className="entryError" role="alert" hidden={error === ''}>{error}</p>
    </div>
  )
}
