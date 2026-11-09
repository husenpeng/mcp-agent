/**
 * The provider and model choices the recap route is picked from: the
 * third-party routes the Models page declares in the `llm-pi-ai` settings
 * section.
 *
 * The catalog reads that shared section through the settings form and never
 * writes it. A missing or malformed section yields no choices, so the recap
 * page keeps the values it already holds instead of inventing routes.
 */

import { createSnapshotStore, type SnapshotStore } from '@tomato/client-store'

/** Settings namespace of the third-party model routes. */
export const ROUTE_SETTINGS_NAMESPACE = 'llm-pi-ai'

/** One model a configured provider declares. */
export interface RouteModelOption {
  /** Exact model id sent as the request's `model`. */
  readonly id: string
  /** Display name the Models page shows for that id. */
  readonly name: string
}

/** One configured provider route and its models. */
export interface RouteProviderOption {
  /** Provider id sent as the request's `provider`. */
  readonly id: string
  /** Models this provider declares, in section order. */
  readonly models: readonly RouteModelOption[]
}

/** Every route the Models page currently configures. */
export interface RouteOptions {
  /** Configured providers, sorted by id. */
  readonly providers: readonly RouteProviderOption[]
}

/** Read side of the shared `llm-pi-ai` form, narrowed to the fields this catalog reads. */
export interface RouteSettingsRead {
  /** @returns the last accepted settings section, or undefined before the first read. */
  getSnapshot(): { readonly value: PiAiSection | undefined }
  /** Observe section replacements. */
  subscribe(listener: () => void): () => void
}

/** One provider's section fields this catalog reads; anything else is ignored. */
interface ProviderSection {
  readonly models?: readonly ProviderModelSection[] | null | undefined
}

/** One model entry as the serialized section may carry it. */
interface ProviderModelSection {
  readonly id?: unknown
  readonly name?: unknown
}

/** The `llm-pi-ai` section fields this catalog reads; serialized sections may carry null. */
export interface PiAiSection {
  readonly providers?: Record<string, ProviderSection | null> | null | undefined
}

/**
 * Read the configured routes from one serialized section.
 * @param section - the accepted `llm-pi-ai` section, or undefined.
 * @returns providers sorted by id with their declared models, skipping malformed entries.
 */
export function routeOptions(section: PiAiSection | undefined): RouteOptions {
  const providers = section?.providers
  if (providers === undefined || providers === null || typeof providers !== 'object') return { providers: [] }
  const options: RouteProviderOption[] = []
  for (const [id, provider] of Object.entries(providers)) {
    const models = Array.isArray(provider?.models) ? provider.models : []
    const entries: RouteModelOption[] = []
    for (const model of models) {
      const modelId = typeof model.id === 'string' ? model.id.trim() : ''
      if (modelId === '') continue
      const name = typeof model.name === 'string' && model.name.trim() !== '' ? model.name : modelId
      entries.push({ id: modelId, name })
    }
    options.push({ id, models: entries })
  }
  options.sort((left, right) => left.id.localeCompare(right.id))
  return { providers: options }
}

/** Mirrors the configured routes into the recap page's selector hook. */
export class MuseRouteCatalog {
  private readonly store: SnapshotStore<RouteOptions>
  private readonly unsubscribe: () => void

  /** @param scope - the shared read face of the `llm-pi-ai` settings section. */
  constructor(scope: RouteSettingsRead) {
    this.store = createSnapshotStore(routeOptions(scope.getSnapshot().value))
    this.unsubscribe = scope.subscribe(() => { this.store.set(routeOptions(scope.getSnapshot().value)) })
  }

  /** @returns the snapshot store the configuration page reads through its hook. */
  options(): SnapshotStore<RouteOptions> {
    return this.store
  }

  /** Release the section subscription. */
  dispose(): void {
    this.unsubscribe()
  }
}
