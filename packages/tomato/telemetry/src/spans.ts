/**
 * OTLP/HTTP JSON span documents for Tomato Harness session activity.
 *
 * One trace describes one turn: a root span for the turn and one child span per
 * completed tool call. Everything here is a pure function of session events and
 * timestamps, so the mapping is testable without a transport.
 *
 * @module @tomato/telemetry/spans
 */

/** One span's identity and timing, before OTLP encoding. */
export interface SpanDraft {
  readonly traceId: string
  readonly spanId: string
  readonly parentSpanId?: string
  readonly name: string
  readonly kind: 1 | 3
  readonly startTimeUnixNano: string
  readonly endTimeUnixNano: string
  readonly attributes: Readonly<Record<string, string | number | boolean>>
  readonly status: { readonly code: 0 | 2; readonly message?: string }
}

/** A span-level attribute value in OTLP/JSON encoding. */
type OtlpValue = { stringValue: string } | { intValue: string } | { boolValue: boolean }

/** `time` is epoch milliseconds; OTLP wants nanoseconds as a decimal string. */
export function nanos(epochMilliseconds: number): string {
  return `${BigInt(Math.trunc(epochMilliseconds)) * 1_000_000n}`
}

function attributeValue(value: string | number | boolean): OtlpValue {
  if (typeof value === 'boolean') return { boolValue: value }
  if (typeof value === 'number') return { intValue: `${Math.trunc(value)}` }
  return { stringValue: value }
}

/**
 * Encode spans as one OTLP `resourceSpans` batch.
 * @param spans - drafts sharing one resource.
 * @param resourceAttributes - identifying attributes for every span in the batch.
 * @param scopeName - instrumentation scope recorded on the batch.
 * @returns the OTLP/HTTP JSON request body.
 */
export function otlpDocument(
  spans: readonly SpanDraft[],
  resourceAttributes: Readonly<Record<string, string>>,
  scopeName: string,
): unknown {
  return {
    resourceSpans: [{
      resource: {
        attributes: Object.entries(resourceAttributes).map(([key, value]) => ({ key, value: { stringValue: value } })),
      },
      scopeSpans: [{
        scope: { name: scopeName },
        spans: spans.map(span => ({
          traceId: span.traceId,
          spanId: span.spanId,
          ...(span.parentSpanId === undefined ? {} : { parentSpanId: span.parentSpanId }),
          name: span.name,
          kind: span.kind,
          startTimeUnixNano: span.startTimeUnixNano,
          endTimeUnixNano: span.endTimeUnixNano,
          attributes: Object.entries(span.attributes).map(([key, value]) => ({ key, value: attributeValue(value) })),
          status: span.status.code === 0 ? { code: 0 } : { code: 2, ...span.status.message === undefined ? {} : { message: span.status.message } },
        })),
      }],
    }],
  }
}
