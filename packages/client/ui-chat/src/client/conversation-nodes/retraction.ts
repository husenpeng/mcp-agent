import type { Context } from '@tomato/cordis'
import type {
  ConversationMatch, ConversationNodeDefinition,
} from '@tomato/client-ui-conversation/client'
import type { ContentBlock } from '@tomato/llm/types'
import { isAppendSurfaceEvent } from '@tomato/session/surface'
import type { RetractionLogChatData } from '../contract/chat-nodes.ts'
import { chatNode } from './common.ts'

declare module '../contract/chat-nodes.ts' {
  interface ChatNodeDataMap {
    /** Durable audit row for one human retraction. */
    retraction: RetractionLogChatData
  }
}

interface RetractionLogState {
  readonly message: {
    readonly messageId: string
    readonly seq: number
    readonly time: number
    readonly content: readonly ContentBlock[]
  }
  readonly retraction?: ConversationMatch
}

/** Display names of the attachments carried by one retracted message. */
function attachmentNames(content: readonly ContentBlock[]): string[] {
  const names: string[] = []
  for (const block of content) {
    if (block.type === 'image') {
      names.push(block.attachment.name ?? String(block.attachment.attachmentId))
    } else if (block.type === 'file') {
      names.push(block.attachment.name)
    }
  }
  return names
}

/**
 * Audit row for a human retraction. This Definition matches the user message
 * and the retraction event without claiming either, so the message Definition
 * still owns the retracted bubble; this one only adds the durable log line.
 */
export const retractionLogDefinition: ConversationNodeDefinition<RetractionLogState> = {
  kind: 'retraction-log',
  target: 'chat',
  match: (event) => {
    if (event.type === 'user/message') {
      return isAppendSurfaceEvent(event) && event.data.source.kind === 'user'
        ? { id: String(event.data.id), role: 'start' }
        : null
    }
    if (event.type === 'conversation/retraction') {
      return { id: String(event.data.messageId), role: 'update' }
    }
    return null
  },
  start: (_context, match) => {
    if (match.event.type !== 'user/message') throw new Error('retraction-log start requires user/message')
    return {
      message: {
        messageId: String(match.event.data.id),
        seq: match.event.seq,
        time: match.event.time,
        content: match.event.data.content,
      },
    }
  },
  update: (context, match) => {
    if (match.event.type !== 'conversation/retraction') return context.state
    if (context.start?.event.type !== 'user/message'
      || context.start.event.seq !== match.event.data.startSeq) return context.state
    return { ...context.state, retraction: match }
  },
  buildViewNode: (context) => {
    const state = context.state
    if (state === undefined) return null
    const retraction = state.retraction
    if (retraction?.event.type !== 'conversation/retraction') return null
    const data: RetractionLogChatData = {
      messageId: state.message.messageId,
      seq: retraction.event.seq,
      time: retraction.event.time,
      attachments: attachmentNames(state.message.content),
    }
    return chatNode(context, 'retraction', retraction.event.seq, data, {
      location: { kind: 'session' },
    })
  },
}

/**
 * Register the human-retraction audit row.
 * @param ctx - owning UI Conversation context.
 */
export function registerRetractionLogConversationNode(ctx: Context): void {
  ctx.uiConversation.events.register(retractionLogDefinition)
}
