/**
 * One Host, one team: read the bot service on a schedule, decide what each
 * request becomes, run every accepted ticket's work, and review it. The pieces
 * are the engine, the in-process providers, and the durable store; this plugin
 * owns only the order they run in and the containment of each step's failure.
 * @module @tomato/superagent-runtime
 */
import { randomUUID } from 'node:crypto'
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
import {
  HttpBotGateway,
  replyTo,
  ticketStage,
  reportText,
  runAssignment,
  runCycle,
  runReview,
} from '@tomato/superagent'
import type {
  BotGateway,
  CycleResult,
  MandateId,
  MandateScope,
  Policy,
  ReportState,
  ReviewDecision,
  Ticket,
  TicketId,
} from '@tomato/superagent'
import { createStorageStore } from '@tomato/superagent-local'
import {
  createInProcessReviewer,
  createInProcessSupervisor,
  createInProcessWorker,
} from '@tomato/superagent-local'

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

/** One ticket as a watcher reads it, with the state that matters on one line. */
export interface TicketSummary {
  /** Ticket identity, as commands and reports name it. */
  readonly id: TicketId
  /** What the work is. */
  readonly subject: string
  /** Where the ticket stands: `working`, `person`, or `idle`. */
  readonly stage: string
  /** What the ticket waits on at a person, when it waits on one. */
  readonly needs?: string | undefined
  /** State the last run reported. */
  readonly state?: ReportState | undefined
  /** Blocking findings the review left, zero when it cleared the work. */
  readonly blocking: number
  /** How many reviews the work had. */
  readonly rounds: number
}

