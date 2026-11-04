// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { makeTranslate } from '@tomato/client-test-runtime'
import { zh as commonZh } from '@tomato/client-locale/src/locales/zh.ts'
import type { Run } from '@tomato/api-robot-controller/client'
import type { ChatConversationViewNode } from '@tomato/client-ui-chat/client'
import { RunDetail, submitsCorrection, type RunDetailActions, type RunDetailProps } from '../src/client/RunDetail.tsx'
import { detailOf, shorten } from '../src/client/run-steps.ts'
import { zh } from '../src/client/locales.ts'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

const t = makeTranslate({ ...commonZh, ...zh })

type RunState = Run['state']

function run(state: RunState, extra: Partial<Run> = {}): Run {
  return {
    id: 'run-1' as Run['id'],
    robot: 'robot-1' as Run['robot'],
    spec: { spec: 'spec-1' as Run['spec']['spec'], revision: 1 },
    state,
    input: { message: '整理本周竞品报告' },
    startedAt: 0,
    ...extra,
  }
}

function actions(): RunDetailActions & { readonly calls: string[] } {
  const calls: string[] = []
  return {
    calls,
    interrupt: (target) => { calls.push(`interrupt:${String(target.id)}`) },
    correct: (target, message) => { calls.push(`correct:${String(target.id)}:${message}`) },
    stop: (target) => { calls.push(`stop:${String(target.id)}`) },
  }
}

function mount(overrides: Partial<RunDetailProps> = {}) {
  const handlers = actions()
  const props: RunDetailProps = {
    run: run('running'),
    openState: 'open',
    openError: undefined,
    steps: [],
    actions: handlers,
    t,
    ...overrides,
  }
  render(<RunDetail {...props} />)
  return handlers
}

