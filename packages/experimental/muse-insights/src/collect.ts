/**
 * Read one local day's conversations and current Session todo lists from the
 * live-preferred Session corpus.
 *
 * Reads stay bounded by configuration: only the most recently created
 * top-level Sessions in the lookback window are observed, each Session
 * contributes a bounded number of text messages, and every message is
 * truncated. A Session's own events (after its fork-inherited prefix) are the
 * only source, so a fork never repeats its parent's day.
 * @module @tomato/experimental-muse-insights/collect
 */

import type { SessionEvent, SessionId } from '@tomato/session'
import type {
  SessionObservation,
  SessionObservationOptions,
  SessionRecord,
  SessionTitleObservationResult,
} from '@tomato/session-query'
import type {} from '@tomato/tool-todo'
import type { DayRange } from './day.ts'

/** The narrow Session-query face this capability reads. */
export interface DayCorpus {
  /** List every logical Session, newest first. */
  listSessions(signal?: AbortSignal): Promise<SessionRecord[]>
  /** Observe one exact Session cut without a listing preflight. */
  observeSession(sessionId: SessionId, options?: SessionObservationOptions): Promise<SessionObservation>
  /** Fold titles in one batch, isolating per-Session read failures. */
  readTitleSnapshots(sessionIds: readonly SessionId[], signal?: AbortSignal): Promise<SessionTitleObservationResult[]>
}

/** One human or assistant text message represented in a recap input. */
export interface RecapMessage {
  /** Which side of the conversation produced the text. */
  readonly role: 'user' | 'assistant'
  /** Complete text blocks of the message after whitespace normalization and truncation. */
  readonly text: string
}

/** One Session's contribution to a daily recap. */
export interface CollectedSession {
  /** Session identity. */
  readonly sessionId: string
  /** Latest folded title, or the first human prompt when the log carries no title. */
  readonly title: string
  /** Today's text messages, bounded to the configured count. */
  readonly messages: readonly RecapMessage[]
  /** Latest own event time inside the day; orders Sessions by activity. */
  readonly latestTime: number
}

/** One exact model route captured from the source Sessions. */
export interface RecapRoute {
  /** Registered provider route. */
  readonly provider: string
  /** Provider model id. */
  readonly model: string
}

/** Bounded evidence for one local day, before any model call. */
export interface CollectedDay {
  /** Participating Sessions, most recently active first. */
  readonly sessions: readonly CollectedSession[]
  /** Latest own event time among the participating Sessions. */
  readonly latestEventTime: number
  /** Total represented text messages. */
  readonly messageCount: number
  /** Route of the latest request header in the observed Sessions. */
  readonly route?: RecapRoute
}

/**
 * One item read from a Session's `todos` projection. Completed items are
 * collected only to suppress recap wording that they already finished.
 */
export interface CollectedTodo {
  /** Session whose list holds the item. */
  readonly sessionId: string
  /** Latest folded title of that Session, or null. */
  readonly sessionTitle: string | null
  /** The item's exact stored text. */
  readonly content: string
  /** The item's stored lifecycle state. */
  readonly status: 'pending' | 'in_progress' | 'completed'
}

/** Bounds shared by the day and task reads. */
export interface CorpusReadOptions {
  /** Signals cancellation of every corpus read. */
  readonly signal: AbortSignal
  /** First Session creation instant to consider, from the configured lookback. */
  readonly earliestCreatedAt: number
  /** Maximum Sessions observed, newest first. */
  readonly maxSessions: number
}

/** Additional bounds for one day's text extraction. */
export interface CollectDayOptions extends CorpusReadOptions {
  /** Local day being summarized. */
  readonly day: DayRange
  /** Exclusive lower event-time bound, so a run reads only evidence the retained recap does not cover. */
  readonly since?: number
  /** UTF-16 characters kept from one message. */
  readonly maxMessageChars: number
  /** Messages retained per Session. */
  readonly maxMessagesPerSession: number
}

/**
 * Read one local day's human and assistant text.
 * @param corpus - Session query face.
 * @param options - day, source bounds, and Session limits.
 * @returns participating Sessions, their latest source instant, and the last observed model route.
 */
export async function collectDay(corpus: DayCorpus, options: CollectDayOptions): Promise<CollectedDay> {
  const sessions: CollectedSession[] = []
  let latestEventTime = 0
  let messageCount = 0
  let routeTime = -1
  let route: RecapRoute | undefined
  const records = eligibleSessions(await corpus.listSessions(options.signal), options)
  for (const record of records) {
    options.signal.throwIfAborted()
    const observation = await corpus.observeSession(record.header.id, { projectionMode: 'none', signal: options.signal })
    try {
      const own = observation.events.filter(event => event.seq >= observation.inheritedEventCount)
      const captured = captureRoute(own)
      if (captured !== undefined && captured.time > routeTime) {
        routeTime = captured.time
        route = captured.route
      }
      const extracted = extractDay(own, options)
      if (extracted.messages.length === 0) continue
      if (extracted.latestTime > latestEventTime) latestEventTime = extracted.latestTime
      messageCount += extracted.messages.length
      sessions.push({
        sessionId: record.header.id,
        title: sessionTitle(own),
        messages: extracted.messages,
        latestTime: extracted.latestTime,
      })
    } finally {
      observation[Symbol.dispose]()
    }
  }
  sessions.sort((left, right) => right.latestTime - left.latestTime || left.sessionId.localeCompare(right.sessionId))
  return { sessions, latestEventTime, messageCount, ...route === undefined ? {} : { route } }
}

