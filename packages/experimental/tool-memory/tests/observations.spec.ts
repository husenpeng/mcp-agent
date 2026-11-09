/** Deterministic observation cards for finished tool calls, without a model or Context. */
import { describe, expect, it } from 'vitest'
import { buildObservationCard } from '@tomato/experimental-tool-memory'

describe('buildObservationCard', () => {
  it('names a shell command and records its exit code', () => {
    const card = buildObservationCard({
      tool: 'bash', arguments: { command: 'pnpm test --watch' }, failed: false, output: 'ok', value: { exitCode: 0 },
    })
    expect(card).toMatchObject({
      tool: 'bash', type: 'command', title: 'bash: pnpm test --watch', narrative: 'The bash call completed.',
      facts: ['exit 0'], concepts: ['bash', 'pnpm'], filesRead: [], filesModified: [],
    })
    expect(card.fingerprint).toHaveLength(64)
  })

  it('marks a failure, trims its reason, and omits an empty exit code', () => {
    const failed = buildObservationCard({ tool: 'bash', arguments: { command: 'pnpm build' }, failed: true, output: 'build failed' })
    expect(failed).toMatchObject({ type: 'failure', title: 'bash failed: build failed', facts: ['failed: build failed'] })
    const silent = buildObservationCard({ tool: 'bash', arguments: { command: 'pnpm build' }, failed: true, output: '' })
    expect(silent.facts).toEqual(['failed without output'])
    const nullExit = buildObservationCard({ tool: 'bash', arguments: { command: 'pnpm test' }, failed: false, output: '', value: { exitCode: null } })
    expect(nullExit.facts).toEqual([])
  })

  it('shortens long commands, blank commands, and long titles', () => {
    const long = buildObservationCard({ tool: 'bash', arguments: { command: `pnpm ${'x'.repeat(200)}` }, failed: false, output: '' })
    expect(long.title.length).toBeLessThanOrEqual(80)
    expect(long.title.endsWith('…')).toBe(true)
    const blank = buildObservationCard({ tool: 'bash', arguments: { command: '   ' }, failed: false, output: '' })
    expect(blank.title).toBe('bash:')
    expect(blank.concepts).toEqual(['bash'])
  })

  it('records a read through either path argument form', () => {
    const generic = buildObservationCard({ tool: 'read', arguments: { path: '/repo/src/a.ts' }, failed: false, output: '' })
    expect(generic).toMatchObject({
      type: 'file-read', title: 'read: done', filesRead: ['/repo/src/a.ts'], filesModified: [], concepts: ['read', 'a'],
    })
    const explicit = buildObservationCard({ tool: 'read', arguments: { file_path: '/repo/b.md' }, failed: false, output: '' })
    expect(explicit.filesRead).toEqual(['/repo/b.md'])
  })

  it('records a write or edit as a file change and tolerates a path without a name', () => {
    const write = buildObservationCard({ tool: 'write', arguments: { file_path: '/repo/c.md' }, failed: false, output: '' })
    expect(write).toMatchObject({ type: 'file-change', title: 'write: /repo/c.md', filesModified: ['/repo/c.md'], filesRead: [] })
    const edit = buildObservationCard({ tool: 'edit', arguments: { file_path: '/repo/noext' }, failed: false, output: '' })
    expect(edit.concepts).toEqual(['edit', 'noext'])
    const trailing = buildObservationCard({ tool: 'edit', arguments: { path: '/repo/' }, failed: false, output: '' })
    expect(trailing.concepts).toEqual(['edit'])
  })

  it('falls back to a generic tool call and de-duplicates concepts', () => {
    const card = buildObservationCard({ tool: 'grep', arguments: null, failed: false, output: '' })
    expect(card).toMatchObject({ type: 'tool-call', title: 'grep: done', concepts: ['grep'] })
    const same = buildObservationCard({ tool: 'grep', arguments: { command: 'grep -r x' }, failed: false, output: '' })
    expect(same.concepts).toEqual(['grep'])
    const bareBash = buildObservationCard({ tool: 'bash', arguments: null, failed: false, output: '' })
    expect(bareBash).toMatchObject({ type: 'command', title: 'bash: done' })
  })

  it('changes the fingerprint with the outcome and keeps it for an identical retry', () => {
    const call = { tool: 'bash', arguments: { command: 'pnpm test' }, failed: false, output: 'ok', value: { exitCode: 0 } }
    expect(buildObservationCard(call).fingerprint).toBe(buildObservationCard(call).fingerprint)
    expect(buildObservationCard({ ...call, failed: true, output: 'boom' }).fingerprint).not.toBe(buildObservationCard(call).fingerprint)
  })
})
