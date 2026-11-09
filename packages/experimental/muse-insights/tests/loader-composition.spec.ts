/**
 * The shipped Host row booted through the real profile Loader with real
 * Session, projection, todo, LLM, Session-query, and JSON storage plugins.
 * Only model output is scripted.
 */
import { readFile } from 'node:fs/promises'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it, onTestFinished, vi } from 'vitest'
import type { Context } from '@tomato/cordis'
import { boot, initProfile, loadProfileDirectory, readProfilePatches, type ProfileContext } from '@tomato/app-boot'
import ConfigEditor from '@tomato/config-editor'
import Settings from '@tomato/settings'
import Sessions, { SessionId, SessionSeq } from '@tomato/session'
import Projections from '@tomato/session-projection'
import Llm, { LlmAdapter, createAssistantMessage, createUserMessage } from '@tomato/llm'
import type { GenerateOptions, StreamChunk } from '@tomato/llm'
import Storage from '@tomato/storage'
import * as StorageDomain from '@tomato/storage-domain'
import * as StorageJson from '@tomato/storage-json'
import Tools from '@tomato/tools'
import SystemPrompt from '@tomato/system-prompt'
import SessionQuerySqlite from '@tomato/session-query-sqlite'
import * as ToolTodo from '@tomato/tool-todo'
import Timer from '@tomato/cordis-plugin-timer'
import MuseInsights from '../src/index.ts'

/** Scripted model: each request consumes the next response. */
class Model extends LlmAdapter {
  readonly requests: GenerateOptions[] = []
  constructor(private readonly script: StreamChunk[][]) { super() }
  override async *stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    this.requests.push(options)
    const chunks = this.script.shift()
    if (chunks === undefined) throw new Error('scripted model exhausted')
    for (const chunk of chunks) yield chunk
  }
}

function text(value: string): StreamChunk[] {
  return [
    { type: 'block-start', index: 0, blockType: 'text' },
    { type: 'block-end', index: 0, block: { type: 'text', text: value } },
    { type: 'finish', reason: { kind: 'stop' } },
  ]
}

interface Row { readonly id: string; readonly name: string; readonly config?: Record<string, unknown> }

/**
 * Boot the fixture profile with the Muse insights row, its base services, and
 * the config the row's bundle patch declares.
 * @param rowConfig - config the fixture bundle puts on the Muse insights row.
 * @returns the temp home, the workspace, and the booted context.
 */
async function bootInsights(rowConfig: Record<string, unknown> = {}, seed?: (home: string) => Promise<void>) {
  const home = await mkdtemp(join(tmpdir(), 'tomato-muse-insights-'))
  let owner: Context | undefined
  onTestFinished(async () => { await owner?.fiber.dispose(); await rm(home, { recursive: true, force: true }) })
  const workspace = join(home, 'workspace')
  const dir = join(home, 'profiles', 'test')
  const anchor = join(home, 'package.json')
  await mkdir(workspace, { recursive: true })
  await writeFile(anchor, JSON.stringify({ name: 'installation', dependencies: {} }))
  initProfile(dir, ['fixture-base', 'fixture-muse-insights'])
  async function bundle(root: string, name: string, inserted: Row[]) {
    const path = join(root, 'node_modules', name)
    await mkdir(path, { recursive: true })
    await writeFile(join(path, 'package.json'), JSON.stringify({ name, version: '1.0.0', tomato: { bundle: { patch: './cordis.patch.yml' } } }))
    await writeFile(join(path, 'cordis.patch.yml'), JSON.stringify([{ insert: inserted }]))
  }
  await bundle(dir, 'fixture-base', [
    { id: 'session', name: 'cordis:sessions' },
    { id: 'projection', name: 'cordis:projections' },
    { id: 'llm', name: 'cordis:llm' },
    { id: 'tools', name: 'cordis:tools' },
    { id: 'prompt', name: 'cordis:prompt' },
    { id: 'storage', name: 'cordis:storage' },
    { id: 'storage-json', name: 'cordis:storageJson', config: { root: join(home, 'storages') } },
    { id: 'storage-domain', name: 'cordis:storageDomain', config: { backend: 'json' } },
    { id: 'session-query', name: 'cordis:sessionQuery', config: { path: ':memory:', openAt: 'never' } },
    { id: 'timer', name: 'cordis:timer' },
    { id: 'tool-todo', name: 'cordis:toolTodo', config: { allowParallelInProgress: true } },
    { id: 'config-editor', name: 'cordis:configEditor' },
    { id: 'settings', name: 'cordis:settings' },
  ])
  await bundle(home, 'fixture-muse-insights', [{ id: 'muse-insights', name: 'cordis:muse-insights', config: rowConfig }])
  await writeFile(join(dir, 'cordis.yml'), '[]\n')
  await seed?.(home)
  const profile: ProfileContext = {
    name: 'test', dir, home, cwd: home, patchPath: join(dir, 'cordis.patch.yml'), installAnchor: anchor,
    startedBundles: loadProfileDirectory('test', dir, anchor).layers.map(layer => layer.packageName),
    overlays: [], telemetryDisabledEnv: undefined,
  }
  const ctx = await boot('test', join(dir, 'cordis.yml'), readProfilePatches('test', profile), (ctx) => {
    owner = ctx
    ctx.provide('profileContext', profile)
    Object.assign(ctx.loader.builtins, {
      sessions: Sessions, projections: Projections, llm: Llm, tools: Tools, prompt: SystemPrompt,
      storage: Storage, storageJson: StorageJson, storageDomain: StorageDomain,
      sessionQuery: SessionQuerySqlite, timer: Timer, toolTodo: ToolTodo,
      configEditor: ConfigEditor, settings: Settings,
      'muse-insights': MuseInsights,
    })
  })
  expect(ctx.museInsights).toBeDefined()
  return { home, workspace, ctx }
}

