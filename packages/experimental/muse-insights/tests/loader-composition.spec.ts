/**
 * The shipped Host row booted through the real profile Loader with real
 * Session, projection, todo, LLM, Session-query, and JSON storage plugins.
 * Only model output is scripted.
 */
import { readFile } from 'node:fs/promises'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it, onTestFinished } from 'vitest'
import type { Context } from '@tomato/cordis'
import { boot, initProfile, loadProfileDirectory, readProfilePatches, type ProfileContext } from '@tomato/app-boot'
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

it('boots the muse insights row and serves a model recap plus the live todo analysis', async () => {
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
  ])
  await bundle(home, 'fixture-muse-insights', [{ id: 'muse-insights', name: 'cordis:muse-insights' }])
  await writeFile(join(dir, 'cordis.yml'), '[]\n')
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
      'muse-insights': MuseInsights,
    })
  })
  expect(ctx.museInsights).toBeDefined()

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
      { title: 'Draft the launch plan', detail: 'Drafted.', status: 'done' },
      { title: 'Send the brief', detail: 'Still pending.', status: 'ongoing' },
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
