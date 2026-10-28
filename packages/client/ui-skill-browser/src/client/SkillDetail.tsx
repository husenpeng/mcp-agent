/**
 * One skill's detail: metadata, rendered instructions, and the editable form.
 *
 * The component renders the state the face published and hands saves back to
 * it; the form's draft, edit mode, and the last save failure stay local because
 * they end with this view. The body renders as Markdown in view mode and as a
 * plain textarea while editing.
 */
import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Button, IconCloseOutlineRegular, IconEditOutlineRegular, Input, MarkdownText, Tag,
  useDetailDocumentLabels,
} from '@tomato/client-ui-primitives'
import type { RemoteFailure } from '@tomato/api-remotes/client'
import type { TranslateNS } from '@tomato/client-ui-slots'
import type {} from './locales.ts'
import type { SkillDraft } from './face.ts'
import { failureLine, sourceLabel } from './format.ts'
import type { SkillDetailState } from './store.ts'
import css from './SkillDetail.module.css'

/** Local form values; `whenToUse` uses an empty string for "no hint". */
interface Draft {
  readonly description: string
  readonly whenToUse: string
  readonly content: string
}

/** The detail view's props: the published state, localized copy, and the tab's operations. */
export interface SkillDetailProps {
  readonly state: SkillDetailState
  readonly t: TranslateNS<'skillBrowser'>
  readonly onClose: () => void
  readonly onRetry: (name: string) => void
  readonly onSave: (draft: SkillDraft) => Promise<RemoteFailure | null>
}

/** The skill chips: where it came from and whether the model also sees it. */
function SkillTags({ skill, t }: {
  readonly skill: Extract<SkillDetailState, { status: 'ready' }>['skill']
  readonly t: TranslateNS<'skillBrowser'>
}): ReactNode {
  return (
    <span className={css.chips}>
      <Tag tone="outline">{sourceLabel(t, skill.source)}</Tag>
      {!skill.userInvocable && <Tag tone="quiet">{t('invocation.modelOnly')}</Tag>}
    </span>
  )
}

