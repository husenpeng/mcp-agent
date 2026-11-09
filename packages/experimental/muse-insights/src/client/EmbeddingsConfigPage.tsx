/**
 * Configuration page of the embedding-provider row. It displays the fixed
 * model and vector length read-only, lets a person edit the endpoint and the
 * credential name, switches semantic search on or off, runs the connectivity
 * test through the Host, and shows the provider's cumulative request counters.
 */
import { useEffect, useState } from 'react'
import { Button } from '@tomato/client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
import type { SettingsFormPathOp } from '@tomato/client-ui-primitives'
import {
  configOf, endpointDraftOf, endpointWrites, enabledWrite, modelOption,
  type EmbeddingsConfigView, type EmbeddingsProbeInput, type EmbeddingsProbeResult,
  type EmbeddingsStatusView, type EndpointDraft,
} from './embeddings-config.ts'
import css from './Embeddings.module.css'

/** The settings scope the page reads and writes. */
export interface EmbeddingsScope {
  getSnapshot(): {
    readonly status: 'loading' | 'ready' | 'unavailable'
    readonly value: unknown
    readonly writable: boolean
    readonly revision: number | undefined
  }
  subscribe(listener: () => void): () => void
  mutate(ops: readonly SettingsFormPathOp[], expectedRevision?: number): Promise<boolean>
}

/** Everything the page needs injected. */
export interface EmbeddingsPageInjected {
  /** The row's configuration scope. */
  readonly scope: EmbeddingsScope
  /** Host-side probe over the staged endpoint. */
  readonly probe: (input: EmbeddingsProbeInput, signal?: AbortSignal) => Promise<EmbeddingsProbeResult>
  /** Current provider state and counters. */
  readonly status: (signal?: AbortSignal) => Promise<EmbeddingsStatusView>
}

/** Props of the configuration page. */
export type EmbeddingsConfigPageProps =
  PropsRuntime<'plugins.row.config'>
  & PropsLocale<'museMemory'>
  & InjectFace<EmbeddingsPageInjected>
  & {
    /** Whether the Plugins page asks for the one-liner instead of the page. */
    readonly view: 'summary' | 'page'
  }

/** One read-only fact. */
function Fact({ label, value, hint }: { readonly label: string; readonly value: string; readonly hint?: string | undefined }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>
        <span className={css.mono}>{value}</span>
        {hint === undefined ? null : <span className={css.modelHint}>{hint}</span>}
      </dd>
    </>
  )
}

/**
 * Render the provider settings, its switch, its connection test, and usage.
 * @param props - injected scope, Host probe, status reader, and translator.
 * @returns the page, or its one-line summary.
 */
