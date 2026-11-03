/** Recap parsing, deterministic fallback, input bounds, and the auxiliary model call. */
import { describe, expect, it } from 'vitest'
import { Context } from '@tomato/cordis'
import LlmRuntime, { LlmAdapter } from '@tomato/llm'
import type { GenerateOptions, StreamChunk } from '@tomato/llm'
import type { CollectedDay } from '../src/collect.ts'
import {
  RECAP_SYSTEM_PROMPT,
  buildRecapInput,
  fallbackRecap,
  parseRecap,
  summarizeDay,
} from '../src/summarize.ts'

const collected: CollectedDay = {
  sessions: [{
    sessionId: 's1',
    title: 'Launch plan',
    latestTime: 100,
    messages: [
      { role: 'user', text: 'Draft the launch plan' },
      { role: 'assistant', text: 'Drafted the plan.' },
    ],
  }],
  latestEventTime: 100,
  messageCount: 2,
  route: { provider: 'test', model: 'm' },
}

/** The same day evidence when the observed Sessions carried no request header. */
const unrouted: CollectedDay = {
  sessions: collected.sessions,
  latestEventTime: collected.latestEventTime,
  messageCount: collected.messageCount,
}

/** Scripted model adapter. */
class Scripted extends LlmAdapter {
  requests: GenerateOptions[] = []
  constructor(private readonly chunks: StreamChunk[]) { super() }
  override async *stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    this.requests.push(options)
    for (const chunk of this.chunks) yield chunk
  }
}

/** Text response chunks ending in a stop. */
function text(value: string): StreamChunk[] {
  return [
    { type: 'block-start', index: 0, blockType: 'text' },
    { type: 'block-end', index: 0, block: { type: 'text', text: value } },
    { type: 'finish', reason: { kind: 'stop' } },
  ]
}

describe('parseRecap', () => {
  it('accepts fenced JSON, clamps text, deduplicates items, and attaches Session evidence', () => {
    const recap = parseRecap('```json\n' + JSON.stringify({
      headline: '  Launch day  ',
      summary: '  Prepared the launch.  ',
      workItems: [
        { title: 'Draft plan', detail: 'Done', status: 'done' },
        { title: 'draft plan', detail: 'duplicate', status: 'ongoing' },
        { title: '   ', status: 'blocked' },
      ],
      openTasks: ['Send brief', 'send brief', '  '],
    }) + '\n```', '2026-11-02', 5, collected)
    expect(recap).toMatchObject({
      day: '2026-11-02',
      generatedAt: 5,
      source: 'model',
      headline: 'Launch day',
      summary: 'Prepared the launch.',
      messageCount: 2,
    })
    expect(recap.workItems).toEqual([{ title: 'Draft plan', detail: 'Done', status: 'done' }])
    expect(recap.openTasks).toEqual(['Send brief'])
    expect(recap.sessions).toEqual([{
      sessionId: 's1', title: 'Launch plan', summary: 'Drafted the plan.', messageCount: 2,
    }])
  })

  it('rejects a response that is not the documented object', () => {
    expect(() => parseRecap('not json', '2026-11-02', 5, collected)).toThrow()
    expect(() => parseRecap('{"headline": "x"}', '2026-11-02', 5, collected)).toThrow()
  })
})

describe('fallbackRecap', () => {
  it('keeps one neutral work item per Session and no narrative', () => {
    const recap = fallbackRecap('2026-11-02', 5, collected)
    expect(recap).toMatchObject({ source: 'local', headline: '', summary: '', openTasks: [] })
    expect(recap.workItems).toEqual([{ title: 'Launch plan', detail: 'Drafted the plan.', status: 'unknown' }])
  })

  it('caps deterministic work items at the stored schema limit', () => {
    const many: CollectedDay = {
      sessions: Array.from({ length: 20 }, (_, index) => ({
        sessionId: `s${String(index)}`, title: `Task ${String(index)}`, latestTime: index,
        messages: [{ role: 'assistant' as const, text: `done ${String(index)}` }],
      })),
      latestEventTime: 20,
      messageCount: 20,
    }
    expect(fallbackRecap('2026-11-02', 5, many).workItems).toHaveLength(12)
  })

  it('falls back to the first message or the Session id for a missing title', () => {
    const recap = fallbackRecap('2026-11-02', 5, {
      sessions: [{ sessionId: 's2', title: '', latestTime: 1, messages: [{ role: 'assistant', text: 'Only output' }] }],
      latestEventTime: 1,
      messageCount: 1,
    })
    expect(recap.workItems[0]?.title).toBe('Only output')
  })
})