/** The read-only detail plus its edit toggle. */
function ReadyDetail({ skill, saving, t, onSave }: {
  readonly skill: Extract<SkillDetailState, { status: 'ready' }>['skill']
  readonly saving: boolean
  readonly t: TranslateNS<'skillBrowser'>
  readonly onSave: (draft: SkillDraft) => Promise<RemoteFailure | null>
}): ReactNode {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Draft>({
    description: skill.description,
    whenToUse: skill.whenToUse ?? '',
    content: skill.content,
  })
  const [failure, setFailure] = useState<RemoteFailure | undefined>(undefined)
  const fieldId = useId()
  const labels = useDetailDocumentLabels({
    title: t('detail.body'),
    loading: t('detail.loading'),
    retry: t('list.retry'),
    copy: t('markdown.copy'),
    copied: t('markdown.copied'),
    codeBlock: t('markdown.codeBlock'),
    wrap: t('markdown.wrap'),
    unwrap: t('markdown.unwrap'),
    footnotes: t('markdown.footnotes'),
  })

  const description = draft.description.trim()
  const whenToUse = draft.whenToUse.trim()
  // Compare against the Host's trimmed values: a stored description may carry
  // surrounding whitespace that a later save normalizes.
  const dirty = description !== skill.description.trim()
    || whenToUse !== (skill.whenToUse ?? '').trim()
    || draft.content !== skill.content
  const canSave = dirty && description !== '' && !saving

  const startEditing = (): void => {
    setDraft({
      description: skill.description,
      whenToUse: skill.whenToUse ?? '',
      content: skill.content,
    })
    setFailure(undefined)
    setEditing(true)
  }
  const cancelEditing = (): void => {
    setEditing(false)
    setFailure(undefined)
  }
  const submit = async (): Promise<void> => {
    if (!canSave) return
    const result = await onSave({
      name: skill.name,
      description,
      whenToUse: whenToUse === '' ? null : whenToUse,
      content: draft.content,
    })
    if (result === null) setEditing(false)
    else setFailure(result)
  }

  return (
    <div className={css.stack}>
      <div className={css.meta}>
        <SkillTags skill={skill} t={t} />
        {skill.editable && !editing && (
          <Button variant="outline" size="sm" icon={<IconEditOutlineRegular />} onClick={startEditing}>
            {t('detail.edit')}
          </Button>
        )}
      </div>
      {!skill.editable && <p className={css.readOnly}>{t('detail.readOnly')}</p>}
      {editing
        ? (
          <form className={css.form} onSubmit={(event) => { event.preventDefault(); void submit() }}>
            <div className={css.field}>
              <label className={css.fieldLabel} htmlFor={`${fieldId}-description`}>{t('detail.description')}</label>
              <Input
                id={`${fieldId}-description`}
                value={draft.description}
                aria-invalid={description === ''}
                onChange={(event) => { setDraft({ ...draft, description: event.target.value }) }}
              />
            </div>
            {description === '' && <p className={css.fieldError} role="alert">{t('editor.descriptionRequired')}</p>}
            <div className={css.field}>
              <label className={css.fieldLabel} htmlFor={`${fieldId}-when-to-use`}>{t('detail.whenToUse')}</label>
              <Input
                id={`${fieldId}-when-to-use`}
                value={draft.whenToUse}
                onChange={(event) => { setDraft({ ...draft, whenToUse: event.target.value }) }}
              />
            </div>
            <div className={css.field}>
              <label className={css.fieldLabel} htmlFor={`${fieldId}-content`}>{t('detail.body')}</label>
              <textarea
                id={`${fieldId}-content`}
                className={css.textarea}
                rows={14}
                value={draft.content}
                onChange={(event) => { setDraft({ ...draft, content: event.target.value }) }}
              />
            </div>
            <div className={css.footer}>
              <span className={css.unsaved}>{dirty ? t('editor.unsaved') : ''}</span>
              <Button variant="ghost" disabled={saving} onClick={cancelEditing}>{t('editor.cancel')}</Button>
              <Button variant="primary" type="submit" disabled={!canSave}>
                {saving ? t('editor.saving') : t('editor.save')}
              </Button>
            </div>
            {failure !== undefined && <p className={css.fieldError} role="alert">{failureLine(t, failure)}</p>}
          </form>
        )
        : (
          <>
            <dl className={css.facts}>
              <div className={css.fact}>
                <dt>{t('detail.description')}</dt>
                <dd>{skill.description}</dd>
              </div>
              {skill.whenToUse !== undefined && (
                <div className={css.fact}>
                  <dt>{t('detail.whenToUse')}</dt>
                  <dd>{skill.whenToUse}</dd>
                </div>
              )}
              {skill.path !== undefined && (
                <div className={css.fact}>
                  <dt>{t('detail.path')}</dt>
                  <dd className={css.path}>{skill.path}</dd>
                </div>
              )}
            </dl>
            <section className={css.bodySection} aria-label={t('detail.body')}>
              <h3 className={css.bodyTitle}>{t('detail.body')}</h3>
              <MarkdownText text={skill.content} labels={labels.markdown} omitHtml />
            </section>
          </>
        )}
    </div>
  )
}

/**
 * Render one skill's detail, its read states, or the failure with a retry.
 * @param props - published detail state, localized copy, and tab operations.
 * @returns the detail pane.
 */
export function SkillDetail({ state, t, onClose, onRetry, onSave }: SkillDetailProps): ReactNode {
  if (state.status === 'idle') return null
  const title = state.status === 'ready' ? state.skill.name : state.name
  return (
    <div className={css.root} data-skill-detail={state.status}>
      <div className={css.header}>
        <button type="button" className={css.back} aria-label={t('detail.close')} data-skill-close onClick={onClose}>
          <IconCloseOutlineRegular size={16} />
        </button>
        <span className={css.title}>{title}</span>
      </div>
      <div className={css.body}>
        {state.status === 'loading' && (
          <div className={css.skeleton} role="status" aria-label={t('detail.loading')} aria-busy="true">
            <span className={css.skeletonBar} />
            <span className={css.skeletonBar} />
            <span className={css.skeletonBarShort} />
          </div>
        )}
        {state.status === 'failed' && (
          <div className={css.failure}>
            <p className={css.failureLine} role="alert">{failureLine(t, state.failure)}</p>
            <Button variant="outline" size="sm" onClick={() => { onRetry(state.name) }}>{t('list.retry')}</Button>
          </div>
        )}
        {state.status === 'ready' && (
          <ReadyDetail skill={state.skill} saving={state.saving} t={t} onSave={onSave} />
        )}
      </div>
    </div>
  )
}
