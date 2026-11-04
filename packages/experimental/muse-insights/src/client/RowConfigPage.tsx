/**
 * The configuration page of one Muse bundle row that declares only a Config
 * schema: its sections of bounds, switches, route text, and pattern lists,
 * staged locally and written only by the page's save.
 */

import { SettingsForm, SettingsValueField, Switch } from '@tomato/client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
import css from './Insights.module.css'
import type { FieldSpec, RowFieldState, RowFormController, RowFormFace } from './row-form.ts'

/** Props the renderer binds for a row's configuration page. */
export type RowConfigPageProps =
  PropsRuntime<'plugins.row.config'>
  & PropsLocale<'museInsights'>
  & InjectFace<RowFormFace>
  & {
    /** Whether the Plugins page asks for the one-liner instead of the form. */
    readonly view: 'summary' | 'page'
    /** The page to draw, chosen from the row's own content, never from the page's state. */
    readonly controller?: Pick<RowFormController, 'groups'>
  }

/**
 * Render one control: a switch, or a labelled value field.
 * @param props.t - the page's translate, bound to the row copy dictionary.
 * @param props.props - the page's actions and bound snapshot hook.
 * @param props.spec - the control's field and copy.
 * @param props.state - the control's staged draft.
 * @param props.disabled - whether edits are blocked by a read-only document or a save in flight.
 * @returns the control.
 */
function FieldControl({ t, props, spec, state, disabled }: {
  readonly t: RowConfigPageProps['t']
  readonly props: RowConfigPageProps
  readonly spec: FieldSpec
  readonly state: RowFieldState
  readonly disabled: boolean
}) {
  const id = `muse-row-config-${spec.field}`
  if (spec.kind === 'switch') {
    return (
      <div className={css.configSwitch}>
        <span id={id} className={css.configSwitchLabel}>{t(spec.label)}</span>
        <Switch
          checked={state.on}
          label={t(spec.label)}
          descriptionId={id}
          disabled={disabled}
          onChange={(on) => { props.edit(spec.field, String(on)) }}
        />
        {state.overridden
          ? <button type="button" className={css.configReset} disabled={disabled} onClick={() => { props.resetField(spec.field) }}>{t('config.reset')}</button>
          : null}
        {spec.hint === undefined ? null : <p className={css.configHint}>{t(spec.hint)}</p>}
      </div>
    )
  }
  return (
    <SettingsValueField
      id={id}
      label={t(spec.label)}
      {...spec.hint === undefined ? {} : { hint: t(spec.hint) }}
      numeric={spec.kind === 'number'}
      overriddenLabel={t('config.overridden')}
      resetLabel={t('config.reset')}
      invalidLabel={t('config.invalidNumber')}
      disabled={disabled}
      {...state}
      onEdit={(text) => { props.edit(spec.field, text) }}
      onReset={() => { props.resetField(spec.field) }}
    />
  )
}

/**
 * Render one row's configuration form.
 * @param props - the view asked for, locale copy, the page's snapshot and actions, and the row's sections; the
 * page's `controller` is the record's rendering half, passed beside the injected face because a record renders nothing.
 * @returns the form, or nothing for the summary view, which the Plugins page draws from the row's own description.
 */
export function RowConfigPage(props: RowConfigPageProps & { readonly controller: Pick<RowFormController, 'groups'> }) {
  const { t } = props
  const state = props.useRow(snapshot => snapshot)
  if (props.view === 'summary') return null
  const disabled = !state.writable || state.saving
  return (
    <SettingsForm
      labels={{
        unavailable: t('config.unavailable'),
        readOnly: t('config.readOnly'),
        saveFailed: t('config.saveFailed'),
        save: t('config.save'),
        saving: t('config.saving'),
      }}
      state={state}
      onSave={props.save}
      onDiscard={props.discard}
    >
      {props.controller.groups.map(section => (
        <section key={section.heading} className={css.configSection}>
          <h3 className={css.configHeading}>{t(section.heading)}</h3>
          <div className={css.configGrid}>
            {section.fields.map((spec) => {
              const field = state.fields[spec.field]
              return field === undefined ? null : (
                <FieldControl key={spec.field} t={t} props={props} spec={spec} state={field} disabled={disabled} />
              )
            })}
          </div>
        </section>
      ))}
    </SettingsForm>
  )
}
