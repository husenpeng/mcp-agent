/**
 * Reading the team's ticket list out of the Session's own event window: the
 * runtime writes one record per cycle, so the panel needs no endpoint.
 */

/** One ticket as the runtime recorded it. */
export interface TicketRow {
  /** Ticket identity, as commands and reports name it. */
  readonly id: string
  /** What the work is. */
  readonly subject: string
  /** Where it stands: `working`, `person`, or `idle`. */
  readonly stage: string
  /** What it waits on at a person, when it waits. */
  readonly needs?: string | undefined
  /** State the last run reported. */
  readonly state?: string | undefined
  /** Blocking findings the review left. */
  readonly blocking: number
  /** How many reviews the work had. */
  readonly rounds: number
}

/** The plugin record type the runtime appends each cycle. */
export const TICKETS_RECORD = 'plugin:superagent/tickets'

/**
 * Read a field of an unknown object without trusting its type.
 * @param value - candidate object.
 * @param key - field to read.
 * @returns the field when it is a string, else undefined.
 */
export function textField(value: unknown, key: string): string | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const field = (value as Record<string, unknown>)[key]
  return typeof field === 'string' ? field : undefined
}

/**
 * Read a numeric field of an unknown object.
 * @param value - candidate object.
 * @param key - field to read.
 * @returns the field when it is a finite number, else undefined.
 */
export function numberField(value: unknown, key: string): number | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const field = (value as Record<string, unknown>)[key]
  return typeof field === 'number' && Number.isFinite(field) ? field : undefined
}

/**
 * Read the tickets a stored event carries.
 * @param type - event type.
 * @param data - event payload.
 * @returns the rows the record holds, oldest first; empty for any other record.
 */
export function rowsOf(type: string, data: unknown): readonly TicketRow[] {
  if (type !== TICKETS_RECORD || typeof data !== 'object' || data === null) return []
  const list = (data as { tickets?: unknown }).tickets
  if (!Array.isArray(list)) return []
  return list.flatMap((entry) => {
    const id = textField(entry, 'id')
    const subject = textField(entry, 'subject')
    if (id === undefined || subject === undefined) return []
    return [{
      id,
      subject,
      stage: textField(entry, 'stage') ?? 'working',
      needs: textField(entry, 'needs'),
      state: textField(entry, 'state'),
      blocking: numberField(entry, 'blocking') ?? 0,
      rounds: numberField(entry, 'rounds') ?? 0,
    }]
  })
}

/**
 * Keep the newest ticket list from a sequence of events.
 * @param events - session events in log order.
 * @returns the tickets the newest record carries.
 */
export function latestTickets(
  events: readonly { readonly type: string; readonly event?: unknown; readonly data?: unknown }[],
): readonly TicketRow[] {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index]
    if (event === undefined || event.type !== TICKETS_RECORD) continue
    // A live entry carries its payload beside the envelope, not inside `data`.
    const envelope = event.event as { readonly data?: unknown } | undefined
    return rowsOf(event.type, event.data ?? envelope?.data)
  }
  return []
}
