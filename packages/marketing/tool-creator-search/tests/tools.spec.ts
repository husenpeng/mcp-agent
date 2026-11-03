import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@tomato/cordis'
import { ToolCallId } from '@tomato/llm'
import type { ToolExecutionResult } from '@tomato/tools'
import { mountAgentLoopTestDependencies } from '@tomato/agent-loop-testkit'
import Storage from '@tomato/storage'
import * as CreatorSearch from '@tomato/tool-creator-search'
import * as MemoryStorage from './helpers/memory-storage.ts'
import {
  CREATOR_DETAIL_TOOL,
  CREATOR_FEEDBACK_TOOL,
  CREATOR_INGEST_TOOL,
  CREATOR_SCOUT_TOOL,
  CREATOR_SEARCH_TOOL,
  formatCreatorResult,
  YOUTUBE_CHANNEL_TOOL,
} from '@tomato/tool-creator-search'

/**
 * Mount the tool registry and this plugin over a fixed BFF origin.
 * @param config - plugin configuration overrides.
 * @returns the context and the plugin fiber.
 */
async function mount(config: Record<string, unknown> = {}) {
  const ctx = new Context()
  await mountAgentLoopTestDependencies(ctx)
  const storage = await ctx.plugin(Storage)
  await storage.await()
  const domains = await ctx.plugin(MemoryStorage)
  await domains.await()
  ctx.provide('desktopSession', { sessionId: () => 'session-1' })
  const fiber = await ctx.plugin(CreatorSearch, { baseURL: 'https://bff.test', ...config })
  await fiber.await()
  return { ctx, fiber }
}

/**
 * Execute one tool call through the registry.
 * @param ctx - context carrying the registry.
 * @param name - wire tool name.
 * @param args - arguments to serialize.
 * @returns the normalized execution result.
 */
async function run(ctx: Context, name: string, args: unknown): Promise<ToolExecutionResult> {
  const batch = await ctx.tools.execute({
    calls: [{ type: 'tool-call', name, id: ToolCallId('call-1'), arguments: JSON.stringify(args) }],
    signal: new AbortController().signal,
  })
  const result = batch.results[0]?.result
  if (result === undefined) throw new Error('tool execution produced no result')
  return result
}

/**
 * Read the single text block of one result.
 * @param result - normalized execution result.
 * @returns the rendered text.
 */
function text(result: ToolExecutionResult): string {
  const block = result.content[0]
  return block?.type === 'text' ? block.text : ''
}

afterEach(() => { vi.unstubAllGlobals() })

describe('creator-search tools', () => {
  it('registers every tool and removes them when the plugin is disposed', async () => {
    const { ctx, fiber } = await mount()
    const names = ctx.tools.definitions().map(definition => definition.name)
    expect(names).toEqual(expect.arrayContaining([
      CREATOR_SEARCH_TOOL, CREATOR_DETAIL_TOOL, YOUTUBE_CHANNEL_TOOL, CREATOR_SCOUT_TOOL, CREATOR_FEEDBACK_TOOL, CREATOR_INGEST_TOOL,
    ]))

    await fiber.dispose()
    expect(ctx.tools.definitions().map(definition => definition.name)).not.toContain(CREATOR_SEARCH_TOOL)
  })

  it('registers only the selected tools', async () => {
    const { ctx } = await mount({ detail: false, channel: false, scout: false, feedback: false, ingest: false })
    const names = ctx.tools.definitions().map(definition => definition.name)
    expect(names).toContain(CREATOR_SEARCH_TOOL)
    expect(names).not.toContain(CREATOR_DETAIL_TOOL)
    expect(names).not.toContain(YOUTUBE_CHANNEL_TOOL)
  })

  it('searches creators and returns the BFF payload as the canonical value', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({
      data: { items: [{ unique_id: 'beauty.one', follower_count: 1200 }], task_status: 'success' },
      meta: { traceId: 'trace-9', schemaVersion: '1.0', source: 'blue', quota: { month: '2026-11', limit: 9000, used: 3, remaining: 8997 } },
    })))
    const { ctx } = await mount()

    const result = await run(ctx, CREATOR_SEARCH_TOOL, { platform: 'TIKTOK', query: 'beauty' })

    expect(result.isError).toBe(false)
    expect(result.value).toMatchObject({
      source: 'blue',
      traceId: 'trace-9',
      data: { items: [{ unique_id: 'beauty.one', follower_count: 1200 }] },
      quota: { remaining: 8997 },
    })
    expect(text(result)).toContain('beauty.one')
  })

  it('rejects a query over the BFF limit before any request', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const { ctx } = await mount()

    const result = await run(ctx, CREATOR_SEARCH_TOOL, { platform: 'TIKTOK', query: 'x'.repeat(201) })

    expect(result.isError).toBe(true)
    expect(result.error?.message).toContain('between 1 and 200 characters')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects a page size the BFF does not accept', async () => {
    const { ctx } = await mount()
    const result = await run(ctx, CREATOR_SEARCH_TOOL, { platform: 'TIKTOK', query: 'beauty', pageSize: 51 })

    expect(result.isError).toBe(true)
    expect(result.error?.message).toContain('between 1 and 50')
  })

  it('rejects a channel that is neither a UC id nor an @handle', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const { ctx } = await mount()

    const result = await run(ctx, YOUTUBE_CHANNEL_TOOL, { channel: 'mrbeast' })

    expect(result.isError).toBe(true)
    expect(result.error?.message).toContain('@handle')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('surfaces sign-in guidance when the BFF rejects the session', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(
      { error: { code: 'UNAUTHENTICATED', message: 'Authentication required', retryable: false }, meta: { traceId: 'trace-3' } },
      { status: 401 },
    )))
    const { ctx } = await mount()

    const result = await run(ctx, CREATOR_DETAIL_TOOL, { platform: 'YOUTUBE', creatorId: 'UCabcdefghijklmnopqrstuv' })

    expect(result.isError).toBe(true)
    expect(result.error?.message).toContain('sign in to Tomato')
  })

  it('caps the rendered text of a large payload', () => {
    const result = formatCreatorResult({
      source: 'blue',
      traceId: 'trace-1',
      data: { items: Array.from({ length: 200 }, (_, index) => ({ unique_id: `creator-${index}` })) },
    }, 600)

    expect(result.length).toBeLessThanOrEqual(600)
    expect(result).toContain('truncated')
  })
})
