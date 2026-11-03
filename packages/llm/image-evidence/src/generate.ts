/**
 * Engine execution: turn one attachment into evidence text through the first
 * configured vision model that answers, recording every attempt.
 * @module @tomato/image-evidence/src/generate
 */

import type { Context } from '@tomato/cordis'
import type { ImageAttachmentRef } from '@tomato/attachment'
import { BlockAssembler, createUserMessage } from '@tomato/llm'
import type { FinishReason, GenerateOptions, LlmCallConfig, TokenUsage } from '@tomato/llm'
import type { SessionId } from '@tomato/session'
import {
  buildVisionPrompt,
  parseEvidence,
  truncateEvidence,
  VISION_SYSTEM_PROMPT,
} from './prompt.ts'
import { evidenceRecordKey } from './spec.ts'
import type { ImageEvidenceAttempt, ImageEvidenceRecord } from './spec.ts'
import type { VisionEngineRef } from './types.ts'

/** Longest failure message kept in an attempt record. */
const MAX_FAILURE_CHARS = 500
/** Output cap for one evidence read; the contract is compact by design. */
const MAX_OUTPUT_TOKENS = 4_096

/** Everything one generation needs beyond the attachment itself. */
export interface GenerateEvidenceOptions {
  /** Owning context, used for the LLM registry. */
  readonly ctx: Context
  /** Image to read. */
  readonly ref: ImageAttachmentRef
  /** Engines in priority order. */
  readonly engines: readonly VisionEngineRef[]
  /** Evidence contract version recorded with the result. */
  readonly contractVersion: number
  /** Character cap applied to the stored evidence text. */
  readonly maxChars: number
  /** Deadline for one engine call. */
  readonly timeoutMs: number
  /** Caller cancellation, threaded from the step that needs the evidence. */
  readonly signal?: AbortSignal
  /** Session the auxiliary call belongs to, when known. */
  readonly sessionId?: SessionId
}

/** One generation outcome; `record` is absent when every engine failed. */
export interface GeneratedEvidence {
  readonly record?: ImageEvidenceRecord
  readonly attempts: readonly ImageEvidenceAttempt[]
  readonly durationMs: number
  readonly usage?: TokenUsage
}

/**
 * Read one image through the configured engine chain.
 * @param options - attachment, engine order, caps, and cancellation.
 * @returns the stored record (or the failed attempts) and the elapsed time.
 * @throws the caller's abort reason when the enclosing step is cancelled.
 */
export async function generateEvidence(options: GenerateEvidenceOptions): Promise<GeneratedEvidence> {
  const { ctx, ref, engines, signal } = options
  const startedAt = Date.now()
  const attempts: ImageEvidenceAttempt[] = []
  for (const engine of engines) {
    signal?.throwIfAborted()
    const capable = await engineAcceptsImages(ctx, engine, signal)
    if (!capable) {
      attempts.push(failure(engine, 0, 'ENGINE_NOT_VISION', `${engine.provider}/${engine.model} does not accept image input.`))
      continue
    }
    const attemptStart = Date.now()
    try {
      const read = await readOnce(options, engine)
      const evidence = parseEvidence(read.text)
      if (evidence === undefined) {
        attempts.push(failure(engine, Date.now() - attemptStart, 'EVIDENCE_INVALID', 'The engine answer did not match the evidence contract.'))
        continue
      }
      const serialized = JSON.stringify(evidence)
      const { text: stored, truncated } = truncateEvidence(serialized, options.maxChars)
      const now = new Date().toISOString()
      const attempt: ImageEvidenceAttempt = { engine, ok: true, durationMs: Date.now() - attemptStart }
      attempts.push(attempt)
      return {
        record: {
          attachmentId: String(ref.attachmentId),
          engine,
          contractVersion: options.contractVersion,
          text: stored,
          truncated,
          attempts,
          createdAt: now,
          lastReadAt: now,
        },
        attempts,
        durationMs: Date.now() - startedAt,
        ...read.usage === undefined ? {} : { usage: read.usage },
      }
    } catch (error: unknown) {
      signal?.throwIfAborted()
      attempts.push(failure(engine, Date.now() - attemptStart, failureCode(error), failureMessage(error)))
    }
  }
  return { attempts, durationMs: Date.now() - startedAt }
}

