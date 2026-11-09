/**
 * Trace overview fold: one Trace per Host-assigned turn, i.e. per new user
 * prompt. The fold reads the same turn/step layout the ledger renders, so a
 * trace card and its ledger rows can never disagree: steps are assistant
 * records, calls are tool/subtool records, and token cost is the provider
 * usage recorded on those assistant records.
 *
 * Nothing here invents timing. A running trace reports `null` duration instead
 * of elapsed time measured against a wall clock, matching the ledger's rule for
 * in-flight records.
 *
 * @module @tomato/client/ui-trajectory/trace-overview
 */

import type { TrajectoryTurnModel } from './layout.ts'
import type { TrajectoryKey, TrajectoryTranslate } from './locales.ts'
import type { TrajectoryCellProps } from './trajectory-record.ts'

/** Lifecycle of one trace, derived from its records rather than a clock. */
export type TraceStatus = 'running' | 'completed' | 'failed'

/** Where a tool call came from, resolved from its recorded tool name. */
export type TraceToolOrigin = 'builtin' | 'mcp' | 'subagent' | 'workflow' | 'skill' | 'ptc'

/** Provider-reported token buckets for one trace. */
export interface TraceTokens {
  /** Uncached prompt input tokens. */
  input: number
  /** Prompt tokens served from a provider cache. */
  cacheRead: number
  /** Prompt tokens written into a provider cache. */
  cacheWrite: number
  /** Completion tokens, reasoning included. */
  output: number
  /** Reasoning subset of `output`; never added to the total. */
  reasoning: number
  /** Billed-equivalent total: input plus cache traffic plus output. */
  total: number
}

/** One tool name used by a trace with its origin and call count. */
export interface TraceToolUse {
  name: string
  origin: TraceToolOrigin
  count: number
}

/** Localized label of each tool family in the ledger's origin badge. */
const ORIGIN_KEY: Record<TraceToolOrigin, TrajectoryKey> = {
  builtin: 'trace.origin.builtin',
  mcp: 'trace.origin.mcp',
  subagent: 'trace.origin.subagent',
  workflow: 'trace.origin.workflow',
  skill: 'trace.origin.skill',
  ptc: 'trace.origin.ptc',
}

/**
 * Localized label of one tool family.
 * @param origin - resolved tool family.
 * @param t - Trajectory locale translator.
 * @returns the localized family label.
 */
export function traceOriginLabel(origin: TraceToolOrigin, t: TrajectoryTranslate): string {
  return t(ORIGIN_KEY[origin])
}

/** One colored pip in a trace's execution chain. */
export interface TraceChainStep {
  /** `llm` is an assistant step, `tool` a native call, `subtool` a nested PTC call, `error` a failed record. */
  kind: 'llm' | 'tool' | 'subtool' | 'error'
}

/** One trace summary card: one user prompt and everything it caused. */
export interface TraceSummary {
  /** Host-assigned turn number; also the trace identity within the session. */
  turn: number
  /** First ledger record of the trace; focusing the card scrolls the ledger here. */
  anchorIndex: number
  /** First human prompt text, or `''` when the turn carries no loaded prompt. */
  prompt: string
  status: TraceStatus
  /** Assistant records; one model call plus the tools it requested. */
  steps: number
  /** Tool and nested subtool records. */
  calls: number
  /** Records carrying an error flag. */
  errors: number
  /** Wall span for a settled trace, `null` while running or without timing. */
  durationMs: number | null
  tokens: TraceTokens
  tools: readonly TraceToolUse[]
  chain: readonly TraceChainStep[]
}

/** Whole-session trace totals rendered in the overview header. */
export interface TraceOverviewTotals {
  traces: number
  steps: number
  calls: number
  errors: number
  tokens: TraceTokens
  /** Sum of settled trace durations; `null` until at least one trace settles. */
  durationMs: number | null
}

/** Folded trace overview value. */
export interface TraceOverview {
  traces: readonly TraceSummary[]
  totals: TraceOverviewTotals
}

