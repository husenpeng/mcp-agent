// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { brandString } from '@tomato/branded'
import { createSnapshotStore } from '@tomato/client-store'
import { allowAllAccess, bindSnapshotSelector, makeTranslate, SlotTestRuntime } from '@tomato/client-test-runtime'
import { zh as commonZh } from '@tomato/client-locale/src/locales/zh.ts'
import type { Robot, RobotId, RobotRunsSnapshot, RobotSpecRevision, RobotTemplate, RobotTemplateId, Run } from '@tomato/api-robot-controller/client'
import { RemoteError, type RemoteResult } from '@tomato/typert-protocol'
import type { SessionProviderComponent } from '@tomato/client-ui-slots'
import type { RobotSpecId } from '@tomato/experimental-robot/types'
import type { SessionId } from '@tomato/session/types'
import { RobotPage, type RobotPageProps } from '../src/client/RobotPage.tsx'
import { emptyRobotSpec } from '../src/client/spec.ts'
import type { RunId } from '@tomato/experimental-robot/types'
import { createRobotPageStore } from '../src/client/store.ts'
import { templateTextFor } from '../src/client/template-text.ts'
import { zh } from '../src/client/locales.ts'

afterEach(cleanup)

const t = makeTranslate({ ...commonZh, ...zh }) as RobotPageProps['t']

const TEMPLATE: RobotTemplate = {
  id: brandString<RobotTemplateId>('youtube-data-insight'),
  category: 'youtube',
  text: {
    en: { category: 'YouTube', name: 'YouTube insight', description: 'Channels', mission: 'm', successCriteria: [], acceptance: [] },
    zh: { category: 'YouTube', name: 'YouTube 数据洞察师', description: '频道分析', mission: 'm', successCriteria: [], acceptance: [] },
  },
  spec: { ...emptyRobotSpec(), io: { input: emptyRobotSpec().io.input, output: emptyRobotSpec().io.output } },
}

const HIRED: Robot = {
  id: brandString<RobotId>('hired'), name: 'YouTube 数据洞察师', state: 'idle', createdAt: 0,
  spec: { spec: brandString<RobotSpecId>('spec-hired'), revision: 1 },
}

type Hire = RobotPageProps['registryActions']['hire']

const unused = (): never => { throw new Error('robot page fixture does not provide this action') }

/** Fixture overrides for one page mount. */
interface MountOptions {
  readonly defaultWorkspaceRoot?: string
  readonly retainSession?: RobotPageProps['registryActions']['retainSession']
  readonly SessionProvider?: SessionProviderComponent
  readonly actions?: Partial<RobotPageProps['registryActions']>
  readonly referencesFail?: boolean
}

function mount(snapshot: RobotRunsSnapshot, hire: Hire, options: MountOptions = {}) {
  const { defaultWorkspaceRoot, retainSession = unused, SessionProvider, actions: overrides = {}, referencesFail = false } = options
  const page = createRobotPageStore().create()
  const registry = createSnapshotStore(snapshot, { flush: 'sync' })
  const unusedStandardHook = (): never => { throw new Error('robot page fixture does not provide global state') }
  const props: RobotPageProps = {
    usePanelInfo: unusedStandardHook,
    useWorkspaces: unusedStandardHook,
    useSessions: unusedStandardHook,
    useSessionStatus: unusedStandardHook,
    useSessionRetainInfo: unusedStandardHook,
    useResource: unusedStandardHook,
    ...allowAllAccess,
    t,
    useRobotPage: bindSnapshotSelector(page),
    useStore: bindSnapshotSelector(page),
    useRegistry: bindSnapshotSelector(registry),
    actions: page.actions,
    registryActions: {
      publish: unused, instantiate: unused, rebind: unused, start: unused, cancel: unused, interrupt: unused,
      correct: unused, retainSession, hire, ...overrides,
    },
    createWithConversation: vi.fn(),
    references: () => referencesFail ? Promise.reject(new Error('catalog unavailable')) : Promise.resolve({
      presets: [],
      capabilities: { skills: [], tools: [], mcpServers: [], workspaceRoots: [] },
      ...(defaultWorkspaceRoot === undefined ? {} : { defaultWorkspaceRoot }),
    }),
    locale: () => 'zh',
    templateText: template => templateTextFor(template, 'zh'),
    listDirectory: async (path?: string) => ({
      path: path ?? '/home/me',
      home: '/home/me',
      crumbs: [{ name: 'me', path: path ?? '/home/me', hidden: false }],
      entries: [],
      truncated: false,
    }),
    pickDirectory: async () => null,
    renderSlot: () => null,
    ...(SessionProvider === undefined ? {} : { SessionProvider }),
  }
  const view = render(<RobotPage {...props} />)
  const rerender = (): void => { view.rerender(<RobotPage {...props} />) }
  return { page, registry, rerender }
}

