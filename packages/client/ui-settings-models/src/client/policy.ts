/**
 * Deployment model allowlist helpers for the Models page.
 *
 * `llm-pi-ai`'s `modelPolicy` matches a provider route and model id exactly. A
 * route created through this page therefore has to enter the allowlist in the
 * same write, or it would be born blocked by the deployment's own guard.
 */

import type { JsonValue } from '@tomato/util-values'
import type { SettingsNamespaceView, SettingsPathOpView } from '@tomato/api-remotes/client'
import type { SettingsSchemaOperations } from './schema-operations.ts'

/** One enforced allowlist and the entries it already names. */
export interface ModelPolicyView {
  /** Current `modelPolicy.local` entries, preserved verbatim. */
  readonly local: readonly JsonValue[]
}

/** Whether a JSON value is a plain object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Read the enforced allowlist from one `llm-pi-ai` namespace view.
 * @param namespace - the namespace view, absent when the adapter is not mounted.
 * @param schema - schema path reader for the namespace view.
 * @returns the allowlist, or undefined when the deployment does not enforce one.
 */
export function readModelPolicy(
  namespace: SettingsNamespaceView | undefined,
  schema: SettingsSchemaOperations,
): ModelPolicyView | undefined {
  if (namespace === undefined) return undefined
  const policy = schema.getPath(namespace.value, ['modelPolicy'])
  if (!isRecord(policy) || policy.enabled !== true) return undefined
  return { local: Array.isArray(policy.local) ? policy.local : [] }
}

/**
 * Path ops that append a new route's models to an enforced allowlist.
 * @param policy - the allowlist read before this write.
 * @param route - provider route key being created.
 * @param models - model ids the route declares.
 * @returns one `set` op for every missing pair; empty when all are present.
 */
export function allowlistOps(
  policy: ModelPolicyView,
  route: string,
  models: readonly string[],
): SettingsPathOpView[] {
  const local = [...policy.local]
  let added = false
  for (const model of models) {
    if (local.some(entry => isRecord(entry) && entry.provider === route && entry.model === model)) continue
    local.push({ provider: route, model })
    added = true
  }
  return added ? [{ op: 'set', path: ['modelPolicy', 'local'], value: local }] : []
}
