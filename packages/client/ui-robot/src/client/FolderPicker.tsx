/** Folder picker modal: in-app directory browsing with an OS-chooser fallback. */
import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { DirectoryListing } from '@tomato/api-remotes/client'
import { Button, Checkbox, IconChevronUpOutlineRegular, IconFolderCloseRegular, Modal } from '@tomato/client-ui-primitives'
import type { PropsLocale } from '@tomato/client-ui-slots'
import { NS } from './locales.ts'
import css from './FolderPicker.module.css'

/** Modal body class; the CSS module always publishes it. */
const CONTENT_CLASS = css.content as string
/** Dialog width for long source paths; the Modal default is 380px. */
const DIALOG_CLASS = css.dialog as string

/** Props of the folder picker. */
export interface FolderPickerProps extends PropsLocale<typeof NS> {
  readonly open: boolean
  readonly title: string
  /** Supporting sentence under the title. */
  readonly description?: string | undefined
  /** Directory the dialog opens on; the Host home when omitted. */
  readonly initialPath?: string | undefined
  /** List one Host directory level (browse backends). */
  readonly listDirectory: (path?: string, signal?: AbortSignal) => Promise<DirectoryListing>
  /** Open the Host's own chooser (native backends). */
  readonly pickDirectory: () => Promise<string | null>
  readonly onPicked: (path: string) => void
  readonly onCancel: () => void
}

/** Host business failure carried by a directory browse rejection. */
interface BrowseFailure {
  readonly rpcError?: { readonly code?: unknown; readonly message?: unknown }
}

/** Read the wire failure code a browse rejection carries. */
function failureCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const failure = error as BrowseFailure
  const code = failure.rpcError?.code
  return typeof code === 'string' ? code : undefined
}

/** Read the operator-facing message a browse rejection carries. */
function failureMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const message = (error as BrowseFailure).rpcError?.message
    if (typeof message === 'string' && message !== '') return message
  }
  return error instanceof Error ? error.message : String(error)
}

/** Latest owner callbacks, so a reload never depends on their identity. */
type Owner = Pick<FolderPickerProps, 'listDirectory' | 'pickDirectory' | 'onPicked' | 'onCancel'>

/**
 * Render a folder browser that also serves native deployments through their
 * own chooser. A browse-capability rejection is the signal to try the chooser.
 * @param props - open state, initial directory, Host calls, and copy.
 * @returns the folder picker modal.
 */
export function FolderPicker({
  open, title, description, initialPath, listDirectory, pickDirectory, onPicked, onCancel, t,
}: FolderPickerProps): ReactNode {
  const [listing, setListing] = useState<DirectoryListing>()
  const [currentPath, setCurrentPath] = useState<string | undefined>(initialPath)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [showHidden, setShowHidden] = useState(false)
  const sequence = useRef(0)
  /** One open edge loads one level; a StrictMode setup must not open a second chooser. */
  const started = useRef(false)
  const scanning = useRef<AbortController>()
  const owner = useRef<Owner>({ listDirectory, pickDirectory, onPicked, onCancel })
  useEffect(() => { owner.current = { listDirectory, pickDirectory, onPicked, onCancel } })

  const load = useCallback((target?: string) => {
    const request = ++sequence.current
    scanning.current?.abort()
    const scan = new AbortController()
    scanning.current = scan
    const { listDirectory: list, pickDirectory: pick, onPicked: picked, onCancel: cancel } = owner.current
    setCurrentPath(target)
    setLoading(true)
    setError(undefined)
    void (async () => {
      try {
        const next = await list(target, scan.signal)
        if (request !== sequence.current) return
        setListing(next)
        setCurrentPath(next.path)
        setLoading(false)
      } catch (reason: unknown) {
        if (request !== sequence.current) return
        // A browse-capability refusal names the native path the composition
        // serves; the OS chooser then owns the interaction.
        if (failureCode(reason) === 'directory-picker/unavailable') {
          try {
            const path = await pick()
            if (request !== sequence.current) return
            setLoading(false)
            if (path === null) cancel()
            else picked(path)
          } catch (pickerError: unknown) {
            if (request !== sequence.current) return
            setLoading(false)
            setError(failureMessage(pickerError))
          }
          return
        }
        setLoading(false)
        setError(failureMessage(reason))
      }
    })()
  }, [])

  useEffect(() => {
    if (!open) {
      started.current = false
      return
    }
    /* v8 ignore next -- StrictMode's second setup reuses the same open edge */
    if (started.current) return
    started.current = true
    setListing(undefined)
    setError(undefined)
    load(initialPath)
    return () => {
      sequence.current += 1
      scanning.current?.abort()
    }
  }, [open, initialPath, load])

  const crumbs = listing?.crumbs ?? []
  const parent = crumbs.length > 1 ? crumbs[crumbs.length - 2] : undefined
  const folders = listing?.entries.filter(entry => showHidden || !entry.hidden) ?? []
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      closeLabel={t('picker.close')}
      {...description === undefined ? {} : { description }}
      className={DIALOG_CLASS}
      contentClassName={CONTENT_CLASS}
      footer={(
        <div className={css.footer}>
          <Button variant="outline" onClick={onCancel}>{t('roster.cancel')}</Button>
          <Button
            variant="primary"
            disabled={listing === undefined || loading}
            {...listing === undefined ? {} : { onClick: () => { onPicked(listing.path) } }}
          >
            {t('picker.selectHere')}
          </Button>
        </div>
      )}
    >
      <div className={css.pathRow}>
        <Button
          size="sm"
          variant="ghost"
          disabled={parent === undefined || loading}
          aria-label={t('picker.up')}
          {...parent === undefined ? {} : { onClick: () => { load(parent.path) } }}
        >
          <IconChevronUpOutlineRegular size={14} />
          {t('picker.up')}
        </Button>
        <nav className={css.crumbs} aria-label={t('picker.path')}>
          {crumbs.length === 0
            ? <code className={css.path}>{currentPath ?? t('picker.home')}</code>
            : crumbs.map(crumb => (
              <button
                key={crumb.path}
                type="button"
                className={css.crumb}
                aria-current={crumb.path === listing?.path ? 'location' : undefined}
                onClick={() => { load(crumb.path) }}
              >
                {crumb.path === listing?.home ? t('picker.home') : crumb.name}
              </button>
            ))}
        </nav>
      </div>

      <Checkbox checked={showHidden} onChange={setShowHidden} label={t('picker.showHidden')} />
      {loading ? <p className={css.status} role="status">{t('picker.loading')}</p> : null}
      {error === undefined
        ? null
        : (
          <div className={css.error} role="alert">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => { load(currentPath) }}>{t('picker.retry')}</Button>
          </div>
        )}

      {listing === undefined || loading
        ? null
        : folders.length === 0
          ? <p className={css.empty}>{t('picker.noSubfolders')}</p>
          : (
            <ul className={css.list} aria-label={t('picker.path')}>
              {folders.map(entry => (
                <li key={entry.path}>
                  <button type="button" className={css.folder} onClick={() => { load(entry.path) }}>
                    <IconFolderCloseRegular size={16} />
                    <span>{entry.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
      {listing?.truncated === true ? <p className={css.note}>{t('picker.truncated')}</p> : null}
    </Modal>
  )
}
