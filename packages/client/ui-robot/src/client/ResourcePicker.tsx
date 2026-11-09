/** Folder-style resource picker: skills, MCP servers, and Workspace folders in one modal. */
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import {
  Button, IconCheckOutlineRegular, IconCordisPluginOutlineRegular, IconFolderCloseRegular, IconSearchOutlineRegular,
  IconSkillOutlineRegular, Input, Modal,
} from '@tomato/client-ui-primitives'
import type { PropsLocale } from '@tomato/client-ui-slots'
import { NS } from './locales.ts'
import type { TagOption } from './SpecFields.tsx'
import css from './ResourcePicker.module.css'

/** Modal body class; the CSS module always publishes it. */
const CONTENT_CLASS = css.content as string
/** Dialog width for long source paths; the Modal default is 380px. */
const DIALOG_CLASS = css.dialog as string

/** Glyph family the picker rows use. */
export type ResourceKind = 'skill' | 'server' | 'folder'

/** Props of the resource picker modal. */
export interface ResourcePickerProps extends PropsLocale<typeof NS> {
  readonly open: boolean
  readonly title: string
  /** Supporting sentence under the title. */
  readonly description?: string | undefined
  readonly kind: ResourceKind
  readonly options: readonly TagOption[]
  readonly selected: readonly string[]
  /** Receives every selection change immediately; the modal stays open. */
  readonly onChange: (next: string[]) => void
  /** Close the modal. */
  readonly onClose: () => void
  /** Optional folder-browse action shown above the list (Workspace roots). */
  readonly onBrowse?: (() => void) | undefined
  readonly browseLabel?: string | undefined
  /** Copy shown when the source has no option and the search matches none. */
  readonly emptyHint?: string | undefined
}

/** One leading glyph for the resource kind. */
function ResourceIcon({ kind }: { readonly kind: ResourceKind }): ReactNode {
  switch (kind) {
    case 'skill': return <IconSkillOutlineRegular size={14} />
    case 'server': return <IconCordisPluginOutlineRegular size={14} />
    case 'folder': return <IconFolderCloseRegular size={14} />
  }
}

/**
 * Render a searchable, multi-select resource list in a modal layer.
 * @param props - open state, options, selection, and copy.
 * @returns the picker modal.
 */
export function ResourcePicker({
  open, title, description, kind, options, selected, onChange, onClose, onBrowse, browseLabel, emptyHint, t,
}: ResourcePickerProps): ReactNode {
  const [query, setQuery] = useState('')
  // A reopened picker starts from the full list instead of the last search.
  useEffect(() => { if (!open) setQuery('') }, [open])
  const needle = query.trim().toLowerCase()
  const shown = needle === ''
    ? options
    : options.filter(option =>
      [option.label, option.value, option.description, option.path]
        .some(field => field?.toLowerCase().includes(needle) === true))
  const toggle = (value: string): void => {
    onChange(selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value])
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      closeLabel={t('picker.close')}
      {...description === undefined ? {} : { description }}
      className={DIALOG_CLASS}
      contentClassName={CONTENT_CLASS}
      footer={(
        <div className={css.footer}>
          <span className={css.count}>{t('picker.selectedCount', { count: selected.length })}</span>
          <Button variant="primary" onClick={onClose}>{t('picker.done')}</Button>
        </div>
      )}
    >
      <div className={css.toolbar}>
        <Input
          className={css.search}
          icon={<IconSearchOutlineRegular size={16} />}
          value={query}
          placeholder={t('picker.search')}
          aria-label={t('picker.search')}
          onChange={(event) => { setQuery(event.target.value) }}
        />
        {onBrowse === undefined
          ? null
          : <Button variant="outline" onClick={onBrowse}>{browseLabel ?? t('picker.browse')}</Button>}
      </div>
      {shown.length === 0
        ? <p className={css.empty}>{emptyHint ?? t('picker.empty')}</p>
        : (
          <ul className={css.list} aria-label={title}>
            {shown.map((option) => {
              const active = selected.includes(option.value)
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    className={css.option}
                    aria-pressed={active}
                    data-active={active || undefined}
                    onClick={() => { toggle(option.value) }}
                  >
                    <span className={css.mark} aria-hidden="true">
                      {active ? <IconCheckOutlineRegular size={14} /> : <ResourceIcon kind={kind} />}
                    </span>
                    <span className={css.optionText}>
                      <span className={css.optionLabel}>{option.label}</span>
                      {option.description === undefined ? null : (
                        <span className={css.optionDescription}>{option.description}</span>
                      )}
                      {option.path === undefined ? null : <code className={css.optionPath}>{option.path}</code>}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
    </Modal>
  )
}
