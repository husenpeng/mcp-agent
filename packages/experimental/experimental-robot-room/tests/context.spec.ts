import { beforeEach, describe, expect, it } from 'vitest'
import {
  buildMemberInput, fallbackSummary, renderMessage, unreadCount, visibleTo,
} from '../src/index.ts'
import type { RoomEpisodeId, RoomId, RoomMemberId, RoomMessage, RoomMessageId } from '../src/index.ts'

const room = 'room-1' as RoomId
const episode = 'episode-1' as RoomEpisodeId
const coord = 'coord' as RoomMemberId
const research = 'research' as RoomMemberId
const writer = 'writer' as RoomMemberId

let seq = 0
beforeEach(() => { seq = 0 })
function message(overrides: Partial<RoomMessage> = {}): RoomMessage {
  seq += 1
  return {
    id: `m-${seq}` as RoomMessageId,
    room,
    seq,
    episode,
    author: { kind: 'member', id: coord },
    kind: 'chat',
    text: `message ${seq}`,
    mentions: [],
    depth: 0,
    at: seq,
    ...overrides,
  }
}

const labels = new Map([['coord', '协调员'], ['research', '研究员'], ['writer', '写手']])

describe('member context', () => {
  it('renders author, mentions, and clamps long text', () => {
    const line = renderMessage(message({ text: 'a'.repeat(300), mentions: [research] }), labels, 100)
    expect(line).toContain('协调员')
    expect(line).toContain('@研究员')
    expect(line.length).toBeLessThan(140)
  })

  it('hides private A2A from a third member but shows it to sender and receiver', () => {
    const privateMessage = message({
      kind: 'a2a',
      text: 'secret',
      a2a: {
        protocol: 'tomato-a2a/2', id: 'e', room, episode, from: coord, to: [research], intent: 'inform',
        task: 'secret', context: '', artifacts: [], depth: 1, grantTokens: 0, deadline: 1, signature: 's',
        visibility: 'private',
      },
    })
    expect(visibleTo(privateMessage, coord)).toBe(true)
    expect(visibleTo(privateMessage, research)).toBe(true)
    expect(visibleTo(privateMessage, writer)).toBe(false)
  })

  it('builds an incremental input with a summary for older unread messages', () => {
    const messages = [
      message({ text: 'first' }),
      message({ text: 'second' }),
      message({ text: 'third' }),
      message({ text: 'fourth' }),
    ]
    const input = buildMemberInput({
      member: coord, labels, messages, fromSeq: 0, window: 2, messageChars: 100,
      summaryChars: 200, triggerChars: 100, wake: { kind: 'mention', detail: 'you were mentioned', messageSeqs: [4] },
    })
    expect(input.summarized).toBe(true)
    expect(input.included).toBe(2)
    expect(input.toSeq).toBe(4)
    expect(input.text).toContain('summarized')
    expect(input.text).toContain('fourth')
    expect(input.text).toContain('Why you were woken')
  })

  it('does not repeat messages the member already read', () => {
    const messages = [message({ text: 'already seen' }), message({ text: 'fresh message' })]
    const input = buildMemberInput({
      member: coord, labels, messages, fromSeq: 1, window: 20, messageChars: 100,
      summaryChars: 200, triggerChars: 100, wake: { kind: 'human', detail: 'new human message', messageSeqs: [2] },
    })
    expect(input.text).not.toContain('already seen')
    expect(input.text).toContain('fresh message')
  })

  it('summarizes deterministically within the character budget', () => {
    const messages = [message({ text: 'a'.repeat(50) }), message({ text: 'b'.repeat(50) })]
    const summary = fallbackSummary(messages, labels, 120)
    expect(summary.length).toBeLessThanOrEqual(120)
    expect(summary.startsWith('- ')).toBe(true)
  })

  it('counts unread visible messages', () => {
    const messages = [message(), message({ text: 'x' })]
    expect(unreadCount(messages, coord, 0)).toBe(2)
    expect(unreadCount(messages, coord, 1)).toBe(1)
  })
})
