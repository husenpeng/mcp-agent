/**
 * Experimental goal-round focus support. During an automatic goal round the
 * plugin appends a progress ledger of repeated tool failures, reminds the
 * model once a failure keeps repeating, and asks for approval before calling
 * configured tools. It schedules no round and retries nothing: continuation
 * and its budget remain `@tomato/goal-round-driver` behavior.
 * @module @tomato/experimental-focus
 */

import { createHash } from 'node:crypto'
import type { Context } from '@tomato/cordis'
import z from '@tomato/schemastery'
import { z as zod } from 'zod'
import type { PreStepDecision } from '@tomato/agent'
import { createUserMessage } from '@tomato/llm'
import type { ContextFormed } from '@tomato/llm'
import type {} from '@tomato/goal'
import type { SessionEvent } from '@tomato/session'
import type { ProjectionHandle } from '@tomato/session-projection'
import { TOOL_ABORTED, TOOL_ABORTED_BEFORE_DISPATCH } from '@tomato/tools'
import type { PostToolDecision, PreToolDecision, ToolExecution, ToolExecutionResult } from '@tomato/tools'

declare module '@tomato/llm' {
  interface MessageSourceMap {
    /** Goal-round failure ledger and repeated-failure reminders; readers preserve the recorded text without this producer.
     * @persistenceAttribution
     */
    'experimental-focus': { kind: 'experimental-focus' } & ContextFormed
  }
}

export const name = 'experimental-focus'
export const inject = ['tools', 'agents', 'sessionProjections']

/** Focus policy for goal rounds. */
export interface Config {
  /** Consecutive identical failures of one call that trigger a reminder, at least 2. */
  repeatedFailureThreshold?: number
  /** Maximum distinct failures listed in the ledger. */
  maxLedgerEntries?: number
  /** Maximum characters of one failure message quoted in the ledger. */
  maxMessageChars?: number
  /** `*`-wildcard tool-name patterns that require approval before each call. */
  approvalTools?: string[]
}

/** Schemastery config for focus policy. */
export const Config: z<Config> = z.object({
  repeatedFailureThreshold: z.number().step(1).min(2).max(20).default(2),
  maxLedgerEntries: z.number().step(1).min(1).max(20).default(5),
  maxMessageChars: z.number().step(1).min(40).max(2000).default(200),
  approvalTools: z.array(z.string()).default([]),
})

/** Fully resolved focus policy. */
interface ResolvedConfig {
  readonly threshold: number
  readonly maxLedgerEntries: number
  readonly maxMessageChars: number
  readonly approvalPatterns: readonly RegExp[]
}

/** Message source kind of every focus context. */
const SOURCE_KIND = 'experimental-focus'

/** One distinct failure observed during the current goal. */
export interface FocusFailure {
  /** Stable identity of tool name, canonical arguments, and failure code. */
  readonly signature: string
  /** Tool that failed. */
  readonly tool: string
  /** Stable failure code, or `error` when the tool supplied none. */
  readonly code: string
  /** First line of the latest failure message, truncated. */
  readonly message: string
  /** Total failures with this signature during the current goal. */
  readonly count: number
  /** Consecutive failures with this signature since the tool last succeeded. */
  readonly streak: number
  /** Goal round of the latest failure. */
  readonly round: number
}

/** Session-scoped facts this plugin needs after resume, folded from the Session log. */
export interface FocusState {
  /** Goal whose failures the ledger holds, or null before the first goal round. */
  readonly goalId: string | null
  /** Latest admitted round of that goal, or 0 before the first round. */
  readonly round: number
  /** Distinct failures, most recent first. */
  readonly failures: readonly FocusFailure[]
  /** Call identity of each logged call whose result is not logged yet, keyed by call id. */
  readonly pending: Readonly<Record<string, { readonly tool: string; readonly args: string }>>
}

const focusStateSchema: zod.ZodType<FocusState> = zod.object({
  goalId: zod.string().nullable(),
  round: zod.number().int().nonnegative(),
  failures: zod.array(zod.object({
    signature: zod.string(),
    tool: zod.string(),
    code: zod.string(),
    message: zod.string(),
    count: zod.number().int().positive(),
    streak: zod.number().int().nonnegative(),
    round: zod.number().int().nonnegative(),
  }).strict()).readonly(),
  pending: zod.record(zod.string(), zod.object({ tool: zod.string(), args: zod.string() }).strict()).readonly(),
}).strict()

/** Failure codes that report cancellation rather than a failed attempt. */
const CANCELLED_CODES: ReadonlySet<string> = new Set([TOOL_ABORTED, TOOL_ABORTED_BEFORE_DISPATCH])

/** Compile one `*`-wildcard pattern to an anchored expression; every other character matches literally. */
function wildcard(pattern: string): RegExp {
  return new RegExp(`^${pattern.replaceAll(/[|\\{}()[\]^$+?.]/gu, String.raw`\$&`).replaceAll('*', '.*')}$`, 'u')
}

