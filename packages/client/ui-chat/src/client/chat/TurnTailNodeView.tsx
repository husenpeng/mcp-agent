import { memo } from 'react'
import type { InjectFace, PropsRenderSlots } from '@tomato/client-ui-slots'
import type { ChatNodeViewProps, PerformanceUsageInjected, TurnTailOwnerProps } from '../contract/slots.ts'
import { MessageIconActions } from './MessageIconActions.tsx'
import { TurnUsagePanel } from './TurnUsagePanel.tsx'
import { assistantText } from './turn-assistant.ts'
import { hasAssistantReplyContent } from '../contract/assistant-content.ts'
import type { ChatNode } from '../contract/chat-nodes.ts'
import type { ChatSnapshot } from '../contract/snapshot.ts'
import css from './TurnTailNodeView.module.css'

type TurnTailNodeViewProps = ChatNodeViewProps<'turn-tail'>
  & PropsRenderSlots<'conversation.chat.turnTail' | 'conversation.chat.assistant-actions'>
  & InjectFace<PerformanceUsageInjected>

/** Opening human prompt of one Turn, when the Turn was opened by one. */
function turnOpeningInput(
  snapshot: ChatSnapshot,
  turn: number,
): Extract<ChatNode, { kind: 'user' }> | undefined {
  for (const key of snapshot.locations.getTurn(turn)) {
    const node = snapshot.nodes.get(key) as ChatNode | undefined
    if (node?.kind === 'user') return node
  }
  return undefined
}

function lastContent(snapshot: ChatSnapshot, turn: number, skipWarning: boolean): ChatNode | undefined {
  const keys = snapshot.locations.getTurn(turn)
  for (let index = keys.length - 1; index >= 0; index--) {
    const node = snapshot.nodes.get(keys[index] as string) as ChatNode | undefined
    if (node === undefined || node.kind === 'turn-tail' || node.kind === 'turn-process'
      || (skipWarning && node.kind === 'turn-max-tokens')) continue
    return node
  }
  return undefined
}

/** Turn-local actions and feature tail over the Location index, independent of Assistant placement. */
export const TurnTailNodeView = memo(function TurnTailNodeView({
  node, openFile, forkAt, renderSlot, t, useAccess, useChat, usePerformanceUsage,
}: TurnTailNodeViewProps) {
  const detailed = usePerformanceUsage(mode => mode) === 'detailed'
  const forkAllowed = useAccess('session/fork')
  const data = node.data
  const hasLaterChatNode = useChat(snapshot =>
    (lastContent(snapshot, data.turn, true)?.anchorSeq ?? -1) > (data.closing?.finalNode.seq ?? data.seq))
  // A retracted exchange stays visible but cannot seed a fork: the child would
  // otherwise inherit the removed history without the retraction event.
  const retractedTurn = useChat(snapshot =>
    turnOpeningInput(snapshot, data.turn)?.data.retracted === true)
  const endsWithResponse = useChat((snapshot) => {
    if (snapshot.timeline.turnOrder.at(-1) !== data.turn) return false
    const last = lastContent(snapshot, data.turn, false)
    const block = last?.kind === 'assistant-step' ? last.data.blocks.findLast(candidate =>
      (candidate.kind !== 'text' && candidate.kind !== 'reasoning') || candidate.text.trim() !== '') : undefined
    return block !== undefined && hasAssistantReplyContent([block])
  })
  const turn = node.location.kind === 'turn' || node.location.kind === 'step'
    ? node.location.turn
    : undefined
  if (turn === undefined) return null
  const closing = data.closing
  const owner: TurnTailOwnerProps = { turn, seq: closing?.finalNode.seq ?? data.seq, openFile }
  const tail = renderSlot('conversation.chat.turnTail', owner)
  if (closing === null) return tail === null ? null : <div className={css.root} data-turn-tail={data.turn}>{tail}</div>
  // Interruption-frozen partials carry no messageId, so they address no
  // durable message and contribute no per-message actions.
  const messageId = closing.finalNode.messageId
  const assistantActions = messageId === undefined
    ? null
    : renderSlot('conversation.chat.assistant-actions', { messageId })
  return (
    <div
      className={css.root}
      data-turn-tail={data.turn}
      data-actions-reveal={endsWithResponse ? 'always' : 'hover'}
    >
      {tail}
      <MessageIconActions
        text={assistantText(closing.blocks)}
        time={closing.time}
        clock="end"
        // The branch action owns boundary resolution: it sends the real
        // turn/end seq it already has, and the Host cuts exactly there.
        onBranch={forkAllowed ? () => { forkAt(data.seq) } : undefined}
        branchUnavailable={data.branchUnavailable || hasLaterChatNode || retractedTurn}
        className={css.actions}
        extraActions={assistantActions}
        usageAction={detailed && data.tokenUsage !== undefined
          ? <TurnUsagePanel usage={data.tokenUsage} t={t} />
          : null}
        t={t}
      />
    </div>
  )
})
