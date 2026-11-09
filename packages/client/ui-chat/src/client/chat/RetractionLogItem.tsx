import { memo } from 'react'
import { IconEditOutlineRegular } from '@tomato/client-ui-primitives'
import type { ChatNodeViewProps } from '../contract/slots.ts'
import { formatMessageClock } from './message-chrome.ts'
import { useCalendarDay } from './use-calendar-day.ts'
import css from './RetractionLogItem.module.css'

/**
 * Durable audit line for one retracted exchange.
 * @param props - Node payload and the Chat locale seat.
 * @returns the retraction log row.
 */
export const RetractionLogItem = memo(function RetractionLogItem({
  node, t,
}: ChatNodeViewProps<'retraction'>) {
  const day = useCalendarDay()
  const data = node.data
  return (
    <div className={css.root} role="status" data-retraction-log={data.messageId}>
      <IconEditOutlineRegular className={css.icon} />
      <span className={css.title}>{t('message.retraction.log')}</span>
      {data.attachments.length === 0 ? null : (
        <span className={css.attachments} title={data.attachments.join(', ')}>
          {t('message.retraction.attachments', {
            count: data.attachments.length,
            names: data.attachments.join(t('message.referenceSeparator')),
          })}
        </span>
      )}
      <span className={css.time}>{formatMessageClock(data.time, t, day)}</span>
    </div>
  )
})
