/**
 * Muse insights Host capability: asynchronously organize the day's Sessions
 * into a recap and periodically derive the owner's unfinished tasks.
 *
 * One Host service owns retention (`tomato_muse_insights`), generation bounds,
 * the background cadence, and the Client Remote face. Every run is serialized
 * per operation and per owner/day, cancellation aborts model and corpus work,
 * and teardown waits for accepted runs before it closes the domain. Records
 * belong to the signed-in account where the Host names one, or to the single
 * local owner where it does not.
 * @module @tomato/experimental-muse-insights
 */

import z from '@tomato/schemastery'
import { Service, type Context, type Fiber, type Volatile } from '@tomato/cordis'
import { Remote, TypertRemoteService } from '@tomato/typert-protocol'
import type {} from '@tomato/cordis-plugin-loader'
import type {} from '@tomato/cordis-plugin-timer'
import type {} from '@tomato/gateway'
import type {} from '@tomato/session-query'
import type { Domain } from '@tomato/storage-domain'
import type {} from '@tomato/tool-todo'
import { buildUnfinishedTasks } from './analyze.ts'
import { collectDay, collectTodos, type CorpusReadOptions, type DayCorpus } from './collect.ts'
import { dayRange, daysBefore, type DayRange } from './day.ts'
import {
  analysisKey,
  museInsightsDomain,
  recapKey,
  servedRecap,
  type StoredAnalysis,
  type StoredRecap,
} from './domain.ts'
import { summarizeDay, type SummarySettings } from './summarize.ts'
import type { MuseInsightsSnapshot, UnfinishedAnalysis } from './types.ts'

export type * from './types.ts'

declare module '@tomato/cordis' {
  interface Context {
    /** Host-owned daily recaps and unfinished-task analysis for the Muse bundle. */
    museInsights: MuseInsights
  }
}

/** Generation and retention policy for the capability. Every field is live-editable. */
export interface Config {
  /** Minutes between daily-recap attempts; omission defaults to 30. */
  recapIntervalMinutes?: Volatile<number>
  /** Minutes between unfinished-task analyses; omission defaults to 15. */
  taskIntervalMinutes?: Volatile<number>
  /** Seconds after activation before the first background attempt; omission defaults to 5. */
  initialDelaySeconds?: Volatile<number>
  /** Local days of Session creation retained as recap and task evidence; omission defaults to 7. */
  lookbackDays?: Volatile<number>
  /** Sessions read per recap or analysis, newest first; omission defaults to 20. */
  maxSessions?: Volatile<number>
  /** UTF-16 characters kept from one message; omission defaults to 700. */
  maxMessageChars?: Volatile<number>
  /** Messages retained per Session; omission defaults to 24. */
  maxMessagesPerSession?: Volatile<number>
  /** Maximum UTF-8 bytes of the prepared recap input; omission defaults to 48 000. */
  maxInputBytes?: Volatile<number>
  /** Output-token cap for one recap request; omission defaults to 4 096. */
  maxOutputTokens?: Volatile<number>
  /** End-to-end recap request deadline in milliseconds; omission defaults to 60 000. */
  timeoutMs?: Volatile<number>
  /** Retained unfinished tasks; omission defaults to 30. */
  maxTasks?: Volatile<number>
  /** Retained local days of recaps per owner; omission defaults to 30. */
  maxRecapDays?: Volatile<number>
  /** Explicit recap provider route; omission follows the latest Session request route. */
  provider?: Volatile<string | undefined>
  /** Explicit recap model id; always paired with `provider`. */
  model?: Volatile<string | undefined>
}

/** Fully resolved policy. */
interface ResolvedConfig extends SummarySettings {
  readonly recapIntervalMs: number
  readonly taskIntervalMs: number
  readonly initialDelayMs: number
  readonly lookbackDays: number
  readonly lookbackMs: number
  readonly maxSessions: number
  readonly maxMessageChars: number
  readonly maxMessagesPerSession: number
  readonly maxTasks: number
  readonly maxRecapDays: number
}

