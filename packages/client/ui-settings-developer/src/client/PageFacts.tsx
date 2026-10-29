/** Current client composition, read on demand by the refresh action. */
import type { DeveloperPageInfo } from './page-info.ts'
import type { DeveloperTranslate } from './GatewayLog.tsx'
import css from './panel.module.css'

/** One read of the client composition and its refresh action. */
export interface PageFactsProps {
  readonly page: DeveloperPageInfo | undefined
  readonly refresh: () => void
  readonly t: DeveloperTranslate
}

/**
 * Render the page facts and the live slot tree.
 * @param props - the last read facts, the refresh action, and localized copy.
 * @returns the page-information section.
 */
export function PageFacts({ page, refresh, t }: PageFactsProps) {
  return <section className={css.panel}>
    <div className={css.panelHeader}>
      <h4 className={css.panelTitle}>{t('pageTitle')}</h4>
      <div className={css.actions}>
        <button type="button" className={css.action} onClick={refresh}>{t('refresh')}</button>
      </div>
    </div>
    {page === undefined
      ? null
      : <>
        <dl className={css.info}>
          <dt>{t('pageRelease')}</dt><dd>{page.release}</dd>
          <dt>{t('pageModules')}</dt><dd>{page.modules}</dd>
          <dt>{t('pagePlugins')}</dt><dd>{page.plugins}</dd>
          <dt>{t('pageConnection')}</dt><dd>{page.connection}</dd>
          <dt>{t('pagePanel')}</dt><dd>{page.panel}</dd>
          <dt>{t('pageSessions')}</dt><dd>{page.sessions}</dd>
          <dt>{t('pageSlots')}</dt><dd>{page.slotNodes}</dd>
        </dl>
        <details className={css.tree}>
          <summary>{t('pageTree')}</summary>
          <pre className={css.detail}>{page.slotTree}</pre>
        </details>
      </>}
  </section>
}
