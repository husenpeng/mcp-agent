/**
 * Right-Sidebar details for the Muse insights: the latest daily recap and the
 * current unfinished-task analysis in one page type with two views.
 *
 * The tab's layout record persists only its identity, so a restored body opens
 * the recap view; navigation parameters from a notice select the view it named.
 * All reads come from the shared controller source, so the page and any visible
 * notice always report the same Host generation. A recap work item is one
 * compact row; picking it opens that item's own page beside this one.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Button,
  IconAlarmClockOutlineRegular,
  IconChevronRightOutlineRegular,
  IconLoadingOutlineRegular,
  IconRefreshOutlineRegular,
  IconSparkleRegular,
  SegmentedControl,
  Tag,
} from '@tomato/client-ui-primitives'
import type { HostObservable, InjectFace, PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
import type {} from '@tomato/client-ui-sidebar-right/client'
import type { DailyRecap, UnfinishedTask } from '../types.ts'
import { recordedView } from './contract.ts'
import { WORK_ITEM_TAB_KIND } from './definition.ts'
import { EmptyState, InsightFailure, InsightLoading } from './InsightStates.tsx'
import { formatDay, formatTime, workItemBrief } from './format.ts'
import type { InsightsState, InsightsView } from './source.ts'
import { recapStatusTag } from './status.ts'
import css from './Insights.module.css'

/** Everything the Sidebar page needs injected. */
export interface InsightsTabInjected {
  /** Shared insights read state; the renderer binds it to `useInsights`. */
  readonly hooks: { readonly insights: HostObservable<InsightsState> }
  /** Run both Host generators now; cancellation follows the tab occurrence. */
  readonly onRefresh: (signal?: AbortSignal) => Promise<void>
}

/** Props of the Sidebar page body. */
export type InsightsTabProps = PropsRuntime<'sidebar.right.pane.tab'>
  & PropsLocale<'museInsights'>
  & InjectFace<InsightsTabInjected>

