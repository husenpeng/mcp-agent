/**
 * Turn and tool span construction from durable session events.
 *
 * The recorder keeps one open turn per session and one open tool call per
 * `callId`; a `turn/end` or `tool/result` closes them and returns the finished
 * drafts. Work the plugin never sees closed produces no span, so an interrupted
 * process loses only what it had not finished.
 *
 * @module @tomato/telemetry/recorder
 */

import { randomBytes } from 'node:crypto'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import { nanos, type SpanDraft } from './spans.ts'

/** A random 16-byte trace id as 32 lowercase hex characters. */
function randomTraceId(): string {
  return randomBytes(16).toString('hex')
}

/** A random 8-byte span id as 16 lowercase hex characters. */
function randomSpanId(): string {
  return randomBytes(8).toString('hex')
}

interface OpenTool {
  readonly callId: string
  readonly spanId: string
  readonly name: string
  readonly startNanos: string
}

interface OpenTurn {
  readonly traceId: string
  readonly spanId: string
  readonly turn: number
  readonly startNanos: string
  readonly tools: Map<string, OpenTool>
}

/** Close one turn and the tool calls still open inside it. */
function closeTurn(open: OpenTurn, endNanos: string, kind: string, sessionId: string): SpanDraft[] {
  const spans: SpanDraft[] = []
  for (const tool of open.tools.values()) {
    // A tool with no result never finished; its own status says so.
    spans.push({
      traceId: open.traceId,
      spanId: tool.spanId,
      parentSpanId: open.spanId,
      name: `tool ${tool.name}`,
      kind: 1,
      startTimeUnixNano: tool.startNanos,
      endTimeUnixNano: endNanos,
      attributes: { 'session.id': sessionId, turn: open.turn, 'tool.name': tool.name, 'tool.call_id': tool.callId },
      status: { code: 2, message: 'no result recorded' },
    })
  }
  spans.push({
    traceId: open.traceId,
    spanId: open.spanId,
    name: 'turn',
    kind: 1,
    startTimeUnixNano: open.startNanos,
    endTimeUnixNano: endNanos,
    attributes: { 'session.id': sessionId, turn: open.turn, 'turn.end_kind': kind },
    status: kind === 'completed' ? { code: 0 } : { code: 2, message: kind },
  })
  return spans
}

/**
 * Fold session events into finished spans, one recorder per plugin instance.
 * State is keyed by session id, so interleaved sessions never share a trace.
 */
export class TurnRecorder {
  private readonly turns = new Map<string, OpenTurn>()

  /**
   * Consume one event and return whatever it completed.
   * @param sessionId - owning session.
   * @param event - the durable event just appended.
   * @returns finished span drafts, usually empty.
   */
  observe(sessionId: string, event: SessionEvent): SpanDraft[] {
    switch (event.type) {
      case 'turn/start': {
        this.turns.set(sessionId, {
          traceId: randomTraceId(),
          spanId: randomSpanId(),
          turn: event.data.turn,
          startNanos: nanos(event.time),
          tools: new Map(),
        })
        return []
      }
      case 'tool/call': {
        const turn = this.turns.get(sessionId)
        if (turn === undefined) return []
        turn.tools.set(String(event.data.callId), {
          callId: String(event.data.callId),
          spanId: randomSpanId(),
          name: event.data.name,
          startNanos: nanos(event.time),
        })
        return []
      }
      case 'tool/result': {
        const turn = this.turns.get(sessionId)
        if (turn === undefined) return []
        const callId = String(event.data.message.toolCallId)
        const tool = turn.tools.get(callId)
        if (tool === undefined) return []
        turn.tools.delete(callId)
        const isError = event.data.message.isError === true
        const reason = event.data.error?.reason
        return [{
          traceId: turn.traceId,
          spanId: tool.spanId,
          parentSpanId: turn.spanId,
          name: `tool ${tool.name}`,
          kind: 1,
          startTimeUnixNano: tool.startNanos,
          endTimeUnixNano: nanos(event.time),
          attributes: {
            'session.id': sessionId,
            turn: turn.turn,
            'tool.name': tool.name,
            'tool.call_id': callId,
            'tool.is_error': isError,
          },
          status: isError
            ? { code: 2, ...reason === undefined ? {} : { message: reason } }
            : { code: 0 },
        }]
      }
      case 'turn/end': {
        const turn = this.turns.get(sessionId)
        if (turn === undefined) return []
        this.turns.delete(sessionId)
        return closeTurn(turn, nanos(event.time), event.data.reason.kind, sessionId)
      }
      default:
        return []
    }
  }

  /**
   * Close every open turn, for plugin disposal.
   * @param endNanos - shared closing time for the spans still open.
   * @returns finished drafts for all sessions.
   */
  drain(endNanos: string): SpanDraft[] {
    const spans: SpanDraft[] = []
    for (const [sessionId, turn] of this.turns) {
      spans.push(...closeTurn(turn, endNanos, 'shutdown', sessionId))
    }
    this.turns.clear()
    return spans
  }
}