/**
 * Key under which one attachment's evidence would be stored for one engine.
 * @param ref - attachment the evidence belongs to.
 * @param engine - engine route.
 * @param contractVersion - evidence contract version.
 * @returns the storage key.
 */
export function recordKeyFor(ref: ImageAttachmentRef, engine: VisionEngineRef, contractVersion: number): string {
  return evidenceRecordKey(String(ref.attachmentId), engine, contractVersion)
}

async function engineAcceptsImages(
  ctx: Context,
  engine: VisionEngineRef,
  signal: AbortSignal | undefined,
): Promise<boolean> {
  try {
    const info = await ctx.llm.resolveModelInfo(engine.provider, engine.model, signal)
    return info.inputModalities?.includes('image') === true
  } catch {
    // An unresolvable route is a failed attempt, not a reason to abort the chain.
    return false
  }
}

async function readOnce(
  options: GenerateEvidenceOptions,
  engine: VisionEngineRef,
): Promise<{ text: string; usage?: TokenUsage }> {
  const { ctx, ref, signal } = options
  const deadline = new AbortController()
  const forwardAbort = (): void => {
    deadline.abort(signal?.reason)
  }
  signal?.addEventListener('abort', forwardAbort, { once: true })
  const timer = setTimeout(() => {
    deadline.abort(new Error(`image-evidence: ${engine.provider}/${engine.model} timed out`))
  }, options.timeoutMs)
  timer.unref()
  const callSignal = deadline.signal
  try {
    const config: LlmCallConfig = {
      provider: engine.provider,
      model: engine.model,
      maxTokens: MAX_OUTPUT_TOKENS,
    }
    const call = await ctx.llm.prepareCall(config, callSignal)
    const messages = [createUserMessage({
      content: [
        { type: 'text', text: buildVisionPrompt() },
        { type: 'image', attachment: ref },
      ],
      source: { kind: '@tomato/image-evidence' },
    })]
    const request: GenerateOptions = {
      ...call.config,
      messages,
      system: VISION_SYSTEM_PROMPT,
      signal: callSignal,
      ...options.sessionId === undefined ? {} : { sessionId: options.sessionId },
    }
    const assembler = new BlockAssembler()
    for await (const chunk of call.stream(request)) {
      callSignal.throwIfAborted()
      assembler.push(chunk)
    }
    const finish = assembler.finish
    assertSuccessfulFinish(finish)
    const text = assembler.blocks()
      .flatMap(block => block.type === 'text' ? [block.text] : [])
      .join('')
    const usage = assembler.usage
    return { text, ...usage === undefined ? {} : { usage } }
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', forwardAbort)
  }
}

function assertSuccessfulFinish(finish: FinishReason | undefined): void {
  if (finish === undefined) return
  switch (finish.kind) {
    case 'stop':
      return
    case 'error':
      throw new Error(`${finish.failure.code}: ${finish.failure.message}`)
    case 'aborted':
      throw new Error(`${finish.failure.code}: ${finish.failure.message}`)
    case 'max-tokens':
      throw new Error('EVIDENCE_TRUNCATED: the engine hit its output cap before finishing the evidence.')
    case 'tool-calls':
      throw new Error('EVIDENCE_INVALID: the engine requested a tool instead of returning evidence.')
    default:
      return
  }
}

function failure(engine: VisionEngineRef, durationMs: number, code: string, message: string): ImageEvidenceAttempt {
  return { engine, ok: false, durationMs, failure: { code, message: message.slice(0, MAX_FAILURE_CHARS) } }
}

function failureCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code
  }
  return 'ENGINE_ERROR'
}

function failureMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
