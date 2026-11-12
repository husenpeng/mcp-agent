/**
 * Member context construction: one bounded user message per wake, built from
 * the messages a member has not read. A long gap collapses into a deterministic
 * summary so the member never receives the whole room history.
 * @module @tomato/experimental-robot-room
 */

import type { RoomAuthor, RoomMemberId, RoomMessage } from './types.ts'
import { clampText } from './protocol.ts'

/** What woke a member. */
export interface WakeReason {
  /** Why the member runs now. */
  readonly kind: 'human' | 'mention' | 'request' | 'reply' | 'handoff'
  /** One sentence the model reads first. */
  readonly detail: string
  /** Messages that directly caused the wake. */
  readonly messageSeqs: readonly number[]
}

/** One built member input. */
export interface MemberInput {
  /** Text delivered as the user message. */
  readonly text: string
  /** Sequence the member had read before this wake. */
  readonly fromSeq: number
  /** Highest sequence included. */
  readonly toSeq: number
  /** Messages included raw. */
  readonly included: number
  /** Whether older unread messages collapsed into a summary. */
  readonly summarized: boolean
}

/** Input accepted by {@link buildMemberInput}. */
export interface MemberInputOptions {
  /** Member the message is for. */
  readonly member: RoomMemberId
  /** Member display labels by id. */
  readonly labels: ReadonlyMap<string, string>
  /** Every message in the room, oldest first. */
  readonly messages: readonly RoomMessage[]
  /** Sequence the member read last; `0` for a new member. */
  readonly fromSeq: number
  /** Raw messages the incremental window may hold. */
  readonly window: number
  /** Characters kept from one message. */
  readonly messageChars: number
  /** Characters kept from the summary. */
  readonly summaryChars: number
  /** Characters kept from the wake message. */
  readonly triggerChars: number
  /** What woke the member. */
  readonly wake: WakeReason
  /** Rolling summary the provider maintains, when one exists. */
  readonly summary?: string
}

/** One rendered line. */
interface Line {
  readonly seq: number
  readonly text: string
}

/**
 * Human-readable label of one author.
 * @param author - message author.
 * @param labels - member display labels by id.
 * @returns the label the model reads.
 */
export function authorLabel(author: RoomAuthor, labels: ReadonlyMap<string, string>): string {
  if (author.kind === 'human') return author.name
  if (author.kind === 'system') return 'system'
  return labels.get(author.id) ?? author.id
}

/**
 * Whether a member may see one message. Private A2A is visible only to its
 * sender and receivers; every other message is room-visible.
 * @param message - room message.
 * @param member - reading member.
 * @returns whether the member's model may read it.
 */
export function visibleTo(message: RoomMessage, member: RoomMemberId): boolean {
  const envelope = message.a2a
  if (envelope?.visibility !== 'private') return true
  return envelope.from === member || envelope.to.includes(member)
}

/**
 * One-line rendering of a message that is not a full chat turn.
 * @param message - room message.
 * @param labels - member display labels.
 * @returns the compact line, or an empty string when the message adds nothing.
 */
function compactLine(message: RoomMessage, labels: ReadonlyMap<string, string>): string {
  switch (message.kind) {
    case 'activity': {
      const activity = message.activity
      if (activity === undefined) return ''
      const tools = activity.tools.length === 0 ? '' : ` (${activity.tools.join(', ')})`
      return `${labels.get(message.author.kind === 'member' ? message.author.id : '') ?? 'member'} ${activity.done === true ? 'finished' : 'started'}: ${activity.label}${tools}`
    }
    case 'guard':
      return `guard: ${message.guard?.detail ?? message.text}`
    case 'episode':
      return `episode: ${message.text}`
    default:
      return ''
  }
}

/**
 * Render one message for a member.
 * @param message - room message.
 * @param labels - member display labels.
 * @param chars - character ceiling for chat text.
 * @returns the rendered line.
 */
export function renderMessage(message: RoomMessage, labels: ReadonlyMap<string, string>, chars: number): string {
  const compact = compactLine(message, labels)
  if (compact !== '') return compact
  const author = authorLabel(message.author, labels)
  const mentions = message.mentions.length === 0 ? '' : ` → ${message.mentions.map(id => `@${labels.get(id) ?? id}`).join(' ')}`
  const kind = message.kind === 'chat' ? '' : ` (${message.kind})`
  return `[#${message.seq}] ${author}${kind}${mentions}: ${clampText(message.text, chars)}`
}

/**
 * Build the deterministic summary of messages outside the raw window. It keeps
 * the first line and author of each message, oldest first, until the character
 * budget is spent.
 * @param messages - messages to summarize.
 * @param labels - member display labels.
 * @param chars - character ceiling.
 * @returns the summary text.
 */
export function fallbackSummary(messages: readonly RoomMessage[], labels: ReadonlyMap<string, string>, chars: number): string {
  const lines: string[] = []
  let used = 0
  for (const message of messages) {
    const author = authorLabel(message.author, labels)
    const compact = compactLine(message, labels)
    const body = compact !== '' ? compact : `${author}: ${message.text.replace(/\s+/gu, ' ').slice(0, 160)}`
    const line = `- ${body}`
    if (used + line.length + 1 > chars) break
    lines.push(line)
    used += line.length + 1
  }
  return lines.join('\n')
}

/**
 * Build the one user message a member reads on a wake.
 * @param options - member, messages, window, and wake reason.
 * @returns the bounded input and the sequences it covers.
 */
export function buildMemberInput(options: MemberInputOptions): MemberInput {
  const toSeq = options.messages.at(-1)?.seq ?? options.fromSeq
  const unread = options.messages.filter(message =>
    message.seq > options.fromSeq && visibleTo(message, options.member))
  const window = Math.max(1, options.window)
  const raw = unread.slice(-window)
  const older = unread.slice(0, Math.max(0, unread.length - raw.length))
  const lines: Line[] = raw.map(message => ({
    seq: message.seq,
    text: renderMessage(message, options.labels, options.messageChars),
  }))

  const parts: string[] = []
  if (older.length > 0) {
    const summary = options.summary !== undefined && options.summary.trim() !== ''
      ? clampText(options.summary, options.summaryChars)
      : fallbackSummary(older, options.labels, options.summaryChars)
    parts.push(`Earlier messages you have not read (summarized):\n${summary}`)
  }
  if (lines.length > 0) parts.push(lines.map(line => line.text).join('\n'))
  const triggers = options.messages.filter(message => options.wake.messageSeqs.includes(message.seq)
    && visibleTo(message, options.member))
  if (triggers.length > 0) {
    parts.push(`Why you were woken: ${options.wake.detail}\n${triggers
      .map(message => clampText(message.text, options.triggerChars)).join('\n')}`)
  } else {
    parts.push(`Why you were woken: ${options.wake.detail}`)
  }
  parts.push('Reply in the room with room_post, ask a peer with room_ask, answer a request with room_reply, or pass with room_pass.')
  return {
    text: parts.join('\n\n'),
    fromSeq: options.fromSeq,
    toSeq,
    included: lines.length,
    summarized: older.length > 0,
  }
}

/**
 * Number of unread messages a member has.
 * @param messages - room messages.
 * @param member - reading member.
 * @param fromSeq - sequence read last.
 * @returns the unread count.
 */
export function unreadCount(messages: readonly RoomMessage[], member: RoomMemberId, fromSeq: number): number {
  return messages.filter(message => message.seq > fromSeq && visibleTo(message, member)).length
}