/** Zero token buckets, shared by empty cards and the totals line. */
export function emptyTraceTokens(): TraceTokens {
  return { input: 0, cacheRead: 0, cacheWrite: 0, output: 0, reasoning: 0, total: 0 }
}

function finiteTime(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function cellUsage(cell: TrajectoryCellProps): TraceTokens {
  const input = finiteTime(cell.input) ? cell.input : 0
  const cacheRead = finiteTime(cell.cacheRead) ? cell.cacheRead : 0
  const cacheWrite = finiteTime(cell.cacheWrite) ? cell.cacheWrite : 0
  const output = finiteTime(cell.output) ? cell.output : 0
  const reasoning = finiteTime(cell.think) ? cell.think : 0
  return {
    input,
    cacheRead,
    cacheWrite,
    output,
    reasoning,
    total: input + cacheRead + cacheWrite + output,
  }
}

function addTokens(left: TraceTokens, right: TraceTokens): TraceTokens {
  return {
    input: left.input + right.input,
    cacheRead: left.cacheRead + right.cacheRead,
    cacheWrite: left.cacheWrite + right.cacheWrite,
    output: left.output + right.output,
    reasoning: left.reasoning + right.reasoning,
    total: left.total + right.total,
  }
}

/**
 * Whether one record is still in flight.
 * @param cell - one ledger record.
 * @returns true when the record has a recorded start without its result.
 */
function isPending(cell: TrajectoryCellProps): boolean {
  if (cell.kind === 'message') {
    return cell.assistantMetrics?.completedTime === null
      || (cell.requestOnly === true && cell.timeSeconds === null)
  }
  if (cell.kind === 'tool' || cell.kind === 'subtool') return cell.outputDetail === undefined
  if (cell.kind === 'compacted') return cell.timeSeconds === null
  return false
}

function cellsOf(turn: TrajectoryTurnModel): readonly TrajectoryCellProps[] {
  return turn.groups.flatMap(group => group.cells)
}

function traceAnchor(cells: readonly TrajectoryCellProps[]): number {
  const content = cells.find(cell => cell.kind !== 'system' && cell.requestOnly !== true)
    ?? cells.find(cell => cell.kind !== 'system')
    ?? cells[0]
  return content?.index ?? 0
}

const PROMPT_PREVIEW_LIMIT = 240

function tracePrompt(cells: readonly TrajectoryCellProps[]): string {
  const user = cells.find(cell => cell.kind === 'user')
  if (user === undefined) return ''
  const markdown = user.previewMarkdown?.trim() ?? ''
  const collapsed = (markdown === '' ? user.text : markdown).replace(/\s+/g, ' ').trim()
  return collapsed.length > PROMPT_PREVIEW_LIMIT
    ? `${collapsed.slice(0, PROMPT_PREVIEW_LIMIT - 1)}…`
    : collapsed
}

/**
 * Resolve the owning plugin family from a recorded tool name. Names are the
 * only durable origin fact the log carries; MCP tools expose their server in
 * the `mcp__<server>__<tool>` convention, and the harness control tools are
 * named by their owning capability.
 * @param name - recorded tool name.
 * @returns the tool family owning the call.
 */
export function classifyToolOrigin(name: string): TraceToolOrigin {
  if (name.startsWith('mcp__')) return 'mcp'
  if (name === 'run_code' || name.startsWith('run_code_')) return 'ptc'
  if (name === 'skill' || name.startsWith('skill__')) return 'skill'
  if (name === 'workflow' || name.startsWith('workflow_')) return 'workflow'
  if (name === 'subagent' || name === 'subagent_fork' || name === 'send_message'
    || name === 'interrupt_agent' || name === 'wait_agent' || name === 'list_agents'
    || name === 'list_subagent_models' || name === 'spawn_teammate') return 'subagent'
  return 'builtin'
}

function traceTools(cells: readonly TrajectoryCellProps[]): TraceToolUse[] {
  const counts = new Map<string, TraceToolUse>()
  for (const cell of cells) {
    if (cell.kind !== 'tool' && cell.kind !== 'subtool') continue
    const name = cell.toolName ?? ''
    if (name === '') continue
    const existing = counts.get(name)
    if (existing === undefined) {
      counts.set(name, { name, origin: classifyToolOrigin(name), count: 1 })
    } else existing.count += 1
  }
  return [...counts.values()].sort((left, right) =>
    right.count - left.count || left.name.localeCompare(right.name))
}

function traceChain(cells: readonly TrajectoryCellProps[]): TraceChainStep[] {
  const chain: TraceChainStep[] = []
  for (const cell of cells) {
    if (cell.kind !== 'message' && cell.kind !== 'tool' && cell.kind !== 'subtool') continue
    chain.push({
      kind: cell.isError === true ? 'error' : cell.kind === 'message' ? 'llm' : cell.kind,
    })
  }
  return chain
}

interface TraceSpan {
  start: number
  end: number
}

function traceSpan(cells: readonly TrajectoryCellProps[]): TraceSpan | null {
  let start: number | null = null
  let end: number | null = null
  for (const cell of cells) {
    if (finiteTime(cell.startedAt)) {
      start = start === null ? cell.startedAt : Math.min(start, cell.startedAt)
    }
    let cellEnd: number | null = null
    if (cell.kind === 'message') {
      cellEnd = cell.assistantMetrics?.completedTime ?? null
      if (!finiteTime(cellEnd) && finiteTime(cell.startedAt) && finiteTime(cell.timeSeconds)) {
        cellEnd = cell.startedAt + cell.timeSeconds * 1000
      }
    } else if ((cell.kind === 'tool' || cell.kind === 'subtool' || cell.kind === 'compacted')
      && finiteTime(cell.startedAt) && finiteTime(cell.timeSeconds)) {
      cellEnd = cell.startedAt + cell.timeSeconds * 1000
    }
    if (finiteTime(cellEnd)) end = end === null ? cellEnd : Math.max(end, cellEnd)
  }
  return start === null ? null : { start, end: end ?? start }
}

/**
 * Fold the turn-aware layout into one trace card per turn.
 *
 * Turns with a `null` turn number (standalone compaction between turns) are
 * not traces; they belong to no user prompt.
 * @param turns - ordered turn layout, including any appended live partial.
 * @returns per-turn traces plus whole-session totals.
 */
export function deriveTraceOverview(turns: readonly TrajectoryTurnModel[]): TraceOverview {
  const traces: TraceSummary[] = []
  for (const turn of turns) {
    if (turn.turn === null) continue
    const cells = cellsOf(turn)
    const messages = cells.filter(cell => cell.kind === 'message')
    let tokens = emptyTraceTokens()
    for (const message of messages) tokens = addTokens(tokens, cellUsage(message))
    const steps = messages.length
    const calls = cells.filter(cell => cell.kind === 'tool' || cell.kind === 'subtool').length
    const errors = cells.filter(cell => cell.isError === true).length
    const prompt = tracePrompt(cells)
    const pending = cells.some(isPending)
    // A turn holding only input has not produced its outcome yet; an empty
    // compaction-only turn is already settled.
    const awaitingOutcome = cells.length === 0
      || (steps === 0 && calls === 0 && errors === 0 && prompt !== '')
    const status: TraceStatus = pending || awaitingOutcome
      ? 'running'
      : errors > 0 ? 'failed' : 'completed'
    const span = traceSpan(cells)
    const durationMs = status === 'completed' || status === 'failed'
      ? span === null ? null : Math.max(0, span.end - span.start)
      : null
    traces.push({
      turn: turn.turn,
      anchorIndex: traceAnchor(cells),
      prompt,
      status,
      steps,
      calls,
      errors,
      durationMs,
      tokens,
      tools: traceTools(cells),
      chain: traceChain(cells),
    })
  }
  return { traces, totals: traceTotalsOf(traces) }
}

/**
 * Sum one list of trace cards into the header totals.
 * @param traces - ordered trace summaries.
 * @returns whole-session trace totals.
 */
export function traceTotalsOf(traces: readonly TraceSummary[]): TraceOverviewTotals {
  let totals: TraceOverviewTotals = {
    traces: 0, steps: 0, calls: 0, errors: 0, tokens: emptyTraceTokens(), durationMs: null,
  }
  for (const trace of traces) {
    totals = {
      traces: totals.traces + 1,
      steps: totals.steps + trace.steps,
      calls: totals.calls + trace.calls,
      errors: totals.errors + trace.errors,
      tokens: addTokens(totals.tokens, trace.tokens),
      durationMs: trace.durationMs === null
        ? totals.durationMs
        : (totals.durationMs ?? 0) + trace.durationMs,
    }
  }
  return totals
}

/**
 * Find the trace owning one ledger record index.
 * @param traces - folded traces, ordered by turn.
 * @param index - selected ledger record index, or null.
 * @returns the owning trace turn, or null when no trace owns it.
 */
export function traceTurnAtRecordIndex(
  traces: readonly TraceSummary[],
  index: number | null,
): number | null {
  if (index === null) return null
  let owner: number | null = null
  for (const trace of traces) {
    if (trace.anchorIndex > index) break
    owner = trace.turn
  }
  return owner
}

/**
 * Compact token count: `942`, `12.4k`, `1.2M`.
 * @param value - non-negative token count.
 * @returns the compact label; non-finite or negative input reads `0`.
 */
export function compactTokenCount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0'
  if (value < 1000) return String(Math.round(value))
  const thousands = value / 1000
  if (thousands < 999.5) return `${trimFraction(thousands.toFixed(1))}k`
  return `${trimFraction((value / 1_000_000).toFixed(1))}M`
}

