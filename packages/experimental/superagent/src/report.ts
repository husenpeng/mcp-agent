/**
 * The contract between the engine and one executor turn: the brief the worker
 * reads, and the report line it ends with. Both are plain text so a run can be
 * inspected after the fact, and so a provider does not need a tool to report.
 */
import type { AssignmentReport, ReportState } from './types.ts'
import type { WorkerBrief } from './executor.ts'

/** Marker a worker ends its turn with, so its outcome is read rather than guessed. */
export const REPORT_MARKER = 'REPORT:'

/** Every state a worker may report. */
const REPORT_STATES: readonly ReportState[] = ['progress', 'waiting', 'ready', 'blocked', 'failed', 'dropped']

/** What one finished turn said. */
export interface ParsedReport {
  /** The report the marker carried, or a plain `waiting` when the turn said nothing. */
  readonly report: AssignmentReport
  /** The marker line, removed from {@link body}. */
  readonly body: string
}

/**
 * Read the report a worker wrote at the end of its turn.
 *
 * The last line beginning with {@link REPORT_MARKER} decides; anything after it
 * on the same line is the summary. A turn with no marker counts as `waiting`:
 * the worker yielded without claiming a result, so the ticket may be woken by a
 * later message but must not be offered to a person.
 * @param text - the assistant text of one finished turn.
 * @returns the report and the text without its marker line.
 */
export function parseReport(text: string): ParsedReport {
  const lines = text.split('\n')
  const index = lines.findLastIndex(line => line.trimStart().startsWith(REPORT_MARKER))
  if (index === -1) return { report: { state: 'waiting' }, body: text.trim() }
  const marker = lines[index] as string
  const rest = marker.slice(marker.indexOf(REPORT_MARKER) + REPORT_MARKER.length).trim()
  // Split on the first space only, so a summary keeps its own spacing.
  const space = rest.search(/\s/u)
  const head = (space === -1 ? rest : rest.slice(0, space)).replace(/[:.,]$/u, '')
  const state = REPORT_STATES.find(candidate => candidate === head)
  const detail = (space === -1 ? '' : rest.slice(space + 1)).replace(/^[-–—:]\s*/u, '').trim()
  return {
    report: {
      state: state ?? 'waiting',
      ...detail === '' ? {} : { summary: detail },
    },
    body: lines.filter((_line, position) => position !== index).join('\n').trim(),
  }
}

/**
 * The text one worker reads to start its turn. It states the work, why it may
 * be done, and how to end the turn, so a run needs no other instruction to
 * report honestly.
 * @param brief - work, subject, and mandate.
 * @param directory - checkout the run works in, when the deployment handed one out.
 * @returns the prompt one executor turn receives.
 */
export function workerBriefText(brief: WorkerBrief, directory?: string): string {
  return [
    `Work: ${brief.subject}`,
    ...brief.context === undefined || brief.context.length === 0
      ? []
      : [
        'Messages from the person after the work was accepted, oldest first; treat the latest as the current instruction:',
        ...brief.context.map(message => `- ${message}`),
      ],
    ...directory === undefined
      ? []
      : [
        `Work in ${directory}: read the files you need, and change them with your tools.`,
        'Do the work rather than describing it. Never push, never touch a remote, and never create commits.',
        `Read and change only files inside ${directory}. Never read or write outside it, `
            + 'and say so in your report if the work would require that.',
      ],
    `Authorized by: policy ${brief.mandate.policyVersion}, scope ${brief.mandate.scope}, `
      + `strength ${brief.mandate.strength}.`,
    `Finish with one line "${REPORT_MARKER} <state>" where state is one of `
      + `${REPORT_STATES.join(', ')}, followed by a short summary. `
      + 'Use `ready` only when a person can review the result as it stands.',
  ].join('\n')
}
