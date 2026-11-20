/**
 * One Host, one team: read the bot service on a schedule or take requests the
 * app submits, decide what each request becomes, run every accepted ticket's
 * work, and review it. The pieces are the engine, the in-process providers,
 * and the durable store; this plugin owns only the order they run in and the
 * containment of each step's failure. A person watching the app can cancel an
 * in-flight run and send the ticket new context to continue with.
 * @module @tomato/superagent-runtime
 */
import { randomUUID } from 'node:crypto'
import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { brandString } from '@tomato/branded'
import type { Agent } from '@tomato/agent'
import type {} from '@tomato/experimental-worktree'
import { SessionId } from '@tomato/session'
import { appendPluginRecord } from '@tomato/session'
import type { Context } from '@tomato/cordis'
import * as ToolFs from '@tomato/tool-fs'
import * as ToolFsSearch from '@tomato/tool-fs-search'
import * as ToolExecutorNative from '@tomato/tool-executor-native'
import z from '@tomato/schemastery'
import type {} from '@tomato/agent'
import type {} from '@tomato/agent-default-model'
import { RemoteError } from '@tomato/typert-protocol'
import {
  APP_SOURCE,
  appThread,
  appTrigger,
  canStart,
  decideTriggers,
  HttpBotGateway,
  intake,
  openAssignment,
  replyTo,
  stop as stopTicket,
  threadKey,
  ticketStage,
  reportText,
  runAssignment,
  runCycle,
  runReview,
} from '@tomato/superagent'
import type {
  ActorId,
  AssignmentRun,
  BotGateway,
  CycleResult,
  MandateId,
  MandateScope,
  Policy,
  ReportState,
  ReviewDecision,
  Supervisor,
  ThreadRef,
  Ticket,
  TicketId,
  Trigger,
  TriggerId,
  WorkerLease,
} from '@tomato/superagent'
import { createStorageStore } from '@tomato/superagent-local'
import type { StorageStore } from '@tomato/superagent-local'
import {
  createInProcessReviewer,
  createInProcessSupervisor,
  createInProcessWorker,
} from '@tomato/superagent-local'
import { SuperagentTickets } from './tickets.ts'
import type { SubmitResult, TicketDetail, TicketSummary } from './types.ts'

export type { SubmitResult, TicketDetail, TicketSummary } from './types.ts'
export type { AssignmentView, FindingView, TicketsFrame, TriggerView } from './types.ts'

export const name = 'superagent-runtime'
export const inject = ['agents', 'sessions', 'storageDomain']

/** Identity every ticket records as its supervisor, so a person can read what ran. */
export const SUPERVISOR_SESSION = 'superagent-supervisor'

/** How one accepted ticket's work went in this cycle. */
export interface WorkOutcome {
  /** The ticket that ran. */
  readonly ticket: TicketId
  /** State the run reported. */
  readonly state: ReportState
  /** What review decided, absent while the work is not ready for one. */
  readonly review?: ReviewDecision | undefined
}

declare module '@tomato/session/types' {
  interface PluginRecordMap {
    /** Every ticket this team holds, as of one committed change to the work. */
    'plugin:superagent-runtime/tickets': { readonly tickets: readonly TicketSummary[] }
  }
}

declare module '@tomato/cordis' {
  interface Events {
    /**
     * One committed change to the team's tickets: intake decided a request, a
     * run started or reported, a review recorded, or a person cancelled,
     * messaged, or stopped a ticket.
     * @param ticket - ticket whose state changed, or undefined for a list-level change.
     * @mode emit
     */
    'superagent/changed'(ticket: TicketId | undefined): void
  }
}

/**
 * Read one stored ticket as the summary a watcher shows.
 * @param ticket - ticket to summarize.
 * @returns identity, work, where it stands, and what review said.
 */
export function ticketSummary(ticket: Ticket): TicketSummary {
  const stage = ticketStage(ticket)
  const latest = ticket.assignments[ticket.assignments.length - 1]?.report
  const findings = ticket.review?.findings.filter(finding => finding.severity === 'p0').length ?? 0
  return {
    id: ticket.id,
    subject: ticket.subject,
    stage: stage.stage,
    ...stage.stage === 'person' ? { needs: stage.action } : {},
    ...latest === undefined ? {} : { state: latest.state },
    blocking: findings,
    rounds: ticket.review?.rounds ?? 0,
    running: openAssignment(ticket) !== undefined,
    stopped: ticket.stopped,
  }
}

