/**
 * The bundle's shipped rows booted through the real profile Loader with real
 * Session, AgentLoop, tool, command, goal, approval, and JSON storage plugins.
 * Only model output is scripted.
 */
import { readFileSync } from 'node:fs'
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it, onTestFinished, vi } from 'vitest'
import * as yaml from 'js-yaml'
import type { Context } from '@tomato/cordis'
import { entryListSchema } from '@tomato/cordis-plugin-include'
import { boot, initProfile, loadProfileDirectory, readProfilePatches, type ProfileContext } from '@tomato/app-boot'
import Agents from '@tomato/agent'
import AgentLoop from '@tomato/agent-loop'
import Commands from '@tomato/commands'
import Goals, { GoalId } from '@tomato/goal'
import Llm, { LlmAdapter, ToolCallId, createUserMessage } from '@tomato/llm'
import type { GenerateOptions, StreamChunk } from '@tomato/llm'
import Sessions, { SessionId, pluginRecordOf } from '@tomato/session'
import type { Session, SessionEvent } from '@tomato/session'
import Projections from '@tomato/session-projection'
import Storage from '@tomato/storage'
import * as StorageDomain from '@tomato/storage-domain'
import * as StorageJson from '@tomato/storage-json'
import SystemPrompt from '@tomato/system-prompt'
import Tools, { defineTool } from '@tomato/tools'
import * as NativeToolExecutor from '@tomato/tool-executor-native'
import Approval from '@tomato/user-approval'
import * as Memory from '@tomato/experimental-memory'
import * as MemoryTools from '@tomato/experimental-tool-memory'
import * as Focus from '@tomato/experimental-focus'
import MuseInsights from '@tomato/experimental-muse-insights'
import SessionQuerySqlite from '@tomato/session-query-sqlite'

interface Row { readonly id: string; readonly name: string }

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  name: string
  dependencies: Record<string, string>
  tomato: { bundle: { patch: string; listedByDefault: boolean } }
}
const patch = yaml.load(readFileSync(new URL(`../${manifest.tomato.bundle.patch}`, import.meta.url), 'utf8'), {
  schema: entryListSchema,
}) as { insert: Row[] }[]
const rows = patch[0]?.insert ?? []

/** Source modules standing in for the row packages, which the Loader would otherwise import from their built lib. */
const MODULES: Readonly<Record<string, object>> = {
  '@tomato/experimental-memory': Memory,
  '@tomato/experimental-tool-memory': MemoryTools,
  '@tomato/experimental-focus': Focus,
  '@tomato/experimental-muse-insights': MuseInsights,
}

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

function call(id: string, name: string, args: object): StreamChunk[] {
  return [
    { type: 'block-start', index: 0, blockType: 'tool-call' },
    { type: 'block-end', index: 0, block: { type: 'tool-call', id: ToolCallId(id), name, arguments: JSON.stringify(args) } },
    { type: 'finish', reason: { kind: 'tool-calls' } },
  ]
}

function requestText(request: GenerateOptions | undefined): string {
  return JSON.stringify(request?.messages ?? [])
}

function sourceTexts(session: Session, kind: string): string[] {
  return session.snapshotEvents().flatMap((event: SessionEvent) => event.type === 'user/message' && event.data.source.kind === kind
    ? [event.data.content.map(block => block.type === 'text' ? block.text : '').join('')]
    : [])
}

