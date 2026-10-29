// @vitest-environment jsdom
/** The bounded observation log and the page-fact reader. */

import { describe, expect, it } from 'vitest'
import { createDeveloperStore, RETAINED_OBSERVATIONS } from '../src/client/store.ts'
import { readPageInfo } from '../src/client/page-info.ts'
import type { ConnectionObservation } from '@tomato/client-connection/client'
import type { BootManifest, BootModuleRow } from '@tomato/client-modules/client'

const observation: ConnectionObservation = {
  kind: 'rpc', channel: '/api', endpoint: 'x/y', startedAt: 0, durationMs: 1, request: {}, outcome: 'ok',
}

function row(id: string): BootModuleRow {
  return { id, url: `${id}.js`, initialUrl: `${id}.js`, rev: 'r', inject: [], external: [] }
}

const manifest: BootManifest = {
  rev: 'rev-1',
  release: { version: '1.2.3' },
  modules: [row('a'), row('b')],
  plugins: [{ id: 'a', inject: [], immediately: false }],
}

describe('createDeveloperStore', () => {
  it('keeps the newest observations and counts the dropped older ones', () => {
    const store = createDeveloperStore()
    for (let index = 0; index <= RETAINED_OBSERVATIONS; index += 1) store.append(observation)
    const state = store.state.getSnapshot()
    expect(state.entries).toHaveLength(RETAINED_OBSERVATIONS)
    expect(state.dropped).toBe(1)
    expect(state.entries[0]?.id).toBe(1)
  })

  it('clears entries and resets the drop count while keeping page facts', () => {
    const store = createDeveloperStore()
    store.append(observation)
    store.setPage({ release: '1.2.3', modules: 0, plugins: 0, connection: 'connected', panel: 'conversation',
      sessions: 0, slotNodes: 0, slotTree: '[]' })
    store.clear()
    const state = store.state.getSnapshot()
    expect(state.entries).toHaveLength(0)
    expect(state.dropped).toBe(0)
    expect(state.page?.release).toBe('1.2.3')
  })

  it('notifies subscribers of an appended observation', async () => {
    const store = createDeveloperStore()
    const seen: number[] = []
    const unsubscribe = store.state.subscribe(() => { seen.push(store.state.getSnapshot().entries.length) })
    store.append(observation)
    await new Promise((resolve) => { requestAnimationFrame(() => { resolve(undefined) }) })
    unsubscribe()
    expect(seen).toEqual([1])
  })
})

describe('readPageInfo', () => {
  it('reports the manifest, connection, panel, sessions, and slot tree', () => {
    const info = readPageInfo({
      manifest,
      connection: 'connected',
      panel: 'files',
      sessions: 2,
      slotSnapshot: [{ name: 'root', children: [{ name: 'child', children: [] }] }, { name: 'other' }],
    })
    expect(info).toMatchObject({ release: '1.2.3', modules: 2, plugins: 1, connection: 'connected',
      panel: 'files', sessions: 2, slotNodes: 3 })
    expect(JSON.parse(info.slotTree)).toHaveLength(2)
  })

  it('falls back for an absent release, connection, panel, and non-node children', () => {
    const info = readPageInfo({
      manifest: { rev: 'r', modules: [], plugins: [] },
      connection: undefined,
      panel: null,
      sessions: 0,
      slotSnapshot: [{ name: 'root', children: 'not-an-array' }],
    })
    expect(info).toMatchObject({ release: 'unknown', connection: 'unknown', panel: 'conversation', slotNodes: 1 })
  })
})
