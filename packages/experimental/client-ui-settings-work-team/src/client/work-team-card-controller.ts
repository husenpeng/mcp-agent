/**
 * The work-team page's staged team defaults over the Host's `tool-work-team`
 * entry, plus the robot-registry reads and publication callbacks the card's
 * robot section drives.
 */

import type { SnapshotStore } from '@tomato/client-store'
import {
  SettingsFormModel, settingsTextField,
  type SettingsFieldSpec, type SettingsFieldState, type SettingsFormActions, type SettingsFormScope, type SettingsFormShell,
} from '@tomato/client-ui-primitives'
import type {
  IRobotRuns, Robot, RobotPublishRequest, RobotRebindRequest, RobotRunsSnapshot, RobotRunsSource, RobotSpecRevision,
} from '@tomato/api-robot-controller/client'
import type { RemoteResult } from '@tomato/typert-protocol'

/** Confinement levels the Host's `tool-work-team` sandbox field accepts. */
export const SANDBOX_LEVELS = ['none', 'workspace', 'full'] as const

/** Host-owned defaults applied to every robot `work_team_create` creates. */
export interface WorkTeamDefaultsSettings {
  readonly defaultProvider: string
  readonly defaultModel: string
  readonly permissionPreset: string
  readonly sandbox: typeof SANDBOX_LEVELS[number]
}

/** Effective values and drafts presented by the team-defaults section. */
export interface WorkTeamDefaultsCardState extends SettingsFormShell {
  readonly defaultProvider: SettingsFieldState
  readonly defaultModel: SettingsFieldState
  readonly permissionPreset: SettingsFieldState
  readonly sandbox: SettingsFieldState
}

/** Actions and observable state of the staged team-defaults form. */
export interface WorkTeamDefaultsCardFace extends SettingsFormActions {
  readonly hooks: {
    readonly workTeamDefaults: SnapshotStore<WorkTeamDefaultsCardState>
  }
}

/** Everything the work-team card receives through its slot inject face. */
export interface WorkTeamSettingsCardFace extends SettingsFormActions {
  readonly hooks: {
    readonly workTeamDefaults: SnapshotStore<WorkTeamDefaultsCardState>
    readonly robotRegistry: RobotRunsSource
  }
  /**
   * Publish one updated robot specification revision.
   * @param request - complete specification and the revision it supersedes.
   * @returns the published revision, or the business/transport failure.
   */
  readonly publishRobot: (request: RobotPublishRequest) => Promise<RemoteResult<RobotSpecRevision>>
  /**
   * Bind one robot instance to a newer revision.
   * @param request - robot and the revision later runs should use.
   * @returns the rebound robot, or the business/transport failure.
   */
  readonly rebindRobot: (request: RobotRebindRequest) => Promise<RemoteResult<Robot>>
  /** @returns the registry's current snapshot, for event-handler reads. */
  readonly robotSnapshot: () => RobotRunsSnapshot
}

/** A sandbox field whose parse accepts only the three confinement levels. */
function sandboxField(): SettingsFieldSpec {
  const text = settingsTextField('sandbox')
  return {
    ...text,
    parse: (draft) => {
      const write = text.parse(draft)
      if (write?.kind !== 'set') return write
      const value = write.value
      return value === 'none' || value === 'workspace' || value === 'full' ? write : undefined
    },
  }
}

/** Bind the four team-default fields to one staged settings form. */
export class WorkTeamDefaultsCardController {
  private readonly form: SettingsFormModel<WorkTeamDefaultsSettings>
  private readonly store: SnapshotStore<WorkTeamDefaultsCardState>

  /** @param scope - The Host's `tool-work-team` settings section. */
  constructor(scope: SettingsFormScope<WorkTeamDefaultsSettings>) {
    this.form = new SettingsFormModel(scope, [
      settingsTextField('defaultProvider'),
      settingsTextField('defaultModel'),
      settingsTextField('permissionPreset'),
      sandboxField(),
    ])
    this.store = this.form.bind(() => ({
      ...this.form.shell(),
      defaultProvider: this.form.field('defaultProvider'),
      defaultModel: this.form.field('defaultModel'),
      permissionPreset: this.form.field('permissionPreset'),
      sandbox: this.form.field('sandbox'),
    }))
  }

  /**
   * Bind the team-defaults editor to the slot renderer.
   * @returns the defaults snapshot and staged write actions.
   */
  inject(): WorkTeamDefaultsCardFace {
    return { hooks: { workTeamDefaults: this.store }, ...this.form.actions() }
  }

  /** Release accepted-value subscriptions. */
  dispose(): void { this.form.dispose() }
}

/**
 * Compose the card's full inject face from the staged defaults and the client
 * robot service; the component never sees the service itself.
 * @param defaults - the staged team-defaults form face.
 * @param robotRuns - the client robot registry service.
 * @returns the face the `plugins.item` entry injects.
 */
export function workTeamCardFace(defaults: WorkTeamDefaultsCardFace, robotRuns: IRobotRuns): WorkTeamSettingsCardFace {
  return {
    edit: defaults.edit,
    resetField: defaults.resetField,
    save: defaults.save,
    discard: defaults.discard,
    hooks: { workTeamDefaults: defaults.hooks.workTeamDefaults, robotRegistry: robotRuns.state },
    publishRobot: request => robotRuns.publish(request),
    rebindRobot: request => robotRuns.rebind(request),
    robotSnapshot: () => robotRuns.state.getSnapshot(),
  }
}