/** What one cycle achieved, for a caller that watches the team. */
export interface TeamReport {
  /** What intake decided for each event it read. */
  readonly cycle: CycleResult
  /** Work each accepted ticket reached: how it ran, and what review decided. */
  readonly worked: readonly WorkOutcome[]
}

/** Deployment choices the team runs under. */
export interface Config {
  /** Directory work runs in; each ticket gets its own Session in it. */
  directory: string
  /** Provider id of the model route every turn uses; omit both to inherit the Host's default model. */
  provider: string
  /** Model id on {@link provider} for every turn; omit both to inherit the Host's default model. */
  model: string
  /** Policy version every acceptance is recorded under. */
  policyVersion: string
  /** People whose requests the team takes, in the bot service's identity namespace. */
  allowedSenders: string[]
  /**
   * Bot service the team reads and answers through. Omit it to run app-only:
   * requests then arrive through `submit` from the deployment's own GUI.
   */
  bot?: {
    /** Base URL of the bot service. */
    baseUrl: string
    /** Identity the service records for reads and replies. */
    userId: string
  } | undefined
  /** Actor the policy admits app submissions from. */
  appUser: string
  /** How often to read the service, in seconds; zero runs only when asked. */
  pollSeconds: number
  /** The bot's own open id, so its own messages never start work. */
  botOpenId: string
  /** How far accepted work may go; defaults to a change. */
  scope: string
  /** Most events one cycle reads. */
  limit: number
  /**
   * Whether each ticket works in its own checkout. The Host must then carry
   * `ctx.worktrees`, and the configured directory is the repository to branch from.
   */
  isolate: boolean
  /** Whether to answer in the conversation each request arrived in. */
  replies: boolean
  /**
   * Preset the work turn composes; empty keeps the Host default.
   */
  workerPreset: string
  /** Permission preset a run's session gets, so it cannot leave its directory; empty keeps the Host default. */
  permissionPreset: string
  /**
   * Output-token budget for one turn. Zero selects the model's default: a
   * reasoning model spends nearly all of it thinking, so it needs far more than
   * a plain chat model before the answer itself fits.
   */
  maxOutputTokens: number
}

export const Config: z<Config> = z.object({
  directory: z.string().required(),
  provider: z.string().default(''),
  model: z.string().default(''),
  policyVersion: z.string().default('superagent-1'),
  allowedSenders: z.array(z.string()).default([]),
  bot: (z.object({
    baseUrl: z.string().required(),
    userId: z.string().default('superagent'),
  }) as z<Config['bot']>).default(undefined),
  appUser: z.string().default('app-user'),
  pollSeconds: z.number().default(0),
  botOpenId: z.string().default(''),
  scope: z.string().default('change'),
  limit: z.number().default(20),
  isolate: z.boolean().default(false),
  replies: z.boolean().default(false),
  workerPreset: z.string().default('standard'),
  permissionPreset: z.string().default('workspace-write'),
  maxOutputTokens: z.number().default(0),
})

/** The team one Host runs, for a caller that asks it to work or watches it. */
export interface SuperagentTeam {
  /** Read one page of requests and carry each accepted one through work and review.
   * @returns the report of the completed team cycle.
   */
  runOnce(): Promise<TeamReport>
  /** Every stored ticket, for a watcher.
   * @returns the team's current tickets.
   */
  tickets(): readonly Ticket[]
  /**
   * Take one request a person typed into the app: admit it, let the supervisor
   * decide what it becomes, and queue the accepted work. The work runs in the
   * background; watch the tickets to see it progress.
   * @param text - the request as the person stated it.
   * @returns what the request became, with the opened tickets or the refusal reason.
   */
  submit(text: string): Promise<SubmitResult>
  /**
   * Send one ticket new context — an answer, a correction, or a continuation
   * after a cancelled run. The message joins the ticket's thread and the next
   * run reads it as the latest instruction.
   * @param ticket - ticket to continue.
   * @param text - the context or answer.
   * @returns the ticket as the message left it.
   */
  message(ticket: string, text: string): Promise<TicketSummary>
  /**
   * Abort the ticket's in-flight run. The run reports `dropped`, the ticket
   * stays open, and a later message may start the next run.
   * @param ticket - ticket whose run to abort.
   * @returns the ticket once the aborted run settled.
   */
  cancel(ticket: string): Promise<TicketSummary>
  /**
   * Stop a ticket for good, aborting its in-flight run when it has one. A
   * stopped ticket takes no new work and no further messages.
   * @param ticket - ticket to stop.
   * @returns the stopped ticket.
   */
  stop(ticket: string): Promise<TicketSummary>
  /**
   * Read everything one ticket holds: its mandate, every run and report, the
   * latest review, and the messages on its threads.
   * @param ticket - ticket to read.
   * @returns the full detail a person reads the flow from.
   */
  detail(ticket: string): Promise<TicketDetail>
}

