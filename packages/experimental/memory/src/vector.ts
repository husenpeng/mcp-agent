/**
 * Vector encoding shared by the authoritative cache (base64 in JSON storage)
 * and the local search sidecar (raw little-endian float32 bytes in SQLite).
 */

/**
 * Encode one vector as base64 little-endian float32 data.
 * @param vector - the vector to encode.
 * @returns the base64 text stored beside a record.
 */
export function encodeVector(vector: Float32Array): string {
  return Buffer.from(vector.buffer, vector.byteOffset, vector.byteLength).toString('base64')
}

/**
 * Decode one stored vector.
 * @param encoded - base64 little-endian float32 data.
 * @param dimensions - expected vector length.
 * @returns the vector, or `undefined` when the stored bytes do not match.
 */
export function decodeVector(encoded: string, dimensions: number): Float32Array | undefined {
  const buffer = Buffer.from(encoded, 'base64')
  if (buffer.byteLength !== dimensions * 4) return undefined
  const vector = new Float32Array(dimensions)
  for (let index = 0; index < dimensions; index += 1) vector[index] = buffer.readFloatLE(index * 4)
  return vector
}

/**
 * Copy one vector into raw little-endian bytes for SQLite.
 * @param vector - the vector to copy.
 * @returns its bytes.
 */
export function vectorToBytes(vector: Float32Array): Uint8Array {
  return new Uint8Array(vector.buffer, vector.byteOffset, vector.byteLength).slice()
}

/**
 * Decode raw little-endian float32 bytes.
 * @param bytes - stored bytes.
 * @param dimensions - expected vector length.
 * @returns the vector, or `undefined` when the byte length does not match.
 */
export function bytesToVector(bytes: Uint8Array, dimensions: number): Float32Array | undefined {
  if (bytes.byteLength !== dimensions * 4) return undefined
  const copy = new Uint8Array(bytes)
  return new Float32Array(copy.buffer, copy.byteOffset, dimensions)
}