/** The daily recap view. */
function RecapPanel({ recap, day, t, onOpenWorkItem }: {
  readonly recap: DailyRecap
  readonly day: string
  readonly t: InsightsTabProps['t']
  readonly onOpenWorkItem: (day: string, title: string) => void
}): ReactNode {
  const locale = t('date.locale')
  const meta = recap.sessions.length === 1
    ? t('recap.meta.one', { messages: recap.messageCount })
    : t('recap.meta.other', { sessions: recap.sessions.length, messages: recap.messageCount })
  return (
    <article className={css.panel}>
      <header className={css.panelHead}>
        <h2>{recap.headline.trim() === '' ? t('recap.headlineFallback') : recap.headline}</h2>
        <p className={css.meta}>{formatDay(recap.day, locale)} · {meta}</p>
        {recap.day !== day && <p className={css.meta}>{t('recap.latest')}</p>}
      </header>
      {recap.summary !== '' && <p className={css.summary}>{recap.summary}</p>}
      {recap.source === 'local' && <p className={css.note}>{t('recap.localNote')}</p>}
      {recap.workItems.length > 0 && (
        <section className={css.section}>
          <h3>{t('recap.workItems')}</h3>
          <ul className={css.workList}>
            {recap.workItems.map((item) => {
              const tag = recapStatusTag(item.status)
              const brief = workItemBrief(item.detail)
              return (
                <li key={item.title} className={css.workRow}>
                  <button
                    type="button"
                    className={css.workRowButton}
                    onClick={() => { onOpenWorkItem(recap.day, item.title) }}
                  >
                    <span className={css.taskHead}>
                      <Tag tone={tag.tone}>{t(tag.key)}</Tag>
                      <span className={css.taskTitle}>{item.title}</span>
                      <IconChevronRightOutlineRegular size={14} className={css.workChevron} />
                    </span>
                    {brief !== '' && <span className={css.workBrief}>{brief}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
      {recap.openTasks.length > 0 && (
        <section className={css.section}>
          <h3>{t('recap.openTasks')}</h3>
          <ul className={css.plainList}>
            {recap.openTasks.map(task => <li key={task}>{task}</li>)}
          </ul>
        </section>
      )}
      {recap.sessions.length > 0 && (
        <section className={css.section}>
          <h3>{t('recap.sessions')}</h3>
          <ul className={css.sessionList}>
            {recap.sessions.map(session => (
              <li key={session.sessionId}>
                <span className={css.sessionTitle}>{session.title}</span>
                {session.summary !== '' && <p className={css.sessionSummary}>{session.summary}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}

/** The unfinished-task view. */
function UnfinishedPanel({ tasks, analyzedAt, analyzing, t }: {
  readonly tasks: readonly UnfinishedTask[]
  readonly analyzedAt: number
  readonly analyzing: boolean
  readonly t: InsightsTabProps['t']
}): ReactNode {
  if (tasks.length === 0) {
    return analyzedAt === 0 && analyzing
      ? <EmptyState icon={<IconLoadingOutlineRegular size={24} className={css.spin} />} title={t('unfinished.waiting')} />
      : <EmptyState icon={<IconAlarmClockOutlineRegular size={24} />} title={t('empty.unfinished.title')} body={t('empty.unfinished.body')} />
  }
  const meta = analyzedAt === 0
    ? ''
    : t('unfinished.meta', { time: formatTime(analyzedAt, t('time.locale')) })
  return (
    <div className={css.panel}>
      <header className={css.panelHead}>
        <h2>{t('unfinished.title')}</h2>
        <p className={css.meta}>
          {t(tasks.length === 1 ? 'unfinished.count.one' : 'unfinished.count.other', { count: tasks.length })}
          {meta === '' ? '' : ` · ${meta}`}
          {analyzing && (
            <span className={css.metaSpinner} role="status" aria-label={t('unfinished.waiting')}>
              <IconLoadingOutlineRegular size={14} />
            </span>
          )}
        </p>
      </header>
      <ul className={css.taskList}>
        {tasks.map(task => (
          <li key={task.id} className={css.taskRow}>
            <div className={css.taskHead}>
              <Tag tone={task.status === 'in_progress' ? 'info' : 'neutral'}>
                {t(task.status === 'in_progress' ? 'unfinished.status.in_progress' : 'unfinished.status.pending')}
              </Tag>
              <span className={css.taskTitle}>{task.title}</span>
            </div>
            {task.detail !== '' && <p className={css.taskDetail}>{task.detail}</p>}
            <p className={css.taskMeta}>
              {t(task.source === 'todo' ? 'unfinished.source.todo' : 'unfinished.source.recap')}
              {task.sessionTitle === null ? '' : ` · ${task.sessionTitle}`}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Render the current insights page.
 * @param props - tab information, the shared source, the refresh callback, and localized copy.
 * @returns the two-view detail page.
 */
export function InsightsTab({ useTabInfo, useInsights, onRefresh, t }: InsightsTabProps): ReactNode {
  const { tab } = useTabInfo()
  const initial = recordedView(tab.navigation.params) ?? 'recap'
  const [shown, setShown] = useState<{ readonly revision: number; readonly view: InsightsView }>({
    revision: tab.navigation.revision,
    view: initial,
  })
  if (shown.revision !== tab.navigation.revision) setShown({ revision: tab.navigation.revision, view: initial })
  const view = shown.view
  const status = useInsights(state => state.status)
  const snapshot = useInsights(state => state.snapshot)
  const refreshing = useInsights(state => state.refreshing)
  const base = `muse-insights-${tab.id}`
  const refresh = (): void => { void onRefresh(tab.signal) }
  const openWorkItem = (day: string, title: string): void => {
    tab.actions.openTab(WORK_ITEM_TAB_KIND, { params: { day, title } })
  }
  return (
    <div className={css.tab}>
      <div className={css.toolbar}>
        <SegmentedControl
          id={base}
          value={view}
          options={[
            { value: 'recap', label: t('view.recap') },
            { value: 'unfinished', label: t('view.unfinished') },
          ]}
          onChange={(next) => { setShown({ revision: shown.revision, view: next }) }}
          label={t('view.label')}
          className={css.viewSwitch}
        />
        <Button
          variant="ghost"
          size="sm"
          className={css.refreshButton}
          aria-label={t('refresh')}
          disabled={refreshing || status === 'loading'}
          icon={refreshing
            ? <IconLoadingOutlineRegular size={16} className={css.spin} />
            : <IconRefreshOutlineRegular size={16} />}
          onClick={refresh}
        />
      </div>
      <div
        id={`${base}-${view}-panel`}
        className={css.body}
        role="tabpanel"
        aria-labelledby={`${base}-${view}`}
      >
        {snapshot === null && status === 'error' && <InsightFailure t={t} onRetry={refresh} />}
        {snapshot === null && status !== 'error' && <InsightLoading t={t} />}
        {snapshot !== null && !snapshot.available && (
          <EmptyState icon={<IconSparkleRegular size={24} />} title={t('empty.signedOut.title')} body={t('empty.signedOut.body')} />
        )}
        {snapshot !== null && snapshot.available && view === 'recap' && (
          snapshot.recap === null
            ? <EmptyState
              icon={<IconSparkleRegular size={24} />}
              title={t('empty.recap.title')}
              body={t('empty.recap.body')}
              action={<Button variant="outline" size="sm" onClick={refresh}>{t('refresh')}</Button>}
            />
            : <RecapPanel recap={snapshot.recap} day={snapshot.day} t={t} onOpenWorkItem={openWorkItem} />
        )}
        {snapshot !== null && snapshot.available && view === 'unfinished' && (
          <UnfinishedPanel
            tasks={snapshot.unfinished.tasks}
            analyzedAt={snapshot.unfinished.analyzedAt}
            analyzing={snapshot.analyzing}
            t={t}
          />
        )}
      </div>
    </div>
  )
}
