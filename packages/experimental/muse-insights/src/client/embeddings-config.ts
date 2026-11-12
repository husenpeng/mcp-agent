/**
 * Read-only provider facts, the editable endpoint and credential name, and the
 * staged write behind the embedding-provider page. Model and vector length stay
 * Host configuration fields for a future migration; the page never changes them.
 * @module @tomato/experimental-muse-insights/client/embeddings-config
 */

import type { SettingsFormPathOp } from '@tomato/client-ui-primitives'
import type { EmbeddingsProbeInput, EmbeddingsProbeResult, EmbeddingsStatusView } from '../types.ts'

/** Host entry id of the embedding provider row; also its settings namespace. */
export const EMBEDDINGS_ENTRY = 'optional-embeddings-http'

/** Key the Plugins page dispatches the row's configuration under. */
export const EMBEDDINGS_ROW_KEY = '@tomato/experimental-muse-bundle#optional-embeddings-http'

/** One embedding model the configured relay answered for, with its measured vector length. */
export interface EmbeddingModelOption {
  /** Endpoint model id. */
  readonly id: string
  /** Vector length the endpoint returned. */
  readonly dimensions: number
  /** Copy key of the one-line description the page shows. */
  readonly description: 'model.v4' | 'model.doubao' | 'model.ada' | 'model.small' | 'model.large'
}

/** Embedding models the configured relay answered for, fastest first. */
export const EMBEDDING_MODELS: readonly EmbeddingModelOption[] = [
  { id: 'text-embedding-v4', dimensions: 1024, description: 'model.v4' },
  { id: 'Doubao-embedding', dimensions: 2560, description: 'model.doubao' },
  { id: 'text-embedding-ada-002', dimensions: 1536, description: 'model.ada' },
  { id: 'text-embedding-3-small', dimensions: 1536, description: 'model.small' },
  { id: 'text-embedding-3-large', dimensions: 3072, description: 'model.large' },
]

/** The catalog entry of one model id, when the catalog knows it. */
export function modelOption(model: string): EmbeddingModelOption | undefined {
  return EMBEDDING_MODELS.find(option => option.id === model)
}

/** The read-only provider settings the page displays. */
export interface EmbeddingsConfigView {
  /** Normalized endpoint the provider calls. */
  readonly baseUrl: string
  /** Model id sent with every request. */
  readonly model: string
  /** Vector length, as text so an unknown length stays visible. */
  readonly dimensions: string
  /** Credential name the Host resolves, or an empty string. */
  readonly apiKeyEnv: string
  /** Whether memory search may use the provider. */
  readonly enabled: boolean
}

/** Read the displayed settings from one stored section. */
export function configOf(value: unknown): EmbeddingsConfigView {
  const section = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
  const text = (field: string): string => {
    const raw = section[field]
    return typeof raw === 'string' ? raw : typeof raw === 'number' ? String(raw) : ''
  }
  return {
    baseUrl: text('baseUrl'),
    model: text('model'),
    dimensions: text('dimensions'),
    apiKeyEnv: text('apiKeyEnv'),
    enabled: section['enabled'] !== false,
  }
}

/** The fields the page may edit. */
export interface EndpointDraft {
  /** Endpoint base URL. */
  readonly baseUrl: string
  /** Credential name, or an empty string to send no authorization. */
  readonly apiKeyEnv: string
  /** Embedding model id. */
  readonly model: string
  /** Vector length as text; empty defers to the first response. */
  readonly dimensions: string
}

/** Read the editable fields from one stored section. */
export function endpointDraftOf(value: unknown): EndpointDraft {
  const config = configOf(value)
  return { baseUrl: config.baseUrl, apiKeyEnv: config.apiKeyEnv, model: config.model, dimensions: config.dimensions }
}

/**
 * Merge stored settings with the mounted provider so the page names the values
 * actually in effect when the profile leaves a field to its bundle default.
 * @param view - stored section values.
 * @param mounted - live provider identity from the Host, when mounted.
 * @returns the values the page displays.
 */
export function effectiveConfig(view: EmbeddingsConfigView, mounted: { readonly baseUrl?: string | undefined; readonly model?: string | undefined; readonly dimensions?: number | undefined } | undefined): EmbeddingsConfigView {
  return {
    baseUrl: view.baseUrl === '' ? mounted?.baseUrl ?? '' : view.baseUrl,
    model: view.model === '' ? mounted?.model ?? '' : view.model,
    dimensions: view.dimensions === '' || view.dimensions === '0'
      ? mounted?.dimensions === undefined ? '' : String(mounted.dimensions)
      : view.dimensions,
    apiKeyEnv: view.apiKeyEnv,
    enabled: view.enabled,
  }
}

/** Field writes the save stages; an empty value clears its override. */
export function endpointWrites(draft: EndpointDraft, baseline?: EmbeddingsConfigView): readonly SettingsFormPathOp[] {
  const baseUrl = draft.baseUrl.trim()
  const apiKeyEnv = draft.apiKeyEnv.trim()
  const model = draft.model.trim()
  const dimensions = draft.dimensions.trim()
  const parsed = Number(dimensions)
  const length = dimensions === '' || !Number.isSafeInteger(parsed) || parsed < 0 ? undefined : parsed
  const writes: SettingsFormPathOp[] = [
    baseUrl === '' ? { op: 'unset', path: ['baseUrl'] } : { op: 'set', path: ['baseUrl'], value: baseUrl },
    apiKeyEnv === '' ? { op: 'unset', path: ['apiKeyEnv'] } : { op: 'set', path: ['apiKeyEnv'], value: apiKeyEnv },
    model === '' ? { op: 'unset', path: ['model'] } : { op: 'set', path: ['model'], value: model },
    length === undefined ? { op: 'unset', path: ['dimensions'] } : { op: 'set', path: ['dimensions'], value: length },
  ]
  if (baseline === undefined) return writes
  return writes.filter(write => {
    const [field] = write.path
    const stored = field === 'baseUrl' ? baseline.baseUrl
      : field === 'apiKeyEnv' ? baseline.apiKeyEnv
        : field === 'model' ? baseline.model
          : field === 'dimensions' ? baseline.dimensions
            : undefined
    const next = write.op === 'set' ? String(write.value) : ''
    return stored !== next
  })
}

/** The one write the enable switch stages. */
export function enabledWrite(enabled: boolean): readonly SettingsFormPathOp[] {
  return [{ op: 'set', path: ['enabled'], value: enabled }]
}

/** The view types the page consumes from the Host. */
export type { EmbeddingsProbeInput, EmbeddingsProbeResult, EmbeddingsStatusView }
