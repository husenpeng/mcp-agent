/**
 * Storage the engine writes through. The interface stays small on purpose: a
 * durable provider implements it over SQLite, an in-process test implements it
 * with maps, and the engine cannot tell them apart.
 */
import type { ThreadRef, Ticket, TicketId, Trigger, TriggerId } from './types.ts'

/** One stored ticket and the threads its work follows. */
export interface StoredTicket {
  readonly ticket: Ticket
  /** Threads whose new triggers reach this ticket. */
  readonly subscriptions: readonly ThreadRef[]
}

/**
 * What the engine needs from storage. Every write is atomic per call: a crash
 * between two calls leaves a state the next call can read, never a torn record.
 */
export interface SuperagentStore {
  /** Store one trigger; a second write of the same id changes nothing. */
  putTrigger(trigger: Trigger): void
  /** Read one trigger, when the store holds it. */
  trigger(id: TriggerId): Trigger | undefined
  /** Every stored trigger, oldest first. */
  triggers(): readonly Trigger[]
  /** Store one ticket with its subscriptions. */
  putTicket(entry: StoredTicket): void
  /** Read one ticket, when the store holds it. */
  ticket(id: TicketId): StoredTicket | undefined
  /** Every stored ticket, newest last. */
  tickets(): readonly StoredTicket[]
}

/**
 * Identity of one thread, so two sources cannot collide on a key they both chose.
 * @param thread - source-qualified thread.
 * @returns the storage key for that thread.
 */
export function threadKey(thread: ThreadRef): string {
  return `${thread.source}\u0000${thread.id}`
}

/** In-process store: the shape a durable provider has to reproduce. */
export class InMemoryStore implements SuperagentStore {
  readonly #triggers = new Map<TriggerId, Trigger>()
  readonly #tickets = new Map<TicketId, StoredTicket>()

  putTrigger(trigger: Trigger): void {
    if (this.#triggers.has(trigger.id)) return
    this.#triggers.set(trigger.id, trigger)
  }

  trigger(id: TriggerId): Trigger | undefined {
    return this.#triggers.get(id)
  }

  triggers(): readonly Trigger[] {
    return [...this.#triggers.values()]
  }

  putTicket(entry: StoredTicket): void {
    this.#tickets.set(entry.ticket.id, entry)
  }

  ticket(id: TicketId): StoredTicket | undefined {
    return this.#tickets.get(id)
  }

  tickets(): readonly StoredTicket[] {
    return [...this.#tickets.values()]
  }
}