/** Boot the shipped bundle rows over the fixture base in a temporary profile. */
async function bootBundle(toolMemoryConfig: Record<string, unknown> = {}): Promise<{ ctx: Context; home: string; workspace: string }> {
  const home = await mkdtemp(join(tmpdir(), 'tomato-muse-bundle-'))
  let owner: Context | undefined
  onTestFinished(async () => { await owner?.fiber.dispose(); await rm(home, { recursive: true, force: true }) })
  const workspace = await realpath(await mkdtemp(join(home, 'workspace-')))
  const dir = join(home, 'profiles', 'test')
  const anchor = join(home, 'package.json')
  await writeFile(anchor, JSON.stringify({ name: 'installation', dependencies: { [manifest.name]: '1.0.0' } }))
  initProfile(dir, ['fixture-base', manifest.name])
  async function bundle(root: string, name: string, inserted: object[]) {
    const path = join(root, 'node_modules', name)
    await mkdir(path, { recursive: true })
    await writeFile(join(path, 'package.json'), JSON.stringify({ name, version: '1.0.0', tomato: { bundle: { patch: './cordis.patch.yml' } } }))
    await writeFile(join(path, 'cordis.patch.yml'), JSON.stringify([{ insert: inserted }]))
  }
  await bundle(dir, 'fixture-base', [
    { id: 'session', name: 'cordis:sessions' },
    { id: 'projection', name: 'cordis:projections' },
    { id: 'llm', name: 'cordis:llm' },
    { id: 'prompt', name: 'cordis:prompt' },
    { id: 'tools', name: 'cordis:tools' },
    { id: 'executor', name: 'cordis:executor' },
    { id: 'agents', name: 'cordis:agents' },
    { id: 'loop', name: 'cordis:loop', config: { agents: [] } },
    { id: 'commands', name: 'cordis:commands' },
    { id: 'approval', name: 'cordis:approval', config: { policy: 'ask' } },
    { id: 'goal', name: 'cordis:goals' },
    { id: 'storage', name: 'cordis:storage' },
    { id: 'storage-json', name: 'cordis:storageJson', config: { root: join(home, 'storages') } },
    { id: 'storage-domain', name: 'cordis:storageDomain', config: { backend: 'json' } },
    { id: 'session-query', name: 'cordis:sessionQuery', config: { path: ':memory:', openAt: 'never' } },
  ])
  // The shipped rows keep their ids; each name serves that row's package source through a Loader builtin.
  const focusConfig = { approvalTools: ['send_*'] }
  await bundle(home, manifest.name, rows.map(row => ({
    id: row.id,
    name: `cordis:${row.id}`,
    ...row.id === 'optional-focus' ? { config: focusConfig } : {},
    ...row.id === 'optional-tool-memory' && Object.keys(toolMemoryConfig).length > 0 ? { config: toolMemoryConfig } : {},
  })))
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
      sessions: Sessions, projections: Projections, llm: Llm, prompt: SystemPrompt, tools: Tools, executor: NativeToolExecutor,
      agents: Agents, loop: AgentLoop, commands: Commands, approval: Approval, goals: Goals,
      storage: Storage, storageJson: StorageJson, storageDomain: StorageDomain, sessionQuery: SessionQuerySqlite,
      ...Object.fromEntries(rows.map(row => [row.id, MODULES[row.name]])),
    })
  })
  for (const row of rows) {
    expect([...ctx.loader.entries()].filter(entry => entry.options.id === row.id && entry.fiber !== undefined)).toHaveLength(1)
  }

  return { ctx, home, workspace }
}

it('publishes one default-off layer whose rows are its only runtime dependencies', () => {
  expect(manifest.tomato.bundle).toEqual({ patch: './cordis.patch.yml', listedByDefault: true })
  expect(rows).toEqual([
    { id: 'optional-memory', name: '@tomato/experimental-memory' },
    { id: 'optional-tool-memory', name: '@tomato/experimental-tool-memory' },
    { id: 'optional-focus', name: '@tomato/experimental-focus' },
    { id: 'optional-muse-insights', name: '@tomato/experimental-muse-insights' },
  ])
  expect(Object.keys(manifest.dependencies).sort())
    .toEqual([
      '@tomato/experimental-focus',
      '@tomato/experimental-memory',
      '@tomato/experimental-muse-insights',
      '@tomato/experimental-tool-memory',
    ])
})