declare module '@tomato/cordis' {
  interface Context {
    /** The team this Host runs, provided while `superagent-runtime` is mounted. */
    superagent: SuperagentTeam
    /** Ticket summaries exposed by the mounted superagent runtime. */
    superagentTickets: SuperagentTickets
    /** Internal dependency that keeps the operation scope alive until its consumer drains. */
    readonly superagentOperationScope: { readonly active: true }
  }
}

/**
 * Read a configured scope, refusing a word the engine does not define.
 * @param scope - configured value.
 * @returns the scope the engine records.
 */
function scopeOf(scope: string): MandateScope {
  if (scope === 'investigate' || scope === 'change' || scope === 'release') return scope
  throw new Error(`superagent-runtime: scope must be investigate, change, or release, not "${scope}"`)
}

/**
 * Answer each request in the conversation it arrived in.
 *
 * A refused reply is logged rather than thrown: the work already happened, and
 * a bot service that will not accept a message must not undo it.
 * @param gateway - bot service to send through.
 * @param cycle - what this cycle decided per event.
 * @param worked - the outcomes the pump produced while this cycle waited.
 * @param warn - receives a reply that failed.
 */
async function answer(
  gateway: BotGateway,
  cycle: CycleResult,
  worked: readonly WorkOutcome[],
  warn: (message: string) => void,
): Promise<void> {
  for (const verdict of cycle.verdicts) {
    // Continuations share the pump, so outcomes are matched by ticket, not position.
    const outcomes = verdict.kind === 'accepted'
      ? verdict.tickets.flatMap((ticket) => {
        const outcome = worked.find(entry => entry.ticket === ticket.id)
        return outcome === undefined ? [] : [outcome]
      })
      : []
    const text = reportText(verdict, outcomes)
    const channel = verdict.trigger.channel
    if (channel === undefined || text === undefined) continue
    try {
      await replyTo(gateway, channel, text)
    } catch (error: unknown) {
      warn(`superagent-runtime: replying failed: ${String(error)}`)
    }
  }
}

/** @returns the diagnostic file below the active Harness home. */
function tracePath(): string {
  const home = process.env.TOMATO_HOME ?? `${process.env.HOME ?? '.'}/.tomato`
  return `${home}/logs/superagent.log`
}

/**
 * Append one diagnostic line. The file rather than stderr, because a Host can
 * start this plugin inside another process whose streams nobody captures.
 * @param scope - step that wrote the line.
 * @param message - what happened.
 */
function trace(scope: string, message: string): void {
  try {
    appendFileSync(tracePath(), `${new Date().toISOString()} ${scope}: ${message}\n`)
  } catch (error: unknown) {
    // The team still runs without its diagnostic file; stderr is the independent fallback.
    process.stderr.write(`[superagent] diagnostics unavailable: ${String(error)}\n`)
  }
}

/** One in-flight run a person may cancel. */
interface ActiveRun {
  readonly ticket: TicketId
  /** Abort the run; a lease that does not exist yet is aborted the moment it appears. */
  cancel(): void
  /** The assignment operation, which settles with the report recorded. */
  readonly settled: Promise<AssignmentRun>
}

/**
 * Mount the team and its ticket Remote.
 * @param ctx - Host context carrying agents, sessions, storage, and LLM adapters.
 * @param config - deployment choices.
 * @returns resolves after the configured model route is verified; an unavailable route rejects the mount.
 */
