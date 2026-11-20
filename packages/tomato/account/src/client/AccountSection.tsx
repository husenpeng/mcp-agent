/** Account settings page: identity, three-state status, sign-in, sign-out, and retry. */

import { Button, IconRefreshOutlineMedium, IconUserOutlineMedium, StateDot } from '@tomato/client-ui-primitives'
import type { InjectFace, PropsLocale } from '@tomato/client-ui-slots'
import { AccountAvatar } from './AccountAvatar.tsx'
import type { AccountInjected } from './AccountLauncher.tsx'
import css from './Account.module.css'

/** Props the settings shell binds for the account page. */
export type AccountSectionProps = PropsLocale<'settings.account'> & InjectFace<AccountInjected>

/** Locale keys naming the current authentication state. */
function stateKey(status: 'loading' | 'signed-in' | 'signed-out' | 'unavailable'): 'loading' | 'signedIn' | 'signedOut' | 'unavailable' {
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
  const name = user?.name ?? null
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
        <div className={css.identity}>
          {user !== null
            ? <AccountAvatar user={user} size={48} />
            : <span className={css.placeholderIcon} aria-hidden><IconUserOutlineMedium size={24} /></span>}
          <div className={css.identityText} role="status">
            <div className={css.nameRow}>
              {state.status === 'loading' && <StateDot state="ongoing" />}
              <span className={css.name} data-status={state.status}>
                {user === null ? t(stateKey(state.status)) : name ?? user.email}
              </span>
              {state.status === 'signed-in' && user !== null && (
                <span className={css.session}><StateDot state="done" />{t('signedIn')}</span>
              )}
            </div>
            {user !== null && name !== null && <span className={css.email}>{t('email')}: {user.email}</span>}
          </div>
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
        {state.status === 'unavailable' && <p className={css.hint}>{t('unavailableHint')}</p>}
      </div>
    </section>
  )
}
