/**
 * Deterministic project-history cards for finished tool calls. A card is
 * derived from the call's arguments and outcome, so recording it costs no
 * model request, and a retried call produces the same fingerprint.
 * @module @tomato/experimental-tool-memory/observations
 */

import { createHash } from 'node:crypto'
import { z } from 'zod'

/** One finished tool call as the card builder sees it. */
export interface ObservationCall {
  /** Tool name. */
  readonly tool: string
  /** Parsed arguments; tools own their schema, so this value is validated here. */
  readonly arguments: unknown
  /** Whether the call failed. */
  readonly failed: boolean
  /** Text content of the result. */
  readonly output: string
  /** Canonical result value of a successful call, when it has one. */
  readonly value?: unknown
}

/** One deterministic history card, in the shape an observation episode stores. */
export interface ObservationCard {
  /** Tool whose call produced the card. */
  readonly tool: string
  /** Lower-kebab-case card type. */
  readonly type: string
  /** One-line title. */
  readonly title: string
  /** One-line account of the call. */
  readonly narrative: string
  /** Durable statements the call established. */
  readonly facts: readonly string[]
  /** Searchable keywords. */
  readonly concepts: readonly string[]
  /** Files the call read. */
  readonly filesRead: readonly string[]
  /** Files the call changed. */
  readonly filesModified: readonly string[]
  /** Stable content fingerprint of the call and its outcome. */
  readonly fingerprint: string
}

const commandArguments = z.object({ command: z.string() })
const filePathArguments = z.object({ file_path: z.string() })
const pathArguments = z.object({ path: z.string() })
const exitValue = z.object({ exitCode: z.number().int().nullable() })

/** Shorten one line to a character budget, marking the cut. */
function firstLine(text: string, limit: number): string {
  /* v8 ignore next -- split always yields one element */
  const line = text.trim().split('\n')[0]?.trim() ?? ''
  return line.length <= limit ? line : `${line.slice(0, Math.max(0, limit - 1))}…`
}

/** The shell command of a bash call. */
function commandOf(args: unknown): string | undefined {
  const parsed = commandArguments.safeParse(args)
  return parsed.success ? parsed.data.command.trim() : undefined
}

/**
 * The command a shell call actually runs: a leading `cd <dir> &&` or `cd <dir>;`
 * only positions the call and names no work, so a title built from it describes
 * every call in the same project with the same words.
 * @param command - complete shell command.
 * @returns the command after its leading directory changes.
 */
function effectiveCommand(command: string): string {
  let rest = command.trim()
  for (;;) {
    const next = rest.replace(/^cd\s+[^&;]+?\s*(?:&&|;)\s*/u, '')
    if (next === rest) return rest === '' ? command.trim() : rest
    rest = next
  }
}

/** The file path of a read, write, or edit call. */
function pathOf(args: unknown): string | undefined {
  const explicit = filePathArguments.safeParse(args)
  if (explicit.success) return explicit.data.file_path.trim()
  const generic = pathArguments.safeParse(args)
  return generic.success ? generic.data.path.trim() : undefined
}

/** Exit code of a shell call. */
function exitCodeOf(value: unknown): number | undefined {
  const parsed = exitValue.safeParse(value)
  return parsed.success && parsed.data.exitCode !== null ? parsed.data.exitCode : undefined
}

/** Path-like words of one command, shortened to their base names. */
function commandConcepts(command: string): string[] {
  const words = command.split(/\s+/u)
  const concepts: string[] = []
  for (const word of words) {
    const cleaned = word.replace(/^["'(]+|["'),:]+$/gu, '')
    if (!cleaned.includes('/') && !/\.[a-z0-9]{1,6}$/iu.test(cleaned)) continue
    const name = cleaned.split('/').filter(part => part !== '').pop()
    if (name === undefined) continue
    const stem = name.replace(/\.[^.]+$/u, '').toLowerCase()
    if (stem !== '' && stem !== '.' && stem !== '..') concepts.push(stem)
  }
  return concepts
}

/** Searchable concepts of one call: the tool, the command's real words, and the file name. */
function conceptsOf(tool: string, command: string | undefined, path: string | undefined): string[] {
  const concepts = [tool]
  if (command !== undefined) {
    const [word] = effectiveCommand(command).split(/\s+/u)
    if (word !== undefined && word !== '') concepts.push(word)
    concepts.push(...commandConcepts(command))
  }
  if (path !== undefined) {
    const name = path.split('/').pop()
    if (name !== undefined && name !== '') concepts.push(name.replace(/\.[^.]+$/u, ''))
  }
  return [...new Set(concepts.map(concept => concept.toLowerCase()).filter(concept => concept !== ''))].slice(0, 6)
}

/**
 * Build the deterministic card of one finished call.
 * @param call - tool name, parsed arguments, outcome, and text output.
 * @returns the card to store as an observation episode.
 */
export function buildObservationCard(call: ObservationCall): ObservationCard {
  const failed = call.failed
  const command = commandOf(call.arguments)
  const effective = command === undefined ? undefined : effectiveCommand(command)
  const path = pathOf(call.arguments)
  const exitCode = exitCodeOf(call.value)
  const outputLine = firstLine(call.output, 200)
  const type = failed ? 'failure'
    : call.tool === 'bash' ? 'command'
      : call.tool === 'read' ? 'file-read'
        : call.tool === 'write' || call.tool === 'edit' ? 'file-change'
          : 'tool-call'
  const title = failed
    ? `${call.tool} failed: ${firstLine(call.output, Math.max(1, 80 - call.tool.length - 9))}`.trim()
    : effective !== undefined && call.tool === 'bash' ? `bash: ${firstLine(effective, 74)}`
      : path !== undefined && (call.tool === 'write' || call.tool === 'edit') ? `${call.tool}: ${firstLine(path, 76)}`
        : `${call.tool}: done`
  const titleText = title.trimEnd()
  const facts: string[] = []
  if (failed) facts.push(outputLine === '' ? 'failed without output' : `failed: ${outputLine}`)
  else if (exitCode !== undefined) facts.push(`exit ${exitCode}`)
  const narrative = failed
    ? `The ${call.tool} call failed: ${outputLine === '' ? 'no output' : outputLine}`
    : effective !== undefined && call.tool === 'bash'
      ? `Ran \`${firstLine(effective, 200)}\`${exitCode === undefined ? '' : `, exit ${exitCode}`}.`
      : path !== undefined && (call.tool === 'write' || call.tool === 'edit')
        ? `Changed ${path}.`
        : `The ${call.tool} call completed.`
  const signature = createHash('sha256')
    .update(`${call.tool}\u0000${JSON.stringify(call.arguments ?? null)}\u0000${failed ? 'failed' : 'ok'}\u0000${exitCode ?? ''}\u0000${failed ? outputLine : ''}`)
    .digest('hex')
  return {
    tool: call.tool,
    type,
    title: titleText,
    narrative,
    facts,
    concepts: conceptsOf(call.tool, effective, path),
    filesRead: call.tool === 'read' && path !== undefined ? [path] : [],
    filesModified: (call.tool === 'write' || call.tool === 'edit') && path !== undefined ? [path] : [],
    fingerprint: signature,
  }
}
