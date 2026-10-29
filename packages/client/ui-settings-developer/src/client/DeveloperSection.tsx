/** Development-only settings page: the recording switch plus the shared log and page facts. */
import { useState } from 'react'
import { Switch } from '@tomato/client-ui-primitives'
import type { ObservableSnapshot } from '@tomato/client-store'
import type { InjectFace, PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
import type { DeveloperState } from './store.ts'
import { GatewayLog } from './GatewayLog.tsx'
import { PageFacts } from './PageFacts.tsx'
import css from './panel.module.css'

/** Everything the page reads and writes, supplied by the plugin's apply closure. */
export interface DeveloperSectionInjected {
  hooks: {
    enabled: ObservableSnapshot<boolean>
    gateway: ObservableSnapshot<DeveloperState>
  }
  setEnabled(enabled: boolean): Promise<void>
  clear(): void
  refreshPageInfo(): void
}

/** Props the slot renderer derives for this page. */
export type DeveloperSectionProps =
  PropsRuntime<'settings.section'> & PropsLocale<'settings.developer'> & InjectFace<DeveloperSectionInjected>

/**
 * Render the developer page.
 * @param props - acceptance state, recorded exchanges, page facts, and localized copy.
 * @returns the Settings section.
 */
export function DeveloperSection({ useEnabled, useGateway, setEnabled, clear, refreshPageInfo, t }: DeveloperSectionProps) {
  const enabled = useEnabled(value => value)
  const state = useGateway(value => value)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  return <div className={css.root}>
    <section className={css.header}>
      <div>
        <h3 className={css.title}>{t('title')}</h3>
        <p className={css.description}>{t('description')}</p>
      </div>
      <Switch checked={enabled} disabled={busy} label={t('enable')}
        onChange={(next) => {
          setFailed(false)
          setBusy(true)
          void setEnabled(next).catch(() => { setFailed(true) }).finally(() => { setBusy(false) })
        }} />
    </section>
    {failed && <div className={css.error} role="alert">{t('enableError')}</div>}
    <GatewayLog entries={state.entries} dropped={state.dropped} clear={clear} t={t} />
    <PageFacts page={state.page} refresh={refreshPageInfo} t={t} />
  </div>
}
