// Real composition: the shipped bundle row is booted through the Loader from a
// cordis.yml, so the package name, the config keys, and the registered tool set
// are exercised the way a profile mounts them rather than through a hand-built
// `ctx.plugin(...)` call.
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@tomato/cordis'
import Loader from '@tomato/cordis-plugin-loader'
import Include from '@tomato/cordis-plugin-include'
import { ToolCallId } from '@tomato/llm'
import AgentRegistry from '@tomato/agent'
import SystemPrompt from '@tomato/system-prompt'
import ToolRuntime from '@tomato/tools'
import * as NativeToolExecutor from '@tomato/tool-executor-native'
import SessionProjectionRegistry from '@tomato/session-projection'
import * as CreatorSearch from '@tomato/tool-creator-search'
import Storage from '@tomato/storage'
import * as MemoryStorage from './helpers/memory-storage.ts'
import {
  CREATOR_DETAIL_TOOL,
  CREATOR_FEEDBACK_TOOL,
  CREATOR_INGEST_TOOL,
  CREATOR_SCOUT_TOOL,
  CREATOR_SEARCH_TOOL,
  YOUTUBE_CHANNEL_TOOL,
} from '@tomato/tool-creator-search'

let root: string | undefined
let context: Context | undefined

afterEach(async () => {
  await context?.fiber.dispose()
  context = undefined
  if (root !== undefined) await rm(root, { recursive: true, force: true })
  root = undefined
  vi.unstubAllGlobals()
})

/**
 * Boot a cordis.yml carrying the given creator-search config block.
 * @param configLines - YAML lines nested under the plugin's `config:` key.
 * @returns the booted context.
 */
async function boot(configLines: readonly string[]): Promise<Context> {
  root = await mkdtemp(join(tmpdir(), 'tomato-creator-search-loader-'))
  const configPath = join(root, 'cordis.yml')
  await writeFile(configPath, [
    "- name: '@tomato/agent'",
    "- name: '@tomato/system-prompt'",
    "- name: '@tomato/tools'",
    "- name: '@tomato/tool-executor-native'",
    "- name: '@tomato/session-projection'",
    "- name: '@tomato/storage'",
    "- name: 'test-memory-storage'",
    "- name: '@tomato/tool-creator-search'",
    ...configLines.length > 0 ? ['  config:', ...configLines] : [],
    '',
  ].join('\n'))

  const ctx = new Context()
  context = ctx
  ctx.baseUrl = pathToFileURL(root).href + '/'
  await ctx.plugin(Loader)
  ctx.loader.builtins.include = Include
  const modules = new Map<string, unknown>([
    ['@tomato/agent', AgentRegistry],
    ['@tomato/system-prompt', SystemPrompt],
    ['@tomato/tools', ToolRuntime],
    ['@tomato/tool-executor-native', NativeToolExecutor],
    ['@tomato/session-projection', SessionProjectionRegistry],
    ['@tomato/tool-creator-search', CreatorSearch],
    ['@tomato/storage', Storage],
    ['test-memory-storage', MemoryStorage],
  ])
  ctx.loader.internal = {
    version: 'v2',
    async import(specifier: string) {
      if (!modules.has(specifier)) throw new Error(`unexpected Loader import: ${specifier}`)
      return modules.get(specifier)
    },
  } as unknown as NonNullable<typeof ctx.loader.internal>
  await ctx.loader.create({ name: 'cordis:include', config: { path: pathToFileURL(configPath).href } })
  await ctx.loader.await()
  for (const entry of ctx.loader.entries()) await entry.fiber?.await()
  // The Desktop shell publishes this service after the profile boots.
  ctx.provide('desktopSession', { sessionId: () => 'session-1' })
  return ctx
}

describe('tool-creator-search real Loader composition through cordis.yml', () => {
  it('registers the three tools and applies the YAML budget and output cap', async () => {
    const ctx = await boot(['    baseURL: https://bff.test', '    timeoutMs: 61000', '    maxOutputChars: 800'])

    expect(ctx.tools.schemas().map(schema => schema.name)).toEqual(expect.arrayContaining([
      CREATOR_SEARCH_TOOL, CREATOR_DETAIL_TOOL, YOUTUBE_CHANNEL_TOOL, CREATOR_SCOUT_TOOL, CREATOR_FEEDBACK_TOOL, CREATOR_INGEST_TOOL,
    ]))
    expect(ctx.tools.get(CREATOR_SEARCH_TOOL)?.timeoutMs).toBe(61_000)

    vi.stubGlobal('fetch', vi.fn(async () => Response.json({
      data: { items: Array.from({ length: 60 }, (_, index) => ({ unique_id: `creator-${index}` })) },
      meta: { traceId: 'trace-loader', schemaVersion: '1.0', source: 'blue' },
    })))
    const batch = await ctx.tools.execute({
      calls: [{ type: 'tool-call', name: CREATOR_SEARCH_TOOL, id: ToolCallId('loader-1'), arguments: '{"platform":"TIKTOK","query":"beauty"}' }],
      signal: new AbortController().signal,
    })
    const rendered = batch.results[0]?.result.content[0]
    expect(batch.results[0]?.result.isError).toBe(false)
    expect(rendered?.type === 'text' ? rendered.text.length : 0).toBeLessThanOrEqual(800)
  }, 30_000)

  it('honors a YAML selection that turns two tools off', async () => {
    const ctx = await boot(['    baseURL: https://bff.test', '    detail: false', '    channel: false'])
    const names = ctx.tools.schemas().map(schema => schema.name)

    expect(names).toContain(CREATOR_SEARCH_TOOL)
    expect(names).not.toContain(CREATOR_DETAIL_TOOL)
    expect(names).not.toContain(YOUTUBE_CHANNEL_TOOL)
  }, 30_000)

  it('fails loading on a non-absolute BFF origin', async () => {
    await expect(boot(['    baseURL: bff.test'])).rejects.toThrow('must be an absolute URL')
  }, 30_000)
})
