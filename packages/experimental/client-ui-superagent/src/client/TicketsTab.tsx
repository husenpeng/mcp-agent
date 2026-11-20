/** The team's tickets beside the conversation: submit work, watch the flow, and step in mid-run. */

import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { InjectFace, PropsLocale } from '@tomato/client-ui-slots'
import { Button, IconRefreshOutlineMedium, Input } from '@tomato/client-ui-primitives'
import type { RemoteResult } from '@tomato/typert-protocol'
import type { TicketDetail } from '@tomato/superagent-runtime/types'
import type { Key } from './ticket-locales.ts'
import type { TicketActions, TicketRow, TicketSource } from './tickets.ts'
import css from './TicketsTab.module.css'

/** Locale keys for every Host ticket stage and person-owned action. */
const STAGE_KEYS: Record<TicketRow['stage'], Key> = {
  working: 'stage.working', person: 'stage.person', idle: 'stage.idle', ended: 'stage.ended',
}
const NEEDS_KEYS: Record<NonNullable<TicketRow['needs']>, Key> = {
  delivery: 'needs.delivery', answer: 'needs.answer', review: 'needs.review', blocked: 'needs.blocked', failed: 'needs.failed',
}
const STATE_KEYS: Record<NonNullable<TicketRow['state']>, Key> = {
  progress: 'state.progress', waiting: 'state.waiting', ready: 'state.ready',
  blocked: 'state.blocked', failed: 'state.failed', dropped: 'state.dropped',
}
const SCOPE_KEYS: Record<TicketDetail['mandate']['scope'], Key> = {
  investigate: 'scope.investigate', change: 'scope.change', release: 'scope.release',
}
const STRENGTH_KEYS: Record<TicketDetail['mandate']['strength'], Key> = {
  explicit: 'strength.explicit', proposed: 'strength.proposed',
}

/** Everything the panel needs injected. */
export interface TicketsTabInjected {
  readonly hooks: {
    /** Host ticket read state shared by visits to the panel. */
    readonly tickets: TicketSource
  }
  /** Refresh the Host list; concurrent calls share one request. */
  readonly refresh: () => Promise<void>
  /** The person's submit, detail, message, cancel, and stop operations. */
  readonly actions: TicketActions
}

/** One detail read in flight or settled. */
interface DetailState {
  readonly status: 'loading' | 'ready' | 'error'
  readonly value?: TicketDetail
}

/**
 * Render the team's ticket list with a submit composer and a per-ticket flow
 * view, retaining prior rows when a refresh fails.
 * @param props - injected read state, refresh action, person operations, and bound translator.
 * @returns the panel body.
 */