/** Raw Loader input before each volatile field becomes its live reference. */
interface ConfigInput {
  recapIntervalMinutes?: number
  taskIntervalMinutes?: number
  initialDelaySeconds?: number
  lookbackDays?: number
  maxSessions?: number
  maxMessageChars?: number
  maxMessagesPerSession?: number
  maxInputBytes?: number
  maxOutputTokens?: number
  timeoutMs?: number
  maxTasks?: number
  maxRecapDays?: number
  provider?: string
  model?: string
}

/** Loader schema; the generated configuration catalog is the exhaustive field source. */
export const Config: z<ConfigInput, Config> = z.object({
  recapIntervalMinutes: z.number().step(1).min(1).max(1_440).default(30).volatile(),
  taskIntervalMinutes: z.number().step(1).min(1).max(1_440).default(15).volatile(),
  initialDelaySeconds: z.number().step(1).min(1).max(3_600).default(5).volatile(),
  lookbackDays: z.number().step(1).min(1).max(365).default(7).volatile(),
  maxSessions: z.number().step(1).min(1).max(200).default(20).volatile(),
  maxMessageChars: z.number().step(1).min(80).max(8_000).default(700).volatile(),
  maxMessagesPerSession: z.number().step(1).min(2).max(200).default(24).volatile(),
  maxInputBytes: z.number().step(1).min(1_024).max(1_048_576).default(48_000).volatile(),
  maxOutputTokens: z.number().step(1).min(64).max(32_768).default(4_096).volatile(),
  timeoutMs: z.number().step(1).min(1_000).max(2_147_483_647).default(60_000).volatile(),
  maxTasks: z.number().step(1).min(1).max(200).default(30).volatile(),
  maxRecapDays: z.number().step(1).min(1).max(365).default(30).volatile(),
  provider: z.string().volatile(),
  model: z.string().volatile(),
})

/**
 * Validate one configuration outside Loader normalization.
 * @param config - partial policy supplied by a direct caller.
 * @returns every resolved bound and the optional model route.
 * @throws when a bound is out of range or the route pair is incomplete.
 */
function resolveConfig(config: Config): ResolvedConfig {
  const integer = (value: number | undefined, name: string, min: number, max: number, fallback: number): number => {
    const resolved = value ?? fallback
    if (!Number.isSafeInteger(resolved) || resolved < min || resolved > max) {
      throw new TypeError(`muse-insights: ${name} must be a safe integer between ${min} and ${max}`)
    }
    return resolved
  }
  const recapMinutes = integer(config.recapIntervalMinutes?.get(), 'recapIntervalMinutes', 1, 1_440, 30)
  const taskMinutes = integer(config.taskIntervalMinutes?.get(), 'taskIntervalMinutes', 1, 1_440, 15)
  const lookbackDays = integer(config.lookbackDays?.get(), 'lookbackDays', 1, 365, 7)
  const provider = config.provider?.get()?.trim()
  const model = config.model?.get()?.trim()
  if ((provider === undefined) !== (model === undefined) || provider === '' || model === '') {
    throw new TypeError('muse-insights: provider and model must be supplied together as non-empty strings')
  }
  return {
    recapIntervalMs: recapMinutes * 60_000,
    taskIntervalMs: taskMinutes * 60_000,
    initialDelayMs: integer(config.initialDelaySeconds?.get(), 'initialDelaySeconds', 1, 3_600, 5) * 1_000,
    lookbackDays,
    lookbackMs: lookbackDays * 86_400_000,
    maxSessions: integer(config.maxSessions?.get(), 'maxSessions', 1, 200, 20),
    maxMessageChars: integer(config.maxMessageChars?.get(), 'maxMessageChars', 80, 8_000, 700),
    maxMessagesPerSession: integer(config.maxMessagesPerSession?.get(), 'maxMessagesPerSession', 2, 200, 24),
    maxInputBytes: integer(config.maxInputBytes?.get(), 'maxInputBytes', 1_024, 1_048_576, 48_000),
    maxOutputTokens: integer(config.maxOutputTokens?.get(), 'maxOutputTokens', 64, 32_768, 4_096),
    timeoutMs: integer(config.timeoutMs?.get(), 'timeoutMs', 1_000, 2_147_483_647, 60_000),
    maxTasks: integer(config.maxTasks?.get(), 'maxTasks', 1, 200, 30),
    maxRecapDays: integer(config.maxRecapDays?.get(), 'maxRecapDays', 1, 365, 30),
    ...provider === undefined || model === undefined ? {} : { provider, model },
  }
}

