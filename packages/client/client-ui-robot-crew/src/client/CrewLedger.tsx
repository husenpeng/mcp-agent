/** Live flow ledger of one crew run: state, guard counters, step outcomes, memory, and A2A traffic. */
import type { ReactNode } from 'react'
import type { CrewEntry, CrewGuardSpec, CrewRun, CrewRunId } from '@tomato/experimental-robot-crew'
import type { TranslateNS } from '@tomato/client-ui-slots'
import { Button, Tag } from '@tomato/client-ui-primitives'
import type { TagTone } from '@tomato/client-ui-primitives'
import { NS } from './locales.ts'
import type { LedgerFilter } from './types.ts'
import { matchesFilter } from './types.ts'
import css from './CrewStudio.module.css'

/** Owner callbacks of the ledger. */
export interface CrewLedgerProps {
  readonly run?: CrewRun | undefined
  readonly runs: readonly CrewRun[]
  readonly entries: readonly CrewEntry[]
  readonly filter: LedgerFilter
  readonly guard: CrewGuardSpec
  readonly t: TranslateNS<typeof NS>
  readonly onFilter: (filter: LedgerFilter) => void
  readonly onSelectRun: (run: CrewRunId) => void
  readonly onCancel: (run: CrewRunId) => void
  readonly onCollapse: () => void
  readonly error?: string | undefined
}

/** Tag tone of a run state. */
function toneOf(run: CrewRun): TagTone {
  if (run.state === 'succeeded') return 'success'
  if (run.state === 'failed') return 'danger'
  if (run.state === 'tripped') return 'warning'
  if (run.state === 'running' || run.state === 'queued') return 'info'
  return 'neutral'
}

/** Localized label of one ledger entry kind. */
const KIND_KEY = {
  'run-start': 'run.entry.runStart',
  'brief': 'run.entry.brief',
  'step-start': 'run.entry.stepStart',
  'step-result': 'run.entry.stepResult',
  'memory': 'run.entry.memory',
  'drift': 'run.entry.drift',
  'handoff': 'run.entry.handoff',
  'a2a-request': 'run.entry.a2aRequest',
  'a2a-reply': 'run.entry.a2aReply',
  'guard': 'run.entry.guard',
  'run-end': 'run.entry.runEnd',
} as const

/** Tone class of one ledger entry. */
function kindTone(kind: CrewEntry['kind']) {
  if (kind === 'guard' || kind === 'drift') return css.entryWarn
  if (kind === 'memory') return css.entryMemory
  if (kind === 'a2a-request' || kind === 'a2a-reply' || kind === 'handoff') return css.entryA2a
  if (kind === 'run-start' || kind === 'run-end') return css.entryRun
  return css.entryStep
}

/**
 * Render one entry's body, folding long text behind a disclosure.
 * @param props.entry - ledger entry.
 * @returns the entry text block.
 */
function EntryText({ entry }: { readonly entry: CrewEntry }) {
  const text = entry.text ?? ''
  if (text === '') return null
  if (text.length <= 180) return <p className={css.entryText}>{text}</p>
  return (
    <details className={css.entryDetails}>
      <summary>{text.slice(0, 160)}…</summary>
      <pre className={css.entryFull}>{text}</pre>
    </details>
  )
}

/**
 * Render the selected run's ledger and history.
 * @param props - runs, entries, filter, and callbacks.
 * @returns the ledger panel.
 */
