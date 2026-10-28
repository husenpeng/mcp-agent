// @vitest-environment jsdom
/** Skills tab presentation: card list, scroll-lazy batches, detail, and the personal-skill editor. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { SkillEntry } from '@tomato/api-remotes/client'
import { zh } from '../src/client/locales.ts'
import { SkillsTitle } from '../src/client/SkillsBody.tsx'
import { mountBody } from './mount.client.tsx'
import { CATALOG, failure, scriptedRemote } from './scripted-remote.client.ts'

/** IntersectionObserver stand-in with a manual trigger, jsdom having none. */
class IntersectionObserverStub {
  static instances: IntersectionObserverStub[] = []
  readonly observed = new Set<Element>()
  disconnected = false

  constructor(private readonly callback: IntersectionObserverCallback) {
    IntersectionObserverStub.instances.push(this)
  }

  observe(element: Element): void { this.observed.add(element) }
  unobserve(element: Element): void { this.observed.delete(element) }
  disconnect(): void { this.disconnected = true; this.observed.clear() }
  takeRecords(): IntersectionObserverEntry[] { return [] }

  intersect(isIntersecting = true): void {
    this.callback(
      [...this.observed].map(target => ({ target, isIntersecting } as IntersectionObserverEntry)),
      this as unknown as IntersectionObserver,
    )
  }
}