export function EmbeddingsConfigPage({ scope, probe, status, t, view }: EmbeddingsConfigPageProps) {
  const snapshot = useSnapshot(scope)
  const config: EmbeddingsConfigView = configOf(snapshot.value)
  const known = modelOption(config.model)
  const [draft, setDraft] = useState<EndpointDraft>(() => endpointDraftOf(snapshot.value))
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'failed'>('idle')
  const [toggling, setToggling] = useState(false)
  const [toggleState, setToggleState] = useState<'idle' | 'accepted' | 'refused'>('idle')
  const [probing, setProbing] = useState(false)
  const [result, setResult] = useState<EmbeddingsProbeResult | undefined>()
  const [usage, setUsage] = useState<EmbeddingsStatusView | undefined>()

  useEffect(() => {
    if (!dirty) setDraft(endpointDraftOf(snapshot.value))
  }, [snapshot.value, dirty])
  useEffect(() => {
    let live = true
    void status().then((next) => { if (live) setUsage(next) }).catch(() => {})
    return () => { live = false }
  }, [status])

  if (view === 'summary') return <p className={css.summary}>{t('embeddings.hint')}</p>
  if (snapshot.status === 'loading') return <p className={css.note}>{t('embeddings.loading')}</p>
  if (snapshot.status === 'unavailable') return <p className={css.note}>{t('embeddings.unavailable')}</p>
  const disabled = !snapshot.writable || saving || toggling || probing
  const refreshUsage = (): void => {
    void status().then(setUsage).catch(() => {})
  }
  return (
    <section className={css.page} aria-label={t('embeddings.title')}>
      <header className={css.header}>
        <h3 className={css.title}>{t('embeddings.title')}</h3>
        <p className={css.hint}>{t('embeddings.hint')}</p>
        {snapshot.writable ? null : <p className={css.note}>{t('embeddings.readOnly')}</p>}
      </header>
      <dl className={css.facts}>
        <Fact label={t('embeddings.model')} value={config.model === '' ? t('embeddings.empty') : config.model}
          hint={known === undefined ? undefined : t(known.description)} />
        <Fact label={t('embeddings.dimensions')} value={config.dimensions === '' || config.dimensions === '0' ? t('embeddings.anyLength') : config.dimensions} />
      </dl>
      <div className={css.grid}>
        <label className={css.field} htmlFor="muse-embeddings-baseUrl">
          <span className={css.label}>{t('embeddings.baseUrl')}</span>
          <input
            id="muse-embeddings-baseUrl" aria-label={t('embeddings.baseUrl')} className={css.input}
            value={draft.baseUrl} disabled={disabled}
            onChange={(event) => {
              const value = event.currentTarget.value
              setDraft(current => ({ ...current, baseUrl: value }))
              setDirty(true)
              setSaveState('idle')
            }}
          />
        </label>
        <label className={css.field} htmlFor="muse-embeddings-apiKeyEnv">
          <span className={css.label}>{t('embeddings.apiKeyEnv')}</span>
          <input
            id="muse-embeddings-apiKeyEnv" aria-label={t('embeddings.apiKeyEnv')} className={css.input}
            value={draft.apiKeyEnv} disabled={disabled}
            onChange={(event) => {
              const value = event.currentTarget.value
              setDraft(current => ({ ...current, apiKeyEnv: value }))
              setDirty(true)
              setSaveState('idle')
            }}
          />
          <span className={css.hint}>{t('embeddings.apiKeyEnvHint')}</span>
        </label>
      </div>
      <div className={css.actions}>
        <Button
          variant="primary"
          disabled={disabled || !dirty || draft.baseUrl.trim() === ''}
          onClick={() => {
            setSaving(true)
            void scope.mutate(endpointWrites(draft), snapshot.revision).then((accepted) => {
              setSaving(false)
              setSaveState(accepted ? 'saved' : 'failed')
              if (accepted) { setDirty(false); refreshUsage() }
            })
          }}
        >
          {t('embeddings.endpointSave')}
        </Button>
        <label className={css.toggle}>
          <input
            type="checkbox" checked={config.enabled} disabled={disabled}
            onChange={(event) => {
              setToggling(true); setToggleState('idle')
              void scope.mutate(enabledWrite(event.currentTarget.checked), snapshot.revision).then((accepted) => {
                setToggling(false); setToggleState(accepted ? 'accepted' : 'refused')
              })
            }}
          />
          <span>{config.enabled ? t('embeddings.enabled') : t('embeddings.disabled')}</span>
        </label>
        <Button
          disabled={disabled || draft.baseUrl.trim() === '' || config.model.trim() === ''}
          onClick={() => {
            setProbing(true); setResult(undefined)
            void probe({
              baseUrl: draft.baseUrl, model: config.model,
              dimensions: Number(config.dimensions) || 0,
              ...draft.apiKeyEnv.trim() === '' ? {} : { apiKeyEnv: draft.apiKeyEnv.trim() },
            }).then((next) => {
              setProbing(false); setResult(next); refreshUsage()
            })
          }}
        >
          {probing ? t('embeddings.testing') : t('embeddings.test')}
        </Button>
      </div>
      {saveState === 'idle' ? null : (
        <p className={saveState === 'saved' ? css.ok : css.bad}>
          {saveState === 'saved' ? t('embeddings.endpointSaved') : t('embeddings.endpointFailed')}
        </p>
      )}
      {toggleState === 'idle' ? null : (
        <p className={toggleState === 'accepted' ? css.ok : css.bad}>
          {toggleState === 'accepted' ? t('embeddings.toggleSaved') : t('embeddings.toggleRefused')}
        </p>
      )}
      {result === undefined ? null : (
        <p className={result.ok ? css.ok : css.bad}>
          {result.ok
            ? `${t('embeddings.testOk')}: ${result.detail} · ${result.latencyMs} ms · ${result.dimensions ?? 0} ${t('embeddings.dimensionsUnit')}`
            : `${t('embeddings.testFailed')}: ${result.detail}`}
        </p>
      )}
      {usage === undefined || !usage.available ? null : (
        <section className={css.usage} aria-label={t('embeddings.usage')}>
          <h4 className={css.title}>{t('embeddings.usage')}</h4>
          <p className={css.hint}>
            {t('embeddings.usageLine', {
              requests: String(usage.usage?.requests ?? 0), texts: String(usage.usage?.texts ?? 0),
              failures: String(usage.usage?.failures ?? 0), seconds: ((usage.usage?.totalMs ?? 0) / 1000).toFixed(1),
            })}
          </p>
          {usage.usage?.lastError === undefined ? null : <p className={css.bad}>{usage.usage.lastError}</p>}
        </section>
      )}
    </section>
  )
}

/** Subscribe one React render to the scope snapshot. */
function useSnapshot(scope: EmbeddingsScope): ReturnType<EmbeddingsScope['getSnapshot']> {
  const [snapshot, setSnapshot] = useState(() => scope.getSnapshot())
  useEffect(() => scope.subscribe(() => { setSnapshot(scope.getSnapshot()) }), [scope])
  return snapshot
}
