/**
 * Projection of the Host model catalog onto the robot specification editor.
 *
 * The same `session/modelCatalog` catalog the composer model selector reads is
 * the source: it lists the providers and models this deployment can route,
 * including third-party API providers the user configured in Settings.
 * @module @tomato/client-ui-robot
 */

import type { ModelCatalog } from '@tomato/api-remotes/client'

/** One selectable model inside its provider group. */
export interface RobotModelChoice {
  /** Provider-owned model id stored in the specification. */
  readonly model: string
  /** Display name from the provider catalog. */
  readonly label: string
  /** Optional one-line detail the provider publishes. */
  readonly description?: string
  /** Why the deployment refuses this route; the field shows the row disabled. */
  readonly blockedReason?: string
}

/** One provider and its currently advertised models. */
export interface RobotModelGroup {
  /** Registered provider route stored in the specification. */
  readonly provider: string
  /** Display name of the provider. */
  readonly label: string
  readonly models: readonly RobotModelChoice[]
}

/** Model choices the advanced configuration offers. */
export interface RobotModelCatalog {
  readonly groups: readonly RobotModelGroup[]
  /** Caption for the route a specification without a model uses. */
  readonly defaultLabel: string
  /** Whether a provider catalog failed to load, so an absent route may be temporary. */
  readonly partial: boolean
}

/**
 * Project the Host model catalog onto the editor's model field.
 * @param catalog - Host-generation catalog the composer model selector also reads.
 * @returns provider-grouped choices, the deployment default caption, and whether any provider failed to load.
 */
export function robotModelCatalog(catalog: ModelCatalog): RobotModelCatalog {
  const groups: RobotModelGroup[] = catalog.groups.map(group => ({
    provider: group.id,
    label: group.name,
    models: group.models.map(model => ({
      model: model.id,
      label: model.name,
      ...model.description === undefined ? {} : { description: model.description },
      ...model.blockedReason === undefined ? {} : { blockedReason: model.blockedReason },
    })),
  }))
  const defaultGroup = groups.find(group => group.provider === catalog.default.provider)
  const defaultModel = defaultGroup?.models.find(model => model.model === catalog.default.model)
  return {
    groups,
    defaultLabel: defaultGroup === undefined || defaultModel === undefined
      ? `${catalog.default.provider} / ${catalog.default.model}`
      : `${defaultGroup.label} / ${defaultModel.label}`,
    partial: catalog.failures.length > 0,
  }
}
