// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { brandString } from '@tomato/branded'
import { makeTranslate } from '@tomato/client-test-runtime'
import { zh as commonZh } from '@tomato/client-locale/src/locales/zh.ts'
import type { Robot, RobotId, RobotSpecRevision, RobotTemplate, RobotTemplateId, Run, RunId } from '@tomato/api-robot-controller/client'
import type { RobotSpecId } from '@tomato/experimental-robot/types'
import { emptyRobotSpec } from '../src/client/spec.ts'
import { RobotGallery } from '../src/client/RobotGallery.tsx'
import type { RobotStatusFilter } from '../src/client/store.ts'
import { templateTextFor } from '../src/client/template-text.ts'
import { zh } from '../src/client/locales.ts'

afterEach(cleanup)

const t = makeTranslate({ ...commonZh, ...zh })

const template = (id: string, name: string, description: string, skill: string): RobotTemplate => {
  const spec = emptyRobotSpec()
  return {
    id: brandString<RobotTemplateId>(id),
    category: 'youtube',
    text: {
      en: { category: 'YouTube', name: `${name} (en)`, description, mission: 'm', successCriteria: [], acceptance: [] },
      zh: { category: 'YouTube', name, description, mission: 'm', successCriteria: [], acceptance: [] },
    },
    spec: { ...spec, capability: { ...spec.capability, skills: [skill] } },
  }
}

const robot = (id: string, name: string, state: Robot['state']): Robot => ({
  id: brandString<RobotId>(id), name, state, createdAt: 0, spec: { spec: brandString<RobotSpecId>(`spec-${id}`), revision: 1 },
})

const TEMPLATES = [
  template('yt', 'YouTube 数据洞察师', '频道与视频分析', 'youtube-data-insight'),
  template('brand', '品牌营销洞察师', '声量与情感', 'brand-insight'),
]
const ROBOTS = [robot('a', '周报机器人', 'idle'), robot('b', '盯盘机器人', 'running')]
const SKILLS = new Map([['a', 'brand-insight'], ['b', 'tiktok-data-insight']])
const SPECS: RobotSpecRevision[] = ROBOTS.map((entry) => {
  const spec = emptyRobotSpec({ name: entry.name, description: `${entry.name}的描述` })
  const skill = SKILLS.get(entry.id)
  return {
    ref: entry.spec,
    publishedAt: 0,
    spec: { ...spec, capability: { ...spec.capability, skills: skill === undefined ? [] : [skill] } },
  }
})
const RUNS: Run[] = [1, 2, 3].map(index => ({
  id: brandString<RunId>(`run-${index}`), robot: ROBOTS[0]!.id, spec: ROBOTS[0]!.spec, state: 'succeeded', input: { message: 'go' }, startedAt: 0,
}))

function mount(overrides: { query?: string; filter?: RobotStatusFilter; robots?: readonly Robot[]; chat?: boolean } = {}) {
  const props = {
    onQuery: vi.fn(), onFilter: vi.fn(), onOpen: vi.fn(), onCreate: vi.fn(),
    onCreateWithChat: overrides.chat === false ? undefined : vi.fn(),
    onHire: vi.fn(() => Promise.resolve()),
  }
  render(
    <RobotGallery
      t={t}
      templates={TEMPLATES}
      robots={overrides.robots ?? ROBOTS}
      specs={SPECS}
      runs={RUNS}
      textOf={entry => templateTextFor(entry, 'zh')}
      query={overrides.query ?? ''}
      filter={overrides.filter ?? 'all'}
      {...props}
    />,
  )
  return props
}

