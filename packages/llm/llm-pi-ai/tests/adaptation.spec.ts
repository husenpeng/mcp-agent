import { describe, expect, it } from 'vitest'
import { adaptModels } from '../src/adaptation.ts'
import type { LlmModelAdaptationRequest } from '@tomato/llm'

/** One declared OpenAI-compatible gateway route, the dataset's primary dialect. */
function gateway(models: LlmModelAdaptationRequest['models'], extra: Partial<LlmModelAdaptationRequest> = {}): LlmModelAdaptationRequest {
  return { provider: 'blueai', api: 'openai-completions', models, ...extra }
}

/**
 * Every switch pi-ai's detection gets wrong for an endpoint that is not OpenAI
 * itself: it would send instructions as `developer`, and it would address the
 * endpoint as though it read `reasoning_effort`. Later instructions need no
 * switch here — `supportsMidConvoSystemMessages` is catalog-owned, so the
 * adapter folds them into a user message on its own.
 */
const GATEWAY_ROUTE = {
  supportsDeveloperRole: false,
  supportsReasoningEffort: true,
}

describe('model adaptation dataset', () => {
  it('fills an unknown qwen model with the family reasoning levels and vision', () => {
    // The route owns the wire switches, so the row names none of them.
    expect(adaptModels(gateway([{ id: 'qwen4-max' }]))).toEqual([
      {
        id: 'qwen4-max',
        input: ['text', 'image'],
        reasoningEfforts: { off: null, low: 'low', medium: 'medium', high: 'high', max: 'max' },
      },
      { route: true, compat: GATEWAY_ROUTE },
    ])
  })

  it('names the DeepSeek reasoning dialect on the route and keeps its text-only modality floor', () => {
    expect(adaptModels(gateway([{ id: 'DeepSeek-V4.1-Flash' }]))).toEqual([
      {
        id: 'DeepSeek-V4.1-Flash',
        reasoningEfforts: { off: null, low: 'low', medium: 'medium', high: 'high', max: 'max' },
      },
      { route: true, compat: { ...GATEWAY_ROUTE, thinkingFormat: 'deepseek' } },
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
    ])).map(entry => entry.id)).toEqual([undefined])
  })

  it('skips an unrecognized family and an empty id', () => {
    // Only the route remains: the endpoint still needs the gateway dialect.
    expect(adaptModels(gateway([{ id: 'acme-large' }, { id: '' }]))).toEqual([
      { route: true, compat: GATEWAY_ROUTE },
    ])
  })

  it('names no route entry once the route already states every switch', () => {
    expect(adaptModels(gateway([{ id: 'qwen4-max', reasoningEfforts: false }], { compat: GATEWAY_ROUTE }))).toEqual([
      { id: 'qwen4-max', input: ['text', 'image'] },
    ])
  })

  it('leaves reasoning alone when the row declares a non-reasoning model', () => {
    // A non-reasoning row never sends the `developer` role, so the route comes
    // from the gateway dialect rather than from any family row.
    expect(adaptModels(gateway([{ id: 'qwen4-max', reasoningEfforts: false }]))).toEqual([
      { id: 'qwen4-max', input: ['text', 'image'] },
      { route: true, compat: GATEWAY_ROUTE },
    ])
  })

  it('fills the route switches a declared route lacks and keeps its own', () => {
    // A request shaped like the control plane's re-ask: one model, and route facts
    // that already carry what an earlier reply wrote.
    const request = gateway([{ id: 'DeepSeek-R1', compat: { supportsDeveloperRole: false } }], {
      compat: { supportsDeveloperRole: false },
    })
    expect(adaptModels(request)).toEqual([
      {
        id: 'DeepSeek-R1',
        reasoningEfforts: { off: null, low: 'low', medium: 'medium', high: 'high', max: 'max' },
        compat: { supportsReasoningEffort: true },
      },
      { route: true, compat: { supportsReasoningEffort: true, thinkingFormat: 'deepseek' } },
    ])
    // The form re-asks with only the route entry applied and the rows untouched;
    // the route is complete, so a second click leaves the rows for the surface to
    // write from this reply rather than proposing them again.
    const applied = { ...request, compat: { ...request.compat, supportsReasoningEffort: true, thinkingFormat: 'deepseek' } }
    expect(adaptModels(applied)).toEqual([
      {
        id: 'DeepSeek-R1',
        reasoningEfforts: { off: null, low: 'low', medium: 'medium', high: 'high', max: 'max' },
      },
    ])
    // Once the rows carry their levels too, the reply is empty.
    expect(adaptModels({ ...applied, models: [{
      id: 'DeepSeek-R1',
      reasoningEfforts: { off: null, low: 'low', medium: 'medium', high: 'high', max: 'max' },
    }] })).toEqual([])
  })

  it('does not narrow a route whose default input already carries images', () => {
    const [advice] = adaptModels(gateway([{ id: 'qwen4-max' }], { defaultInput: ['text', 'image'] }))
    expect(advice?.input).toBeUndefined()
    expect(advice?.reasoningEfforts).toBeDefined()
  })

  it('leaves a catalog model on its own protocol to the catalog', () => {
    // deepseek-v4-pro is in the installed deepseek catalog, speaking openai-completions.
    expect(adaptModels({ provider: 'deepseek', models: [{ id: 'deepseek-v4-pro' }] })).toEqual([
      { route: true, compat: GATEWAY_ROUTE },
    ])
  })

  it('widens the route for a catalog model repointed to another protocol', () => {
    // A Claude model the catalog describes for anthropic-messages, served through
    // an OpenAI-compatible gateway, inherits reasoning but no catalog compat.
    expect(adaptModels(gateway([{ id: 'claude-opus-4-7' }]))).toEqual([
      { route: true, compat: GATEWAY_ROUTE },
    ])
  })

  it('advises Anthropic adaptive thinking and standard levels on a Messages route', () => {
    // A Messages route never switches instruction roles; the `developer` claim
    // exists only on the OpenAI-compatible and Responses dialects.
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

  it('keeps a declared route switch off the rows and on the route', () => {
    // A repoint inherits no catalog compat, so a route that already declared the
    // `developer` claim needs the row to keep saying so beside its thinking
    // dialect; the route supplies only what no row declared.
    expect(adaptModels(gateway([{ id: 'DeepSeek-R1' }], { compat: { supportsDeveloperRole: false } }))).toEqual([
      {
        id: 'DeepSeek-R1',
        reasoningEfforts: { off: null, low: 'low', medium: 'medium', high: 'high', max: 'max' },
        compat: { supportsReasoningEffort: true },
      },
      { route: true, compat: { supportsReasoningEffort: true, thinkingFormat: 'deepseek' } },
    ])
  })
})