/** Validate policy even when `apply` runs outside Loader normalization. */
function resolveConfig(config: Config): ResolvedConfig {
  const threshold = config.repeatedFailureThreshold ?? 2
  const maxLedgerEntries = config.maxLedgerEntries ?? 5
  const maxMessageChars = config.maxMessageChars ?? 200
  for (const [field, value, min] of [
    ['repeatedFailureThreshold', threshold, 2],
    ['maxLedgerEntries', maxLedgerEntries, 1],
    ['maxMessageChars', maxMessageChars, 40],
  ] as const) {
    if (!Number.isSafeInteger(value) || value < min) {
      throw new TypeError(`experimental-focus: ${field} must be a safe integer of at least ${min}`)
    }
  }
  const patterns = config.approvalTools ?? []
  for (const pattern of patterns) {
    if (pattern.trim() === '') throw new TypeError('experimental-focus: approvalTools entries must be non-empty patterns')
  }
  return { threshold, maxLedgerEntries, maxMessageChars, approvalPatterns: patterns.map(wildcard) }
}

/** Deep key-sort of parsed JSON so property order does not change identity. */
function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson)
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return Object.fromEntries(Object.keys(record).sort().map(key => [key, sortJson(record[key])]))
  }
  return value
}

/**
 * Identity of one failed call: tool name, canonical arguments, and failure code.
 * @param tool - tool name.
 * @param args - parsed or raw call arguments.
 * @param code - stable failure code.
 * @returns a short stable digest.
 */
export function failureSignature(tool: string, args: unknown, code: string): string {
  const parsed = typeof args === 'string' ? safeParse(args) : args
  return createHash('sha256').update(JSON.stringify([tool, sortJson(parsed), code])).digest('hex').slice(0, 16)
}

/** Parse logged argument JSON, keeping the raw text when it is malformed. */
function safeParse(text: string): unknown {
  try {
    const parsed: unknown = JSON.parse(text)
    return parsed
  } catch (_error: unknown) {
    // Malformed model arguments still identify the call by their exact text.
    return text
  }
}

/** First line of a failure message, truncated to the configured length. */
function summarize(message: string, maxChars: number): string {
  const newline = message.indexOf('\n')
  const line = (newline === -1 ? message : message.slice(0, newline)).trim()
  return line.length <= maxChars ? line : `${line.slice(0, maxChars - 1)}…`
}

/** Text of the tool result's model-facing content without the Native `Error: ` prefix. */
function resultMessage(event: SessionEvent<'tool/result'>): string {
  const text = event.data.message.content.flatMap(block => block.type === 'text' ? [block.text] : []).join('\n')
  return text.startsWith('Error: ') ? text.slice('Error: '.length) : text
}

/** The pending map without one call. */
function without(pending: FocusState['pending'], callId: string): FocusState['pending'] {
  const { [callId]: _removed, ...rest } = pending
  return rest
}

/**
 * Pure fold over committed Session events. A goal round of another goal
 * resets the ledger; a tool failure during a goal updates its signature; a
 * successful call of a tool clears that tool's streaks.
 * @param config - resolved policy bounding retained entries and message length.
 * @returns the projection transition.
 */
function focusFold(config: ResolvedConfig): (state: FocusState, event: SessionEvent) => FocusState {
  return (state, event) => {
    switch (event.type) {
      case 'user/message': {
        const source = event.data.source
        if (source.kind !== 'goal' || source.round < 1) return state
        if (source.goalId === state.goalId) return source.round === state.round ? state : { ...state, round: source.round }
        return { ...state, goalId: source.goalId, round: source.round, failures: [] }
      }
      case 'tool/call':
        if (state.goalId === null) return state
        return { ...state, pending: { ...state.pending, [event.data.callId]: { tool: event.data.name, args: event.data.arguments } } }
      case 'tool/result': {
        const callId = event.data.message.toolCallId
        const call = state.pending[callId]
        if (call === undefined) return state
        const pending = without(state.pending, callId)
        if (event.data.message.isError !== true) {
          // Any success of the tool shows it works again, so its streaks restart.
          const failures = state.failures.map(failure => failure.streak > 0 && failure.tool === call.tool
            ? { ...failure, streak: 0 }
            : failure)
          return { ...state, pending, failures }
        }
        const code = event.data.error?.code ?? 'error'
        if (CANCELLED_CODES.has(code)) return { ...state, pending }
        const failure = nextFailure(state, call.tool, call.args, code, resultMessage(event), config.maxMessageChars)
        const others = state.failures.filter(entry => entry.signature !== failure.signature)
        return { ...state, pending, failures: [failure, ...others].slice(0, config.maxLedgerEntries) }
      }
      // SessionEventMap is merge-extensible; every other event leaves the ledger unchanged.
      default:
        return state
    }
  }
}

/**
 * The ledger entry one more failure of a call produces.
 * @param state - ledger before the failure.
 * @param tool - tool name.
 * @param args - call arguments.
 * @param code - stable failure code.
 * @param message - failure message.
 * @param maxChars - message truncation length.
 * @returns the updated or new entry.
 */
