/** Embedding seam registration and its stable failure class. */
import assert from 'node:assert/strict'
import { Context } from '@tomato/cordis'
import { describe, expect, it } from 'vitest'
import Embeddings, { EmbeddingsError } from '@tomato/experimental-embeddings'

/** Minimal provider that embeds a text as its length and a constant. */
class LengthEmbeddings extends Embeddings {
  readonly model = 'length'
  readonly dimensions = 2

  async embed({ texts }: { readonly texts: readonly string[] }): Promise<readonly Float32Array[]> {
    return texts.map(text => Float32Array.from([text.length, 1]))
  }
}

describe('embeddings seam', () => {
  it('mounts one provider as ctx.embeddings', async () => {
    const ctx = new Context()
    await ctx.plugin(LengthEmbeddings)
    expect(ctx.embeddings.model).toBe('length')
    expect(ctx.embeddings.dimensions).toBe(2)
    expect(await ctx.embeddings.embed({ texts: ['ab', ''] })).toEqual([
      Float32Array.from([2, 1]),
      Float32Array.from([0, 1]),
    ])
    await ctx.fiber.dispose()
  })

  it('reports a stable failure code and name', () => {
    const error = new EmbeddingsError('timed out', 'timeout')
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('EmbeddingsError')
    expect(error.code).toBe('timeout')
    assert.equal(error.message, 'timed out')
  })
})
