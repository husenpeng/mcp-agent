// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { makeTranslate } from '@tomato/client-test-runtime'
import { zh as commonZh } from '@tomato/client-locale/src/locales/zh.ts'
import { RobotConfigEditor } from '../src/client/RobotConfigEditor.tsx'
import { zh } from '../src/client/locales.ts'
import { emptyRobotSpec } from '../src/client/spec.ts'

afterEach(cleanup)

const t = makeTranslate({ ...commonZh, ...zh })

type EditorProps = Parameters<typeof RobotConfigEditor>[0]

function mount(
  issues?: EditorProps['issues'],
  capabilities?: EditorProps['capabilities'],
  defaultWorkspaceRoot?: string,
) {
  const onSubmit = vi.fn<EditorProps['onSubmit']>()
  render(
    <RobotConfigEditor
      t={t}
      issues={issues}
      {...capabilities === undefined ? {} : { capabilities }}
      {...defaultWorkspaceRoot === undefined ? {} : { defaultWorkspaceRoot }}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
    />,
  )
  return { onSubmit }
}

const CATALOG: NonNullable<EditorProps['capabilities']> = {
  skills: [
    { value: 'office-docx', label: 'office-docx', description: 'Create Word documents' },
    { value: 'instagram-creator-scout', label: 'instagram-creator-scout' },
  ],
  tools: [{ value: 'read', label: 'read' }, { value: 'bash', label: 'bash', description: 'Run a command' }],
  mcpServers: [{ value: 'github', label: 'github' }],
  workspaceRoots: [{ value: '/work/alpha', label: 'Alpha' }],
}

describe('robot configuration scope', () => {
  it('starts on the four-field basic form and hides every advanced block', () => {
    mount()
    const basic = screen.getByRole('tabpanel', { name: '基础配置' })
    for (const label of ['名称', '描述', '任务目标', '成功标准（每行一条）']) within(basic).getByText(label)
    expect(within(basic).queryByText('权限预设')).toBeNull()
    expect(within(basic).queryByText('允许的工具')).toBeNull()
    expect(screen.queryByRole('tabpanel', { name: '高级配置' })).toBeNull()
  })

  it('reveals the six advanced blocks on the advanced tab', () => {
    mount()
    fireEvent.click(screen.getByRole('tab', { name: '高级配置' }))
    const advanced = screen.getByRole('tabpanel', { name: '高级配置' })
    for (const heading of ['定位与权限', '目标与执行', '能力与限制', '输入与输出', '记忆', '代理间通信']) {
      within(advanced).getByText(heading)
    }
    within(advanced).getByText('权限预设')
    expect(screen.queryByRole('tabpanel', { name: '基础配置' })).toBeNull()
  })

  it('switches to the advanced tab when a rejected field lives there', () => {
    mount([{ path: 'capability.tools', message: 'tools overlap' }])
    screen.getByRole('tabpanel', { name: '高级配置' })
  })

  it('starts a rootless draft in the Workspace the page views', () => {
    const { onSubmit } = mount(undefined, undefined, '/projects/current')
    const basic = screen.getByRole('tabpanel', { name: '基础配置' })
    fireEvent.change(within(basic).getByLabelText('名称'), { target: { value: 'Digest' } })
    fireEvent.click(screen.getByRole('button', { name: '发布修订' }))
    expect(onSubmit.mock.calls[0]![0].capability.workspaceRoots).toEqual(['/projects/current'])
  })

  it('keeps roots a stored specification already declares', () => {
    const base = emptyRobotSpec()
    const initial = { ...base, capability: { ...base.capability, workspaceRoots: ['/work/kept'] } }
    const onSubmit = vi.fn<EditorProps['onSubmit']>()
    render(
      <RobotConfigEditor t={t} initial={initial} defaultWorkspaceRoot="/projects/current" onSubmit={onSubmit} onCancel={vi.fn()} />,
    )
    fireEvent.click(screen.getByRole('button', { name: '发布修订' }))
    expect(onSubmit.mock.calls[0]![0].capability.workspaceRoots).toEqual(['/work/kept'])
  })

  it('submits the basic fields with the shared defaults', () => {
    const { onSubmit } = mount()
    const basic = screen.getByRole('tabpanel', { name: '基础配置' })
    fireEvent.change(within(basic).getByLabelText('名称'), { target: { value: 'Digest' } })
    fireEvent.change(within(basic).getByLabelText('任务目标'), { target: { value: 'Summarize the week' } })
    fireEvent.click(screen.getByRole('button', { name: '发布修订' }))
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({
      name: 'Digest',
      goal: {
        mission: 'Summarize the week',
        triggers: [{ kind: 'manual' }],
        strategy: 'plan',
        budget: { tokens: 100_000, millis: 600_000, cost: 0, toolCalls: 100 },
      },
      capability: { permissionPreset: 'workspace', sandbox: 'workspace', network: 'none' },
    })
    expect(onSubmit.mock.calls[0]![0].description).toBeUndefined()
  })
})

