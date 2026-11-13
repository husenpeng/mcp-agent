import { describe, expect, it } from 'vitest'
import {
  emptyCrewSpec, entryNodes, requireRobotMembers, topologicalOrder, validateCrewSpec,
} from '../src/index.ts'
import type { CrewSpec } from '../src/index.ts'

const robot = { spec: 'rbot-research', revision: 1 }

function graph(): CrewSpec {
  return {
    ...emptyCrewSpec({ name: 'Campaign crew', mission: 'Ship a brief' }),
    nodes: [
      {
        id: 'research', label: 'Research', role: 'Find the facts', instruction: 'Collect facts',
        kind: 'worker', maxTurns: 1, budgetTokens: 60_000, robot,
      },
      {
        id: 'draft', label: 'Draft', role: 'Write the brief', instruction: 'Write the brief',
        kind: 'worker', maxTurns: 1, budgetTokens: 80_000, robot: { spec: 'rbot-draft', revision: 2 },
      },
      {
        id: 'review', label: 'Review', role: 'Check the brief', instruction: 'Review the brief',
        kind: 'reviewer', maxTurns: 1, budgetTokens: 40_000, robot: { spec: 'rbot-review', revision: 1 },
      },
    ],
    edges: [
      { from: 'research', to: 'draft', kind: 'handoff', when: 'always' },
      { from: 'draft', to: 'review', kind: 'review', when: 'always' },
    ],
  }
}

function mutating(spec: CrewSpec) {
  const clone = structuredClone(spec)
  return { ...clone, nodes: [...clone.nodes], edges: [...clone.edges] }
}

describe('crew specification', () => {
  it('accepts a graph of Rbot members and orders it', () => {
    const spec = graph()
    expect(validateCrewSpec(spec)).toEqual([])
    expect(requireRobotMembers(spec)).toEqual([])
    const order = topologicalOrder(spec.nodes, spec.edges)
    expect(order).toEqual(['research', 'draft', 'review'])
    expect(entryNodes(spec.nodes, spec.edges)).toEqual(['research'])
  })

  it('requires every member to bind an Rbot at publication', () => {
    const spec = mutating(graph())
    const { robot: _robot, ...withoutRobot } = spec.nodes[1]!
    spec.nodes[1] = withoutRobot
    expect(validateCrewSpec(spec)).toEqual([])
    expect(requireRobotMembers(spec)).toEqual([
      { path: 'nodes.1.robot', message: 'must name the published Rbot this member runs as' },
    ])
  })

  it('requires a node and rejects duplicate and malformed ids', () => {
    const spec = mutating(graph())
    spec.nodes = []
    expect(validateCrewSpec(spec).map(issue => issue.path)).toContain('nodes')
    const duplicate = mutating(graph())
    duplicate.nodes[1] = { ...duplicate.nodes[1]!, id: 'research' }
    expect(validateCrewSpec(duplicate).map(issue => issue.message).join(' ')).toContain('duplicate node id')
    const malformed = mutating(graph())
    malformed.nodes[0] = { ...malformed.nodes[0]!, id: 'Research' }
    expect(validateCrewSpec(malformed).map(issue => issue.path)).toContain('nodes.0.id')
  })

  it('rejects unknown endpoints, self handoffs, duplicates, and cycles', () => {
    const unknown = mutating(graph())
    unknown.edges[0] = { from: 'ghost', to: 'draft', kind: 'handoff', when: 'always' }
    expect(validateCrewSpec(unknown).map(issue => issue.path)).toContain('edges.0.from')
    expect(validateCrewSpec(unknown).map(issue => issue.path)).not.toContain('edges')

    const selfLoop = mutating(graph())
    selfLoop.edges[0] = { from: 'research', to: 'research', kind: 'handoff', when: 'always' }
    expect(validateCrewSpec(selfLoop).map(issue => issue.message)).toContain('a node cannot hand off to itself')

    const cyclic = mutating(graph())
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
