/**
 * Client-side draft facts the studio needs without importing a host runtime:
 * the terminal-state predicate, a starter graph, and the pre-publication checks
 * that fail fast before a round trip. The provider's validator stays
 * authoritative for the complete specification.
 * @module @tomato/client-ui-robot-crew
 */

import type { CrewEdge, CrewNode, CrewRun, CrewSpec } from '@tomato/experimental-robot-crew'

/** Whether a run state has no further work. */
export function terminalRunState(state: CrewRun['state']): boolean {
  return state === 'succeeded' || state === 'failed' || state === 'tripped' || state === 'cancelled'
}

/** One member the starter draft offers. */
function starterNode(
  id: string,
  label: string,
  role: string,
  instruction: string,
  kind: CrewNode['kind'],
  x: number,
): CrewNode {
  return { id, label, role, instruction, kind, maxTurns: 1, budgetTokens: 60_000, at: { x, y: 96 } }
}

/**
 * Build the three-step starter draft a new crew opens with.
 * @param name - display name.
 * @param mission - one-sentence purpose.
 * @param labels - localized member names.
 * @returns a publishable three-node crew.
 */
export function starterDraft(
  name: string,
  mission: string,
  labels: { readonly research: string; readonly draft: string; readonly review: string },
): CrewSpec {
  const nodes: CrewNode[] = [
    starterNode('research', labels.research, 'Collect the facts the collaboration needs.', 'Gather the facts needed for the mission. End with `DECISION:` and `OPEN:` lines.', 'worker', 16),
    starterNode('draft', labels.draft, 'Turn the research into the deliverable.', 'Produce the deliverable from the upstream research and the run message.', 'worker', 256),
    starterNode('review', labels.review, 'Check the draft against the mission.', 'Review the upstream draft and list every gap as `CONSTRAINT:` or `OPEN:`.', 'reviewer', 496),
  ]
  const edges: CrewEdge[] = [
    { from: 'research', to: 'draft', kind: 'handoff', when: 'always' },
    { from: 'draft', to: 'review', kind: 'review', when: 'always' },
  ]
  return {
    name,
    mission,
    successCriteria: [],
    stopConditions: [],
    nodes,
    edges,
    memory: { briefChars: 6000, artifactChars: 1200, extract: true },
    guard: {
      maxSteps: 24,
      maxMessages: 40,
      maxHops: 2,
      maxDuplicates: 2,
      noProgressWindow: 3,
      wallClockMs: 30 * 60 * 1000,
      tokens: 400_000,
    },
    a2a: { intents: ['request', 'delegate'], peers: [] },
    input: { prompt: 'What must this collaboration deliver?', delivery: 'chat' },
  }
}

/**
 * Pre-publication checks that can fail without a Host round trip.
 * @param spec - draft specification.
 * @returns human-readable issues; empty means the provider may accept it.
 */
export function draftIssues(spec: CrewSpec): readonly string[] {
  const issues: string[] = []
  if (spec.name.trim() === '') issues.push('name must not be blank')
  if (spec.mission.trim() === '') issues.push('mission must not be blank')
  if (spec.nodes.length === 0) issues.push('a crew needs at least one member')
  const ids = new Set<string>()
  for (const node of spec.nodes) {
    if (!/^[a-z][a-z0-9-]{0,31}$/u.test(node.id)) issues.push(`member id "${node.id}" must be a lowercase slug`)
    if (ids.has(node.id)) issues.push(`duplicate member id "${node.id}"`)
    ids.add(node.id)
    if (node.label.trim() === '') issues.push(`member "${node.id}" needs a label`)
    if (node.instruction.trim() === '') issues.push(`member "${node.id}" needs a task`)
  }
  for (const edge of spec.edges) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) issues.push(`handoff ${edge.from} → ${edge.to} names an unknown member`)
  }
  if (spec.guard.maxSteps < 1) issues.push('max steps must be at least 1')
  return issues
}
