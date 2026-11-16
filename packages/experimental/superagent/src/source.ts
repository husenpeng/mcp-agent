/**
 * The bot surface a source talks to: a cursor page of inbound events, the
 * context of one conversation, and a reply into it. A deployment implements it
 * over the im_service bot API; a test implements it with a queue.
 */
import { intake } from './index.ts'
import type {} from '@tomato/cordis'
import type { IntakeOutcome } from './engine.ts'
import type { SuperagentStore } from './store.ts'
import type { ChannelRef, ThreadRef, TicketId, Trigger, TriggerId } from './types.ts'

/** One inbound message as the bot service reports it. */
export interface BotEvent {
  /** Cursor the service gave the event; the next poll starts after it. */
  readonly cursor: number
  /** Identity the source assigned; a repeat is the same event. */
  readonly eventId: string
  /** Message the reply belongs under. */
  readonly messageId: string
  /** Conversation the message arrived in. */
  readonly chatId: string
  /** `p2p` for a direct message, `group` for a conversation. */
  readonly chatType: string
  /** Message kind, such as `text`. */
  readonly messageType: string
  /** Raw content payload, JSON for a text message. */
  readonly content: string
  readonly senderOpenId: string
  /** Whether this message addressed the agent in a group. */
  readonly mentionsBot: boolean
  /** Topic container id, when the message is a topic reply. */
  readonly threadId?: string
  /** Root message of the topic; every reply in one topic shares it. */
  readonly rootId?: string
}

/** One message of a conversation, as the bot service read it. */
export interface BotThreadMessage {
  readonly messageId: string
  readonly senderOpenId?: string
  readonly messageType: string
  readonly text: string
}

/** What one page of conversation context reported. */
export interface BotThread {
  /** `feishu` when the full history was read; `log` when only local events were. */
  readonly source: string
  readonly items: readonly BotThreadMessage[]
}

/** One page of inbound events. */
export interface BotEventsPage {
  readonly items: readonly BotEvent[]
  /** Cursor the next poll continues from. */
  readonly nextCursor: number
}

/** The bot service a source reads events from and replies through. */
declare module '@tomato/cordis' {
  interface Context {
    /** Bot service a deployment published, when it supplies its own instead of the HTTP client. */
    botGateway?: BotGateway
  }
}

export interface BotGateway {
  /** Read the events after a cursor. */
  events(cursor: number, limit: number): Promise<BotEventsPage>
  /** Read one conversation's context. */
  thread(chatId: string, messageId: string): Promise<BotThread>
  /** Reply under one message. */
  reply(chatId: string, messageId: string, text: string): Promise<{ readonly messageId: string }>
}

/** What one poll did. */
export interface PollOutcome {
  /** Cursor the next poll continues from. */
  readonly nextCursor: number
  /** The events the page carried, oldest first. */
  readonly events: readonly BotEvent[]
  /** One outcome per event, in the same order. */
  readonly outcomes: readonly IntakeOutcome[]
}

/** Text a Feishu content payload carries, or the payload itself when it carries none. */
export function contentText(content: string): string {
  try {
    const parsed: unknown = JSON.parse(content)
    if (typeof parsed === 'object' && parsed !== null && 'text' in parsed && typeof parsed.text === 'string') {
      return parsed.text
    }
  } catch {
    // A payload that is not JSON is already the text the service saw.
  }
  return content
}

/**
 * The conversation one event belongs to. The topic root names it, so the
 * message that started a topic and every reply under it share one thread and
 * later messages reach the same ticket.
 * @param event - inbound event.
 * @returns the source-qualified thread.
 */
export function threadOf(event: BotEvent): ThreadRef {
  return { source: 'feishu', id: `${event.chatId}:${event.rootId ?? event.messageId}` }
}

/** Where a reply to one event belongs. */
export function channelOf(event: BotEvent): ChannelRef {
  return { source: 'feishu', address: { chatId: event.chatId, messageId: event.messageId } }
}

