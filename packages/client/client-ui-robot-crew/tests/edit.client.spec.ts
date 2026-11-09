import { describe, expect, it } from 'vitest'
import { emptyCrewSpec, starterCrewSpec } from '@tomato/experimental-robot-crew'
import { applyCrewPatch, applyEdgePatch, applyNodePatch, withoutEdge, withoutNode } from '../src/client/edit.ts'

const base = () => starterCrewSpec({ name: 'C', mission: 'M' })

describe('crew draft edits', () => {
  it('replaces fields and clears a cleared optional field', () => {
    const spec = { ...emptyCrewSpec({ name: 'C', mission: 'M' }), workspaceRoot: '/tmp/x', description: 'd' }
    const next = applyCrewPatch(spec, { name: 'Next', description: undefined, workspaceRoot: undefined })
    expect(next.name).toBe('Next')
    expect(next.description).toBeUndefined()
    expect(next.workspaceRoot).toBeUndefined()
    expect(spec.workspaceRoot).toBe('/tmp/x')
  })

  it('clears a robot binding and a stored position', () => {
    const node = { ...base().nodes[0]!, robot: { spec: 'r', revision: 1 }, at: { x: 1, y: 2 } }
    const next = applyNodePatch(node, { label: 'Renamed', robot: undefined, at: undefined })
    expect(next.label).toBe('Renamed')
    expect(next.robot).toBeUndefined()
    expect(next.at).toBeUndefined()
  })

  it('changes a handoff kind without touching the original', () => {
    const edge = base().edges[0]!
    const next = applyEdgePatch(edge, { kind: 'review' })
    expect(next.kind).toBe('review')
    expect(edge.kind).toBe('handoff')
  })

  it('removes a member with its handoffs and removes one handoff alone', () => {
    const spec = base()
    const trimmed = withoutNode(spec, 'draft')
    expect(trimmed.nodes.map(node => node.id)).toEqual(['research', 'review'])
    expect(trimmed.edges).toEqual([])
    const one = withoutEdge(spec, spec.edges[0]!)
    expect(one.edges).toHaveLength(1)
    expect(one.nodes).toHaveLength(3)
  })
})