/**
 * Host service behind `ctx.remote.museInsights`.
 *
 * `snapshot()` is a pure read of retained state; `refresh()` runs both
 * operations now and waits for their accepted work. Both return the complete
 * Client-facing value, so no separate change feed is needed.
 */
export default class MuseInsights extends TypertRemoteService {
  static inject = ['sessionQuery', 'storageDomain', 'llm']

  static Config = Config

  private readonly config: Config
  private domain: Domain<typeof museInsightsDomain> | undefined
  private timerFiber: Fiber | undefined
  private timerCadence = ''
  private readonly recaps = new Map<string, Map<string, StoredRecap>>()
  private readonly analyses = new Map<string, StoredAnalysis>()
  private readonly operations = new Set<Promise<unknown>>()
  private readonly recapRuns = new Map<string, Promise<void>>()
  private readonly recapAttempts = new Map<string, number>()
  private tasksRun: Promise<void> | undefined
  private readonly stopped = new AbortController()
  private closing = false
  private tasksRunning = false
  private recapRunning = false

  /**
   * @param ctx - Host context carrying Session query, storage, LLM, and optional timer.
   * @param config - composition policy, validated here and by the Loader schema.
   */
  constructor(ctx: Context, config: Config = {}) {
    super(ctx, 'museInsights', { namespace: 'museInsights' })
    this.config = config
  }

  protected async [Service.init](): Promise<void> {
    const domain = await this.ctx.storageDomain.open(museInsightsDomain)
    try {
      this.load(domain)
    } catch (error: unknown) {
      await domain.close()
      throw error
    }
    this.domain = domain
    this.ctx.effect(() => {
      this.startTimers()
      this.ctx.on('loader/volatile-update', () => { this.startTimers() })
      return async () => {
        this.closing = true
        this.stopped.abort()
        await this.timerFiber?.dispose()
        await Promise.allSettled([...this.operations])
        await domain.close()
      }
    }, 'muse-insights: background runs and storage')
  }

  /** Read the current policy from its live references. */
  private policy(): ResolvedConfig {
    return resolveConfig(this.config)
  }

  /** Mount the timers when they are absent or the configured cadence moved. */
  private startTimers(): void {
    if (this.closing) return
    const { initialDelayMs, taskIntervalMs, recapIntervalMs } = this.policy()
    const cadence = `${initialDelayMs}:${taskIntervalMs}:${recapIntervalMs}`
    if (this.timerFiber !== undefined && cadence === this.timerCadence) return
    void this.timerFiber?.dispose()
    this.timerCadence = cadence
    this.timerFiber = this.ctx.inject(['timer'], (child) => {
      const initial = child.timeout(() => { this.requestTasks(); this.requestRecap() }, initialDelayMs)
      const tasks = child.interval(() => { this.requestTasks() }, taskIntervalMs)
      const recap = child.interval(() => { this.requestRecap() }, recapIntervalMs)
      return () => { initial(); tasks(); recap() }
    })
  }

  /**
   * Read the retained recap and latest task analysis for the current owner.
   * @param signal - caller cancellation, checked before the read.
   * @returns the complete Client-facing snapshot.
   */
  @Remote
  snapshot(signal: AbortSignal): Promise<MuseInsightsSnapshot> {
    signal.throwIfAborted()
    const owner = this.owner()
    const now = Date.now()
    const config = this.policy()
    const value = this.snapshotOf(owner, now)
    if (owner !== undefined && !this.closing) {
      const stale = value.unfinished.analyzedAt === 0 || now - value.unfinished.analyzedAt >= config.taskIntervalMs
      if (stale) this.requestTasks()
      if (value.recap === null || value.recap.day !== value.day) {
        const key = recapKey(owner, value.day)
        if (now - (this.recapAttempts.get(key) ?? 0) >= config.recapIntervalMs) this.requestRecap()
      }
    }
    return Promise.resolve(value)
  }

