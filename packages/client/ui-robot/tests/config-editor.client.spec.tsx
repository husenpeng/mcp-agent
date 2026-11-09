// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import type { DirectoryListing } from '@tomato/api-remotes/client'
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

/** Fill the two required basic fields so a save reaches the provider. */
function fillBasics(): void {
  fireEvent.click(screen.getByRole('tab', { name: '基础配置' }))
  fireEvent.change(screen.getByLabelText('名称'), { target: { value: 'Digest' } })
  fireEvent.change(screen.getByLabelText('任务目标'), { target: { value: 'Summarize the week' } })
}

const LISTING: DirectoryListing = {
  path: '/work/beta',
  home: '/home/me',
  crumbs: [{ name: 'beta', path: '/work/beta', hidden: false }],
  entries: [],
  truncated: false,
}

/** Mount the editor with the Host folder calls the browse action needs. */
function mountWithFolder(capabilities: NonNullable<EditorProps['capabilities']> = CATALOG) {
  const onSubmit = vi.fn<EditorProps['onSubmit']>()
  const listDirectory = vi.fn<NonNullable<EditorProps['listDirectory']>>(async () => LISTING)
  const pickDirectory = vi.fn<NonNullable<EditorProps['pickDirectory']>>(async () => null)
  render(
    <RobotConfigEditor
      t={t}
      capabilities={capabilities}
      listDirectory={listDirectory}
      pickDirectory={pickDirectory}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
    />,
  )
  return { onSubmit, listDirectory, pickDirectory }
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
    fireEvent.change(within(basic).getByLabelText('任务目标'), { target: { value: 'Summarize the week' } })
    fireEvent.click(screen.getByRole('button', { name: '保存修改' }))
    expect(onSubmit.mock.calls[0]![0].capability.workspaceRoots).toEqual(['/projects/current'])
  })

  it('keeps roots a stored specification already declares', () => {
    const base = emptyRobotSpec()
    const initial = { ...base, capability: { ...base.capability, workspaceRoots: ['/work/kept'] } }
    const onSubmit = vi.fn<EditorProps['onSubmit']>()
    render(
      <RobotConfigEditor t={t} initial={initial} defaultWorkspaceRoot="/projects/current" onSubmit={onSubmit} onCancel={vi.fn()} />,
    )
    fireEvent.change(screen.getByLabelText('名称'), { target: { value: 'Digest' } })
    fireEvent.change(screen.getByLabelText('任务目标'), { target: { value: 'Keep the stored root' } })
    fireEvent.click(screen.getByRole('button', { name: '保存修改' }))
    expect(onSubmit.mock.calls[0]![0].capability.workspaceRoots).toEqual(['/work/kept'])
  })

  it('submits the basic fields with the shared defaults', () => {
    const { onSubmit } = mount()
    const basic = screen.getByRole('tabpanel', { name: '基础配置' })
    fireEvent.change(within(basic).getByLabelText('名称'), { target: { value: 'Digest' } })
    fireEvent.change(within(basic).getByLabelText('任务目标'), { target: { value: 'Summarize the week' } })
    fireEvent.click(screen.getByRole('button', { name: '保存修改' }))
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({
      name: 'Digest',
      goal: {
        mission: 'Summarize the week',
        triggers: [{ kind: 'manual' }],
        strategy: 'plan',
        budget: { tokens: 100_000, millis: 600_000, cost: 0, toolCalls: 100 },
      },
      capability: { permissionPreset: 'workspace-write', sandbox: 'workspace', network: 'none' },
    })
    expect(onSubmit.mock.calls[0]![0].description).toBeUndefined()
  })

  it('refuses to save an empty name or the placeholder mission', () => {
    const { onSubmit } = mount()
    const basic = screen.getByRole('tabpanel', { name: '基础配置' })
    fireEvent.click(screen.getByRole('button', { name: '保存修改' }))
    expect(onSubmit).not.toHaveBeenCalled()
    within(basic).getAllByText('必填')
    fireEvent.change(within(basic).getByLabelText('名称'), { target: { value: 'Digest' } })
    fireEvent.change(within(basic).getByLabelText('任务目标'), { target: { value: 'Summarize the week' } })
    fireEvent.click(screen.getByRole('button', { name: '保存修改' }))
    expect(onSubmit).toHaveBeenCalledOnce()
  })
})

