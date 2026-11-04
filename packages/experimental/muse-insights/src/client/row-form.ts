/**
 * The three Muse bundle rows that declare only a Config schema — memory, its
 * tools, and goal focus — as the Plugins page shows them: the numeric bounds,
 * the policy switches, and the free-text lists each row accepts, staged on the
 * shared configuration form and written only by the page's save.
 *
 * A switch is staged as a draft too: it writes the boolean its state shows,
 * and resetting it stages a clear so the field re-inherits the profile's value.
 * The list field stages comma- or space-separated patterns; a blank draft clears it.
 */

import type { SnapshotStore } from '@tomato/client-store'
import {
  SettingsFormModel, settingsNumberField, settingsTextField,
  type SettingsFieldSpec, type SettingsFieldState, type SettingsFormActions, type SettingsFormScope,
  type SettingsFormShell,
} from '@tomato/client-ui-primitives'
import type { MuseInsightsKey } from './locales.ts'

/** The row id of `@tomato/experimental-memory`. */
export const MEMORY_ROW = 'optional-memory'
/** The row id of `@tomato/experimental-tool-memory`. */
export const TOOL_MEMORY_ROW = 'optional-tool-memory'
/** The row id of `@tomato/experimental-focus`. */
export const FOCUS_ROW = 'optional-focus'

/** One control of a row's page: the section field, its copy, and how it converts. */
export interface FieldSpec {
  readonly field: string
  readonly label: MuseInsightsKey
  readonly hint?: MuseInsightsKey
  readonly kind: 'number' | 'text' | 'switch' | 'lines'
}

/** One heading of a row's page and its controls. */
export interface SectionSpec {
  readonly heading: MuseInsightsKey
  readonly fields: readonly FieldSpec[]
}

/** The three rows, in the order their records render, each with its live page title. */
export const ROW_PAGES = [
  {
    row: MEMORY_ROW,
    title: 'row.memory.title',
    sections: [{
      heading: 'row.memory.limits',
      fields: [
        { field: 'maxRecallResults', label: 'row.memory.maxRecallResults', hint: 'row.memory.maxRecallResultsHint', kind: 'number' },
        { field: 'maxPinnedRecords', label: 'row.memory.maxPinnedRecords', hint: 'row.memory.maxPinnedRecordsHint', kind: 'number' },
        { field: 'maxValueBytes', label: 'row.memory.maxValueBytes', hint: 'row.memory.maxValueBytesHint', kind: 'number' },
        { field: 'maxRecordsPerWorkspace', label: 'row.memory.maxRecordsPerWorkspace', hint: 'row.memory.maxRecordsPerWorkspaceHint', kind: 'number' },
        { field: 'maxProfileRecords', label: 'row.memory.maxProfileRecords', hint: 'row.memory.maxProfileRecordsHint', kind: 'number' },
      ],
    }],
  },
  {
    row: TOOL_MEMORY_ROW,
    title: 'row.toolMemory.title',
    sections: [
      {
        heading: 'row.toolMemory.snapshot',
        fields: [
          { field: 'maxSnapshotBytes', label: 'row.toolMemory.maxSnapshotBytes', hint: 'row.toolMemory.maxSnapshotBytesHint', kind: 'number' },
          { field: 'projectIndex', label: 'row.toolMemory.projectIndex', hint: 'row.toolMemory.projectIndexHint', kind: 'switch' },
          { field: 'minQuoteChars', label: 'row.toolMemory.minQuoteChars', hint: 'row.toolMemory.minQuoteCharsHint', kind: 'number' },
        ],
      },
      {
        heading: 'row.toolMemory.expansion',
        fields: [
          { field: 'queryExpansion', label: 'row.toolMemory.queryExpansion', hint: 'row.toolMemory.queryExpansionHint', kind: 'switch' },
          { field: 'expansionProvider', label: 'row.toolMemory.expansionProvider', hint: 'row.toolMemory.routeHint', kind: 'text' },
          { field: 'expansionModel', label: 'row.toolMemory.expansionModel', hint: 'row.toolMemory.routeHint', kind: 'text' },
          { field: 'expansionTimeoutMs', label: 'row.toolMemory.expansionTimeoutMs', hint: 'row.toolMemory.millisecondsHint', kind: 'number' },
          { field: 'expansionMaxTokens', label: 'row.toolMemory.expansionMaxTokens', hint: 'row.toolMemory.tokensHint', kind: 'number' },
          { field: 'maxAlternatives', label: 'row.toolMemory.maxAlternatives', hint: 'row.toolMemory.maxAlternativesHint', kind: 'number' },
        ],
      },
      {
        heading: 'row.toolMemory.capture',
        fields: [
          { field: 'capture', label: 'row.toolMemory.capture', hint: 'row.toolMemory.captureHint', kind: 'switch' },
          { field: 'captureMaxInputBytes', label: 'row.toolMemory.captureMaxInputBytes', hint: 'row.toolMemory.bytesHint', kind: 'number' },
          { field: 'captureMaxTokens', label: 'row.toolMemory.captureMaxTokens', hint: 'row.toolMemory.tokensHint', kind: 'number' },
          { field: 'captureTimeoutMs', label: 'row.toolMemory.captureTimeoutMs', hint: 'row.toolMemory.millisecondsHint', kind: 'number' },
        ],
      },
    ],
  },
  {
    row: FOCUS_ROW,
    title: 'row.focus.title',
    sections: [
      {
        heading: 'row.focus.reminders',
        fields: [
          { field: 'repeatedFailureThreshold', label: 'row.focus.repeatedFailureThreshold', hint: 'row.focus.repeatedFailureThresholdHint', kind: 'number' },
          { field: 'maxLedgerEntries', label: 'row.focus.maxLedgerEntries', hint: 'row.focus.maxLedgerEntriesHint', kind: 'number' },
          { field: 'maxMessageChars', label: 'row.focus.maxMessageChars', hint: 'row.focus.maxMessageCharsHint', kind: 'number' },
        ],
      },
      {
        heading: 'row.focus.approval',
        fields: [
          { field: 'approvalTools', label: 'row.focus.approvalTools', hint: 'row.focus.approvalToolsHint', kind: 'lines' },
        ],
      },
    ],
  },
] as const satisfies readonly { readonly row: string; readonly title: MuseInsightsKey; readonly sections: readonly SectionSpec[] }[]