describe('run detail', () => {
  it('shows the instruction, an empty progress notice, and the paused controls', () => {
    mount({ run: run('waiting') })
    expect(screen.getByText('这次要做什么')).toBeDefined()
    expect(screen.getByText('整理本周竞品报告')).toBeDefined()
    expect(screen.getByText('等待机器人开始执行…')).toBeDefined()
    expect(screen.getByText('已暂停')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: '打断' }))
    fireEvent.click(screen.getByRole('button', { name: '结束运行' }))
  })

  it('renders a settled run without live controls and shows its result', () => {
    mount({ run: run('succeeded', { output: '报告已生成', endedAt: 1 }) })
    expect(screen.queryByRole('button', { name: '打断' })).toBeNull()
    expect(screen.queryByRole('button', { name: '结束运行' })).toBeNull()
    expect(screen.getByText('报告已生成')).toBeDefined()
    expect(screen.getByLabelText('补充或纠正指令')).toBeDefined()
    expect(screen.getByRole('textbox').hasAttribute('disabled')).toBe(true)
  })

  it('shows the failure detail when a run produced no output', () => {
    mount({ run: run('failed', { error: 'the run Agent was not published' }) })
    expect(screen.getByText('the run Agent was not published')).toBeDefined()
    expect(screen.getByText('失败')).toBeDefined()
  })

  it('shows the no-result notice for a stopped run without output or error', () => {
    mount({ run: run('cancelled') })
    expect(screen.getByText('还没有结果。')).toBeDefined()
    expect(screen.getByText('已结束')).toBeDefined()
  })

  it('sends a correction for a running run with the send label', () => {
    const handlers = mount()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '只看近三个月' } })
    fireEvent.click(screen.getByRole('button', { name: '发送' }))
    expect(handlers.calls).toEqual(['correct:run-1:只看近三个月'])
  })

  it('continues a paused run from the same input', () => {
    const handlers = mount({ run: run('waiting') })
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '继续' } })
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })
    expect(handlers.calls).toEqual(['correct:run-1:继续'])
  })

  it('does not submit while the input method is composing', () => {
    expect(submitsCorrection({ key: 'Enter', nativeEvent: { isComposing: true } })).toBe(false)
    expect(submitsCorrection({ key: 'Enter', nativeEvent: {} })).toBe(true)
    expect(submitsCorrection({ key: 'Escape', nativeEvent: {} })).toBe(false)
    const handlers = mount()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '继续' } })
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' })
    expect(handlers.calls).toEqual([])
  })

  it('continues a paused run from an empty input with a visible message', () => {
    const handlers = mount({ run: run('waiting') })
    fireEvent.click(screen.getByRole('button', { name: '继续' }))
    expect(handlers.calls).toEqual(['correct:run-1:继续'])
  })

  it('keeps the input inert while the run is live but empty', () => {
    const handlers = mount()
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })
    fireEvent.click(screen.getByRole('button', { name: '发送' }))
    expect(handlers.calls).toEqual([])
  })

  it('lists inputs, answers, and business actions with the technical switch', () => {
    mount({
      steps: [
        { kind: 'input', key: 'k1', seq: 1, text: '整理本周竞品报告' },
        { kind: 'action', key: 'k2', seq: 2, tool: 'read', detail: 'reports/a.md', status: 'done', raw: '{"path":"reports/a.md"}' },
        { kind: 'action', key: 'k3', seq: 3, tool: 'unknown_tool', status: 'running' },
        { kind: 'action', key: 'k4', seq: 4, tool: 'bash', status: 'failed' },
        { kind: 'answer', key: 'k5', seq: 5, text: '报告写好了' },
      ],
    })
    expect(screen.getByText('读取文件')).toBeDefined()
    expect(screen.getByText('reports/a.md')).toBeDefined()
    expect(screen.getByText('执行了一个操作')).toBeDefined()
    expect(screen.getByText('进行中')).toBeDefined()
    expect(screen.getByText('运行命令')).toBeDefined()
    expect(screen.getByText('失败')).toBeDefined()
    expect(screen.getByText('机器人')).toBeDefined()
    expect(screen.queryByText('read {"path":"reports/a.md"}')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '技术详情' }))
    expect(screen.getByText('read {"path":"reports/a.md"}')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: '技术详情' }))
    expect(screen.queryByText('read {"path":"reports/a.md"}')).toBeNull()
    expect(localStorage.getItem('tomato.robot.run.technical')).toBe('0')
  })

  it('keeps the technical choice in memory when browser storage fails', async () => {
    const { readTechnicalDetail, writeTechnicalDetail } = await import('../src/client/technical-preference.ts')
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    expect(readTechnicalDetail()).toBe(false)
    getItem.mockRestore()
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied') })
    expect(() => { writeTechnicalDetail(true) }).not.toThrow()
    setItem.mockRestore()
  })

  it('starts with the stored technical choice', () => {
    localStorage.setItem('tomato.robot.run.technical', '1')
    mount({
      steps: [{ kind: 'action', key: 'k1', seq: 1, tool: 'read', status: 'done', raw: '{"path":"a.md"}' }],
    })
    expect(screen.getByText('read {"path":"a.md"}')).toBeDefined()
    expect(screen.getByRole('button', { name: '技术详情' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('reports a loading history and a history failure in the progress block', () => {
    mount({ openState: 'loading' })
    expect(screen.getByText('正在载入这次运行的过程…')).toBeDefined()
    cleanup()
    mount({ openState: 'error', openError: 'session "run-1" not found' })
    expect(screen.getByRole('alert').textContent).toBe('运行过程加载失败：session "run-1" not found')
    cleanup()
    mount({ openState: 'error' })
    expect(screen.getByRole('alert').textContent).toBe('运行过程加载失败：未知错误')
  })
})

function chatNode(kind: string, data: unknown, seq: number): ChatConversationViewNode {
  return {
    key: `k${String(seq)}`, kind, id: `k${String(seq)}`, target: 'chat', data, anchorSeq: seq,
    location: { kind: 'unresolved' }, visibility: 'visible',
  }
}

describe('run steps', () => {
  it('shortens long text and reads the object an action touched', () => {
    expect(shorten('短文本')).toBe('短文本')
    expect(shorten('x'.repeat(500))).toHaveLength(401)
    expect(detailOf('{"path":"a.md"}')).toBe('a.md')
    expect(detailOf('{"command":"ls"}')).toBe('ls')
    expect(detailOf('{"query":"q"}')).toBe('q')
    expect(detailOf('{"unknown":"x"}')).toBeUndefined()
    expect(detailOf('not json')).toBeUndefined()
    expect(detailOf('[]')).toBeUndefined()
    expect(detailOf('null')).toBeUndefined()
    expect(detailOf(undefined)).toBeUndefined()
    expect(detailOf(JSON.stringify({ path: 'x'.repeat(200) }))).toHaveLength(121)
  })

  it('keeps inputs, answers, running and settled actions, and skips other kinds', async () => {
    const { runSteps } = await import('../src/client/run-steps.ts')
    const chat = {
      order: ['k1', 'k2', 'k3', 'k4', 'k5'],
      nodes: {
        get: (key: string) => {
          switch (key) {
            case 'k1':
              return chatNode('user', { kind: 'user', seq: 1, time: 0, content: [{ type: 'text', text: '整理报告' }], source: null }, 1)
            case 'k2':
              return chatNode('tool-call', {
                root: { phase: 'start', argsRaw: '{"path":"a.md"}' },
              }, 2)
            case 'k3':
              return chatNode('tool-call', {
                root: {
                  kind: 'tool-result',
                  seq: 3,
                  time: 0,
                  callId: 'c1',
                  name: 'read',
                  args: {},
                  call: { name: 'read', argsRaw: '{"path":"b.md"}' },
                  callTime: 0,
                  content: [{ type: 'text', text: '内容' }],
                  isError: false,
                  subCalls: [],
                },
              }, 3)
            case 'k4':
              return chatNode('assistant-step', { blocks: [{ kind: 'text', text: '报告写好了' }, { kind: 'reasoning', text: '思考' }] }, 4)
            default:
              return chatNode('retry', {}, 5)
          }
        },
      },
    }
    const steps = runSteps(chat)
    expect(steps.map(step => step.kind)).toEqual(['input', 'action', 'action', 'answer'])
    expect(steps[1]).toMatchObject({ status: 'running', detail: 'a.md' })
    expect(steps[2]).toMatchObject({ status: 'done', detail: 'b.md', output: '内容' })
    expect(runSteps(undefined)).toEqual([])
  })

  it('ignores hidden nodes and empty text', async () => {
    const { runSteps } = await import('../src/client/run-steps.ts')
    const hidden = { ...chatNode('user', { content: [{ type: 'text', text: 'x' }] }, 1), visibility: 'hidden' as const }
    const empty = chatNode('user', { content: [] }, 2)
    const chat = {
      order: ['k1', 'k2', 'k3'],
      nodes: { get: (key: string) => key === 'k1' ? hidden : key === 'k2' ? empty : undefined },
    }
    expect(runSteps(chat)).toEqual([])
  })

  it('uses a generic phrase for an unknown tool and a known phrase otherwise', () => {
    const known = mount({
      steps: [{ kind: 'action', key: 'k1', seq: 1, tool: 'web_search', status: 'done' }],
    })
    expect(known.calls).toEqual([])
    expect(within(screen.getByRole('region', { name: '运行详情' })).getByText('联网查询')).toBeDefined()
  })

  it('renders a failed settled call without arguments, output, or a paired call head', async () => {
    const { runSteps } = await import('../src/client/run-steps.ts')
    const chat = {
      order: ['k1', 'k2'],
      nodes: {
        get: (key: string) => key === 'k1'
          ? chatNode('tool-call', {
            root: {
              kind: 'tool-result', seq: 1, time: 0, callId: 'c1', name: 'bash', args: {}, call: null,
              callTime: null, content: [], isError: true, subCalls: [],
            },
          }, 1)
          : chatNode('assistant-step', { blocks: [{ kind: 'reasoning', text: '思考中' }] }, 2),
      },
    }
    expect(runSteps(chat)).toEqual([
      { kind: 'action', key: 'k1', seq: 1, tool: 'bash', status: 'failed' },
    ])
  })

  it('leaves a preparing call without a detail or raw arguments', async () => {
    const { runSteps } = await import('../src/client/run-steps.ts')
    const chat = {
      order: ['k1'],
      nodes: {
        get: () => chatNode('tool-call', {
          root: { phase: 'preparing', name: 'read', time: 0, turn: 1, step: 1, callId: 'c1', subCalls: [], args: {} },
        }, 1),
      },
    }
    expect(runSteps(chat)).toEqual([{ kind: 'action', key: 'k1', seq: 1, tool: 'read', status: 'running' }])
  })

  it('keeps the model text of a message with images only', async () => {
    const { runSteps } = await import('../src/client/run-steps.ts')
    const chat = {
      order: ['k1'],
      nodes: { get: () => chatNode('steering', { content: [{ type: 'image', attachment: { id: 'a' } }] }, 1) },
    }
    expect(runSteps(chat)).toEqual([])
  })
})
