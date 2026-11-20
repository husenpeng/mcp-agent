import { Context } from '@tomato/cordis'
import { emptyRoomSpec } from '@tomato/experimental-robot-room'
import type { RoomMemberId, RoomSpec } from '@tomato/experimental-robot-room'
import SessionStore from '@tomato/session'
import Storage from '@tomato/storage'
import { DomainFacility } from '@tomato/storage-domain'
import { describe, expect, it, vi } from 'vitest'
import { MemoryMediaPool, MemoryStorageBackend } from '../../../storage/storage-domain/tests/helpers/memory-backend.ts'
import LocalRooms from '../src/index.ts'

function spec(capability?: RoomSpec['capability']): RoomSpec {
  return {
    ...emptyRoomSpec({
      name: 'room', charter: 'charter',
      members: [
        { id: 'coord', robot: 'coord-bot', revision: 1, name: '协调员', role: 'coordinator' },
        { id: 'research', robot: 'research-bot', revision: 1, name: '研究员', role: 'worker' },
      ],
    }),
    routing: { humanDefault: 'coordinator', coordinator: 'coord' as RoomMemberId, maxFanout: 1, floor: 1 },
    ...capability === undefined ? {} : { capability },
  }
}

async function contextOf(pool: MemoryMediaPool, options: {
  readonly preset?: string
  readonly restrictTools?: (value: { readonly allow?: readonly string[]; readonly deny?: readonly string[] }) => void
  readonly restrictSkills?: (value: { readonly allow: readonly string[] }) => void
  readonly setPreset?: (session: unknown, preset: string) => void
} = {}): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  await ctx.plugin(Storage)
  const backend = new MemoryStorageBackend(pool)
  ctx.effect(() => ctx.storage.backend.register('fixture', backend))
  const facility = new DomainFacility(ctx, { backend: 'fixture' })
  ctx.effect(() => {
    const unmount = ctx.storage.mount('domain', facility)
    ctx.provide('storageDomain', facility)
    return async () => {
      await facility.closeAll()
      unmount()
    }
  })
  ctx.provide('robots', {
    revision: async () => ({
      ref: { spec: 'coord-bot', revision: 1 },
      spec: {
        capability: {
          tools: { allow: ['read', 'write'], deny: ['shell'] },
          skills: ['research', 'writing'],
          mcpServers: [],
          permissionPreset: options.preset ?? 'workspace-write',
        },
      },
    }),
  } as never)
  const tools = {
    definitions: () => [{ name: 'read' }, { name: 'mcp__github__issues' }, { name: 'mcp__slack__post' }],
    restrict: (value: { readonly allow?: readonly string[]; readonly deny?: readonly string[] }) => { options.restrictTools?.(value) },
    get: () => undefined,
    register: () => {},
  }
  const skills = { restrict: (value: { readonly allow: readonly string[] }) => { options.restrictSkills?.(value) } }
  ctx.provide('tools', { definitions: tools.definitions } as never)
  ctx.provide('permissionPresets', {
    set: (session: unknown, preset: string) => { options.setPreset?.(session, preset) },
  } as never)
  const agent = { id: 'agent-1', session: { id: 'agent-1' }, followup: () => {}, whenIdle: async () => {}, cancel: () => {} }
  ctx.provide('agents', {
    get: () => undefined,
    resume: async () => { throw new Error('no persisted session') },
    create: async (input: { setup?: (context: unknown, agent: unknown) => void }) => {
      input.setup?.({ get: (name: string) => name === 'tools' ? tools : name === 'skills' ? skills : undefined, systemPrompt: { section: () => {} } }, agent)
      return { agent, dispose: async () => {} }
    },
    list: () => [],
    turnBoundaryOf: () => ({ openTurnStartSeq: null, lastStepStartSeq: null, lastStepBoundary: null, lastTurn: 0 }),
  } as never)
  ctx.provide('agentDefaultModel', { currentSelection: () => ({ provider: 'test', model: 'test' }) } as never)
  await ctx.plugin(LocalRooms)
  return ctx
}

describe('room capability narrowing', () => {
  it('intersects tool and skill lists with the robot and denies MCP servers the room did not name', async () => {
    const restrictTools = vi.fn()
    const restrictSkills = vi.fn()
    const setPreset = vi.fn()
    const ctx = await contextOf(new MemoryMediaPool(), { restrictTools, restrictSkills, setPreset })
    try {
      const room = await ctx.rooms.publish(undefined, spec({
        tools: { allow: ['write', 'other'] },
        skills: ['writing'],
        mcpServers: ['github'],
        permissionPreset: 'workspace-write',
      }))
      await ctx.rooms.post({ room: room.id, text: '请出周报', author: { id: 'alice', name: 'Alice' } })
      await vi.waitFor(() => { expect(restrictTools).toHaveBeenCalled() })
      expect(restrictTools).toHaveBeenCalledWith({ allow: ['write'], deny: expect.arrayContaining(['shell', 'mcp__slack__post']) as string[] })
      expect(restrictSkills).toHaveBeenCalledWith({ allow: ['writing'] })
      expect(setPreset).toHaveBeenCalledWith(expect.anything(), 'workspace-write')
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('refuses a permission preset the robot does not run under', async () => {
    const ctx = await contextOf(new MemoryMediaPool(), { preset: 'workspace-write' })
    try {
      const room = await ctx.rooms.publish(undefined, spec({ permissionPreset: 'read-only' }))
      await ctx.rooms.post({ room: room.id, text: '请出周报', author: { id: 'alice', name: 'Alice' } })
      await vi.waitFor(async () => {
        const messages = await ctx.rooms.messages(room.id)
        expect(messages.some(message => message.kind === 'guard' && message.text.includes('permission preset'))).toBe(true)
      })
    } finally {
      await ctx.fiber.dispose()
    }
  })
})
