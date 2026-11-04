// @vitest-environment jsdom
/** The schema pages of the Muse bundle's other rows: their controls, their staging, and their writes. */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { allowAllAccess, bindSnapshotSelector } from '@tomato/client-test-runtime'
import type {
  SettingsFieldState, SettingsFormPathOp, SettingsFormScope, SettingsFormScopeSnapshot,
} from '@tomato/client-ui-primitives'
import type { GlobalStandardProps } from '@tomato/client-ui-slots'
import { en } from '../src/client/locales.ts'
import { RowConfigPage, type RowConfigPageProps } from '../src/client/RowConfigPage.tsx'
import { FOCUS_ROW, MEMORY_ROW, ROW_PAGES, RowFormController, TOOL_MEMORY_ROW, type RowPage } from '../src/client/row-form.ts'

afterEach(cleanup)

const t = (key: keyof typeof en) => en[key]

const unused = (): never => { throw new Error('This isolated page does not read that framework hook') }
/** Framework standard props the row page never reads. */
const standard: GlobalStandardProps = {
  usePanelInfo: unused, useSessions: unused, useSessionStatus: unused, useSessionRetainInfo: unused,
  useResource: unused, useWorkspaces: unused,
  ...allowAllAccess,
}

/** One entry's served section, as the shared configuration form reports it. */
function scope(value: Record<string, unknown>, options: { user?: Record<string, unknown>; writable?: boolean } = {}) {
  const listeners = new Set<() => void>()
  let snapshot: SettingsFormScopeSnapshot<Record<string, unknown>> = {
    status: 'ready', value, base: {}, user: options.user ?? {}, writable: options.writable ?? true, revision: 7,
  }
  const mutate = vi.fn<(ops: readonly SettingsFormPathOp[], expectedRevision?: number) => Promise<boolean>>(async () => true)
  const form: SettingsFormScope<Record<string, unknown>> = {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    mutate,
  }
  return {
    form,
    mutate,
    unserve(): void {
      snapshot = { ...snapshot, status: 'unavailable' }
      for (const listener of [...listeners]) listener()
    },
  }
}

function page(row: string): RowPage {
  const found = ROW_PAGES.find(entry => entry.row === row)
  if (found === undefined) throw new Error(`no page for ${row}`)
  return found
}

function renderPage(row: string, value: Record<string, unknown>, options: { user?: Record<string, unknown>; writable?: boolean } = {}) {
  const served = scope(value, options)
  const controller = new RowFormController(served.form, page(row).sections, () => 'page')
  const props = {
    ...standard,
    ...controller.inject(),
    controller,
    view: 'page',
    t,
    useRow: bindSnapshotSelector(controller.inject().hooks.row),
  } as RowConfigPageProps & { controller: RowFormController }
  render(<RowConfigPage {...props} />)
  return { served, controller }
}

describe('row configuration records', () => {
  it('pages the three schema rows in goal order and never the insights row it pages itself', () => {
    expect(ROW_PAGES.map(entry => entry.row)).toEqual([MEMORY_ROW, TOOL_MEMORY_ROW, FOCUS_ROW])
  })

  it('spells every label and hint the English dictionary needs', () => {
    for (const entry of ROW_PAGES) {
      expect(en[entry.title]).toBeDefined()
      for (const section of entry.sections) {
        expect(en[section.heading]).toBeDefined()
        for (const field of section.fields) {
          expect(en[field.label]).toBeDefined()
          if (field.hint !== undefined) expect(en[field.hint]).toBeDefined()
        }
      }
    }
  })
})

