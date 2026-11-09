// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import type { DirectoryListing } from '@tomato/api-remotes/client'
import { makeTranslate } from '@tomato/client-test-runtime'
import { zh as commonZh } from '@tomato/client-locale/src/locales/zh.ts'
import { RobotCreateFlow, type RobotCreateFlowProps } from '../src/client/RobotCreateFlow.tsx'
import { zh } from '../src/client/locales.ts'

afterEach(cleanup)

const t = makeTranslate({ ...commonZh, ...zh }) as RobotCreateFlowProps['t']

function mount(overrides: Partial<RobotCreateFlowProps> = {}) {
  const onSubmit = vi.fn<RobotCreateFlowProps['onSubmit']>()
  const onCancel = vi.fn()
  const view = render(
    <RobotCreateFlow
      t={t}
      existingNames={[]}
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...overrides}
    />,
  )
  return { onSubmit, onCancel, view }
}

/** Fill the mission and identity steps, leaving the flow on the criteria step. */
function toCriteria(mission = '每天检查竞品账号有没有更新', name = '竞品侦察兵'): void {
  fireEvent.change(screen.getByLabelText('这个机器人每次运行要替你做什么？'), { target: { value: mission } })
  fireEvent.click(screen.getByRole('button', { name: '下一步' }))
  fireEvent.change(screen.getByLabelText('名称'), { target: { value: name } })
  fireEvent.click(screen.getByRole('button', { name: '下一步' }))
}

