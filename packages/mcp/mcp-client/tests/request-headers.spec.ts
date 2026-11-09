/** Per-call header scope: isolation between concurrent calls and fetch merging. */
import { describe, expect, it } from 'vitest'
import {
  currentRequestHeaders,
  headersApplyingFetch,
  withRequestHeaders,
  type FetchLike,
} from '../src/request-headers.ts'

/** Resolve after one macrotask so the two scopes interleave. */
function tick(): Promise<void> {
  return new Promise((resolve) => { setTimeout(resolve, 1) })
}

describe('withRequestHeaders', () => {
  it('exposes the headers only inside the call scope', async () => {
    expect(currentRequestHeaders()).toBeUndefined()
    const inside = await withRequestHeaders({ 'x-user-id': 'u1' }, async () => {
      await tick()
      return currentRequestHeaders()
    })
    expect(inside).toEqual({ 'x-user-id': 'u1' })
    expect(currentRequestHeaders()).toBeUndefined()
  })

  it('keeps concurrent calls isolated', async () => {
    const seen: Array<Record<string, string> | undefined> = []
    await Promise.all([
      withRequestHeaders({ 'x-user-id': 'slow' }, async () => {
        await tick()
        seen.push(currentRequestHeaders())
      }),
      withRequestHeaders({ 'x-user-id': 'fast' }, async () => {
        seen.push(currentRequestHeaders())
      }),
    ])
    expect(seen).toEqual([{ 'x-user-id': 'fast' }, { 'x-user-id': 'slow' }])
  })

  it('runs unchanged for an empty resolver result', async () => {
    const value = await withRequestHeaders({}, async () => currentRequestHeaders())
    expect(value).toBeUndefined()
  })
})

describe('headersApplyingFetch', () => {
  it('merges scoped headers into the request without dropping static ones', async () => {
    let captured: Headers | undefined
    const base: FetchLike = async (_input, init) => {
      captured = new Headers(init?.headers)
      return new Response('ok')
    }
    await withRequestHeaders(
      { 'x-user-id': 'u1', 'x-agent-session-id': 's1' },
      () => headersApplyingFetch(base)('http://127.0.0.1/mcp', { headers: { accept: 'application/json' } }),
    )
    expect(captured?.get('x-user-id')).toBe('u1')
    expect(captured?.get('x-agent-session-id')).toBe('s1')
    expect(captured?.get('accept')).toBe('application/json')
  })

  it('lets a scoped value override a static header of the same name', async () => {
    let captured: Headers | undefined
    const base: FetchLike = async (_input, init) => {
      captured = new Headers(init?.headers)
      return new Response('ok')
    }
    await withRequestHeaders(
      { 'x-user-id': 'fresh' },
      () => headersApplyingFetch(base)('http://127.0.0.1/mcp', { headers: { 'x-user-id': 'stale' } }),
    )
    expect(captured?.get('x-user-id')).toBe('fresh')
  })

  it('sends the request untouched outside a scope', async () => {
    let captured: Headers | undefined
    const base: FetchLike = async (_input, init) => {
      captured = new Headers(init?.headers)
      return new Response('ok')
    }
    await headersApplyingFetch(base)('http://127.0.0.1/mcp', { headers: { accept: 'text/event-stream' } })
    expect(captured?.get('x-user-id')).toBeNull()
    expect(captured?.get('accept')).toBe('text/event-stream')
  })
})
