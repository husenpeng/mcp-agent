/** Sidebar account launcher: status, sign-in, sign-out, and settings entry. */

import { useRef, useState } from 'react'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import {
  IconCloseOutlineMedium, IconRefreshOutlineMedium, IconSettingsOutlineMedium, IconUserOutlineMedium, Menu, Toast,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { AccountAvatar } from './AccountAvatar.tsx'
import type { AccountSnapshot } from './account-controller.ts'
import css from './Account.module.css'

/** Commands and state injected into the launcher and settings page. */
export interface AccountInjected {
  hooks: {
    /** Account snapshot bound by the renderer as `useAccount`. */
    account: SnapshotStore<AccountSnapshot>
  }
  /** Open the Web popup or the Desktop welcome entry. */
  startSignIn(): Promise<void>
  /** Revoke and clear the current session. */
  signOut(): Promise<void>
  /** @param quiet - keep the current status while reading. */
  refresh(quiet: boolean): Promise<void>
  /** Clear a transient notice. */
  dismissNotice(): void
}

/** Props the settings shell binds for the launcher. */
export type AccountLauncherProps =
  PropsRuntime<'settings.launcher'>
  & PropsLocale<'settings.account'>
  & InjectFace<AccountInjected>

/**
 * Render the sidebar account entry and its menu.
 * @param props - sidebar geometry, settings navigation, locale copy, and account operations.
 * @returns the launcher.
 */
export function AccountLauncher(props: AccountLauncherProps) {
  const { t, wide, settingsShortcut, openSettings, startSignIn, signOut, refresh, dismissNotice } = props
  const state = props.useAccount(snapshot => snapshot)
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const signedIn = state.status === 'signed-in' && state.user !== null
  const label = state.user !== null
    ? state.user.name ?? state.user.email
    : state.status === 'unavailable' ? t('unavailable') : t('signedOut')
  const notice = state.notice === null ? undefined : t(state.notice)
  return (
    <div className={css.launcher}>
      {notice !== undefined && <Toast key={notice} text={notice} holdMs={6000} onDone={dismissNotice} />}
      <Menu
        open={open}
        side="top"
        portal
        autoFocus
        className={css.anchor}
        anchor={(
          <button ref={trigger} type="button" className={css.trigger} data-collapsed={!wide}
            data-status={state.status} aria-label={t('menu')} aria-haspopup="menu"
            aria-expanded={open} aria-busy={state.busy}
            onClick={() => { setOpen(value => !value) }}>
            {signedIn
              ? <span className={css.avatar}><AccountAvatar user={state.user} /></span>
              : state.status === 'unavailable'
                ? <IconRefreshOutlineMedium size={16} />
                : <IconUserOutlineMedium size={16} />}
            {wide && <span className={css.label}>{label}</span>}
          </button>
        )}
        items={[
          {
            id: 'settings',
            label: t('settings'),
            icon: <IconSettingsOutlineMedium size={16} />,
            ...(settingsShortcut === undefined ? {} : { shortcut: settingsShortcut }),
          },
          ...state.status === 'unavailable'
            ? [{ id: 'retry', label: t('retry'), icon: <IconRefreshOutlineMedium size={16} />, disabled: state.busy }]
            : signedIn
              ? [{ id: 'signout', label: t('signOut'), icon: <IconCloseOutlineMedium size={16} />, disabled: state.busy }]
              : [{ id: 'signin', label: t('signIn'), icon: <IconUserOutlineMedium size={16} />, disabled: state.busy }],
        ]}
        onClose={() => { setOpen(false) }}
        onSelect={(id) => {
          setOpen(false)
          if (id === 'settings') {
            trigger.current?.focus()
            openSettings()
          } else if (id === 'signin') {
            void startSignIn()
          } else if (id === 'signout') {
            void signOut()
          } else if (id === 'retry') {
            void refresh(false)
          }
        }}
      />
    </div>
  )
}