describe('robot advanced pickers', () => {
  const advanced = () => {
    fireEvent.click(screen.getByRole('tab', { name: '高级配置' }))
    return screen.getByRole('tabpanel', { name: '高级配置' })
  }

  it('offers the local skills and adds one through the picker', () => {
    const { onSubmit } = mount(undefined, CATALOG)
    advanced()
    const picker = screen.getByRole('button', { name: '从本机选择 技能' })
    fireEvent.click(picker)
    const option = screen.getByRole('menuitem', { name: /office-docx/ })
    expect(option.textContent).toContain('Create Word documents')
    fireEvent.click(option)
    expect(screen.getByRole('button', { name: '移除 office-docx' })).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: '发布修订' }))
    expect(onSubmit.mock.calls[0]![0].capability.skills).toEqual(['office-docx'])
  })

  it('toggles a selected option off and keeps the picker open between choices', () => {
    mount(undefined, CATALOG)
    advanced()
    fireEvent.click(screen.getByRole('button', { name: '从本机选择 允许的工具' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /bash/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: /read/ }))
    expect(screen.getByRole('button', { name: '移除 bash' })).toBeDefined()
    expect(screen.getByRole('button', { name: '移除 read' })).toBeDefined()
    fireEvent.click(screen.getByRole('menuitem', { name: /bash/ }))
    expect(screen.queryByRole('button', { name: '移除 bash' })).toBeNull()
  })

  it('closes the picker on Escape and ignores an empty or repeated addition', () => {
    mount(undefined, CATALOG)
    advanced()
    const input = screen.getByRole('textbox', { name: '技能' })
    const field = input.closest('div')!.parentElement!
    const addButton = within(input.closest('div')!).getByRole('button', { name: '添加' })
    fireEvent.click(addButton)
    expect(within(field).queryAllByRole('button', { name: /^移除 / })).toHaveLength(0)
    fireEvent.change(input, { target: { value: 'office-docx' } })
    fireEvent.click(addButton)
    fireEvent.change(input, { target: { value: 'office-docx' } })
    fireEvent.click(addButton)
    expect(within(field).getAllByRole('button', { name: '移除 office-docx' })).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: '从本机选择 技能' }))
    screen.getByRole('menu')
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('still accepts a value no local source publishes', () => {
    const { onSubmit } = mount(undefined, CATALOG)
    advanced()
    fireEvent.change(screen.getByRole('textbox', { name: '凭据引用' }), { target: { value: 'GITHUB_TOKEN' } })
    fireEvent.click(within(screen.getByRole('textbox', { name: '凭据引用' }).closest('div')!).getByRole('button', { name: '添加' }))
    fireEvent.click(screen.getByRole('button', { name: '发布修订' }))
    expect(onSubmit.mock.calls[0]![0].capability.credentials).toEqual(['GITHUB_TOKEN'])
  })

  it('omits the picker where no local source offers a value', () => {
    mount()
    advanced()
    expect(screen.queryByRole('button', { name: '从本机选择 读取命名空间' })).toBeNull()
    screen.getByText('本地记忆按 profile/工作区作用域保存，还没有命名空间概念；这些字段目前只保存，运行时不读取。')
  })
})