  /**
   * Run the day's recap and the unfinished-task analysis now.
   * @param signal - caller cancellation, checked before and after the runs.
   * @returns the snapshot after the accepted runs.
   */
  @Remote
  async refresh(signal: AbortSignal): Promise<MuseInsightsSnapshot> {
    signal.throwIfAborted()
    const owner = this.owner()
    if (this.closing) return this.snapshotOf(owner, Date.now())
    if (owner !== undefined) {
      await Promise.all([this.ensureTasks(), this.ensureRecap(owner, dayRange(Date.now()))])
    }
    signal.throwIfAborted()
    return this.snapshotOf(this.owner(), Date.now())
  }

  /** Snapshot for one resolved owner and instant. */
  private snapshotOf(owner: string | undefined, now: number): MuseInsightsSnapshot {
    const day = dayRange(now)
    const recap = owner === undefined ? undefined : this.latestRecap(owner)
    const analysis: UnfinishedAnalysis = owner === undefined
      ? { analyzedAt: 0, tasks: [] }
      : this.analyses.get(owner)?.analysis ?? { analyzedAt: 0, tasks: [] }
    return {
      available: owner !== undefined,
      day: day.key,
      recap: recap === undefined ? null : servedRecap(recap.recap),
      unfinished: analysis,
      analyzing: this.tasksRunning || this.recapRunning,
    }
  }

  /** Current account owner, matching the memory service's owner vocabulary. */
  private owner(): string | undefined {
    const account = this.ctx.get('tomatoAccount')
    if (account === undefined) return 'local'
    const current = account.current()
    return current.status === 'signed-in' ? `account:${current.user.id}` : undefined
  }

  /** Latest retained recap for one owner, newest local day first. */
  private latestRecap(owner: string): StoredRecap | undefined {
    const days = this.recaps.get(owner)
    if (days === undefined) return undefined
    const key = [...days.keys()].sort().at(-1)
    return key === undefined ? undefined : days.get(key)
  }

  /** Schedule one task analysis, sharing a run already in flight. */
  private requestTasks(): void {
    if (this.closing || this.domain === undefined) return
    void this.ensureTasks().catch((error: unknown) => { this.warn('unfinished-task analysis failed', error) })
  }

  /** Schedule the day's recap, sharing a run for the same owner and day. */
  private requestRecap(): void {
    if (this.closing || this.domain === undefined) return
    const owner = this.owner()
    if (owner === undefined) return
    void this.ensureRecap(owner, dayRange(Date.now())).catch((error: unknown) => { this.warn('daily recap failed', error) })
  }

  /** Share or start the current unfinished-task analysis. */
  private ensureTasks(): Promise<void> {
    if (this.tasksRun !== undefined) return this.tasksRun
    const run = this.track(this.executeTasks())
    this.tasksRun = run
    const clear = (): void => { if (this.tasksRun === run) this.tasksRun = undefined }
    void run.then(clear, clear)
    return run
  }

  /** Share or start one owner/day recap. */
  private ensureRecap(owner: string, day: DayRange): Promise<void> {
    const key = recapKey(owner, day.key)
    const running = this.recapRuns.get(key)
    if (running !== undefined) return running
    this.recapAttempts.set(key, Date.now())
    const run = this.track(this.executeRecap(owner, day))
    this.recapRuns.set(key, run)
    const clear = (): void => { if (this.recapRuns.get(key) === run) this.recapRuns.delete(key) }
    void run.then(clear, clear)
    return run
  }

  /** Track accepted work until it settles, so teardown closes storage afterwards. */
  private track<T>(operation: Promise<T>): Promise<T> {
    this.operations.add(operation)
    const clear = (): void => { this.operations.delete(operation) }
    void operation.then(clear, clear)
    return operation
  }

  /** Read pending and completed todos, merge the latest recap's open tasks, and persist the analysis. */
  private async executeTasks(): Promise<void> {
    const owner = this.owner()
    if (owner === undefined || this.domain === undefined) return
    const signal = this.stopped.signal
    const now = Date.now()
    const config = this.policy()
    this.tasksRunning = true
    try {
      const options: CorpusReadOptions = {
        signal,
        earliestCreatedAt: daysBefore(now, config.lookbackDays),
        maxSessions: config.maxSessions,
      }
      const todos = await collectTodos(this.corpus(), options)
      signal.throwIfAborted()
      const recap = this.latestRecap(owner)
      const recapTasks = recap !== undefined && recap.recap.generatedAt >= daysBefore(now, config.lookbackDays)
        ? recap.recap.openTasks
        : []
      const tasks = buildUnfinishedTasks({ todos, recapTasks, maxTasks: config.maxTasks })
      const record: StoredAnalysis = { owner, analysis: { analyzedAt: now, tasks } }
      await this.domain.table('analyses').put(analysisKey(owner), record)
      this.analyses.set(owner, record)
    } catch (error: unknown) {
      if (!signal.aborted) this.warn('unfinished-task analysis failed', error)
    } finally {
      this.tasksRunning = false
    }
  }

