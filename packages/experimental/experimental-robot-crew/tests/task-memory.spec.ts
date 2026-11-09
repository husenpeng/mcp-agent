import { describe, expect, it } from 'vitest'
import type { CrewEntry, CrewRun, CrewRunId } from '@tomato/experimental-robot-crew'
import { carriedCount, carryTaskMemory } from '../src/index.ts'

const run = (id: string, state: CrewRun['state'] = 'succeeded'): Pick<CrewRun, 'id' | 'state'> => ({
  id: id as CrewRunId,
  state,
})

const memory = (seq: number, kind: string, text: string): CrewEntry => ({
  run: 'r' as CrewRunId,
  seq,
  kind: 'memory',
  at: seq,
  text,
  data: { memory: kind },
})

const limits = { maxRuns: 3, maxItems: 2 }

describe('carried task memory', () => {
  it('keeps each kind from the newest runs and drops duplicates', () => {
    const carried = carryTaskMemory([
      { run: run('r1'), entries: [memory(1, 'decision', 'Use pnpm'), memory(2, 'constraint', 'No new deps')] },
      {
        run: run('r2'),
        entries: [
          memory(1, 'decision', 'use PNPM'),
          memory(2, 'open', 'Which test runner?'),
          memory(3, 'decision', 'Ship behind a flag'),
        ],
      },
    ], limits)

    expect(carried.decisions).toEqual(['Ship behind a flag', 'use PNPM'])
    expect(carried.constraints).toEqual(['No new deps'])
    expect(carried.open).toEqual(['Which test runner?'])
  })

  it('reads only the newest finished runs and ignores in-flight ones', () => {
    const carried = carryTaskMemory([
      { run: run('old'), entries: [memory(1, 'decision', 'oldest')] },
      { run: run('mid'), entries: [memory(1, 'decision', 'middle')] },
      { run: run('new'), entries: [memory(1, 'decision', 'newest')] },
      { run: run('live', 'running'), entries: [memory(1, 'decision', 'in flight')] },
    ], limits)

    expect(carried.decisions).toEqual(['newest', 'middle'])
  })

  it('caps each kind and ignores entries that are not extracted memory', () => {
    const carried = carryTaskMemory([{
      run: run('r1'),
      entries: [
        memory(1, 'decision', 'one'),
        memory(2, 'decision', 'two'),
        { run: 'r' as CrewRunId, seq: 3, kind: 'step-result', at: 3, text: 'not memory' },
        { run: 'r' as CrewRunId, seq: 4, kind: 'memory', at: 4, text: 'uncategorized', data: { memory: 'artifact' } },
        memory(5, 'decision', ''),
      ],
    }], limits)

    expect(carried.decisions).toEqual(['two', 'one'])
    expect(carriedCount(carried)).toBe(2)
  })

  it('returns empty memory for a crew that never finished a run', () => {
    expect(carryTaskMemory([], limits)).toEqual({ decisions: [], constraints: [], open: [] })
    expect(carriedCount({ decisions: [], constraints: [], open: [] })).toBe(0)
  })
})
