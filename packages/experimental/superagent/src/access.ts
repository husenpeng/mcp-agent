/**
 * Who may read whose Session: one optional Host service, so a deployment that
 * runs work in child Sessions can say which of them belong to the same work.
 * Without it, callers fall back to the repository-wide rule that a Session may
 * read only Sessions in its own directory.
 */
import type { SessionAccess } from '@tomato/session-query'
import type { SuperagentStore } from './store.ts'

/**
 * Grants a ticket's supervisor read access to every Session that ran its work.
 * The supervisor is the Session that accepted the ticket; the assignments name
 * the Sessions that carried it out, so a person reading a report can also read
 * what produced it.
 * @param store - storage holding the tickets.
 * @returns the access rule a deployment publishes as `ctx.sessionAccess`.
 */
export function createTicketSessionAccess(store: SuperagentStore): SessionAccess {
  return {
    allows: (caller, target) => store.tickets().some(entry => entry.ticket.supervisor === caller
      && entry.ticket.assignments.some(assignment => assignment.session === target)),
  }
}
