/**
 * Memory dream: offline memory consolidation.
 * Collects a session window, backfills missing summaries, integrates across
 * sessions via structured model calls, and curates the injection layer.
 * @module @tomato/memory-dream
 */

import { Context, Service } from '@tomato/cordis'
import type { Volatile } from '@tomato/cordis'
import type { Session } from '@tomato/session'
import { appendPluginRecord } from '@tomato/session'
import type {} from '@tomato/session-query'
import type { MemoryView } from '@tomato/experimental-memory'
import type { Domain } from '@tomato/storage-domain'
import z from '@tomato/schemastery'
import { dreamDomain, INITIAL_CURSOR } from './cursor.ts'
import type { DreamCursor, DreamOutcome, DreamTarget } from './types.ts'
import { collectWindowSessions, assembleSummaryChains } from './collect.ts'
import { detectBackfillGaps } from './backfill.ts'
import { buildWorklist } from './worklist.ts'
import { chunkWorklist, worklistDigest } from './chunk.ts'
import { renderChunk } from './render.ts'
import { dreamCall } from './call.ts'
import { applyPlan } from './apply.ts'
import type { ApplyMode } from './apply.ts'
import { DREAM_SYSTEM } from './prompt.ts'

/** Between the rendered inputs of two chunks in the logged record. */
export const DREAM_INPUT_SEPARATOR = '\n\n── next chunk ──\n\n'

export const name = 'memory-dream'
export const inject = ['memory', 'llm', 'sessionQuery', 'storageDomain']

export type * from './types.ts'
export { DREAM_SYSTEM } from './prompt.ts'
export { parseDreamPlan, validatePlanOps } from './plan.ts'
export { estimateTokens } from './render.ts'
export { buildWorklist } from './worklist.ts'
export { chunkWorklist, worklistDigest } from './chunk.ts'
export { collectWindowSessions, assembleSummaryChains } from './collect.ts'
export { detectBackfillGaps, formatSummaryChain } from './backfill.ts'
export { dreamDomain, INITIAL_CURSOR } from './cursor.ts'
export { dreamCall } from './call.ts'
export { applyPlan } from './apply.ts'
export type { ApplyMode } from './apply.ts'

declare module '@tomato/cordis' {
  interface Context {
    memoryDream: MemoryDreamService
  }
}

declare module '@tomato/llm' {
  interface LlmRequestPurposeMap {
    'memory-dream': true
  }
  interface MessageSourceMap {
    /** Dream consolidation request input; never part of a conversation surface.
     * @persistenceAttribution
     */
    'experimental-memory-dream': { kind: 'experimental-memory-dream' } & import('@tomato/llm').ContextFormed
  }
}

declare module '@tomato/session/types' {
  interface PluginRecordMap {
    /** One dream run: its route, input, plan, and outcome. */
    'plugin:memory-dream/run': DreamRunRecord
  }
}

/** Logged record of one dream run. */
export interface DreamRunRecord {
  readonly route: { readonly provider: string; readonly model: string }
  readonly system: string
  readonly input: string
  /** Raw model replies of this run, in chunk order. */
  readonly replies: readonly string[]
  readonly maxTokens: number
  readonly outcome: DreamOutcome
}

/** Read one field Loader publishes as a live reference or a direct caller passes plain. */
function current(value: number | Volatile<number | undefined> | undefined): number | undefined
function current(value: boolean | Volatile<boolean | undefined> | undefined): boolean | undefined
function current(value: string | Volatile<string | undefined> | undefined): string | undefined
function current(value: string | number | boolean | Volatile<string | number | boolean | undefined> | undefined) {
  return value === undefined || typeof value !== 'object' ? value : value.get()
}