describe('robot advanced pickers', () => {
  const advanced = () => {
    fireEvent.click(screen.getByRole('tab', { name: '高级配置' }))
    return screen.getByRole('tabpanel', { name: '高级配置' })
  }

  it('offers the local skills in a folder picker and adds one', () => {
    const { onSubmit } = mount(undefined, CATALOG)
    fillBasics()
    advanced()
    fireEvent.click(screen.getByRole('button', { name: '选择 技能' }))
    const dialog = screen.getByRole('dialog', { name: '选择技能' })
    const option = within(dialog).getByRole('button', { name: /office-docx/ })
    expect(option.textContent).toContain('Create Word documents')
    fireEvent.click(option)
    expect(within(dialog).getByText('已选 1 项')).toBeDefined()
    fireEvent.click(within(dialog).getByRole('button', { name: '完成' }))
    expect(screen.getByRole('button', { name: '移除 office-docx' })).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: '保存修改' }))
    expect(onSubmit.mock.calls[0]![0].capability.skills).toEqual(['office-docx'])
  })

  it('selects MCP servers in a modal picker', () => {
    const { onSubmit } = mount(undefined, CATALOG)
    fillBasics()
    advanced()
    fireEvent.click(screen.getByRole('button', { name: '选择 MCP 服务器' }))
    const dialog = screen.getByRole('dialog', { name: '选择 MCP 服务器' })
    fireEvent.click(within(dialog).getByRole('button', { name: /github/ }))
    fireEvent.click(within(dialog).getByRole('button', { name: '完成' }))
    fireEvent.click(screen.getByRole('button', { name: '保存修改' }))
    expect(onSubmit.mock.calls[0]![0].capability.mcpServers).toEqual(['github'])
  })

  it('adds a browsed folder to the working directories', async () => {
    const { onSubmit, listDirectory, pickDirectory } = mountWithFolder()
    fillBasics()
    advanced()
    fireEvent.click(screen.getByRole('button', { name: '选择 工作区根目录' }))
    const dialog = screen.getByRole('dialog', { name: '选择工作目录' })
    // Selecting an already registered Workspace option toggles it on and off.
    fireEvent.click(within(dialog).getByRole('button', { name: /Alpha/ }))
    within(dialog).getByText('已选 1 项')
    fireEvent.click(within(dialog).getByRole('button', { name: /Alpha/ }))
    within(dialog).getByText('已选 0 项')
    fireEvent.click(within(dialog).getByRole('button', { name: '浏览文件夹…' }))
    const folder = await screen.findByRole('dialog', { name: '浏览文件夹' })
    // The nested dialog is the folder picker; its listing settles asynchronously.
    await within(folder).findByText('这里没有子文件夹。')
    expect(listDirectory).toHaveBeenCalledWith(undefined, expect.any(AbortSignal))
    fireEvent.click(within(folder).getByRole('button', { name: '选择此文件夹' }))
    expect(screen.getByRole('button', { name: '移除 /work/beta' })).toBeDefined()
    // Picking the same folder again is a no-op instead of a duplicate root.
    fireEvent.click(within(dialog).getByRole('button', { name: '浏览文件夹…' }))
    const again = await screen.findByRole('dialog', { name: '浏览文件夹' })
    await within(again).findByText('这里没有子文件夹。')
    fireEvent.click(within(again).getByRole('button', { name: '选择此文件夹' }))
    // Dismissing the folder dialog keeps the current selection.
    fireEvent.click(within(dialog).getByRole('button', { name: '浏览文件夹…' }))
    const dismissed = await screen.findByRole('dialog', { name: '浏览文件夹' })
    fireEvent.click(within(dismissed).getByRole('button', { name: '关闭' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: '选择工作目录' })).getByRole('button', { name: '完成' }))
    fireEvent.click(screen.getByRole('button', { name: '保存修改' }))
    expect(onSubmit.mock.calls[0]![0].capability.workspaceRoots).toEqual(['/work/beta'])
    expect(pickDirectory).not.toHaveBeenCalled()
  })

  it('toggles a selected option off and keeps the picker open between choices', () => {
    mount(undefined, CATALOG)
    advanced()
    fireEvent.click(screen.getByRole('button', { name: '选择 允许的工具' }))
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

    fireEvent.click(screen.getByRole('button', { name: '选择 允许的工具' }))
    screen.getByRole('menu')
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('still accepts a value no local source publishes', () => {
    const { onSubmit } = mount(undefined, CATALOG)
    fillBasics()
    advanced()
    fireEvent.change(screen.getByRole('textbox', { name: '凭据引用' }), { target: { value: 'GITHUB_TOKEN' } })
    fireEvent.click(within(screen.getByRole('textbox', { name: '凭据引用' }).closest('div')!).getByRole('button', { name: '添加' }))
    fireEvent.click(screen.getByRole('button', { name: '保存修改' }))
    expect(onSubmit.mock.calls[0]![0].capability.credentials).toEqual(['GITHUB_TOKEN'])
  })

  it('omits the picker where no local source offers a value', () => {
    mount()
    advanced()
    expect(screen.queryByRole('button', { name: '选择 读取命名空间' })).toBeNull()
    screen.getByText('本地记忆按 profile/工作区作用域保存，还没有命名空间概念；这些字段目前只保存，运行时不读取。')
  })
})