declare module '@tomato/session/types' {
  interface PluginRecordMap {
    /** Every ticket this team holds, as of the end of one cycle. */
    'plugin:superagent/tickets': { readonly tickets: readonly TicketSummary[] }
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
  /** Model route every turn uses; omit both to inherit the Host's default model. */
  provider: string
  model: string
  /** Policy version every acceptance is recorded under. */
  policyVersion: string
  /** People whose requests the team takes, in the bot service's identity namespace. */
  allowedSenders: string[]
  /** Bot service the team reads and answers through. */
  bot: {
    /** Base URL of the bot service. */
    baseUrl: string
    /** Identity the service records for reads and replies. */
    userId: string
  }
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
  bot: z.object({
    baseUrl: z.string().required(),
    userId: z.string().default('superagent'),
  }).required(),
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

/** The team one Host runs, for a caller that asks it to work. */
export interface SuperagentTeam {
  /** Read one page of requests and carry each accepted one through work and review. */
  runOnce(): Promise<TeamReport>
  /** Every stored ticket, for a watcher. */
  tickets(): readonly Ticket[]
}

declare module '@tomato/cordis' {
  interface Context {
    /** The team this Host runs, provided while `superagent-runtime` is mounted. */
    superagent: SuperagentTeam
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
 * @param worked - how the accepted work went, in the order it ran.
 * @param warn - receives a reply that failed.
 */
async function answer(
  gateway: BotGateway,
  cycle: CycleResult,
  worked: readonly WorkOutcome[],
  warn: (message: string) => void,
): Promise<void> {
  let index = 0
  for (const verdict of cycle.verdicts) {
    const opened = verdict.kind === 'accepted' ? verdict.tickets.length : 0
    const outcomes = worked.slice(index, index + opened)
    index += opened
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

/**
 * Mount the team.
 * @param ctx - Host context carrying agents, sessions, and storage.
 * @param config - deployment choices.
 */
/** Write one diagnostic line to stderr, so a stalled cycle is visible without a missing log sink. */
function trace(scope: string, message: string): void {
  process.stderr.write(`[superagent] ${scope}: ${message}\n`)
}

export function apply(ctx: Context, config: Config): void {
  // Configuration that cannot work fails before anything is opened.
  const worktrees = ctx.get('worktrees')
  if (config.isolate && worktrees === undefined) {
    throw new Error('superagent-runtime: isolate needs the worktrees service on this Host')
  }
  // The service exists before the domain does: opening starts with the first
  // cycle, so a Host that reloads this plugin never opens the domain twice.
  let store: Awaited<ReturnType<typeof createStorageStore>> | undefined
  let opening: Promise<Awaited<ReturnType<typeof createStorageStore>>> | undefined
  const storeOf = async (): Promise<Awaited<ReturnType<typeof createStorageStore>>> => {
    opening ??= createStorageStore(ctx).then((opened) => {
      store = opened
      return opened
    })
    return await opening
  }
  ctx.effect(() => () => {
    const opened = store
    store = undefined
    opening = undefined
    // Disposal owns the failure: a domain that will not close is reported by the Host.
    return opened === undefined ? undefined : opened.close()
  })
  // An unset route means "whatever this Host answers with", resolved once here so a
  // deployment without any default fails at mount instead of at the first turn.
  const configured = config.provider === '' || config.model === ''
    ? undefined
    : { provider: config.provider, model: config.model }
  const model = configured ?? ctx.get('agentDefaultModel')?.currentSelection()
  if (model === undefined) {
    throw new Error('superagent-runtime: set provider and model, or mount @tomato/agent-default-model')
  }
  // A route nobody registered fails every turn; asking once at mount makes that visible.
  const llm = ctx.get('llm')
  if (llm !== undefined) {
    void llm.resolveModelInfo(model.provider, model.model, AbortSignal.timeout(5_000))
      .then((info: { readonly name: string }) => { trace('mount', `route ${model.provider}/${model.model} resolves as ${info.name}`) })
      .catch((error: unknown) => { trace('mount', `route ${model.provider}/${model.model} unavailable: ${String(error)}`) })
  } else {
    trace('mount', `route ${model.provider}/${model.model}: no llm service on this Host`)
  }
  // The supervising Agent is the session tickets name and the caller a worktree
  // is created for, so it must exist before the first ticket runs.
  let host: Promise<{ agent: Agent; dispose(): Promise<void> }> | undefined
  const hostOf = (): Promise<{ agent: Agent; dispose(): Promise<void> }> => {
    host ??= ctx.agents.create({
      sessionId: SessionId(SUPERVISOR_SESSION),
      meta: { cwd: config.directory },
      agentOptions: model,
    })
    return host
  }
  ctx.effect(() => () => {
    const opened = host
    host = undefined
    return opened === undefined ? undefined : opened.then(handle => handle.dispose())
  })
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
  const supervisor = createInProcessSupervisor(ctx, { directory: config.directory, model, maxTokens })
  const runScope = async (agentCtx: Context): Promise<void> => {
    // The run's own scope carries exactly what it needs: files and a shell.
    await agentCtx.plugin(ToolFs)
    await agentCtx.plugin(ToolFsSearch, { sampleOverCapGlobResults: false })
    await agentCtx.plugin(ToolExecutorNative)
  }
  const worker = createInProcessWorker(ctx, {
    directoryOf, model, maxTokens,
    ...config.workerPreset === '' ? {} : { agentPreset: config.workerPreset },
    ...config.permissionPreset === '' ? {} : { permissionPreset: config.permissionPreset },
    setup: runScope,
  })
  const reviewer = createInProcessReviewer(ctx, { directoryOf, model, maxTokens, setup: runScope })
  // A deployment may publish its own client; without one this Host reads the bot service directly.
  const gateway: BotGateway = ctx.get('botGateway')
    ?? new HttpBotGateway({ baseUrl: config.bot.baseUrl, userId: config.bot.userId })
  const policy: Policy = {
    version: config.policyVersion,
    sources: [{ source: 'feishu', allowedActors: config.allowedSenders }],
  }
  const scope = scopeOf(config.scope)
  let cursor = 0
  let running = false

  const work = async (
    opened: Awaited<ReturnType<typeof createStorageStore>>,
    ticket: TicketId,
  ): Promise<WorkOutcome> => {
    const workStart = Date.now()
    trace('work', `start ticket=${ticket}`)
    let ran
    try {
      ran = await runAssignment(opened, ticket, worker)
    } catch (error: unknown) {
      trace('work', `failed ticket=${ticket} after ${String(Date.now() - workStart)}ms: ${String(error)}`)
      throw error
    }
    trace('work', `run reported ${ran.report.state} for ticket=${ticket} after ${String(Date.now() - workStart)}ms`)
    // The executor returns the report it just recorded, so the state needs no fallback.
    if (ran.report.state !== 'ready') return { ticket, state: ran.report.state }
    trace('review', `start ticket=${ticket}`)
    const reviewed = await runReview(opened, ticket, reviewer)
    trace('review', `decided ${reviewed.decision.decision} for ticket=${ticket} after ${String(Date.now() - workStart)}ms`)
    return { ticket, state: 'ready', review: reviewed.decision }
  }

  const team: SuperagentTeam = {
    runOnce: async (): Promise<TeamReport> => {
      const startedAt = Date.now()
      trace('cycle', `start cursor=${String(cursor)}`)
      const opened = await storeOf()
      const cycle = await runCycle({
        store: opened,
        gateway,
        policy,
        cursor,
        limit: config.limit,
        supervisor: SUPERVISOR_SESSION,
        judge: supervisor,
        nextTicketId: () => brandString<TicketId>(`ticket-${randomUUID()}`),
        nextMandateId: () => brandString<MandateId>(`mandate-${randomUUID()}`),
        scope,
        ...config.botOpenId === '' ? {} : { botOpenId: config.botOpenId },
      })
      cursor = cycle.nextCursor
      trace('cycle', `read ${String(cycle.verdicts.length)} verdict(s): `
        + (cycle.verdicts.map(verdict => 'reason' in verdict
          ? `${verdict.kind}(${verdict.reason})`
          : verdict.kind).join(', ') || 'none'))
      const worked: WorkOutcome[] = []
      for (const verdict of cycle.verdicts) {
        if (verdict.kind !== 'accepted') continue
        for (const ticket of verdict.tickets) worked.push(await work(opened, ticket.id))
      }
      await opened.flush()
      trace('cycle', `done in ${String(Date.now() - startedAt)}ms`)
      // The supervising Session carries the team's state, so a client reads one place.
      const summaries = [...opened.tickets()].map(entry => ticketSummary(entry.ticket))
      appendPluginRecord((await hostOf()).agent.session, 'plugin:superagent/tickets', { tickets: summaries })
      const states = worked.map(outcome => outcome.state).join(',')
      ctx.logger.info(`superagent-runtime: cursor ${String(cursor)}, ${String(worked.length)} worked (${states})`)
      if (config.replies) {
        await answer(gateway, cycle, worked, (message) => { ctx.logger.warn(message) })
      }
      return { cycle, worked }
    },
    tickets: () => store?.tickets().map(entry => entry.ticket) ?? [],
  }
  ctx.provide('superagent', team)

  if (config.pollSeconds > 0) {
    const timer = setInterval(() => {
      // One cycle at a time: a slow cycle must not overlap the next tick.
      if (running) return
      running = true
      void team.runOnce()
        .catch((error: unknown) => { ctx.logger.warn(`superagent-runtime: cycle failed: ${String(error)}`) })
        .finally(() => { running = false })
    }, config.pollSeconds * 1000)
    ctx.effect(() => () => { clearInterval(timer) })
  }
}
