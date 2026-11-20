/** One settings card for the work team's creation defaults and per-robot model routes. */

import { useId, useState } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
import type {} from '@tomato/client-ui-plugin-manager/client'
import { Button, SettingsForm, SettingsSelectField, SettingsValueField } from '@tomato/client-ui-primitives'
import type { RobotSpecRevision } from '@tomato/api-robot-controller/client'
import type { RobotModel } from '@tomato/experimental-robot/types'
import { formLabels } from './locales.ts'
import { SANDBOX_LEVELS, type WorkTeamSettingsCardFace } from './work-team-card-controller.ts'
import css from './WorkTeamSettingsCard.module.css'

/** Framework-derived props for the work-team settings card. */
export type WorkTeamSettingsCardProps = PropsRuntime<'plugins.item'>
  & PropsLocale<'settings.work-team'> & InjectFace<WorkTeamSettingsCardFace>

/** One robot row's in-flight save and its last outcome. */
interface RowState {
  readonly saving: boolean
  readonly notice?: 'saved' | 'failed'
}

/**
 * Render the staged team defaults with their save footer, then every published
 * robot with an editable model route and its own publish-and-rebind save.
 * @param props - Locale, the defaults and registry snapshots, and the write callbacks.
 * @returns The summary one-liner or the two settings sections.
 */
