/**
 * One recap work item's page in the right Sidebar.
 *
 * The page names its item by the recap day and its problem statement, resolves
 * that item in the shared snapshot so it follows later recap generations, and
 * shows the conclusion, the solution, and the Sessions the item came from. A
 * record restored by a reload carries no parameters, so the body falls back to
 * the provider-owned binding its navigation wrote; without a resolvable item the
 * page reports that the recap no longer lists it and offers the recap view.
 * @module @tomato/experimental-muse-insights/client/WorkItemTab
 */

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Button, IconSparkleRegular, StateDot } from '@tomato/client-ui-primitives'
import type { HostObservable, InjectFace, PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
import { INSIGHTS_TAB_KIND } from './definition.ts'
import { formatDay, workItemSessions } from './format.ts'
import { EmptyState, InsightFailure, InsightLoading } from './InsightStates.tsx'
import type { InsightsState } from './source.ts'
import { recapStatus } from './status.ts'
import type { WorkItemTabBindings } from './work-item-bindings.ts'
import { useWorkItemTarget } from './work-item-target.ts'
import css from './Insights.module.css'

/** Everything the work item page needs injected. */
export interface WorkItemTabInjected {
  /** Shared insights read state; the renderer binds it to `useInsights`. */
  readonly hooks: { readonly insights: HostObservable<InsightsState> }
  /** Durable binding from one detail page to the item it last showed. */
  readonly workItemBindings: WorkItemTabBindings
  /** Run both Host generators now; cancellation follows the tab occurrence. */
  readonly onRefresh: (signal?: AbortSignal) => Promise<void>
}

/** Props of the work item page body. */
export type WorkItemTabProps = PropsRuntime<'sidebar.right.pane.tab'>
  & PropsLocale<'museInsights'>
  & InjectFace<WorkItemTabInjected>

/**
 * Render one recap work item: its status, the day it belongs to, and its detail.
 * @param props - tab information, the shared snapshot, the binding store, refresh, and localized copy.
 * @returns the item's detail, or the centered loading, failure, signed-out, or missing-item state.
 */
export function WorkItemTab({
  sessionId, useTabInfo, useInsights, workItemBindings, onRefresh, t,
}: WorkItemTabProps): ReactNode {
  const { tab } = useTabInfo()
  const { navigation, params } = useWorkItemTarget(sessionId, tab, workItemBindings)
  // The binding records the item each open named, so a reload restores this page.
  useEffect(() => {
    if (navigation === undefined) return
    workItemBindings.write(sessionId, tab.id, navigation)
  }, [workItemBindings, sessionId, tab.id, navigation?.day, navigation?.problem])
  const status = useInsights(state => state.status)
  const snapshot = useInsights(state => state.snapshot)
  const refresh = (): void => { void onRefresh(tab.signal) }
  if (snapshot === null) {
    return status === 'error' ? <InsightFailure t={t} onRetry={refresh} /> : <InsightLoading t={t} />
  }
  if (!snapshot.available) {
    return <EmptyState icon={<IconSparkleRegular size={24} />} title={t('empty.signedOut.title')} body={t('empty.signedOut.body')} />
  }
  const recap = snapshot.recap
  const item = recap === null || params === undefined || recap.day !== params.day
    ? undefined
    : recap.workItems.find(entry => entry.problem === params.problem)
  if (recap === null || item === undefined) {
    return <EmptyState
      icon={<IconSparkleRegular size={24} />}
      title={t('workItem.missing.title')}
      body={t('workItem.missing.body')}
      action={<Button
        variant="outline"
        size="sm"
        onClick={() => { tab.actions.openTab(INSIGHTS_TAB_KIND, { params: { view: 'recap' } }) }}
      >{t('workItem.missing.recap')}</Button>}
    />
  }
  const presentation = recapStatus(item.status)
  const sessions = workItemSessions(recap, item)
  return (
    <div className={css.body}>
      <article className={css.panel}>
        <header className={css.panelHead}>
          <h2>{item.problem}</h2>
          <p className={css.meta}>
            <span className={css.metaDot}><StateDot state={presentation.state} size={12} /></span>
            {t(presentation.key)} · {formatDay(recap.day, t('date.locale'))}
            {sessions.length > 0 ? ` · ${t(sessions.length === 1 ? 'workItem.session.one' : 'workItem.session.other', { count: sessions.length })}` : ''}
          </p>
          {recap.day !== snapshot.day && <p className={css.meta}>{t('recap.latest')}</p>}
        </header>
        {item.conclusion !== '' && (
          <section className={css.detailSection}>
            <h3 className={css.detailLabel}>{t('workItem.conclusion')}</h3>
            <p className={css.conclusionCard}>{item.conclusion}</p>
          </section>
        )}
        {item.solution !== '' && (
          <section className={css.detailSection}>
            <h3 className={css.detailLabel}>{t('workItem.solution')}</h3>
            <p className={css.solutionCard}>{item.solution}</p>
          </section>
        )}
        {sessions.length > 0 && (
          <section className={css.detailSection}>
            <h3 className={css.detailLabel}>{t('workItem.sources')}</h3>
            <ul className={css.sourceList}>
              {sessions.map(session => (
                <li key={session.sessionId} className={css.sourceRow}>
                  <span className={css.sourceTitle}>{session.title}</span>
                  <span className={css.sourceCount}>
                    {t(session.messageCount === 1 ? 'workItem.message.one' : 'workItem.message.other', { count: session.messageCount })}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  )
}
