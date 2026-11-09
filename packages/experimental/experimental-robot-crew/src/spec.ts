/**
 * Crew specification defaults, a starter graph, topological ordering, and the
 * complete runtime validator. Publication rejects every field problem at once
 * so an editor reports them together.
 * @module @tomato/experimental-robot-crew
 */

import type {
  CrewEdge, CrewGuardSpec, CrewMemorySpec, CrewNode, CrewSpec, CrewSpecIssue,
} from './types.ts'

/** Deployment defaults for loop protection. Chosen so a normal crew never meets them. */
export const DEFAULT_GUARD: CrewGuardSpec = Object.freeze({
  maxSteps: 24,
  maxMessages: 40,
  maxHops: 2,
  maxDuplicates: 2,
  noProgressWindow: 3,
  wallClockMs: 30 * 60 * 1000,
  tokens: 400_000,
})

/** Deployment defaults for execution-time memory. */
export const DEFAULT_MEMORY: CrewMemorySpec = Object.freeze({
  briefChars: 6000,
  artifactChars: 1200,
  extract: true,
})

/** Largest graph a crew may publish. */
export const MAX_NODES = 12

/** Node id grammar; the id doubles as the A2A address. */
const NODE_ID = /^[a-z][a-z0-9-]{0,31}$/u

/** One field the editor fills when creating a crew. */
export interface EmptyCrewInput {
  /** Display name. */
  readonly name: string
  /** One-sentence mission. */
  readonly mission: string
  /** Optional summary. */
  readonly description?: string
  /** Starting nodes; defaults to none. */
  readonly nodes?: readonly CrewNode[]
  /** Starting edges; defaults to none. */
  readonly edges?: readonly CrewEdge[]
}

/**
 * Build a specification with the recommended limits and no implicit nodes.
 * @param input - name, mission, and optional starting graph.
 * @returns a specification ready to publish.
 */
export function emptyCrewSpec(input: EmptyCrewInput): CrewSpec {
  return {
    name: input.name.trim(),
    ...input.description === undefined || input.description.trim() === ''
      ? {}
      : { description: input.description.trim() },
    mission: input.mission.trim(),
    successCriteria: [],
    stopConditions: [],
    nodes: input.nodes ?? [],
    edges: input.edges ?? [],
    memory: DEFAULT_MEMORY,
    guard: DEFAULT_GUARD,
    a2a: { intents: ['request', 'delegate'], peers: [] },
    input: { prompt: '这次编队要完成什么？', delivery: 'chat' },
  }
}

/**
 * The three-step starter graph: research, draft, review. It exists so a new
 * crew has a valid graph to run before the person edits it.
 * @param mission - mission the starter graph serves.
 * @returns nodes and edges in a straight chain.
 */
export function starterGraph(): { nodes: CrewNode[]; edges: CrewEdge[] } {
  const nodes: CrewNode[] = [
    {
      id: 'research',
      label: '调研',
      role: 'Collect the facts the collaboration needs and name what is still unknown.',
      instruction: 'Gather the facts needed for the mission. End with `DECISION:` and `OPEN:` lines.',
      kind: 'worker',
      maxTurns: 1,
      budgetTokens: 60_000,
      at: { x: 64, y: 96 },
    },
    {
      id: 'draft',
      label: '成稿',
      role: 'Turn the research into the deliverable the mission asks for.',
      instruction: 'Produce the deliverable from the upstream research and the run message. End with `DECISION:` lines.',
      kind: 'worker',
      maxTurns: 1,
      budgetTokens: 80_000,
      at: { x: 344, y: 96 },
    },
    {
      id: 'review',
      label: '审校',
      role: 'Check the draft against the mission and success criteria.',
      instruction: 'Review the upstream draft. List every gap as `CONSTRAINT:` or `OPEN:`; keep the final answer first.',
      kind: 'reviewer',
      maxTurns: 1,
      budgetTokens: 40_000,
      at: { x: 624, y: 96 },
    },
  ]
  const edges: CrewEdge[] = [
    { from: 'research', to: 'draft', kind: 'handoff', when: 'always' },
    { from: 'draft', to: 'review', kind: 'review', when: 'always' },
  ]
  return { nodes, edges }
}

