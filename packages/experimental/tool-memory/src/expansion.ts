/**
 * Query expansion for `memory_search`: one auxiliary model request turns the
 * model's query into related wordings so a saved memory phrased differently
 * still matches. The request and its outcome are logged as one plugin record
 * before the result is used.
 */
import type { Context } from '@tomato/cordis'
import type { Agent } from '@tomato/agent'
import { BlockAssembler, createUserMessage } from '@tomato/llm'
import type { ContextFormed, Message } from '@tomato/llm'
import { appendPluginRecord } from '@tomato/session'
import { deadline } from '@tomato/timeout'

declare module '@tomato/llm' {
  interface MessageSourceMap {
    /** Query-expansion request input; never part of a conversation surface, so no Session reader depends on it.
     * @persistenceAttribution
     */
    'experimental-tool-memory': { kind: 'experimental-tool-memory' } & ContextFormed
  }
}

/** Outcome of one expansion attempt as logged. */
export type ExpansionOutcome =
  | { readonly status: 'expanded'; readonly alternatives: readonly string[] }
  | { readonly status: 'failed'; readonly reason: string }

/** Logged auxiliary request and outcome of one query expansion. */
export interface QueryExpansionRecord {
  /** Exact provider and model that received the request. */
  readonly route: { readonly provider: string; readonly model: string }
  /** Exact system text of the request. */
  readonly system: string
  /** Exact user text of the request. */
  readonly input: string
  /** Output-token cap of the request. */
  readonly maxTokens: number
  /** What the request produced. */
  readonly outcome: ExpansionOutcome
}

declare module '@tomato/session/types' {
  interface PluginRecordMap {
    /** Query-expansion request and result for one memory search. */
    'plugin:tool-memory/query-expansion': QueryExpansionRecord
  }
}

/** Resolved expansion policy. */
export interface ExpansionPolicy {
  /** Explicit route; absent uses the calling agent's current model. */
  readonly route?: { readonly provider: string; readonly model: string }
  /** End-to-end deadline of one expansion request. */
  readonly timeoutMs: number
  /** Output-token cap of one expansion request. */
  readonly maxTokens: number
  /** Maximum alternative wordings kept from one response. */
  readonly maxAlternatives: number
}

/** System text of every expansion request. */
export const EXPANSION_SYSTEM = 'You expand search queries over short saved notes. Reply with alternative wordings of the '
  + 'query: synonyms, near-synonyms, and the same meaning in Chinese and English. One wording per line, at most '
  + 'a few words each, no numbering and no explanations.'

/** Maximum characters kept from one alternative wording. */
const MAX_ALTERNATIVE_CHARS = 40

/**
 * Parse the model's reply into distinct alternative wordings.
 * @param text - raw reply text.
 * @param query - the original query, excluded from the result.
 * @param limit - maximum wordings kept.
 * @returns non-empty wordings in reply order, without list markers.
 */
export function parseAlternatives(text: string, query: string, limit: number): string[] {
  const seen = new Set([query.trim().toLowerCase()])
  const alternatives: string[] = []
  for (const line of text.split(/[\n,，、;；]/u)) {
    const wording = line.replace(/^\s*(?:[-*•]|\d+[.)、])\s*/u, '').trim().slice(0, MAX_ALTERNATIVE_CHARS)
    const key = wording.toLowerCase()
    if (wording === '' || seen.has(key)) continue
    seen.add(key)
    alternatives.push(wording)
    if (alternatives.length === limit) break
  }
  return alternatives
}

/** Readable reason of one failed attempt. */
function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Ask the model for alternative wordings of one query and log the attempt.
 * Expansion never fails the search: any failure is logged and returns no
 * alternatives, so the search falls back to the literal query.
 * @param ctx - context carrying `ctx.llm`.
 * @param agent - calling agent; its Session receives the record and its model is the default route.
 * @param query - the model's search text.
 * @param policy - route, deadline, and size limits.
 * @param signal - the tool call's cancellation.
 * @returns alternative wordings, empty when expansion failed or produced none.
 */
export async function expandQuery(
  ctx: Context,
  agent: Agent,
  query: string,
  policy: ExpansionPolicy,
  signal: AbortSignal,
): Promise<string[]> {
  const selection = agent.model.current()
  const route = policy.route ?? (selection === undefined ? undefined : { provider: selection.provider, model: selection.model })
  if (route === undefined) return []
  const record = (outcome: ExpansionOutcome): void => {
    appendPluginRecord(agent.session, 'plugin:tool-memory/query-expansion', {
      route, system: EXPANSION_SYSTEM, input: query, maxTokens: policy.maxTokens, outcome,
    })
  }
  try {
    using callDeadline = deadline(signal, policy.timeoutMs, 'MEMORY_QUERY_EXPANSION_TIMEOUT')
    const call = await ctx.llm.prepareCall({ ...route, maxTokens: policy.maxTokens }, callDeadline.signal)
    const messages: Message[] = [createUserMessage({
      content: [{ type: 'text', text: query }],
      source: { kind: 'experimental-tool-memory' },
    })]
    const assembler = new BlockAssembler()
    for await (const chunk of call.stream({ ...call.config, messages, system: EXPANSION_SYSTEM, signal: callDeadline.signal })) {
      assembler.push(chunk)
    }
    const finish = assembler.finish
    if (finish.kind === 'error' || finish.kind === 'aborted') throw new Error(finish.failure.message)
    const text = assembler.blocks().flatMap(block => block.type === 'text' ? [block.text] : []).join('\n')
    const alternatives = parseAlternatives(text, query, policy.maxAlternatives)
    record({ status: 'expanded', alternatives })
    return alternatives
  } catch (error: unknown) {
    // Cancellation of the tool call itself ends the search; every other failure falls back to the literal query.
    signal.throwIfAborted()
    record({ status: 'failed', reason: reasonOf(error) })
    return []
  }
}
