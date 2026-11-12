import { describe, expect, it } from 'vitest'
import {
  A2A_PROTOCOL_V2, clampText, createEnvelopeV2, isEnvelopeV2, normalizeRoomText, roomSignature,
} from '../src/index.ts'
import type { RoomEpisodeId, RoomId, RoomMemberId } from '../src/index.ts'

const room = 'room-1' as RoomId
const episode = 'episode-1' as RoomEpisodeId
const from = 'coord' as RoomMemberId
const to = 'research' as RoomMemberId

describe('A2A v2 protocol', () => {
  it('builds an immutable envelope with a stable signature', () => {
    const envelope = createEnvelopeV2({
      id: 'env-1', room, episode, from, to: [to], intent: 'delegate',
      task: '  Pull the data. ', context: 'Last 7 days.', depth: 1, grantTokens: 1000, deadline: 10_000,
    })
    expect(envelope.protocol).toBe(A2A_PROTOCOL_V2)
    expect(envelope.task).toBe('Pull the data.')
    expect(envelope.signature).toBe(roomSignature({ from, to: [to], intent: 'delegate', task: 'Pull the data.', context: 'Last 7 days.' }))
    expect(Object.isFrozen(envelope)).toBe(true)
    expect(isEnvelopeV2(envelope)).toBe(true)
  })

  it('normalizes case, punctuation, and whitespace for duplicate detection', () => {
    expect(normalizeRoomText('  Hello,   WORLD!  ')).toBe('hello world')
  })

  it('keeps the head and tail when clamping long text', () => {
    const text = `HEAD${'a'.repeat(3000)}TAIL`
    const clamped = clampText(text, 4000)
    expect(clamped.length).toBeLessThanOrEqual(4000)
    expect(clamped.startsWith('HEAD')).toBe(true)
    expect(clamped.endsWith('TAIL')).toBe(true)
  })

  it('rejects malformed envelopes at the persistence boundary', () => {
    expect(isEnvelopeV2(null)).toBe(false)
    expect(isEnvelopeV2({ protocol: A2A_PROTOCOL_V2, id: 'x', to: [], task: 't', context: '', depth: 1, grantTokens: 1, deadline: 1, signature: 's' })).toBe(false)
    const bad: Record<string, unknown> = { ...createEnvelopeV2({ id: 'e', room, episode, from, to: [to], intent: 'request', task: 't', depth: 1, grantTokens: 1, deadline: 1 }), protocol: 'tomato-a2a/1' }
    expect(isEnvelopeV2(bad)).toBe(false)
  })
})