function nextFailure(state: FocusState, tool: string, args: unknown, code: string, message: string, maxChars: number): FocusFailure {
  const signature = failureSignature(tool, args, code)
  const previous = state.failures.find(failure => failure.signature === signature)
  return {
    signature,
    tool,
    code,
    message: summarize(message, maxChars),
    count: (previous?.count ?? 0) + 1,
    streak: (previous?.streak ?? 0) + 1,
    round: state.round,
  }
}

/**
 * Render the ledger appended to a goal round.
 * @param failures - distinct failures, most recent first.
 * @returns the ledger text, or an empty string when nothing failed.
 */
export function renderLedger(failures: readonly FocusFailure[]): string {
  if (failures.length === 0) return ''
  return [
    'Failures so far in this goal (do not repeat a failed call unchanged; change the approach, ask the user, or report the blocker):',
    ...failures.map(failure => `- ${failure.tool} failed ${failure.count}× (${failure.code}, latest in round ${failure.round}): ${failure.message}`),
  ].join('\n')
}

/**
 * Render the reminder for a call that keeps failing the same way.
 * @param failure - the repeating failure.
 * @returns the model-facing reminder.
 */
export function renderReminder(failure: FocusFailure): string {
  return `The ${failure.tool} call has now failed ${failure.streak} times in a row with the same arguments and the same error (${failure.code}). `
    + 'Repeating it unchanged will fail again. Inspect the error, then change the arguments or the approach, ask the user for what is missing, '
    + 'or report the blocker.'
}

/**
 * Install the ledger, reminder, and approval policy.
 * @param ctx - plugin context; every listener follows its lifetime.
 * @param config - validated focus policy.
 */
export async function apply(ctx: Context, config: Config): Promise<void> {
  const resolved = resolveConfig(config)
  const ledger: ProjectionHandle<FocusState> = await ctx.sessionProjections.register<'experimentalFocus', FocusState>({
    key: 'experimentalFocus',
    stateVersion: 1,
    stateSchema: focusStateSchema,
    init: () => ({ goalId: null, round: 0, failures: [], pending: {} }),
    apply: focusFold(resolved),
  })

  ctx.on('agent/pre-step', async ({ agent, messages, signal }, next): Promise<PreStepDecision> => {
    const decision = await next()
    if (decision.kind === 'reject' || signal.aborted) return decision
    const round = messages.find(message => message.source.kind === 'goal' && message.source.round > 0)
    if (round?.source.kind !== 'goal' || !decision.messages.includes(round)) return decision
    // The round message is not committed yet, so the ledger still names the previous round's goal.
    const state = ledger.stateOf(agent.session)
    const failures = state.goalId === round.source.goalId ? state.failures : []
    const text = renderLedger(failures)
    if (text === '') return decision
    return {
      ...decision,
      messages: [...decision.messages, createUserMessage({
        content: [{ type: 'text', text }],
        source: { kind: SOURCE_KIND, form: 'snapshot', sections: [{ name: SOURCE_KIND, text }] },
      })],
    }
  }, { prepend: true })

  /** The ledger entry the just-finished call will produce, before its result is committed. */
  function pendingFailure(exec: ToolExecution, result: Readonly<ToolExecutionResult>): FocusFailure | undefined {
    if (exec.agent === undefined || exec.parent !== undefined || !result.isError) return undefined
    const state = ledger.stateOf(exec.agent.session)
    if (state.goalId === null) return undefined
    const code = result.error.info?.code ?? 'error'
    if (CANCELLED_CODES.has(code)) return undefined
    return nextFailure(state, exec.name, exec.arguments, code, result.error.message, resolved.maxMessageChars)
  }

  ctx.on('tools/post-execute', async (exec, result, next): Promise<PostToolDecision> => {
    const failure = pendingFailure(exec, result)
    const downstream = await next()
    if (failure === undefined || failure.streak < resolved.threshold) return downstream
    const reminder = createUserMessage({
      content: [{ type: 'text', text: renderReminder(failure) }],
      source: { kind: SOURCE_KIND, form: 'notice', summary: `${failure.tool} failed ${failure.streak}× in a row` },
    })
    return downstream.kind === 'block'
      ? { kind: 'block', feedback: downstream.feedback, additionalContexts: [reminder, ...downstream.additionalContexts ?? []] }
      : { ...downstream, additionalContexts: [reminder, ...downstream.additionalContexts ?? []] }
  }, { prepend: true })

  if (resolved.approvalPatterns.length > 0) {
    ctx.on('tools/pre-execute', async (exec, next): Promise<PreToolDecision> => {
      const decision = await next()
      if (decision.kind !== 'allow' || exec.agent === undefined) return decision
      if (!resolved.approvalPatterns.some(pattern => pattern.test(exec.name))) return decision
      return {
        kind: 'ask',
        reason: `Tool "${exec.name}" is configured to require approval before each call.`,
        displayReason: {
          en: `Allow ${exec.name} to run? This tool is configured to ask before each call.`,
          zh: `允许运行 ${exec.name} 吗？该工具配置为每次调用前询问。`,
        },
      }
    })
  }
}
