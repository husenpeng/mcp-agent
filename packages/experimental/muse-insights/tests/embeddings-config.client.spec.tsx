// @vitest-environment jsdom
/** The embedding-provider page: read-only facts, endpoint edits, switch, Host probe, and usage. */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { allowAllAccess, makeTranslate } from '@tomato/client-test-runtime'
import type { GlobalStandardProps } from '@tomato/client-ui-slots'
import type { SettingsFormPathOp } from '@tomato/client-ui-primitives'
import type { EmbeddingsProbeInput, EmbeddingsProbeResult, EmbeddingsStatusView } from '../src/types.ts'
import { en } from '../src/client/memory-locales.ts'
import { configOf, endpointDraftOf, endpointWrites, enabledWrite } from '../src/client/embeddings-config.ts'
import { EmbeddingsConfigPage, type EmbeddingsScope } from '../src/client/EmbeddingsConfigPage.tsx'

afterEach(cleanup)

const unused = (): never => { throw new Error('This isolated page does not read that framework hook') }
const standard: GlobalStandardProps = {
  usePanelInfo: unused, useSessions: unused, useSessionStatus: unused, useSessionRetainInfo: unused,
  useResource: unused, useWorkspaces: unused, ...allowAllAccess,
}
const t = makeTranslate(en)

/** One served provider section with a stubbed atomic write. */
function scope(value: Record<string, unknown>, options: { writable?: boolean } = {}) {
  const listeners = new Set<() => void>()
  let snapshot: { status: 'loading' | 'ready' | 'unavailable'; value: Record<string, unknown>; writable: boolean; revision: number } = {
    status: 'ready', value, writable: options.writable ?? true, revision: 3,
  }
  const mutate = vi.fn<(ops: readonly SettingsFormPathOp[], expectedRevision?: number) => Promise<boolean>>(async () => true)
  const form: EmbeddingsScope = {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    mutate,
  }
  return {
    form,
    mutate,
    set(value: Record<string, unknown>): void {
      snapshot = { ...snapshot, value }
      for (const listener of [...listeners]) listener()
    },
    status(status: 'loading' | 'unavailable'): void {
      snapshot = { ...snapshot, status }
      for (const listener of [...listeners]) listener()
    },
  }
}

const section = {
  baseUrl: 'https://bmc-llm-relay.bluemediagroup.cn/v1',
  model: 'text-embedding-v4',
  dimensions: 1024,
  apiKeyEnv: 'CLAUDE_SONNET_5_5_API_KEY',
  enabled: true,
}

/** Stubs the page injects. */
function host(overrides: { status?: EmbeddingsStatusView } = {}) {
  const probe = vi.fn<(input: EmbeddingsProbeInput) => Promise<EmbeddingsProbeResult>>(async () => ({
    ok: true, detail: 'returned a 3-value vector', dimensions: 3, latencyMs: 12,
  }))
  const status = vi.fn(async (): Promise<EmbeddingsStatusView> => overrides.status ?? {
    available: true, enabled: true, model: 'text-embedding-v4', dimensions: 1024,
    usage: { requests: 4, texts: 9, failures: 1, totalMs: 2_500, lastError: 'boom' },
  })
  return { probe, status }
}

describe('embeddings configuration', () => {
  it('reads displayed facts and stages endpoint and switch writes', () => {
    expect(configOf(section)).toEqual({
      baseUrl: section.baseUrl, model: 'text-embedding-v4', dimensions: '1024',
      apiKeyEnv: 'CLAUDE_SONNET_5_5_API_KEY', enabled: true,
    })
    expect(configOf({ ...section, enabled: false }).enabled).toBe(false)
    expect(configOf(null)).toEqual({ baseUrl: '', model: '', dimensions: '', apiKeyEnv: '', enabled: true })
    expect(configOf({ baseUrl: 1, model: 2 })).toMatchObject({ baseUrl: '1', model: '2' })
    expect(endpointDraftOf(section)).toEqual({ baseUrl: section.baseUrl, apiKeyEnv: 'CLAUDE_SONNET_5_5_API_KEY' })
    expect(endpointWrites({ baseUrl: ' http://x ', apiKeyEnv: ' ' })).toEqual([
      { op: 'set', path: ['baseUrl'], value: 'http://x' },
      { op: 'unset', path: ['apiKeyEnv'] },
    ])
    expect(enabledWrite(false)).toEqual([{ op: 'set', path: ['enabled'], value: false }])
    expect(endpointWrites({ baseUrl: '', apiKeyEnv: 'KEY' })).toEqual([
      { op: 'unset', path: ['baseUrl'] },
      { op: 'set', path: ['apiKeyEnv'], value: 'KEY' },
    ])
  })
})

