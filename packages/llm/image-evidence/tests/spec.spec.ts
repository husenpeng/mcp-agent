import { describe, expect, it } from 'vitest'
import { evidenceRecordKey, imageEvidenceDomainSpec } from '../src/spec.ts'

describe('evidenceRecordKey', () => {
  it('is stable for one attachment, engine, and contract version', () => {
    const first = evidenceRecordKey('sha256:aaa', { provider: 'acme', model: 'vision-1' }, 1)
    expect(first).toMatch(/^[a-f0-9]{64}$/)
    expect(evidenceRecordKey('sha256:aaa', { provider: 'acme', model: 'vision-1' }, 1)).toBe(first)
  })

  it('separates attachments, engines, and contract versions', () => {
    const base = evidenceRecordKey('sha256:aaa', { provider: 'acme', model: 'vision-1' }, 1)
    expect(evidenceRecordKey('sha256:bbb', { provider: 'acme', model: 'vision-1' }, 1)).not.toBe(base)
    expect(evidenceRecordKey('sha256:aaa', { provider: 'acme', model: 'vision-2' }, 1)).not.toBe(base)
    expect(evidenceRecordKey('sha256:aaa', { provider: 'other', model: 'vision-1' }, 1)).not.toBe(base)
    expect(evidenceRecordKey('sha256:aaa', { provider: 'acme', model: 'vision-1' }, 2)).not.toBe(base)
  })

  it('keeps the key a safe per-record path segment', () => {
    const key = evidenceRecordKey('sha256:aaa', { provider: 'acme', model: 'vendor/model-1' }, 1)
    expect(key).toMatch(/^[a-zA-Z0-9_-]+$/)
  })
})

describe('imageEvidenceDomainSpec', () => {
  it('declares one per-record table at version 1', () => {
    expect(imageEvidenceDomainSpec).toMatchObject({ name: 'image_evidence', version: 1, layout: 'per-record' })
    expect(Object.keys(imageEvidenceDomainSpec.tables)).toEqual(['evidence'])
  })
})
