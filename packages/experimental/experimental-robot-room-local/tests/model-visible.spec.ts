import { emptyRoomSpec } from '@tomato/experimental-robot-room'
import type { RoomSpec } from '@tomato/experimental-robot-room'
import { describe, expect, it } from 'vitest'
import { memberCharter } from '../src/prompt.ts'
import { roomToolDefinitions } from '../src/tools.ts'
import type { RoomToolHost } from '../src/tools.ts'

const host: RoomToolHost = {
  post: async () => ({ ok: true, text: 'posted' }),
  ask: async () => ({ ok: true, text: 'asked' }),
  reply: async () => ({ ok: true, text: 'replied' }),
  read: async () => ({ ok: true, text: 'read' }),
  pass: async () => ({ ok: true, text: 'passed' }),
}

function spec(): RoomSpec {
  return emptyRoomSpec({
    name: '竞品周报',
    charter: '每周产出竞品投放周报：研究员取数，写手成稿，审核员把关。',
    members: [
      { id: 'coord', robot: 'coord-bot', revision: 1, name: '协调员', role: 'coordinator' },
      { id: 'research', robot: 'research-bot', revision: 1, name: '研究员', role: 'worker' },
      { id: 'review', robot: 'review-bot', revision: 1, name: '审核员', role: 'reviewer' },
    ],
  })
}

describe('model-visible room contract', () => {
  it('renders the member charter, roster, and channel rules', () => {
    const room = spec()
    const member = room.members[1]!
    expect(memberCharter(room, member)).toMatchInlineSnapshot(`
      "## Room: 竞品周报

      每周产出竞品投放周报：研究员取数，写手成稿，审核员把关。

      ## Members
      - 协调员 (coordinator)
      - 研究员 (worker)
      - 审核员 (reviewer)

      You are 研究员 (worker) in this room. The room log is the only channel: every message you post is visible to the operator and every member. Use room_post to speak, room_ask to delegate or ask, room_reply to answer, room_read to read more, and room_pass when the message does not need you."
    `)
  })

  it('exposes the five room tools and their descriptions', () => {
    expect(roomToolDefinitions(host).map(definition => ({
      name: definition.name,
      description: definition.description,
      parameters: definition.parameters,
    }))).toMatchInlineSnapshot(`
      [
        {
          "description": "Post a message in this room. Every member and the operator can see it. Mention members to address them; a mention wakes them when they are enabled. Use this for a result, a question to the room, or a short status; do not narrate routine progress.",
          "name": "room_post",
          "parameters": {
            "properties": {
              "mentions": {
                "description": "Member names or ids to address.",
                "items": {
                  "type": "string",
                },
                "type": "array",
              },
              "text": {
                "description": "Message text, at most 4000 characters.",
                "type": "string",
              },
            },
            "required": [
              "text",
            ],
            "type": "object",
          },
        },
        {
          "description": "Ask one or more peers to do something. This returns as soon as the room accepts the request; the peer answers later in the room. Use request for a question, delegate for a piece of work, and handoff to finish your turn.",
          "name": "room_ask",
          "parameters": {
            "properties": {
              "context": {
                "description": "Facts the peer needs; omit what it can read from the room.",
                "type": "string",
              },
              "intent": {
                "description": "What you ask for.",
                "enum": [
                  "request",
                  "delegate",
                  "handoff",
                ],
                "type": "string",
              },
              "task": {
                "description": "The outcome the peer must produce.",
                "type": "string",
              },
              "to": {
                "description": "Member names or ids to ask.",
                "items": {
                  "type": "string",
                },
                "type": "array",
              },
            },
            "required": [
              "to",
              "intent",
              "task",
            ],
            "type": "object",
          },
        },
        {
          "description": "Answer one room request addressed to you. The reply is visible in the room and wakes the requester when it is waiting. Use done when the requested outcome is complete, partial when some work remains, and declined when you cannot do it.",
          "name": "room_reply",
          "parameters": {
            "properties": {
              "replyTo": {
                "description": "Message id of the request.",
                "type": "string",
              },
              "status": {
                "description": "How the request settled.",
                "enum": [
                  "done",
                  "partial",
                  "declined",
                ],
                "type": "string",
              },
              "text": {
                "description": "Answer text.",
                "type": "string",
              },
            },
            "required": [
              "replyTo",
              "text",
              "status",
            ],
            "type": "object",
          },
        },
        {
          "description": "Read room messages after a sequence, including messages you have not been woken for. Use it when the wake summary cuts context you need; it is bounded and counts against this turn.",
          "name": "room_read",
          "parameters": {
            "properties": {
              "afterSeq": {
                "description": "Read messages after this sequence; omit to start from the beginning of the visible window.",
                "type": "integer",
              },
              "limit": {
                "description": "Maximum messages to return, at most 50.",
                "type": "integer",
              },
            },
            "type": "object",
          },
        },
        {
          "description": "End this turn without adding anything to the room. Use it when the message does not need you; the room records that you passed without posting a visible message.",
          "name": "room_pass",
          "parameters": {
            "properties": {},
            "type": "object",
          },
        },
      ]
    `)
  })

  it('binds tool execution to the member-facing host operations', async () => {
    const tools = roomToolDefinitions(host)
    expect(tools.map(tool => tool.name)).toEqual(['room_post', 'room_ask', 'room_reply', 'room_read', 'room_pass'])
    expect(await tools[0]!.execute({ text: 'hi', mentions: ['research'] }, undefined as never)).toEqual({ ok: true, text: 'posted' })
    expect(await tools[1]!.execute({ to: ['research'], intent: 'request', task: 'task' }, undefined as never)).toEqual({ ok: true, text: 'asked' })
    expect(await tools[2]!.execute({ replyTo: 'm1', text: 'answer', status: 'done' }, undefined as never)).toEqual({ ok: true, text: 'replied' })
    expect(await tools[3]!.execute({ afterSeq: 0, limit: 2 }, undefined as never)).toEqual({ ok: true, text: 'read' })
    expect(await tools[4]!.execute({}, undefined as never)).toEqual({ ok: true, text: 'passed' })
  })
})