/** Settings the Memory Dream bundle passes to this plugin. */
export interface Config {
  /** Whether automatic dream runs are enabled. */
  enabled?: boolean | Volatile<boolean | undefined>
  /** How aggressively to apply plans. */
  applyMode?: string | Volatile<string | undefined>
  /** Explicit provider; must be paired with `model`. */
  provider?: string | Volatile<string | undefined>
  /** Explicit model; must be paired with `provider`. */
  model?: string | Volatile<string | undefined>
  /** Output-token cap per call. */
  maxTokens?: number | Volatile<number | undefined>
  /** Deadline per call in milliseconds. */
  timeoutMs?: number | Volatile<number | undefined>
  /** Maximum targets per chunk. */
  maxTargetsPerChunk?: number | Volatile<number | undefined>
  /** Maximum plan operations per call. */
  maxPlanOps?: number | Volatile<number | undefined>
  /** Maximum chunks to process per run. */
  maxChunksPerRun?: number | Volatile<number | undefined>
  /** Hours between automatic runs. */
  minIntervalHours?: number | Volatile<number | undefined>
  /** Minimum new episodes since last run to trigger. */
  minNewEpisodes?: number | Volatile<number | undefined>
  /** Maximum characters a session summary chain can carry before backfill. */
  maxChainChars?: number | Volatile<number | undefined>
  /** Safety margin in tokens subtracted from the context window. */
  safetyTokens?: number | Volatile<number | undefined>
}

interface ConfigInput {
  enabled?: boolean
  applyMode?: string
  provider?: string
  model?: string
  maxTokens?: number
  timeoutMs?: number
  maxTargetsPerChunk?: number
  maxPlanOps?: number
  maxChunksPerRun?: number
  minIntervalHours?: number
  minNewEpisodes?: number
  maxChainChars?: number
  safetyTokens?: number
}

export const Config: z<ConfigInput, Config> = z.object({
  enabled: z.boolean().default(false).volatile(),
  applyMode: z.string().default('report').volatile(),
  provider: z.string().volatile(),
  model: z.string().volatile(),
  maxTokens: z.number().step(1).min(256).max(8192).default(1500).volatile(),
  timeoutMs: z.number().step(1).min(5000).max(120000).default(30000).volatile(),
  maxTargetsPerChunk: z.number().step(1).min(1).max(50).default(12).volatile(),
  maxPlanOps: z.number().step(1).min(1).max(30).default(12).volatile(),
  maxChunksPerRun: z.number().step(1).min(1).max(10).default(1).volatile(),
  minIntervalHours: z.number().step(1).min(1).max(168).default(24).volatile(),
  minNewEpisodes: z.number().step(1).min(1).max(100).default(8).volatile(),
  maxChainChars: z.number().step(1).min(1000).max(50000).default(10000).volatile(),
  safetyTokens: z.number().step(1).min(100).max(5000).default(500).volatile(),
})

/** Resolved limits from config. */
interface DreamLimits {
  readonly maxTokens: number
  readonly timeoutMs: number
  readonly maxTargetsPerChunk: number
  readonly maxPlanOps: number
  readonly maxChunksPerRun: number
  readonly minIntervalHours: number
  readonly minNewEpisodes: number
  readonly maxChainChars: number
  readonly safetyTokens: number
}

function resolveLimits(config: Config): DreamLimits {
  return {
    maxTokens: current(config.maxTokens) ?? 1500,
    timeoutMs: current(config.timeoutMs) ?? 30000,
    maxTargetsPerChunk: current(config.maxTargetsPerChunk) ?? 12,
    maxPlanOps: current(config.maxPlanOps) ?? 12,
    maxChunksPerRun: current(config.maxChunksPerRun) ?? 1,
    minIntervalHours: current(config.minIntervalHours) ?? 24,
    minNewEpisodes: current(config.minNewEpisodes) ?? 8,
    maxChainChars: current(config.maxChainChars) ?? 10000,
    safetyTokens: current(config.safetyTokens) ?? 500,
  }
}

function resolveRoute(config: Config): { provider: string; model: string } | undefined {
  const provider = current(config.provider)
  const model = current(config.model)
  if ((provider === undefined) !== (model === undefined)) {
    throw new TypeError('memory-dream: provider and model must be supplied together')
  }
  return provider === undefined || model === undefined ? undefined : { provider, model }
}

/** Dream consolidation service: checks when a run is due and consolidates memory episodes. */
export class MemoryDreamService extends Service {
  static inject = ['memory', 'llm', 'sessionQuery', 'storageDomain']
  private cursor: DreamCursor = INITIAL_CURSOR
  private dreamDomain: Domain<typeof dreamDomain> | undefined
  private running = false

  constructor(ctx: Context, private readonly config: Config = {}) {
    super(ctx, 'memoryDream')
    resolveRoute(config)
  }

