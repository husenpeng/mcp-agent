import { describe, it, expect } from 'vitest'
import { parseDreamPlan, validatePlanOps } from '../src/plan.ts'
import { estimateTokens } from '../src/render.ts'
import { chunkWorklist, worklistDigest } from '../src/chunk.ts'
import { detectBackfillGaps } from '../src/backfill.ts'
import { isConsolidatableFact, keySimilarity } from '../src/worklist.ts'
import type { DreamTarget, SessionSummaryChain } from '../src/types.ts'

describe('parseDreamPlan', () => {
  it('parses a valid plan with all operation types', () => {
    const reply = JSON.stringify({
      merges: [{ keepId: 'r1', dropIds: ['r2'], reason: 'same fact' }],
      proposals: [{ targetId: 'r3', value: 'new value', reason: 'contradiction', evidence: ['e1'] }],
      pins: ['r4'],
      unpins: ['r5'],
      prunes: ['r6'],
      promotions: [{ episodeIds: ['e1'], entity: 'build', key: 'test-command', value: 'pnpm run test', reason: 'stated twice' }],
      notes: ['Consolidated 2 duplicates.'],
    })
    const plan = parseDreamPlan(reply)
    expect(plan).toBeDefined()
    expect(plan!.merges).toHaveLength(1)
    expect(plan!.merges[0]!.kind).toBe('merge')
    expect(plan!.proposals).toHaveLength(1)
    expect(plan!.pins).toEqual(['r4'])
    expect(plan!.unpins).toEqual(['r5'])
    expect(plan!.prunes).toEqual(['r6'])
    expect(plan!.promotions).toHaveLength(1)
    expect(plan!.promotions[0]!.entity).toBe('build')
    expect(plan!.notes).toHaveLength(1)
  })

  it('parses a plan wrapped in code fences', () => {
    const reply = '```json\n{"merges": [], "notes": ["nothing to do"]}\n```'
    const plan = parseDreamPlan(reply)
    expect(plan).toBeDefined()
    expect(plan!.merges).toHaveLength(0)
    expect(plan!.notes).toEqual(['nothing to do'])
  })

  it('returns undefined for non-JSON reply', () => {
    expect(parseDreamPlan('I think everything looks fine.')).toBeUndefined()
  })

  it('returns undefined for invalid schema', () => {
    expect(parseDreamPlan('{"merges": [{"keepId": 123}]}')).toBeUndefined()
  })

  it('returns empty plan for empty object', () => {
    const plan = parseDreamPlan('{}')
    expect(plan).toBeDefined()
    expect(plan!.merges).toHaveLength(0)
    expect(plan!.proposals).toHaveLength(0)
  })
})

describe('validatePlanOps', () => {
  const knownIds = new Set(['r1', 'r2', 'r3', 'r4', 'e1'])

  it('drops operations referencing unknown ids', () => {
    const plan = {
      merges: [{ kind: 'merge' as const, keepId: 'r1', dropIds: ['r2', 'unknown'], reason: 'test' }],
      proposals: [{ kind: 'proposal' as const, targetId: 'r3', value: 'v', reason: 'r', evidence: ['e1'] }],
      pins: ['r4', 'unknown'],
      unpins: [],
      prunes: ['unknown'],
      promotions: [
        { kind: 'promote' as const, episodeIds: ['e1'], entity: 'build', key: 'test-command', value: 'pnpm run test', reason: 'ok' },
        { kind: 'promote' as const, episodeIds: ['missing'], entity: 'build', key: 'x', value: 'v', reason: 'unknown episode' },
        { kind: 'promote' as const, episodeIds: ['e1'], entity: 'x'.repeat(80), key: 'x', value: 'v', reason: 'bad identifier' },
      ],
      notes: [],
    }
    const validated = validatePlanOps(plan, knownIds, 10)
    expect(validated.merges).toHaveLength(0) // dropIds contains unknown
    expect(validated.proposals).toHaveLength(1)
    expect(validated.pins).toEqual(['r4'])
    expect(validated.prunes).toHaveLength(0)
    expect(validated.promotions).toHaveLength(1)
    expect(validated.promotions[0]!.key).toBe('test-command')
  })

  it('respects maxOps limit', () => {
    const plan = {
      merges: [],
      proposals: [],
      promotions: [],
      pins: ['r1', 'r2', 'r3', 'r4'],
      unpins: [],
      prunes: [],
      notes: [],
    }
    const validated = validatePlanOps(plan, knownIds, 2)
    expect(validated.pins).toHaveLength(2)
  })

  it('rejects merge where keepId is in dropIds', () => {
    const plan = {
      merges: [{ kind: 'merge' as const, keepId: 'r1', dropIds: ['r1', 'r2'], reason: 'self-merge' }],
      proposals: [],
      promotions: [],
      pins: [],
      unpins: [],
      prunes: [],
      notes: [],
    }
    const validated = validatePlanOps(plan, knownIds, 10)
    expect(validated.merges).toHaveLength(0)
  })
})

