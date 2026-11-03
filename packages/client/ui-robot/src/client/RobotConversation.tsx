/** Conversation host bound to one robot run's Session, rendered inside the robot page. */
import type { ReactNode } from 'react'
import type { PropsRenderFactories, PropsRuntime } from '@tomato/client-ui-slots'
import type { ConversationViewsProps } from '@tomato/client-ui-conversation/client'

/** Fixed chat view used by the embedded Conversation occurrence. */
export function RobotChatView(props: ConversationViewsProps): ReactNode {
  return <>{props.renderSlot('conversation.session', { view: 'chat' })}</>
}

/** Props supplied to the robot Conversation host (Session scope). */
export type RobotConversationProps = PropsRuntime<'robots.conversation'> & PropsRenderFactories

/**
 * Render the shared Conversation content for the run Session bound around this slot.
 * @param props - Session-scope runtime props and the factory renderer.
 * @returns the embedded Conversation occurrence.
 */
export function RobotConversation({
  sessionId, useSession, useConversation, useSessions, renderFactorySlot,
}: RobotConversationProps): ReactNode {
  const session = useSession(value => value)
  const conversation = useConversation(value => value)
  const active = conversation.activeTargets.size > 0
    || (!session.blank && !session.awaitingFirstTurn)
    || session.running
  const shellPhase = active ? 'active' : session.promptAttempted ? 'engaging' : 'blank'
  const summaryBlank = useSessions(state => state.byId[sessionId]?.blank)
  const parentAvailabilityPending = session.subagent?.address.mode === 'continuable'
    && session.subagent.parentAvailable === undefined
  const settling = (shellPhase === 'blank' && session.openState === 'loading' && summaryBlank !== true)
    || parentAvailabilityPending
  const hero = shellPhase === 'blank' && (session.openState === 'open' || summaryBlank === true)
  const phase = settling ? 'settling' : hero ? 'hero' : 'active'
  return renderFactorySlot('conversation.content', { variant: 'embedded', phase, hero }, {
    slots: { views: RobotChatView },
  })
}
