/**
 * The staged form over the Muse insights row's live configuration: every
 * generation, evidence, model, and retention bound the Host declares, edited
 * on the Plugins page and written only on save.
 */

import type { SnapshotStore } from '@tomato/client-store'
import {
  SettingsFormModel, settingsNumberField, settingsTextField,
  type SettingsFieldState, type SettingsFormActions, type SettingsFormScope, type SettingsFormShell,
} from '@tomato/client-ui-primitives'
import type { MuseRouteCatalog, RouteOptions } from './route-catalog.ts'

/** Host entry id of the Muse insights row; also the settings namespace it serves. */
export const CONFIG_ENTRY = 'optional-muse-insights'

/** Key the Plugins page dispatches one bundle row's configuration under. */
export const CONFIG_ROW_KEY = '@tomato/experimental-muse-bundle#optional-muse-insights'

/** The row's settings section, as the page stages edits over it. */
export interface MuseInsightsConfig {
  recapNoticeMinutes?: number
  summaryIntervalMinutes?: number
  initialDelaySeconds?: number
  lookbackDays?: number
  maxSessions?: number
  maxMessagesPerSession?: number
  maxMessageChars?: number
  maxInputBytes?: number
  maxOutputTokens?: number
  timeoutMs?: number
  maxTasks?: number
  maxRecapDays?: number
  provider?: string
  model?: string
}

/** Whole-number fields of the section; the rest hold free text. */
const NUMBER_FIELDS = [
  'recapNoticeMinutes', 'summaryIntervalMinutes', 'initialDelaySeconds', 'lookbackDays', 'maxSessions',
  'maxMessagesPerSession', 'maxMessageChars', 'maxInputBytes', 'maxOutputTokens', 'timeoutMs', 'maxTasks', 'maxRecapDays',
] as const satisfies readonly (keyof MuseInsightsConfig)[]

/** Every field the page renders, in section order. */
export const CONFIG_FIELDS = [...NUMBER_FIELDS, 'provider', 'model'] as const satisfies readonly (keyof MuseInsightsConfig)[]

/** One field of the page, rendered in this order and grouped by section. */
export type MuseInsightsConfigField = typeof CONFIG_FIELDS[number]

/** What the configuration page renders. */
export interface MuseInsightsConfigState extends SettingsFormShell {
  recapNoticeMinutes: SettingsFieldState
  summaryIntervalMinutes: SettingsFieldState
  initialDelaySeconds: SettingsFieldState
  lookbackDays: SettingsFieldState
  maxSessions: SettingsFieldState
  maxMessagesPerSession: SettingsFieldState
  maxMessageChars: SettingsFieldState
  maxInputBytes: SettingsFieldState
  maxOutputTokens: SettingsFieldState
  timeoutMs: SettingsFieldState
  maxTasks: SettingsFieldState
  maxRecapDays: SettingsFieldState
  provider: SettingsFieldState
  model: SettingsFieldState
}

/** The registration-side face the configuration page's slot entry injects. */
export interface MuseInsightsConfigFace extends SettingsFormActions {
  hooks: {
    /** Page snapshot bound by the renderer. */
    config: SnapshotStore<MuseInsightsConfigState>
    /** Provider and model choices the page offers beside the staged route. */
    routes: SnapshotStore<RouteOptions>
  }
}

/** Bridges the row's settings namespace onto the page's staged form. */
export class MuseInsightsConfigController {
  private readonly form: SettingsFormModel<MuseInsightsConfig>
  private readonly store: SnapshotStore<MuseInsightsConfigState>

  /**
   * @param scope - the shared configuration form of the Muse insights entry.
   * @param routes - the configured provider/model catalog the page offers.
   */
  constructor(scope: SettingsFormScope<MuseInsightsConfig>, private readonly routes: MuseRouteCatalog) {
    this.form = new SettingsFormModel(scope, CONFIG_FIELDS.map(field => field === 'provider' || field === 'model'
      ? settingsTextField(field)
      : settingsNumberField(field)))
    this.store = this.form.bind(() => this.projection())
  }

  private projection(): MuseInsightsConfigState {
    return {
      ...this.form.shell(),
      recapNoticeMinutes: this.form.field('recapNoticeMinutes'),
      summaryIntervalMinutes: this.form.field('summaryIntervalMinutes'),
      initialDelaySeconds: this.form.field('initialDelaySeconds'),
      lookbackDays: this.form.field('lookbackDays'),
      maxSessions: this.form.field('maxSessions'),
      maxMessagesPerSession: this.form.field('maxMessagesPerSession'),
      maxMessageChars: this.form.field('maxMessageChars'),
      maxInputBytes: this.form.field('maxInputBytes'),
      maxOutputTokens: this.form.field('maxOutputTokens'),
      timeoutMs: this.form.field('timeoutMs'),
      maxTasks: this.form.field('maxTasks'),
      maxRecapDays: this.form.field('maxRecapDays'),
      provider: this.form.field('provider'),
      model: this.form.field('model'),
    }
  }

  /**
   * Build the face the page's slot registration injects.
   * @returns the page's snapshots and its form actions.
   */
  inject(): MuseInsightsConfigFace {
    return {
      hooks: { config: this.store, routes: this.routes.options() },
      ...this.form.actions(),
    }
  }

  /** Release the form subscription. */
  dispose(): void { this.form.dispose() }
}
