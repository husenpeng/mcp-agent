/** Copy adapters shared by the list and detail views. */
import type { RemoteFailure } from '@deepseek-ai/dsh-api-remotes/client'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from './locales.ts'

/**
 * One source bucket's localized label.
 * @param t - namespace-bound translate.
 * @param source - the skill's discovery source.
 * @returns the label to show on the card and detail.
 */
export function sourceLabel(t: TranslateNS<'skillBrowser'>, source: string): string {
  switch (source) {
    case 'user-dsh':
    case 'user-agents':
      return t('source.personal')
    case 'project-dsh':
    case 'project-agents':
      return t('source.project')
    case 'custom':
      return t('source.custom')
    case 'bundled':
      return t('source.bundled')
    default:
      return t('source.other')
  }
}

/**
 * The line under a failed read.
 * @param t - namespace-bound translate.
 * @param failure - the settled Remote failure.
 * @returns the line to show.
 */
export function failureLine(t: TranslateNS<'skillBrowser'>, failure: RemoteFailure): string {
  return t('error.unavailable', { message: failure.message })
}
