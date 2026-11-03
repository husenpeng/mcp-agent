/**
 * Frame-wide notice for a new daily recap or a proactive unfinished-task
 * reminder. The whole card opens the matching right-Sidebar view; the close
 * control only dismisses the card.
 */
import type { ReactNode } from 'react'
import {
  IconAlarmClockOutlineRegular,
  IconCloseOutlineRegular,
  IconSparkleRegular,
} from '@tomato/client-ui-primitives'
import type { HostObservable, InjectFace, PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
import type {} from '@tomato/client-ui-layout/client'
import { assertNever } from '@tomato/util-values'
import type { InsightsState, InsightsView } from './source.ts'
import css from './Insights.module.css'

/** Everything the overlay entry needs injected. */
export interface NoticeInjected {
  /** Shared insights read state; the renderer binds it to `useInsights`. */
  readonly hooks: { readonly insights: HostObservable<InsightsState> }
  /** Open the details page for one view. */
  readonly onOpen: (view: InsightsView) => void
  /** Close the card without opening details. */
  readonly onDismiss: () => void
}

/** Props of the overlay entry. */
export type NoticeProps = PropsRuntime<'shell.overlay'>
  & PropsLocale<'museInsights'>
  & InjectFace<NoticeInjected>

/** One notice's title and supporting line, in the current language. */
function copy(
  notice: NonNullable<InsightsState['notice']>,
  t: NoticeProps['t'],
): { readonly title: string; readonly body: string; readonly icon: ReactNode } {
  switch (notice.kind) {
    case 'recap': {
      const count = notice.recap.workItems.length
      const headline = notice.recap.headline.trim()
      const body = headline !== ''
        ? t('notice.recap.body.headline', { headline })
        : count === 0
          ? t('notice.recap.ready')
          : t(count === 1 ? 'notice.recap.body.one' : 'notice.recap.body.other', { count })
      return { title: t('notice.recap.title'), body, icon: <IconSparkleRegular size={18} /> }
    }
    case 'unfinished': {
      const count = notice.tasks.length
      const first = notice.tasks[0]?.title ?? ''
      const body = count > 1 ? `${first} · ${t('notice.unfinished.more', { count: count - 1 })}` : first
      return {
        title: t(count === 1 ? 'notice.unfinished.title.one' : 'notice.unfinished.title.other', { count }),
        body,
        icon: <IconAlarmClockOutlineRegular size={18} />,
      }
    }
    /* v8 ignore next -- InsightsNotice is a closed union; every member is handled above. */
    default:
      return assertNever(notice)
  }
}

/**
 * Render the current notice, or nothing.
 * @param props - the shared notice source, its navigation and dismissal callbacks, and localized copy.
 * @returns the clickable notice card.
 */
export function InsightNotice({ useInsights, onOpen, onDismiss, t }: NoticeProps): ReactNode {
  const notice = useInsights(state => state.notice)
  if (notice === null) return null
  const { title, body, icon } = copy(notice, t)
  return (
    <div className={css.notice} role="status" aria-live="polite" data-notice-kind={notice.kind}>
      <button type="button" className={css.noticeOpen} onClick={() => { onOpen(notice.kind) }}>
        <span className={css.noticeIcon} aria-hidden>{icon}</span>
        <span className={css.noticeText}>
          <span className={css.noticeTitle}>{title}</span>
          <span className={css.noticeBody}>{body}</span>
          <span className={css.noticeAction}>{t('notice.view')}</span>
        </span>
      </button>
      <button type="button" className={css.noticeClose} aria-label={t('notice.dismiss')} onClick={onDismiss}>
        <IconCloseOutlineRegular size={16} />
      </button>
    </div>
  )
}
