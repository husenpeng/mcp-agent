// @vitest-environment node
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { openDiagnosticsLog, pruneDiagnosticsLogs, redact } from '../src/diagnostics-log.ts'

const roots: string[] = []
function directory(): string {
  const root = mkdtempSync(join(tmpdir(), 'tomato-log-'))
  roots.push(root)
  return root
}
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe('diagnostics log', () => {
  it('writes one timestamped line per call and appends across reopen', () => {
    const root = directory()
    const first = openDiagnosticsLog(root)
    first.write('info', 'shell started')
    first.write('host', 'stdout: listening', { port: 4010 })
    const second = openDiagnosticsLog(root)
    second.write('renderer', 'bundle.js:12 boom')
    const lines = readFileSync(first.path, 'utf8').trim().split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z \[info\] shell started$/)
    expect(lines[1]).toContain('[host] stdout: listening')
    expect(lines[1]).toContain('port: 4010')
    expect(lines[2]).toContain('[renderer] bundle.js:12 boom')
  })

  it('redacts credential shapes before writing', () => {
    expect(redact('authorization: Bearer abc.def-123')).toBe('authorization: Bearer [redacted]')
    expect(redact('key sk-abcdefghijklmnop')).toBe('key [redacted-token]')
    expect(redact('TOMATO_RELAY_API_KEY=tomato-local-token-x')).toBe('TOMATO_RELAY_API_KEY=[redacted]')
    expect(redact('http://host/cb?code=abc&state=1')).toBe('http://host/cb?code=[redacted]&state=1')
    expect(redact('ordinary text')).toBe('ordinary text')

    const root = directory()
    const log = openDiagnosticsLog(root)
    log.write('error', 'fatal', new Error('Bearer s3cr3t-token-value'))
    const written = readFileSync(log.path, 'utf8')
    expect(written).not.toContain('s3cr3t-token-value')
    expect(written).toContain('Bearer [redacted]')
  })

  it('prunes older files and keeps the newest by modification time', () => {
    const root = directory()
    for (let index = 0; index < 7; index += 1) {
      const path = join(root, `tomato-2026-10-0${String(index + 1)}.log`)
      writeFileSync(path, 'x')
      // Distinct mtimes so the ordering is deterministic.
      const time = new Date(Date.UTC(2026, 9, index + 1))
      utimesSync(path, time, time)
    }
    pruneDiagnosticsLogs(root, 3)
    const kept = readdirSync(root).sort()
    expect(kept).toEqual(['tomato-2026-10-05.log', 'tomato-2026-10-06.log', 'tomato-2026-10-07.log'])
    expect(statSync(join(root, kept[0]!)).isFile()).toBe(true)
  })

  it('rolls into a numbered successor instead of growing past the ceiling', () => {
    const root = directory()
    const log = openDiagnosticsLog(root)
    // The ceiling is 8 MB; a single oversized line forces the roll.
    log.write('info', 'x'.repeat(9 * 1024 * 1024))
    log.write('info', 'after roll')
    const files = readdirSync(root).sort()
    expect(files).toHaveLength(2)
    // The oversized line keeps the day file; its successor takes the new line.
    expect(files.some(name => /^tomato-\d{4}-\d{2}-\d{2}\.1\.log$/u.test(name))).toBe(true)
    expect(readFileSync(log.path, 'utf8')).toContain('after roll')
  })
})