/** One row this client half configures. */
export type RowPage = typeof ROW_PAGES[number]

/** One control as the page renders it. */
export interface RowFieldState extends SettingsFieldState {
  /** Whether the switch's draft reads on. */
  readonly on: boolean
}

/** What one row's page renders. */
export interface RowFormState extends SettingsFormShell {
  /** Every control by field name; only the fields the record lists are read. */
  readonly fields: Readonly<Record<string, RowFieldState>>
}

/** The registration-side face a row's page injects. */
export interface RowFormFace extends SettingsFormActions {
  /** The page title in the active locale. */
  readonly title: () => string
  /** Hooks the renderer binds. */
  readonly hooks: {
    /** Page snapshot. */
    readonly row: SnapshotStore<RowFormState>
  }
}

/** A switch's spec: the draft is the switch itself, and `true` and `false` are formatted explicitly. */
function settingsSwitchField(field: string): SettingsFieldSpec {
  return {
    field,
    format: value => typeof value === 'boolean' ? String(value) : '',
    parse: text => ({ kind: 'set', value: text === 'true' }),
  }
}

/**
 * A pattern list's spec. The control is a single-line text field, so patterns are
 * separated by commas or any whitespace and ordered as typed; a blank draft
 * clears the list.
 * @param field - field name inside the namespace section.
 * @returns the field's conversion spec.
 */
function settingsLinesField(field: string): SettingsFieldSpec {
  return {
    field,
    format: value => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').join(', ') : '',
    parse: (text) => {
      const patterns = text.split(/[\s,]+/u).filter(pattern => pattern !== '')
      return patterns.length === 0 ? { kind: 'clear' } : { kind: 'set', value: patterns }
    },
  }
}

const SPECS: Record<FieldSpec['kind'], (field: string) => SettingsFieldSpec> = {
  number: settingsNumberField,
  text: settingsTextField,
  switch: settingsSwitchField,
  lines: settingsLinesField,
}

/**
 * Bridge one row's settings namespace onto its page's staged form.
 */
export class RowFormController {
  private readonly form: SettingsFormModel<Record<string, unknown>>
  private readonly store: SnapshotStore<RowFormState>

  /**
   * @param scope - the shared configuration form of the row's entry.
   * @param sections - the controls the page renders, grouped by heading.
   * @param title - the page title in the active locale, read on every render.
   */
  constructor(
    scope: SettingsFormScope<Record<string, unknown>>,
    private readonly sections: readonly SectionSpec[],
    private readonly title: () => string,
  ) {
    const fields = sections.flatMap(section => section.fields)
    this.form = new SettingsFormModel(scope, fields.map(field => SPECS[field.kind](field.field)))
    this.store = this.form.bind(() => this.projection(fields))
  }

  private projection(fields: readonly FieldSpec[]): RowFormState {
    const row: Record<string, RowFieldState> = {}
    for (const { field } of fields) {
      const state = this.form.field(field)
      row[field] = { ...state, on: state.text === 'true' }
    }
    return { ...this.form.shell(), fields: row }
  }

  /** The sections the page draws, in record order. */
  get groups(): readonly SectionSpec[] {
    return this.sections
  }

  /**
   * Build the face the page's slot registration injects.
   * @returns the page's title, snapshot, and form actions.
   */
  inject(): RowFormFace {
    return { title: this.title, hooks: { row: this.store }, ...this.form.actions() }
  }

  /** Release the form subscription. */
  dispose(): void { this.form.dispose() }
}
