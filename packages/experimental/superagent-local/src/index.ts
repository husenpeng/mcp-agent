/**
 * The in-process executor: one ticket runs in one child Agent of this Host, in
 * the directory the caller names, and reports through the text contract the
 * ticket's brief states.
 *
 * The run owns nothing durable. It creates an Agent, hands it the brief, waits
 * for its turn to end, reads the report the turn wrote, and disposes the Agent
 * whatever happened.
 * @module @tomato/superagent-local
 */

import { brandString } from '@tomato/branded'
import type { Context } from '@tomato/cordis'
import type {} from '@tomato/agent'
import type {} from '@tomato/tools'
import { createUserMessage } from '@tomato/llm'
import type { Session, SessionEvent } from '@tomato/session'
import { SessionId } from '@tomato/session'
import {
  parseReport,
  parseReview,
  parseSupervision,
  reviewerBriefText,
  supervisorBriefText,
  workerBriefText,
} from '@tomato/superagent'
import type {
  AssignmentReport,
  Supervision,
  Supervisor,
  SupervisorRequest,
  Reviewer,
  ReviewerBrief,
  ReviewVerdict,
  TicketId,
  Worker,
  WorkerBrief,
  WorkerLease,
} from '@tomato/superagent'

/** How one Host turns a ticket into a run or a review. */
export interface InProcessWorkerOptions {
  /**
   * Directory one ticket's work runs in. A deployment that isolates work hands
   * out a checkout per ticket; a fixed deployment returns the same one.
   */
  readonly directoryOf: (ticket: TicketId) => Promise<string>
  /** Prefix of the Session identity a run uses, so its sessions stay recognizable. */
  readonly sessionPrefix?: string
  /**
   * Model route every worker turn uses. The caller names it rather than relying
   * on a deployment default: a run nobody configured cannot answer.
   */
  readonly model: { readonly provider: string; readonly model: string }
  /** Output-token budget one turn may spend; omitted keeps the route's default. */
  readonly maxTokens?: number
  /** Preset a run's agent composes; omitted keeps the Host default. */
  readonly agentPreset?: string
  /** Permission preset every run's session gets; omitted keeps the Host default. */
  readonly permissionPreset?: string
  /** Tools one run may use; omitted keeps whatever the Host composition allows. */
  readonly tools?: readonly string[]
  /** Mounts what the run's agent scope needs; the deployment owns which plugins those are. */
  readonly setup?: (agentCtx: Context) => Promise<void> | void
}

/** The part of an Agent one run drives. */
interface WorkerAgent {
  /** Queue one user message and let the loop start a turn. */
  followup(message: ReturnType<typeof createUserMessage>): void
  /** Resolve once no turn is running. */
  whenIdle(): Promise<void>
}

/** The last assistant text and the reason the turn ended. */
export interface TurnResult {
  text: string
  reason: SessionEvent<'turn/end'>['data']['reason'] | undefined
}

/**
 * Read one finished supervision turn as the decision it carries. A turn that
 * ended badly decided nothing, so it declines instead of opening work.
 * @param turn - assistant text and the reason the turn ended with.
 * @returns the decision the intake loop acts on.
 */
export function supervisionOf(turn: TurnResult): Supervision {
  if (turn.reason === undefined) {
    return { accepted: false, reason: 'the supervision turn ended without a result', plans: [] }
  }
  return turn.reason.kind === 'completed'
    ? parseSupervision(turn.text)
    : { accepted: false, reason: `the supervision turn ended with ${turn.reason.kind}`, plans: [] }
}

/**
 * Read one finished turn as the report it carries.
 * @param turn - assistant text and the reason the turn ended with.
 * @returns the report the ticket records.
 */
export function reportOf(turn: TurnResult): AssignmentReport {
  const reason = turn.reason
  if (reason === undefined) return { state: 'failed', summary: 'the run ended without a turn result' }
  switch (reason.kind) {
    case 'completed':
      return parseReport(turn.text).report
    case 'aborted':
      return { state: 'dropped', summary: 'the run was cancelled' }
    case 'error':
      return { state: 'failed', summary: `${reason.error.code}: ${reason.error.message}` }
    default:
      return { state: 'failed', summary: `the run ended with ${reason.kind}` }
  }
}

/**
 * Build the executor this Host uses.
 * @param ctx - context carrying `ctx.agents` and `ctx.sessions`.
 * @param options - working directory, session prefix, and optional model route.
 * @returns a worker the engine can lease from.
 */
