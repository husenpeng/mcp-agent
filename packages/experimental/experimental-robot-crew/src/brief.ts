/**
 * Execution-time memory: extract the durable decisions, constraints, open
 * questions, and artifacts from a finished step, then compose the bounded brief
 * one node receives. The brief always restates the mission, the success
 * criteria, and the node's own task, so a long chain keeps its anchor in view.
 * @module @tomato/experimental-robot-crew
 */

/** Memory extracted from one step output. */
export interface ExtractedMemory {
  /** Chosen direction other steps must honor. */
  readonly decisions: readonly string[]
  /** Limits, requirements, or prohibitions other steps must honor. */
  readonly constraints: readonly string[]
  /** Questions left for a later step. */
  readonly open: readonly string[]
  /** Named deliverables the step produced. */
  readonly artifacts: readonly string[]
  /** Head of the step output, for upstream summaries. */
  readonly summary: string
}

/** Marker line the model writes so extraction is deterministic. */
const MARKER = /^\s*(?:[-*•]\s*)?(DECISION|CONSTRAINT|OPEN|ARTIFACT|决策|约束|待定|产物)\s*[:：]\s*(.+)$/iu

/** Longest one extracted item may be. */
const ITEM_CHARS = 240

/**
 * Collapse whitespace and bound one text item.
 * @param text - raw item text.
 * @param limit - maximum characters.
 * @returns the trimmed, single-line item.
 */
export function bound(text: string, limit: number): string {
  const oneLine = text.replace(/\s+/gu, ' ').trim()
  if (oneLine.length <= limit) return oneLine
  return `${oneLine.slice(0, Math.max(0, limit - 1)).trimEnd()}…`
}

/**
 * Take the head of a step output as its summary, ending at a sentence boundary
 * when one falls inside the limit.
 * @param text - full step output.
 * @param limit - maximum characters.
 * @returns the bounded summary.
 */
export function summarize(text: string, limit = 600): string {
  const oneLine = text.replace(/[ \t]+/gu, ' ').replace(/\s*\n\s*/gu, ' ').trim()
  if (oneLine.length <= limit) return oneLine
  const head = oneLine.slice(0, limit)
  const boundary = Math.max(head.lastIndexOf('. '), head.lastIndexOf('。'), head.lastIndexOf('! '), head.lastIndexOf('? '))
  return `${(boundary > limit * 0.5 ? head.slice(0, boundary + 1) : head).trimEnd()}…`
}

/**
 * Read the marker lines one step wrote.
 * @param text - full step output.
 * @param perKind - maximum items kept per marker kind.
 * @returns the extracted memory; unrecognized text contributes only the summary.
 */