it('boots the muse insights row and serves a model recap plus the live todo analysis', async () => {
  const { home, workspace, ctx } = await bootInsights({ provider: 'test', model: 'm' })

  const session = ctx.sessions.create(SessionId('muse-work'), { meta: { cwd: workspace } })
  session.append('request/header', { header: { config: { provider: 'test', model: 'm' } }, reason: 'initial' })
  session.append('user/message', createUserMessage({
    content: [{ type: 'text', text: 'Draft the launch plan and send the brief.' }],
    source: { kind: 'user' },
  }), { surfaceOp: 'append' })
  session.append('todo/write', {
    todos: [
      { content: 'Send the brief', status: 'pending' },
      { content: 'Draft the plan', status: 'in_progress' },
      { content: 'Open the folder', status: 'completed' },
    ],
  })
  session.append('assistant/message', {
    turn: 1,
    step: 1,
    message: createAssistantMessage({
      content: [{ type: 'text', text: 'The plan is drafted; the brief still needs sending.' }],
      source: { provider: 'test', model: 'm' },
    }),
    stream: [],
  }, { surfaceOp: 'append' })
  session.append('session/title', {
    title: 'Launch plan',
    messageSeqs: [SessionSeq(1)],
    source: { kind: 'fallback' },
  })

  const model = new Model([text(JSON.stringify({
    headline: 'Launch brief in progress',
    summary: 'Drafted the launch plan and left the brief to send.',
    workItems: [
      {
        problem: 'The launch plan has no owner',
        conclusion: 'Drafted the plan.',
        solution: 'Wrote the plan and named the owner.',
        status: 'done',
        sessionIds: ['muse-work'],
      },
      {
        problem: 'The brief has not been sent',
        conclusion: 'Still pending.',
        solution: 'Left the send step for tomorrow.',
        status: 'ongoing',
        sessionIds: ['muse-work'],
      },
    ],
    openTasks: ['Send the brief', 'Open the folder'],
  }))])
  ctx.llm.registerAdapter(['test'], model)

  const signal = new AbortController().signal
  const refreshed = await ctx.museInsights.refresh(signal)
  expect(refreshed.available).toBe(true)
  expect(refreshed.recap).toMatchObject({
    source: 'model',
    headline: 'Launch brief in progress',
    openTasks: ['Send the brief', 'Open the folder'],
    sessions: [{ sessionId: 'muse-work', title: 'Launch plan' }],
  })
  expect(refreshed.recap?.workItems.map(item => item.problem))
    .toEqual(['The launch plan has no owner', 'The brief has not been sent'])
  expect(refreshed.recap?.workItems[0]?.sessionIds).toEqual(['muse-work'])
  expect(refreshed.unfinished.tasks.map(task => task.title)).toEqual(['Draft the plan', 'Send the brief'])
  expect(refreshed.unfinished.tasks.find(task => task.title === 'Draft the plan')).toMatchObject({ status: 'in_progress', source: 'todo' })
  expect(refreshed.unfinished.tasks.some(task => task.title === 'Open the folder')).toBe(false)
  expect(model.requests).toHaveLength(1)
  const prompt = model.requests[0]?.messages.at(-1)
  expect(JSON.stringify(prompt)).toContain('Draft the launch plan and send the brief.')

  const stored = JSON.parse(await readFile(join(home, 'storages', 'tomato_muse_insights.json'), 'utf8')) as {
    tables: { recaps: Record<string, { recap: { day: string }; model?: { input: string; response: string } }> }
  }
  const record = Object.values(stored.tables.recaps)[0]
  expect(record?.recap.day).toMatch(/^\d{4}-\d{2}-\d{2}$/u)
  expect(record?.model?.input).toContain("Summarize today's sessions from this JSON:")
  expect(record?.model?.response).toContain('Launch brief in progress')
}, 30_000)

