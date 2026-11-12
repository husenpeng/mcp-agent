import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Room, RoomMessage } from '@tomato/api-robot-room-controller/types'
import type { RoomEpisodeId, RoomId, RoomMemberId, RoomMessageId } from '@tomato/experimental-robot-room'
import { RoomPage } from '../src/client/RoomPage.tsx'
import type { RoomPageProps } from '../src/client/RoomPage.tsx'
import type { RoomInjected } from '../src/client/types.ts'

/** Brand one fixture member id; array literals lose the union context that would provide it. */
const memberId = (id: string): RoomMemberId => id as RoomMemberId

const room = {
  id: 'room-1' as RoomId,
  revision: 1,
  state: 'active',
  createdAt: 1,
  updatedAt: 1,
  spec: {
    name: '竞品周报',
    charter: '每周产出竞品投放周报。',
    members: [
      {
        id: memberId('coord'), robot: { spec: 'coord-bot', revision: 1 }, displayName: '协调员', role: 'coordinator',
        wake: { kind: 'all-human' }, a2a: { canAddress: '*', accepts: ['request', 'reply'], requiresApproval: [] },
        budget: { turnInputTokens: 48_000, turnOutputTokens: 6_000, dailyTokens: 600_000 }, enabled: true,
      },
      {
        id: memberId('research'), robot: { spec: 'research-bot', revision: 1 }, displayName: '研究员', role: 'worker',
        wake: { kind: 'mention' }, a2a: { canAddress: [memberId('coord')], accepts: ['request', 'reply'], requiresApproval: [] },
        budget: { turnInputTokens: 48_000, turnOutputTokens: 6_000, dailyTokens: 600_000 }, enabled: true,
      },
    ],
    routing: { humanDefault: 'coordinator', coordinator: memberId('coord'), maxFanout: 1, floor: 1 },
    guard: {
      maxDepth: 4, episodeTurns: 12, episodeMessages: 40, episodeTokens: 250_000, wallClockMs: 1_200_000,
      memberTurnsPerMinute: 6, memberBurst: 3, maxPendingPerMember: 3, maxDuplicates: 2, pingPongLimit: 4,
      noProgressWindow: 3, noProgressSimilarity: 0.85, memberTurnTimeoutMs: 120_000,
    },
    budget: { dailyTokens: 3_000_000, softLimitRatio: 0.8 },
    context: { window: 20, messageChars: 1500, summaryChars: 1200, triggerChars: 6000 },
  },
} satisfies Room

const message = {
  id: 'm1' as RoomMessageId, room: 'room-1' as RoomId, seq: 1, episode: 'episode-1' as RoomEpisodeId,
  author: { kind: 'human', id: 'alice', name: 'Alice' }, kind: 'chat', text: '请出本周周报',
  mentions: [], depth: 0, at: 1,
} satisfies RoomMessage

const roomsSnapshot = { rooms: [room] }
const robotsSnapshot = { options: [{ spec: 'coord-bot', revision: 1, name: '协调员', mission: '协调' }] }

const face: RoomInjected = {
  hooks: {
    rooms: {
      getSnapshot: () => ({ rooms: [room] }),
      subscribe: () => () => {},
    },
    robots: {
      getSnapshot: () => ({ options: [{ spec: 'coord-bot', revision: 1, name: '协调员', mission: '协调' }] }),
      subscribe: () => () => {},
    },
  },
  actions: {
    publish: async () => ({ ok: true, value: room }),
    post: async () => ({ ok: true, value: message }),
    messages: async () => ({ ok: true, value: [message] }),
    pause: async () => ({ ok: true, value: room }),
    resume: async () => ({ ok: true, value: room }),
    relaxOnce: async () => ({ ok: true, value: room }),
    endEpisode: async () => ({ ok: true, value: room }),
    approve: async () => ({ ok: true, value: room }),
  },
  openRobots: () => {},
  openSession: () => {},
}

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 110,
    getVirtualItems: () => Array.from({ length: count }, (_, index) => ({ index, start: index * 110, key: index })),
    scrollToIndex: () => {},
    measureElement: () => {},
  }),
}))

describe('RoomPage', () => {
  it('renders the room, its members, and the visible log', () => {
    const html = renderToStaticMarkup(
      <RoomPage
        {...({} as RoomPageProps)}
        useRooms={selector => selector(roomsSnapshot)}
        useRobots={selector => selector(robotsSnapshot)}
        actions={face.actions}
        openRobots={() => { face.openRobots() }}
        openSession={() => {}}
        t={((key: string) => key)}
      />,
    )
    expect(html).toContain('竞品周报')
    expect(html).toContain('协调员')
    expect(html).toContain('composer.send')
    expect(html).toContain('monitor.breaker')
  })
})
