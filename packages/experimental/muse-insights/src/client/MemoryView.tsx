/**
 * Memory tab body: the Session's memory processing flow in log order, one row
 * per injected snapshot, memory tool call and result, capture pass, and
 * promotion pass. The view is read-only and renders the bounded event text the
 * Session already logged.
 */
import { useSyncExternalStore } from 'react'
import type { PropsLocale } from '@tomato/client-ui-slots'
import type { MemoryFlowItem } from './memory-flow.ts'
import type { MemoryKey } from './memory-locales.ts'
import css from './Memory.module.css'

/** Everything the memory view needs injected. */
export interface MemoryViewInjected {
  /** Live memory rows over the Session's event window. */
  readonly flow: {
    readonly getSnapshot: () => readonly MemoryFlowItem[]
    readonly subscribe: (listener: () => void) => () => void
  }
}

/** One row's badge key. */
const BADGE: Readonly<Record<MemoryFlowItem['kind'], MemoryKey>> = {
  snapshot: 'kind.snapshot',
  call: 'kind.call',
  result: 'kind.result',
  capture: 'kind.capture',
  promotion: 'kind.promotion',
}

/** Render one timestamp in the viewer's locale and time zone. */
function stamp(time: number): string {
  return new Date(time).toLocaleString()
}

/**
 * Render the Session's memory processing flow.
 * @param props - injected live flow and the bound locale translator.
 * @returns the tab body.
 */
export function MemoryView({ flow, t }: MemoryViewInjected & PropsLocale<'museMemory'>) {
  const rows = useSyncExternalStore(flow.subscribe, flow.getSnapshot)
  return (
    <section className={css.view} aria-label={t('tab')}>
      <p className={css.note}>{t('note')}</p>
      {rows.length === 0
        ? <p className={css.empty}>{t('empty')}</p>
        : (
          <ol className={css.rows}>
            {rows.map(row => (
              <li key={row.seq} className={css.row}>
                <div className={css.head}>
                  <span className={css.badge} data-kind={row.kind}>{t(BADGE[row.kind])}</span>
                  <code className={css.title}>{row.title}</code>
                  <span className={css.stamp}>{stamp(row.time)}</span>
                </div>
                <pre className={css.detail}>{row.detail}</pre>
              </li>
            ))}
          </ol>
        )}
    </section>
  )
}
