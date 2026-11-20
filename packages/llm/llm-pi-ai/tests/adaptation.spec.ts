import { describe, expect, it } from 'vitest'
import { adaptModels } from '../src/adaptation.ts'
import type { LlmModelAdaptationRequest } from '@tomato/llm'

/** One declared OpenAI-compatible gateway route, the dataset's primary dialect. */
function gateway(models: LlmModelAdaptationRequest['models'], extra: Partial<LlmModelAdaptationRequest> = {}): LlmModelAdaptationRequest {
  return { provider: 'blueai', api: 'openai-completions', models, ...extra }
}

describe('model adaptation dataset', () => {
  it('fills an unknown qwen model with the family reasoning levels, switch, and vision', () => {
    expect(adaptModels(gateway([{ id: 'qwen4-max' }]))).toEqual([
      {
        id: 'qwen4-max',
        input: ['text', 'image'],
        reasoningEfforts: { off: null, low: 'low', medium: 'medium', high: 'high', max: 'max' },
        compat: { supportsReasoningEffort: true },
      },
    ])
  })

  it('names the DeepSeek reasoning dialect and keeps its text-only modality floor', () => {
    expect(adaptModels(gateway([{ id: 'DeepSeek-V4.1-Flash' }]))).toEqual([
      {
        id: 'DeepSeek-V4.1-Flash',
        reasoningEfforts: { off: null, low: 'low', medium: 'medium', high: 'high', max: 'max' },
        compat: { supportsReasoningEffort: true, thinkingFormat: 'deepseek' },
      },
    ])
  })

  it('spells GLM off as the vendor does', () => {
    const [advice] = adaptModels(gateway([{ id: 'glm-6' }]))
    expect(advice?.reasoningEfforts?.['off']).toBe('none')
  })

  it('widens a named vision variant inside a text-only family', () => {
    const [advice] = adaptModels(gateway([{ id: 'Doubao-1.5-vision-pro-32k' }]))
    expect(advice?.input).toEqual(['text', 'image'])
  })

  it('skips non-chat models a gateway lists beside chat models', () => {
    expect(adaptModels(gateway([
      { id: 'text-embedding-3-large' },
      { id: 'gpt-image-2' },
      { id: 'Doubao-Seedream-4.0' },
      { id: 'gte-rerank-v2' },
      { id: 'qwen-image-2.0-pro' },
    ]))).toEqual([])
  })

  it('skips an unrecognized family and an empty id', () => {
    expect(adaptModels(gateway([{ id: 'acme-large' }, { id: '' }]))).toEqual([])
  })

  it('never overwrites a row’s own declarations', () => {
    expect(adaptModels(gateway([
      {
        id: 'qwen4-max',
        input: ['text'],
        reasoningEfforts: { off: null, high: 'high' },
        compat: { supportsReasoningEffort: true },
      },
    ]))).toEqual([])
  })

  it('leaves reasoning alone when the row declares a non-reasoning model', () => {
    expect(adaptModels(gateway([{ id: 'qwen4-max', reasoningEfforts: false }]))).toEqual([
      { id: 'qwen4-max', input: ['text', 'image'] },
    ])
  })

  it('does not restate a switch the route already sets', () => {
    expect(adaptModels(gateway([{ id: 'DeepSeek-R1' }], { compat: { supportsReasoningEffort: true } }))).toEqual([
      {
        id: 'DeepSeek-R1',
        reasoningEfforts: { off: null, low: 'low', medium: 'medium', high: 'high', max: 'max' },
        compat: { thinkingFormat: 'deepseek' },
      },
    ])
  })

  it('does not narrow a route whose default input already carries images', () => {
    const [advice] = adaptModels(gateway([{ id: 'qwen4-max' }], { defaultInput: ['text', 'image'] }))
    expect(advice?.input).toBeUndefined()
    expect(advice?.reasoningEfforts).toBeDefined()
  })

  it('leaves a catalog model on its own protocol to the catalog', () => {
    // deepseek-v4-pro is in the installed deepseek catalog, speaking openai-completions.
    expect(adaptModels({ provider: 'deepseek', models: [{ id: 'deepseek-v4-pro' }] })).toEqual([])
  })

  it('adapts a catalog model repointed to another protocol', () => {
    // A Claude model the catalog describes for anthropic-messages, served through
    // an OpenAI-compatible gateway, inherits reasoning but no catalog compat.
    const [advice] = adaptModels(gateway([{ id: 'claude-opus-4-7' }]))
    expect(advice?.reasoningEfforts).toBeUndefined()
    expect(advice?.compat).toEqual({ supportsReasoningEffort: true })
  })

  it('advises Anthropic adaptive thinking and standard levels on a Messages route', () => {
    expect(adaptModels({ provider: 'blueai', api: 'anthropic-messages', models: [{ id: 'claude-opus-9' }] })).toEqual([
      {
        id: 'claude-opus-9',
        input: ['text', 'image'],
        reasoningEfforts: { off: null, low: 'low', medium: 'medium', high: 'high', max: 'max' },
        compat: { forceAdaptiveThinking: true },
      },
    ])
  })

  it('gives a protocol outside the two reasoning dialects modality advice only', () => {
    expect(adaptModels({ provider: 'blueai', api: 'google-generative-ai', models: [{ id: 'gemini-4-pro' }] })).toEqual([
      { id: 'gemini-4-pro', input: ['text', 'image'] },
    ])
  })
})
