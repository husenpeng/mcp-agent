/**
 * Explains why a plugin package cannot be installed as it is, instead of starting an install that would fail, and
 * offers the alternatives the market can carry out: the compatible build, or a deliberate override.
 */
import type { ReactNode } from 'react'
import { Button, Modal } from '@tomato/client-ui-primitives'
import type { InstallNotice } from './general-controller.ts'
import { requirementOf } from './catalog.ts'
import type { TomatoMarketLocaleKey } from './locales.ts'

/** Props of the install notice. */
export interface InstallNoticeProps {
  readonly notice: InstallNotice
  readonly onClose: () => void
  readonly onContinue: () => void
  readonly onAdapt: () => void
  readonly t: (key: TomatoMarketLocaleKey, params?: Readonly<Record<string, string>>) => string
}

/**
 * The install notice for a version the market refused to hand to the installer.
 * @param props - the notice and its actions.
 * @returns the dialog.
 */
export function InstallNoticeDialog(props: InstallNoticeProps): ReactNode {
  const { notice, onClose, onContinue, onAdapt, t } = props
  const repository = notice.plugin.repository?.url
  // A version the catalog stamps carries its own range; the Host's refusal adds none, so only the stamp can
  // name a requirement here.
  const requirement = notice.kind === 'incompatible' && notice.version.tomato !== undefined
    ? requirementOf({ 'engines.tomato': notice.version.tomato })
    : undefined
  const title = (() => {
    switch (notice.kind) {
      case 'compat': return t('compatNoticeTitle')
      case 'adapt-failed': return t('adaptFailedTitle')
      case 'other': return t('otherNoticeTitle')
      case 'incompatible': return t('incompatibleTitle')
      case 'unknown': return t('unknownNoticeTitle')
    }
  })()
  const body = (() => {
    switch (notice.kind) {
      case 'compat': return t('compatNoticeBody')
      case 'adapt-failed': return t('adaptFailedBody', { reason: notice.reason })
      case 'other': return t('otherNoticeBody')
      case 'incompatible': {
        const runtime = notice.resolution.status === 'none' ? notice.resolution.runtimeVersion ?? '' : ''
        return t('incompatibleBody', { runtime, name: notice.plugin.name, version: notice.version.version })
      }
      case 'unknown': return t('unknownNoticeBody', { reason: notice.reason })
    }
  })()
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      closeLabel={t('close')}
      footer={(
        <>
          {notice.kind === 'unknown' ? <Button variant="primary" size="sm" onClick={onContinue}>{t('continueInstall')}</Button> : null}
          {notice.kind === 'compat' ? <Button variant="primary" size="sm" onClick={onAdapt}>{t('installCompat')}</Button> : null}
          <Button variant="ghost" size="sm" onClick={onClose}>{t('close')}</Button>
        </>
      )}
    >
      <div className="tomatoMarket-notice">
        <p>{body}</p>
        {requirement === undefined ? null : <p>{t(requirement.key, requirement.params)}</p>}
        {repository === undefined ? null : (
          <a href={repository} target="_blank" rel="noreferrer noopener">{t('viewRepository')}</a>
        )}
        {notice.kind === 'unknown' ? null : <p className="tomatoMarket-meta">{notice.plugin.name}</p>}
      </div>
    </Modal>
  )
}
