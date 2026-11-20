import { describe, expect, it } from 'vitest'
import { adviseProtocol, hostnameOf, protocolAdviceByHost } from '../src/client/protocol-advice.ts'

const FALLBACK = 'openai-completions'

describe('hostnameOf', () => {
  it('lowercases the host and ignores port, path, query, and credentials', () => {
    expect(hostnameOf('https://User:Pass@API.OpenAI.com:8443/v1?x=1#frag')).toBe('api.openai.com')
  })

  it('is undefined for an unparseable value', () => {
    expect(hostnameOf('not a url')).toBeUndefined()
    expect(hostnameOf('')).toBeUndefined()
  })
})

describe('protocolAdviceByHost', () => {
  it('maps each catalog endpoint hostname to its shared protocol', () => {
    const advice = protocolAdviceByHost([
      { defaultBaseURL: 'https://api.openai.com/v1', sharedProtocol: 'openai-responses' },
      { defaultBaseURL: 'https://api.anthropic.com', sharedProtocol: 'anthropic-messages' },
    ])
    expect(advice.get('api.openai.com')).toBe('openai-responses')
    expect(advice.get('api.anthropic.com')).toBe('anthropic-messages')
  })

  it('skips entries missing an endpoint or a shared protocol', () => {
    const advice = protocolAdviceByHost([
      { defaultBaseURL: 'https://api.openai.com/v1' },
      { sharedProtocol: 'anthropic-messages' },
      {},
    ])
    expect(advice.size).toBe(0)
  })

  it('drops a hostname two providers disagree on', () => {
    const advice = protocolAdviceByHost([
      { defaultBaseURL: 'https://shared.example/v1', sharedProtocol: 'openai-completions' },
      { defaultBaseURL: 'https://shared.example/anthropic', sharedProtocol: 'anthropic-messages' },
      { defaultBaseURL: 'https://api.anthropic.com', sharedProtocol: 'anthropic-messages' },
    ])
    expect(advice.has('shared.example')).toBe(false)
    expect(advice.get('api.anthropic.com')).toBe('anthropic-messages')
  })

  it('keeps a hostname two providers agree on', () => {
    const advice = protocolAdviceByHost([
      { defaultBaseURL: 'https://api.moonshot.ai/v1', sharedProtocol: 'openai-completions' },
      { defaultBaseURL: 'https://api.moonshot.ai/anthropic', sharedProtocol: 'openai-completions' },
    ])
    expect(advice.get('api.moonshot.ai')).toBe('openai-completions')
  })
})

describe('adviseProtocol', () => {
  const advice = protocolAdviceByHost([
    { defaultBaseURL: 'https://api.anthropic.com', sharedProtocol: 'anthropic-messages' },
    { defaultBaseURL: 'https://api.openai.com/v1', sharedProtocol: 'openai-responses' },
  ])

  it('answers from an exact hostname match', () => {
    expect(adviseProtocol('https://api.anthropic.com', advice, FALLBACK)).toBe('anthropic-messages')
    expect(adviseProtocol('https://api.openai.com/v1', advice, FALLBACK)).toBe('openai-responses')
  })

  it('falls back for an unknown relay hostname', () => {
    expect(adviseProtocol('https://relay.acme.example/v1', advice, FALLBACK)).toBe(FALLBACK)
  })

  it('does not match a hostname that merely contains a vendor name', () => {
    expect(adviseProtocol('https://api.anthropic.com.evil-relay.example/v1', advice, FALLBACK)).toBe(FALLBACK)
    expect(adviseProtocol('https://api.openai.com.evil-relay.example/v1', advice, FALLBACK)).toBe(FALLBACK)
  })

  it('ignores port and path when matching', () => {
    expect(adviseProtocol('https://api.anthropic.com:8443/v1/messages', advice, FALLBACK)).toBe('anthropic-messages')
  })

  it('falls back for an unparseable or empty endpoint', () => {
    expect(adviseProtocol('', advice, FALLBACK)).toBe(FALLBACK)
    expect(adviseProtocol('not a url', advice, FALLBACK)).toBe(FALLBACK)
  })
})