function trimFraction(value: string): string {
  return value.endsWith('.0') ? value.slice(0, -2) : value
}

/**
 * Per-record token cost ready for a chip: `12.4k`, or `undefined` when the
 * record reported no usage.
 * @param cell - one ledger record.
 * @returns compact total tokens, or undefined.
 */
export function cellTokenCost(cell: TrajectoryCellProps): string | undefined {
  const tokens = cellUsage(cell)
  return tokens.total === 0 && cell.input === undefined && cell.output === undefined
    ? undefined
    : compactTokenCount(tokens.total)
}

/**
 * Format a trace wall span: milliseconds under a second, seconds under a
 * minute, minutes above it. A running trace has no settled span.
 * @param milliseconds - wall span, or null while running or untimed.
 * @param t - Trajectory locale translator.
 * @returns the localized duration label, or an em dash when absent.
 */
export function formatTraceDuration(
  milliseconds: number | null,
  t: TrajectoryTranslate,
): string {
  if (milliseconds === null || !Number.isFinite(milliseconds)) return '—'
  if (milliseconds < 1000) {
    return t('unit.milliseconds', { value: String(Math.round(milliseconds)) })
  }
  if (milliseconds < 60_000) {
    return t('unit.seconds', { value: trimFraction((milliseconds / 1000).toFixed(1)) })
  }
  return t('trace.minutes', { value: trimFraction((milliseconds / 60_000).toFixed(1)) })
}

/**
 * One header line for the whole session: trace, step, call, token, and
 * settled-duration totals. Zero-valued counts still render so the header keeps
 * a stable reading.
 * @param totals - whole-session trace totals.
 * @param t - Trajectory locale translator.
 * @returns the joined summary line.
 */
export function formatTraceTotals(
  totals: TraceOverviewTotals,
  t: TrajectoryTranslate,
): string {
  const parts = [
    t(totals.traces === 1 ? 'trace.count.one' : 'trace.count.other', { count: totals.traces }),
    t(totals.steps === 1 ? 'summary.steps.one' : 'summary.steps.other', { count: totals.steps }),
    t(totals.calls === 1 ? 'summary.toolCalls.one' : 'summary.toolCalls.other', { count: totals.calls }),
    t('unit.tokens', { value: compactTokenCount(totals.tokens.total) }),
  ]
  if (totals.durationMs !== null) parts.push(formatTraceDuration(totals.durationMs, t))
  return parts.join(' · ')
}