it('remembers a quoted preference in its workspace and a profile fact everywhere, and keeps a goal round from repeating a failed call', async () => {
  const { ctx, home, workspace } = await bootBundle()
  // Session 1: the person states a workspace preference and a fact about themselves; the model saves both with their words.
  const quote = '以后给达人写邮件都用简短直接的语气，不要用 emoji'
  const aboutMe = '我是品牌经理，回复都用中文'
  const first = new Model([
    call('write-1', 'memory_write', {
      scope: 'workspace', kind: 'preference', entity: 'user', key: 'email-tone', value: '邮件简短直接，不用 emoji', user_quote: quote, pinned: true,
    }),
    call('write-2', 'memory_write', { scope: 'profile', kind: 'fact', entity: 'user', key: 'role', value: '品牌经理，回复用中文', user_quote: aboutMe }),
    text('记住了。'),
  ])
  ctx.llm.registerAdapter(['first'], first)
  const one = await ctx.agentLoop.create(SessionId('muse-one'), { provider: 'first', model: 'm' }, { cwd: workspace })
  one.followup(createUserMessage({ content: [{ type: 'text', text: `你好。${quote}。${aboutMe}。` }], source: { kind: 'user' } }))
  await one.whenIdle()
  expect(requestText(first.requests[1])).toMatch(/Saved memory-[0-9a-f-]+\./u)
  expect(requestText(first.requests[2])).toMatch(/Saved memory-[0-9a-f-]+\./u)
  const view = { owner: Memory.LOCAL_MEMORY_OWNER, workspace }
  const saved = ctx.memory.list(view).find(record => record.key === 'email-tone')
  const aboutRecord = ctx.memory.list(view).find(record => record.key === 'role')
  expect(saved).toMatchObject({ status: 'active', pinned: true, value: '邮件简短直接，不用 emoji', source: { sessionId: one.session.id } })
  expect(aboutRecord).toMatchObject({ scope: { kind: 'profile' }, status: 'active', pinned: false, value: '品牌经理，回复用中文' })

  // Session 2 in the same workspace: the first request carries the profile and the pinned memory as logged context.
  const second = new Model([text('好的，按简短直接的语气写。')])
  ctx.llm.registerAdapter(['second'], second)
  const two = await ctx.agentLoop.create(SessionId('muse-two'), { provider: 'second', model: 'm' }, { cwd: workspace })
  two.followup(createUserMessage({ content: [{ type: 'text', text: '帮我给 @creator 写一封合作邮件' }], source: { kind: 'user' } }))
  await two.whenIdle()
  const [snapshot] = sourceTexts(two.session, 'experimental-memory')
  expect(snapshot).toContain(`- ${aboutRecord?.id} [fact, profile] user / role: 品牌经理，回复用中文`)
  expect(snapshot).toContain(`- ${saved?.id} [preference, pinned] user / email-tone: 邮件简短直接，不用 emoji`)
  expect(requestText(second.requests[0])).toContain('邮件简短直接，不用 emoji')

  // Another workspace sees the profile but not the first workspace's memory.
  const elsewhere = await realpath(await mkdtemp(join(home, 'elsewhere-')))
  const third = new Model([text('ok')])
  ctx.llm.registerAdapter(['third'], third)
  const three = await ctx.agentLoop.create(SessionId('muse-three'), { provider: 'third', model: 'm' }, { cwd: elsewhere })
  three.followup(createUserMessage({ content: [{ type: 'text', text: 'hello there' }], source: { kind: 'user' } }))
  await three.whenIdle()
  const [elsewhereSnapshot] = sourceTexts(three.session, 'experimental-memory')
  expect(elsewhereSnapshot).toContain('品牌经理，回复用中文')
  expect(requestText(third.requests[0])).toContain('品牌经理，回复用中文')
  expect(requestText(third.requests[0])).not.toContain('邮件简短直接')

  // A goal round: the same failing call twice draws a reminder, the next round carries the ledger, and send_* asks first.
  ctx.tools.register(defineTool({
    name: 'search_creators',
    description: 'test search that hits a quota',
    parameters: { query: { type: 'string', required: true } },
    output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] },
    execute: () => Promise.reject(new Error('quota exceeded')),
  }))
  const asked: string[] = []
  ctx.on('approval/request', (request) => {
    asked.push(request.toolName)
    return Promise.resolve('rejected' as const)
  })
  ctx.tools.register(defineTool({
    name: 'send_email',
    description: 'test send with an external effect',
    parameters: {},
    output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] },
    execute: () => Promise.resolve('sent'),
  }))
  const goalModel = new Model([
    call('search-1', 'search_creators', { query: 'beauty' }),
    call('search-2', 'search_creators', { query: 'beauty' }),
    call('send-1', 'send_email', {}),
    text('round one done'),
    text('round two done'),
  ])
  ctx.llm.registerAdapter(['goal'], goalModel)
  const goalAgent = await ctx.agentLoop.create(SessionId('muse-goal'), { provider: 'goal', model: 'm' }, { cwd: workspace })
  const goal = ctx.goals.create(goalAgent, { objective: 'find creators', maxGoalRounds: 5 })
  for (const round of [1, 2]) {
    goalAgent.followup(createUserMessage({
      content: [{ type: 'text', text: `<goal_round>Round: ${round}</goal_round>` }],
      source: { kind: 'goal', goalId: GoalId(goal.id), revision: goal.revision, round },
    }))
    await goalAgent.whenIdle()
  }
  expect(requestText(goalModel.requests[2])).toContain('The search_creators call has now failed 2 times in a row')
  expect(asked).toEqual(['send_email'])
  expect(requestText(goalModel.requests[3])).toContain('the user rejected tool \\"send_email\\"')
  const [ledger] = sourceTexts(goalAgent.session, 'experimental-focus').filter(entry => entry.startsWith('Failures so far'))
  expect(ledger).toContain('- search_creators failed 2× (error, latest in round 1): quota exceeded')
  expect(requestText(goalModel.requests[4])).toContain('Failures so far in this goal')
}, 30_000)
it('captures a finished turn as a candidate through the shipped rows', async () => {
  const { ctx, workspace } = await bootBundle({ capture: true })
  const model = new Model([
    text('记住了。'),
    text(JSON.stringify([{
      scope: 'workspace', kind: 'preference', entity: 'user', key: 'reply-style', value: '简短直接，不用 emoji', quote: '以后回复都简短直接',
    }])),
  ])
  ctx.llm.registerAdapter(['capture'], model)
  const agent = await ctx.agentLoop.create(SessionId('muse-capture'), { provider: 'capture', model: 'm' }, { cwd: workspace })
  agent.followup(createUserMessage({ content: [{ type: 'text', text: '以后回复都简短直接，不要用 emoji' }], source: { kind: 'user' } }))
  await agent.whenIdle()
  const view = { owner: Memory.LOCAL_MEMORY_OWNER, workspace }
  await vi.waitFor(() => {
    expect(ctx.memory.list(view).some(record => record.key === 'reply-style')).toBe(true)
  }, { timeout: 5000 })
  const captured = ctx.memory.list(view).find(record => record.key === 'reply-style')
  expect(captured).toMatchObject({
    status: 'candidate', entity: 'user', value: '简短直接，不用 emoji', source: { sessionId: agent.session.id },
  })
  const records = agent.session.snapshotEvents().flatMap((event) => {
    const record = pluginRecordOf(event)
    return record?.type === 'plugin:tool-memory/turn-capture' ? [record.data] : []
  })
  expect(records.at(-1)).toMatchObject({ route: { provider: 'capture', model: 'm' }, outcome: { status: 'stored' } })

  // A later Session receives no snapshot for an unconfirmed candidate.
  const later = new Model([text('ok')])
  ctx.llm.registerAdapter(['after'], later)
  const next = await ctx.agentLoop.create(SessionId('muse-after-capture'), { provider: 'after', model: 'm' }, { cwd: workspace })
  next.followup(createUserMessage({ content: [{ type: 'text', text: 'hello' }], source: { kind: 'user' } }))
  await next.whenIdle()
  expect(sourceTexts(next.session, 'experimental-memory')).toEqual([])
  expect(requestText(later.requests[0])).not.toContain('简短直接，不用 emoji')
}, 30_000)