describe('estimateTokens', () => {
  it('estimates ASCII text at ~4 chars per token', () => {
    const tokens = estimateTokens('hello world') // 11 chars
    expect(tokens).toBe(3) // ceil(11 * 0.25) = 3
  })

  it('estimates CJK text at 1 token per char', () => {
    const tokens = estimateTokens('你好世界') // 4 chars
    expect(tokens).toBe(4)
  })

  it('handles mixed text', () => {
    const tokens = estimateTokens('hello 你好')
    // 'hello ' = 6 ASCII chars = 1.5 tokens, '你好' = 2 CJK = 2 tokens
    expect(tokens).toBe(4) // ceil(1.5 + 2) = 4
  })

  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0)
  })
})

describe('chunkWorklist', () => {
  function makeTarget(id: string, recordIds: string[]): DreamTarget {
    return { id, reason: 'duplicate-cluster', recordIds, episodeIds: [], summary: `Target ${id}` }
  }

  it('returns empty for empty input', () => {
    expect(chunkWorklist([])).toEqual([])
  })

  it('puts all targets in one chunk when under limits', () => {
    const targets = [makeTarget('t1', ['r1']), makeTarget('t2', ['r2'])]
    const chunks = chunkWorklist(targets, { maxTargetsPerChunk: 10, maxTokensPerChunk: 10000 })
    expect(chunks).toHaveLength(1)
    expect(chunks[0]!.targets).toHaveLength(2)
  })

  it('splits chunks when exceeding maxTargetsPerChunk', () => {
    const targets = [makeTarget('t1', ['r1']), makeTarget('t2', ['r2']), makeTarget('t3', ['r3'])]
    const chunks = chunkWorklist(targets, { maxTargetsPerChunk: 2, maxTokensPerChunk: 10000 })
    expect(chunks.length).toBeGreaterThanOrEqual(2)
  })

  it('keeps connected targets in the same chunk', () => {
    const targets = [makeTarget('t1', ['r1', 'r2']), makeTarget('t2', ['r2', 'r3']), makeTarget('t3', ['r4'])]
    const chunks = chunkWorklist(targets, { maxTargetsPerChunk: 10, maxTokensPerChunk: 10000 })
    // t1 and t2 share r2, so they must be in the same chunk
    expect(chunks).toHaveLength(1)
    expect(chunks[0]!.targets).toHaveLength(3)
  })
})

describe('worklistDigest', () => {
  it('produces deterministic output', () => {
    const targets: DreamTarget[] = [
      { id: 't1', reason: 'duplicate-cluster', recordIds: ['r1', 'r2'], episodeIds: [], summary: 'test' },
    ]
    const d1 = worklistDigest(targets)
    const d2 = worklistDigest(targets)
    expect(d1).toBe(d2)
  })

  it('changes when targets change', () => {
    const t1: DreamTarget[] = [{ id: 't1', reason: 'duplicate-cluster', recordIds: ['r1'], episodeIds: [], summary: 'test' }]
    const t2: DreamTarget[] = [{ id: 't1', reason: 'duplicate-cluster', recordIds: ['r1', 'r2'], episodeIds: [], summary: 'test' }]
    expect(worklistDigest(t1)).not.toBe(worklistDigest(t2))
  })
})

describe('detectBackfillGaps', () => {
  it('detects sessions with no summaries', () => {
    const chains = new Map<string, SessionSummaryChain>([
      ['s1', { sessionId: 's1', summaries: [], totalChars: 0 }],
    ])
    const gaps = detectBackfillGaps(chains, 10000)
    expect(gaps).toHaveLength(1)
    expect(gaps[0]!.reason).toBe('no-summary')
  })

  it('detects oversized chains', () => {
    const chains = new Map<string, SessionSummaryChain>([
      ['s1', { sessionId: 's1', summaries: [{ id: 'e1', title: 'test', narrative: 'x'.repeat(20000), facts: [], createdAt: Date.now() }], totalChars: 20000 }],
    ])
    const gaps = detectBackfillGaps(chains, 10000)
    expect(gaps).toHaveLength(1)
    expect(gaps[0]!.reason).toBe('chain-too-large')
  })

  it('skips sessions with reasonable chains', () => {
    const chains = new Map<string, SessionSummaryChain>([
      ['s1', { sessionId: 's1', summaries: [{ id: 'e1', title: 'test', narrative: 'short', facts: [], createdAt: Date.now() }], totalChars: 10 }],
    ])
    const gaps = detectBackfillGaps(chains, 10000)
    expect(gaps).toHaveLength(0)
  })
})

describe('isConsolidatableFact', () => {
  it('drops shell exit codes', () => {
    expect(isConsolidatableFact('exit 0')).toBe(false)
    expect(isConsolidatableFact('exit 1')).toBe(false)
    expect(isConsolidatableFact('exit 127')).toBe(false)
  })

  it('keeps durable statements and repeated failures', () => {
    expect(isConsolidatableFact('exit code means the lint step failed')).toBe(true)
    expect(isConsolidatableFact('failed: cannot edit "a.ts": file changed since it was read')).toBe(true)
    expect(isConsolidatableFact('pnpm run test')).toBe(true)
  })
})

describe('keySimilarity', () => {
  it('treats word order and extra words as the same attribute', () => {
    expect(keySimilarity('package-manager', 'manager-package')).toBe(1)
    expect(keySimilarity('package-manager', 'package-manager-version')).toBeCloseTo(2 / 3)
  })

  it('separates unrelated attributes', () => {
    expect(keySimilarity('package-manager', 'image-input-mode')).toBe(0)
    expect(keySimilarity('', 'package-manager')).toBe(0)
  })
})