describe('guided robot creation', () => {
  it('walks three steps and publishes the confirmed draft', () => {
    const { onSubmit } = mount()
    screen.getByRole('heading', { name: '这个机器人每次运行要替你做什么？' })
    // The example buttons fill the mission field directly.
    fireEvent.click(screen.getByRole('button', { name: /每周一汇总竞品/ }))
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    fireEvent.change(screen.getByLabelText('名称'), { target: { value: '竞品侦察兵' } })
    fireEvent.change(screen.getByLabelText('一句话描述（可选）'), { target: { value: '盯竞品内容和爆款选题。' } })
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    const preview = screen.getByRole('complementary', { name: '预览' })
    within(preview).getByText('竞品侦察兵')
    within(preview).getByText('盯竞品内容和爆款选题。')
    fireEvent.click(screen.getByRole('button', { name: '创建机器人' }))
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({
      name: '竞品侦察兵',
      description: '盯竞品内容和爆款选题。',
      goal: { mission: t('create.example.one'), successCriteria: [] },
    })
  })

  it('blocks the mission step until the answer is real', () => {
    const { onSubmit } = mount()
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    screen.getByText('请先写一句它每次运行要做的事。')
    expect(screen.getByLabelText('这个机器人每次运行要替你做什么？')).toBeDefined()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('blocks the name step on an empty or duplicate name', () => {
    mount({ existingNames: [' 竞品侦察兵 '] })
    fireEvent.change(screen.getByLabelText('这个机器人每次运行要替你做什么？'), { target: { value: '盯住竞品更新' } })
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    screen.getByText('请给它起个名字。')
    fireEvent.change(screen.getByLabelText('名称'), { target: { value: '竞品侦察兵' } })
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    screen.getByText('已经有同名机器人，换一个名字。')
    expect(screen.queryByRole('complementary', { name: '预览' })).toBeNull()
  })

  it('walks back through the steps and cancels without creating', () => {
    const { onCancel, onSubmit } = mount()
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(onCancel).toHaveBeenCalledOnce()
    toCriteria()
    fireEvent.click(screen.getByRole('button', { name: '上一步' }))
    screen.getByLabelText('名称')
    fireEvent.click(screen.getByRole('button', { name: '上一步' }))
    screen.getByLabelText('这个机器人每次运行要替你做什么？')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('starts the robot in the Workspace the page views', () => {
    const { onSubmit } = mount({ defaultWorkspaceRoot: '/projects/current' })
    toCriteria()
    within(screen.getByRole('complementary', { name: '预览' })).getByText('/projects/current')
    fireEvent.click(screen.getByRole('button', { name: '创建机器人' }))
    expect(onSubmit.mock.calls[0]![0].capability.workspaceRoots).toEqual(['/projects/current'])
  })

  it('changes the working folder from the preview', async () => {
    const listing: DirectoryListing = {
      path: '/work/beta',
      home: '/home/me',
      crumbs: [{ name: 'beta', path: '/work/beta', hidden: false }],
      entries: [],
      truncated: false,
    }
    const listDirectory = vi.fn(async () => listing)
    const pickDirectory = vi.fn(async () => null)
    const { onSubmit } = mount({
      defaultWorkspaceRoot: '/projects/current',
      listDirectory,
      pickDirectory,
    })
    toCriteria()
    fireEvent.click(screen.getByRole('button', { name: '更改…' }))
    const dialog = await screen.findByRole('dialog', { name: '浏览文件夹' })
    await within(dialog).findByText('这里没有子文件夹。')
    // Dismissing the folder dialog keeps the preview on the original directory.
    fireEvent.click(within(dialog).getByRole('button', { name: '关闭' }))
    expect(screen.queryByRole('dialog', { name: '浏览文件夹' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '更改…' }))
    const reopened = await screen.findByRole('dialog', { name: '浏览文件夹' })
    await within(reopened).findByText('这里没有子文件夹。')
    fireEvent.click(within(reopened).getByRole('button', { name: '选择此文件夹' }))
    within(screen.getByRole('complementary', { name: '预览' })).getByText('/work/beta')
    fireEvent.click(screen.getByRole('button', { name: '创建机器人' }))
    expect(onSubmit.mock.calls[0]![0].capability.workspaceRoots).toEqual(['/work/beta'])
  })

  it('adds success criteria one suggestion at a time and previews them', () => {
    const { onSubmit } = mount()
    toCriteria()
    fireEvent.change(screen.getByLabelText('怎么算这次运行成功？'), { target: { value: '自己写的一条' } })
    fireEvent.click(screen.getByRole('button', { name: '结论有数据或链接依据' }))
    fireEvent.click(screen.getByRole('button', { name: '结论有数据或链接依据' }))
    fireEvent.click(screen.getByRole('button', { name: '每个平台至少给出 3 条内容' }))
    fireEvent.click(screen.getByRole('button', { name: '最后给出 3 条可直接执行的建议' }))
    expect(screen.getByLabelText('怎么算这次运行成功？')).toHaveProperty(
      'value',
      '自己写的一条\n结论有数据或链接依据\n每个平台至少给出 3 条内容\n最后给出 3 条可直接执行的建议',
    )
    const preview = screen.getByRole('complementary', { name: '预览' })
    within(preview).getByText('结论有数据或链接依据')
    // A missing description keeps a neutral preview line.
    within(preview).getByText('还没有一句话描述')
    fireEvent.click(screen.getByRole('button', { name: '创建机器人' }))
    expect(onSubmit.mock.calls[0]![0].goal.successCriteria).toEqual([
      '自己写的一条',
      '结论有数据或链接依据',
      '每个平台至少给出 3 条内容',
      '最后给出 3 条可直接执行的建议',
    ])
  })

  it('returns to the name step when the registry learns the chosen name', () => {
    const onSubmit = vi.fn<RobotCreateFlowProps['onSubmit']>()
    const view = (existingNames: readonly string[]) => (
      <RobotCreateFlow
        t={t}
        existingNames={existingNames}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    )
    const { rerender } = render(view([]))
    toCriteria()
    rerender(view(['竞品侦察兵']))
    fireEvent.click(screen.getByRole('button', { name: '创建机器人' }))
    screen.getByText('已经有同名机器人，换一个名字。')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows a provider field issue under the matching input', () => {
    mount({ issues: [{ path: 'name', message: 'must be unique' }, { path: 'goal.mission', message: 'too vague' }] })
    screen.getByText('too vague')
    fireEvent.change(screen.getByLabelText('这个机器人每次运行要替你做什么？'), { target: { value: '盯住竞品更新' } })
    fireEvent.click(screen.getByRole('button', { name: '下一步' }))
    screen.getByText('must be unique')
  })

  it('shows the save failure and keeps the draft for a retry', () => {
    mount({ error: 'name must be unique' })
    expect(screen.getByRole('alert').textContent).toBe('name must be unique')
    screen.getByRole('heading', { name: '创建机器人' })
  })

  it('covers the remaining example missions', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: /每天检查我指定的几个/ }))
    expect(screen.getByLabelText('这个机器人每次运行要替你做什么？')).toHaveProperty('value', t('create.example.two'))
    fireEvent.click(screen.getByRole('button', { name: /接到一个前端改码需求/ }))
    expect(screen.getByLabelText('这个机器人每次运行要替你做什么？')).toHaveProperty('value', t('create.example.three'))
  })
})
