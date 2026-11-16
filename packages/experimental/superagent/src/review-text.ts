/**
 * The contract between the engine and one review turn: the brief a reviewer
 * reads, and the verdict lines it writes. Text rather than a tool, so a review
 * can be read back exactly as the reviewer produced it.
 */
import type { ReviewerBrief } from './executor.ts'
import type { ReviewFinding, ReviewVerdict, Severity } from './types.ts'

/** Verdict line a reviewer ends its turn with. */
export const REVIEW_MARKER = 'REVIEW:'

/** One finding a reviewer reports, on its own line. */
export const FINDING_MARKER = 'FINDING:'

/** Severity words a finding line may carry. */
const SEVERITIES: readonly Severity[] = ['p0', 'p1', 'p2']

/** Where a finding points: a repository-relative file and an optional line. */
interface FindingSite {
  readonly file: string
  readonly line?: number
}

/**
 * Read one finding line.
 * @param rest - text after {@link FINDING_MARKER}.
 * @returns the finding, or nothing when the line names no known severity.
 */
function findingOf(rest: string): ReviewFinding | undefined {
  const parts = rest.trim().split(/\s+/u)
  const severity = SEVERITIES.find(candidate => candidate === parts[0]?.replace(/[:.,]$/u, '').toLowerCase())
  const site = parts[1]
  const summary = parts.slice(2).join(' ')
  if (severity === undefined || site === undefined || summary === '') return undefined
  const at = siteOf(site)
  return {
    summary,
    severity,
    file: at.file,
    ...at.line === undefined ? {} : { line: at.line },
  }
}

/**
 * Read the site a finding points at, splitting a trailing line number off a path.
 * @param site - `path` or `path:line`, where a Windows drive letter is not a line.
 * @returns the file and its line, when the site carried one.
 */
function siteOf(site: string): FindingSite {
  const match = /^(.*?):(\d+)$/u.exec(site)
  /* v8 ignore next -- the regex always captures a file for the patterns a reviewer writes */
  if (match === null || match[1] === undefined) return { file: site }
  return { file: match[1], line: Number(match[2]) }
}

/**
 * Read the verdict a reviewer wrote.
 *
 * The last `REVIEW:` line decides pass or fail; every `FINDING:` line becomes a
 * finding. A turn that names no verdict has no findings and no pass, so the
 * engine treats it as a review that produced nothing — the round budget then
 * decides what happens.
 * @param text - the assistant text of one finished review turn.
 * @param rounds - how many reviews the work has had, counting this one.
 * @returns the verdict the engine records.
 */
export function parseReview(text: string, rounds: number): ReviewVerdict {
  const lines = text.split('\n')
  const findings = lines
    .filter(line => line.trimStart().startsWith(FINDING_MARKER))
    .map(line => findingOf(line.slice(line.indexOf(FINDING_MARKER) + FINDING_MARKER.length)))
    .filter((finding): finding is ReviewFinding => finding !== undefined)
  return { findings, rounds }
}

/**
 * The text one review turn reads. It names the work, asks for the standards the
 * repository states, and fixes the shape of the verdict.
 * @param brief - the work under review and which round this is.
 * @returns the prompt one review turn receives.
 */
export function reviewerBriefText(brief: ReviewerBrief): string {
  return [
    `Review the result for: ${brief.subject}`,
    `This is review round ${String(brief.round + 1)}.`,
    'Judge the change against the standards the target repository states, and against the request itself.',
    `Report every problem as one line "${FINDING_MARKER} <p0|p1|p2> <path>:<line> <summary>".`,
    `End with one line "${REVIEW_MARKER} pass" when nothing blocks, or "${REVIEW_MARKER} fail" otherwise. `
      + 'Use p0 only for a problem that must not reach a person as finished work.',
  ].join('\n')
}
