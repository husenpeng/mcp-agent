/**
 * Member-facing room tools. Every tool only proposes a message to the host;
 * the host admits it, writes the log, and decides whether any member wakes.
 * @module @tomato/experimental-robot-room-local
 */

import type { Context } from '@tomato/cordis'
import { defineTool } from '@tomato/tools'
import type { ToolDefinition } from '@tomato/tools'
import type { ContentBlock } from '@tomato/llm'
import type { RoomMemberId } from '@tomato/experimental-robot-room'

/** Tools a member must not reach because they bypass the room log. */
export const BYPASS_TOOLS = [
  'send_message', 'subagent', 'subagent_fork', 'interrupt_agent', 'list_agents', 'workflow',
  'spawn_teammate', 'team_task_create', 'team_task_update', 'team_task_list', 'team_task_get', 'wait_agent',
] as const

/** One room tool outcome. */
export interface RoomToolResult {
  /** Whether the host accepted the proposal. */
  readonly ok: boolean
  /** Text the model reads: the accepted message id, or the refusal code and detail. */
  readonly text: string
}

/** Host operations one member's tools call. */
export interface RoomToolHost {
  /** Propose a chat message visible in the room. */
  post(text: string, mentions: readonly string[]): Promise<RoomToolResult>
  /** Propose an asynchronous A2A request or delegation. */
  ask(to: readonly string[], intent: 'request' | 'delegate' | 'handoff', task: string, context: string | undefined): Promise<RoomToolResult>
  /** Answer one A2A request. */
  reply(replyTo: string, text: string, status: 'done' | 'partial' | 'declined'): Promise<RoomToolResult>
  /** Read room messages after a sequence. */
  read(afterSeq: number | undefined, limit: number | undefined): Promise<RoomToolResult>
  /** Record that this turn has nothing to add. */
  pass(): Promise<RoomToolResult>
}

/** Read one string-valued tool argument. */
function textArg(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/** Render one room tool result as a text block. */
function render(_args: unknown, value: unknown): ContentBlock[] {
  const result = value as RoomToolResult
  return [{ type: 'text', text: result.text }]
}

const RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ok: { type: 'boolean', required: true },
    text: { type: 'string', required: true },
  },
} as const

/**
 * Build the five model-facing room tools for one room-bound host.
 * @param host - host operations bound to this room.
 * @returns tool definitions in registration order.
 */
export function roomToolDefinitions(host: RoomToolHost): readonly ToolDefinition[] {
  return [
    defineTool({
      name: 'room_post',
      description: 'Post a message in this room. Every member and the operator can see it. '
      + 'Mention members to address them; a mention wakes them when they are enabled. '
      + 'Use this for a result, a question to the room, or a short status; do not narrate routine progress.',
      parameters: {
        text: { type: 'string', required: true, description: 'Message text, at most 4000 characters.' },
        mentions: { type: 'array', items: { type: 'string' }, description: 'Member names or ids to address.' },
      },
      output: { schema: RESULT_SCHEMA, render },
      execute: async args => await host.post(
        textArg((args as { text?: unknown }).text),
        Array.isArray((args as { mentions?: unknown }).mentions) ? (args as { mentions: unknown[] }).mentions.map(String) : [],
      ),
    }),
    defineTool({
      name: 'room_ask',
      description: 'Ask one or more peers to do something. This returns as soon as the room accepts the request; '
      + 'the peer answers later in the room. Use request for a question, delegate for a piece of work, and handoff to finish your turn.',
      parameters: {
        to: { type: 'array', required: true, items: { type: 'string' }, description: 'Member names or ids to ask.' },
        intent: { type: 'string', required: true, enum: ['request', 'delegate', 'handoff'], description: 'What you ask for.' },
        task: { type: 'string', required: true, description: 'The outcome the peer must produce.' },
        context: { type: 'string', description: 'Facts the peer needs; omit what it can read from the room.' },
      },
      output: { schema: RESULT_SCHEMA, render },
      execute: async (args) => {
        const input = args as { to?: unknown; intent?: unknown; task?: unknown; context?: unknown }
        const intent = input.intent === 'delegate' || input.intent === 'handoff' ? input.intent : 'request'
        return await host.ask(
          Array.isArray(input.to) ? input.to.map(String) : [],
          intent,
          textArg(input.task),
          typeof input.context === 'string' ? input.context : undefined,
        )
      },
    }),
    defineTool({
      name: 'room_reply',
      description: 'Answer one room request addressed to you. The reply is visible in the room and wakes the requester when it is waiting. '
      + 'Use done when the requested outcome is complete, partial when some work remains, and declined when you cannot do it.',
      parameters: {
        replyTo: { type: 'string', required: true, description: 'Message id of the request.' },
        text: { type: 'string', required: true, description: 'Answer text.' },
        status: { type: 'string', required: true, enum: ['done', 'partial', 'declined'], description: 'How the request settled.' },
      },
      output: { schema: RESULT_SCHEMA, render },
      execute: async (args) => {
        const input = args as { replyTo?: unknown; text?: unknown; status?: unknown }
        const status = input.status === 'partial' || input.status === 'declined' ? input.status : 'done'
        return await host.reply(textArg(input.replyTo), textArg(input.text), status)
      },
    }),
    defineTool({
      name: 'room_read',
      description: 'Read room messages after a sequence, including messages you have not been woken for. '
      + 'Use it when the wake summary cuts context you need; it is bounded and counts against this turn.',
      parameters: {
        afterSeq: { type: 'integer', description: 'Read messages after this sequence; omit to start from the beginning of the visible window.' },
        limit: { type: 'integer', description: 'Maximum messages to return, at most 50.' },
      },
      output: { schema: RESULT_SCHEMA, render },
      execute: async (args) => {
        const input = args as { afterSeq?: unknown; limit?: unknown }
        return await host.read(
          typeof input.afterSeq === 'number' ? input.afterSeq : undefined,
          typeof input.limit === 'number' ? input.limit : undefined,
        )
      },
    }),
    defineTool({
      name: 'room_pass',
      description: 'End this turn without adding anything to the room. Use it when the message does not need you; '
      + 'the room records that you passed without posting a visible message.',
      parameters: {},
      output: { schema: RESULT_SCHEMA, render },
      execute: async () => await host.pass(),
    }),
  ]
}

/**
 * Register the five room tools in one member's scoped context and deny every
 * tool that could contact an agent outside the room log.
 * @param agentCtx - scoped context of the member's Agent.
 * @param member - member the tools act as.
 * @param host - host operations bound to this room.
 */
export function registerRoomTools(agentCtx: Context, member: RoomMemberId, host: RoomToolHost): void {
  const tools = agentCtx.get('tools')
  if (tools === undefined) return
  const deny = BYPASS_TOOLS.filter(name => tools.get(name) !== undefined)
  if (deny.length > 0) tools.restrict({ deny })
  for (const definition of roomToolDefinitions(host)) tools.register(definition)
  void member
}
