// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { makeTranslate } from '@tomato/client-test-runtime'
import type { ChatNode } from '../src/client/contract/chat-nodes.ts'
import type { ChatNodeViewProps } from '../src/client/contract/slots.ts'
import { RetractionLogItem } from '../src/client/chat/RetractionLogItem.tsx'
import { zh } from '../src/client/locale.ts'

afterEach(cleanup)

describe('RetractionLogItem', () => {
  it('renders the audit line with attachment names and a clock', () => {
    const node: ChatNode<'retraction'> = {
      key: 'retraction:user-1',
      id: 'user-1',
      kind: 'retraction',
      target: 'chat',
      anchorSeq: 5,
      location: { kind: 'session' },
      visibility: 'visible',
      data: {
        messageId: 'user-1',
        seq: 5,
        time: Date.now(),
        attachments: ['shot.png', 'notes.pdf'],
      },
    }
    const props: Partial<ChatNodeViewProps<'retraction'>> = {
      node,
      t: makeTranslate(zh),
    }
    const view = render(<RetractionLogItem {...props as ChatNodeViewProps<'retraction'>} />)
    expect(view.getByText('已撤回这一轮，模型上下文不再包含它')).toBeTruthy()
    expect(view.getByText(/含 2 个附件/)).toBeTruthy()
    expect(view.getByText(/shot\.png/)).toBeTruthy()
  })

  it('omits the attachment clause when the message carried none', () => {
    const node: ChatNode<'retraction'> = {
      key: 'retraction:user-2',
      id: 'user-2',
      kind: 'retraction',
      target: 'chat',
      anchorSeq: 6,
      location: { kind: 'session' },
      visibility: 'visible',
      data: { messageId: 'user-2', seq: 6, time: Date.now(), attachments: [] },
    }
    const props: Partial<ChatNodeViewProps<'retraction'>> = {
      node,
      t: makeTranslate(zh),
    }
    const view = render(<RetractionLogItem {...props as ChatNodeViewProps<'retraction'>} />)
    expect(view.queryByText(/附件/)).toBeNull()
  })
})
