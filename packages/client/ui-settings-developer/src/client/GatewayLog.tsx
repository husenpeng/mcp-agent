/** Bounded gateway exchange list shared by the settings page and the floating panel. */
import { useState } from 'react'
import type { DeveloperSettingsLocaleKey } from './locales.ts'
import type { DeveloperEntry } from './store.ts'
import { entryDetail, entryLabel, entryOutcome } from './format.ts'
import css from './panel.module.css'

/** Localized copy reader the page and panel pass down. */
export type DeveloperTranslate = (key: DeveloperSettingsLocaleKey) => string

function timeOf(entry: DeveloperEntry): string {
  const observation = entry.observation
  const at = observation.kind === 'rpc' ? observation.startedAt : observation.at
  return new Date(at).toLocaleTimeString()
}

/** One recorded exchange list with expandable payloads. */
export interface GatewayLogProps {
  readonly entries: readonly DeveloperEntry[]
  readonly dropped: number
  readonly clear: () => void
  readonly t: DeveloperTranslate
}

/**
 * Render the recorded exchanges.
 * @param props - retained entries, the drop count, the clear action, and localized copy.
 * @returns the gateway log section.
 */
export function GatewayLog({ entries, dropped, clear, t }: GatewayLogProps) {
  const [expanded, setExpanded] = useState<number | null>(null)
  return <section className={css.panel}>
    <div className={css.panelHeader}>
      <h4 className={css.panelTitle}>{t('gatewayTitle')}</h4>
      <div className={css.actions}>
        {dropped > 0 && <span className={css.dropped}>{t('dropped')}{dropped}</span>}
        <button type="button" className={css.action} onClick={clear}>{t('clear')}</button>
      </div>
    </div>
    {entries.length === 0
      ? <p className={css.empty}>{t('empty')}</p>
      : <ol className={css.list}>
        {entries.map(entry => <li key={entry.id} className={css.entry} data-outcome={
          entry.observation.kind === 'rpc' ? entry.observation.outcome : undefined}>
          <button type="button" className={css.entryHeader} aria-expanded={expanded === entry.id}
            onClick={() => { setExpanded(current => current === entry.id ? null : entry.id) }}>
            <span className={css.time}>{timeOf(entry)}</span>
            <span className={css.entryLabel}>{entryLabel(entry, t)}</span>
            <span className={css.outcome}>{entryOutcome(entry, t)}</span>
          </button>
          {expanded === entry.id && <pre className={css.detail}>{entryDetail(entry, t)}</pre>}
        </li>)}
      </ol>}
  </section>
}
