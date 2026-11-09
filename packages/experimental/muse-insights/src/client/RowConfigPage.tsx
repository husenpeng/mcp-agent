/**
 * The configuration page of one Muse bundle row that declares only a Config
 * schema: its sections of bounds, switches, route choices, and pattern lists,
 * staged locally and written only by the page's save. A route field offers the
 * providers and models the Models page configures, with an empty pair meaning
 * "follow the calling agent's model".
 */

import { SettingsForm, SettingsSelectField, SettingsValueField, Switch } from '@tomato/client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
import css from './Insights.module.css'
import type { FieldSpec, RowFieldState, RowFormController, RowFormFace, RowFormState, SectionSpec } from './row-form.ts'

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

/** The provider and model fields one page pairs, when it declares both. */
interface RoutePair {
  readonly provider: string
  readonly model: string
}

/**
 * Find the provider and model fields a page's sections pair.
 * @param sections - the page's sections in render order.
 * @returns the pair's field names, or undefined when the page declares no route.
 */
function routePairOf(sections: readonly SectionSpec[]): RoutePair | undefined {
  for (const section of sections) {
    const model = section.fields.find(field => field.kind === 'model')
    if (model?.paired !== undefined) return { provider: model.paired, model: model.field }
  }
  return undefined
}

/**
 * Render one route choice: a provider list, or the models of the staged provider.
 * @param props.t - the page's translate, bound to the row copy dictionary.
 * @param props.props - the page's actions, bound snapshot hook, and route hook.
 * @param props.spec - the control's field and copy.
 * @param props.state - the control's staged draft.
 * @param props.fields - every staged control, so a model field can read its provider.
 * @param props.disabled - whether edits are blocked by a read-only document or a save in flight.
 * @returns the labelled select.
 */
function RouteField({ t, props, spec, state, fields, disabled }: {
  readonly t: RowConfigPageProps['t']
  readonly props: RowConfigPageProps
  readonly spec: FieldSpec
  readonly state: RowFieldState
  readonly fields: RowFormStateFields
  readonly disabled: boolean
}) {
  const routes = props.useRoutes(snapshot => snapshot)
  const providerId = spec.paired === undefined ? '' : fields[spec.paired]?.text ?? ''
  const provider = routes.providers.find(entry => entry.id === providerId)
  const follow = spec.kind === 'model' && providerId === ''
  const options = spec.kind === 'provider'
    ? [{ id: '', label: t('row.routeFollow') }, ...routes.providers.map(entry => ({ id: entry.id, label: entry.id }))]
    : follow
      ? [{ id: '', label: t('row.routeFollow') }]
      : (provider?.models ?? []).map(model => ({ id: model.id, label: model.name }))
  const chooseProvider = (text: string): void => {
    props.edit(spec.field, text)
    if (spec.paired === undefined) return
    if (text === '') {
      props.edit(spec.paired, '')
      return
    }
    const next = routes.providers.find(entry => entry.id === text)
    const current = fields[spec.paired]?.text ?? ''
    if (next === undefined || next.models.some(model => model.id === current)) return
    const first = next.models[0]
    if (first !== undefined) props.edit(spec.paired, first.id)
  }
  return (
    <SettingsSelectField
      id={`muse-row-config-${spec.field}`}
      label={t(spec.label)}
      {...spec.hint === undefined ? {} : { hint: t(spec.hint) }}
      options={options}
      overriddenLabel={t('config.overridden')}
      resetLabel={t('config.reset')}
      invalidLabel={t('config.routePair')}
      disabled={disabled || (spec.kind === 'model' && !follow && options.length === 0)}
      {...state}
      onEdit={spec.kind === 'provider' ? chooseProvider : (text) => { props.edit(spec.field, text) }}
      onReset={() => { props.resetField(spec.field) }}
    />
  )
}

/** One page's staged controls, by field name. */
type RowFormStateFields = RowFormState['fields']

/**
 * Render one control: a switch, a route select, or a labelled value field.
 * @param props.t - the page's translate, bound to the row copy dictionary.
 * @param props.props - the page's actions and bound snapshot hooks.
 * @param props.spec - the control's field and copy.
 * @param props.state - the control's staged draft.
 * @param props.fields - every staged control, so a route model reads its provider.
 * @param props.disabled - whether edits are blocked by a read-only document or a save in flight.
 * @returns the control.
 */
function FieldControl({ t, props, spec, state, fields, disabled }: {
  readonly t: RowConfigPageProps['t']
  readonly props: RowConfigPageProps
  readonly spec: FieldSpec
  readonly state: RowFieldState
  readonly fields: RowFormStateFields
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
  if (spec.kind === 'provider' || spec.kind === 'model') {
    return <RouteField t={t} props={props} spec={spec} state={state} fields={fields} disabled={disabled} />
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
  // The Host refuses a route with only one half, so the page blocks that save.
  const pair = routePairOf(props.controller.groups)
  const providerText = pair === undefined ? '' : state.fields[pair.provider]?.text.trim() ?? ''
  const modelText = pair === undefined ? '' : state.fields[pair.model]?.text.trim() ?? ''
  const unpaired = pair !== undefined && (providerText === '') !== (modelText === '')
  const providerField = pair === undefined ? undefined : state.fields[pair.provider]
  const modelField = pair === undefined ? undefined : state.fields[pair.model]
  const formState = unpaired && pair !== undefined && providerField !== undefined && modelField !== undefined
    ? {
      ...state,
      invalid: true,
      fields: {
        ...state.fields,
        [pair.provider]: { ...providerField, invalid: true },
        [pair.model]: { ...modelField, invalid: true },
      },
    }
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
      {props.controller.groups.map(section => (
        <section key={section.heading} className={css.configSection}>
          <h3 className={css.configHeading}>{t(section.heading)}</h3>
          <div className={css.configGrid}>
            {section.fields.map((spec) => {
              const field = formState.fields[spec.field]
              return field === undefined ? null : (
                <FieldControl
                  key={spec.field}
                  t={t}
                  props={props}
                  spec={spec}
                  state={field}
                  fields={formState.fields}
                  disabled={disabled}
                />
              )
            })}
          </div>
        </section>
      ))}
    </SettingsForm>
  )
}