it('summarizes only evidence newer than the retained recap and merges the day', async () => {
  const { home, workspace, ctx } = await bootInsights({ provider: 'test', model: 'm' })
  const session = ctx.sessions.create(SessionId('muse-incremental'), { meta: { cwd: workspace } })
  session.append('user/message', createUserMessage({
    content: [{ type: 'text', text: 'Draft the launch plan.' }],
    source: { kind: 'user' },
  }), { surfaceOp: 'append' })
  session.append('assistant/message', {
    turn: 1,
    step: 1,
    message: createAssistantMessage({
      content: [{ type: 'text', text: 'The plan is drafted.' }],
      source: { provider: 'test', model: 'm' },
    }),
    stream: [],
  }, { surfaceOp: 'append' })

  const model = new Model([
    text(JSON.stringify({
      headline: 'Launch plan drafted',
      summary: 'Drafted the plan.',
      workItems: [{
        problem: 'The launch plan is missing',
        conclusion: 'Drafted it.',
        solution: 'Wrote the plan.',
        status: 'ongoing',
        sessionIds: ['muse-incremental'],
      }],
      openTasks: ['Send the brief'],
    })),
    text(JSON.stringify({
      headline: 'Launch plan drafted and the brief sent',
      summary: 'Drafted the plan and sent the brief.',
      workItems: [{
        problem: 'The launch plan is missing',
        conclusion: 'Drafted it.',
        solution: 'Wrote the plan and sent the brief.',
        status: 'done',
        sessionIds: ['muse-incremental'],
      }],
      openTasks: [],
    })),
  ])
  ctx.llm.registerAdapter(['test'], model)

  const signal = new AbortController().signal
  const first = await ctx.museInsights.refresh(signal)
  expect(first.recap).toMatchObject({ headline: 'Launch plan drafted', messageCount: 2 })

  // Appends stamp Date.now(), so a later window needs a later clock instant.
  await new Promise(resolve => setTimeout(resolve, 5))
  session.append('user/message', createUserMessage({
    content: [{ type: 'text', text: 'Send the brief now.' }],
    source: { kind: 'user' },
  }), { surfaceOp: 'append' })
  session.append('assistant/message', {
    turn: 2,
    step: 1,
    message: createAssistantMessage({
      content: [{ type: 'text', text: 'The brief is sent.' }],
      source: { provider: 'test', model: 'm' },
    }),
    stream: [],
  }, { surfaceOp: 'append' })

  const second = await ctx.museInsights.refresh(signal)
  expect(second.recap).toMatchObject({
    headline: 'Launch plan drafted and the brief sent',
    messageCount: 4,
    workItems: [{ problem: 'The launch plan is missing', status: 'done' }],
  })
  expect(model.requests).toHaveLength(2)
  const prompt = JSON.stringify(model.requests[1]?.messages.at(-1))
  expect(prompt).toContain('previousRecap')
  expect(prompt).toContain('Launch plan drafted')
  expect(prompt).toContain('Send the brief now.')
  expect(prompt).not.toContain('"text":"Draft the launch plan."')
  const stored = JSON.parse(await readFile(join(home, 'storages', 'tomato_muse_insights.json'), 'utf8')) as {
    tables: { recaps: Record<string, { recap: { messageCount: number } }> }
  }
  expect(Object.values(stored.tables.recaps)[0]?.recap.messageCount).toBe(4)
}, 30_000)

