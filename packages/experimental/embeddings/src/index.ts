/**
 * Embedding capability seam. A provider turns text batches into vectors for
 * local semantic ranking; consumers read the optional service through
 * `ctx.get('embeddings')` so a composition without one keeps working.
 * @module @tomato/experimental-embeddings
 */

import { Service } from '@tomato/cordis'
import type { Context } from '@tomato/cordis'

/** Stable failure classes of an embedding request. */
export type EmbeddingsErrorCode = 'timeout' | 'provider' | 'invalid-response'

/** Expected failure of one embedding request; `code` is stable for consumers. */
export class EmbeddingsError extends Error {
  /**
   * @param message - actionable explanation without secret values.
   * @param code - stable failure class.
   */
  constructor(message: string, readonly code: EmbeddingsErrorCode) {
    super(message)
    this.name = 'EmbeddingsError'
  }
}

/** Cumulative embedding work one provider has performed since it mounted. */
export interface EmbeddingsUsage {
  /** Calls that reached the provider, including failed ones. */
  readonly requests: number
  /** Texts submitted across those calls. */
  readonly texts: number
  /** Calls that failed before returning vectors. */
  readonly failures: number
  /** Wall-clock milliseconds spent inside those calls. */
  readonly totalMs: number
  /** Message of the most recent failure, when one occurred. */
  readonly lastError?: string
}

/** One batched embedding request. */
export interface EmbedRequest {
  /** Texts to embed, in caller order; the result keeps that order. */
  readonly texts: readonly string[]
  /** Cancellation of the caller's operation; a provider aborts its transport on it. */
  readonly signal?: AbortSignal
}

/**
 * Text-to-vector capability. A provider declares the model identity and
 * vector length it returns, and embeds a batch in one operation.
 */
export abstract class Embeddings extends Service {
  /**
   * @param ctx - Host context owning the provider.
   */
  constructor(ctx: Context) {
    super(ctx, 'embeddings')
  }

  /** Provider model identity, stable for the life of the mounted provider. */
  abstract readonly model: string

  /** Vector length every result carries; `0` when the provider cannot know it before its first request. */
  abstract readonly dimensions: number

  /** Whether consumers may use this provider now; a disabled provider stays mounted and is ignored. */
  get enabled(): boolean {
    return true
  }

  /** Cumulative request counters since the provider mounted. */
  get usage(): EmbeddingsUsage {
    return { requests: 0, texts: 0, failures: 0, totalMs: 0 }
  }

  /**
   * Embed one batch of texts.
   * @param request - texts in caller order and the caller's cancellation.
   * @returns one vector per text, in the same order.
   * @throws {@link EmbeddingsError} when the provider cannot answer.
   */
  abstract embed(request: EmbedRequest): Promise<readonly Float32Array[]>
}

declare module '@tomato/cordis' {
  interface Context {
    /** Optional text embedding provider for local semantic ranking. */
    embeddings: Embeddings
  }
}

export default Embeddings