/**
 * Read current pending and in-progress todo items from every eligible Session's
 * `todos` projection. Reads only projections, never an event log.
 * @param corpus - Session query face.
 * @param options - signal, lookback, and Session limit.
 * @returns pending and in-progress items in Session order.
 */
export async function collectTodos(corpus: DayCorpus, options: CorpusReadOptions): Promise<CollectedTodo[]> {
  const records = eligibleSessions(await corpus.listSessions(options.signal), options)
  const observations: SessionObservation[] = []
  try {
    for (const record of records) {
      options.signal.throwIfAborted()
      observations.push(await corpus.observeSession(record.header.id, { projectionMode: 'all', signal: options.signal }))
    }
    const titles = await readTitles(corpus, observations, options.signal)
    const collected: CollectedTodo[] = []
    for (const observation of observations) {
      const todos = observation.projections?.values.todos
      if (todos === null || todos === undefined) continue
      const sessionId = observation.header.id
      for (const item of todos) {
        collected.push({
          sessionId,
          sessionTitle: titles.get(sessionId) ?? null,
          content: item.content,
          status: item.status,
        })
      }
    }
    return collected
  } finally {
    for (const observation of observations) observation[Symbol.dispose]()
  }
}

/** Sessions this capability reads: top-level, not fork-seeded duplicates, created inside the lookback. */
function eligibleSessions(records: readonly SessionRecord[], options: CorpusReadOptions): readonly SessionRecord[] {
  return records
    .filter(record => record.header.origin !== 'subagent' && (record.header.delegationDepth ?? 0) === 0)
    .filter(record => record.header.createdAt >= options.earliestCreatedAt)
    .slice(0, options.maxSessions)
}

/** Read titles for observed Sessions, isolating one unreadable title from the rest. */
async function readTitles(
  corpus: DayCorpus,
  observations: readonly SessionObservation[],
  signal: AbortSignal,
): Promise<ReadonlyMap<string, string>> {
  const ids = observations.map(observation => observation.header.id)
  const results = await corpus.readTitleSnapshots(ids, signal)
  const titles = new Map<string, string>()
  for (const result of results) {
    if (result.status !== 'fulfilled' || result.value.title === undefined) continue
    titles.set(result.sessionId, result.value.title.title)
  }
  return titles
}

/** One day's message extraction from a Session's own events. */
interface ExtractedDay {
  readonly messages: readonly RecapMessage[]
  readonly latestTime: number
}

/** Extract bounded human and assistant text from the day's uncovered window. */
function extractDay(events: readonly SessionEvent[], options: CollectDayOptions): ExtractedDay {
  const since = options.since
  const inDay = events.filter(event => event.time >= options.day.start && event.time < options.day.end
    && (since === undefined || event.time > since))
  const latestTime = inDay.reduce((latest, event) => Math.max(latest, event.time), 0)
  const messages: RecapMessage[] = []
  for (const event of inDay) {
    const message = messageOf(event)
    if (message === undefined) continue
    const text = boundedText(message.text, options.maxMessageChars)
    if (text === '') continue
    messages.push({ role: message.role, text })
  }
  return { messages: retainBounded(messages, options.maxMessagesPerSession), latestTime }
}

/** One event's text message, or undefined for every other event and empty text. */
function messageOf(event: SessionEvent): RecapMessage | undefined {
  switch (event.type) {
    case 'user/message': {
      if (event.data.source.kind !== 'user') return undefined
      return { role: 'user', text: textBlocks(event.data.content) }
    }
    case 'assistant/message':
      return { role: 'assistant', text: textBlocks(event.data.message.content) }
    default:
      return undefined
  }
}

/** Join one message's text blocks. */
function textBlocks(blocks: readonly { readonly type: string; readonly text?: string }[]): string {
  return blocks.flatMap(block => block.type === 'text' && block.text !== undefined ? [block.text] : []).join('\n')
}

/** Collapse whitespace and cap a message at the configured character count. */
function boundedText(text: string, maxChars: number): string {
  const normalized = text.replaceAll('\r\n', '\n').replaceAll(/[ \t]+/gu, ' ').replaceAll(/\n{3,}/gu, '\n\n').trim()
  if (normalized.length <= maxChars) return normalized
  return `${normalized.slice(0, Math.max(0, maxChars - 1))}…`
}

/** Keep the first message for context and the most recent work when a Session exceeds the bound. */
function retainBounded(messages: readonly RecapMessage[], maxMessages: number): readonly RecapMessage[] {
  if (messages.length <= maxMessages) return messages
  const first = messages[0]
  if (first === undefined) return []
  return [first, ...messages.slice(messages.length - (maxMessages - 1))]
}

/** Latest title the Session itself wrote, or its first human prompt. */
function sessionTitle(events: readonly SessionEvent[]): string {
  const title = events.findLast(event => event.type === 'session/title')?.data.title.trim()
  if (title !== undefined && title !== '') return title
  const prompt = events.find(event => event.type === 'user/message' && event.data.source.kind === 'user')
  if (prompt?.type !== 'user/message') return ''
  return boundedText(textBlocks(prompt.data.content), 120)
}

/** Latest request header route in one Session's own events. */
function captureRoute(events: readonly SessionEvent[]): { readonly time: number; readonly route: RecapRoute } | undefined {
  const header = events.findLast(event => event.type === 'request/header')
  if (header?.type !== 'request/header') return undefined
  const { provider, model } = header.data.header.config
  return { time: header.time, route: { provider, model } }
}
