/** Account settings page: identity, three-state status, sign-in, sign-out, and retry. */

import { Button, IconRefreshOutlineMedium, IconUserOutlineMedium } from '@tomato/client-ui-primitives'
import type { InjectFace, PropsLocale } from '@tomato/client-ui-slots'
import { AccountAvatar } from './AccountAvatar.tsx'
import type { AccountInjected } from './AccountLauncher.tsx'
import css from './Account.module.css'

/** Props the settings shell binds for the account page. */
export type AccountSectionProps = PropsLocale<'settings.account'> & InjectFace<AccountInjected>

/** Locale keys resolved for the status line. */
function statusKey(status: 'loading' | 'signed-in' | 'signed-out' | 'unavailable'): 'loading' | 'signedIn' | 'signedOut' | 'unavailable' {
  switch (status) {
    case 'loading': return 'loading'
    case 'signed-in': return 'signedIn'
    case 'signed-out': return 'signedOut'
    case 'unavailable': return 'unavailable'
  }
}

/**
 * Render the account settings page.
 * @param props - locale copy, the account snapshot, and its commands.
 * @returns the page content.
 */
export function AccountSection(props: AccountSectionProps) {
  const { t, startSignIn, signOut, refresh, dismissNotice } = props
  const state = props.useAccount(snapshot => snapshot)
  const user = state.user
  return (
    <section className={css.page} aria-labelledby="account-heading">
      <div className={css.heading}>
        <h2 id="account-heading" className={css.title}>{t('accountTitle')}</h2>
        <p className={css.description}>{t('accountDescription')}</p>
      </div>
      {state.notice !== null && (
        <div className={css.notice} role="status">
          <span>{t(state.notice)}</span>
          <Button size="sm" variant="ghost" onClick={dismissNotice}>{t('dismiss')}</Button>
        </div>
      )}
      <div className={css.card}>
        {user !== null
          ? <div className={css.identity}>
            <AccountAvatar user={user} size={40} />
            <div className={css.identityText}>
              <span className={css.name}>{user.name ?? user.email}</span>
              <span className={css.email}>{t('email')}: {user.email}</span>
            </div>
          </div>
          : <div className={css.identity}>
            <span className={css.placeholderIcon} aria-hidden><IconUserOutlineMedium size={24} /></span>
            <div className={css.identityText}>
              <span className={css.name}>{t('signedOut')}</span>
            </div>
          </div>}
        <div className={css.statusRow}>
          <span className={css.statusLabel}>{t('status')}</span>
          <span data-status={state.status}>{t(statusKey(state.status))}</span>
        </div>
        {state.status === 'unavailable' && <p className={css.hint}>{t('unavailableHint')}</p>}
        <div className={css.actions}>
          {state.status === 'signed-in'
            ? <Button variant="outline" disabled={state.busy} onClick={() => { void signOut() }}>{t('signOut')}</Button>
            : state.status === 'unavailable'
              ? <Button variant="outline" icon={<IconRefreshOutlineMedium size={16} />}
                disabled={state.busy} onClick={() => { void refresh(false) }}>{t('retry')}</Button>
              : <Button variant="primary" icon={<IconUserOutlineMedium size={16} />}
                disabled={state.busy || state.status === 'loading'} onClick={() => { void startSignIn() }}>{t('signIn')}</Button>}
        </div>
      </div>
    </section>
  )
}