export function CrewLedger({
  run, runs, entries, filter, guard, t, onFilter, onSelectRun, onCancel, onCollapse, error,
}: CrewLedgerProps): ReactNode {
  const history = runs.slice(-6).reverse()
  const shown = entries.filter(entry => matchesFilter(entry, filter))
  const filters: readonly LedgerFilter[] = ['all', 'steps', 'memory', 'a2a', 'guard']
  return (
    <section className={css.ledger}>
      <div className={css.ledgerHead}>
        <div className={css.ledgerTitle}>
          <span>{t('run.title')}</span>
          {run === undefined ? null : <Tag tone={toneOf(run)}>{t(`run.state.${run.state}`)}</Tag>}
          {run?.trip === undefined ? null : <Tag tone="warning">{t('run.trip', { reason: t(`run.trip.${run.trip}`) })}</Tag>}
        </div>
        <div className={css.ledgerMetrics}>
          {run === undefined ? null : (
            <>
              <span>{t('run.metrics.steps', { used: run.steps, limit: guard.maxSteps })}</span>
              <span>{t('run.metrics.tokens', { used: run.tokens.toLocaleString(), limit: guard.tokens.toLocaleString() })}</span>
              <span>{t('run.metrics.messages', { used: run.messages, limit: guard.maxMessages })}</span>
            </>
          )}
          {run === undefined || (run.state !== 'queued' && run.state !== 'running')
            ? null
            : <Button variant="outline" onClick={() => { onCancel(run.id) }}>{t('toolbar.cancel')}</Button>}
          <button type="button" className={css.iconButton} onClick={onCollapse} aria-label={t('common.close')}>▾</button>
        </div>
      </div>
      <div className={css.ledgerBody}>
        {run === undefined ? (
          <p className={css.emptyLine}>{t('run.empty')}</p>
        ) : (
          <>
            <div className={css.ledgerFilters}>
              {filters.map(candidate => (
                <button
                  key={candidate}
                  type="button"
                  className={css.filterChip}
                  data-active={candidate === filter}
                  onClick={() => { onFilter(candidate) }}
                >
                  {t(`run.filter.${candidate}`)}
                </button>
              ))}
              <span className={css.ledgerSpacer} />
              {history.map(candidate => (
                <button
                  key={candidate.id}
                  type="button"
                  className={css.runChip}
                  data-active={candidate.id === run.id}
                  onClick={() => { onSelectRun(candidate.id) }}
                  title={t(`run.state.${candidate.state}`)}
                >
                  <span className={css.runChipDot} data-state={candidate.state} />
                  {new Date(candidate.startedAt).toLocaleTimeString()}
                </button>
              ))}
            </div>
            {error === undefined ? null : <p className={css.errorLine}>{error}</p>}
            {run.error === undefined ? null : <p className={css.errorLine}>{run.error}</p>}
            {run.trip !== undefined ? (
              <p className={css.tripLine}>{t('run.trip', { reason: t(`run.trip.${run.trip}`) })}</p>
            ) : null}
            <ol className={css.entries}>
              {shown.length === 0
                ? <li className={css.emptyLine}>{t('run.noEntries')}</li>
                : shown.map(entry => (
                  <li key={entry.seq} className={css.entry} data-kind={entry.kind}>
                    <span className={css.entrySeq}>{entry.seq}</span>
                    <div className={css.entryMain}>
                      <div className={css.entryHead}>
                        <span className={kindTone(entry.kind)}>
                          {entry.kind === 'memory'
                            ? `${t(KIND_KEY.memory)} · ${t(`run.memory.${entry.data?.memory === 'constraint' ? 'constraint' : entry.data?.memory === 'open' ? 'open' : 'decision'}`)}`
                            : t(KIND_KEY[entry.kind])}
                        </span>
                        {entry.node === undefined ? null : <span className={css.entryNode}>{entry.node}</span>}
                        {entry.kind === 'a2a-request' || entry.kind === 'a2a-reply' || entry.kind === 'handoff'
                          ? <span className={css.entryNode}>{String(entry.data?.from ?? '')} → {String(entry.data?.to ?? '')}</span>
                          : null}
                        {entry.kind === 'guard' ? <span className={css.entryNode}>{t('run.guardRefusal')}</span> : null}
                      </div>
                      <EntryText entry={entry} />
                    </div>
                  </li>
                ))}
            </ol>
          </>
        )}
      </div>
    </section>
  )
}