  /** Summarize one local day when its evidence is new, then retain and prune it. */
  private async executeRecap(owner: string, day: DayRange): Promise<void> {
    if (this.domain === undefined) return
    const signal = this.stopped.signal
    this.recapRunning = true
    try {
      const now = Date.now()
      const config = this.policy()
      const collected = await collectDay(this.corpus(), {
        signal,
        earliestCreatedAt: daysBefore(day.start, config.lookbackDays),
        maxSessions: config.maxSessions,
        day,
        maxMessageChars: config.maxMessageChars,
        maxMessagesPerSession: config.maxMessagesPerSession,
      })
      if (collected.messageCount === 0) return
      const previous = this.recaps.get(owner)?.get(day.key)
      const modelRoute = config.provider !== undefined || collected.route !== undefined
      if (previous !== undefined && previous.latestEventTime >= collected.latestEventTime
        && (previous.recap.source === 'model' || !modelRoute)) return
      signal.throwIfAborted()
      const outcome = await summarizeDay(this.ctx, config, collected, day.key, now, signal)
      signal.throwIfAborted()
      if (outcome.failure !== undefined) {
        this.warn('daily recap model call failed; retained evidence is unchanged', outcome.failure)
        if (previous !== undefined) return
      }
      const record: StoredRecap = {
        owner,
        recap: outcome.recap,
        latestEventTime: collected.latestEventTime,
        ...outcome.model === undefined ? {} : { model: outcome.model },
      }
      await this.domain.table('recaps').put(recapKey(owner, day.key), record)
      let days = this.recaps.get(owner)
      if (days === undefined) {
        days = new Map()
        this.recaps.set(owner, days)
      }
      days.set(day.key, record)
      await this.pruneRecaps(owner)
    } catch (error: unknown) {
      if (!signal.aborted) this.warn('daily recap failed', error)
    } finally {
      this.recapRunning = false
    }
  }

  /** Delete recaps outside the owner's retention window. */
  private async pruneRecaps(owner: string): Promise<void> {
    const days = this.recaps.get(owner)
    if (days === undefined || this.domain === undefined) return
    const keys = [...days.keys()].sort()
    const remove = keys.slice(0, Math.max(0, keys.length - this.policy().maxRecapDays))
    for (const day of remove) {
      await this.domain.table('recaps').delete(recapKey(owner, day))
      days.delete(day)
    }
    if (days.size === 0) this.recaps.delete(owner)
  }

  /** Load and key-validate every retained record before the service activates. */
  private load(domain: Domain<typeof museInsightsDomain>): void {
    for (const [key, record] of domain.table('recaps').entries()) {
      if (key !== recapKey(record.owner, record.recap.day)) {
        throw new Error(`muse-insights: stored recap key "${key}" differs from "${recapKey(record.owner, record.recap.day)}"`)
      }
      let days = this.recaps.get(record.owner)
      if (days === undefined) {
        days = new Map()
        this.recaps.set(record.owner, days)
      }
      days.set(record.recap.day, record)
    }
    for (const [key, record] of domain.table('analyses').entries()) {
      if (key !== analysisKey(record.owner)) {
        throw new Error(`muse-insights: stored analysis key "${key}" differs from "${analysisKey(record.owner)}"`)
      }
      this.analyses.set(record.owner, record)
    }
  }

  /** The Session query service as the narrow read face this package uses. */
  private corpus(): DayCorpus {
    return this.ctx.sessionQuery
  }

  /** Log one contained background failure. */
  private warn(message: string, error: unknown): void {
    this.ctx.logger.warn(`muse-insights: ${message}: ${error instanceof Error ? error.message : String(error)}`)
  }
}
