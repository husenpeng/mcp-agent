/**
 * Configuration page of the embedding-provider row. It edits the endpoint,
 * model and vector length, stores a write-only API key through the Host,
 * switches semantic search on or off, runs the connectivity test through the
 * Host, and shows the provider's cumulative request counters.
 */
import { useEffect, useState } from 'react'
import { Button, Checkbox } from '@tomato/client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
import type { SettingsFormPathOp } from '@tomato/client-ui-primitives'
import {
  configOf, effectiveConfig, endpointDraftOf, endpointWrites, enabledWrite, modelOption,
  EMBEDDING_MODELS, type EmbeddingsConfigView, type EmbeddingsProbeInput, type EmbeddingsProbeResult,
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
  /** Store a newly entered API key on the Host; the result is a failure message when refused. */
  readonly storeCredential: (ref: string, value: string) => Promise<string | undefined>
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
export function EmbeddingsConfigPage({ scope, probe, status, storeCredential, t, view }: EmbeddingsConfigPageProps) {
  const snapshot = useSnapshot(scope)
  const config: EmbeddingsConfigView = configOf(snapshot.value)
  const known = modelOption(config.model)
  const [draft, setDraft] = useState<EndpointDraft>(() => endpointDraftOf(snapshot.value))
  const [dirty, setDirty] = useState(false)
  const [keyDraft, setKeyDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'failed'>('idle')
  const [saveError, setSaveError] = useState<string | undefined>()
  const [toggling, setToggling] = useState(false)
  const [toggleState, setToggleState] = useState<'idle' | 'accepted' | 'refused'>('idle')
  const [probing, setProbing] = useState(false)
  const [result, setResult] = useState<EmbeddingsProbeResult | undefined>()
  const [usage, setUsage] = useState<EmbeddingsStatusView | undefined>()
  const effective = effectiveConfig(config, usage)

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
  // An empty field drops the override, so the probe uses the value the mounted provider runs with.
  const inherited = {
    baseUrl: usage?.baseUrl ?? '',
    model: usage?.model ?? '',
    dimensions: usage?.dimensions === undefined || usage.dimensions === 0 ? '' : String(usage.dimensions),
    apiKeyEnv: usage?.apiKeyEnv ?? '',
  }
  const staged = {
    baseUrl: draft.baseUrl.trim() === '' ? inherited.baseUrl : draft.baseUrl.trim(),
    model: draft.model.trim() === '' ? inherited.model : draft.model.trim(),
    apiKeyEnv: draft.apiKeyEnv.trim() === '' ? inherited.apiKeyEnv : draft.apiKeyEnv.trim(),
    dimensions: draft.dimensions.trim() === '' ? inherited.dimensions : draft.dimensions.trim(),
  }
  const credentialRef = effective.apiKeyEnv || 'EMBEDDINGS_HTTP_API_KEY'
  const save = async (): Promise<void> => {
    setSaving(true)
    setSaveState('idle')
    setSaveError(undefined)
    const keyValue = keyDraft.trim()
    try {
      if (keyValue !== '') {
        const failure = await storeCredential(credentialRef, keyValue)
        if (failure !== undefined) {
          setSaveState('failed')
          setSaveError(failure)
          return
        }
      }
      const nextDraft = keyValue !== '' && draft.apiKeyEnv.trim() === ''
        ? { ...draft, apiKeyEnv: credentialRef }
        : draft
      const accepted = await scope.mutate(endpointWrites(nextDraft, config), snapshot.revision)
      setSaveState(accepted ? 'saved' : 'failed')
      if (accepted) {
        setDraft(nextDraft)
        setDirty(false)
        setKeyDraft('')
        refreshUsage()
      }
    } catch (error: unknown) {
      setSaveState('failed')
      setSaveError(error instanceof Error ? error.message : String(error))
    } finally {
      setSaving(false)
    }
  }
  return (
    <section className={css.page} aria-label={t('embeddings.title')}>
      <header className={css.header}>
        <h3 className={css.title}>{t('embeddings.title')}</h3>
        <p className={css.hint}>{t('embeddings.hint')}</p>
        {snapshot.writable ? null : <p className={css.note}>{t('embeddings.readOnly')}</p>}
      </header>
      <dl className={css.facts}>
        <Fact label={t('embeddings.model')} value={effective.model === '' ? t('embeddings.empty') : effective.model}
          hint={known === undefined ? undefined : t(known.description)} />
        <Fact label={t('embeddings.dimensions')} value={effective.dimensions === '' || effective.dimensions === '0' ? t('embeddings.anyLength') : effective.dimensions} />
        {effective.baseUrl === '' ? null : <Fact label={t('embeddings.effectiveEndpoint')} value={effective.baseUrl} />}
      </dl>
      <div className={css.grid}>
        <label className={css.field} htmlFor="muse-embeddings-baseUrl">
          <span className={css.label}>{t('embeddings.baseUrl')}</span>
          <input
            id="muse-embeddings-baseUrl" aria-label={t('embeddings.baseUrl')} className={css.input}
            value={draft.baseUrl} placeholder={effective.baseUrl} disabled={disabled}
            onChange={(event) => {
              const value = event.currentTarget.value
              setDraft(current => ({ ...current, baseUrl: value }))
              setDirty(true)
              setSaveState('idle')
            }}
          />
        </label>
        <label className={css.field} htmlFor="muse-embeddings-apiKey">
          <span className={css.label}>{t('embeddings.apiKeyEnv')}</span>
          <input
            id="muse-embeddings-apiKey" aria-label={t('embeddings.apiKeyEnv')} className={css.input}
            type="password" autoComplete="new-password" value={keyDraft}
            placeholder={effective.apiKeyEnv === '' ? t('embeddings.apiKeyPlaceholder') : t('embeddings.apiKeySaved')}
            disabled={disabled}
            onChange={(event) => {
              setKeyDraft(event.currentTarget.value)
              setSaveState('idle')
              setSaveError(undefined)
            }}
          />
          <span className={css.hint}>{t('embeddings.apiKeyEnvHint')}</span>
        </label>
      </div>
      <div className={css.grid}>
        <label className={css.field} htmlFor="muse-embeddings-model">
          <span className={css.label}>{t('embeddings.model')}</span>
          <input
            id="muse-embeddings-model" aria-label={t('embeddings.model')} className={css.input}
            list="muse-embeddings-models" value={draft.model} placeholder={effective.model} disabled={disabled}
            onChange={(event) => {
              const value = event.currentTarget.value
              setDraft(current => ({ ...current, model: value }))
              setDirty(true); setSaveState('idle')
            }}
          />
          <datalist id="muse-embeddings-models">
            {EMBEDDING_MODELS.map(option => <option key={option.id} value={option.id} />)}
          </datalist>
        </label>
        <label className={css.field} htmlFor="muse-embeddings-dimensions">
          <span className={css.label}>{t('embeddings.dimensions')}</span>
          <input
            id="muse-embeddings-dimensions" aria-label={t('embeddings.dimensions')} className={css.input}
            inputMode="numeric" value={draft.dimensions} placeholder={effective.dimensions === '0' ? '' : effective.dimensions} disabled={disabled}
            onChange={(event) => {
              const value = event.currentTarget.value
              setDraft(current => ({ ...current, dimensions: value }))
              setDirty(true); setSaveState('idle')
            }}
          />
          <span className={css.hint}>{t('embeddings.modelHint')}</span>
        </label>
      </div>
      <div className={css.actions}>
        <Button
          variant="primary"
          disabled={disabled || (!dirty && keyDraft.trim() === '') || draft.baseUrl.trim() === ''}
          onClick={() => { void save() }}
        >
          {t('embeddings.endpointSave')}
        </Button>
        <Checkbox
          checked={config.enabled} disabled={disabled}
          label={config.enabled ? t('embeddings.enabled') : t('embeddings.disabled')}
          onChange={(next) => {
            setToggling(true); setToggleState('idle')
            void scope.mutate(enabledWrite(next), snapshot.revision).then((accepted) => {
              setToggling(false); setToggleState(accepted ? 'accepted' : 'refused')
            })
          }}
        />
        <Button
          variant="outline"
          disabled={disabled || keyDraft.trim() !== '' || staged.baseUrl === '' || staged.model === ''}
          onClick={() => {
            setProbing(true); setResult(undefined)
            void probe({
              baseUrl: staged.baseUrl, model: staged.model,
              dimensions: Number(staged.dimensions) || 0,
              ...staged.apiKeyEnv === '' ? {} : { apiKeyEnv: staged.apiKeyEnv },
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
          {saveState === 'saved' ? t('embeddings.endpointSaved') : saveError ?? t('embeddings.endpointFailed')}
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
            ? `${t('embeddings.testOk')}: ${t('embeddings.testDetail', {
              detail: result.detail, latency: String(result.latencyMs),
              dimensions: String(result.dimensions ?? 0), unit: t('embeddings.dimensionsUnit'),
            })}`
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
          {usage.usage?.retryInMs === undefined ? null : (
            <p className={css.bad}>
              {t('embeddings.paused', {
                failures: String(usage.usage.consecutiveFailures ?? 0),
                seconds: String(Math.ceil(usage.usage.retryInMs / 1000)),
              })}
            </p>
          )}
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