export function TicketsTab({
  useTickets, refresh, actions, t,
}: InjectFace<TicketsTabInjected> & PropsLocale<'superagentTickets'>): JSX.Element {
  const { status, rows } = useTickets(snapshot => snapshot)
  const [request, setRequest] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<string | undefined>(undefined)
  const [selected, setSelected] = useState<string | undefined>(undefined)
  const [detail, setDetail] = useState<DetailState>({ status: 'loading' })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (selected === undefined) return
    let live = true
    setDetail({ status: 'loading' })
    void actions.detail(selected).then((result) => {
      if (!live) return
      setDetail(result.ok ? { status: 'ready', value: result.value } : { status: 'error' })
    })
    return () => { live = false }
  }, [selected, rows, actions])

  const fail = (error: { readonly message: string }): void => {
    setNotice(`${t('notice.failed')} ${error.message}`)
  }
  const submit = async (): Promise<void> => {
    const text = request.trim()
    if (text === '' || submitting) return
    setSubmitting(true)
    setNotice(undefined)
    try {
      const result = await actions.submit(text)
      if (!result.ok) { fail(result.error); return }
      if (result.value.kind === 'accepted') {
        setRequest('')
        setSelected(result.value.tickets[0]?.id)
        return
      }
      const prefix = result.value.kind === 'declined' ? t('notice.declined') : t('notice.refused')
      setNotice(`${prefix} ${result.value.reason}`)
    } finally {
      setSubmitting(false)
    }
  }
  const run = async <T,>(operation: () => Promise<RemoteResult<T>>): Promise<void> => {
    if (busy) return
    setBusy(true)
    setNotice(undefined)
    try {
      const result = await operation()
      if (!result.ok) fail(result.error)
    } finally {
      setBusy(false)
    }
  }
  const send = async (): Promise<void> => {
    const text = message.trim()
    if (text === '' || selected === undefined || busy) return
    setBusy(true)
    setNotice(undefined)
    try {
      const result = await actions.message(selected, text)
      if (result.ok) setMessage('')
      else fail(result.error)
    } finally {
      setBusy(false)
    }
  }

  const row = rows.find(entry => entry.id === selected)
  const open = row !== undefined && !row.stopped && row.stage !== 'ended'
  const value = detail.value
  return (
    <section className={css.view} aria-label={t('tab.title')}>
      <div className={css.toolbar}>
        <Button size="sm" icon={<IconRefreshOutlineMedium />} onClick={() => { void refresh() }}>
          {t('refresh')}
        </Button>
      </div>
      <form
        className={css.composer}
        onSubmit={(event) => { event.preventDefault(); void submit() }}
      >
        <Input
          value={request}
          placeholder={t('composer.placeholder')}
          aria-label={t('composer.placeholder')}
          onChange={(event) => { setRequest(event.target.value) }}
        />
        <Button size="sm" type="submit" disabled={submitting || request.trim() === ''}>
          {t('composer.submit')}
        </Button>
      </form>
      {notice === undefined ? null : <p className={css.notice} role="alert">{notice}</p>}
      {status !== 'error' ? null : (
        <div className={css.error} role="alert">
          <span>{t('error')}</span>
          <Button size="sm" variant="outline" onClick={() => { void refresh() }}>{t('retry')}</Button>
        </div>
      )}
      {status === 'loading'
        ? (
          <ol className={css.rows} role="status" aria-label={t('loading')}>
            <li className={css.skeletonRow} aria-hidden="true"><span className={css.skeletonLine} /><span className={`${css.skeletonLine} ${css.short}`} /></li>
            <li className={css.skeletonRow} aria-hidden="true"><span className={css.skeletonLine} /><span className={`${css.skeletonLine} ${css.short}`} /></li>
            <li className={css.skeletonRow} aria-hidden="true"><span className={css.skeletonLine} /><span className={`${css.skeletonLine} ${css.short}`} /></li>
          </ol>
        )
        : status === 'error' && rows.length === 0
          ? null
          : rows.length === 0
            ? <p className={css.empty}>{t('empty')}</p>
            : (
              <ol className={css.rows}>
                {rows.map(entry => (
                  <li key={entry.id} className={css.row} data-stage={entry.stage} data-selected={entry.id === selected || undefined}>
                    <button
                      type="button"
                      className={css.rowButton}
                      aria-expanded={entry.id === selected}
                      onClick={() => { setSelected(entry.id === selected ? undefined : entry.id) }}
                    >
                      <p className={css.subject}>{entry.subject}</p>
                      <p className={css.stage}>
                        {t(STAGE_KEYS[entry.stage])}
                        {entry.needs === undefined ? null : ` · ${t(NEEDS_KEYS[entry.needs])}`}
                        {entry.running ? ` · ${t('row.running')}` : null}
                        {entry.stopped ? ` · ${t('row.stopped')}` : null}
                      </p>
                      <p className={css.meta}>
                        {entry.state === undefined ? null : `${t('row.state')}: ${t(STATE_KEYS[entry.state])} · `}
                        {t('row.rounds')}: {entry.rounds}
                        {entry.blocking === 0 ? null : ` · ${t('row.blocking')}: ${entry.blocking}`}
                      </p>
                    </button>
                    {entry.id !== selected ? null : (
                      <div className={css.detail}>
                        <p className={css.detailTitle}>{t('detail.title')}</p>
                        {detail.status === 'loading'
                          ? <p className={css.meta} role="status">{t('detail.loading')}</p>
                          : detail.status === 'error' || value === undefined
                            ? <p className={css.meta} role="alert">{t('detail.error')}</p>
                            : (
                              <>
                                <p className={css.meta}>
                                  {t('detail.mandate')}: {t(SCOPE_KEYS[value.mandate.scope])} · {t(STRENGTH_KEYS[value.mandate.strength])} · {value.mandate.policyVersion} · {value.mandate.sender}
                                </p>
                                <p className={css.detailTitle}>{t('detail.runs')}</p>
                                <ol className={css.runs}>
                                  {value.assignments.map((assignment, index) => (
                                    <li key={assignment.id} className={css.run}>
                                      <p className={css.meta}>
                                        {`#${String(index + 1)} ${assignment.session}`}
                                        {assignment.report === undefined ? null : ` · ${t(STATE_KEYS[assignment.report.state])}`}
                                        {assignment.ended ? null : ` · ${t('row.running')}`}
                                      </p>
                                      {assignment.report?.summary === undefined
                                        ? null
                                        : <p className={css.runText}>{assignment.report.summary}</p>}
                                      {assignment.report?.question === undefined
                                        ? null
                                        : <p className={css.runText}>{t('detail.question')}: {assignment.report.question}</p>}
                                    </li>
                                  ))}
                                </ol>
                                {value.review === undefined ? null : (
                                  <>
                                    <p className={css.detailTitle}>{t('detail.review')} · {t('row.rounds')}: {value.review.rounds}</p>
                                    {value.review.findings.length === 0
                                      ? <p className={css.meta}>{t('detail.noFindings')}</p>
                                      : (
                                        <ul className={css.findings}>
                                          {value.review.findings.map((finding, index) => (
                                            <li key={`${finding.file}-${String(index)}`} className={css.meta}>
                                              {`${finding.severity.toUpperCase()} ${finding.file}${finding.line === undefined ? '' : `:${String(finding.line)}`} ${finding.summary}`}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                  </>
                                )}
                                <p className={css.detailTitle}>{t('detail.messages')}</p>
                                <ol className={css.runs}>
                                  {value.triggers.map((trigger, index) => (
                                    <li key={`${trigger.at}-${String(index)}`} className={css.run}>
                                      <p className={css.meta}>{trigger.source}</p>
                                      <p className={css.runText}>{trigger.text}</p>
                                    </li>
                                  ))}
                                </ol>
                              </>
                            )}
                        {row === undefined ? null : (
                          <div className={css.actions}>
                            {row.running
                              ? (
                                <Button size="sm" variant="outline" disabled={busy} onClick={() => { void run(() => actions.cancel(row.id)) }}>
                                  {t('action.cancel')}
                                </Button>
                              )
                              : null}
                            {open
                              ? (
                                <Button size="sm" variant="outline" disabled={busy} onClick={() => { void run(() => actions.stop(row.id)) }}>
                                  {t('action.stop')}
                                </Button>
                              )
                              : null}
                          </div>
                        )}
                        {open
                          ? (
                            <form
                              className={css.composer}
                              onSubmit={(event) => { event.preventDefault(); void send() }}
                            >
                              <Input
                                value={message}
                                placeholder={t('action.messagePlaceholder')}
                                aria-label={t('action.messagePlaceholder')}
                                onChange={(event) => { setMessage(event.target.value) }}
                              />
                              <Button size="sm" type="submit" disabled={busy || message.trim() === ''}>
                                {t('action.send')}
                              </Button>
                            </form>
                          )
                          : null}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
    </section>
  )
}
