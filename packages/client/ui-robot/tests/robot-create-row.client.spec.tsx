// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { StartedToolCall, ToolResultNode } from '@tomato/client-ui-chat/client'
import type { ToolCallOwnerProps } from '@tomato/client-ui-tool/client'
import { makeTranslate } from '@tomato/client-test-runtime'
import { zh as commonZh } from '@tomato/client-locale/src/locales/zh.ts'
import { PartialArguments } from '@tomato/util-values'
import { RobotCreateRow, type RobotCreateRowProps } from '../src/client/RobotCreateRow.tsx'
import { zh } from '../src/client/locales.ts'

type RowProps = Parameters<typeof RobotCreateRow>[0]

const t: RowProps['t'] = makeTranslate(zh, commonZh)

afterEach(cleanup)

function settled(over: Partial<ToolResultNode> = {}): ToolResultNode {
  return {
    kind: 'tool-result',
    seq: 3,
    time: 3_000,
    callId: 'call-create',
    name: 'robot_create',
    args: PartialArguments.fromObject({ name: '竞品侦察兵' }),
    call: { name: 'robot_create', argsRaw: '{"name":"竞品侦察兵"}' },
    callTime: 2_000,
    content: [{ type: 'text', text: 'Created robot "竞品侦察兵" (specification spec-1, revision 1, robot robot-1).' }],
    isError: false,
    subCalls: [],
    ...over,
  }
}

function running(): StartedToolCall {
  return {
    phase: 'start' as const,
    args: PartialArguments.fromObject({ name: '竞品侦察兵' }),
    callId: 'call-create',
    name: 'robot_create',
    argsRaw: '{"name":"竞品侦察兵"}',
    turn: 1,
    step: 1,
    time: 2_000,
    subCalls: [],
  }
}

function props(block: RowProps['block']): RobotCreateRowProps {
  const owner: ToolCallOwnerProps = {
    callId: block.callId,
    toolName: 'robot_create',
    ...('kind' in block
      ? { phase: 'result' as const, block }
      : block.phase === 'preparing'
        ? { phase: 'preparing' as const, block }
        : { phase: 'start' as const, block }),
    useDisclosure: () => ({ expanded: false, setExpanded: vi.fn(), toggle: vi.fn() }),
    loadImage: vi.fn<ToolCallOwnerProps['loadImage']>(),
    openFile: vi.fn(),
  }
  return { ...owner, t, openRobot: vi.fn() } as RobotCreateRowProps
}

describe('RobotCreateRow', () => {
  it('shows the creation in flight without an open action', () => {
    render(<RobotCreateRow {...props(running())} />)
    screen.getByText('正在创建机器人…')
    expect(screen.queryByRole('button', { name: '打开机器人' })).toBeNull()
  })

  it('names the created robot and opens it from the row', () => {
    const view = props(settled({ meta: { robotId: 'robot-1', name: '竞品侦察兵' } }))
    render(<RobotCreateRow {...view} />)
    screen.getByText('已创建机器人「竞品侦察兵」')
    fireEvent.click(screen.getByRole('button', { name: '打开机器人' }))
    expect(view.openRobot).toHaveBeenCalledWith('robot-1')
  })

  it('keeps a legacy success readable without presentation metadata', () => {
    render(<RobotCreateRow {...props(settled())} />)
    screen.getByText('创建机器人')
    expect(screen.queryByRole('button', { name: '打开机器人' })).toBeNull()
  })

  it('falls back for malformed or missing metadata', () => {
    const malformed = props(settled({ meta: { robotId: 1, name: '竞品侦察兵' } }))
    const view = render(<RobotCreateRow {...malformed} />)
    screen.getByText('创建机器人')
    expect(screen.queryByRole('button', { name: '打开机器人' })).toBeNull()
    view.unmount()
    render(<RobotCreateRow {...props(settled({ meta: 'not-an-object' }))} />)
    screen.getByText('创建机器人')
  })

  it('renders a non-text result body and an error without content', () => {
    const withBlock = props(settled({
      isError: true,
      content: [{ type: 'reasoning', text: 'hidden' }],
    }))
    const view = render(<RobotCreateRow {...withBlock} />)
    fireEvent.click(screen.getByRole('button', { name: /创建机器人失败/ }))
    screen.getByText('{"type":"reasoning","text":"hidden"}')
    view.unmount()
    render(<RobotCreateRow {...props(settled({
      isError: true,
      content: [],
      error: { name: 'RemoteError', code: 'ROBOT_SPEC_INVALID' },
    }))} />)
    fireEvent.click(screen.getByRole('button', { name: /创建机器人失败/ }))
    screen.getByText('RemoteError: ROBOT_SPEC_INVALID')
  })

  it('keeps a failed row without readable text collapsed', () => {
    render(<RobotCreateRow {...props(settled({ isError: true, content: [] }))} />)
    screen.getByText('创建机器人失败')
    expect(screen.queryByRole('button', { name: /创建机器人失败/ })).toBeNull()
  })

  it('discloses the failure text of a rejected creation', () => {
    render(<RobotCreateRow {...props(settled({
      isError: true,
      meta: undefined,
      content: [{ type: 'text', text: 'Invalid robot specification: name: ask the user for a name' }],
    }))} />)
    screen.getByText('创建机器人失败')
    fireEvent.click(screen.getByRole('button', { name: /创建机器人失败/ }))
    screen.getByText('Invalid robot specification: name: ask the user for a name')
  })
})
