/**
 * Memory tab body: the Session's memory processing flow in log order, one row
 * per injected snapshot, memory tool call and result, capture pass, and
 * promotion pass. The view is read-only and renders the bounded event text the
 * Session already logged.
 */
import { useMemo, useState, useSyncExternalStore } from 'react'
import type { PropsLocale } from '@tomato/client-ui-slots'
import type { MemoryFlowItem, MemoryFlowKind, MemoryFlowRecord } from './memory-flow.ts'
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

/** Filters the toolbar offers; `call` also shows results. */
type Filter = 'all' | MemoryFlowKind

/** One toolbar choice and its copy key. */
interface FilterChoice {
  readonly key: Filter
  readonly label: MemoryKey
}

/** Every toolbar choice, in display order. */
const FILTERS: readonly FilterChoice[] = [
  { key: 'all', label: 'filter.all' },
  { key: 'snapshot', label: 'filter.snapshot' },
  { key: 'call', label: 'filter.call' },
  { key: 'capture', label: 'filter.capture' },
  { key: 'promotion', label: 'filter.promotion' },
]

/** One row's badge key. */
const BADGE: Readonly<Record<MemoryFlowKind, MemoryKey>> = {
  snapshot: 'kind.snapshot',
  call: 'kind.call',
  result: 'kind.result',
  capture: 'kind.capture',
  promotion: 'kind.promotion',
}

/** The localized title of a recognized plugin record. */
const RECORD_TITLE: Readonly<Record<MemoryFlowRecord, MemoryKey>> = {
  snapshot: 'record.snapshot',
  withdrawn: 'record.withdrawn',
  'query-expansion': 'record.queryExpansion',
  'turn-capture': 'record.turnCapture',
  'episode-capture': 'record.episodeCapture',
  promotion: 'record.promotion',
}

/** Render one timestamp in the viewer's locale and time zone. */
function stamp(time: number): string {
  return new Date(time).toLocaleString()
}

/** Whether a row belongs to the selected filter. */
function matches(row: MemoryFlowItem, filter: Filter): boolean {
  if (filter === 'all') return true
  if (filter === 'call') return row.kind === 'call' || row.kind === 'result'
  return row.kind === filter
}

/** Pluralized count of one snapshot section. */
function sectionCount(
  t: PropsLocale<'museMemory'>['t'],
  key: 'memory' | 'index' | 'history',
  count: number,
): string {
  if (key === 'memory') {
    return t(count === 1 ? 'snapshot.memory.one' : 'snapshot.memory.other', { count })
  }
  if (key === 'index') {
    return t(count === 1 ? 'snapshot.index.one' : 'snapshot.index.other', { count })
  }
  return t(count === 1 ? 'snapshot.history.one' : 'snapshot.history.other', { count })
}

/**
 * Render the Session's memory processing flow.
 * @param props - injected live flow and the bound locale translator.
 * @returns the tab body.
 */
export function MemoryView({ flow, t }: MemoryViewInjected & PropsLocale<'museMemory'>) {
  const rows = useSyncExternalStore(flow.subscribe, flow.getSnapshot)
  const [filter, setFilter] = useState<Filter>('all')
  const counts = useMemo(() => ({
    snapshots: rows.filter(row => row.kind === 'snapshot').length,
    calls: rows.filter(row => row.kind === 'call').length,
    captures: rows.filter(row => row.kind === 'capture').length,
    promotions: rows.filter(row => row.kind === 'promotion').length,
  }), [rows])
  const shown = useMemo(() => rows.filter(row => matches(row, filter)), [rows, filter])
  return (
    <section className={css.view} aria-label={t('tab')}>
      <header className={css.header}>
        <p className={css.note}>{t('note')}</p>
        <div className={css.toolbar}>
          <div className={css.filters} role="group" aria-label={t('filter.group')}>
            {FILTERS.map(choice => (
              <button
                key={choice.key}
                type="button"
                className={css.filter}
                aria-pressed={filter === choice.key}
                data-active={filter === choice.key}
                onClick={() => { setFilter(choice.key) }}
              >
                {t(choice.label)}
              </button>
            ))}
          </div>
          <p className={css.summary}>
            {t('summary', {
              snapshots: counts.snapshots,
              calls: counts.calls,
              captures: counts.captures,
              promotions: counts.promotions,
            })}
          </p>
        </div>
      </header>
      {rows.length === 0
        ? <p className={css.empty}>{t('empty')}</p>
        : shown.length === 0
          ? <p className={css.empty}>{t('summary.empty')}</p>
          : (
            <ol className={css.rows}>
              {shown.map(row => (
                <li
                  key={row.seq}
                  className={css.row}
                  data-kind={row.kind}
                  data-tone={row.record === 'withdrawn' ? 'warning' : undefined}
                >
                  <div className={css.head}>
                    <span className={css.badge} data-kind={row.kind}>{t(BADGE[row.kind])}</span>
                    <code className={css.title}>{row.record === undefined ? row.title : t(RECORD_TITLE[row.record])}</code>
                    <span className={css.stamp}>{stamp(row.time)}</span>
                  </div>
                  {row.counts !== undefined && (
                    <p className={css.counts}>
                      {row.counts.memories > 0 && <span>{sectionCount(t, 'memory', row.counts.memories)}</span>}
                      {row.counts.index > 0 && <span>{sectionCount(t, 'index', row.counts.index)}</span>}
                      {row.counts.history > 0 && <span>{sectionCount(t, 'history', row.counts.history)}</span>}
                    </p>
                  )}
                  {row.record === 'withdrawn' && <p className={css.hint}>{t('withdrawn.hint')}</p>}
                  {row.lines.length > 0 && (
                    <ul className={css.lines}>
                      {row.lines.map((line, index) => <li key={`${row.seq}-${index}`}>{line}</li>)}
                    </ul>
                  )}
                  <details className={css.raw}>
                    <summary>{t('raw')}</summary>
                    <pre className={css.detail}>{row.detail}</pre>
                  </details>
                </li>
              ))}
            </ol>
          )}
    </section>
  )
}
