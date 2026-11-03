import { describe, expect, it } from 'vitest'
import { Context } from '@tomato/cordis'
import { ImageEvidence } from '../src/index.ts'

function service(engines: Array<{ provider: string; model: string }>): ImageEvidence {
  return new ImageEvidence(new Context(), { engines })
}

const ENGINE = [{ provider: 'acme', model: 'vision-1' }]

describe('ImageEvidence.canRead', () => {
  it('accepts a positively text-only model when an engine exists', () => {
    expect(service(ENGINE).canRead({ provider: 'p', id: 'm', inputModalities: ['text'] })).toBe(true)
  })

  it('refuses without engines, without declared modalities, or with image input', () => {
    expect(service([]).canRead({ provider: 'p', id: 'm', inputModalities: ['text'] })).toBe(false)
    expect(service(ENGINE).canRead({ provider: 'p', id: 'm' })).toBe(false)
    expect(service(ENGINE).canRead({ provider: 'p', id: 'm', inputModalities: ['text', 'image'] })).toBe(false)
    expect(service(ENGINE).canRead(undefined)).toBe(false)
  })
})

describe('ImageEvidence.peek', () => {
  it('returns nothing before the domain has evidence', () => {
    expect(service(ENGINE).peek('sha256:missing')).toBeUndefined()
  })
})