export function WorkTeamSettingsCard(props: WorkTeamSettingsCardProps) {
  const { t } = props
  const defaults = props.useWorkTeamDefaults(snapshot => snapshot)
  const registry = props.useRobotRegistry(snapshot => snapshot)
  const headingId = useId()
  // Per-spec drafts and save outcomes are component-private interaction state.
  const [drafts, setDrafts] = useState<Readonly<Record<string, RobotModel>>>({})
  const [rows, setRows] = useState<Readonly<Record<string, RowState>>>({})
  if (props.view === 'summary') return t('description')

  const draftOf = (revision: RobotSpecRevision): RobotModel =>
    drafts[revision.ref.spec] ?? {
      provider: revision.spec.goal.model?.provider ?? '',
      model: revision.spec.goal.model?.model ?? '',
    }

  const editDraft = (revision: RobotSpecRevision, part: keyof RobotModel, text: string): void => {
    const key = revision.ref.spec
    setDrafts(current => ({ ...current, [key]: { ...draftOf(revision), [part]: text } }))
    setRows(current => ({ ...current, [key]: { saving: false } }))
  }

  const saveRobot = async (revision: RobotSpecRevision): Promise<void> => {
    const key = revision.ref.spec
    const draft = draftOf(revision)
    const model: RobotModel = { provider: draft.provider.trim(), model: draft.model.trim() }
    setRows(current => ({ ...current, [key]: { saving: true } }))
    const published = await props.publishRobot({
      spec: { ...revision.spec, goal: { ...revision.spec.goal, model } },
      previous: revision.ref,
    })
    if (!published.ok) {
      setRows(current => ({ ...current, [key]: { saving: false, notice: 'failed' } }))
      return
    }
    let landed = true
    for (const robot of props.robotSnapshot().robots) {
      if (robot.spec.spec !== revision.ref.spec) continue
      const rebound = await props.rebindRobot({ robotId: robot.id, ref: published.value.ref })
      if (!rebound.ok) landed = false
    }
    if (landed) {
      setDrafts((current) => {
        const next: Record<string, RobotModel> = {}
        for (const [id, draft] of Object.entries(current)) if (id !== key) next[id] = draft
        return next
      })
    }
    setRows(current => ({ ...current, [key]: { saving: false, notice: landed ? 'saved' : 'failed' } }))
  }

  return (
    <div className={css.card}>
      <SettingsForm labels={formLabels(t)} state={defaults} onSave={props.save} onDiscard={props.discard}>
        <section className={css.section} aria-labelledby={`${headingId}-defaults`}>
          <h3 className={css.heading} id={`${headingId}-defaults`}>{t('defaultsTitle')}</h3>
          <div className={css.fields}>
            <SettingsValueField id="plugin-config-work-team-provider" label={t('providerLabel')}
              overriddenLabel={t('overridden')} resetLabel={t('reset')} invalidLabel={t('textInvalid')}
              disabled={!defaults.writable || defaults.saving} {...defaults.defaultProvider}
              onEdit={(text) => { props.edit('defaultProvider', text) }}
              onReset={() => { props.resetField('defaultProvider') }} />
            <SettingsValueField id="plugin-config-work-team-model" label={t('modelLabel')}
              overriddenLabel={t('overridden')} resetLabel={t('reset')} invalidLabel={t('textInvalid')}
              disabled={!defaults.writable || defaults.saving} {...defaults.defaultModel}
              onEdit={(text) => { props.edit('defaultModel', text) }}
              onReset={() => { props.resetField('defaultModel') }} />
            <SettingsValueField id="plugin-config-work-team-permission-preset" label={t('permissionPresetLabel')}
              overriddenLabel={t('overridden')} resetLabel={t('reset')} invalidLabel={t('textInvalid')}
              disabled={!defaults.writable || defaults.saving} {...defaults.permissionPreset}
              onEdit={(text) => { props.edit('permissionPreset', text) }}
              onReset={() => { props.resetField('permissionPreset') }} />
            <SettingsSelectField id="plugin-config-work-team-sandbox" label={t('sandboxLabel')}
              overriddenLabel={t('overridden')} resetLabel={t('reset')} invalidLabel={t('sandboxInvalid')}
              options={SANDBOX_LEVELS.map(level => ({
                id: level,
                label: level === 'none' ? t('sandboxNone') : level === 'workspace' ? t('sandboxWorkspace') : t('sandboxFull'),
              }))}
              disabled={!defaults.writable || defaults.saving} {...defaults.sandbox}
              onEdit={(text) => { props.edit('sandbox', text) }}
              onReset={() => { props.resetField('sandbox') }} />
          </div>
        </section>
      </SettingsForm>
      <section className={css.section} aria-labelledby={`${headingId}-robots`}>
        <h3 className={css.heading} id={`${headingId}-robots`}>{t('robotsTitle')}</h3>
        {registry.specs.length === 0
          ? <p className={css.empty}>{t('robotsEmpty')}</p>
          : (
            <div className={css.robots}>
              <div className={css.robotRow} aria-hidden="true">
                <span className={css.column}>{t('robotNameColumn')}</span>
                <span className={css.column}>{t('robotProviderColumn')}</span>
                <span className={css.column}>{t('robotModelColumn')}</span>
                <span />
              </div>
              {registry.specs.map((revision) => {
                const key = revision.ref.spec
                const draft = draftOf(revision)
                const row = rows[key]
                const saving = row?.saving ?? false
                const provider = draft.provider.trim()
                const model = draft.model.trim()
                const current = revision.spec.goal.model
                const dirty = provider !== '' && model !== ''
                  && (provider !== (current?.provider ?? '') || model !== (current?.model ?? ''))
                return (
                  <div key={key} className={css.robotRow}>
                    <span className={css.robotName}>{revision.spec.name}</span>
                    <input className={css.input} type="text" value={draft.provider}
                      aria-label={t('robotProviderInput', { name: revision.spec.name })}
                      disabled={saving}
                      onChange={(event) => { editDraft(revision, 'provider', event.target.value) }} />
                    <input className={css.input} type="text" value={draft.model}
                      aria-label={t('robotModelInput', { name: revision.spec.name })}
                      disabled={saving}
                      onChange={(event) => { editDraft(revision, 'model', event.target.value) }} />
                    <div className={css.robotActions}>
                      <Button variant="outline" size="sm" disabled={!dirty || saving}
                        onClick={() => { void saveRobot(revision) }}>
                        {saving ? t('saving') : t('robotSave')}
                      </Button>
                      {row?.notice !== undefined
                        ? (
                          <p className={row.notice === 'failed' ? css.failed : css.notice} role="status">
                            {row.notice === 'failed' ? t('robotSaveFailed') : t('robotSaved')}
                          </p>
                        )
                        : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </section>
    </div>
  )
}
