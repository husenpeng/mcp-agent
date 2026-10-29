/** Row formatting for the developer page; kept out of the component so copy ownership stays in the dictionary. */
import type { DeveloperSettingsLocaleKey } from './locales.ts'
import type { DeveloperEntry } from './store.ts'

type Translate = (key: DeveloperSettingsLocaleKey) => string

/**
 * Describe one entry's kind, target, and cost.
 * @param entry - recorded exchange or frame.
 * @param t - localized copy.
 * @returns the row label.
 */
export function entryLabel(entry: DeveloperEntry, t: Translate): string {
  const observation = entry.observation
  const separator = t('labelSeparator')
  if (observation.kind === 'rpc') {
    return `${t('kindRpc')}${separator}${observation.endpoint}${separator}${Math.round(observation.durationMs)}${t('labelMilliseconds')}`
  }
  return `${t('kindStream')}${separator}${observation.path}${separator}${observation.direction}`
}

/**
 * Describe one unary outcome; streams carry direction in their label instead.
 * @param entry - recorded exchange or frame.
 * @param t - localized copy.
 * @returns the outcome label, or an empty string for a frame.
 */
export function entryOutcome(entry: DeveloperEntry, t: Translate): string {
  const observation = entry.observation
  if (observation.kind !== 'rpc') return ''
  return observation.outcome === 'ok' ? t('outcomeOk')
    : observation.outcome === 'cancelled' ? t('outcomeCancelled') : t('outcomeError')
}

/**
 * Render the complete payload behind an expanded row.
 * @param entry - recorded exchange or frame.
 * @param t - localized copy.
 * @returns the labeled request, response, or frame text.
 */
export function entryDetail(entry: DeveloperEntry, t: Translate): string {
  const observation = entry.observation
  const parts = observation.kind === 'rpc'
    ? [[t('detailRequest'), observation.request], [t('detailResponse'), observation.response]]
    : [[t('detailFrame'), observation.frame]]
  return parts.map(([label, value]) => `${String(label)}\n${JSON.stringify(value, undefined, 2)}`).join('\n\n')
}
