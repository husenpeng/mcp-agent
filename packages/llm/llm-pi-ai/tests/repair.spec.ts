import { describe, expect, it } from 'vitest'
import { diagnoseProviderFailure, repairSettingsPatch } from '../src/repair.ts'
import { PiAiCatalogError } from '../src/catalog.ts'

/** A failure the way a gateway states one. */
function refusal(message: string, status?: number): Error {
  return status === undefined ? new Error(message) : Object.assign(new Error(message), { status })
}

describe('provider failure diagnosis', () => {
  it('answers a rejected developer role with the system role', () => {
    expect(diagnoseProviderFailure(refusal('Unsupported role: developer', 400))).toEqual({
      summary: 'developer-role',
      compat: { supportsDeveloperRole: false },
    })
    // pi-ai rethrows several refusals without a status.
    expect(diagnoseProviderFailure(refusal('{"error":{"message":"Invalid value for role: developer"}}'))).toEqual({
      summary: 'developer-role',
      compat: { supportsDeveloperRole: false },
    })
  })

  it('answers a refused output-cap field with the field the server reads', () => {
    expect(diagnoseProviderFailure(refusal('Unsupported parameter: max_completion_tokens', 422))).toEqual({
      summary: 'output-token-field',
      compat: { maxTokensField: 'max_tokens' },
    })
  })

  it('narrows a model to text when the endpoint refuses images', () => {
    expect(diagnoseProviderFailure(refusal('This model does not support image input', 400))).toEqual({
      summary: 'image-input',
      input: ['text'],
    })
  })

  it('leaves an image refusal that names a limit to the caller', () => {
    // A size, pixel, or format complaint is about this picture, not the modality.
    expect(diagnoseProviderFailure(refusal('image exceeds maximum size of 20MB', 400))).toBeUndefined()
    expect(diagnoseProviderFailure(refusal('unsupported image format: image/heic', 400))).toBeUndefined()
  })

  it('keeps every failure a retry cannot repair', () => {
    // A 5xx, a quota, a credential, and a timeout state something else.
    expect(diagnoseProviderFailure(refusal('Unsupported role: developer', 503))).toBeUndefined()
    expect(diagnoseProviderFailure(refusal('rate limit exceeded', 429))).toBeUndefined()
    expect(diagnoseProviderFailure(refusal('insufficient balance', 402))).toBeUndefined()
    expect(diagnoseProviderFailure(refusal('developer tooling quota', 400))).toBeUndefined()
    expect(diagnoseProviderFailure(refusal(''))).toBeUndefined()
    expect(diagnoseProviderFailure(undefined)).toBeUndefined()
    expect(diagnoseProviderFailure(new PiAiCatalogError('llm-pi-ai: provider "x" is misconfigured'))).toBeUndefined()
  })

  it('reads the cause chain a wrapped failure carries', () => {
    const wrapped = new Error('pi-ai request failed', {
      cause: Object.assign(new Error('Unsupported role: developer'), { status: 400 }),
    })
    expect(diagnoseProviderFailure(wrapped)?.summary).toBe('developer-role')
  })
})

describe('provider failure repair write', () => {
  const route = {
    compat: { supportsDeveloperRole: true },
    models: [{ id: 'acme-large', input: ['text', 'image'] as const }, { id: 'acme-small' }],
  }

  it('writes a switch the route states differently', () => {
    expect(repairSettingsPatch(route, 'acme-large', {
      summary: 'developer-role',
      compat: { supportsDeveloperRole: false },
    })).toEqual({ compat: { supportsDeveloperRole: false } })
  })

  it('writes nothing when the route already states it', () => {
    expect(repairSettingsPatch(route, 'acme-large', {
      summary: 'output-token-field',
      compat: { maxTokensField: 'max_tokens' },
    })).toEqual({ compat: { maxTokensField: 'max_tokens' } })
    const stated = { compat: { maxTokensField: 'max_tokens' } }
    expect(repairSettingsPatch(stated, 'acme-large', {
      summary: 'output-token-field',
      compat: { maxTokensField: 'max_tokens' },
    })).toBeUndefined()
  })

  it('narrows only the model the refusal named', () => {
    const patch = repairSettingsPatch(route, 'acme-large', { summary: 'image-input', input: ['text'] })
    expect(patch?.models?.map(entry => entry.input)).toEqual([['text'], undefined])
  })

  it('writes nothing for an image repair the route declares no model for', () => {
    expect(repairSettingsPatch(undefined, 'acme-large', { summary: 'image-input', input: ['text'] })).toBeUndefined()
    expect(repairSettingsPatch({ compat: {} }, 'acme-large', { summary: 'image-input', input: ['text'] })).toBeUndefined()
    expect(repairSettingsPatch(route, 'absent', { summary: 'image-input', input: ['text'] })).toBeUndefined()
  })

  it('writes nothing for a model that already declares text only', () => {
    const declared = { models: [{ id: 'acme-large', input: ['text'] as ('text' | 'image')[] }] }
    expect(repairSettingsPatch(declared, 'acme-large', { summary: 'image-input', input: ['text'] })).toBeUndefined()
  })
})
