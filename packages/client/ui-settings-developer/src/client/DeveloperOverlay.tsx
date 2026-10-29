/** Floating developer panel: opens with the recording switch so the settings page can close. */
// Type-only: the frame overlay's SlotMap entry.
import type {} from '@tomato/client-ui-layout/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
import type { DeveloperSectionInjected } from './DeveloperSection.tsx'
import { GatewayLog } from './GatewayLog.tsx'
import { PageFacts } from './PageFacts.tsx'
import css from './DeveloperOverlay.module.css'
import panelCss from './panel.module.css'

/** Props the frame overlay renders with, sharing the settings page's inject face. */
export type DeveloperOverlayProps =
  PropsRuntime<'shell.overlay'> & PropsLocale<'settings.developer'> & InjectFace<DeveloperSectionInjected>

/**
 * Render the floating panel while recording is on; closing it turns recording off.
 * @param props - acceptance state, recorded exchanges, page facts, and localized copy.
 * @returns the floating panel, or null while the switch is off.
 */
export function DeveloperOverlay({ useEnabled, useGateway, setEnabled, clear, refreshPageInfo, t }: DeveloperOverlayProps) {
  const enabled = useEnabled(value => value)
  const state = useGateway(value => value)
  if (!enabled) return null
  return <aside className={css.panel} aria-label={t('title')}>
    <header className={css.header}>
      <h2 className={css.title}>{t('title')}</h2>
      <button type="button" className={panelCss.action} onClick={() => { void setEnabled(false) }}>
        {t('close')}
      </button>
    </header>
    <div className={css.body}>
      <GatewayLog entries={state.entries} dropped={state.dropped} clear={clear} t={t} />
      <PageFacts page={state.page} refresh={refreshPageInfo} t={t} />
    </div>
  </aside>
}
