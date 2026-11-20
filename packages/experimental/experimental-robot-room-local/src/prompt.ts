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

/**
 * Render the instruction one member reads before its mandatory self-review.
 * @returns the self-review section, including the verdict format.
 */
export function selfReviewInstruction(): string {
  return '## Self-review\n\n'
    + 'Audit what you just produced before it leaves you: the result itself, and the message you are about to send '
    + 'another member when this turn ends in a handoff.\n'
    + 'Check that it answers the task you were given, that every claim rests on what you actually saw, '
    + 'and that the next member has everything it needs.\n'
    + 'End with one verdict line, then one bullet per problem you found; list no bullets when the work passes:\n\n'
    + 'REVIEW: pass\n\n'
    + 'A failing verdict returns the work to you and delivers nothing.'
}
/**
 * Render the instruction one member reads when its self-review did not pass.
 * @param findings - problems the member listed in its own review.
 * @returns the rework instruction naming what must change.
 */
export function reworkInstruction(findings: readonly string[]): string {
  const list = findings.length === 0
    ? '- your self-review failed without naming a problem; check the result against the task.'
    : findings.map(finding => `- ${finding}`).join('\n')
  return `Your self-review did not pass. Fix what it found and answer the task again:\n\n${list}`
}

/**
 * Render the instruction one reviewer member reads before accepting a request.
 * @param subject - what the operator asked for.
 * @param results - finished results the request produced, in ticket order.
 * @returns the acceptance instruction, including the verdict format.
 */
export function acceptanceInstruction(subject: string, results: readonly string[]): string {
  const list = results.length === 0 ? '- (no result was recorded)' : results.map(result => `- ${result}`).join('\n')
  return `## Acceptance\n\nYou are the acceptance reviewer for this request:\n\n${subject}\n\n`
    + `The members reported these results:\n\n${list}\n\n`
    + 'Check that the request is met and that the results rest on what the members actually saw.\n'
    + 'End with one verdict line, then one bullet per blocking problem; list no bullets when the request passes:\n\n'
    + 'REVIEW: pass'
}