describe('robot gallery', () => {
  it('shows hired robots with descriptions, state, run counts, and role artwork, then the template market', () => {
    mount()
    const mine = screen.getByRole('region', { name: '我的机器人' })
    within(mine).getByText('周报机器人的描述')
    within(mine).getByText('3 次运行')
    within(mine).getByText('运行中')
    expect(mine.querySelector('[data-art="brand-insight"]')).not.toBeNull()
    expect(mine.querySelector('[data-art="tiktok-data-insight"]')).not.toBeNull()
    const market = screen.getByRole('region', { name: '招聘市场' })
    within(market).getByText('YouTube 数据洞察师')
    within(market).getByText('频道与视频分析')
    expect(market.querySelector('[data-art="youtube-data-insight"]')).not.toBeNull()
    expect(market.querySelector('[data-art="brand-insight"]')).not.toBeNull()
  })

  it('filters robots and templates by the search text', () => {
    mount({ query: '盯盘' })
    expect(screen.queryByText('周报机器人')).toBeNull()
    screen.getByText('盯盘机器人')
    expect(screen.queryByRole('region', { name: '招聘市场' })).toBeNull()
  })

  it('matches template descriptions and reports robots with no match', () => {
    mount({ query: '声量' })
    screen.getByText('品牌营销洞察师')
    expect(screen.queryByText('YouTube 数据洞察师')).toBeNull()
    screen.getByText('没有符合条件的机器人。')
  })

  it('shows only running robots and hides templates under the running filter', () => {
    mount({ filter: 'running' })
    screen.getByText('盯盘机器人')
    expect(screen.queryByText('周报机器人')).toBeNull()
    expect(screen.queryByRole('region', { name: '招聘市场' })).toBeNull()
  })

  it('shows only idle robots under the idle filter', () => {
    mount({ filter: 'idle' })
    screen.getByText('周报机器人')
    expect(screen.queryByText('盯盘机器人')).toBeNull()
  })

  it('reports query and filter changes to the owner', () => {
    const props = mount()
    fireEvent.change(screen.getByLabelText('搜索机器人名称或描述'), { target: { value: 'x' } })
    expect(props.onQuery).toHaveBeenCalledWith('x')
    fireEvent.click(screen.getByRole('button', { name: '空闲' }))
    expect(props.onFilter).toHaveBeenCalledWith('idle')
  })

  it('hires a template and disables other hires until it settles', async () => {
    let settle!: () => void
    const props = mount()
    props.onHire.mockImplementation(() => new Promise<void>((resolve) => { settle = resolve }))
    fireEvent.click(screen.getByRole('button', { name: '聘用 YouTube 数据洞察师' }))
    expect(props.onHire).toHaveBeenCalledWith(TEMPLATES[0])
    expect(screen.getByRole('button', { name: '聘用 品牌营销洞察师' })).toHaveProperty('disabled', true)
    settle()
    await vi.waitFor(() => { expect(screen.getByRole('button', { name: '聘用 品牌营销洞察师' })).toHaveProperty('disabled', false) })
  })

  it('opens a robot from its card and creates robots from the toolbar', () => {
    const props = mount()
    fireEvent.click(screen.getByRole('button', { name: '周报机器人' }))
    expect(props.onOpen).toHaveBeenCalledWith(ROBOTS[0])
    fireEvent.click(screen.getByRole('button', { name: '创建机器人' }))
    expect(props.onCreate).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: '让助手帮我创建' }))
    expect(props.onCreateWithChat).toHaveBeenCalledOnce()
  })

  it('marks failed robots, falls back for unnamed and unpublished robots, and hides chat creation when unavailable', () => {
    mount({ robots: [robot('f', '故障机器人', 'failed'), { ...robot('n', '  ', 'idle'), spec: { spec: brandString<RobotSpecId>('none'), revision: 1 } }], chat: false })
    screen.getByText('故障机器人')
    screen.getByText('?')
    expect(screen.getAllByText('0 次运行')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: '让助手帮我创建' })).toBeNull()
  })

  it('shows the empty roster prompt when no robot exists', () => {
    mount({ robots: [] })
    screen.getByText('还没有机器人。创建一个，把你的重复工作交给它。')
  })
})

describe('templateTextFor', () => {
  it('falls back from the region to the language to English', () => {
    expect(templateTextFor(TEMPLATES[0]!, 'zh-CN').name).toBe('YouTube 数据洞察师')
    expect(templateTextFor(TEMPLATES[0]!, 'fr').name).toBe('YouTube 数据洞察师 (en)')
  })
})
