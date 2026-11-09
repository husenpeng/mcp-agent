import { describe, expect, it } from 'vitest'
import type { CrewEntry, CrewSpec, CrewSpecRevision, CrewRun } from '@tomato/experimental-robot-crew'
import { chatLines, developmentCrew, groupChats, uniqueGroupName } from '../src/client/chat.ts'

const spec: CrewSpec = developmentCrew({
  name: '开发协作群',
  mission: '改码与审核',
  prompt: '这次要改什么？',
  labels: { kickoff: '主 agent（立项）', build: '开发', verify: '测试', audit: '审核', dispatch: '主 agent（派活）' },
})

const entry = (seq: number, kind: CrewEntry['kind'], extra: Partial<CrewEntry> = {}): CrewEntry => ({
  run: 'run-1' as CrewEntry['run'],
  seq,
  kind,
  at: seq * 1000,
  ...extra,
})

describe('group chat transcript', () => {
  it('renders each ledger line with the member labels the spec carries', () => {
    const lines = chatLines([
      entry(1, 'run-start', { text: '改一下登录页' }),
      entry(3, 'step-start', { node: 'build' }),
      entry(4, 'step-result', { node: 'build', text: '改完了' }),
      entry(5, 'a2a-request', { node: 'verify', text: '跑测试', data: { from: 'build', to: 'verify' } }),
      entry(6, 'a2a-reply', { node: 'verify', text: '通过', data: { to: 'build' } }),
      entry(7, 'handoff', { node: 'build', text: '摘要', data: { from: 'build', to: 'dispatch' } }),
      entry(8, 'guard', { text: 'refused' }),
      entry(9, 'run-end', { text: 'done' }),
    ], spec)

    expect(lines.map(line => [line.kind, line.from, line.to])).toEqual([
      ['start', undefined, undefined],
      ['working', '开发', undefined],
      ['report', '开发', undefined],
      ['a2a', '开发', '测试'],
      ['report', '测试', '开发'],
      ['handoff', '开发', '主 agent（派活）'],
      ['guard', undefined, undefined],
      ['end', undefined, undefined],
    ])
    expect(lines[2]?.text).toBe('改完了')
  })

  it('shows what earlier runs carried into this one', () => {
    const lines = chatLines([
      entry(1, 'memory', {
        text: 'Carried task memory from earlier runs (decisions 1, constraints 2, open questions 0).',
        data: { carried: true, decisions: 1, constraints: 2, open: 0 },
      }),
      entry(2, 'memory', { text: 'Use pnpm', data: { memory: 'decision' } }),
    ], spec)

    expect(lines).toEqual([{
      seq: 1,
      kind: 'memory',
      at: 1000,
      text: 'Carried task memory from earlier runs (decisions 1, constraints 2, open questions 0).',
      counts: { decisions: 1, constraints: 2, open: 0 },
    }])
  })

  it('marks a failed step result as a guard line and keeps internal entries out of the transcript', () => {
    const lines = chatLines([
      entry(1, 'step-result', { node: 'build', text: 'boom', data: { failed: true } }),
      entry(2, 'memory', { node: 'build', text: 'DECISION: x' }),
      entry(3, 'drift', { node: 'build', text: 'a2a failed' }),
      entry(4, 'brief', { node: 'build', text: 'assembled prompt' }),
    ], spec)

    expect(lines).toEqual([{ seq: 1, kind: 'guard', at: 1000, text: 'boom', from: '开发' }])
  })

  it('falls back to the raw node id and omits unrecorded endpoints', () => {
    const lines = chatLines([
      entry(1, 'step-result', { node: 'stranger', text: 'hi' }),
      entry(2, 'a2a-request', { text: 'ask', data: { from: 'build' } }),
    ], spec)

    expect(lines[0]?.from).toBe('stranger')
    expect(lines[1]).toEqual({ seq: 2, kind: 'a2a', at: 2000, text: 'ask', from: '开发' })
  })
})

describe('group chat roster', () => {
  const revision = (specId: string, name: string, publishedAt: number): CrewSpecRevision => ({
    ref: { spec: specId as CrewSpecRevision['ref']['spec'], revision: 1 },
    spec: { ...spec, name },
    publishedAt,
  })
  const run = (specId: string, startedAt: number, state: CrewRun['state']): CrewRun => ({
    id: `run-${specId}` as CrewRun['id'],
    spec: { spec: specId as CrewRun['spec']['spec'], revision: 1 },
    name: specId,
    state,
    input: 'task',
    startedAt,
    nodes: [],
    tokens: 0,
    messages: 0,
    steps: 0,
  })

  it('orders chats by latest activity and keeps each chat to its own runs', () => {
    const chats = groupChats({
      specs: [revision('a', 'A', 1_000), revision('b', 'B', 5_000)],
      runs: [run('a', 2_000, 'succeeded'), run('b', 3_000, 'failed'), run('a', 9_000, 'running')],
    })

    expect(chats.map(chat => chat.name)).toEqual(['A', 'B'])
    expect(chats[0]?.members.map(member => member.label)).toEqual(['主 agent（立项）', '开发', '测试', '审核', '主 agent（派活）'])
    expect(chats[0]?.latestRun?.state).toBe('running')
    expect(chats[0]?.runs).toHaveLength(2)
    expect(chats[1]?.activityAt).toBe(3_000)
  })

  it('falls back to the publication time when a chat never ran', () => {
    const chats = groupChats({ specs: [revision('c', 'C', 7_000)], runs: [] })
    expect(chats[0]?.latestRun).toBeUndefined()
    expect(chats[0]?.activityAt).toBe(7_000)
  })
})

describe('group chat names', () => {
  it('keeps a free name and numbers a taken one', () => {
    expect(uniqueGroupName(['A'], 'B')).toBe('B')
    expect(uniqueGroupName(['B'], 'B')).toBe('B 2')
    expect(uniqueGroupName(['B', 'B 2'], 'B')).toBe('B 3')
    expect(uniqueGroupName(['B', 'B 2', 'B 3'], 'B')).toBe('B 4')
  })
})

describe('development template', () => {
  it('sends the lead agent first, three members second, and the dispatch last', () => {
    const ids = new Map(spec.nodes.map((node, index) => [index, node.id]))
    expect([...ids.values()]).toEqual(['kickoff', 'build', 'verify', 'audit', 'dispatch'])
    expect(spec.edges).toHaveLength(6)
    expect(spec.edges.filter(edge => edge.to === 'dispatch').map(edge => edge.from)).toEqual(['build', 'verify', 'audit'])
    expect(spec.workspaceRoot).toBeUndefined()
  })

  it('records the working directory when the deployment has one', () => {
    const crew = developmentCrew({
      name: 'n', mission: 'm', prompt: 'p', workspaceRoot: '/repo',
      labels: { kickoff: 'k', build: 'b', verify: 'v', audit: 'a', dispatch: 'd' },
    })
    expect(crew.workspaceRoot).toBe('/repo')
  })
})
