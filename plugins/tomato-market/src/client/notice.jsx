/** Explains why an entry cannot be installed, instead of starting an install that would fail. */
import { Button, Modal } from '@tomato/client-ui-primitives'

/**
 * The install notice for a version the market refused to hand to the installer.
 * @param {{ notice: object, t: Function, onClose: Function, onContinue: Function }} props - the notice and its actions.
 * @returns {JSX.Element} the dialog.
 */
export function InstallNotice({ notice, t, onClose, onContinue, onAdapt }) {
  const { kind, plugin, compat } = notice
  const title = kind === 'compat'
    ? t('compatNoticeTitle')
    : kind === 'adapt-failed' ? t('adaptFailedTitle') : kind === 'other' ? t('otherNoticeTitle') : t('unknownNoticeTitle')
  const body = kind === 'compat'
    ? t('compatNoticeBody')
    : kind === 'adapt-failed'
      ? t('adaptFailedBody', { reason: notice.reason ?? '' })
      : kind === 'other' ? t('otherNoticeBody') : t('unknownNoticeBody', { reason: notice.reason ?? '' })
  const range = kind === 'compat' && typeof compat?.dshRange === 'string' ? t('dshRequirement', { range: compat.dshRange }) : ''
  const repository = plugin.repository?.url
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      closeLabel={t('close')}
      footer={(
        <>
          {kind === 'unknown' ? <Button variant="primary" size="sm" onClick={onContinue}>{t('continueInstall')}</Button> : null}
          {kind === 'compat' ? <Button variant="primary" size="sm" onClick={onAdapt}>{t('installCompat')}</Button> : null}
          <Button variant="ghost" size="sm" onClick={onClose}>{t('close')}</Button>
        </>
      )}
    >
      <div className="tm-notice">
        <p>{body}</p>
        {range === '' ? null : <p className="tm-noticeRange">{range}</p>}
        {repository === undefined ? null : (
          <a className="tm-linkButton" href={repository} target="_blank" rel="noreferrer noopener">{t('viewRepository')}</a>
        )}
      </div>
    </Modal>
  )
}