import { describe, expect, it } from 'vitest'
import type { CrewEdge, CrewNode } from '@tomato/experimental-robot-crew'
import {
  createDraftNode, createsCycle, duplicateEdge, edgeMidpoint, edgePath, nextNodeId, positionOf,
} from '../src/client/graph.ts'

const node = (id: string, at?: { x: number; y: number }): CrewNode => ({
  id, label: id, role: 'do work', instruction: 'deliver', kind: 'worker', maxTurns: 1, budgetTokens: 1000,
  ...at === undefined ? {} : { at },
})

const edges: CrewEdge[] = [
  { from: 'a', to: 'b', kind: 'handoff', when: 'always' },
  { from: 'b', to: 'c', kind: 'review', when: 'always' },
]

describe('crew graph geometry', () => {
  it('uses a stored position and lays the rest on a three-column grid', () => {
    expect(positionOf(node('a', { x: 10, y: 20 }), 0)).toEqual({ x: 10, y: 20 })
    expect(positionOf(node('a'), 1)).toEqual({ x: 256, y: 64 })
    expect(positionOf(node('a'), 3)).toEqual({ x: 16, y: 224 })
  })

  it('draws a forward cubic path and a midpoint between the two cards', () => {
    const from = { x: 0, y: 0 }
    const to = { x: 400, y: 200 }
    expect(edgePath(from, to)).toMatch(/^M 176 52 C /u)
    expect(edgeMidpoint(from, to)).toEqual({ x: 288, y: 152 })
  })

  it('rejects self loops, cycles, and duplicate handoffs', () => {
    expect(createsCycle(edges, 'a', 'a')).toBe(true)
    expect(createsCycle(edges, 'c', 'a')).toBe(true)
    expect(createsCycle(edges, 'a', 'c')).toBe(false)
    expect(duplicateEdge(edges, 'a', 'b')).toBe(true)
    expect(duplicateEdge(edges, 'c', 'b')).toBe(false)
  })

  it('mints a free member id and places a new card after the last one', () => {
    expect(nextNodeId([node('step-1'), node('step-2')])).toBe('step-3')
    const created = createDraftNode([node('a'), node('b')], 'Step 3')
    expect(created).toMatchObject({ id: 'step-3', label: 'Step 3', kind: 'worker', maxTurns: 1 })
    expect(created.at).toEqual({ x: 496, y: 64 })
  })
})
