/**
 * The team's tickets beside the conversation: one row per ticket with where it
 * stands, newest list first. The panel is read-only and renders only what the
 * runtime already logged.
 */
import { useSyncExternalStore } from 'react'
import type { JSX } from 'react'
import type { PropsLocale } from '@tomato/client-ui-slots'
import type { Key } from './ticket-locales.ts'
import type { TicketRow } from './tickets.ts'

/** Inline styles: the panel ships no stylesheet, so a source-mode Host can import it. */
const styles = {
  view: { display: 'flex', flexDirection: 'column' as const, gap: 10, padding: '14px 16px', color: 'var(--dsw-alias-label-primary)' },
  empty: { margin: 0, color: 'var(--dsw-alias-label-secondary)', fontSize: 12 },
  rows: { display: 'flex', flexDirection: 'column' as const, gap: 8, margin: 0, padding: 0, listStyle: 'none' },
  row: { display: 'flex', flexDirection: 'column' as const, gap: 2, padding: '8px 10px', border: '1px solid var(--dsw-alias-line-primary)', borderRadius: 8 },
  subject: { margin: 0, fontSize: 13, lineHeight: 1.45, overflowWrap: 'anywhere' as const },
  stage: { margin: 0, fontSize: 11, color: 'var(--dsw-alias-label-secondary)' },
  meta: { margin: 0, fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' },
}

/** Everything the panel needs injected. */
export interface TicketsTabInjected {
  /** Live ticket rows over the Session's event window. */
  readonly tickets: {
    readonly getSnapshot: () => readonly TicketRow[]
    readonly subscribe: (listener: () => void) => () => void
  }
}

/**
 * Render the team's ticket list.
 * @param props - injected live rows and the bound translator.
 * @returns the panel body.
 */
export function TicketsTab({ tickets, t }: TicketsTabInjected & PropsLocale<'superagentTickets'>): JSX.Element {
  const rows = useSyncExternalStore(tickets.subscribe, tickets.getSnapshot)
  return (
    <section style={styles.view} aria-label={t('tab.title')}>
      {rows.length === 0
        ? <p style={styles.empty}>{t('empty')}</p>
        : (
          <ol style={styles.rows}>
            {rows.map(row => (
              <li key={row.id} style={row.stage === 'person' ? { ...styles.row, borderColor: 'var(--dsw-alias-label-secondary)' } : styles.row} data-stage={row.stage}>
                <p style={styles.subject}>{row.subject}</p>
                <p style={styles.stage}>
                  {t(`stage.${row.stage}` as Key)}
                  {row.needs === undefined ? null : ` · ${t(`needs.${row.needs}` as Key)}`}
                </p>
                <p style={styles.meta}>
                  {row.state === undefined ? null : `${t('row.state')}: ${row.state} · `}
                  {t('row.rounds')}: {row.rounds}
                  {row.blocking === 0 ? null : ` · ${t('row.blocking')}: ${row.blocking}`}
                </p>
              </li>
            ))}
          </ol>
        )}
    </section>
  )
}