beforeEach(() => {
  IntersectionObserverStub.instances = []
  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

/** Cards currently mounted, in document order. */
function names(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-skill-name]')].map(card => card.getAttribute('data-skill-name')!)
}

/** One generated catalog entry with a distinct name. */
function entry(index: number): SkillEntry {
  return {
    name: `skill-${String(index).padStart(2, '0')}`,
    description: `Flow ${index}.`,
    source: 'project-agents',
    path: `/work/.agents/skills/skill-${index}/SKILL.md`,
    modelInvocable: true,
    userInvocable: true,
    editable: false,
  }
}

describe('SkillsBody', () => {
  it('shows a skeleton, then every card with its source and model-only marker', async () => {
    const mounted = mountBody()
    expect(mounted.view.container.querySelector('[data-skills-state="loading"]')).not.toBeNull()

    await waitFor(() => { expect(names(mounted.view.container)).toEqual(['alpha', 'beta', 'gamma']) })
    expect(mounted.remote.list).toHaveBeenCalledWith(
      { sessionId: 's-test', includeModelOnly: true, brief: true },
      expect.any(AbortSignal),
    )
    expect(mounted.view.getByText(zh['list.count'].replace('{count}', '3'))).toBeTruthy()
    expect(mounted.view.getAllByText(zh['source.personal'])).toHaveLength(1)
    expect(mounted.view.getAllByText(zh['source.project'])).toHaveLength(1)
    expect(mounted.view.getByText(zh['source.bundled'])).toBeTruthy()
    expect(mounted.view.getByText(zh['invocation.modelOnly'])).toBeTruthy()
    expect(mounted.view.queryByText('Alpha flow.')).toBeNull()
    expect(mounted.view.getByText(zh['detail.placeholder'])).toBeTruthy()
  })

  it('reveals cards in batches when the sentinel enters the scroller', async () => {
    const skills = [...CATALOG, ...Array.from({ length: 27 }, (_, index) => entry(index))]
    const mounted = mountBody(scriptedRemote(skills))
    await waitFor(() => { expect(names(mounted.view.container)).toHaveLength(24) })
    const sentinel = mounted.view.container.querySelector('[data-skills-more]')
    expect(sentinel).not.toBeNull()
    const observer = IntersectionObserverStub.instances.at(-1)!
    expect(observer.observed.has(sentinel!)).toBe(true)

    act(() => { observer.intersect(false) })
    expect(names(mounted.view.container)).toHaveLength(24)

    act(() => { observer.intersect() })

    await waitFor(() => { expect(names(mounted.view.container)).toHaveLength(30) })
    expect(mounted.view.container.querySelector('[data-skills-more]')).toBeNull()
    expect(observer.disconnected).toBe(true)
  })

  it('loads a selected skill beside the list and closes it', async () => {
    const mounted = mountBody()
    await waitFor(() => { expect(names(mounted.view.container)).toHaveLength(3) })

    fireEvent.click(mounted.view.getByRole('button', { name: 'alpha' }))

    await waitFor(() => { expect(mounted.view.container.querySelector('[data-skill-detail="ready"]')).not.toBeNull() })
    expect(mounted.remote.get).toHaveBeenCalledWith({ sessionId: 's-test', name: 'alpha' }, expect.any(AbortSignal))
    expect(mounted.view.getByRole('button', { name: zh['detail.edit'] })).toBeTruthy()
    expect(mounted.view.getByText('/home/u/.agents/skills/alpha/SKILL.md')).toBeTruthy()
    expect(names(mounted.view.container)).toEqual(['alpha', 'beta', 'gamma'])
    expect(mounted.view.container.querySelector('[data-skill-name="alpha"]')?.getAttribute('data-skill-selected')).toBe('')

    fireEvent.click(mounted.view.getByRole('button', { name: zh['detail.close'] }))
    await waitFor(() => { expect(mounted.view.getByText(zh['detail.placeholder'])).toBeTruthy() })
    expect(names(mounted.view.container)).toEqual(['alpha', 'beta', 'gamma'])
  })

  it('hides editing for a skill outside a personal directory', async () => {
    const mounted = mountBody()
    await waitFor(() => { expect(names(mounted.view.container)).toHaveLength(3) })

    fireEvent.click(mounted.view.getByRole('button', { name: 'beta' }))

    await waitFor(() => { expect(mounted.view.container.querySelector('[data-skill-detail="ready"]')).not.toBeNull() })
    expect(mounted.view.queryByRole('button', { name: zh['detail.edit'] })).toBeNull()
    expect(mounted.view.getByText(zh['detail.readOnly'])).toBeTruthy()
    expect(mounted.view.getByText('Before shipping.')).toBeTruthy()
  })

  it('saves an edited personal skill and publishes the readback', async () => {
    const mounted = mountBody()
    await waitFor(() => { expect(names(mounted.view.container)).toHaveLength(3) })
    fireEvent.click(mounted.view.getByRole('button', { name: 'alpha' }))
    await waitFor(() => { expect(mounted.view.container.querySelector('[data-skill-detail="ready"]')).not.toBeNull() })

    fireEvent.click(mounted.view.getByRole('button', { name: zh['detail.edit'] }))
    const description = mounted.view.getByLabelText(zh['detail.description'])
    fireEvent.change(description, { target: { value: 'Updated description' } })
    fireEvent.change(mounted.view.getByLabelText(zh['detail.whenToUse']), { target: { value: 'When edited' } })
    fireEvent.change(mounted.view.getByLabelText(zh['detail.body']), { target: { value: '# alpha\n\nEdited body.' } })
    fireEvent.click(mounted.view.getByRole('button', { name: zh['editor.save'] }))

    await waitFor(() => {
      expect(mounted.remote.save).toHaveBeenCalledWith({
        sessionId: 's-test',
        name: 'alpha',
        description: 'Updated description',
        whenToUse: 'When edited',
        content: '# alpha\n\nEdited body.',
      }, expect.any(AbortSignal))
    })
    await waitFor(() => { expect(mounted.view.queryByRole('button', { name: zh['editor.save'] })).toBeNull() })
    expect(mounted.view.getByText('Updated description')).toBeTruthy()
  })

  it('keeps the draft and reports a failed save', async () => {
    const mounted = mountBody()
    await waitFor(() => { expect(names(mounted.view.container)).toHaveLength(3) })
    mounted.remote.save.mockResolvedValueOnce({ ok: false, error: failure('skill/invalid', 'description rejected') })
    fireEvent.click(mounted.view.getByRole('button', { name: 'alpha' }))
    await waitFor(() => { expect(mounted.view.container.querySelector('[data-skill-detail="ready"]')).not.toBeNull() })

    fireEvent.click(mounted.view.getByRole('button', { name: zh['detail.edit'] }))
    fireEvent.change(mounted.view.getByLabelText(zh['detail.description']), { target: { value: 'Draft' } })
    fireEvent.click(mounted.view.getByRole('button', { name: zh['editor.save'] }))

    await waitFor(() => { expect(mounted.view.getByText(/description rejected/u)).toBeTruthy() })
    expect((mounted.view.getByLabelText(zh['detail.description']) as HTMLInputElement).value).toBe('Draft')
    fireEvent.click(mounted.view.getByRole('button', { name: zh['editor.cancel'] }))
    expect(mounted.view.queryByRole('button', { name: zh['editor.save'] })).toBeNull()
  })

  it('requires a non-empty description before saving', async () => {
    const mounted = mountBody()
    await waitFor(() => { expect(names(mounted.view.container)).toHaveLength(3) })
    fireEvent.click(mounted.view.getByRole('button', { name: 'alpha' }))
    await waitFor(() => { expect(mounted.view.container.querySelector('[data-skill-detail="ready"]')).not.toBeNull() })

    fireEvent.click(mounted.view.getByRole('button', { name: zh['detail.edit'] }))
    fireEvent.change(mounted.view.getByLabelText(zh['detail.description']), { target: { value: '   ' } })

    expect(mounted.view.getByText(zh['editor.descriptionRequired'])).toBeTruthy()
    expect((mounted.view.getByRole('button', { name: zh['editor.save'] }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.submit(mounted.view.container.querySelector('form')!)
    expect(mounted.remote.save).not.toHaveBeenCalled()
  })

  it('reports a failed catalog read and retries it', async () => {
    const remote = scriptedRemote()
    remote.list.mockResolvedValueOnce({ ok: false, error: failure('gateway/internal', 'catalog offline') })
    const mounted = mountBody(remote)

    await waitFor(() => { expect(mounted.view.getByText(/catalog offline/u)).toBeTruthy() })
    fireEvent.click(mounted.view.getByRole('button', { name: zh['list.retry'] }))

    await waitFor(() => { expect(names(mounted.view.container)).toHaveLength(3) })
  })

  it('says so when the catalog is empty', async () => {
    const mounted = mountBody(scriptedRemote([]))
    await waitFor(() => { expect(mounted.view.getByText(zh['list.empty'])).toBeTruthy() })
  })

  it('renders the chip title with the skill glyph', () => {
    const Title = SkillsTitle as unknown as (props: {
      useTabInfo: () => { tab: { title: string } }
    }) => ReactNode
    const view = render(<>{Title({ useTabInfo: () => ({ tab: { title: 'Skills' } }) })}</>)
    expect(view.getByText('Skills')).toBeTruthy()
  })

  it('reloads from the header control and from the bound refresh command', async () => {
    const mounted = mountBody()
    await waitFor(() => { expect(names(mounted.view.container)).toHaveLength(3) })

    fireEvent.click(mounted.view.getByRole('button', { name: zh['list.refresh'] }))
    await waitFor(() => { expect(mounted.remote.list).toHaveBeenCalledTimes(2) })

    const commands = mounted.tabActions.bindCommands.mock.calls[0]?.[0]
    commands?.refresh?.()
    await waitFor(() => { expect(mounted.remote.list).toHaveBeenCalledTimes(3) })
  })

  it('shows a failed detail with a retry that reads again', async () => {
    const mounted = mountBody()
    await waitFor(() => { expect(names(mounted.view.container)).toHaveLength(3) })
    mounted.remote.get.mockResolvedValueOnce({ ok: false, error: failure('skill/not-found', 'gone') })

    fireEvent.click(mounted.view.getByRole('button', { name: 'alpha' }))
    await waitFor(() => { expect(mounted.view.container.querySelector('[data-skill-detail="failed"]')).not.toBeNull() })
    expect(mounted.view.getByText(/gone/u)).toBeTruthy()

    fireEvent.click(mounted.view.getByRole('button', { name: zh['list.retry'] }))
    await waitFor(() => { expect(mounted.view.container.querySelector('[data-skill-detail="ready"]')).not.toBeNull() })
    expect(mounted.remote.get).toHaveBeenCalledTimes(2)
  })

  it('marks a model-only skill without a path and without editing', async () => {
    const mounted = mountBody()
    await waitFor(() => { expect(names(mounted.view.container)).toHaveLength(3) })

    fireEvent.click(mounted.view.getByRole('button', { name: 'gamma' }))
    await waitFor(() => { expect(mounted.view.container.querySelector('[data-skill-detail="ready"]')).not.toBeNull() })
    const detail = within(mounted.view.container.querySelector<HTMLElement>('[data-skills-detail]')!)
    expect(detail.getByText(zh['invocation.modelOnly'])).toBeTruthy()
    expect(mounted.view.queryByRole('button', { name: zh['detail.edit'] })).toBeNull()
  })

  it('keeps retained cards and reports an inline failure when a refresh fails', async () => {
    const mounted = mountBody()
    await waitFor(() => { expect(names(mounted.view.container)).toHaveLength(3) })
    mounted.remote.list.mockResolvedValueOnce({ ok: false, error: failure('gateway/internal', 'refresh failed') })

    fireEvent.click(mounted.view.getByRole('button', { name: zh['list.refresh'] }))
    await waitFor(() => { expect(mounted.view.getByText(/refresh failed/u)).toBeTruthy() })
    expect(names(mounted.view.container)).toEqual(['alpha', 'beta', 'gamma'])
  })
})
