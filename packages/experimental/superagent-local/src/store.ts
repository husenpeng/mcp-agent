/**
 * Durable storage for the engine: one `tomato_superagent` domain with a table
 * for triggers and one for tickets. The store keeps a writable mirror in memory
 * so the engine's synchronous reads stay synchronous, and queues every write in
 * order; `flush()` resolves once the queue is durable.
 */
import type { Context } from '@tomato/cordis'
import { brandString } from '@tomato/branded'
import { z } from 'zod'
import { defineDomain, domainTable } from '@tomato/storage-domain'
import type { StoredTicket, SuperagentStore } from '@tomato/superagent'
import type { Branded } from '@tomato/branded'
import type {
  ActorId,
  AssignmentId,
  MandateId,
  TicketId,
  Trigger,
  TriggerId,
} from '@tomato/superagent'

/**
 * Brand one stored identity with its own contract type.
 * @param schema - string field the identity is stored in.
 * @returns the field, narrowed to the branded identity.
 */
function idOf<T extends Branded<string>>(schema: z.ZodString) {
  return schema.transform(value => brandString<T>(value))
}

const threadRefSchema = z.object({ source: z.string().min(1), id: z.string().min(1) })

const channelRefSchema = z.object({
  source: z.string().min(1),
  address: z.record(z.string(), z.string()),
})

const mandateSchema = z.object({
  id: idOf<MandateId>(z.string().min(1)),
  policyVersion: z.string(),
  scope: z.enum(['investigate', 'change', 'release']),
  strength: z.enum(['explicit', 'proposed']),
  matchedRules: z.array(z.string()),
  sender: idOf<ActorId>(z.string().min(1)),
  thread: threadRefSchema,
  at: z.string().min(1),
})

const reportSchema = z.object({
  state: z.enum(['progress', 'waiting', 'ready', 'blocked', 'failed', 'dropped']),
  summary: z.string().optional(),
  question: z.string().optional(),
})

const assignmentSchema = z.object({
  id: idOf<AssignmentId>(z.string().min(1)),
  session: z.string().min(1),
  directory: z.string().min(1),
  ended: z.boolean(),
  report: reportSchema.optional(),
})

const findingSchema = z.object({
  summary: z.string().min(1),
  severity: z.enum(['p0', 'p1', 'p2']),
  file: z.string().min(1),
  line: z.number().int().nonnegative().optional(),
})

const verdictSchema = z.object({
  findings: z.array(findingSchema),
  rounds: z.number().int().nonnegative(),
})

const ticketSchema = z.object({
  id: idOf<TicketId>(z.string().min(1)),
  subject: z.string().min(1),
  mandate: mandateSchema,
  supervisor: z.string().min(1),
  follows: z.array(threadRefSchema),
  stopped: z.boolean(),
  ended: z.boolean(),
  assignments: z.array(assignmentSchema),
  review: verdictSchema.optional(),
})

/** Durable shape of one stored ticket, shared by stores that keep the engine's work records. */
export const storedTicketSchema = z.object({ ticket: ticketSchema, subscriptions: z.array(threadRefSchema) })

const triggerSchema = z.object({
  id: idOf<TriggerId>(z.string().min(1)),
  source: z.string().min(1),
  threads: z.array(threadRefSchema),
  actor: idOf<ActorId>(z.string().min(1)),
  human: z.boolean(),
  addressed: z.enum(['mention', 'direct']).optional(),
  at: z.string().min(1),
  text: z.string(),
  channel: channelRefSchema.optional(),
  meta: z.record(z.string(), z.string()),
})

/** Durable engine storage: triggers and tickets, each in its own document. */
export const superagentDomain = defineDomain({
  name: 'tomato_superagent',
  version: 1,
  layout: 'per-record',
  tables: {
    triggers: domainTable<TriggerId, Trigger>(triggerSchema),
    tickets: domainTable<TicketId, StoredTicket>(storedTicketSchema),
  },
})

/** A store whose queued writes can be awaited before a caller reports success. */
export interface StorageStore extends SuperagentStore {
  /** Resolve once every write queued so far is durable. */
  flush(): Promise<void>
  /** Close the domain, after the queued writes settle. */
  close(): Promise<void>
}

/**
 * Open the durable store over the deployment's storage domain.
 * @param ctx - context carrying `ctx.storageDomain`.
 * @returns a store the engine can use, with a flush for durability.
 */
export async function createStorageStore(ctx: Context): Promise<StorageStore> {
  const domain = await ctx.storageDomain.open(superagentDomain)
  const triggers = new Map<TriggerId, Trigger>()
  const tickets = new Map<TicketId, StoredTicket>()
  for (const [id, trigger] of domain.table('triggers').entries()) triggers.set(id, trigger)
  for (const [id, entry] of domain.table('tickets').entries()) tickets.set(id, entry)
  let pending: Promise<void> = Promise.resolve()
  const write = (operation: () => Promise<void>): void => {
    pending = pending.then(operation).catch((error: unknown) => {
      ctx.logger.warn(`superagent-local: durable write failed: ${String(error)}`)
    })
  }
  return {
    putTrigger: (trigger) => {
      if (triggers.has(trigger.id)) return
      triggers.set(trigger.id, trigger)
      write(async () => { await domain.table('triggers').put(trigger.id, trigger) })
    },
    trigger: id => triggers.get(id),
    triggers: () => [...triggers.values()],
    putTicket: (entry) => {
      tickets.set(entry.ticket.id, entry)
      write(async () => { await domain.table('tickets').put(entry.ticket.id, entry) })
    },
    ticket: id => tickets.get(id),
    tickets: () => [...tickets.values()],
    flush: async () => { await pending },
    close: async () => {
      await pending
      await domain.close()
    },
  }
}