describe('robot page', () => {
  it('opens on the gallery and opens the robot a hire creates', async () => {
    const hire = vi.fn<Hire>(() => Promise.resolve({ ok: true, value: HIRED }))
    const { page, registry, rerender } = mount({ specs: [], robots: [], runs: [], templates: [TEMPLATE] }, hire)
    screen.getByRole('region', { name: '招聘市场' })
    fireEvent.click(screen.getByRole('button', { name: '聘用 YouTube 数据洞察师' }))
    await waitFor(() => { expect(page.getSnapshot().robotId).toBe(HIRED.id) })
    expect(hire).toHaveBeenCalledWith({ templateId: TEMPLATE.id, locale: 'zh' })
    expect(page.getSnapshot().view).toBe('roster')
    registry.set({ specs: [], robots: [HIRED], runs: [], templates: [TEMPLATE] })
    rerender()
    await waitFor(() => { expect(screen.queryByRole('region', { name: '招聘市场' })).toBeNull() })
    screen.getByRole('button', { name: '返回列表' })
  })

  it('hires a template into the Workspace the page is viewing', async () => {
    const hire = vi.fn<Hire>(() => Promise.resolve({ ok: true, value: HIRED }))
    mount({ specs: [], robots: [], runs: [], templates: [TEMPLATE] }, hire, { defaultWorkspaceRoot: '/projects/hire' })
    // The page reads its reference data after mount; a hire needs that value.
    await act(async () => { await Promise.resolve() })
    fireEvent.click(screen.getByRole('button', { name: '聘用 YouTube 数据洞察师' }))
    await waitFor(() => { expect(hire).toHaveBeenCalledWith({ templateId: TEMPLATE.id, locale: 'zh', workspaceRoot: '/projects/hire' }) })
  })

  it('reports a failed hire under the gallery', async () => {
    const failure: RemoteResult<Robot> = {
      ok: false,
      error: new RemoteError('robot/conflict', 'name taken', { message: 'name taken' }),
    }
    mount({ specs: [], robots: [], runs: [], templates: [TEMPLATE] }, () => Promise.resolve(failure))
    fireEvent.click(screen.getByRole('button', { name: '聘用 YouTube 数据洞察师' }))
    expect((await screen.findByRole('alert')).textContent).toBe('聘用失败: name taken')
  })

  it('lists runs with business state labels and opens the selected run as a task', () => {
    const run: Run = {
      id: brandString<RunId>('run-waiting'), robot: HIRED.id,
      spec: { spec: HIRED.spec.spec, revision: 1 }, state: 'waiting',
      input: { message: '整理竞品报告' }, startedAt: 0,
    }
    const { page, rerender } = mount({ specs: [], robots: [HIRED], runs: [run], templates: [] }, unused)
    page.actions.selectRobot(HIRED.id)
    page.actions.openRun(run.id)
    rerender()
    // The row keeps its state label; the detail strip repeats it for the selected run.
    expect(screen.getAllByText('已暂停')).toHaveLength(2)
    expect(screen.getAllByText('整理竞品报告')).toHaveLength(2)
    expect(screen.getByRole('region', { name: '运行详情' })).toBeDefined()
    // A run that never created a Session waits for the robot instead of claiming a load failure.
    expect(screen.getByText('等待机器人开始执行…')).toBeDefined()
    expect(screen.getAllByText('当前运行还没结束，先打断并继续，或结束它。').length).toBeGreaterThan(0)
  })

  it('labels every run state and marks the live ones', () => {
    const states: readonly Run['state'][] = ['queued', 'leased', 'running', 'waiting', 'finalizing', 'succeeded', 'failed', 'timed_out']
    const runs = states.map((state): Run => ({
      id: brandString<RunId>(`run-${state}`),
      robot: HIRED.id,
      spec: { spec: HIRED.spec.spec, revision: 1 },
      state,
      input: { message: `任务 ${state}` },
      startedAt: 0,
    }))
    const { page, rerender } = mount({ specs: [], robots: [HIRED], runs, templates: [] }, unused)
    page.actions.selectRobot(HIRED.id)
    rerender()
    for (const label of ['排队中', '已认领', '执行中', '已暂停', '收尾中', '已完成', '失败', '超时']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
    expect(screen.getAllByText('当前运行还没结束，先打断并继续，或结束它。').length).toBeGreaterThan(0)
  })

  it('starts a run from the conversation composer and opens it', async () => {
    const started: Run = {
      id: brandString<RunId>('run-new'), robot: HIRED.id,
      spec: { spec: HIRED.spec.spec, revision: 1 }, state: 'running',
      input: { message: '看下这周的声量' }, startedAt: Date.now(),
    }
    const start = vi.fn<RobotPageProps['registryActions']['start']>(() => Promise.resolve({ ok: true, value: started }))
    const { page, registry, rerender } = mount(
      { specs: [], robots: [HIRED], runs: [], templates: [] },
      unused,
      { actions: { start } },
    )
    page.actions.selectRobot(HIRED.id)
    rerender()
    fireEvent.change(screen.getByRole('textbox', { name: '本次运行的指令' }), { target: { value: '看下这周的声量' } })
    fireEvent.click(screen.getByRole('button', { name: '运行' }))
    await waitFor(() => { expect(start).toHaveBeenCalledWith({ robotId: HIRED.id, message: '看下这周的声量' }) })
    await waitFor(() => { expect(page.getSnapshot().runId).toBe(started.id) })
    registry.set({ specs: [], robots: [HIRED], runs: [started], templates: [] })
    rerender()
    expect(screen.getAllByText('执行中').length).toBeGreaterThan(0)
  })

  it('reports a failed start instead of opening a run', async () => {
    const start = vi.fn<RobotPageProps['registryActions']['start']>(() => Promise.resolve({
      ok: false,
      error: new RemoteError('robot/conflict', 'already running', { message: 'already running' }),
    }))
    const { page, rerender } = mount(
      { specs: [], robots: [HIRED], runs: [], templates: [] },
      unused,
      { actions: { start } },
    )
    page.actions.selectRobot(HIRED.id)
    rerender()
    fireEvent.change(screen.getByRole('textbox', { name: '本次运行的指令' }), { target: { value: '看下声量' } })
    fireEvent.click(screen.getByRole('button', { name: '运行' }))
    await waitFor(() => { expect(screen.getByRole('alert').textContent).toBe('already running') })
    expect(page.getSnapshot().runId).toBeUndefined()
  })

  it('drives interrupt, stop, and correction from the live conversation', async () => {
    const live: Run = {
      id: brandString<RunId>('run-live'), robot: HIRED.id,
      spec: { spec: HIRED.spec.spec, revision: 1 }, state: 'waiting',
      input: { message: '整理竞品报告' }, startedAt: 0,
    }
    const denied = (): Promise<RemoteResult<void>> => Promise.resolve({
      ok: false,
      error: new RemoteError('robot/not-found', 'run already settled', { id: 'run-live' }),
    })
    const interrupt = vi.fn<RobotPageProps['registryActions']['interrupt']>(denied)
    const cancel = vi.fn<RobotPageProps['registryActions']['cancel']>(denied)
    const correct = vi.fn<RobotPageProps['registryActions']['correct']>(denied)
    const { page, rerender } = mount(
      { specs: [], robots: [HIRED], runs: [live], templates: [] },
      unused,
      { actions: { interrupt, cancel, correct } },
    )
    page.actions.selectRobot(HIRED.id)
    page.actions.openRun(live.id)
    rerender()
    fireEvent.click(screen.getByRole('button', { name: '打断' }))
    fireEvent.click(screen.getByRole('button', { name: '结束运行' }))
    fireEvent.change(screen.getByRole('textbox', { name: '补充或纠正指令' }), { target: { value: '先看美国' } })
    fireEvent.click(screen.getByRole('button', { name: '继续' }))
    await waitFor(() => { expect(interrupt).toHaveBeenCalledWith({ runId: live.id }) })
    expect(cancel).toHaveBeenCalledWith({ runId: live.id })
    expect(correct).toHaveBeenCalledWith({ runId: live.id, message: '先看美国' })
    // A refused control keeps the conversation and reports why under the rail.
    expect((await screen.findByRole('alert')).textContent).toBe('run already settled')
  })

  it('returns to the roster and opens the editor from the rail', () => {
    const { page, rerender } = mount({ specs: [], robots: [HIRED], runs: [], templates: [] }, unused)
    page.actions.selectRobot(HIRED.id)
    rerender()
    fireEvent.click(screen.getByRole('button', { name: '返回列表' }))
    rerender()
    expect(page.getSnapshot().robotId).toBeUndefined()
    page.actions.selectRobot(HIRED.id)
    rerender()
    fireEvent.click(screen.getByRole('button', { name: '编辑配置' }))
    rerender()
    expect(page.getSnapshot().view).toBe('config')
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    rerender()
    expect(page.getSnapshot().view).toBe('roster')
  })

  it('opens a robot and the guided creation flow from the gallery', () => {
    const { page, rerender } = mount({ specs: [], robots: [HIRED], runs: [], templates: [] }, unused)
    fireEvent.click(screen.getByRole('region', { name: '我的机器人' }).querySelector('button')!)
    rerender()
    expect(page.getSnapshot().robotId).toBe(HIRED.id)
    fireEvent.click(screen.getByRole('button', { name: '返回列表' }))
    rerender()
    fireEvent.click(screen.getByRole('button', { name: '创建机器人' }))
    rerender()
    expect(page.getSnapshot().view).toBe('create')
    screen.getByRole('heading', { name: '创建机器人' })
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    rerender()
    expect(page.getSnapshot().view).toBe('roster')
    expect(page.getSnapshot().robotId).toBeUndefined()
  })

  it('creates a robot from the guided flow and opens its page', async () => {
    const mission = '每天检查竞品账号有没有更新，出现爆款就把链接和数据发给我'
    const revision: RobotSpecRevision = {
      ref: { spec: brandString<RobotSpecId>('spec-created'), revision: 1 },
      spec: emptyRobotSpec({ name: '竞品侦察兵', mission }),
      publishedAt: 0,
    }
    const created: Robot = {
      id: brandString<RobotId>('created'), name: '竞品侦察兵', state: 'idle', createdAt: 0, spec: revision.ref,
    }
    const publish = vi.fn<RobotPageProps['registryActions']['publish']>(() => Promise.resolve({ ok: true, value: revision }))
    const instantiate = vi.fn<RobotPageProps['registryActions']['instantiate']>(() => Promise.resolve({ ok: true, value: created }))
    const { page, rerender } = mount(
      { specs: [], robots: [HIRED], runs: [], templates: [] },
      unused,
      { actions: { publish, instantiate } },
    )
    fireEvent.click(screen.getByRole('button', { name: '创建机器人' }))
    rerender()
    fireEvent.change(screen.getByLabelText('这个机器人每次运行要替你做什么？'), { target: { value: mission } })
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    fireEvent.change(screen.getByLabelText('名称'), { target: { value: '竞品侦察兵' } })
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    fireEvent.click(screen.getByRole('button', { name: '创建机器人' }))
    await waitFor(() => { expect(publish).toHaveBeenCalledOnce() })
    expect(publish.mock.calls[0]![0].spec).toMatchObject({
      name: '竞品侦察兵',
      goal: { mission, successCriteria: [] },
    })
    await waitFor(() => { expect(instantiate).toHaveBeenCalledWith({ ref: revision.ref }) })
    await waitFor(() => { expect(page.getSnapshot().robotId).toBe(created.id) })
    // The rail opens the new robot before the registry stream delivers its frame.
    screen.getByRole('heading', { name: '竞品侦察兵' })
  })

  it('reports a rejected creation and keeps the flow open', async () => {
    const publish = vi.fn<RobotPageProps['registryActions']['publish']>(() => Promise.resolve({
      ok: false,
      error: new RemoteError('robot/spec-invalid', 'name must be unique', {
        issues: [{ path: 'name', message: 'must be unique' }],
      }),
    }))
    const { page, rerender } = mount(
      { specs: [], robots: [HIRED], runs: [], templates: [] },
      unused,
      { actions: { publish } },
    )
    fireEvent.click(screen.getByRole('button', { name: '创建机器人' }))
    rerender()
    fireEvent.change(screen.getByLabelText('这个机器人每次运行要替你做什么？'), { target: { value: '盯住竞品更新' } })
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    fireEvent.change(screen.getByLabelText('名称'), { target: { value: '竞品侦察兵' } })
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    fireEvent.click(screen.getByRole('button', { name: '创建机器人' }))
    expect((await screen.findByRole('alert')).textContent).toBe('name must be unique')
    expect(page.getSnapshot().view).toBe('create')
  })

  it('keeps the page usable when reference lists fail to load', async () => {
    mount({ specs: [], robots: [HIRED], runs: [], templates: [] }, unused, { referencesFail: true })
    await act(async () => { await Promise.resolve() })
    expect(screen.getByLabelText('搜索机器人名称或描述')).toBeDefined()
  })

  it('opens the run a row names', () => {
    const run: Run = {
      id: brandString<RunId>('run-row'), robot: HIRED.id,
      spec: { spec: HIRED.spec.spec, revision: 1 }, state: 'succeeded',
      input: { message: '整理竞品报告' }, startedAt: 0, endedAt: 1_000,
    }
    const { page, rerender } = mount({ specs: [], robots: [HIRED], runs: [run], templates: [] }, unused)
    page.actions.selectRobot(HIRED.id)
    rerender()
    fireEvent.click(screen.getByRole('button', { name: /整理竞品报告/ }))
    expect(page.getSnapshot().runId).toBe(run.id)
  })

  it('keeps the run readable when the Client no longer holds its Session', async () => {
    const run: Run = {
      id: brandString<RunId>('run-gone'), robot: HIRED.id,
      spec: { spec: HIRED.spec.spec, revision: 1 }, state: 'succeeded',
      input: { message: '整理竞品报告' }, output: '报告已生成', startedAt: 0,
      sessionId: brandString<SessionId>('robot-run-gone'),
    }
    const retainSession = vi.fn<RobotPageProps['registryActions']['retainSession']>(() => Promise.resolve(undefined))
    const { page, rerender } = mount({ specs: [], robots: [HIRED], runs: [run], templates: [] }, unused, { retainSession })
    page.actions.selectRobot(HIRED.id)
    page.actions.openRun(run.id)
    expect(() => { rerender() }).not.toThrow()
    await act(async () => { await Promise.resolve() })
    expect(retainSession).toHaveBeenCalledWith(run.sessionId)
    screen.getByText('报告已生成')
    screen.getByText(/这次运行的会话记录已不在当前列表中/)
  })

  it('retains afresh when another selection released the same run Session', async () => {
    const runtime = await SlotTestRuntime.create()
    try {
      const sessionId = await runtime.sessions.add({ id: 'robot-run-reselect', summary: { title: '竞品报告' } })
      const other: Robot = {
        id: brandString<RobotId>('other'), name: '另一个机器人', state: 'idle', createdAt: 0,
        spec: { spec: brandString<RobotSpecId>('spec-other'), revision: 1 },
      }
      const run: Run = {
        id: brandString<RunId>('run-reselect'), robot: HIRED.id,
        spec: { spec: HIRED.spec.spec, revision: 1 }, state: 'succeeded',
        input: { message: '整理竞品报告' }, startedAt: 0, sessionId,
      }
      // Production SessionProvider rejects a reference whose last owner released it.
      const renderedSessions: SessionId[] = []
      const SessionProvider: SessionProviderComponent = ({ session, children }) => {
        if (session !== undefined) {
          if (runtime.sessions.retainInfo(session.sessionId).getSnapshot().referenceCount === 0) {
            throw new Error(`Session reference "${session.sessionId}" is released`)
          }
          renderedSessions.push(session.sessionId)
        }
        return <>{children}</>
      }
      const retainSession = vi.fn<RobotPageProps['registryActions']['retainSession']>(
        () => Promise.resolve(runtime.sessions.retain(sessionId)),
      )
      const { page, rerender } = mount(
        { specs: [], robots: [HIRED, other], runs: [run], templates: [] },
        unused,
        { retainSession, SessionProvider },
      )
      page.actions.selectRobot(HIRED.id)
      page.actions.openRun(run.id)
      await act(async () => { await Promise.resolve() })
      expect(renderedSessions).toEqual([sessionId])
      // Selecting another robot clears the run and releases its reference.
      page.actions.selectRobot(other.id)
      rerender()
      await act(async () => { await Promise.resolve() })
      expect(runtime.sessions.retainInfo(sessionId).getSnapshot().referenceCount).toBe(0)
      // The same run retained again must render a new, live reference.
      page.actions.selectRobot(HIRED.id)
      page.actions.openRun(run.id)
      expect(() => { rerender() }).not.toThrow()
      await act(async () => { await Promise.resolve() })
      expect(retainSession).toHaveBeenCalledTimes(2)
      expect(renderedSessions).toEqual([sessionId, sessionId])
    } finally {
      await runtime.dispose()
    }
  })

  it('returns from a robot to the gallery and keeps the search state in the store', () => {
    const { page, rerender } = mount({ specs: [], robots: [HIRED], runs: [], templates: [] }, unused)
    fireEvent.change(screen.getByLabelText('搜索机器人名称或描述'), { target: { value: 'You' } })
    fireEvent.click(screen.getByRole('button', { name: '空闲' }))
    expect(page.getSnapshot()).toMatchObject({ query: 'You', filter: 'idle' })
    page.actions.selectRobot(HIRED.id)
    rerender()
    fireEvent.click(screen.getByRole('button', { name: '返回列表' }))
    expect(page.getSnapshot()).toMatchObject({ robotId: undefined, query: 'You', filter: 'idle' })
  })
})
