// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { Room, RoomMessage, RoomWorkRecord } from '@tomato/api-robot-room-controller/types'
import type { RoomEpisodeId, RoomId, RoomMemberId, RoomMessageId, RoomSpec } from '@tomato/experimental-robot-room'
import { RoomPage } from '../src/client/RoomPage.tsx'
import type { RoomPageProps } from '../src/client/RoomPage.tsx'
import type { RoomInjected } from '../src/client/types.ts'

/** Brand one fixture member id; array literals lose the union context that would provide it. */
const memberId = (id: string): RoomMemberId => id as RoomMemberId

afterEach(cleanup)
beforeEach(() => { publish.mockClear(); pause.mockClear() })

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 110,
    getVirtualItems: () => Array.from({ length: count }, (_, index) => ({ index, start: index * 110, key: index })),
    scrollToIndex: () => {},
    measureElement: () => {},
  }),
}))

const room = {
  id: 'room-1' as RoomId, revision: 1, state: 'active', createdAt: 1, updatedAt: 1,
  spec: {
    name: '竞品周报', charter: '每周产出竞品投放周报。',
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

const activity = {
  id: 'm2' as RoomMessageId, room: 'room-1' as RoomId, seq: 2, episode: 'episode-1' as RoomEpisodeId,
  author: { kind: 'member', id: memberId('research') }, kind: 'activity', text: 'human message #1',
  mentions: [], activity: { label: 'started', tools: [], done: false }, depth: 0,
  sessionRef: { sessionId: 'room-room-1-research', turn: 1 }, at: 2,
} satisfies RoomMessage

const unlinkedActivity = {
  id: 'm3' as RoomMessageId, room: 'room-1' as RoomId, seq: 3, episode: 'episode-1' as RoomEpisodeId,
  author: { kind: 'member', id: memberId('research') }, kind: 'activity', text: 'human message #2',
  mentions: [], activity: { label: 'finished', tools: [], done: true }, depth: 0, at: 3,
} satisfies RoomMessage

const memberChat = {
  id: 'm4' as RoomMessageId, room: 'room-1' as RoomId, seq: 4, episode: 'episode-1' as RoomEpisodeId,
  author: { kind: 'member', id: memberId('research') }, kind: 'chat', text: '周报已生成',
  mentions: [], depth: 0, sessionRef: { sessionId: 'room-room-1-research', turn: 1 }, at: 4,
} satisfies RoomMessage

const workRecord = {
  ticket: 't1', room: 'room-1', thread: 'room-1#1', member: 'coord', subject: '整理竞品定价',
  sender: 'human:alice', strength: 'explicit', state: 'ready', rounds: 2, at: 5,
  review: { rounds: 2, findings: ['缺少来源'] },
} satisfies RoomWorkRecord

const roomsSnapshot = { rooms: [room] }
const robotsSnapshot = { options: [
  { spec: 'coord-bot', revision: 1, name: '协调员', mission: '协调' },
  { spec: 'research-bot', revision: 1, name: '研究员', mission: '研究' },
  { spec: 'writer-bot', revision: 1, name: '写手', mission: '写作' },
] }

const publish = vi.fn(async (_request: { id?: string; spec: RoomSpec }) => ({ ok: true as const, value: room }))
const pause = vi.fn(async (_request: { room: string; paused: boolean }) => ({ ok: true as const, value: room }))
const face: RoomInjected = {
  hooks: {
    rooms: { getSnapshot: () => roomsSnapshot, subscribe: () => () => {} },
    robots: { getSnapshot: () => robotsSnapshot, subscribe: () => () => {} },
  },
  actions: {
    publish,
    post: async () => ({ ok: true, value: message }),
    messages: async () => ({ ok: true, value: [message] }),
    work: async () => ({ ok: true, value: [workRecord] }),
    pause,
    resume: async () => ({ ok: true, value: room }),
    relaxOnce: async () => ({ ok: true, value: room }),
    endEpisode: async () => ({ ok: true, value: room }),
    approve: async () => ({ ok: true, value: room }),
  },
  openRobots: () => {},
  openSession: () => {},
  pickDirectory: async () => '/tmp/room',
  capabilities: async () => ({
    ok: true,
    value: {
      skills: [{ value: 'research', label: 'research' }],
      plugins: [{ value: 'plug', label: 'plug' }],
      tools: [{ value: 'read', label: 'read' }],
      mcpServers: [{ value: 'github', label: 'github' }],
      workspaceRoots: [],
    },
  }),
}

/** Render the page over one message set and the supplied Session opener. */
function renderFeed(value: readonly RoomMessage[], openSession: (sessionId: string) => void = () => {}): void {
  render(
    <RoomPage
      {...({} as RoomPageProps)}
      useRooms={selector => selector(roomsSnapshot)}
      useRobots={selector => selector(robotsSnapshot)}
      actions={{ ...face.actions, messages: async () => ({ ok: true, value }) }}
      openRobots={() => { face.openRobots() }}
      openSession={openSession}
      t={((key: string) => key)}
    />,
  )
}

describe('RoomPage data flow', () => {
  it('reads messages for the selected room and renders the visible log', async () => {
    render(
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
    await waitFor(() => { expect(screen.getByText('请出本周周报')).toBeTruthy() })
    expect(screen.getAllByText('竞品周报').length).toBeGreaterThan(0)
  })

  it('shows the tickets view with the work this room produced', async () => {
    render(
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
    fireEvent.click(screen.getByRole('button', { name: 'view.tickets' }))
    await waitFor(() => { expect(screen.getByText('整理竞品定价')).toBeTruthy() })
    expect(screen.getByText('缺少来源')).toBeTruthy()
    expect(screen.getByText('coord')).toBeTruthy()
  })

  it('opens the settings drawer and saves a review revision', async () => {
    render(
      <RoomPage
        {...({} as RoomPageProps)}
        useRooms={selector => selector(roomsSnapshot)}
        useRobots={selector => selector(robotsSnapshot)}
        actions={face.actions}
        openRobots={() => { face.openRobots() }}
        openSession={() => {}}
        pickDirectory={async () => '/tmp/room'}
        capabilities={request => face.capabilities(request)}
        t={((key: string) => key)}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'settings.open' }))
    await waitFor(() => { expect(screen.getByText('settings.review')).toBeTruthy() })
    fireEvent.change(screen.getByLabelText('settings.maxRounds'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'settings.section.advanced' }))
    await waitFor(() => { expect(screen.getByText('settings.guard')).toBeTruthy() })
    fireEvent.click(screen.getByRole('button', { name: 'settings.save' }))
    await waitFor(() => { expect(publish).toHaveBeenCalledTimes(1) })
    expect(publish.mock.calls[0]?.[0].spec.review).toEqual({ selfReview: true, acceptance: true, maxRounds: 2 })
  })

  it('narrows a capability from the deployment catalog', async () => {
    render(
      <RoomPage
        {...({} as RoomPageProps)}
        useRooms={selector => selector(roomsSnapshot)}
        useRobots={selector => selector(robotsSnapshot)}
        actions={face.actions}
        openRobots={() => { face.openRobots() }}
        openSession={() => {}}
        pickDirectory={async () => '/tmp/room'}
        capabilities={async () => ({
          ok: true,
          value: {
            skills: [{ value: 'research', label: 'research' }],
            plugins: [],
            tools: [{ value: 'read', label: 'read' }],
            mcpServers: [{ value: 'github', label: 'github' }],
            workspaceRoots: [],
          },
        })}
        t={((key: string) => key)}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'settings.open' }))
    fireEvent.click(screen.getByRole('button', { name: 'settings.section.advanced' }))
    await waitFor(() => { expect(screen.getByText('settings.capability')).toBeTruthy() })
    fireEvent.click(screen.getByRole('checkbox', { name: 'research' }))
    fireEvent.click(screen.getByRole('button', { name: 'settings.save' }))
    await waitFor(() => { expect(publish).toHaveBeenCalledTimes(1) })
    expect(publish.mock.calls[0]?.[0].spec.capability).toEqual({ skills: ['research'] })
  })

  it('publishes a room from the new-room dialog using two published robots', async () => {
    render(
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
    fireEvent.click(screen.getAllByRole('button', { name: 'rail.new' })[0]!)
    fireEvent.change(screen.getByLabelText('new.name'), { target: { value: '新群聊' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /协调员/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /研究员/ }))
    fireEvent.click(screen.getByRole('button', { name: 'new.create' }))
    await waitFor(() => { expect(publish).toHaveBeenCalledTimes(1) })
    const request = publish.mock.calls[0]?.[0]
    expect(request?.spec.name).toBe('新群聊')
    expect(request?.spec.members).toHaveLength(2)
  })

  it('adds a published robot from the members pane', async () => {
    render(
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
    fireEvent.click(screen.getByRole('button', { name: 'inspector.members' }))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'writer-bot@1' } })
    fireEvent.click(screen.getByRole('button', { name: 'members.add' }))
    await waitFor(() => { expect(publish).toHaveBeenCalledTimes(1) })
    const request = publish.mock.calls[0]?.[0]
    expect(request?.spec.members).toHaveLength(3)
  })

  it('pauses the active room', async () => {
    render(
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
    fireEvent.click(screen.getByRole('button', { name: 'header.pause' }))
    await waitFor(() => { expect(pause).toHaveBeenCalledWith({ room: 'room-1', paused: true }) })
  })

  it('opens the member Session from an activity row', async () => {
    const openSession = vi.fn()
    renderFeed([activity], openSession)
    fireEvent.click(await screen.findByRole('button', { name: 'activity.open' }))
    expect(openSession).toHaveBeenCalledWith('room-room-1-research')
  })

  it('leaves an activity row without a recorded Session without a link', async () => {
    renderFeed([unlinkedActivity])
    await screen.findByText('activity.finished')
    expect(screen.queryByRole('button', { name: 'activity.open' })).toBeNull()
  })

  it('opens the member Session from a member message and its avatar', async () => {
    const openSession = vi.fn()
    renderFeed([memberChat], openSession)
    fireEvent.click(await screen.findByRole('button', { name: 'message.openSession' }))
    expect(openSession).toHaveBeenCalledWith('room-room-1-research')
    fireEvent.click(screen.getByRole('button', { name: 'message.openSessionTitle' }))
    expect(openSession).toHaveBeenLastCalledWith('room-room-1-research')
    expect(openSession).toHaveBeenCalledTimes(2)
  })
})
