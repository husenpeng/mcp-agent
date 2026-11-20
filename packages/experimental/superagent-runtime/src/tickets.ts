/** Host Remote that reads the team's tickets and takes the person's submit, message, cancel, and stop. */

import type { Context } from '@tomato/cordis'
import { Remote, TypertRemoteService } from '@tomato/typert-protocol'
import type { SuperagentTeam } from './index.ts'
import type { SubmitRequest, SubmitResult, TicketDetail, TicketMessageRequest, TicketsFrame, TicketSummary, TicketTargetRequest } from './types.ts'

/** `superagentTickets` Remote namespace for the browser ticket panel. */
export class SuperagentTickets extends TypertRemoteService {
  /**
   * @param ctx - Host context that owns the runtime.
   * @param teamOf - reads the mounted team; throws while the mount is still in flight.
   * @param read - opens the durable store when necessary and reads its current summaries.
   */
  constructor(
    ctx: Context,
    private readonly teamOf: () => SuperagentTeam,
    private readonly read: () => Promise<readonly TicketSummary[]>,
  ) {
    super(ctx, 'superagentTickets')
  }

  /**
   * List every ticket in the team's durable store, including tickets written by an earlier Host process.
   * @param signal - cancellation supplied by the Remote carrier.
   * @returns current ticket summaries in storage order.
   */
  @Remote
  async list(signal: AbortSignal): Promise<readonly TicketSummary[]> {
    signal.throwIfAborted()
    const tickets = await this.read()
    signal.throwIfAborted()
    return tickets
  }

  /**
   * Take one request the person typed into the app and queue the work it becomes.
   * @param request - the request text.
   * @returns what the request became: opened tickets, or the decline or refusal reason.
   */
  @Remote
  async submit(request: SubmitRequest): Promise<SubmitResult> {
    return this.teamOf().submit(request.text)
  }

  /**
   * Read everything one ticket holds: mandate, runs, review, and thread messages.
   * @param request - ticket to read.
   * @returns the full detail.
   */
  @Remote
  async detail(request: TicketTargetRequest): Promise<TicketDetail> {
    return this.teamOf().detail(request.ticket)
  }

  /**
   * Send one ticket new context; the next run reads it as the latest instruction.
   * @param request - ticket and message text.
   * @returns the ticket as the message left it.
   */
  @Remote
  async message(request: TicketMessageRequest): Promise<TicketSummary> {
    return this.teamOf().message(request.ticket, request.text)
  }

  /**
   * Abort the ticket's in-flight run; the ticket stays open for a later message.
   * @param request - ticket whose run to abort.
   * @returns the ticket once the aborted run settled.
   */
  @Remote
  async cancel(request: TicketTargetRequest): Promise<TicketSummary> {
    return this.teamOf().cancel(request.ticket)
  }

  /**
   * Stop a ticket for good, aborting its in-flight run when it has one.
   * @param request - ticket to stop.
   * @returns the stopped ticket.
   */
  @Remote
  async stop(request: TicketTargetRequest): Promise<TicketSummary> {
    return this.teamOf().stop(request.ticket)
  }

  /**
   * Watch the ticket list live: one frame now, then one after every committed change.
   * @param signal - cancellation supplied by the Remote carrier.
   * @returns the snapshot frames.
   */
  @Remote({ mode: 'stream' })
  watch(signal: AbortSignal): AsyncIterable<TicketsFrame> {
    return this.frames(signal)
  }

  private async *frames(signal: AbortSignal): AsyncGenerator<TicketsFrame> {
    while (!signal.aborted) {
      let wake!: () => void
      const changed = new Promise<void>((resolve) => { wake = resolve })
      const off = this.ctx.on('superagent/changed', () => { wake() })
      const abortWake = (): void => { wake() }
      signal.addEventListener('abort', abortWake, { once: true })
      try {
        yield { tickets: await this.read() }
        await changed
      } finally {
        off()
        signal.removeEventListener('abort', abortWake)
      }
    }
  }
}
