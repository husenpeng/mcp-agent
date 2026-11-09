/**
 * Trace overview strip: one card per user prompt, rendered above the turn-aware
 * ledger. Each card states the prompt, its execution chain, the number of
 * model steps and tool calls, and the token cost recorded for that trace.
 *
 * The strip is a pure projection of the folded layout; opening a card asks the
 * parent to focus the ledger at that trace's first record.
 *
 * @module @tomato/client/ui-trajectory/TrajectoryTraceOverview
 */

import type { ReactNode } from 'react'
import type { TrajectoryTranslate } from './locales.ts'
import {
  compactTokenCount,
  formatTraceDuration,
  formatTraceTotals,
  traceOriginLabel,
  type TraceSummary,
  type TraceOverview,
} from './trace-overview.ts'
import css from './TrajectoryTraceOverview.module.css'

/** Only non-built-in families earn a chip prefix; the built-ins are the default. */
function toolChipText(traceTool: TraceSummary['tools'][number], t: TrajectoryTranslate): string {
  const name = `${traceTool.name} ×${String(traceTool.count)}`
  return traceTool.origin === 'builtin'
    ? name
    : `${traceOriginLabel(traceTool.origin, t)} · ${name}`
}

function statusLabel(trace: TraceSummary, t: TrajectoryTranslate): string {
  switch (trace.status) {
    case 'running': return t('trace.status.running')
    case 'failed': return t('status.failed')
    case 'completed': return t('status.completed')
  }
}

function countSummary(trace: TraceSummary, t: TrajectoryTranslate): string {
  return [
    t(trace.steps === 1 ? 'summary.steps.one' : 'summary.steps.other', { count: trace.steps }),
    t(trace.calls === 1 ? 'summary.toolCalls.one' : 'summary.toolCalls.other', { count: trace.calls }),
  ].join(' · ')
}

function cardAria(trace: TraceSummary, t: TrajectoryTranslate): string {
  return t('trace.cardAria', {
    turn: trace.turn,
    status: statusLabel(trace, t),
    steps: t(trace.steps === 1 ? 'summary.steps.one' : 'summary.steps.other', { count: trace.steps }),
    calls: t(trace.calls === 1 ? 'summary.toolCalls.one' : 'summary.toolCalls.other', { count: trace.calls }),
    tokens: compactTokenCount(trace.tokens.total),
  })
}

function TraceCard({
  trace, active, onFocus, t,
}: {
  trace: TraceSummary
  active: boolean
  onFocus: (trace: TraceSummary) => void
  t: TrajectoryTranslate
}): ReactNode {
  const tools = trace.tools.slice(0, 3)
  const hiddenTools = trace.tools.length - tools.length
  return (
    <button
      type="button"
      className={css.card}
      aria-label={cardAria(trace, t)}
      aria-pressed={active}
      data-active={active || undefined}
      data-status={trace.status}
      title={t('trace.focusAria', { turn: trace.turn })}
      onClick={() => { onFocus(trace) }}
    >
      <span className={css.cardHead}>
        <span className={css.cardLabel}>{t('trace.label', { turn: trace.turn })}</span>
        <span className={css.statusDot} data-status={trace.status} aria-hidden="true" />
        <span className={css.cardCounts}>{countSummary(trace, t)}</span>
        <span className={css.cardDuration}>
          {formatTraceDuration(trace.durationMs, t)}
        </span>
      </span>
      <span
        className={css.prompt}
        data-empty={trace.prompt === '' || undefined}
      >
        {trace.prompt === '' ? t('record.noContent') : trace.prompt}
      </span>
      <span className={css.chain} aria-hidden="true">
        {trace.chain.length === 0
          ? <span className={css.chainEmpty} />
          : trace.chain.map((step, index) => (
            <span
              key={`${step.kind}-${String(index)}`}
              className={css.pip}
              data-kind={step.kind}
            />
          ))}
      </span>
      <span className={css.cardFoot}>
        <span className={css.tools}>
          {tools.map(tool => (
            <span
              key={tool.name}
              className={css.tool}
              title={traceOriginLabel(tool.origin, t)}
              data-origin={tool.origin}
            >
              {toolChipText(tool, t)}
            </span>
          ))}
          {hiddenTools > 0 && (
            <span className={css.toolMore}>{t('trace.more', { count: hiddenTools })}</span>
          )}
        </span>
        <span className={css.cost} title={t('trace.cost')}>
          {t('unit.tokens', { value: compactTokenCount(trace.tokens.total) })}
        </span>
      </span>
    </button>
  )
}

export interface TrajectoryTraceOverviewProps {
  /** Folded per-turn traces and session totals. */
  overview: TraceOverview
  /** Turn owning the selected ledger record, or the last focused trace. */
  activeTurn: number | null
  /** Focus one trace in the ledger. */
  onFocus: (trace: TraceSummary) => void
  /** Trajectory locale seat. */
  t: TrajectoryTranslate
}

/**
 * Render the trace strip above the ledger.
 * @param props - folded traces, active turn, focus callback, and locale seat.
 * @returns the trace overview section.
 */
export function TrajectoryTraceOverview({
  overview, activeTurn, onFocus, t,
}: TrajectoryTraceOverviewProps) {
  return (
    <section className={css.root} aria-label={t('trace.title')}>
      <div className={css.header}>
        <span className={css.title}>{t('trace.title')}</span>
        <span className={css.summary} title={formatTraceTotals(overview.totals, t)}>
          {overview.traces.length === 0 ? t('trace.empty') : formatTraceTotals(overview.totals, t)}
        </span>
      </div>
      {overview.traces.length === 0 ? null : (
        <div className={css.rail} role="group" aria-label={t('trace.title')}>
          {overview.traces.map(trace => (
            <TraceCard
              key={trace.turn}
              trace={trace}
              active={activeTurn === trace.turn}
              onFocus={onFocus}
              t={t}
            />
          ))}
        </div>
      )}
    </section>
  )
}
