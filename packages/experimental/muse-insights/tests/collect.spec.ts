/** Day and task corpus reads over real Session event fixtures. */
import { describe, expect, it } from 'vitest'
import type { TodoItem } from '@tomato/tool-todo'
import { collectDay, collectTodos } from '../src/collect.ts'
import { dayRange } from '../src/day.ts'
import { assistant, corpus, human, id, injected, observation, record, request, title } from './fixtures.ts'

const now = new Date(2026, 10, 2, 12, 0, 0).getTime()
const day = dayRange(now)

describe('collectDay', () => {
  it('reads only own direct human and assistant text inside the day', async () => {
    const session = id('day-one')
    const start = day.start + 60_000
    const events = [
      human(0, start, 'Draft the launch plan'),
      injected(1, start + 1, 'synthetic context'),
      assistant(2, start + 2, 'The plan is drafted.'),
      human(3, day.start - 1, 'yesterday'),
    ]
    const sources = corpus([record(session)], new Map([[session, observation(session, events)]]))
    const collected = await collectDay(sources, {
      signal: new AbortController().signal,
      earliestCreatedAt: day.start - 86_400_000,
      maxSessions: 10,
      day,
      maxMessageChars: 100,
      maxMessagesPerSession: 10,
    })
    expect(collected).toMatchObject({ messageCount: 2, latestEventTime: start + 2 })
    expect(collected.sessions).toHaveLength(1)
    expect(collected.sessions[0]?.messages).toEqual([
      { role: 'user', text: 'Draft the launch plan' },
      { role: 'assistant', text: 'The plan is drafted.' },
    ])
  })

  it('skips inherited, subagent, and out-of-window sessions, and keeps the first prompt plus recent work', async () => {
    const inherited = id('inherited')
    const subagent = id('subagent')
    const old = id('old')
    const kept = id('kept')
    const start = day.start + 60_000
    const records = [
      record(inherited),
      record(subagent, { origin: 'subagent', delegationDepth: 1 }),
      record(old, { createdAt: day.start - 8 * 86_400_000 }),
      record(kept),
    ]
    const observations = new Map([
      [inherited, observation(inherited, [human(0, start, 'parent text'), human(1, start + 1, 'own text')], { inherited: 1 })],
      [subagent, observation(subagent, [human(0, start, 'child text')])],
      [old, observation(old, [human(0, start, 'old text')])],
      [kept, observation(kept, [
        human(0, start, 'first'),
        human(1, start + 1, 'second'),
        assistant(2, start + 2, 'third'),
      ])],
    ])
    const collected = await collectDay(corpus(records, observations), {
      signal: new AbortController().signal,
      earliestCreatedAt: day.start - 7 * 86_400_000,
      maxSessions: 10,
      day,
      maxMessageChars: 100,
      maxMessagesPerSession: 2,
    })
    expect(collected.sessions.map(session => session.sessionId)).toEqual([kept, inherited])
    expect(collected.sessions[0]?.messages).toEqual([
      { role: 'user', text: 'first' },
      { role: 'assistant', text: 'third' },
    ])
    expect(collected.sessions[1]?.messages).toEqual([{ role: 'user', text: 'own text' }])
    expect(collected.messageCount).toBe(3)
  })

  it('uses the latest request route and the written title or first prompt', async () => {
    const first = id('route-one')
    const second = id('route-two')
    const start = day.start + 60_000
    const records = [record(first), record(second)]
    const observations = new Map([
      [first, observation(first, [human(0, start, 'first prompt'), request(1, start + 1, 'older', 'one'), title(2, start + 2, 'Launch plan')])],
      [second, observation(second, [human(0, start, 'second prompt'), request(1, start + 2, 'newer', 'two')])],
    ])
    const collected = await collectDay(corpus(records, observations), {
      signal: new AbortController().signal,
      earliestCreatedAt: day.start - 86_400_000,
      maxSessions: 10,
      day,
      maxMessageChars: 100,
      maxMessagesPerSession: 10,
    })
    expect(collected.route).toEqual({ provider: 'newer', model: 'two' })
    expect(collected.sessions.map(session => session.title)).toEqual(['Launch plan', 'second prompt'])
  })

  it('truncates one message and skips an empty day', async () => {
    const verbose = id('verbose')
    const empty = id('empty')
    const start = day.start + 60_000
    const records = [record(verbose), record(empty)]
    const observations = new Map([
      [verbose, observation(verbose, [human(0, start, 'x'.repeat(200))])],
      [empty, observation(empty, [request(0, start)])],
    ])
    const collected = await collectDay(corpus(records, observations), {
      signal: new AbortController().signal,
      earliestCreatedAt: day.start - 86_400_000,
      maxSessions: 10,
      day,
      maxMessageChars: 20,
      maxMessagesPerSession: 10,
    })
    expect(collected.sessions).toHaveLength(1)
    expect(collected.sessions[0]?.messages[0]?.text).toBe(`${'x'.repeat(19)}…`)
    expect(await collectDay(corpus([record(empty)], new Map([[empty, observation(empty, [])]])), {
      signal: new AbortController().signal,
      earliestCreatedAt: day.start - 86_400_000,
      maxSessions: 10,
      day,
      maxMessageChars: 20,
      maxMessagesPerSession: 10,
    })).toMatchObject({ sessions: [], messageCount: 0, latestEventTime: 0 })
  })
})

describe('collectTodos', () => {
  it('reports every stored item with Session title and skips Sessions without the projection', async () => {
    const one = id('todo-one')
    const two = id('todo-two')
    const items: TodoItem[] = [
      { content: 'Write the brief', status: 'in_progress' },
      { content: 'Send the brief', status: 'pending' },
      { content: 'Open the file', status: 'completed' },
    ]
    const records = [record(one), record(two)]
    const observations = new Map([
      [one, observation(one, [], { todos: items })],
      [two, observation(two, [], { todos: null })],
    ])
    const collected = await collectTodos(corpus(records, observations, new Map([[one, 'Launch']])), {
      signal: new AbortController().signal,
      earliestCreatedAt: day.start - 86_400_000,
      maxSessions: 10,
    })
    expect(collected).toEqual([
      { sessionId: one, sessionTitle: 'Launch', content: 'Write the brief', status: 'in_progress' },
      { sessionId: one, sessionTitle: 'Launch', content: 'Send the brief', status: 'pending' },
      { sessionId: one, sessionTitle: 'Launch', content: 'Open the file', status: 'completed' },
    ])
    expect(collected.some(item => item.sessionId === two)).toBe(false)
  })
})