it('adopts a committed configuration change without remounting the service', async () => {
  const { workspace, ctx } = await bootInsights({ provider: 'test', model: 'm', maxTasks: 2 })
  const session = ctx.sessions.create(SessionId('muse-config'), { meta: { cwd: workspace } })
  session.append('user/message', createUserMessage({
    content: [{ type: 'text', text: 'Plan the launch and book the room.' }],
    source: { kind: 'user' },
  }), { surfaceOp: 'append' })
  session.append('todo/write', {
    todos: [
      { content: 'Draft the plan', status: 'pending' },
      { content: 'Send the brief', status: 'pending' },
      { content: 'Book the room', status: 'pending' },
    ],
  })
  const signal = new AbortController().signal
  const before = await ctx.museInsights.refresh(signal)
  expect(before.unfinished.tasks).toHaveLength(2)

  const own = ctx.settings.describe().find(descriptor => descriptor.ns === 'muse-insights')
  if (own === undefined) throw new Error('the Muse insights settings namespace is missing')
  expect(own.value).toMatchObject({ maxTasks: 2 })
  const serialized = own.schema as { uid?: unknown; refs?: Record<string, { dict?: Record<string, unknown> }> }
  const properties = Object.keys(serialized.refs?.[String(serialized.uid)]?.dict ?? {}).sort()
  expect(properties).toEqual([
    'initialDelaySeconds', 'lookbackDays', 'maxInputBytes', 'maxMessageChars', 'maxMessagesPerSession',
    'maxOutputTokens', 'maxRecapDays', 'maxSessions', 'maxTasks', 'model', 'provider', 'recapNoticeMinutes',
    'summaryIntervalMinutes', 'timeoutMs',
  ])
  expect(own.value).toMatchObject({ recapNoticeMinutes: 240, summaryIntervalMinutes: 120 })

  const entry = [...ctx.loader.entries()].find(row => row.options.id === 'muse-insights')
  if (entry === undefined) throw new Error('the Muse insights row is missing')
  const uid = entry.fiber?.uid
  await ctx.settings.update('muse-insights', { maxTasks: 5, summaryIntervalMinutes: 5 })

  expect(entry.fiber?.uid).toBe(uid)
  const after = await ctx.museInsights.refresh(signal)
  expect(after.unfinished.tasks).toHaveLength(3)
}, 30_000)

it('opens a version-1 store and serves its legacy recap and analysis', async () => {
  const day = '2026-11-03'
  const { ctx } = await bootInsights({}, async (home) => {
    const storages = join(home, 'storages')
    await mkdir(storages, { recursive: true })
    await writeFile(join(storages, 'tomato_muse_insights.json'), JSON.stringify({
      unit: { name: 'tomato_muse_insights', version: 1 },
      global: null,
      tables: {
        recaps: {
          [`local|${day}`]: {
            owner: 'local',
            recap: {
              day,
              generatedAt: 1,
              source: 'local',
              headline: '',
              summary: '',
              workItems: [{
                title: 'The launch plan has no owner',
                detail: 'The plan is drafted.',
                status: 'unknown',
              }],
              openTasks: [],
              sessions: [],
              messageCount: 2,
            },
            latestEventTime: 1,
          },
        },
        analyses: {
          local: {
            owner: 'local',
            analysis: {
              analyzedAt: 1,
              tasks: [{
                id: 'task-1',
                title: 'The launch plan has no owner',
                detail: 'The plan is drafted.',
                status: 'pending',
                source: 'recap',
                sessionId: null,
                sessionTitle: null,
              }],
            },
          },
        },
      },
    }))
  })
  const snapshot = await ctx.museInsights.snapshot(new AbortController().signal)
  expect(snapshot.available).toBe(true)
  expect(snapshot.recap).toMatchObject({
    day,
    source: 'local',
    workItems: [{
      problem: 'The launch plan has no owner',
      conclusion: '',
      solution: 'The plan is drafted.',
      status: 'unknown',
      sessionIds: [],
    }],
  })
  expect(snapshot.unfinished.tasks).toEqual([{
    id: 'task-1',
    title: 'The launch plan has no owner',
    detail: 'The plan is drafted.',
    status: 'pending',
    source: 'recap',
    sessionId: null,
    sessionTitle: null,
  }])
}, 30_000)

it('probes an embedding endpoint from the Host and reports provider usage', async () => {
  const { ctx } = await bootInsights({ provider: 'test', model: 'm' })
  const signal = new AbortController().signal
  expect(await ctx.museInsights.embeddingsStatus(signal)).toEqual({ available: false, enabled: false })

  const request = vi.fn(async () => new Response(JSON.stringify({ data: [{ embedding: [1, 2, 3] }] }), { status: 200 }))
  vi.stubGlobal('fetch', request)
  onTestFinished(() => { vi.unstubAllGlobals() })
  const probed = await ctx.museInsights.probeEmbeddings({
    baseUrl: 'http://127.0.0.1:11434/v1', model: 'nomic-embed-text', dimensions: 3,
  }, signal)
  expect(probed).toMatchObject({ ok: true, dimensions: 3 })
  expect(request).toHaveBeenCalledTimes(1)

  ctx.provide('embeddings', {
    enabled: true, model: 'text-embedding-v4', dimensions: 1024,
    usage: { requests: 2, texts: 5, failures: 1, totalMs: 120, lastError: 'boom' },
  } as never)
  expect(await ctx.museInsights.embeddingsStatus(signal)).toEqual({
    available: true, enabled: true, model: 'text-embedding-v4', dimensions: 1024,
    usage: { requests: 2, texts: 5, failures: 1, totalMs: 120, lastError: 'boom' },
  })
})
