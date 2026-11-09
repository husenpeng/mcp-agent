import { describe, expect, it } from 'vitest'
import { emptyCrewSpec, entryNodes, starterCrewSpec, topologicalOrder, validateCrewSpec } from '../src/index.ts'
import type { CrewSpec } from '../src/index.ts'

function mutating(spec: CrewSpec) {
  const clone = structuredClone(spec)
  return { ...clone, nodes: [...clone.nodes], edges: [...clone.edges] }
}

describe('crew specification', () => {
  it('accepts the starter graph and orders it', () => {
    const spec = starterCrewSpec({ name: 'Campaign crew', mission: 'Ship a brief' })
    expect(validateCrewSpec(spec)).toEqual([])
    const order = topologicalOrder(spec.nodes, spec.edges)
    expect(order).toEqual(['research', 'draft', 'review'])
    expect(entryNodes(spec.nodes, spec.edges)).toEqual(['research'])
  })

  it('requires a node and rejects duplicate and malformed ids', () => {
    const spec = mutating(starterCrewSpec({ name: 'C', mission: 'M' }))
    spec.nodes = []
    expect(validateCrewSpec(spec).map(issue => issue.path)).toContain('nodes')
    const duplicate = mutating(starterCrewSpec({ name: 'C', mission: 'M' }))
    duplicate.nodes[1] = { ...duplicate.nodes[1]!, id: 'research' }
    expect(validateCrewSpec(duplicate).map(issue => issue.message).join(' ')).toContain('duplicate node id')
    const malformed = mutating(starterCrewSpec({ name: 'C', mission: 'M' }))
    malformed.nodes[0] = { ...malformed.nodes[0]!, id: 'Research' }
    expect(validateCrewSpec(malformed).map(issue => issue.path)).toContain('nodes.0.id')
  })

  it('rejects unknown endpoints, self handoffs, duplicates, and cycles', () => {
    const unknown = mutating(starterCrewSpec({ name: 'C', mission: 'M' }))
    unknown.edges[0] = { from: 'ghost', to: 'draft', kind: 'handoff', when: 'always' }
    expect(validateCrewSpec(unknown).map(issue => issue.path)).toContain('edges.0.from')
    expect(validateCrewSpec(unknown).map(issue => issue.path)).not.toContain('edges')

    const selfLoop = mutating(starterCrewSpec({ name: 'C', mission: 'M' }))
    selfLoop.edges[0] = { from: 'research', to: 'research', kind: 'handoff', when: 'always' }
    expect(validateCrewSpec(selfLoop).map(issue => issue.message)).toContain('a node cannot hand off to itself')

    const cyclic = mutating(starterCrewSpec({ name: 'C', mission: 'M' }))
    cyclic.edges = [
      { from: 'research', to: 'draft', kind: 'handoff', when: 'always' },
      { from: 'draft', to: 'research', kind: 'handoff', when: 'always' },
    ]
    expect(validateCrewSpec(cyclic).map(issue => issue.path)).toContain('edges')
  })

  it('bounds limits and reports every problem at once', () => {
    const spec = mutating(emptyCrewSpec({ name: ' ', mission: '' }))
    spec.guard = { ...spec.guard, maxSteps: 0, maxHops: 9 }
    spec.memory = { ...spec.memory, briefChars: 10 }
    spec.input = { ...spec.input, delivery: 'nope' as never }
    const paths = validateCrewSpec(spec).map(issue => issue.path)
    for (const path of ['name', 'mission', 'guard.maxSteps', 'guard.maxHops', 'memory.briefChars', 'input.delivery']) {
      expect(paths).toContain(path)
    }
  })

  it('defaults a crew to the recommended loop limits', () => {
    const spec = emptyCrewSpec({ name: 'C', mission: 'M' })
    expect(spec.guard).toMatchObject({ maxSteps: 24, maxHops: 2, maxDuplicates: 2, wallClockMs: 1_800_000 })
    expect(spec.memory).toMatchObject({ briefChars: 6000, artifactChars: 1200, extract: true })
    expect(spec.a2a.intents).toEqual(['request', 'delegate'])
  })
})