/**
 * Build the starter crew an empty studio offers.
 * @param input - display name and mission.
 * @returns a publishable three-node crew.
 */
export function starterCrewSpec(input: { readonly name: string; readonly mission: string }): CrewSpec {
  const graph = starterGraph()
  const spec = emptyCrewSpec({ name: input.name, mission: input.mission, nodes: graph.nodes, edges: graph.edges })
  return { ...spec, successCriteria: ['Deliverable answers the mission', 'Every unknown is named'] }
}

/**
 * Order nodes so every edge points forward.
 * @param nodes - nodes to order.
 * @param edges - directed edges.
 * @returns the ids in execution order, or `undefined` when the graph has a cycle.
 */
export function topologicalOrder(
  nodes: readonly CrewNode[],
  edges: readonly CrewEdge[],
): readonly string[] | undefined {
  const indegree = new Map<string, number>(nodes.map(node => [node.id, 0]))
  const outgoing = new Map<string, string[]>(nodes.map(node => [node.id, []]))
  for (const edge of edges) {
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1)
    outgoing.get(edge.from)?.push(edge.to)
  }
  const ready = nodes.filter(node => indegree.get(node.id) === 0).map(node => node.id)
  const order: string[] = []
  while (ready.length > 0) {
    const id = ready.shift() as string
    order.push(id)
    for (const next of outgoing.get(id) ?? []) {
      const remaining = (indegree.get(next) ?? 0) - 1
      indegree.set(next, remaining)
      if (remaining === 0) ready.push(next)
    }
  }
  return order.length === nodes.length ? order : undefined
}

/**
 * Node ids that no edge enters; a crew runs them first.
 * @param nodes - every node.
 * @param edges - every edge.
 * @returns entry node ids in specification order.
 */
export function entryNodes(nodes: readonly CrewNode[], edges: readonly CrewEdge[]): readonly string[] {
  const targeted = new Set(edges.map(edge => edge.to))
  return nodes.filter(node => !targeted.has(node.id)).map(node => node.id)
}

/**
 * Validate one complete specification.
 * @param spec - untrusted specification.
 * @returns every field problem; empty means publishable.
 */
