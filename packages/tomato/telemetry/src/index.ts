/**
 * Tomato telemetry: turn and tool spans for the internal relay.
 *
 * The plugin listens to `session/event`, folds each event into finished span
 * drafts, and posts them as OTLP/HTTP JSON in small batches. Delivery is best
 * effort: a failing relay degrades to a warning and never touches the agent
 * loop, and nothing here reads or rewrites session content.
 *
 * @module @tomato/telemetry
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-session'
import { Config } from './config.ts'
import { TurnRecorder } from './recorder.ts'
import { nanos, otlpDocument, type SpanDraft } from './spans.ts'

export { Config, type Config as TelemetryConfig } from './config.ts'

/** Identifier recorded as the instrumentation scope. */
const SCOPE_NAME = '@tomato/telemetry'

/** One queued batch awaiting its flush timer. */
interface PendingBatch {
  readonly spans: SpanDraft[]
  timer?: ReturnType<typeof setTimeout>
}

/**
 * Send one OTLP batch, swallowing transport and relay failures.
 * @param config - resolved plugin configuration.
 * @param spans - drafts to send.
 * @param log - logger used for the single warning a failed send produces.
 */
async function send(config: Config, spans: readonly SpanDraft[], log: (message: string) => void): Promise<void> {
  if (config.endpoint === '' || spans.length === 0) return
  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...config.token === undefined || config.token === '' ? {} : { authorization: `Bearer ${config.token}` },
      },
      body: JSON.stringify(otlpDocument(
        spans,
        { 'service.name': config.serviceName, 'service.version': process.env.TOMATO_CLIENT_VERSION ?? 'development' },
        SCOPE_NAME,
      )),
      signal: AbortSignal.timeout(config.timeoutMs),
    })
    if (!response.ok) log(`telemetry relay rejected a batch with HTTP ${String(response.status)}`)
  } catch (error) {
    log(`telemetry relay send failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Register the turn/tool span recorder on one Host context.
 * @param ctx - Host context owning the session subscription.
 * @param config - resolved plugin configuration.
 */
export function apply(ctx: Context, config: Config): void {
  if (config.endpoint === '') return
  const recorder = new TurnRecorder()
  let pending: PendingBatch | undefined
  const log = (message: string): void => { ctx.logger.warn(`tomato-telemetry: ${message}`) }

  const flush = (): void => {
    const batch = pending
    if (batch === undefined) return
    pending = undefined
    if (batch.timer !== undefined) clearTimeout(batch.timer)
    void send(config, batch.spans, log)
  }

  ctx.effect(() => () => {
    const closed = recorder.drain(nanos(Date.now()))
    flush()
    void send(config, closed, log)
  }, 'tomato-telemetry: dispose drain')

  ctx.on('session/event', (session, event) => {
    for (const span of recorder.observe(String(session.id), event)) {
      if (pending === undefined) {
        const batch: PendingBatch = { spans: [] }
        batch.timer = setTimeout(flush, config.flushIntervalMs)
        pending = batch
      }
      pending.spans.push(span)
      if (pending.spans.length >= config.maxBatchSpans) flush()
    }
  })
}
