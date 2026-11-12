import type { Context } from '@tomato/cordis'
import type { RoomEpisodeId, RoomId, RoomMemberId, RoomMessage, RoomMessageId } from '@tomato/experimental-robot-room'
import { describe, expect, it, vi } from 'vitest'
import { summarizeWithModel } from '../src/summary.ts'

const message = {
  id: 'm1' as RoomMessageId, room: 'room-1' as RoomId, seq: 1, episode: 'ep-1' as RoomEpisodeId,
  author: { kind: 'member', id: 'research' as RoomMemberId }, kind: 'chat',
  text: '曝光 1,240 万，互动率 4.1%。', mentions: [], depth: 0, at: 1,
} satisfies RoomMessage

function contextOf(stream: () => AsyncGenerator): Context {
  const llm = {
    prepareCall: async () => ({
      config: { provider: 'test', model: 'test' },
      stream,
    }),
  }
  return { get: () => llm, logger: { warn: vi.fn() } } as never
}

describe('model summary', () => {
  it('returns a model summary within the character ceiling', async () => {
    async function* stream(): AsyncGenerator {
      yield { type: 'block-end', index: 0, block: { type: 'text', text: '- 曝光 1,240 万；互动率 4.1%。' } }
    }
    const ctx = contextOf(stream)
    const text = await summarizeWithModel(ctx, { provider: 'test', model: 'test' }, [message], new Map([['research', '研究员']]), 100, 80)
    expect(text).toBe('- 曝光 1,240 万；互动率 4.1%。')
    expect(ctx.logger.warn).not.toHaveBeenCalled()
  })

  it('falls back when no LLM is mounted or the call fails', async () => {
    const none = { get: () => undefined } as never
    expect(await summarizeWithModel(none, { provider: 'test', model: 'test' }, [message], new Map(), 100, 80)).toBeUndefined()
    async function* broken(): AsyncGenerator {
      throw new Error('provider down')
    }
    const ctx = contextOf(broken)
    expect(await summarizeWithModel(ctx, { provider: 'test', model: 'test' }, [message], new Map(), 100, 80)).toBeUndefined()
    expect(ctx.logger.warn).toHaveBeenCalled()
  })
})