  protected async [Service.init](): Promise<void> {
    this.dreamDomain = await this.ctx.storageDomain.open(dreamDomain)
    this.cursor = this.dreamDomain.global.get()
    this.ctx.effect(() => async () => {
      await this.dreamDomain?.close()
    }, 'memory-dream: close dream domain')
  }

  /** Whether a dream run is currently in progress. */
  get isRunning(): boolean {
    return this.running
  }

  /** Current cursor state.
   * @returns a copy of the cursor the next run starts from.
   */
  getCursor(): DreamCursor {
    return { ...this.cursor }
  }

  /**
   * Check whether a dream run is due based on time and episode count.
   * @param view - memory view to check.
   * @returns whether a run should start.
   */
  isDue(view: MemoryView): boolean {
    const enabled = current(this.config.enabled)
    if (enabled !== true) return false
    if (this.running) return false

    const limits = resolveLimits(this.config)
    const now = Date.now()
    const hoursSinceLastRun = (now - this.cursor.lastRunAt) / 3600000
    if (hoursSinceLastRun < limits.minIntervalHours) return false

    const episodes = this.ctx.memory.listEpisodes(view)
    const newEpisodes = episodes.filter(e => e.createdAt > this.cursor.watermark)
    return newEpisodes.length >= limits.minNewEpisodes
  }

  /**
   * Run one dream consolidation cycle.
   * @param session - session that triggered this run (for logging).
   * @param view - memory view to consolidate.
   * @returns the run outcome.
   */
  async run(session: Session, view: MemoryView): Promise<DreamOutcome> {
    if (this.running) {
      return { status: 'skipped', reason: 'already running', chunksProcessed: 0, chunksTotal: 0, targetsCovered: 0, targetsPending: 0, opResults: [], notes: [], inputTokens: 0, outputTokens: 0, modelRoute: { provider: 'memory', model: 'unavailable' } }
    }

    this.running = true
    try {
      return await this.runInner(session, view)
    } finally {
      this.running = false
    }
  }