describe('EmbeddingsConfigPage', () => {
  it('renders the summary, loading, unavailable, and read-only states', () => {
    const page = scope(section)
    const injected = host()
    const { rerender } = render(<EmbeddingsConfigPage {...standard} scope={page.form} {...injected} t={t} view="summary" />)
    expect(screen.getByText(en['embeddings.hint'])).toBeTruthy()
    rerender(<EmbeddingsConfigPage {...standard} scope={page.form} {...injected} t={t} view="page" />)
    page.status('loading')
    rerender(<EmbeddingsConfigPage {...standard} scope={page.form} {...injected} t={t} view="page" />)
    expect(screen.getByText(en['embeddings.loading'])).toBeTruthy()
    page.status('unavailable')
    rerender(<EmbeddingsConfigPage {...standard} scope={page.form} {...injected} t={t} view="page" />)
    expect(screen.getByText(en['embeddings.unavailable'])).toBeTruthy()

    const readOnly = scope(section, { writable: false })
    render(<EmbeddingsConfigPage {...standard} scope={readOnly.form} {...host()} t={t} view="page" />)
    expect(screen.getByText(en['embeddings.readOnly'])).toBeTruthy()
    expect((screen.getByLabelText(en['embeddings.baseUrl']) as HTMLInputElement).disabled).toBe(true)
  })

  it('shows fixed model facts, the editable endpoint, and the usage counters', async () => {
    const page = scope(section)
    render(<EmbeddingsConfigPage {...standard} scope={page.form} {...host()} t={t} view="page" />)
    expect(screen.getByText('text-embedding-v4')).toBeTruthy()
    expect(screen.getByText(en['model.v4'])).toBeTruthy()
    expect(screen.getByText('1024')).toBeTruthy()
    expect((screen.getByLabelText(en['embeddings.baseUrl']) as HTMLInputElement).value).toBe(section.baseUrl)
    expect((screen.getByLabelText(en['embeddings.apiKeyEnv']) as HTMLInputElement).value).toBe('CLAUDE_SONNET_5_5_API_KEY')
    await screen.findByText(en['embeddings.usage'])
    expect(screen.getByText(t('embeddings.usageLine', { requests: '4', texts: '9', failures: '1', seconds: '2.5' }))).toBeTruthy()
    expect(screen.getByText('boom')).toBeTruthy()
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true)
    expect(screen.getByText(en['embeddings.enabled'])).toBeTruthy()
  })

  it('shows placeholders and hides usage when the provider is unavailable', async () => {
    const page = scope({ model: '', enabled: false })
    render(<EmbeddingsConfigPage {...standard} scope={page.form} {...host({ status: { available: false, enabled: false } })} t={t} view="page" />)
    expect(screen.getAllByText(en['embeddings.empty'])).toHaveLength(1)
    expect(screen.getByText(en['embeddings.anyLength'])).toBeTruthy()
    expect(screen.getByText(en['embeddings.disabled'])).toBeTruthy()
    expect((screen.getByLabelText(en['embeddings.baseUrl']) as HTMLInputElement).value).toBe('')
    expect(screen.queryByText(en['embeddings.usage'])).toBeNull()
    await act(async () => Promise.resolve())
  })

  it('saves the endpoint and credential, reports refusal, and refreshes usage', async () => {
    const page = scope(section)
    const injected = host()
    render(<EmbeddingsConfigPage {...standard} scope={page.form} {...injected} t={t} view="page" />)
    fireEvent.change(screen.getByLabelText(en['embeddings.baseUrl']), { target: { value: 'http://127.0.0.1:11434/v1' } })
    fireEvent.change(screen.getByLabelText(en['embeddings.apiKeyEnv']), { target: { value: '' } })
    fireEvent.click(screen.getByText(en['embeddings.endpointSave']))
    await screen.findByText(en['embeddings.endpointSaved'])
    expect(page.mutate).toHaveBeenCalledWith([
      { op: 'set', path: ['baseUrl'], value: 'http://127.0.0.1:11434/v1' },
      { op: 'unset', path: ['apiKeyEnv'] },
    ], 3)
    expect(injected.status).toHaveBeenCalledTimes(2)

    page.mutate.mockResolvedValueOnce(false)
    fireEvent.change(screen.getByLabelText(en['embeddings.baseUrl']), { target: { value: 'http://127.0.0.1:1234/v1' } })
    fireEvent.click(screen.getByText(en['embeddings.endpointSave']))
    await screen.findByText(en['embeddings.endpointFailed'])
  })

  it('toggles semantic search and reports acceptance or refusal', async () => {
    const page = scope(section)
    render(<EmbeddingsConfigPage {...standard} scope={page.form} {...host()} t={t} view="page" />)
    fireEvent.click(screen.getByRole('checkbox'))
    await screen.findByText(en['embeddings.toggleSaved'])
    expect(page.mutate).toHaveBeenCalledWith([{ op: 'set', path: ['enabled'], value: false }], 3)

    page.mutate.mockResolvedValueOnce(false)
    fireEvent.click(screen.getByRole('checkbox'))
    await screen.findByText(en['embeddings.toggleRefused'])
  })

  it('tests the staged endpoint through the Host and shows either outcome', async () => {
    const page = scope(section)
    const injected = host()
    render(<EmbeddingsConfigPage {...standard} scope={page.form} {...injected} t={t} view="page" />)
    fireEvent.change(screen.getByLabelText(en['embeddings.baseUrl']), { target: { value: 'http://127.0.0.1:11434/v1' } })
    fireEvent.click(screen.getByText(en['embeddings.test']))
    await screen.findByText(content => content.includes(`${en['embeddings.testOk']}: returned a 3-value vector`))
    expect(injected.probe).toHaveBeenCalledWith(Object.assign({}, {
      baseUrl: 'http://127.0.0.1:11434/v1', model: 'text-embedding-v4', dimensions: 1024, apiKeyEnv: 'CLAUDE_SONNET_5_5_API_KEY',
    }))
    injected.probe.mockResolvedValueOnce({ ok: false, detail: 'endpoint answered HTTP 404', latencyMs: 9 })
    fireEvent.click(screen.getByText(en['embeddings.test']))
    await screen.findByText(`${en['embeddings.testFailed']}: endpoint answered HTTP 404`)
  })

  it('survives status failures and renders zero usage when none was reported', async () => {
    const page = scope(section)
    const failing = { probe: vi.fn(), status: vi.fn(async () => { throw new Error('host down') }) }
    render(<EmbeddingsConfigPage {...standard} scope={page.form} {...failing} t={t} view="page" />)
    await act(async () => Promise.resolve())
    expect(screen.queryByText(en['embeddings.usage'])).toBeNull()

    const zero = { probe: vi.fn(), status: vi.fn(async () => ({ available: true, enabled: true })) }
    render(<EmbeddingsConfigPage {...standard} scope={scope(section).form} {...zero} t={t} view="page" />)
    await screen.findByText(en['embeddings.usage'])
    expect(screen.getByText(t('embeddings.usageLine', { requests: '0', texts: '0', failures: '0', seconds: '0.0' }))).toBeTruthy()
  })

  it('tests without a credential and reports a result without a length', async () => {
    const page = scope(section)
    const injected = host()
    injected.probe.mockResolvedValueOnce({ ok: true, detail: 'returned a vector', latencyMs: 7 })
    render(<EmbeddingsConfigPage {...standard} scope={page.form} {...injected} t={t} view="page" />)
    fireEvent.change(screen.getByLabelText(en['embeddings.apiKeyEnv']), { target: { value: '' } })
    fireEvent.click(screen.getByText(en['embeddings.test']))
    await screen.findByText(content => content.includes(`${en['embeddings.testOk']}: returned a vector`))
    expect(injected.probe.mock.calls[0]?.[0]).not.toHaveProperty('apiKeyEnv')
    expect(screen.getByText(content => content.includes('0 ' + en['embeddings.dimensionsUnit']))).toBeTruthy()
  })

  it('probes with an unknown vector length as zero', async () => {
    const page = scope({ ...section, dimensions: 0 })
    const injected = host()
    render(<EmbeddingsConfigPage {...standard} scope={page.form} {...injected} t={t} view="page" />)
    fireEvent.click(screen.getByText(en['embeddings.test']))
    await screen.findByText(content => content.includes(en['embeddings.testOk']))
    expect(injected.probe.mock.calls[0]?.[0]).toMatchObject({ dimensions: 0 })
  })

  it('ignores a usage refresh failure after a save', async () => {
    const page = scope(section)
    const injected = host()
    injected.status.mockResolvedValueOnce({ available: true, enabled: true, usage: { requests: 1, texts: 1, failures: 0, totalMs: 1 } })
    injected.status.mockRejectedValueOnce(new Error('boom'))
    render(<EmbeddingsConfigPage {...standard} scope={page.form} {...injected} t={t} view="page" />)
    fireEvent.change(screen.getByLabelText(en['embeddings.baseUrl']), { target: { value: 'http://new/v1' } })
    fireEvent.click(screen.getByText(en['embeddings.endpointSave']))
    await screen.findByText(en['embeddings.endpointSaved'])
    expect(injected.status).toHaveBeenCalledTimes(2)
  })

  it('follows a new section when no edit is staged and keeps a staged edit otherwise', () => {
    const page = scope(section)
    const { rerender } = render(<EmbeddingsConfigPage {...standard} scope={page.form} {...host()} t={t} view="page" />)
    act(() => { page.set({ ...section, enabled: false }) })
    expect(screen.getByText(en['embeddings.disabled'])).toBeTruthy()
    fireEvent.change(screen.getByLabelText(en['embeddings.baseUrl']), { target: { value: 'http://dirty/v1' } })
    act(() => { page.set({ ...section, baseUrl: 'https://new/v1' }) })
    expect((screen.getByLabelText(en['embeddings.baseUrl']) as HTMLInputElement).value).toBe('http://dirty/v1')
    rerender(<EmbeddingsConfigPage {...standard} scope={page.form} {...host()} t={t} view="page" />)
  })
})
