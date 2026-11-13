/** Vector encoding shared by the JSON cache and the SQLite sidecar. */
import { describe, expect, it } from 'vitest'
import { bytesToVector, decodeVector, encodeVector, vectorToBytes } from '@tomato/experimental-memory'

describe('vector encoding', () => {
  it('round-trips base64 and raw bytes', () => {
    const vector = Float32Array.from([1, -2.5, 0, 3])
    const encoded = encodeVector(vector)
    expect(decodeVector(encoded, 4)).toEqual(vector)
    const bytes = vectorToBytes(vector)
    expect(bytesToVector(bytes, 4)).toEqual(vector)
  })

  it('rejects bytes whose length disagrees with the expected dimensions', () => {
    expect(decodeVector(encodeVector(Float32Array.from([1, 2])), 3)).toBeUndefined()
    expect(bytesToVector(vectorToBytes(Float32Array.from([1, 2])), 3)).toBeUndefined()
  })
})
