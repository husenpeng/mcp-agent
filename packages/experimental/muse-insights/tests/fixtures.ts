/** Shared Session and corpus fixtures for the Muse insights host tests. */
import { createAssistantMessage, createUserMessage } from '@tomato/llm'
import type { TodoItem } from '@tomato/tool-todo'
import {
  SESSION_FORMAT_VERSION,
  SessionId,
  SessionLogOffset,
  SessionSeq,
  type SessionEvent,
  type SessionHeader,
  type SessionSeqCursor,
} from '@tomato/session'
import type { SessionObservation, SessionRecord, SessionTitleObservationResult } from '@tomato/session-query'
import type { ProjectionSnapshot, SessionProjectionMap } from '@tomato/session-projection'
import type { DayCorpus } from '../src/collect.ts'

declare module '@tomato/llm' {
  interface MessageSourceMap {
    /** Test-only synthetic user context; not a runtime producer. */
    'muse-insights-test': { kind: 'muse-insights-test' }
  }
}

/** Brand one test Session identity. */
export function id(value: string): SessionId {
  return SessionId(value)
}

/** Header for one top-level test Session. */
export function header(session: SessionId, createdAt = Date.now()): SessionHeader {
  return { version: SESSION_FORMAT_VERSION, id: session, createdAt, isSeeded: false }
}

/** One direct human message event. */
export function human(seq: number, time: number, text: string): SessionEvent<'user/message'> {
  return {
    type: 'user/message',
    seq: SessionSeq(seq),
    time,
    surfaceOp: 'append',
    data: createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'user' } }),
  }
}

/** One synthetic user-role event, not a direct human prompt. */
export function injected(seq: number, time: number, text: string): SessionEvent<'user/message'> {
  return {
    type: 'user/message',
    seq: SessionSeq(seq),
    time,
    surfaceOp: 'append',
    data: createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'muse-insights-test' } }),
  }
}

/** One assistant text message event. */
export function assistant(seq: number, time: number, text: string): SessionEvent<'assistant/message'> {
  const message = createAssistantMessage({ content: [{ type: 'text', text }], source: { provider: 'test', model: 'm' } })
  return {
    type: 'assistant/message',
    seq: SessionSeq(seq),
    time,
    surfaceOp: 'append',
    data: { turn: 1, step: 1, message, stream: [] },
  }
}

/** One request-header event carrying the route the recap may capture. */
export function request(seq: number, time: number, provider = 'test', model = 'm'): SessionEvent<'request/header'> {
  return { type: 'request/header', seq: SessionSeq(seq), time, data: { header: { config: { provider, model } }, reason: 'initial' } }
}

/** One latest-title event. */
export function title(seq: number, time: number, text: string): SessionEvent<'session/title'> {
  return { type: 'session/title', seq: SessionSeq(seq), time, data: { title: text, messageSeqs: [], source: { kind: 'fallback' } } }
}

/** One whole-list todo snapshot. */
export function todos(seq: number, time: number, items: readonly TodoItem[]): SessionEvent<'todo/write'> {
  return { type: 'todo/write', seq: SessionSeq(seq), time, data: { todos: [...items] } }
}

/** One live observation with the supplied own events. */
export function observation(
  session: SessionId,
  events: readonly SessionEvent[],
  options: { readonly inherited?: number; readonly todos?: readonly TodoItem[] | null } = {},
): SessionObservation {
  const inherited = SessionLogOffset(options.inherited ?? 0)
  // Annotated: the inferred union of the `??` arms widens `-1` to `number`.
  const lastSeq: SessionSeqCursor = events.at(-1)?.seq ?? -1
  // The snapshot carries the map values, whose `todos` member has a phantom summary mark only the
  // projection registry can stamp; the fixture supplies the runtime array under a declared cast.
  const projections: ProjectionSnapshot | undefined = options.todos === undefined
    ? undefined
    : {
      asOfSeq: lastSeq,
      values: { todos: options.todos === null ? null : [...options.todos] as SessionProjectionMap['todos'] },
    }
  const value: SessionObservation = {
    source: 'live',
    header: header(session),
    inheritedEventCount: inherited,
    events: [...events],
    cursor: lastSeq,
    ...projections === undefined ? {} : { projections },
    retain: () => value,
    [Symbol.dispose]: () => {},
  }
  return value
}

/** One listed logical Session. */
export function record(session: SessionId, metadata: Partial<SessionHeader> = {}): SessionRecord {
  return {
    header: { ...header(session), ...metadata },
    live: true,
    persisted: false,
    formatStatus: 'current',
  }
}

/** A corpus over supplied records and observations. */
export function corpus(
  records: readonly SessionRecord[],
  observations: ReadonlyMap<SessionId, SessionObservation>,
  titles: ReadonlyMap<SessionId, string> = new Map(),
): DayCorpus {
  return {
    listSessions: () => Promise.resolve([...records]),
    observeSession: (session) => {
      const found = observations.get(session)
      if (found === undefined) throw new Error(`missing observation for ${session}`)
      return Promise.resolve(found)
    },
    readTitleSnapshots: (ids): Promise<SessionTitleObservationResult[]> => Promise.resolve(ids.map((sessionId) => {
      const value = titles.get(sessionId)
      return value === undefined
        ? { sessionId, status: 'fulfilled', value: { session: header(sessionId) } }
        : {
          sessionId,
          status: 'fulfilled',
          value: {
            session: header(sessionId),
            title: {
              title: value,
              messageSeqs: [],
              source: { kind: 'fallback' },
              eventSeq: SessionSeq(0),
              updatedAt: 0,
            },
          },
        }
    })),
  }
}
