import { describe, expect, it } from 'vitest'
import type { JsonValue } from '@tomato/util-values'
import type { SettingsNamespaceView } from '@tomato/api-remotes/client'
import { allowlistOps, readModelPolicy } from '../src/client/policy.ts'
import { settingsSchema } from './settings-schema.client.ts'

function namespace(value: JsonValue): SettingsNamespaceView {
  return {
    autoGenerate: false,
    ns: 'llm-pi-ai',
    schema: {},
    value,
    applies: 'live',
    secrets: [],
    revision: 1,
  }
}

describe('readModelPolicy', () => {
  it('is absent while the adapter has no namespace view', () => {
    expect(readModelPolicy(undefined, settingsSchema)).toBeUndefined()
  })

  it('is absent when the deployment does not enforce a policy', () => {
    expect(readModelPolicy(namespace({ providers: {} }), settingsSchema)).toBeUndefined()
    expect(readModelPolicy(namespace({ modelPolicy: { enabled: false, local: [] } }), settingsSchema))
      .toBeUndefined()
  })

  it('carries the configured local entries verbatim', () => {
    const local = [
      { provider: 'openai', model: 'gpt-4.1' },
      { provider: 'openai', model: 'gpt-4.1', releasedAt: '2026-01-01' },
    ]
    expect(readModelPolicy(namespace({ modelPolicy: { enabled: true, local } }), settingsSchema))
      .toEqual({ local })
  })

  it('treats an absent or non-array local list as empty', () => {
    expect(readModelPolicy(namespace({ modelPolicy: { enabled: true } }), settingsSchema)).toEqual({ local: [] })
    expect(readModelPolicy(namespace({ modelPolicy: { enabled: true, local: 'openai' } }), settingsSchema))
      .toEqual({ local: [] })
  })
})

describe('allowlistOps', () => {
  it('appends every missing pair and preserves existing entries', () => {
    const existing = { provider: 'openai', model: 'gpt-4.1', releasedAt: '2026-01-01' }
    expect(allowlistOps({ local: [existing, 'malformed', { provider: 'acme', model: 'old' }] }, 'acme-gateway', ['large', 'mini']))
      .toEqual([{
        op: 'set',
        path: ['modelPolicy', 'local'],
        value: [existing, 'malformed', { provider: 'acme', model: 'old' },
          { provider: 'acme-gateway', model: 'large' }, { provider: 'acme-gateway', model: 'mini' }],
      }])
  })

  it('does not repeat a pair the allowlist already names', () => {
    const local = [{ provider: 'acme-gateway', model: 'large' }]
    expect(allowlistOps({ local }, 'acme-gateway', ['large'])).toEqual([])
    expect(allowlistOps({ local }, 'acme-gateway', ['large', 'large'])).toEqual([])
  })

  it('writes nothing for a route with no models', () => {
    expect(allowlistOps({ local: [] }, 'acme-gateway', [])).toEqual([])
  })
})
