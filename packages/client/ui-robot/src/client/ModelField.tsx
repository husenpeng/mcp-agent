/** Model route field for the advanced robot specification editor. */
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Button, Menu, type MenuEntry } from '@tomato/client-ui-primitives'
import type { RobotModelCatalog } from './model-catalog.ts'
import css from './SpecFields.module.css'

/** Menu identity of the row that clears the specification's route. */
const DEFAULT_ID = 'robot-model:default'

/** Provider and model one specification selects. */
export interface ModelRouteChoice {
  /** Registered provider route. */
  readonly provider: string
  /** Provider-owned model id. */
  readonly model: string
}

/** Props of the model route field. */
export interface ModelFieldProps {
  /** Localized field label. */
  readonly label: string
  /** Localized accessible name of the menu trigger. */
  readonly chooseLabel: string
  /** Caption of the deployment default row. */
  readonly defaultLabel: string
  /** Provider-grouped choices from the Host catalog. */
  readonly groups: RobotModelCatalog['groups']
  /** Stored route; undefined keeps the deployment default. */
  readonly value: ModelRouteChoice | undefined
  /** Receives the next complete choice, or undefined for the deployment default. */
  readonly onChange: (next: ModelRouteChoice | undefined) => void
  /** Localized helper under the field. */
  readonly hint?: string | undefined
  /** Localized explanation shown when the deployment advertises no model. */
  readonly emptyHint?: string | undefined
  /** Localized warning shown when a provider catalog failed to load. */
  readonly partialHint?: string | undefined
  /** Localized validation problem. */
  readonly issue?: string | undefined
}

/** Stable menu identity of one exact route. */
const routeId = (route: ModelRouteChoice): string => `${route.provider}\u0000${route.model}`

/**
 * Render the stored model route as one grouped menu over the deployment's
 * configured providers, with the deployment default as the clearing row.
 * @param props - label, choices, stored route, and copy.
 * @returns the field.
 */
export function ModelField({
  label, chooseLabel, defaultLabel, groups, value, onChange, hint, emptyHint, partialHint, issue,
}: ModelFieldProps): ReactNode {
  const [open, setOpen] = useState(false)
  const routes = new Map<string, ModelRouteChoice | undefined>([[DEFAULT_ID, undefined]])
  const items: MenuEntry[] = [{ id: DEFAULT_ID, label: defaultLabel }]
  for (const group of groups) {
    items.push({ type: 'label', id: `provider:${group.provider}`, text: group.label })
    for (const model of group.models) {
      const route = { provider: group.provider, model: model.model }
      routes.set(routeId(route), route)
      items.push({
        id: routeId(route),
        disabled: model.blockedReason !== undefined,
        label: (
          <span className={css.optionText}>
            <span>{model.label}</span>
            {model.blockedReason === undefined && model.description === undefined
              ? null
              : <span className={css.optionDescription}>{model.blockedReason ?? model.description}</span>}
          </span>
        ),
      })
    }
  }
  const selected = value === undefined
    ? undefined
    : groups
      .flatMap(group => group.models.map(model => ({ group, model })))
      .find(entry => entry.group.provider === value.provider && entry.model.model === value.model)
  const triggerLabel = value === undefined
    ? defaultLabel
    : selected === undefined ? `${value.provider} / ${value.model}` : `${selected.group.label} / ${selected.model.label}`
  return (
    <div className={css.field}>
      <span className={css.label}>{label}</span>
      <Menu
        open={open}
        align="start"
        portal
        className={css.pickerAnchor}
        selectedId={value === undefined ? DEFAULT_ID : routeId(value)}
        items={items}
        onSelect={(id) => {
          setOpen(false)
          onChange(routes.get(id))
        }}
        onClose={() => { setOpen(false) }}
        anchor={(
          <Button
            size="sm"
            variant="outline"
            className={css.modelTrigger}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={`${chooseLabel} ${label}`}
            onClick={() => { setOpen(!open) }}
          >
            <span className={css.modelTriggerText}>{triggerLabel}</span>
          </Button>
        )}
      />
      {groups.length === 0 && emptyHint !== undefined ? <span className={css.hint}>{emptyHint}</span> : null}
      {partialHint === undefined ? null : <span className={css.hint}>{partialHint}</span>}
      {hint === undefined ? null : <span className={css.hint}>{hint}</span>}
      {issue === undefined ? null : <span className={css.issue}>{issue}</span>}
    </div>
  )
}
