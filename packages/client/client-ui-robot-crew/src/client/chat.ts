/**
 * Group-chat facts the collaboration tab derives without a host round trip:
 * the chat roster, the transcript of one run's flow ledger, and the
 * development collaboration template. Pure functions; the provider's runtime
 * stays authoritative for what a run did.
 * @module @tomato/client-ui-robot-crew
 */

import type { CrewEntry, CrewRun, CrewSpec, CrewSpecRevision } from '@tomato/experimental-robot-crew'

/** Kind of one rendered chat line. */
export type ChatLineKind = 'start' | 'memory' | 'working' | 'report' | 'a2a' | 'handoff' | 'guard' | 'end'

/** One group-chat line derived from a flow-ledger entry. */
export interface ChatLine {
  /** Ledger sequence the line came from; also the React key. */
  readonly seq: number
  /** What the line is. */
  readonly kind: ChatLineKind
  /** Unix epoch milliseconds the ledger recorded it. */
  readonly at: number
  /** Speaking member's label, when a member spoke. */
  readonly from?: string
  /** Addressed member's label, when the line was addressed. */
  readonly to?: string
  /** Body text as the ledger recorded it. */
  readonly text: string
  /** Carried task-memory counts, when the line names what earlier runs left. */
  readonly counts?: { readonly decisions: number; readonly constraints: number; readonly open: number }
}

/** One group chat in the collaboration rail. */
export interface GroupChat {
  /** Revision the member list and mission come from. */
  readonly ref: CrewSpecRevision['ref']
  /** Display name shared by every run. */
  readonly name: string
  /** One-sentence purpose. */
  readonly mission: string
  /** Members in specification order. */
  readonly members: readonly { readonly id: string; readonly label: string }[]
  /** Runs of this crew in acceptance order. */
  readonly runs: readonly CrewRun[]
  /** Most recently accepted run, when the crew has run. */
  readonly latestRun?: CrewRun
  /** Publication or latest-run time, used to order the rail. */
  readonly activityAt: number
}

/**
 * Resolve one node id to its display label.
 * @param spec - crew the node belongs to.
 * @param id - node id read from ledger data.
 * @returns the label, the raw id, or undefined when no id was recorded.
 */
function labelOf(spec: CrewSpec, id: unknown): string | undefined {
  if (typeof id !== 'string') return undefined
  return spec.nodes.find(node => node.id === id)?.label ?? id
}

/**
 * Derive the group-chat transcript of one run from its flow ledger.
 *
 * Memory, drift, and brief entries stay out of the transcript: memory repeats a
 * decision a member already spoke, drift restates a failed reply, and the brief
 * is assembled prompt text rather than something a member said. The guard keeps
 * its lines because a refused message changes what the run did.
 * @param entries - ledger entries in sequence order.
 * @param spec - specification the run executed, for member labels.
 * @returns chat lines in ledger order.
 */
export function chatLines(entries: readonly CrewEntry[], spec: CrewSpec): readonly ChatLine[] {
  const lines: ChatLine[] = []
  for (const entry of entries) {
    const text = entry.text ?? ''
    const data = entry.data
    const speaker = labelOf(spec, entry.node)
    const sender = labelOf(spec, data?.from ?? entry.node)
    const target = labelOf(spec, data?.to)
    switch (entry.kind) {
      case 'run-start':
        lines.push({ seq: entry.seq, kind: 'start', at: entry.at, text })
        break
      case 'step-start':
        lines.push({ seq: entry.seq, kind: 'working', at: entry.at, text, ...speaker === undefined ? {} : { from: speaker } })
        break
      case 'step-result':
        lines.push({
          seq: entry.seq,
          kind: data?.failed === true ? 'guard' : 'report',
          at: entry.at,
          text,
          ...speaker === undefined ? {} : { from: speaker },
        })
        break
      case 'a2a-request':
        lines.push({
          seq: entry.seq, kind: 'a2a', at: entry.at, text,
          ...sender === undefined ? {} : { from: sender },
          ...target === undefined ? {} : { to: target },
        })
        break
      case 'a2a-reply':
        lines.push({
          seq: entry.seq, kind: 'report', at: entry.at, text,
          ...speaker === undefined ? {} : { from: speaker },
          ...target === undefined ? {} : { to: target },
        })
        break
      case 'handoff':
        lines.push({
          seq: entry.seq, kind: 'handoff', at: entry.at, text,
          ...sender === undefined ? {} : { from: sender },
          ...target === undefined ? {} : { to: target },
        })
        break
      case 'guard':
        lines.push({ seq: entry.seq, kind: 'guard', at: entry.at, text })
        break
      case 'memory':
        if (data?.carried === true) {
          lines.push({
            seq: entry.seq, kind: 'memory', at: entry.at, text,
            counts: {
              decisions: Number(data.decisions ?? 0),
              constraints: Number(data.constraints ?? 0),
              open: Number(data.open ?? 0),
            },
          })
        }
        break
      case 'run-end':
        lines.push({ seq: entry.seq, kind: 'end', at: entry.at, text })
        break
      case 'drift':
      case 'brief':
        break
    }
  }
  return lines
}

/**
 * Project the roster onto the rail's group-chat list.
 * @param snapshot - published revisions and every run.
 * @returns chats ordered by most recent activity.
 */