export async function apply(ctx: Context, config: Config): Promise<void> {
  const scope = scopeOf(config.scope)
  const instanceId = randomUUID()
  try {
    mkdirSync(dirname(tracePath()), { recursive: true })
  } catch (error: unknown) {
    // An unwritable log directory leaves the team running; later writes report through stderr.
    process.stderr.write(`[superagent] log directory unavailable: ${String(error)}\n`)
  }
  // Configuration that cannot work fails before anything is opened.
  const worktrees = ctx.get('worktrees')
  if (config.isolate && worktrees === undefined) {
    throw new Error('superagent-runtime: isolate needs the worktrees service on this Host')
  }
  // The service exists before the domain does. Opening is shared, failures are retryable,
  // and every operation drains before the store and supervising Agent close.
  let store: StorageStore | undefined
  let opening: Promise<StorageStore> | undefined
  let closing = false
  const isClosing = (): boolean => closing
  const operations = new Set<Promise<unknown>>()
  const track = <T>(operation: () => Promise<T>): Promise<T> => {
    if (isClosing()) return Promise.reject(new Error('superagent-runtime: the team is disposed'))
    const pending = operation()
    operations.add(pending)
    const settled = (): void => { operations.delete(pending) }
    void pending.then(settled, settled)
    return pending
  }
  const storeOf = (): Promise<StorageStore> => {
    if (isClosing()) return Promise.reject(new Error('superagent-runtime: the team is disposed'))
    if (store !== undefined) return Promise.resolve(store)
    if (opening !== undefined) return opening
    const pending = createStorageStore(operationCtx).then((opened) => {
      store = opened
      if (isClosing()) throw new Error('superagent-runtime: the team is disposed')
      return opened
    })
    opening = pending
    const clear = (): void => { if (opening === pending) opening = undefined }
    void pending.then(clear, clear)
    return pending
  }
  const lifetime = new AbortController()
  const operationFiber = ctx.root.plugin({
    inject: ['agents', 'sessions', 'storageDomain'],
    apply: (scopeCtx) => { scopeCtx.provide('superagentOperationScope', { active: true }) },
  })
  const operationCtx = operationFiber.ctx
  let host: Promise<{ agent: Agent; dispose(): Promise<void> }> | undefined
  let timer: ReturnType<typeof setInterval> | undefined
  let draining: Promise<void> | undefined
  const drain = (): Promise<void> => draining ??= (async () => {
    closing = true
    lifetime.abort(new Error('superagent-runtime: the team is disposed'))
    if (timer !== undefined) clearInterval(timer)
    await Promise.allSettled([...operations])
    const pending = opening
    if (pending !== undefined) await pending.catch(() => undefined)
    const opened = store
    store = undefined
    opening = undefined
    const startedHost = host
    host = undefined
    const closingTasks: Promise<unknown>[] = []
    if (opened !== undefined) closingTasks.push(opened.close())
    if (startedHost !== undefined) closingTasks.push(startedHost.then(handle => handle.dispose()))
    const failures: unknown[] = []
    for (const task of closingTasks) {
      try { await task } catch (error: unknown) { failures.push(error) }
    }
    if (failures.length === 1) throw failures[0]
    if (failures.length > 1) throw new AggregateError(failures, 'superagent-runtime: disposal failed')
  })()
  // The operation provider waits for this dependent consumer to unload; both cleanup paths
  // share one drain, so a root unload cannot remove turn listeners before their reports settle.
  ctx.plugin({
    inject: ['superagentOperationScope'],
    apply: (consumerCtx) => { consumerCtx.effect(() => drain, 'superagent-runtime: dependent drain') },
  })
  ctx.effect(() => async () => {
    const failures: unknown[] = []
    try { await drain() } catch (error: unknown) { failures.push(error) }
    try { await operationFiber.dispose() } catch (error: unknown) { failures.push(error) }
    if (failures.length === 1) throw failures[0]
    if (failures.length > 1) throw new AggregateError(failures, 'superagent-runtime: operation disposal failed')
  }, 'superagent-runtime: operation scope')

  // The Remote exists before the team does, so a browser read during mount opens
  // the store; operations that need the team wait for the mount to finish.
  const mounted: { team?: SuperagentTeam } = {}
  new SuperagentTickets(ctx, () => {
    if (mounted.team === undefined) throw new Error('superagent-runtime: the team is not mounted yet')
    return mounted.team
  }, () => track(async () => {
    const opened = await storeOf()
    return opened.tickets().map(entry => ticketSummary(entry.ticket))
  }))
  // An unset route means "whatever this Host answers with", resolved once here so a
  // deployment without any default fails at mount instead of at the first turn.
  const configured = config.provider === '' || config.model === ''
    ? undefined
    : { provider: config.provider, model: config.model }
  const model = configured ?? ctx.get('agentDefaultModel')?.currentSelection()
  if (model === undefined) {
    throw new Error('superagent-runtime: set provider and model, or mount @tomato/agent-default-model')
  }
  // A route nobody registered cannot run a ticket, so refuse the mount before polling starts.
  const llm = ctx.get('llm')
  if (llm === undefined) throw new Error('superagent-runtime: the Host must provide the llm service')
  trace('mount', `instance=${instanceId} route=${model.provider}/${model.model} allowedSenders=${String(config.allowedSenders.length)} botOpenIdSet=${String(config.botOpenId !== '')} pollSeconds=${String(config.pollSeconds)}`)
  try {
    const info = await llm.resolveModelInfo(model.provider, model.model, AbortSignal.timeout(5_000))
    trace('mount', `instance=${instanceId} route resolves as ${info.name}`)
  } catch (error: unknown) {
    trace('mount', `instance=${instanceId} route unavailable: ${String(error)}`)
    throw new Error(`superagent-runtime: model route ${model.provider}/${model.model} is unavailable`, { cause: error })
  }
  // The supervising Agent is the session tickets name and the caller a worktree
  // is created for, so it must exist before the first ticket runs.
  const hostOf = (): Promise<{ agent: Agent; dispose(): Promise<void> }> => {
    if (host === undefined) {
      lifetime.signal.throwIfAborted()
      host = operationCtx.agents.create({
        sessionId: SessionId(SUPERVISOR_SESSION),
        meta: { cwd: config.directory },
        agentOptions: model,
      })
    }
    return host
  }
  const directoryOf = async (ticket: TicketId): Promise<string> => {
    if (worktrees === undefined) return config.directory
    const created = await worktrees.create((await hostOf()).agent, { name: ticket })
    return created.path
  }
  // A reasoning model spends most of a turn thinking, so its answer needs a far
  // larger budget than a plain chat model; the deployment can override either.
  const maxTokens = config.maxOutputTokens > 0
    ? config.maxOutputTokens
    : model.model.startsWith('DeepSeek') ? 16_000 : 1_200
  const supervisor = createInProcessSupervisor(operationCtx, {
    directory: config.directory, model, maxTokens, signal: lifetime.signal,
  })
  const judge: Supervisor = {
    supervise: (request) => {
      if (isClosing()) return Promise.reject(new Error('superagent-runtime: the team is disposed'))
      return supervisor.supervise(request)
    },
  }
  const runScope = async (agentCtx: Context): Promise<void> => {
    // The run's own scope carries exactly what it needs: files and a shell.
    await agentCtx.plugin(ToolFs)
    await agentCtx.plugin(ToolFsSearch, { sampleOverCapGlobResults: false })
    await agentCtx.plugin(ToolExecutorNative)
  }
  const worker = createInProcessWorker(operationCtx, {
    directoryOf, model, maxTokens, signal: lifetime.signal,
    ...config.workerPreset === '' ? {} : { agentPreset: config.workerPreset },
    ...config.permissionPreset === '' ? {} : { permissionPreset: config.permissionPreset },
    setup: runScope,
  })
  const reviewer = createInProcessReviewer(operationCtx, {
    directoryOf, model, maxTokens, setup: runScope, signal: lifetime.signal,
  })
  // A deployment may publish its own client; without one this Host reads the bot
  // service directly. No bot configuration and no published client means app-only.
  const gateway: BotGateway | undefined = ctx.get('botGateway')
    ?? (config.bot === undefined ? undefined : new HttpBotGateway({ baseUrl: config.bot.baseUrl, userId: config.bot.userId }))
  const policy: Policy = {
    version: config.policyVersion,
    sources: [
      { source: 'feishu', allowedActors: config.allowedSenders },
      { source: APP_SOURCE, allowedActors: [config.appUser] },
    ],
  }
  let cursor = 0
  let running = false

  const nextTicketId = (): TicketId => brandString<TicketId>(`ticket-${randomUUID()}`)
  const nextMandateId = (): MandateId => brandString<MandateId>(`mandate-${randomUUID()}`)

  /** Record the committed ticket list on the supervising session, for Session readers and the panel. */
  const recordTickets = async (opened: StorageStore): Promise<void> => {
    const summaries = opened.tickets().map(entry => ticketSummary(entry.ticket))
    appendPluginRecord((await hostOf()).agent.session, 'plugin:superagent-runtime/tickets', { tickets: summaries })
  }

  // One work pump: tickets run one at a time, in queue order. Messages that
  // arrive during a run accumulate as the next run's context.
  const queue: TicketId[] = []
  const pendingContext = new Map<TicketId, string[]>()
  let pumping = false
  let active: ActiveRun | undefined
  const idleWaiters = new Set<() => void>()
  const sinks = new Set<(outcome: WorkOutcome) => void>()

  const settleIdle = (): void => {
    if (pumping || active !== undefined) return
    // A closing team drops its queue; waiters still settle so disposal can drain.
    if (!isClosing() && queue.length > 0) return
    for (const wake of idleWaiters) wake()
    idleWaiters.clear()
  }
  const idle = (): Promise<void> => {
    if (!pumping && active === undefined && (queue.length === 0 || isClosing())) return Promise.resolve()
    return new Promise((resolve) => { idleWaiters.add(resolve) })
  }

  const work = async (
    opened: StorageStore,
    ticket: TicketId,
    context?: readonly string[],
  ): Promise<WorkOutcome> => {
    if (isClosing()) throw new Error('superagent-runtime: the team is disposed')
    const workStart = Date.now()
    trace('work', `start ticket=${ticket}`)
    let lease: WorkerLease | undefined
    let cancelRequested = false
    const runningAssignment = runAssignment(opened, ticket, worker, {
      ...context === undefined ? {} : { context },
      onLease: (leased) => {
        lease = leased
        // The assignment is recorded now: a watcher sees the run in flight.
        ctx.emit('superagent/changed', ticket)
        if (cancelRequested) leased.cancel()
      },
    })
    const control: ActiveRun = {
      ticket,
      cancel: () => {
        cancelRequested = true
        lease?.cancel()
      },
      settled: runningAssignment,
    }
    active = control
    let ran: AssignmentRun
    try {
      ran = await runningAssignment
    } catch (error: unknown) {
      trace('work', `failed ticket=${ticket} after ${String(Date.now() - workStart)}ms: ${String(error)}`)
      throw error
    } finally {
      if (active === control) active = undefined
    }
    ctx.emit('superagent/changed', ticket)
    trace('work', `run reported ${ran.report.state} for ticket=${ticket} after ${String(Date.now() - workStart)}ms`)
    // The executor returns the report it just recorded, so the state needs no fallback.
    if (ran.report.state !== 'ready') return { ticket, state: ran.report.state }
    if (isClosing()) throw new Error('superagent-runtime: the team is disposed')
    trace('review', `start ticket=${ticket}`)
    const reviewed = await runReview(opened, ticket, reviewer)
    ctx.emit('superagent/changed', ticket)
    trace('review', `decided ${reviewed.decision.decision} for ticket=${ticket} after ${String(Date.now() - workStart)}ms`)
    return { ticket, state: 'ready', review: reviewed.decision }
  }

  const pump = async (): Promise<void> => {
    pumping = true
    try {
      const opened = await storeOf()
      while (!isClosing()) {
        const ticket = queue.shift()
        if (ticket === undefined) break
        const entry = opened.ticket(ticket)
        if (entry === undefined || !canStart(entry.ticket)) continue
        const context = pendingContext.get(ticket)
        pendingContext.delete(ticket)
        try {
          const outcome = await work(opened, ticket, context)
          for (const sink of sinks) sink(outcome)
        } catch (error: unknown) {
          if (isClosing()) throw error
          // One ticket's failure is contained; the rest of the queue still runs.
          ctx.logger.warn(`superagent-runtime: work failed for ${ticket}: ${String(error)}`)
        }
        // Messages that arrived during the run continue the same ticket.
        if (pendingContext.has(ticket) && !queue.includes(ticket)) queue.push(ticket)
      }
      if (!isClosing()) await recordTickets(opened)
    } finally {
      pumping = false
      settleIdle()
    }
  }
  const kick = (): void => {
    if (pumping || isClosing()) return
    void track(pump).catch((error: unknown) => {
      ctx.logger.warn(`superagent-runtime: work pump failed: ${String(error)}`)
    })
  }
  const enqueue = (ticket: TicketId, context?: string): void => {
    if (context !== undefined && context.trim() !== '') {
      const messages = pendingContext.get(ticket) ?? []
      messages.push(context)
      pendingContext.set(ticket, messages)
    }
    // A run in flight re-enqueues its own ticket when it settles with pending context.
    if (active?.ticket === ticket) return
    if (!queue.includes(ticket)) queue.push(ticket)
    kick()
  }

  const requireTicket = (opened: StorageStore, ticket: string): Ticket => {
    const entry = opened.ticket(brandString<TicketId>(ticket))
    if (entry === undefined) {
      throw new RemoteError('superagent/not-found', `unknown ticket ${ticket}`, { id: ticket })
    }
    return entry.ticket
  }
  const requireText = (text: string): string => {
    const trimmed = text.trim()
    if (trimmed === '') throw new RemoteError('superagent/empty-text', 'the text is blank', {})
    return trimmed
  }

  const team: SuperagentTeam = {
    runOnce: () => track(async (): Promise<TeamReport> => {
      const startedAt = Date.now()
      trace('cycle', `start instance=${instanceId} cursor=${String(cursor)}`)
      const opened = await storeOf()
      let cycle: CycleResult
      if (gateway === undefined) {
        cycle = { nextCursor: cursor, verdicts: [], outcomes: [] }
      } else {
        try {
          cycle = await runCycle({
            store: opened,
            gateway,
            policy,
            cursor,
            limit: config.limit,
            supervisor: SUPERVISOR_SESSION,
            judge,
            nextTicketId,
            nextMandateId,
            scope,
            ...config.botOpenId === '' ? {} : { botOpenId: config.botOpenId },
          })
        } catch (error: unknown) {
          // Preserve the rejection for the caller and the polling warning; the file adds Host diagnostics.
          trace('cycle', `failed instance=${instanceId}: ${error instanceof Error ? error.message : String(error)}`)
          throw error
        }
      }
      if (isClosing()) throw new Error('superagent-runtime: the team is disposed')
      cursor = cycle.nextCursor
      const outcomes = cycle.outcomes.map(outcome =>
        `${outcome.outcome}(reached=${String(outcome.reached.length)})`).join(', ') || 'none'
      trace('cycle', `outcomes instance=${instanceId} count=${String(cycle.outcomes.length)}: ${outcomes}`)
      trace('cycle', `read ${String(cycle.verdicts.length)} verdict(s): `
        + (cycle.verdicts.map((verdict) => {
          if (verdict.kind === 'refused') return `${verdict.kind}(${verdict.admission.reason})`
          return 'reason' in verdict ? `${verdict.kind}(${verdict.reason})` : verdict.kind
        }).join(', ') || 'none'))
      const worked: WorkOutcome[] = []
      const sink = (outcome: WorkOutcome): void => { worked.push(outcome) }
      sinks.add(sink)
      try {
        for (const verdict of cycle.verdicts) {
          if (verdict.kind === 'accepted') {
            for (const ticket of verdict.tickets) enqueue(ticket.id)
          }
          if (verdict.kind === 'continued') {
            // A new message on a followed thread continues the work it reached.
            for (const ticket of verdict.reached) enqueue(ticket, verdict.trigger.text)
          }
        }
        await idle()
      } finally {
        sinks.delete(sink)
      }
      await opened.flush()
      if (isClosing()) throw new Error('superagent-runtime: the team is disposed')
      trace('cycle', `done in ${String(Date.now() - startedAt)}ms`)
      const states = worked.map(outcome => outcome.state).join(',')
      ctx.logger.info(`superagent-runtime: cursor ${String(cursor)}, ${String(worked.length)} worked (${states})`)
      if (config.replies && gateway !== undefined) {
        await answer(gateway, cycle, worked, (message) => { ctx.logger.warn(message) })
      }
      return { cycle, worked }
    }),
    tickets: () => store?.tickets().map(entry => entry.ticket) ?? [],
    submit: (text: string) => track(async (): Promise<SubmitResult> => {
      const request = requireText(text)
      const opened = await storeOf()
      const trigger = appTrigger({
        id: brandString<TriggerId>(`app:${randomUUID()}`),
        text: request,
        thread: appThread(`app-${randomUUID()}`),
        actor: brandString<ActorId>(config.appUser),
        at: new Date().toISOString(),
      })
      const outcome = intake(opened, trigger)
      const verdicts = await decideTriggers({
        store: opened, policy, nextTicketId, nextMandateId, scope,
        supervisor: SUPERVISOR_SESSION, judge,
      }, [{ trigger, outcome }])
      const verdict = verdicts[0]
      if (verdict === undefined) throw new Error('superagent-runtime: intake decided nothing for one submission')
      trace('submit', `verdict=${verdict.kind}`)
      if (verdict.kind === 'accepted') {
        for (const ticket of verdict.tickets) enqueue(ticket.id)
        await opened.flush()
        if (isClosing()) throw new Error('superagent-runtime: the team is disposed')
        await recordTickets(opened)
        ctx.emit('superagent/changed', undefined)
        return { kind: 'accepted', tickets: verdict.tickets.map(ticket => ticketSummary(ticket)) }
      }
      await opened.flush()
      ctx.emit('superagent/changed', undefined)
      if (verdict.kind === 'continued') {
        // A fresh app thread names no stored trigger and reaches no ticket.
        throw new Error('superagent-runtime: a fresh app submission reached an existing ticket')
      }
      const reason = verdict.kind === 'declined' ? verdict.reason : verdict.admission.reason
      return { kind: verdict.kind, reason }
    }),
    message: (ticket: string, text: string) => track(async (): Promise<TicketSummary> => {
      const message = requireText(text)
      const opened = await storeOf()
      const current = requireTicket(opened, ticket)
      if (current.ended || current.stopped) {
        throw new RemoteError('superagent/closed', `ticket ${ticket} is stopped or ended`, { id: ticket })
      }
      const thread = current.follows[0] as ThreadRef
      const actor = thread.source === APP_SOURCE ? config.appUser : current.mandate.sender
      const trigger: Trigger = {
        id: brandString<TriggerId>(`${thread.source}:local-${randomUUID()}`),
        source: thread.source,
        threads: [thread],
        actor: brandString<ActorId>(actor),
        human: true,
        addressed: 'direct',
        at: new Date().toISOString(),
        text: message,
        meta: {},
      }
      intake(opened, trigger)
      enqueue(current.id, message)
      await opened.flush()
      if (isClosing()) throw new Error('superagent-runtime: the team is disposed')
      await recordTickets(opened)
      ctx.emit('superagent/changed', current.id)
      return ticketSummary(requireTicket(opened, ticket))
    }),
    cancel: (ticket: string) => track(async (): Promise<TicketSummary> => {
      const opened = await storeOf()
      const current = requireTicket(opened, ticket)
      const run = active
      if (run === undefined || run.ticket !== current.id) {
        throw new RemoteError('superagent/not-running', `ticket ${ticket} has no in-flight run`, { id: ticket })
      }
      trace('cancel', `ticket=${ticket}`)
      run.cancel()
      await run.settled.catch(() => undefined)
      await opened.flush()
      ctx.emit('superagent/changed', current.id)
      return ticketSummary(requireTicket(opened, ticket))
    }),
    stop: (ticket: string) => track(async (): Promise<TicketSummary> => {
      const opened = await storeOf()
      const current = requireTicket(opened, ticket)
      stopTicket(opened, current.id)
      pendingContext.delete(current.id)
      const run = active
      if (run !== undefined && run.ticket === current.id) {
        run.cancel()
        await run.settled.catch(() => undefined)
      }
      await opened.flush()
      if (isClosing()) throw new Error('superagent-runtime: the team is disposed')
      await recordTickets(opened)
      ctx.emit('superagent/changed', current.id)
      return ticketSummary(requireTicket(opened, ticket))
    }),
    detail: (ticket: string) => track(async (): Promise<TicketDetail> => {
      const opened = await storeOf()
      const current = requireTicket(opened, ticket)
      const keys = new Set(current.follows.map(threadKey))
      const triggers = opened.triggers()
        .filter(trigger => trigger.threads.some(thread => keys.has(threadKey(thread))))
        .map(trigger => ({ at: trigger.at, source: trigger.source, actor: trigger.actor, text: trigger.text }))
      return {
        summary: ticketSummary(current),
        mandate: {
          scope: current.mandate.scope,
          strength: current.mandate.strength,
          policyVersion: current.mandate.policyVersion,
          sender: current.mandate.sender,
          at: current.mandate.at,
        },
        assignments: current.assignments.map(assignment => ({
          id: assignment.id,
          session: assignment.session,
          directory: assignment.directory,
          ended: assignment.ended,
          ...assignment.report === undefined ? {} : { report: assignment.report },
        })),
        ...current.review === undefined ? {} : { review: current.review },
        triggers,
        ended: current.ended,
      }
    }),
  }
  ctx.provide('superagent', team)
  mounted.team = team

  if (config.pollSeconds > 0) {
    timer = setInterval(() => {
      // One cycle at a time: a slow cycle must not overlap the next tick.
      if (running) return
      running = true
      void team.runOnce()
        .catch((error: unknown) => { ctx.logger.warn(`superagent-runtime: cycle failed: ${String(error)}`) })
        .finally(() => { running = false })
    }, config.pollSeconds * 1000)
  }
}
