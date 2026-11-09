/** The remote-access page: tunnel lifecycle, the pairing link, and its QR code. */
import { useState } from 'react'
import { Button, useClipboardCopy } from '@tomato/client-ui-primitives'
import type { ObservableSnapshot } from '@tomato/client-store'
import type { InjectFace, PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
import type { RemotePageState } from './state.ts'
import css from './RemoteSection.module.css'

/** Everything the page reads and writes, supplied by the plugin's apply closure. */
export interface RemoteSectionInjected {
  hooks: {
    remote: ObservableSnapshot<RemotePageState>
  }
  start(): Promise<void>
  stop(): Promise<void>
}

/** Props the slot renderer derives for this page. */
export type RemoteSectionProps =
  PropsRuntime<'settings.section'> & PropsLocale<'settings.remote'> & InjectFace<RemoteSectionInjected>

/**
 * Render the remote-access page.
 * @param props - tunnel snapshot, lifecycle actions, and localized copy.
 * @returns the Settings section.
 */
export function RemoteSection({ useRemote, start, stop, t }: RemoteSectionProps) {
  const state = useRemote(value => value)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const clipboard = useClipboardCopy(state.pairingUrl ?? '')
  if (!state.supported) {
    return <div className={css.root}>
      <section className={css.header}>
        <div>
          <h3 className={css.title}>{t('title')}</h3>
          <p className={css.description}>{t('desktopOnly')}</p>
        </div>
      </section>
    </div>
  }
  const run = (action: () => Promise<void>): void => {
    setBusy(true)
    setFailed(false)
    void action().catch(() => { setFailed(true) }).finally(() => { setBusy(false) })
  }
  return <div className={css.root}>
    <section className={css.header}>
      <div>
        <h3 className={css.title}>{t('title')}</h3>
        <p className={css.description}>{t('description')}</p>
      </div>
    </section>
    <div className={css.row}>
      <span className={css.label}>{t('status')}</span>
      <span className={state.phase === 'failed' ? css.phaseFailed : css.phase}>{t(`phase.${state.phase}`)}</span>
    </div>
    {state.message !== undefined && <p className={css.error} role="alert">{state.message}</p>}
    {state.pairingUrl !== undefined && <section className={css.panel}>
      <span className={css.label}>{t('pairingLink')}</span>
      <div className={css.linkRow}>
        <code className={css.link}>{state.pairingUrl}</code>
        <Button size="sm" onClick={clipboard.onCopy}>{clipboard.copied ? t('copied') : t('copy')}</Button>
      </div>
      {state.pairingQr !== undefined && <img className={css.qr} src={state.pairingQr} alt={t('qrAlt')} width={200} height={200} />}
      <p className={css.hint}>{t('qrHint')}</p>
    </section>}
    {failed && <p className={css.error} role="alert">{t('failed')}</p>}
    <div className={css.actions}>
      <Button size="sm" variant="primary" disabled={busy || state.phase === 'online' || state.phase === 'starting'}
        onClick={() => { run(start) }}>{t('start')}</Button>
      <Button size="sm" disabled={busy || state.phase === 'off'} onClick={() => { run(stop) }}>{t('stop')}</Button>
    </div>
    <p className={css.hint}>{t('autoStart')}</p>
  </div>
}
