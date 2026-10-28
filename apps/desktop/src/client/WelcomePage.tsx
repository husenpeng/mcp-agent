/** Desktop welcome presentation; account operations stay in the preload. */
import { useEffect, useRef, useState } from 'react'
import { Toast } from '@deepseek-ai/dsh-client-ui-primitives/src/Toast.tsx'
import { StateDot } from '@deepseek-ai/dsh-client-ui-primitives/src/StateDot.tsx'
import type { WelcomeAccountView, WelcomeApi } from '../welcome-api.ts'
import { BrandPanel } from './BrandPanel.tsx'
import { LoginCard } from './LoginCard.tsx'

type Page = 'entry' | 'account'

/**
 * Render the standalone welcome login page using shell-owned operations and localized copy.
 * Clearing the account attempt returns the sign-in status page to the initial choices.
 * @param props.api - isolated preload API; no account credentials reach the renderer.
 * @returns the brand panel, login card, and fixed bottom actions.
 */
export function Welcome({ api }: { api: WelcomeApi }) {
  const { messages: m } = api
  const [expiryNotice, setExpiryNotice] = useState(false)
  const [page, setPage] = useState<Page>('entry')
  const pageRef = useRef<Page>('entry')
  const visiblePage = useRef<Page>('entry')
  const [attempt, setAttempt] = useState<WelcomeAccountView['attempt']>(null)
  const attemptRef = useRef<WelcomeAccountView['attempt']>(null)
  const [consented, setConsented] = useState(false)
  const [starting, setStarting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState<{ status: 'idle' | 'busy' | 'copied' | 'failed' }>({ status: 'idle' })
  const copyState = copyFeedback.status
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const mounted = useRef(true)
  const revision = useRef(0)

  function navigate(next: Page) {
    pageRef.current = next
    setPage(next)
  }
  function showAccount(state: WelcomeAccountView) {
    if (state.attempt === null && pageRef.current === 'entry') return
    attemptRef.current = state.attempt
    setAttempt(state.attempt)
    setStarting(false)
    setCopyFeedback({ status: 'idle' })
    navigate(state.attempt === null || state.attempt.phase === 'cancelled' ? 'entry' : 'account')
  }

  useEffect(() => {
    mounted.current = true
    document.documentElement.lang = api.id
    document.title = m.welcomeTitle
    const takeNotice = (): void => {
      void api.takeNotice().then((notice) => {
        if (mounted.current && notice === 'session-expired') setExpiryNotice(true)
      }).catch((_closedChannel: unknown) => {
        // A closed Welcome IPC channel must not interrupt the sign-in page.
      })
    }
    takeNotice()
    const stop = api.onAccountState((state) => {
      revision.current++
      takeNotice()
      showAccount(state)
    })
    return () => { mounted.current = false; stop() }
  }, [api, m.welcomeTitle])

  useEffect(() => {
    if (page === 'entry' && visiblePage.current !== 'entry') void api.analytics?.('auth_page_view', {})
    visiblePage.current = page
  }, [page, api])

  useEffect(() => {
    if (copyState !== 'copied' && copyState !== 'failed') return
    const timer = setTimeout(() => { setCopyFeedback({ status: 'idle' }) }, 2000)
    return () => { clearTimeout(timer) }
  }, [copyFeedback])

  async function skip() {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    try {
      await api.skip()
      if (mounted.current) setError('')
    } catch {
      if (mounted.current) setError(m.welcomeContinueFailed)
    } finally {
      busyRef.current = false
      if (mounted.current) setBusy(false)
    }
  }
  async function start() {
    if (!consented) return
    await begin()
  }
  async function begin() {
    if (busyRef.current) return
    navigate('account')
    setStarting(true)
    setAttempt(null)
    attemptRef.current = null
    const current = ++revision.current
    try {
      const state = await api.startSignIn()
      if (mounted.current && revision.current === current) showAccount(state)
    } catch {
      if (mounted.current && revision.current === current) setStarting(false)
    }
  }
  async function cancel() {
    if (cancelling || attemptRef.current === null) return
    setCancelling(true)
    const current = ++revision.current
    try {
      const state = await api.cancelSignIn(attemptRef.current.id)
      if (mounted.current && revision.current === current) showAccount(state)
    } catch {
      // The current attempt remains visible so cancellation can be retried.
    } finally {
      if (mounted.current) setCancelling(false)
    }
  }
  async function copyLink() {
    const current = attemptRef.current
    if (current?.phase !== 'waiting-browser' || (copyState === 'busy' || copyState === 'copied')) return
    setCopyFeedback({ status: 'busy' })
    try {
      await api.copySignInLink(current.id)
      if (mounted.current && attemptRef.current === current) setCopyFeedback({ status: 'copied' })
    } catch {
      if (mounted.current && attemptRef.current === current) setCopyFeedback({ status: 'failed' })
    }
  }

  const phase = starting ? 'initializing' : attempt?.phase ?? 'failed'
  const waiting = phase === 'waiting-browser'
  const failed = phase === 'expired' || phase === 'failed'
  const title = phase === 'initializing' ? m.welcomeAuthStarting
    : waiting ? m.welcomeAuthWaiting : phase === 'expired' ? m.welcomeAuthExpired
      : phase === 'failed' ? m.welcomeAuthFailed : m.welcomeAuthExchanging
  const failureCopy = attempt?.feishuFailure === 'denied' ? m.welcomeAuthFeishuDenied
    : attempt?.feishuFailure === 'email-missing' ? m.welcomeAuthFeishuEmailMissing
      : attempt?.feishuFailure === 'failed' ? m.welcomeAuthFeishuFailed : m.welcomeAuthFailed
  const headingId = page === 'entry' ? 'welcome-heading' : 'auth-status'

  return <>
    {expiryNotice && <Toast text={m.welcomeSessionExpired} onDone={() => { setExpiryNotice(false) }} />}
    <div className="titlebar" aria-hidden="true">
      <span className="titlebarBrand">
        <img className="titlebarMark titlebarMarkLight" src="assets/tomato-mark-light.svg" alt="" width="18" height="18" />
        <img className="titlebarMark titlebarMarkDark" src="assets/tomato-mark-dark.svg" alt="" width="18" height="18" />
        <span className="titlebarName" translate="no">Tomato AI</span>
      </span>
    </div>
    <main className="welcome" aria-labelledby={headingId}>
      <BrandPanel messages={m} />
      <section className="authPane">
        <div className="authCard">
          {page === 'entry' ? (
            <LoginCard messages={m} consented={consented} busy={busy} error={error}
              onConsent={setConsented}
              onStart={() => { void api.analytics?.('auth_page_click', { button_name: 'sign_in' }); void start() }}
              onLegal={(document) => { void api.openLegal(document).catch(() => undefined) }} />
          ) : (
            <div id="auth-page" className="statusCard" aria-live="polite">
              <h1 id="auth-status" className="loginHeading">{title}</h1>
              <p id="auth-description" className="statusDescription" hidden={!waiting && phase !== 'expired'}>
                {waiting ? m.welcomeAuthWaitingDescription : m.welcomeAuthExpiredDescription}
              </p>
              {failed && phase === 'failed' && <p className="statusError" role="alert">{failureCopy}</p>}
              <button id="auth-copy" className="copyLink" type="button" hidden={!waiting}
                disabled={!waiting || (copyState === 'busy' || copyState === 'copied')}
                onClick={() => { void copyLink() }}>
                {copyState === 'copied' ? m.welcomeAuthCopied : copyState === 'failed' ? m.welcomeAuthCopyFailed : m.welcomeAuthCopyLink}
              </button>
              <div id="auth-actions" className="actions">
                <button id="auth-loading" className="primary" type="button" hidden={failed} disabled aria-label={m.welcomeAuthExchanging}>
                  <StateDot state="ongoing" size={16} className="welcome-loading" />
                </button>
                <button id="auth-retry" className="primary" type="button" hidden={!failed}
                  onClick={() => { void api.analytics?.('auth_page_click', { button_name: 'sign_in' }); void begin() }}>{m.welcomeAuthRetry}</button>
                <button id="auth-cancel" className="secondary" type="button" hidden={failed}
                  disabled={cancelling || phase === 'committing' || phase === 'succeeded' || (phase === 'initializing' && !attempt?.id)}
                  onClick={() => { void cancel() }}>{m.welcomeAuthCancel}</button>
              </div>
            </div>
          )}
        </div>
        <button id="later" className="skip" type="button" hidden={page !== 'entry'} disabled={busy}
          onClick={() => { void skip() }}>{m.welcomeKeyLater}</button>
      </section>
    </main>
  </>
}