export function validateCrewSpec(spec: CrewSpec): readonly CrewSpecIssue[] {
  const issues: CrewSpecIssue[] = []
  const issue = (path: string, message: string): void => { issues.push({ path, message }) }
  if (typeof spec.name !== 'string' || spec.name.trim() === '') issue('name', 'must not be blank')
  else if (spec.name.length > 80) issue('name', 'must be at most 80 characters')
  if (typeof spec.mission !== 'string' || spec.mission.trim() === '') issue('mission', 'must not be blank')
  if (!Array.isArray(spec.successCriteria)) issue('successCriteria', 'must be an array')
  if (!Array.isArray(spec.stopConditions)) issue('stopConditions', 'must be an array')

  const ids = new Set<string>()
  for (const [index, node] of spec.nodes.entries()) {
    const path = `nodes.${index}`
    if (typeof node.id !== 'string' || !NODE_ID.test(node.id)) {
      issue(`${path}.id`, 'must be a lowercase slug such as "research"')
    } else if (ids.has(node.id)) {
      issue(`${path}.id`, `duplicate node id "${node.id}"`)
    } else {
      ids.add(node.id)
    }
    if (node.label.trim() === '') issue(`${path}.label`, 'must not be blank')
    if (node.role.trim() === '') issue(`${path}.role`, 'must not be blank')
    if (node.instruction.trim() === '') issue(`${path}.instruction`, 'must not be blank')
    if (!Number.isInteger(node.maxTurns) || node.maxTurns < 1 || node.maxTurns > 8) {
      issue(`${path}.maxTurns`, 'must be an integer between 1 and 8')
    }
    if (!Number.isFinite(node.budgetTokens) || node.budgetTokens < 1000) {
      issue(`${path}.budgetTokens`, 'must be at least 1000')
    }
    if (node.at !== undefined && (!Number.isFinite(node.at.x) || !Number.isFinite(node.at.y))) {
      issue(`${path}.at`, 'must carry finite canvas coordinates')
    }
    if (node.robot !== undefined && (node.robot.spec.trim() === '' || !Number.isInteger(node.robot.revision) || node.robot.revision < 1)) {
      issue(`${path}.robot`, 'must name a published robot revision')
    }
  }
  if (spec.nodes.length === 0) issue('nodes', 'a crew needs at least one node')
  if (spec.nodes.length > MAX_NODES) issue('nodes', `a crew may hold at most ${MAX_NODES} nodes`)

  const pairs = new Set<string>()
  for (const [index, edge] of spec.edges.entries()) {
    const path = `edges.${index}`
    if (!ids.has(edge.from)) issue(`${path}.from`, `unknown node "${edge.from}"`)
    if (!ids.has(edge.to)) issue(`${path}.to`, `unknown node "${edge.to}"`)
    if (edge.from === edge.to) issue(path, 'a node cannot hand off to itself')
    const key = `${edge.from}>${edge.to}`
    if (pairs.has(key)) issue(path, 'duplicate handoff between the same two nodes')
    pairs.add(key)
    if (edge.kind !== 'handoff' && edge.kind !== 'delegate' && edge.kind !== 'review') {
      issue(`${path}.kind`, 'must be handoff, delegate, or review')
    }
    if (edge.when !== 'always' && edge.when !== 'onSuccess') issue(`${path}.when`, 'must be always or onSuccess')
  }
  // An edge naming an unknown node is already reported above; ordering such a
  // graph would report the same defect a second time as a cycle.
  if (topologicalOrder(spec.nodes, spec.edges) === undefined && spec.edges.every(edge => ids.has(edge.from) && ids.has(edge.to))) {
    issue('edges', 'the graph has a cycle; crews must be acyclic')
  }

  const guard = spec.guard
  if (!Number.isInteger(guard.maxSteps) || guard.maxSteps < 1 || guard.maxSteps > 200) issue('guard.maxSteps', 'must be between 1 and 200')
  if (!Number.isInteger(guard.maxMessages) || guard.maxMessages < 0 || guard.maxMessages > 500) issue('guard.maxMessages', 'must be between 0 and 500')
  if (!Number.isInteger(guard.maxHops) || guard.maxHops < 0 || guard.maxHops > 5) issue('guard.maxHops', 'must be between 0 and 5')
  if (!Number.isInteger(guard.maxDuplicates) || guard.maxDuplicates < 0 || guard.maxDuplicates > 10) issue('guard.maxDuplicates', 'must be between 0 and 10')
  if (!Number.isInteger(guard.noProgressWindow) || guard.noProgressWindow < 2 || guard.noProgressWindow > 10) issue('guard.noProgressWindow', 'must be between 2 and 10')
  if (!Number.isFinite(guard.wallClockMs) || guard.wallClockMs < 1000) issue('guard.wallClockMs', 'must be at least 1000')
  if (!Number.isFinite(guard.tokens) || guard.tokens < 1000) issue('guard.tokens', 'must be at least 1000')

  if (!Number.isInteger(spec.memory.briefChars) || spec.memory.briefChars < 500 || spec.memory.briefChars > 50_000) {
    issue('memory.briefChars', 'must be between 500 and 50000')
  }
  if (!Number.isInteger(spec.memory.artifactChars) || spec.memory.artifactChars < 100 || spec.memory.artifactChars > 10_000) {
    issue('memory.artifactChars', 'must be between 100 and 10000')
  }
  for (const intent of spec.a2a.intents) {
    if (intent !== 'request' && intent !== 'delegate' && intent !== 'event') issue('a2a.intents', `unknown intent "${String(intent)}"`)
  }
  for (const peer of spec.a2a.peers) {
    if (!ids.has(peer)) issue('a2a.peers', `unknown node "${peer}"`)
  }
  if (spec.workspaceRoot !== undefined && spec.workspaceRoot.trim() === '') issue('workspaceRoot', 'must not be blank when present')
  if (spec.input.prompt.trim() === '') issue('input.prompt', 'must not be blank')
  if (spec.input.delivery !== 'chat' && spec.input.delivery !== 'artifact') issue('input.delivery', 'must be chat or artifact')
  return issues
}