export function extractMemory(text: string, perKind = 6): ExtractedMemory {
  const decisions: string[] = []
  const constraints: string[] = []
  const open: string[] = []
  const artifacts: string[] = []
  const seen = new Set<string>()
  for (const line of text.split('\n')) {
    const match = MARKER.exec(line)
    if (match === null) continue
    const marker = match[1]?.toUpperCase() ?? ''
    const value = bound(match[2] ?? '', ITEM_CHARS)
    if (value === '') continue
    const key = `${marker}:${value.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    const bucket = marker === 'DECISION' || marker === '决策'
      ? decisions
      : marker === 'CONSTRAINT' || marker === '约束'
        ? constraints
        : marker === 'OPEN' || marker === '待定' ? open : artifacts
    if (bucket.length < perKind) bucket.push(value)
  }
  return Object.freeze({
    decisions: Object.freeze(decisions),
    constraints: Object.freeze(constraints),
    open: Object.freeze(open),
    artifacts: Object.freeze(artifacts),
    summary: summarize(text),
  })
}

/** Accumulated memory carried into one brief. */
export interface BriefMemory {
  /** Decisions extracted from earlier steps. */
  readonly decisions: readonly string[]
  /** Constraints extracted from earlier steps. */
  readonly constraints: readonly string[]
  /** Open questions extracted from earlier steps. */
  readonly open: readonly string[]
}

/** One upstream result offered to a node. */
export interface BriefArtifact {
  /** Producing node id. */
  readonly node: string
  /** Producing node label. */
  readonly label: string
  /** Bounded result text. */
  readonly summary: string
}

/** Everything one brief needs. */
export interface BriefOptions {
  /** Crew mission, always restated. */
  readonly mission: string
  /** Run success criteria, always restated. */
  readonly successCriteria: readonly string[]
  /** Run stop conditions, always restated. */
  readonly stopConditions: readonly string[]
  /** Receiving node label. */
  readonly nodeLabel: string
  /** Receiving node responsibility. */
  readonly nodeRole: string
  /** Receiving node task. */
  readonly instruction: string
  /** Accumulated extracted memory. */
  readonly memory: BriefMemory
  /** Upstream results, most relevant first. */
  readonly artifacts: readonly BriefArtifact[]
  /** Replies peer agents sent to this node. */
  readonly replies: readonly BriefArtifact[]
  /** Guard warnings the orchestrator wants the node to see. */
  readonly warnings: readonly string[]
  /** Character budget of the complete brief. */
  readonly budgetChars: number
}

/** Section order after the fixed anchor; earlier sections survive a tight budget. */
const OPTIONAL_SECTIONS = ['task', 'contract', 'constraints', 'decisions', 'artifacts', 'replies', 'open', 'warnings'] as const

/**
 * Compose the bounded brief one node receives. The anchor (mission, success
 * criteria, stop conditions) and the role are always included; the task, output
 * contract, and memory sections fill the remaining budget in priority order.
 * @param options - anchor, node, memory, and budget.
 * @returns one Markdown brief no longer than `budgetChars`.
 */
export function composeBrief(options: BriefOptions): string {
  const fixed = [
    '## Crew mission',
    options.mission,
    '',
    '## Success criteria',
    ...options.successCriteria.map(item => `- ${item}`),
    ...options.stopConditions.length === 0 ? [] : ['', '## Stop conditions', ...options.stopConditions.map(item => `- ${item}`)],
    '',
    `## Your role: ${options.nodeLabel}`,
    options.nodeRole,
  ]
  const sections: Record<typeof OPTIONAL_SECTIONS[number], string[]> = {
    task: ['', '## Your task', options.instruction],
    contract: ['', '## Output contract', 'Finish with short lines starting `DECISION:`, `CONSTRAINT:`, or `OPEN:` so later steps keep your reasoning. Keep the final answer first.'],
    constraints: options.memory.constraints.length === 0
      ? []
      : ['', '## Constraints from earlier steps', ...options.memory.constraints.map(item => `- ${item}`)],
    decisions: options.memory.decisions.length === 0
      ? []
      : ['', '## Decisions already made', ...options.memory.decisions.map(item => `- ${item}`)],
    artifacts: options.artifacts.length === 0
      ? []
      : [
        '',
        '## Upstream results',
        ...options.artifacts.flatMap(item => [`### ${item.label} (${item.node})`, item.summary]),
      ],
    replies: options.replies.length === 0
      ? []
      : ['', '## Peer replies', ...options.replies.flatMap(item => [`### ${item.label} (${item.node})`, item.summary])],
    open: options.memory.open.length === 0
      ? []
      : ['', '## Open questions', ...options.memory.open.map(item => `- ${item}`)],
    warnings: options.warnings.length === 0
      ? []
      : ['', '## Guard notes', ...options.warnings.map(item => `- ${item}`)],
  }
  const lines = [...fixed]
  for (const key of OPTIONAL_SECTIONS) {
    const section = sections[key]
    if (section.length === 0) continue
    const candidate = [...lines, ...section]
    if (candidate.join('\n').length <= options.budgetChars) lines.push(...section)
  }
  const text = lines.join('\n')
  if (text.length <= options.budgetChars) return text
  return `${text.slice(0, Math.max(0, options.budgetChars - 1)).trimEnd()}…`
}
