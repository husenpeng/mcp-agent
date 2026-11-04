/**
 * The Muse insights row's configuration page on the Plugins page: every
 * generation, evidence, model, and retention bound, staged locally and written
 * only by the page's save.
 */

import { SettingsForm, SettingsValueField } from '@tomato/client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
import type { MuseInsightsConfigFace, MuseInsightsConfigField, MuseInsightsConfigState } from './config-form.ts'
import type { MuseInsightsKey } from './locales.ts'
import css from './Insights.module.css'

/** One rendered field: the section entry and its locale key. */
interface FieldSpec {
  readonly field: MuseInsightsConfigField
  readonly label: MuseInsightsKey
  readonly hint?: MuseInsightsKey
}

const RHYTHM: readonly FieldSpec[] = [
  { field: 'recapIntervalMinutes', label: 'config.recapIntervalMinutes' },
  { field: 'taskIntervalMinutes', label: 'config.taskIntervalMinutes' },
  { field: 'initialDelaySeconds', label: 'config.initialDelaySeconds' },
]

const EVIDENCE: readonly FieldSpec[] = [
  { field: 'lookbackDays', label: 'config.lookbackDays' },
  { field: 'maxSessions', label: 'config.maxSessions' },
  { field: 'maxMessagesPerSession', label: 'config.maxMessagesPerSession' },
  { field: 'maxMessageChars', label: 'config.maxMessageChars' },
]

const MODEL: readonly FieldSpec[] = [
  { field: 'provider', label: 'config.provider', hint: 'config.routeHint' },
  { field: 'model', label: 'config.model', hint: 'config.routeHint' },
  { field: 'maxInputBytes', label: 'config.maxInputBytes' },
  { field: 'maxOutputTokens', label: 'config.maxOutputTokens' },
  { field: 'timeoutMs', label: 'config.timeoutMs' },
]

const RETENTION: readonly FieldSpec[] = [
  { field: 'maxTasks', label: 'config.maxTasks' },
  { field: 'maxRecapDays', label: 'config.maxRecapDays' },
]

/** Props the renderer binds for the row's configuration page. */
export type MuseInsightsConfigPageProps =
  PropsRuntime<'plugins.row.config'>
  & PropsLocale<'museInsights'>
  & InjectFace<MuseInsightsConfigFace>

/**
 * Render one section of the row's configuration.
 * @param props - the section's heading and fields, the page state, and the edit actions.
 * @returns the section's heading and its controls.
 */
function ConfigSection({ heading, fields, props, state }: {
  readonly heading: MuseInsightsKey
  readonly fields: readonly FieldSpec[]
  readonly props: MuseInsightsConfigPageProps
  readonly state: MuseInsightsConfigState
}) {
  const { t } = props
  const disabled = !state.writable || state.saving
  return (
    <section className={css.configSection}>
      <h3 className={css.configHeading}>{t(heading)}</h3>
      <div className={css.configGrid}>
        {fields.map(({ field, label, hint }) => (
          <SettingsValueField
            key={field}
            id={`muse-insights-config-${field}`}
            label={t(label)}
            {...(hint === undefined ? {} : { hint: t(hint) })}
            numeric={field !== 'provider' && field !== 'model'}
            overriddenLabel={t('config.overridden')}
            resetLabel={t('config.reset')}
            invalidLabel={t(field === 'provider' || field === 'model' ? 'config.routePair' : 'config.invalidNumber')}
            disabled={disabled}
            {...state[field]}
            onEdit={(text) => { props.edit(field, text) }}
            onReset={() => { props.resetField(field) }}
          />
        ))}
      </div>
    </section>
  )
}

/**
 * Render the Muse insights row's configuration form.
 * @param props - the view asked for, locale copy, the page state, and its actions.
 * @returns the form, or nothing for the summary view, which the row page renders only without a package description.
 */
export function MuseInsightsConfigPage(props: MuseInsightsConfigPageProps) {
  const { t } = props
  const state = props.useConfig(snapshot => snapshot)
  if (props.view === 'summary') return null
  // The Host rejects a route with only one half and a stored one would fail the
  // next load, so the page blocks that save instead of staging it.
  const unpaired = (state.provider.text.trim() === '') !== (state.model.text.trim() === '')
  const formState: MuseInsightsConfigState = unpaired
    ? { ...state, invalid: true, provider: { ...state.provider, invalid: true }, model: { ...state.model, invalid: true } }
    : state
  return (
    <SettingsForm
      labels={{
        unavailable: t('config.unavailable'),
        readOnly: t('config.readOnly'),
        saveFailed: t('config.saveFailed'),
        save: t('config.save'),
        saving: t('config.saving'),
      }}
      state={formState}
      onSave={props.save}
      onDiscard={props.discard}
    >
      <ConfigSection heading="config.rhythm" fields={RHYTHM} props={props} state={formState} />
      <ConfigSection heading="config.evidence" fields={EVIDENCE} props={props} state={formState} />
      <ConfigSection heading="config.modelSection" fields={MODEL} props={props} state={formState} />
      <ConfigSection heading="config.retention" fields={RETENTION} props={props} state={formState} />
    </SettingsForm>
  )
}