  private async runInner(session: Session, view: MemoryView): Promise<DreamOutcome> {
    const limits = resolveLimits(this.config)
    const applyMode = (current(this.config.applyMode) ?? 'report') as ApplyMode
    const route = resolveRoute(this.config)

    // Resolve route from session if not configured
    let provider: string
    let model: string
    if (route !== undefined) {
      provider = route.provider
      model = route.model
    } else {
      // Read the session's latest request header via sessionQuery
      const snapshot = await this.ctx.sessionQuery.readSession(session.id)
      const header = snapshot.events.findLast(e => e.type === 'request/header')
      if (header?.type !== 'request/header') {
        return { status: 'skipped', reason: 'no model route available', chunksProcessed: 0, chunksTotal: 0, targetsCovered: 0, targetsPending: 0, opResults: [], notes: [], inputTokens: 0, outputTokens: 0, modelRoute: { provider: 'memory', model: 'unavailable' } }
      }
      provider = header.data.header.config.provider
      model = header.data.header.config.model
    }

    // Phase 1: Collect window sessions and assemble summary chains
    const since = this.cursor.watermark > 0 ? this.cursor.watermark : Date.now() - 90 * 86400000
    const sessions = await collectWindowSessions(this.ctx, view, since)
    const chains = assembleSummaryChains(this.ctx, view, sessions)

    // Phase 2: Detect backfill gaps (no model calls for now; just detect)
    const gaps = detectBackfillGaps(chains, limits.maxChainChars)

    // Phase 3: Build worklist
    const targets = buildWorklist(this.ctx, view, {
      maxPinnedRecords: 20,
      staleCandidateDays: 30,
      minRepeatedFactEvidence: 2,
    })

    if (targets.length === 0 && gaps.length === 0) {
      const outcome: DreamOutcome = {
        status: 'completed', chunksProcessed: 0, chunksTotal: 0, targetsCovered: 0, targetsPending: 0,
        opResults: [], notes: [], inputTokens: 0, outputTokens: 0, modelRoute: { provider, model },
      }
      await this.advanceCursor([], Date.now())
      return outcome
    }

    // Phase 4: Chunk the worklist
    const chunks = chunkWorklist(targets, {
      maxTargetsPerChunk: limits.maxTargetsPerChunk,
      maxTokensPerChunk: 4000,
    })

    // Phase 5: Process chunks
    const digest = worklistDigest(targets)
    const startIndex = this.cursor.targetDigest === digest ? this.cursor.index : 0
    const maxChunks = Math.min(startIndex + limits.maxChunksPerRun, chunks.length)
    let totalInputTokens = 0
    let totalOutputTokens = 0
    const allOpResults: import('./types.ts').DreamOpResult[] = []
    const allNotes: string[] = []
    const renderedInputs: string[] = []
    const replies: string[] = []
    let chunksProcessed = 0

    for (let i = startIndex; i < maxChunks; i++) {
      const chunk = chunks[i]
      if (chunk === undefined) continue
      const knownIds = new Set<string>()
      for (const target of chunk.targets) {
        for (const id of target.recordIds) knownIds.add(id)
        for (const id of target.episodeIds) knownIds.add(id)
      }

      const rendered = renderChunk(this.ctx, view, chunk.targets, chains, 4000)

      const callResult = await dreamCall(this.ctx, {
        provider, model,
        maxTokens: limits.maxTokens,
        timeoutMs: limits.timeoutMs,
        input: rendered.input,
        knownIds,
        maxPlanOps: limits.maxPlanOps,
        signal: new AbortController().signal,
      })

      if (callResult.usage !== undefined) {
        totalInputTokens += callResult.usage.inputTokens
        totalOutputTokens += callResult.usage.outputTokens
      }

      if (callResult.status === 'failed') {
        const outcome: DreamOutcome = {
          status: 'failed', ...(callResult.reason !== undefined ? { reason: callResult.reason } : {}),
          chunksProcessed, chunksTotal: chunks.length,
          targetsCovered: chunksProcessed * limits.maxTargetsPerChunk, targetsPending: targets.length,
          opResults: allOpResults, notes: allNotes, inputTokens: totalInputTokens, outputTokens: totalOutputTokens,
          modelRoute: { provider, model },
        }
        this.logRun(session, provider, model, renderedInputs.join(DREAM_INPUT_SEPARATOR), replies, limits.maxTokens, outcome)
        return outcome
      }

      renderedInputs.push(rendered.input)
      if (callResult.reply !== undefined) replies.push(callResult.reply)
      if (callResult.plan !== undefined) {
        allNotes.push(...callResult.plan.notes)
        const opResults = await applyPlan(this.ctx, view, callResult.plan, applyMode, session.id)
        allOpResults.push(...opResults)
      }

      chunksProcessed++
    }

    // Advance cursor
    const nextIndex = maxChunks >= chunks.length ? 0 : maxChunks
    await this.advanceCursor(targets, Date.now(), nextIndex, digest)

    const outcome: DreamOutcome = {
      status: 'completed', chunksProcessed, chunksTotal: chunks.length,
      targetsCovered: Math.min(chunksProcessed * limits.maxTargetsPerChunk, targets.length),
      targetsPending: Math.max(0, targets.length - chunksProcessed * limits.maxTargetsPerChunk),
      opResults: allOpResults, notes: allNotes, inputTokens: totalInputTokens, outputTokens: totalOutputTokens,
      modelRoute: { provider, model },
    }
    this.logRun(session, provider, model, renderedInputs.join(DREAM_INPUT_SEPARATOR), replies, limits.maxTokens, outcome)
    return outcome
  }

  private async advanceCursor(targets: readonly DreamTarget[], now: number, index?: number, digest?: string): Promise<void> {
    const next: DreamCursor = {
      index: index ?? 0,
      targetDigest: digest ?? worklistDigest(targets),
      shrinkStreak: 0,
      lastRunAt: now,
      watermark: now,
    }
    this.cursor = next
    if (this.dreamDomain !== undefined) {
      await this.dreamDomain.global.set(next)
    }
  }

  private logRun(
    session: Session,
    provider: string,
    model: string,
    input: string,
    replies: readonly string[],
    maxTokens: number,
    outcome: DreamOutcome,
  ): void {
    try {
      appendPluginRecord(session, 'plugin:memory-dream/run', {
        route: { provider, model },
        system: DREAM_SYSTEM,
        input,
        replies,
        maxTokens,
        outcome,
      })
    } catch {
      // Session disposed mid-run; the outcome is still returned.
    }
  }
}

export default MemoryDreamService
