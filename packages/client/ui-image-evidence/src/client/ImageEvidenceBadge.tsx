/**
 * Evidence status under one pasted image, read from the Host-computed
 * `imageEvidence` projection. The projection carries one entry per attachment
 * the Session read, so an image the bridge never touched renders nothing.
 * @module @tomato/client-ui-image-evidence/client/ImageEvidenceBadge
 */

import { useId, useState } from 'react'
import { IconChevronDownOutlineRegular } from '@tomato/client-ui-primitives'
import type { PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
// Type-only: pulls the `conversation.chat.user.image-meta` declaration and its owner share.
import type {} from '@tomato/client-ui-chat/client'
// Type-only: pulls the `imageEvidence` key into SessionProjectionMap.
import type {} from '@tomato/image-evidence/types'
// Type-only: pulls this package's LocaleNamespaceMap merge (the 'imageEvidence' seat).
import type {} from './locales.ts'
import css from './ImageEvidenceBadge.module.css'

/** Full props of the evidence entry beside one durable user-message image. */
type ImageEvidenceBadgeProps =
  PropsRuntime<'conversation.chat.user.image-meta'> & PropsLocale<'imageEvidence'>

/**
 * One image's read status: the engine and time of a fresh read, a reused
 * record, or a chain that failed and left the model with the placeholder.
 * Expanding it shows the same facts as rows, with the notes that explain a
 * reuse, a truncated reading, or the placeholder.
 * @param props - the owning image's admitted reference, the projection seat, and copy.
 * @returns the status badge with its optional details, or nothing before a read.
 */
export function ImageEvidenceBadge({ image, useProjection, t }: ImageEvidenceBadgeProps) {
  const entry = useProjection('imageEvidence', values => values?.[String(image.attachmentId)])
  const [open, setOpen] = useState(false)
  const detailsId = useId()
  if (entry === undefined) return null
  const engine = `${entry.engine.provider}/${entry.engine.model}`
  const seconds = t('duration.seconds', { seconds: Math.round(entry.durationMs / 100) / 10 })
  const status = entry.failed
    ? t('meta.failed')
    : entry.cached
      ? t('meta.reused', { engine })
      : t('meta.read', { engine, duration: seconds })
  const notes = [
    ...entry.cached ? [{ text: t('note.cached'), failed: false }] : [],
    ...entry.truncated ? [{ text: t('note.truncated'), failed: false }] : [],
    ...entry.failed ? [{ text: t('note.failed'), failed: true }] : [],
  ]
  return (
    <div className={css.stack}>
      <button
        type="button"
        className={css.status}
        data-state={entry.failed ? 'failed' : 'read'}
        aria-expanded={open}
        aria-controls={detailsId}
        title={open ? t('action.collapse') : t('action.expand')}
        onClick={() => { setOpen(current => !current) }}
      >
        <span className={css.text}>{status}</span>
        <IconChevronDownOutlineRegular className={css.chevron} />
      </button>
      {open && (
        <div className={css.panel} id={detailsId}>
          <span className={css.label}>{t('details.engine')}</span>
          <span className={css.value}>{engine}</span>
          {entry.attempts > 0 && <>
            <span className={css.label}>{t('details.attempts')}</span>
            <span className={css.value}>{String(entry.attempts)}</span>
          </>}
          {entry.durationMs > 0 && <>
            <span className={css.label}>{t('details.time')}</span>
            <span className={css.value}>{seconds}</span>
          </>}
          {notes.map(note => (
            <span key={note.text} className={css.note} data-state={note.failed ? 'failed' : 'read'}>
              {note.text}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