describe('RowConfigPage', () => {
  it('renders the memory limits with their resolved values and an override badge', () => {
    const { controller } = renderPage(MEMORY_ROW, { maxRecallResults: 12, maxValueBytes: 2048 }, { user: { maxValueBytes: 2048 } })

    expect(screen.getByRole('heading', { name: en['row.memory.limits'] })).toBeTruthy()
    expect(screen.getByLabelText<HTMLInputElement>(en['row.memory.maxRecallResults']).value).toBe('12')
    expect(screen.getByLabelText<HTMLInputElement>(en['row.memory.maxValueBytes']).value).toBe('2048')
    expect(screen.getAllByText(en['config.overridden'])).toHaveLength(1)
    expect(controller.groups).toBe(page(MEMORY_ROW).sections)
  })

  it('writes only the changed number on save, fenced by the revision it read', async () => {
    const { served } = renderPage(MEMORY_ROW, { maxRecallResults: 12 })
    fireEvent.change(screen.getByLabelText(en['row.memory.maxRecallResults']), { target: { value: '20' } })
    expect(served.mutate).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: en['config.save'] }))
    await vi.waitFor(() => { expect(served.mutate).toHaveBeenCalledTimes(1) })
    expect(served.mutate.mock.calls[0]).toEqual([[{ op: 'set', path: ['maxRecallResults'], value: 20 }], 7])
  })

  it('blocks the save on a draft that is not a number', () => {
    renderPage(MEMORY_ROW, { maxRecallResults: 12 })
    fireEvent.change(screen.getByLabelText(en['row.memory.maxRecallResults']), { target: { value: 'many' } })
    expect(screen.getByText(en['config.invalidNumber'])).toBeTruthy()
    expect(screen.getByRole<HTMLButtonElement>('button', { name: en['config.save'] }).disabled).toBe(true)
  })

  it('stages a switch as its boolean and resets it to the composition layer', async () => {
    const { served } = renderPage(TOOL_MEMORY_ROW, { capture: true }, { user: { capture: true } })
    const toggle = screen.getByRole('switch', { name: en['row.toolMemory.capture'] })
    expect(toggle.getAttribute('aria-checked')).toBe('true')
    expect(toggle.getAttribute('aria-describedby')).toBe('muse-row-config-capture')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-checked')).toBe('false')
    fireEvent.click(screen.getByRole('button', { name: en['config.save'] }))
    await vi.waitFor(() => { expect(served.mutate).toHaveBeenCalledTimes(1) })
    expect(served.mutate.mock.calls[0]?.[0]).toEqual([{ op: 'set', path: ['capture'], value: false }])

    await vi.waitFor(() => { expect(screen.queryByRole('button', { name: en['config.save'] })).not.toBeNull() })
    fireEvent.click(screen.getByRole('button', { name: en['config.reset'] }))
    fireEvent.click(screen.getByRole('button', { name: en['config.save'] }))
    await vi.waitFor(() => { expect(served.mutate).toHaveBeenCalledTimes(2) })
    expect(served.mutate.mock.calls[1]?.[0]).toEqual([{ op: 'unset', path: ['capture'] }])
  })

  it('stages wildcard patterns separated by commas or spaces and clears an empty list', async () => {
    const { served } = renderPage(FOCUS_ROW, { approvalTools: ['send_*'] }, { user: { approvalTools: ['send_*'] } })
    const list = screen.getByLabelText(en['row.focus.approvalTools'])
    expect(screen.getByLabelText<HTMLInputElement>(en['row.focus.approvalTools']).value).toBe('send_*')
    fireEvent.change(list, { target: { value: ' send_* , mcp__example__* ' } })
    fireEvent.click(screen.getByRole('button', { name: en['config.save'] }))
    await vi.waitFor(() => { expect(served.mutate).toHaveBeenCalledTimes(1) })
    expect(served.mutate.mock.calls[0]?.[0]).toEqual([{ op: 'set', path: ['approvalTools'], value: ['send_*', 'mcp__example__*'] }])

    fireEvent.change(list, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: en['config.save'] }))
    await vi.waitFor(() => { expect(served.mutate).toHaveBeenCalledTimes(2) })
    expect(served.mutate.mock.calls[1]?.[0]).toEqual([{ op: 'unset', path: ['approvalTools'] }])
  })

  it('renders every policy switch of the memory tools under its section', () => {
    renderPage(TOOL_MEMORY_ROW, { projectIndex: true, queryExpansion: false })
    expect(screen.getByRole('switch', { name: en['row.toolMemory.projectIndex'] }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('switch', { name: en['row.toolMemory.queryExpansion'] }).getAttribute('aria-checked')).toBe('false')
    expect(screen.getByRole('heading', { name: en['row.toolMemory.snapshot'] })).toBeTruthy()
    expect(screen.getByRole('heading', { name: en['row.toolMemory.expansion'] })).toBeTruthy()
    expect(screen.getByRole('heading', { name: en['row.toolMemory.capture'] })).toBeTruthy()
  })

  it('disables every control on a read-only document', () => {
    renderPage(FOCUS_ROW, {}, { writable: false })
    expect(screen.getByText(en['config.readOnly'])).toBeTruthy()
    expect(screen.getByLabelText<HTMLInputElement>(en['row.focus.maxMessageChars']).disabled).toBe(true)
  })

  it('says so in place of the controls when the Host stops serving the entry', () => {
    const served = scope({})
    const controller = new RowFormController(served.form, page(FOCUS_ROW).sections, () => 'page')
    const props = {
      ...standard,
      ...controller.inject(),
      controller,
      view: 'page',
      t,
      useRow: bindSnapshotSelector(controller.inject().hooks.row),
    } as RowConfigPageProps & { controller: RowFormController }
    served.unserve()
    render(<RowConfigPage {...props} />)
    expect(screen.getByText(en['config.unavailable'])).toBeTruthy()
    expect(screen.queryByLabelText(en['row.focus.maxMessageChars'])).toBeNull()
  })

  it('draws nothing for the summary view and releases its form on disposal', () => {
    const controller = new RowFormController(scope({}).form, page(FOCUS_ROW).sections, () => 'Goal focus')
    const props = {
      ...standard,
      ...controller.inject(),
      controller,
      view: 'summary',
      t,
      useRow: bindSnapshotSelector(controller.inject().hooks.row),
    } as RowConfigPageProps & { controller: RowFormController }
    expect(controller.inject().title()).toBe('Goal focus')
    const { container } = render(<RowConfigPage {...props} />)
    expect(container.innerHTML).toBe('')
    controller.dispose()
    const field: SettingsFieldState | undefined = controller.inject().hooks.row.getSnapshot().fields.maxMessageChars
    expect(field?.text).toBe('')
  })
})
