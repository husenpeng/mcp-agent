// @vitest-environment jsdom
/** The candidates row turns its controls into host commands, without a model turn. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryView } from '../src/client/MemoryView.tsx'
import { en } from '../src/client/memory-locales.ts'
import type { MemoryFlowItem } from '../src/client/memory-flow.ts'

afterEach(cleanup)

/** One row with a candidate that can be confirmed or ignored. */
function candidatesRow(): MemoryFlowItem {
  return {
    seq: 12,
    time: 12_000,
    kind: 'capture',
    record: 'candidates',
    title: 'candidates',
    detail: '{"candidates":[]}',
    lines: ['user / email-tone: Reply briefly (x3) → memory-2'],
    actions: [
      { id: 'memory-2', confirm: '/memory confirm memory-2', dismiss: '/memory dismiss memory-2' },
    ],
  }
}

/** Injected flow serving one fixed snapshot. */
function flowOf(rows: readonly MemoryFlowItem[]) {
  return { getSnapshot: () => rows, subscribe: () => () => {} }
}

/** Locale translator backed by the English dictionary. */
function translator(key: keyof typeof en): string {
  return en[key]
}

describe('memory view candidates', () => {
  it('sends the confirm command when its control is used', async () => {
    const run = vi.fn(async () => {})
    render(<MemoryView flow={flowOf([candidatesRow()])} run={run} t={translator as never} />)
    fireEvent.click(screen.getByRole('button', { name: en['action.confirm'] }))
    expect(run).toHaveBeenCalledWith('/memory confirm memory-2')
  })

  it('sends the dismiss command when its control is used', async () => {
    const run = vi.fn(async () => {})
    render(<MemoryView flow={flowOf([candidatesRow()])} run={run} t={translator as never} />)
    fireEvent.click(screen.getByRole('button', { name: en['action.dismiss'] }))
    expect(run).toHaveBeenCalledWith('/memory dismiss memory-2')
  })

  it('shows the paused notice when a capture reported a sign-out', () => {
    const paused: MemoryFlowItem = {
      ...candidatesRow(),
      detail: '{"outcome":{"reason":"sign-in-required"}}',
    }
    render(<MemoryView flow={flowOf([paused])} run={vi.fn(async () => {})} t={translator as never} />)
    expect(screen.getByRole('status').textContent).toBe(en.pausedSignIn)
  })

  it('renders no controls for a row that can act on nothing', () => {
    const plain: MemoryFlowItem = { ...candidatesRow(), actions: [] }
    render(<MemoryView flow={flowOf([plain])} run={vi.fn(async () => {})} t={translator as never} />)
    expect(screen.queryByRole('button', { name: en['action.confirm'] })).toBeNull()
  })
})