describe('buildRecapInput', () => {
  it('drops oldest messages and then whole Sessions to meet the byte ceiling', () => {
    const huge: CollectedDay = {
      sessions: [
        { sessionId: 'a', title: 'A', latestTime: 2, messages: [{ role: 'user', text: 'a'.repeat(100) }] },
        { sessionId: 'b', title: 'B', latestTime: 1, messages: [{ role: 'user', text: 'b'.repeat(100) }, { role: 'assistant', text: 'c'.repeat(100) }] },
      ],
      latestEventTime: 2,
      messageCount: 3,
    }
    const input = buildRecapInput(huge, 260)
    expect(Buffer.byteLength(input, 'utf8')).toBeLessThanOrEqual(260)
    expect((JSON.parse(input) as { sessions: unknown[] }).sessions.length).toBeLessThan(2)
  })
})

describe('summarizeDay', () => {
  it('runs one bounded auxiliary request, records the exact request, and returns the parsed recap', async () => {
    const ctx = new Context()
    await ctx.plugin(LlmRuntime)
    const adapter = new Scripted(text(JSON.stringify({
      headline: 'Launch ready',
      summary: 'Prepared the launch.',
      workItems: [{ title: 'Draft plan', detail: 'Done', status: 'done' }],
      openTasks: ['Send the brief'],
    })))
    ctx.llm.registerAdapter(['test'], adapter)
    const outcome = await summarizeDay(ctx, {
      maxInputBytes: 10_000, maxOutputTokens: 200, timeoutMs: 5_000,
    }, collected, '2026-11-02', 10, new AbortController().signal)
    expect(outcome.recap).toMatchObject({ source: 'model', headline: 'Launch ready' })
    expect(outcome.failure).toBeUndefined()
    expect(outcome.model).toMatchObject({ provider: 'test', model: 'm', maxTokens: 200 })
    expect(outcome.model?.input).toContain("Summarize today's sessions from this JSON:")
    expect(outcome.model?.input).toContain('Draft the launch plan')
    expect(outcome.model?.system).toBe(RECAP_SYSTEM_PROMPT)
    expect(adapter.requests[0]?.system).toBe(RECAP_SYSTEM_PROMPT)
  })

  it('returns the deterministic recap with the failure when the model output is malformed', async () => {
    const ctx = new Context()
    await ctx.plugin(LlmRuntime)
    ctx.llm.registerAdapter(['test'], new Scripted(text('not json')))
    const outcome = await summarizeDay(ctx, {
      maxInputBytes: 10_000, maxOutputTokens: 200, timeoutMs: 5_000,
    }, collected, '2026-11-02', 10, new AbortController().signal)
    expect(outcome.recap.source).toBe('local')
    expect(outcome.model).toBeUndefined()
    expect(outcome.failure).toBeInstanceOf(Error)
  })

  it('uses the deterministic recap without a failure when no route is known', async () => {
    const ctx = new Context()
    await ctx.plugin(LlmRuntime)
    const outcome = await summarizeDay(ctx, {
      maxInputBytes: 10_000, maxOutputTokens: 200, timeoutMs: 5_000,
    }, unrouted, '2026-11-02', 10, new AbortController().signal)
    expect(outcome.recap.source).toBe('local')
    expect(outcome.failure).toBeUndefined()
  })
})
