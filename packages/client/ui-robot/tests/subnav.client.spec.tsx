// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { brandString } from '@tomato/branded'
import { createSnapshotStore } from '@tomato/client-store'
import { allowAllAccess, bindSnapshotSelector, makeTranslate } from '@tomato/client-test-runtime'
import { zh as commonZh } from '@tomato/client-locale/src/locales/zh.ts'
import type { MainPanelId } from '@tomato/client-ui-layout/client'
import type { Robot, RobotId, RobotRunsSnapshot, RobotSpecRevision } from '@tomato/api-robot-controller/client'
import type { RobotSpecId } from '@tomato/experimental-robot/types'
import { RobotSubnav, type RobotSubnavProps } from '../src/client/RobotSubnav.tsx'
import { emptyRobotSpec } from '../src/client/spec.ts'
import { createRobotPageStore } from '../src/client/store.ts'
import { zh } from '../src/client/locales.ts'

afterEach(cleanup)

const t = makeTranslate({ ...commonZh, ...zh }) as RobotSubnavProps['t']

function robot(id: string, name: string, state: Robot['state']): Robot {
  return {
    id: brandString<RobotId>(id),
    name,
    state,
    createdAt: 0,
    spec: { spec: brandString<RobotSpecId>(`spec-${id}`), revision: 1 },
  }
}

const EMPTY: RobotRunsSnapshot = { specs: [], robots: [], runs: [], templates: [] }

const unusedHook = (() => { throw new Error('nested roster fixture does not provide global state') }) as never

function mount({
  active = true,
  wide = true,
  robots = [robot('assistant', '营销助手', 'idle'), robot('brand', '品牌营销洞察师', 'running')],
  selected,
  specs = EMPTY.specs,
}: {
  active?: boolean
  wide?: boolean
  robots?: readonly Robot[]
  selected?: string
  specs?: readonly RobotSpecRevision[]
} = {}) {
  const page = createRobotPageStore().create()
  if (selected !== undefined) page.actions.selectRobot(brandString<RobotId>(selected))
  const registry = createSnapshotStore<RobotRunsSnapshot>({ ...EMPTY, robots, specs }, { flush: 'sync' })
  const selectPanel = vi.fn()
  const props: RobotSubnavProps = {
    id: 'robots' as MainPanelId,
    active,
    wide,
    ...allowAllAccess,
    t,
    usePanelInfo: unusedHook,
    useSessions: unusedHook,
    useWorkspaces: unusedHook,
    useSessionStatus: unusedHook,
    useSessionRetainInfo: unusedHook,
    useResource: unusedHook,
    useRobotPage: bindSnapshotSelector(page),
    useStore: bindSnapshotSelector(page),
    useRegistry: bindSnapshotSelector(registry),
    actions: page.actions,
    selectPanel,
  }
  render(<RobotSubnav {...props} />)
  return { page, registry, selectPanel }
}

describe('robot roster nested under its panel row', () => {
  it('lists the robots only while its own panel is the selected one in the wide column', () => {
    mount({ active: false })
    expect(screen.queryByRole('group', { name: 'Tomato Rbot' })).toBeNull()
    cleanup()
    mount({ wide: false })
    expect(screen.queryByRole('group', { name: 'Tomato Rbot' })).toBeNull()
    cleanup()
    mount()
    const group = screen.getByRole('group', { name: 'Tomato Rbot' })
    // The avatar stays decorative; the visible label is the robot name.
    expect(Array.from(group.querySelectorAll('button'), row =>
      [...row.querySelectorAll('span')].find(label => label.getAttribute('aria-hidden') === null)?.textContent))
      .toEqual(['营销助手', '品牌营销洞察师'])
  })

  it('marks the selected robot and selects another from the row', () => {
    const { page, selectPanel } = mount()
    const idle = screen.getByRole('button', { name: '营销助手' })
    const running = screen.getByRole('button', { name: /品牌营销洞察师/ })
    expect(idle.getAttribute('aria-current')).toBeNull()

    fireEvent.click(running)
    expect(selectPanel).toHaveBeenCalledTimes(1)
    expect(page.getSnapshot().robotId).toBe('brand')
    expect(running.getAttribute('aria-current')).toBe('true')
  })

  it('marks the robot the page already shows', () => {
    mount({ selected: 'assistant' })
    expect(screen.getByRole('button', { name: '营销助手' }).getAttribute('aria-current')).toBe('true')
    expect(screen.getByRole('button', { name: /品牌营销洞察师/ }).getAttribute('aria-current')).toBeNull()
    cleanup()
  })

  it('draws each avatar from the published skills of its robot', () => {
    const spec = emptyRobotSpec()
    mount({
      specs: [{
        ref: { spec: brandString<RobotSpecId>('spec-assistant'), revision: 1 },
        publishedAt: 0,
        spec: { ...spec, capability: { ...spec.capability, skills: ['brand-insight'] } },
      }],
    })
    const avatar = screen.getByRole('button', { name: '营销助手' }).querySelector('span[aria-hidden="true"]')
    expect(avatar?.getAttribute('data-art')).toBe('brand-insight')
  })

  it('carries a status dot only for a running robot', () => {
    mount()
    expect(screen.getByRole('button', { name: /品牌营销洞察师/ }).textContent).toContain('运行中')
    expect(screen.getByRole('button', { name: '营销助手' }).textContent).not.toContain('运行中')
  })

  it('renders nothing when no robot exists yet', () => {
    mount({ robots: [] })
    expect(screen.queryByRole('group', { name: 'Tomato Rbot' })).toBeNull()
  })
})
