/** Reusable specification controls: multi-select list fields and choice rows. */
import type { ReactNode } from 'react'
import { useState } from 'react'
import {
  Button, IconCheckOutlineRegular, Input, Menu, MenuItemButton, Pill,
} from '@tomato/client-ui-primitives'
import css from './SpecFields.module.css'

/** One selectable option of a small closed choice. */
export interface Choice<T extends string> {
  readonly value: T
  readonly label: string
}

/** One local value a list field offers, with the label its source publishes. */
export interface TagOption {
  /** Value written into the specification. */
  readonly value: string
  /** Label shown in the picker; repeats `value` when the source has no title. */
  readonly label: string
  /** Optional one-line detail that helps a person choose. */
  readonly description?: string
}

/** Props of the chip-based list field. */
export interface TagFieldProps {
  /** Localized field label. */
  readonly label: string
  /** Selected values, in entry order. */
  readonly values: readonly string[]
  /** Receives the next complete selection. */
  readonly onChange: (next: string[]) => void
  /** Local values offered by the picker; empty when the deployment has none. */
  readonly options?: readonly TagOption[]
  /** Placeholder for an empty field and the custom input. */
  readonly placeholder?: string
  /** Localized helper under the field. */
  readonly hint?: string
  /** Localized validation problem. */
  readonly issue?: string | undefined
  /** Localized add-button label. */
  readonly addLabel: string
  /** Localized remove-chip accessible name prefix. */
  readonly removeLabel: string
  /** Localized picker button label. */
  readonly optionsLabel: string
}

/**
 * Render selected values as removable chips, a picker over the deployment's
 * local values, and a free-entry input for a value no source publishes.
 * @param props - label, selection, local options, and copy.
 * @returns the field.
 */
export function TagField({
  label, values, onChange, options = [], placeholder, hint, issue, addLabel, removeLabel, optionsLabel,
}: TagFieldProps): ReactNode {
  const [draft, setDraft] = useState('')
  const [open, setOpen] = useState(false)
  const add = (raw: string): void => {
    const value = raw.trim()
    if (value === '' || values.includes(value)) return
    onChange([...values, value])
    setDraft('')
  }
  const toggle = (value: string): void => {
    onChange(values.includes(value) ? values.filter(candidate => candidate !== value) : [...values, value])
  }
  const labelOf = (value: string): string => options.find(option => option.value === value)?.label ?? value
  return (
    <div className={css.field}>
      <span className={css.label}>{label}</span>
      <div className={css.chips}>
        {values.length === 0
          ? <span className={css.placeholder}>{placeholder ?? '—'}</span>
          : values.map(value => (
            <Pill
              key={value}
              active
              aria-label={`${removeLabel} ${value}`}
              onClick={() => { onChange(values.filter(candidate => candidate !== value)) }}
            >
              {labelOf(value)}
            </Pill>
          ))}
      </div>
      <div className={css.addRow}>
        <Input
          className={css.grow}
          value={draft}
          placeholder={placeholder}
          aria-label={label}
          onChange={(event) => { setDraft(event.target.value) }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            add(draft)
          }}
        />
        <Button size="sm" variant="outline" onClick={() => { add(draft) }}>{addLabel}</Button>
        {options.length === 0 ? null : (
          <Menu
            open={open}
            align="end"
            portal
            className={css.pickerAnchor}
            anchor={(
              <Button
                size="sm"
                variant="outline"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`${optionsLabel} ${label}`}
                onClick={() => { setOpen(!open) }}
              >
                {optionsLabel}
              </Button>
            )}
            onClose={() => { setOpen(false) }}
          >
            {options.map((option) => {
              const selected = values.includes(option.value)
              return (
                <MenuItemButton
                  key={option.value}
                  icon={selected ? <IconCheckOutlineRegular /> : <span className={css.checkSpacer} />}
                  onSelect={() => { toggle(option.value) }}
                >
                  <span className={css.optionText}>
                    <span>{option.label}</span>
                    {option.description === undefined ? null : (
                      <span className={css.optionDescription}>{option.description}</span>
                    )}
                  </span>
                </MenuItemButton>
              )
            })}
          </Menu>
        )}
      </div>
      {hint === undefined ? null : <span className={css.hint}>{hint}</span>}
      {issue === undefined ? null : <span className={css.issue}>{issue}</span>}
    </div>
  )
}

/** Props of a small closed choice rendered as pills. */
export interface ChoiceRowProps<T extends string> {
  /** Localized field label. */
  readonly label: string
  /** Current value. */
  readonly value: T
  /** Ordered options. */
  readonly options: readonly Choice<T>[]
  /** Receives the next value. */
  readonly onChange: (next: T) => void
  /** Optional localized helper under the row. */
  readonly hint?: string
}

/**
 * Render one closed choice as a row of selectable pills.
 * @param props - label, current value, and options.
 * @returns the choice row.
 */
export function ChoiceRow<T extends string>({ label, value, options, onChange, hint }: ChoiceRowProps<T>): ReactNode {
  return (
    <div className={css.field}>
      <span className={css.label}>{label}</span>
      <div className={css.chips}>
        {options.map(option => (
          <Pill key={option.value} active={option.value === value} onClick={() => { onChange(option.value) }}>
            {option.label}
          </Pill>
        ))}
      </div>
      {hint === undefined ? null : <span className={css.hint}>{hint}</span>}
    </div>
  )
}
