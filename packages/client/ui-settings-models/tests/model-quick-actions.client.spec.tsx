// @vitest-environment jsdom
/** One-click adapt and update actions merge advice and commit through the card's save path. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import type { LlmModelAdaptation } from '@tomato/api-remotes/client'
import { ModelListEditor } from '../src/client/ModelListEditor.tsx'
import type { ModelDraft } from '../src/client/ModelListEditor.tsx'
import type { ModelsOperations } from '../src/client/operations.ts'
import { en } from '../src/client/locales.ts'

afterEach(cleanup)

const PROBE = { settingsNs: 'llm-pi-ai', provider: 'blueai', api: 'openai-completions' }

const ADVICE: readonly LlmModelAdaptation[] = [{
  id: 'qwen4-max',
  input: ['text', 'image'],
  reasoningEfforts: { off: null, high: 'high' },
  compat: { supportsReasoningEffort: true },
}]

function operations(overrides: Partial<ModelsOperations> = {}): ModelsOperations {
  return {
    providerModels: vi.fn(() => Promise.resolve([])),
    discoverModels: vi.fn<ModelsOperations['discoverModels']>(() => Promise.resolve({ kind: 'found', models: [] })),
    adaptModels: vi.fn<ModelsOperations['adaptModels']>(() => Promise.resolve({ kind: 'advised', advice: [] })),
    storeCredential: vi.fn(),
    removeCredential: vi.fn(),
    writeSettings: vi.fn(),
    ...overrides,
  }
}

/** Render the list without a catalog provider, so only the clicked action asks the Host. */
function renderEditor(
  models: readonly ModelDraft[],
  ops: ModelsOperations,
  onCommitModels?: (models: ModelDraft[]) => Promise<string | undefined>,
) {
  render(<ModelListEditor
    models={models} onChange={vi.fn()} probe={PROBE} operations={ops}
    disabled={false} t={key => en[key]} onBusyChange={() => {}} onCommitModels={onCommitModels}
  />)
}

it('applies adapter advice and commits the merged rows', async () => {
  const adaptModels = vi.fn<ModelsOperations['adaptModels']>(() => Promise.resolve({ kind: 'advised', advice: ADVICE }))
  const commit = vi.fn(() => Promise.resolve(undefined))
  renderEditor([{ id: 'qwen4-max' }], operations({ adaptModels }), commit)
  fireEvent.click(screen.getByRole('button', { name: en.adaptModels }))
  await screen.findByText(en.adaptDone.replace('{count}', '1'))
  expect(adaptModels).toHaveBeenCalledExactlyOnceWith('llm-pi-ai', {
    provider: 'blueai', api: 'openai-completions', models: [{ id: 'qwen4-max' }],
  })
  expect(commit).toHaveBeenCalledExactlyOnceWith([{
    id: 'qwen4-max',
    input: ['text', 'image'],
    reasoningEfforts: { off: null, high: 'high' },
    compat: { supportsReasoningEffort: true },
  }])
})

it('still commits an unchanged list when the advice is empty, mirroring the allowlist', async () => {
  const commit = vi.fn(() => Promise.resolve(undefined))
  renderEditor([{ id: 'qwen4-max' }], operations(), commit)
  fireEvent.click(screen.getByRole('button', { name: en.adaptModels }))
  await screen.findByText(en.adaptNone)
  expect(commit).toHaveBeenCalledExactlyOnceWith([{ id: 'qwen4-max' }])
})

it('shows an adaptation refusal without committing', async () => {
  const adaptModels = vi.fn<ModelsOperations['adaptModels']>(() =>
    Promise.resolve({ kind: 'refused', message: 'Adapter unavailable' }))
  const commit = vi.fn(() => Promise.resolve(undefined))
  renderEditor([{ id: 'qwen4-max' }], operations({ adaptModels }), commit)
  fireEvent.click(screen.getByRole('button', { name: en.adaptModels }))
  await screen.findByText('Adapter unavailable')
  expect(commit).not.toHaveBeenCalled()
})

it('adopts a newly listed model with its advice and commits the extended list', async () => {
  const discoverModels = vi.fn<ModelsOperations['discoverModels']>(() =>
    Promise.resolve({ kind: 'found', models: [{ id: 'new-model' }] }))
  const adaptModels = vi.fn<ModelsOperations['adaptModels']>(() =>
    Promise.resolve({ kind: 'advised', advice: [{ id: 'new-model', input: ['text', 'image'] }] }))
  const commit = vi.fn(() => Promise.resolve(undefined))
  renderEditor([{ id: 'kept' }], operations({ discoverModels, adaptModels }), commit)
  fireEvent.click(screen.getByRole('button', { name: en.updateModels }))
  await screen.findByText(en.updateDone.replace('{count}', '1'))
  // The adaptation request covers the adopted row too, not just the drafted ones.
  expect(adaptModels).toHaveBeenCalledExactlyOnceWith('llm-pi-ai', {
    provider: 'blueai', api: 'openai-completions', models: [{ id: 'kept' }, { id: 'new-model' }],
  })
  expect(commit).toHaveBeenCalledExactlyOnceWith([{ id: 'kept' }, { id: 'new-model', input: ['text', 'image'] }])
})

it('reports no new models and still commits the served listing', async () => {
  const discoverModels = vi.fn<ModelsOperations['discoverModels']>(() =>
    Promise.resolve({ kind: 'found', models: [{ id: 'kept' }] }))
  const commit = vi.fn(() => Promise.resolve(undefined))
  renderEditor([{ id: 'kept' }], operations({ discoverModels }), commit)
  fireEvent.click(screen.getByRole('button', { name: en.updateModels }))
  await screen.findByText(en.updateNone)
  expect(commit).toHaveBeenCalledExactlyOnceWith([{ id: 'kept' }])
})

it('hides the one-click actions when the card offers no commit path', () => {
  renderEditor([{ id: 'qwen4-max' }], operations())
  expect(screen.queryByRole('button', { name: en.adaptModels })).toBeNull()
  expect(screen.queryByRole('button', { name: en.updateModels })).toBeNull()
})

it('disables adapt until a row names a model', () => {
  const commit = vi.fn(() => Promise.resolve(undefined))
  renderEditor([{ id: '' }], operations(), commit)
  const adapt = screen.getByRole<HTMLButtonElement>('button', { name: en.adaptModels })
  expect(adapt.disabled).toBe(true)
  expect(adapt.title).toBe(en.adaptNeedsModels)
})
