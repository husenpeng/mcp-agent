/**
 * The centered states both insight pages share: the first read in flight, the
 * first read that failed, and any state carrying its own copy.
 * @module @tomato/experimental-muse-insights/client/InsightStates
 */

import type { ReactNode } from 'react'
import { Button, IconAlarmClockOutlineRegular, IconLoadingOutlineRegular } from '@tomato/client-ui-primitives'
import type { PropsLocale } from '@tomato/client-ui-slots'
import css from './Insights.module.css'

/** Translate bound to this package's copy, as both pages receive it. */
export type InsightTranslate = PropsLocale<'museInsights'>['t']

/** What one centered state says, with an optional icon and recovery action. */
export interface EmptyStateProps {
  /** Glyph shown above the title. */
  readonly icon: ReactNode
  /** The state's heading. */
  readonly title: string
  /** One line explaining the state, when it has one. */
  readonly body?: string
  /** A control that recovers from the state. */
  readonly action?: ReactNode
}

/**
 * Render one centered state.
 * @param props - the icon, heading, explanation, and recovery control.
 * @returns the centered state.
 */
export function EmptyState({ icon, title, body, action }: EmptyStateProps): ReactNode {
  return (
    <div className={css.empty}>
      <span className={css.emptyIcon} aria-hidden>{icon}</span>
      <h2>{title}</h2>
      {body !== undefined && <p>{body}</p>}
      {action}
    </div>
  )
}

/**
 * Render the waiting state a page shows before its first read returns.
 * @param props - localized copy naming the wait.
 * @returns the centered spinner.
 */
export function InsightLoading({ t }: { readonly t: InsightTranslate }): ReactNode {
  return (
    <div className={css.loading} role="status" aria-label={t('loading')}>
      <IconLoadingOutlineRegular size={24} className={css.spin} />
    </div>
  )
}

/**
 * Render the failure state of a first read, with the retry that repeats it.
 * @param props - localized copy and the retry callback.
 * @returns the centered failure state.
 */
export function InsightFailure({ t, onRetry }: {
  readonly t: InsightTranslate
  readonly onRetry: () => void
}): ReactNode {
  return (
    <EmptyState
      icon={<IconAlarmClockOutlineRegular size={24} />}
      title={t('error.title')}
      body={t('error.body')}
      action={<Button variant="outline" size="sm" onClick={onRetry}>{t('error.retry')}</Button>}
    />
  )
}
