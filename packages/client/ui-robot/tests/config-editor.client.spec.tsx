// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { makeTranslate } from '@tomato/client-test-runtime'
import { zh as commonZh } from '@tomato/client-locale/src/locales/zh.ts'
import { RobotConfigEditor } from '../src/client/RobotConfigEditor.tsx'
import { zh } from '../src/client/locales.ts'

afterEach(cleanup)

const t = makeTranslate({ ...commonZh, ...zh })

function mount(issues?: Parameters<typeof RobotConfigEditor>[0]['issues']) {
  const onSubmit = vi.fn()
  render(<RobotConfigEditor t={t} issues={issues} onSubmit={onSubmit} onCancel={vi.fn()} />)
  return { onSubmit }
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