export function createInProcessWorker(ctx: Context, options: InProcessWorkerOptions): Worker {
  const model = options.model
  return {
    lease: async (brief: WorkerBrief): Promise<WorkerLease> => {
      const sessionId = SessionId(
        `${options.sessionPrefix ?? 'superagent-worker-'}${brief.ticket}-${String(Date.now())}`,
      )
      const directory = await options.directoryOf(brief.ticket)
      const handle = await ctx.agents.create({
        sessionId,
        meta: {
          cwd: directory,
          ...options.agentPreset === undefined ? {} : { agentPreset: options.agentPreset },
        },
        agentOptions: {
          provider: model.provider, model: model.model,
          ...options.maxTokens === undefined ? {} : { maxTokens: options.maxTokens },
        },
        ...options.setup === undefined ? {} : { setup: options.setup },
      })
      // Confine the run to the directory it was handed, in the mechanism rather than in prose.
      if (options.permissionPreset !== undefined) {
        const presets = ctx.get('permissionPresets')
        presets?.set(handle.agent.session, options.permissionPreset)
      }
      let disposed = false
      const dispose = async (): Promise<void> => {
        if (disposed) return
        disposed = true
        await handle.dispose()
      }
      return {
        session: brandString<SessionId>(sessionId),
        directory,
        run: async (ticketBrief: WorkerBrief): Promise<AssignmentReport> => {
          try {
            return reportOf(await runTurn(ctx, handle.agent.session, handle.agent,
              workerBriefText(ticketBrief, directory)))
          } finally {
            await dispose()
          }
        },
      }
    },
  }
}

/** How one Host decides what a request becomes. */
export interface InProcessSupervisorOptions {
  /** Directory the planning turn reads, ordinarily the repository it plans against. */
  readonly directory: string
  /** Prefix of the Session identity a supervision turn uses. */
  readonly sessionPrefix?: string
  /** Model route every supervision turn uses. */
  readonly model: { readonly provider: string; readonly model: string }
  /** Output-token budget one turn may spend; omitted keeps the route's default. */
  readonly maxTokens?: number
}

/**
 * Build the supervisor this Host uses: one child Agent reads a request and
 * writes the work it becomes, and the engine still decides what authority that
 * work earns.
 * @param ctx - context carrying `ctx.agents` and `ctx.sessions`.
 * @param supervisorOptions - directory to plan in, session prefix, and model route.
 * @returns a supervisor the intake loop can consult.
 */
export function createInProcessSupervisor(
  ctx: Context,
  supervisorOptions: InProcessSupervisorOptions,
): Supervisor {
  return {
    supervise: async (request: SupervisorRequest): Promise<Supervision> => {
      const sessionId = SessionId(`${supervisorOptions.sessionPrefix ?? 'superagent-supervisor-'}${request.trigger.id}-${String(Date.now())}`)
      const handle = await ctx.agents.create({
        sessionId,
        meta: { cwd: supervisorOptions.directory },
        agentOptions: {
          provider: supervisorOptions.model.provider,
          model: supervisorOptions.model.model,
          ...supervisorOptions.maxTokens === undefined ? {} : { maxTokens: supervisorOptions.maxTokens },
        },
      })
      try {
        return supervisionOf(await runTurn(ctx, handle.agent.session, handle.agent,
          supervisorBriefText(request.trigger, request.policyVersion)))
      } finally {
        await handle.dispose()
      }
    },
  }
}

/**
 * Build the reviewer this Host uses: one child Agent reads the result and writes
 * its verdict, and the round it was asked about is the round it answers for.
 * @param ctx - context carrying `ctx.agents` and `ctx.sessions`.
 * @param options - working directory, session prefix, and model route.
 * @returns a reviewer the engine can consult.
 */
export function createInProcessReviewer(ctx: Context, options: InProcessWorkerOptions): Reviewer {
  return {
    review: async (brief: ReviewerBrief): Promise<ReviewVerdict> => {
      const sessionId = SessionId(`${options.sessionPrefix ?? 'superagent-review-'}${brief.ticket}-${String(Date.now())}`)
      const handle = await ctx.agents.create({
        sessionId,
        meta: { cwd: await options.directoryOf(brief.ticket) },
        agentOptions: {
          provider: options.model.provider, model: options.model.model,
          ...options.maxTokens === undefined ? {} : { maxTokens: options.maxTokens },
        },
      })
      try {
        const turn = await runTurn(ctx, handle.agent.session, handle.agent, reviewerBriefText(brief))
        return parseReview(turn.text, brief.round + 1)
      } finally {
        await handle.dispose()
      }
    },
  }
}

/**
 * Drive one turn and read its report.
 * @param ctx - context carrying the Session service.
 * @param session - Session the run owns.
 * @param agent - agent the run drives.
 * @param brief - work the turn performs.
 * @returns the report the turn wrote.
 */
async function runTurn(
  ctx: Context,
  session: Session,
  agent: WorkerAgent,
  prompt: string,
): Promise<TurnResult> {
  const turn: TurnResult = { text: '', reason: undefined }
  const stop = ctx.on('session/event', (eventSession, event) => {
    if (eventSession !== session) return
    if (event.type === 'assistant/message') {
      turn.text = event.data.message.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('')
    }
    if (event.type === 'turn/end') turn.reason = event.data.reason
  })
  try {
    agent.followup(createUserMessage({
      content: [{ type: 'text', text: prompt }],
      source: { kind: 'user' },
    }))
    await agent.whenIdle()
    await ctx.sessions.flush(session)
  } finally {
    stop()
  }
  return turn
}

export { createStorageStore, superagentDomain } from './store.ts'
export type { StorageStore } from './store.ts'
