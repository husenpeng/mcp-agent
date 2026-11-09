/** Explains why an entry cannot be installed, instead of starting an install that would fail. */
import { Button, Modal } from '@tomato/client-ui-primitives'
import { requirementOf } from './search.js'

const TITLES = {
  compat: 'compatNoticeTitle',
  'adapt-failed': 'adaptFailedTitle',
  other: 'otherNoticeTitle',
  incompatible: 'incompatibleTitle',
}

/**
 * The install notice for a version the market refused to hand to the installer.
 * @param {{ notice: object, t: Function, onClose: Function, onContinue: Function }} props - the notice and its actions.
 * @returns {JSX.Element} the dialog.
 */
export function InstallNotice({ notice, t, onClose, onContinue, onAdapt }) {
  const { kind, plugin, compat, resolution } = notice
  const title = t(TITLES[kind] ?? 'unknownNoticeTitle')
  const body = kind === 'compat'
    ? t('compatNoticeBody')
    : kind === 'adapt-failed'
      ? t('adaptFailedBody', { reason: notice.reason ?? '' })
      : kind === 'other'
        ? t('otherNoticeBody')
        : kind === 'incompatible'
          ? t('incompatibleBody', { runtime: resolution?.runtimeVersion ?? '', name: plugin.name, version: notice.version?.version ?? '' })
          : t('unknownNoticeBody', { reason: notice.reason ?? '' })
  const requirement = kind === 'incompatible'
    ? (requirementOf(resolution?.rejected?.[0]?.requirements) ?? undefined)
    : kind === 'compat' && typeof compat?.dshRange === 'string'
      ? { key: 'dshRequirement', params: { range: compat.dshRange } }
      : undefined
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
        {requirement === undefined ? null : <p className="tm-noticeRange">{t(requirement.key, requirement.params)}</p>}
        {repository === undefined ? null : (
          <a className="tm-linkButton" href={repository} target="_blank" rel="noreferrer noopener">{t('viewRepository')}</a>
        )}
      </div>
    </Modal>
  )
}