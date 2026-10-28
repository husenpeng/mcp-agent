/**
 * Rolling diagnostic log for the Electron shell.
 *
 * One append-only file per day under the platform logs directory records what
 * the shell, the Host child, and the renderer reported: lifecycle milestones,
 * Host output, renderer console lines with their bundle location, and every
 * uncaught failure. Credential-shaped substrings are redacted before anything
 * is written, so the file is safe to attach to a bug report.
 */

import { appendFileSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { inspect } from 'node:util'

/** Channels recorded in the file. */
export type DiagnosticsLevel = 'info' | 'warn' | 'error' | 'renderer' | 'host'

/** Writing surface shared by the shell's call sites. */
export interface DiagnosticsLog {
  /** Absolute path of the file currently receiving appends. */
  readonly path: string
  /**
   * Append one line.
   * @param level - channel the line belongs to.
   * @param message - human-readable summary; credentials are redacted.
   * @param detail - optional value inspected onto the same line.
   */
  write(level: DiagnosticsLevel, message: string, detail?: unknown): void
}

/** Files retained beside the newest, by modification time. */
const RETAINED_FILES = 5

/** Per-file ceiling before the day rolls into a numbered successor. */
const MAX_FILE_BYTES = 8 * 1024 * 1024

/** Credential shapes redacted from every written value. */
const SECRET_PATTERNS: readonly [RegExp, string][] = [
  [/Bearer\s+[A-Za-z0-9._~+/-]+=*/gu, 'Bearer [redacted]'],
  [/\b(?:sk|pk|ghp|github_pat|xox[baprs])[-_][A-Za-z0-9_-]{12,}/gu, '[redacted-token]'],
  [/\b(DEEPSEEK_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|TOMATO_OTLP_TOKEN)\s*[=:]\s*\S+/gu, '$1=[redacted]'],
  [/([?&](?:token|key|secret|password|code)=)[^&\s]+/giu, '$1[redacted]'],
]

/**
 * Remove credential-shaped substrings from one string.
 * @param value - text about to be written.
 * @returns the same text with recognized secrets replaced.
 */
export function redact(value: string): string {
  return SECRET_PATTERNS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value)
}

/**
 * Drop files beyond the retained window, keeping the newest by modification time.
 * @param directory - log directory.
 * @param retained - files to keep.
 */
export function pruneDiagnosticsLogs(directory: string, retained = RETAINED_FILES): void {
  let entries: string[]
  try {
    entries = readdirSync(directory).filter(name => /^tomato-.*\.log$/u.test(name))
  } catch {
    return
  }
  if (entries.length <= retained) return
  const sorted = entries
    .map(name => ({ name, time: statSync(join(directory, name)).mtimeMs }))
    .sort((left, right) => right.time - left.time)
  for (const entry of sorted.slice(retained)) {
    try { unlinkSync(join(directory, entry.name)) } catch { /* removed concurrently — nothing left to prune */ }
  }
}

/** One day's file, rolling into numbered successors past the ceiling. */
class DailyFile {
  private bytes: number | undefined
  private suffix = 0

  /** @param directory - log directory; created when absent. */
  constructor(private readonly directory: string) {
    mkdirSync(directory, { recursive: true, mode: 0o700 })
  }

  get path(): string {
    return join(this.directory, this.fileName())
  }

  /** @param line - complete line without its trailing newline. */
  append(line: string): void {
    const bytes = Buffer.byteLength(line) + 1
    if (this.bytes !== undefined && this.bytes > 0 && this.bytes + bytes > MAX_FILE_BYTES) {
      this.suffix += 1
      this.bytes = undefined
    }
    const target = this.path
    if (this.bytes === undefined) {
      try { this.bytes = statSync(target).size } catch { this.bytes = 0 }
    }
    appendFileSync(target, `${line}\n`, { mode: 0o600 })
    this.bytes += bytes
  }

  private fileName(): string {
    const day = new Date().toISOString().slice(0, 10)
    return this.suffix === 0 ? `tomato-${day}.log` : `tomato-${day}.${String(this.suffix)}.log`
  }
}

/**
 * Open the diagnostic log.
 * @param directory - platform logs directory.
 * @returns the writing surface used by the shell.
 */
export function openDiagnosticsLog(directory: string): DiagnosticsLog {
  const file = new DailyFile(directory)
  pruneDiagnosticsLogs(directory)
  return {
    get path() { return file.path },
    write(level, message, detail) {
      const detailText = detail === undefined
        ? ''
        : ` ${detail instanceof Error ? detail.stack ?? detail.message : inspect(detail, { depth: 4, breakLength: 160 })}`
      file.append(redact(`${new Date().toISOString()} [${level}] ${message}${detailText}`))
    },
  }
}
