/** Model-visible room charter shared by member Sessions and its contract test. */
import type { RoomMemberSpec, RoomSpec } from '@tomato/experimental-robot-room'

/**
 * Render the system-prompt section a member sees for one room.
 * @param spec - published room specification.
 * @param member - member whose turn is starting.
 * @returns the charter, roster, role, and channel rules.
 */
export function memberCharter(spec: RoomSpec, member: RoomMemberSpec): string {
  return `## Room: ${spec.name}\n\n${spec.charter}\n\n`
    + `## Members\n${spec.members.map(candidate => `- ${candidate.displayName ?? candidate.id} (${candidate.role})`).join('\n')}\n\n`
    + `You are ${member.displayName ?? member.id} (${member.role}) in this room. `
    + 'The room log is the only channel: every message you post is visible to the operator and every member. '
    + 'Use room_post to speak, room_ask to delegate or ask, room_reply to answer, '
    + 'room_read to read more, and room_pass when the message does not need you.'
}
