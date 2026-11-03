import test from 'node:test'
import assert from 'node:assert/strict'
import { createCache } from '../src/host/http.js'

test('createCache answers from memory until its lifetime ends', async () => {
  let calls = 0
  let now = 0
  const original = Date.now
  Date.now = () => now
  try {
    const cache = createCache({ ttlMs: 100, read: async () => ++calls })
    assert.equal(await cache.get(), 1)
    assert.equal(await cache.get(), 1)
    now = 101
    assert.equal(await cache.get(), 2)
    assert.equal(await cache.get(true), 3)
  } finally {
    Date.now = original
  }
})

test('createCache shares one in-flight read and drops a failure', async () => {
  let calls = 0
  let release
  const gate = new Promise(resolve => { release = resolve })
  const cache = createCache({
    ttlMs: 1000,
    read: async () => { calls += 1; await gate; if (calls === 1) throw new Error('first'); return calls },
  })
  const first = cache.get().catch(error => error.message)
  const second = cache.get().catch(error => error.message)
  release()
  const [a, b] = await Promise.all([first, second])
  assert.equal(calls, 1)
  assert.equal(a, 'first')
  assert.equal(b, 'first')
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(await cache.get(), 2)
})

test('createCache forgets its value on clear', async () => {
  let calls = 0
  const cache = createCache({ ttlMs: 1000, read: async () => ++calls })
  assert.equal(await cache.get(), 1)
  cache.clear()
  assert.equal(await cache.get(), 2)
})