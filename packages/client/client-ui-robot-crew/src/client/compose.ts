/**
 * Deterministic sentence-to-graph drafting for the crew studio: split a
 * description into clauses, classify each clause into a role, and chain them.
 * No model call, so the draft is instant and offline.
 * @module @tomato/client-ui-robot-crew
 */

import type { CrewEdge, CrewNode, CrewNodeRole } from '@tomato/experimental-robot-crew'

/** Labels the composer writes into node display names. */
export interface ComposeLabels {
  readonly research: string
  readonly draft: string
  readonly review: string
  readonly publish: string
  readonly analyze: string
  /** Fallback label for an unclassified clause. */
  readonly step: (index: number) => string
}

/** One drafted graph without crew-level fields. */
export interface ComposedGraph {
  readonly nodes: readonly CrewNode[]
  readonly edges: readonly CrewEdge[]
}

/** Split a sentence into observable steps. */
const CLAUSE_SEPARATORS = /[,，;；。]|\s+(?:then|next|finally)\s+|然后|接着|之后|再|→|->/iu

/** Role detection, checked in this order so "审校完再发布" splits correctly. */
const ROLES: readonly { readonly pattern: RegExp; readonly label: keyof Omit<ComposeLabels, 'step'>; readonly role: CrewNodeRole }[] = [
  { pattern: /调研|研究|搜集|查找|research|investigat|gather|find/iu, label: 'research', role: 'worker' },
  { pattern: /审|校对|复核|检查|review|audit|check/iu, label: 'review', role: 'reviewer' },
  { pattern: /写|成稿|文案|脚本|报告|write|draft|report|creat/iu, label: 'draft', role: 'worker' },
  { pattern: /发布|上线|投放|publish|launch|ship/iu, label: 'publish', role: 'worker' },
  { pattern: /分析|拆解|洞察|analy/iu, label: 'analyze', role: 'worker' },
]

/**
 * Detect the role of one clause.
 * @param clause - one clause of the description.
 * @returns the role and its label key.
 */
function classify(clause: string): { readonly label: keyof Omit<ComposeLabels, 'step'>; readonly role: CrewNodeRole } {
  for (const candidate of ROLES) {
    if (candidate.pattern.test(clause)) return { label: candidate.label, role: candidate.role }
  }
  return { label: 'draft', role: 'worker' }
}

/**
 * Split a description into clauses.
 * @param sentence - the person's description.
 * @returns trimmed clauses, at most six.
 */
export function splitClauses(sentence: string): readonly string[] {
  return sentence
    .split(CLAUSE_SEPARATORS)
    .map(clause => clause.trim())
    .filter(clause => clause.length > 0)
    .slice(0, 6)
}

/**
 * Draft a chained crew graph from one sentence.
 * @param sentence - the person's description of the flow.
 * @param labels - localized display labels.
 * @returns the graph; empty when the sentence has no clause.
 */
export function composeDraft(sentence: string, labels: ComposeLabels): ComposedGraph {
  const clauses = splitClauses(sentence)
  if (clauses.length === 0) return { nodes: [], edges: [] }
  const nodes: CrewNode[] = clauses.map((clause, index) => {
    const { label, role } = classify(clause)
    const id = `step-${index + 1}`
    return {
      id,
      label: labels[label],
      role: clause,
      instruction: clauses.length === 1 ? clause : `Deliver this part of the crew goal: ${clause}`,
      kind: role,
      maxTurns: 1,
      budgetTokens: 60_000,
      at: { x: 16 + index * 240, y: 64 },
    }
  })
  const edges: CrewEdge[] = nodes.slice(0, -1).flatMap((node, index) => {
    const next = nodes[index + 1]
    return next === undefined ? [] : [{
      from: node.id,
      to: next.id,
      kind: next.kind === 'reviewer' ? 'review' : 'handoff',
      when: 'always',
    }]
  })
  return { nodes, edges }
}
