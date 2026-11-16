/**
 * The supervisor's model step: deciding whether a request is work this team
 * takes, and what work it becomes. The decision is one text line per ticket so
 * it can be read back, and the rule-based admission in `policy.ts` still decides
 * how much authority a decision earns.
 */
import type { MandateScope, ThreadRef, Trigger } from './types.ts'

/** Marker a supervisor ends its turn with. */
export const SUPERVISION_MARKER = 'DECISION:'

/** How much authority a planned piece of work asks for. */
export const SUPERVISION_SCOPES: readonly MandateScope[] = ['investigate', 'change', 'release']

/** One piece of work the supervisor would open. */
export interface WorkPlan {
  /** What the work is, in one line. */
  readonly subject: string
  /** How much authority it asks for. */
  readonly scope: MandateScope
}

/** What the supervisor decided about one request. */
export interface Supervision {
  /** Whether the team takes the work at all. */
  readonly accepted: boolean
  /** Why it declined, when it did. */
  readonly reason?: string | undefined
  /** The work it would open, in the order it would open it. */
  readonly plans: readonly WorkPlan[]
}

/**
 * Read the decision a supervisor wrote.
 *
 * One `DECISION:` line opens a piece of work: the scope word, then the subject.
 * `DECISION: reject` declines the whole request, and its text explains why. A
 * turn that named nothing declines: work nobody decided to take must not open.
 * @param text - the assistant text of one finished supervision turn.
 * @returns the decision the engine acts on.
 */
export function parseSupervision(text: string): Supervision {
  const lines = text.split('\n').filter(line => line.trimStart().startsWith(SUPERVISION_MARKER))
  const plans: WorkPlan[] = []
  for (const line of lines) {
    const rest = line.slice(line.indexOf(SUPERVISION_MARKER) + SUPERVISION_MARKER.length).trim()
    const space = rest.search(/\s/u)
    const head = (space === -1 ? rest : rest.slice(0, space)).replace(/[:.,]$/u, '').toLowerCase()
    if (head === 'reject') return { accepted: false, reason: detailOf(rest, space), plans: [] }
    const scope = SUPERVISION_SCOPES.find(candidate => candidate === head)
    const subject = detailOf(rest, space)
    // A scope word without a subject names no work, so it opens nothing.
    if (scope === undefined || subject === '') continue
    plans.push({ scope, subject })
  }
  return plans.length === 0
    ? { accepted: false, reason: 'the supervisor named no work', plans: [] }
    : { accepted: true, plans }
}

/**
 * Read the text after the first word of a decision line.
 * @param rest - text after the marker.
 * @param space - index of the first space, or -1 when the line holds one word.
 * @returns the trailing text without its separator.
 */
function detailOf(rest: string, space: number): string {
  return (space === -1 ? '' : rest.slice(space + 1)).replace(/^[-–—:]\s*/u, '').trim()
}

/** Words that put a request in the release lane, which a person owns. */
const RELEASE_WORDS: readonly RegExp[] = [
  /\bdeploy(?:ment|ed|ing)?\b/iu,
  /\brelease[sd]?\b/iu,
  /\bpublish(?:ed|ing)?\b/iu,
  /\broll\s*back\b/iu,
  /\bproduction\b/iu,
  /上线|发布|发版|回滚|生产环境/u,
]

/**
 * Whether a request asks for a release action. A person owns that lane, so the
 * engine refuses it before any model turn can decide otherwise.
 * @param text - the request as the person wrote it.
 * @returns true when the request asks to deploy, release, publish, or roll back.
 */
export function releaseRequest(text: string): boolean {
  return RELEASE_WORDS.some(pattern => pattern.test(text))
}

/**
 * The text one supervision turn reads. It states the request, the threads it
 * arrived on, and the shape of the decision.
 * @param trigger - request to judge.
 * @param policyVersion - policy the team is running under, so the answer can name it.
 * @returns the prompt one supervision turn receives.
 */
export function supervisorBriefText(trigger: Trigger, policyVersion: string): string {
  return [
    `Request from ${trigger.human ? 'a person' : 'an automation'} on ${threadLabel(trigger.threads)}:`,
    trigger.text,
    '',
    `You supervise a team that changes code under policy ${policyVersion}.`,
    'Decide whether this request is work the team takes, and what pieces it becomes.',
    `Write one line "${SUPERVISION_MARKER} <investigate|change|release> <what the work is>" per piece, `
      + `or "${SUPERVISION_MARKER} reject <why>" to decline.`,
    'Split only where the pieces can be reviewed and merged on their own.',
    'A request to deploy, release, publish, roll back, or otherwise touch production is not yours: '
      + `answer "${SUPERVISION_MARKER} reject" and state that a person owns the release.`,
  ].join('\n')
}

/**
 * Name the threads a request arrived on, for the prompt.
 * @param threads - threads the trigger named.
 * @returns their sources, deduplicated in arrival order.
 */
function threadLabel(threads: readonly ThreadRef[]): string {
  return [...new Set(threads.map(thread => thread.source))].join(', ')
}
