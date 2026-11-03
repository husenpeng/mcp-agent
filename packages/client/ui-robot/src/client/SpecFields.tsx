/** Reusable specification controls: chip fields with suggestions and choice rows. */
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Button, Input, Pill } from '@tomato/client-ui-primitives'
import css from './SpecFields.module.css'

/** One selectable option of a small closed choice. */
export interface Choice<T extends string> {
  readonly value: T
  readonly label: string
}

/** Props of the chip-based value field. */
export interface TagFieldProps {
  /** Localized field label. */
  readonly label: string
  /** Selected values, in entry order. */
  readonly values: readonly string[]
  /** Receives the next complete selection. */
  readonly onChange: (next: string[]) => void
  /** Values offered as one-click chips and input suggestions. */
  readonly suggestions?: readonly string[]
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
  /** Localized suggestion-row heading. */
  readonly suggestionsLabel: string
}

/**
 * Render selected values as removable chips with one-click suggestions and a
 * free-entry input, so a list field is a picker rather than a text box.
 * @param props - label, selection, suggestions, and copy.
 * @returns the field.
 */
export function TagField({
  label, values, onChange, suggestions = [], placeholder, hint, issue, addLabel, removeLabel, suggestionsLabel,
}: TagFieldProps): ReactNode {
  const [draft, setDraft] = useState('')
  const add = (raw: string): void => {
    const value = raw.trim()
    if (value === '' || values.includes(value)) return
    onChange([...values, value])
    setDraft('')
  }
  const available = suggestions.filter(suggestion => !values.includes(suggestion))
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
              {value}
            </Pill>
          ))}
      </div>
      <div className={css.addRow}>
        <Input
          className={css.grow}
          value={draft}
          placeholder={placeholder}
          onChange={(event) => { setDraft(event.target.value) }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            add(draft)
          }}
        />
        <Button size="sm" variant="outline" onClick={() => { add(draft) }}>{addLabel}</Button>
      </div>
      {available.length === 0 ? null : (
        <div className={css.suggestions}>
          <span className={css.suggestionsLabel}>{suggestionsLabel}</span>
          <div className={css.chips}>
            {available.map(suggestion => (
              <Pill key={suggestion} onClick={() => { add(suggestion) }}>+ {suggestion}</Pill>
            ))}
          </div>
        </div>
      )}
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