export function groupChats(snapshot: {
  readonly specs: readonly CrewSpecRevision[]
  readonly runs: readonly CrewRun[]
}): readonly GroupChat[] {
  return snapshot.specs
    .map((revision): GroupChat => {
      const runs = snapshot.runs.filter(run => run.spec.spec === revision.ref.spec)
      const latestRun = runs.at(-1)
      return {
        ref: revision.ref,
        name: revision.spec.name,
        mission: revision.spec.mission,
        members: revision.spec.nodes.map(node => ({ id: node.id, label: node.label })),
        runs,
        ...latestRun === undefined ? {} : { latestRun },
        activityAt: latestRun?.startedAt ?? revision.publishedAt,
      }
    })
    .sort((left, right) => right.activityAt - left.activityAt)
}

/** Localized member names of the development template. */
export interface DevelopmentCrewLabels {
  /** Lead agent that breaks the task down. */
  readonly kickoff: string
  /** Member that edits the code. */
  readonly build: string
  /** Member that runs tests and type checks. */
  readonly verify: string
  /** Member that reviews the change. */
  readonly audit: string
  /** Lead agent that summarizes reports and assigns the next round. */
  readonly dispatch: string
}

/**
 * Build the development collaboration template: a lead agent assigns work,
 * three members deliver it, and the lead agent reports back with the next
 * round. Edges run kickoff → members → dispatch, so every report reaches the
 * lead agent through a handoff the runtime already delivers.
 * @param input - name, mission, localized member names, and the editor's run prompt.
 * @returns a publishable five-member crew.
 */
export function developmentCrew(input: {
  readonly name: string
  readonly mission: string
  readonly prompt: string
  readonly labels: DevelopmentCrewLabels
  readonly workspaceRoot?: string | undefined
}): CrewSpec {
  const { labels } = input
  return {
    name: input.name,
    mission: input.mission,
    successCriteria: [],
    stopConditions: [],
    nodes: [
      {
        id: 'kickoff',
        label: labels.kickoff,
        role: 'Lead agent that turns the task into one deliverable per member.',
        instruction: 'Read the task and split it into what build, verify, and audit must each deliver. '
          + 'For each member write one line naming the deliverable and the check that accepts it. '
          + 'End with a `DECISION:` line.',
        kind: 'worker',
        maxTurns: 1,
        budgetTokens: 40_000,
        at: { x: 16, y: 160 },
      },
      {
        id: 'build',
        label: labels.build,
        role: 'Member that makes the code change.',
        instruction: 'Implement the change the task asks for. Report the files you changed, the commands you ran, '
          + 'and what still fails. End with `DECISION:` and `OPEN:` lines.',
        kind: 'worker',
        maxTurns: 2,
        budgetTokens: 80_000,
        at: { x: 256, y: 32 },
      },
      {
        id: 'verify',
        label: labels.verify,
        role: 'Member that runs tests and type checks.',
        instruction: 'Run the tests and type checks that cover the changed area. Report each command, its result, '
          + 'and the first failing assertion. End with one `CONSTRAINT:` line per failure.',
        kind: 'worker',
        maxTurns: 2,
        budgetTokens: 60_000,
        at: { x: 256, y: 160 },
      },
      {
        id: 'audit',
        label: labels.audit,
        role: 'Member that reviews the change against the project conventions.',
        instruction: 'Review the upstream change. List findings by severity P0, P1, P2 with file and line. '
          + 'Approve only when no P0 or P1 remains; write that as `DECISION: approved`.',
        kind: 'reviewer',
        maxTurns: 1,
        budgetTokens: 60_000,
        at: { x: 256, y: 288 },
      },
      {
        id: 'dispatch',
        label: labels.dispatch,
        role: 'Lead agent that summarizes the reports and assigns the next round.',
        instruction: 'Summarize each member report, give the acceptance verdict, then write the next round as a '
          + 'numbered list of assignments: who does what and how it will be verified. End with `DECISION:` lines.',
        kind: 'reviewer',
        maxTurns: 1,
        budgetTokens: 60_000,
        at: { x: 496, y: 160 },
      },
    ],
    edges: [
      { from: 'kickoff', to: 'build', kind: 'handoff', when: 'always' },
      { from: 'kickoff', to: 'verify', kind: 'handoff', when: 'always' },
      { from: 'kickoff', to: 'audit', kind: 'handoff', when: 'always' },
      { from: 'build', to: 'dispatch', kind: 'handoff', when: 'always' },
      { from: 'verify', to: 'dispatch', kind: 'handoff', when: 'always' },
      { from: 'audit', to: 'dispatch', kind: 'review', when: 'always' },
    ],
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
    input: { prompt: input.prompt, delivery: 'chat' },
    ...input.workspaceRoot === undefined ? {} : { workspaceRoot: input.workspaceRoot },
  }
}

/**
 * Pick a group-chat name that does not collide with an existing one.
 * @param taken - names already in the rail.
 * @param base - name the template asks for.
 * @returns the base name, or the base with the first free ordinal.
 */
export function uniqueGroupName(taken: readonly string[], base: string): string {
  if (!taken.includes(base)) return base
  for (let index = 2; index <= taken.length + 2; index += 1) {
    const candidate = `${base} ${index}`
    if (!taken.includes(candidate)) return candidate
  }
  return `${base} ${taken.length + 2}`
}