/**
 * Translate one bot event into the domain trigger.
 * @param event - inbound event as the bot service reported it.
 * @param botOpenId - the agent's own open id, so its own messages are not requests.
 * @returns the trigger to store.
 */
export function toTrigger(event: BotEvent, botOpenId?: string): Trigger {
  const addressed: 'mention' | 'direct' | undefined = event.mentionsBot
    ? 'mention'
    : event.chatType === 'p2p' ? 'direct' : undefined
  return {
    id: `feishu:${event.eventId}` as TriggerId,
    source: 'feishu',
    threads: [threadOf(event)],
    actor: event.senderOpenId as Trigger['actor'],
    human: event.senderOpenId !== botOpenId,
    ...addressed === undefined ? {} : { addressed },
    at: new Date().toISOString(),
    text: contentText(event.content),
    channel: channelOf(event),
    meta: { chatType: event.chatType, messageType: event.messageType },
  }
}

/**
 * Read one page of inbound events and hand each new one to the engine.
 * @param store - storage the engine writes through.
 * @param gateway - bot service to read from.
 * @param cursor - last cursor the caller processed.
 * @param limit - most events to read in one page.
 * @param botOpenId - the agent's own open id, when the deployment knows it.
 * @returns the next cursor and what each event did.
 */
export async function pollFeishu(
  store: SuperagentStore,
  gateway: BotGateway,
  cursor: number,
  limit: number,
  botOpenId?: string,
): Promise<PollOutcome> {
  const page = await gateway.events(cursor, limit)
  const outcomes = page.items.map(event => intake(store, toTrigger(event, botOpenId)))
  return { nextCursor: page.nextCursor, events: page.items, outcomes }
}

/**
 * Reply into the conversation a ticket's channel names.
 * @param gateway - bot service to send through.
 * @param channel - the channel the work came from.
 * @param text - plain text to send.
 * @returns the id of the message the service created.
 * @throws {@link Error} when the channel did not come from this source.
 */
export async function replyTo(gateway: BotGateway, channel: ChannelRef, text: string): Promise<string> {
  const chatId = channel.address.chatId
  const messageId = channel.address.messageId
  if (channel.source !== 'feishu' || chatId === undefined || messageId === undefined) {
    throw new Error('a reply needs a feishu channel carrying a chat and a message')
  }
  const sent = await gateway.reply(chatId, messageId, text)
  return sent.messageId
}

/**
 * What one cycle says in the conversation its request arrived in. A person who
 * asked for work needs the answer where they asked, not in a log.
 * @param verdict - what intake decided for the request.
 * @param worked - how the work it opened went, in the order it ran.
 * @returns one line, or undefined when there is nothing to say.
 */
export function reportText(
  verdict: CycleVerdictText,
  worked: readonly { readonly state: string }[],
): string | undefined {
  if (verdict.kind === 'declined') return `Not taken: ${verdict.reason}`
  // A refused request was recorded with its reason; only an accepted one needs an answer.
  if (verdict.kind === 'continued' || verdict.kind === 'refused') return undefined
  const subjects = verdict.tickets.map(ticket => ticket.subject)
  const states = worked.map(outcome => outcome.state)
  const lines = [
    subjects.length === 1 ? `Opened: ${subjects[0]}` : `Opened ${String(subjects.length)} tickets:`,
    ...subjects.length === 1 ? [] : subjects.map(subject => `- ${subject}`),
  ]
  if (states.length > 0) lines.push(`State: ${[...new Set(states)].join(', ')}`)
  return lines.join('\n')
}

/** The part of a cycle verdict a reply reads. */
export type CycleVerdictText =
  | { readonly kind: 'declined'; readonly reason: string }
  | { readonly kind: 'continued' }
  | { readonly kind: 'refused' }
  | { readonly kind: 'accepted'; readonly tickets: readonly { readonly subject: string }[] }

/** Tickets an intake reached, for a caller that only needs the ids. */
export type ReachedTickets = readonly TicketId[]
