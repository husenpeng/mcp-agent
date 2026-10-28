/** Skills tab state: per-tab catalogs, the lazy cursor, detail reads, and save readback. */
import { describe, expect, it } from 'vitest'
import { RemoteError } from '@tomato/client-test-runtime'
import type { SkillEntry, SkillGetValue } from '@tomato/api-remotes/client'
import type { TabId } from '@tomato/client-ui-dockkit'
import { createSkillBrowserStore, SKILL_PAGE_SIZE } from '../src/client/store.ts'

const TAB = 'tab-1' as TabId

/** One catalog entry. */
function entry(name: string): SkillEntry {
  return {
    name,
    description: `${name} description`,
    source: 'user-agents',
    path: `/home/u/.agents/skills/${name}/SKILL.md`,
    modelInvocable: true,
    userInvocable: true,
    editable: true,
  }
}

/** One loaded detail. */
function detail(value: SkillEntry): SkillGetValue {
  return { ...value, description: value.description ?? '', content: `${value.name} body` }
}

const offline = () => new RemoteError('gateway/internal', 'offline', {})

describe('createSkillBrowserStore', () => {
  it('mints an independent instance per call and starts a tab at its first read', () => {
    const first = createSkillBrowserStore().create()
    const second = createSkillBrowserStore().create()
    first.actions.start(TAB)
    expect(second.getSnapshot().byTab[TAB]).toBeUndefined()
    expect(first.getSnapshot().byTab[TAB]).toEqual({
      list: { phase: 'loading', skills: [] },
      detail: { status: 'idle' },
      visible: SKILL_PAGE_SIZE,
    })
  })

  it('keeps retained cards through a refresh and reports the failure beside them', () => {
    const store = createSkillBrowserStore().create()
    const { actions } = store
    actions.start(TAB)
    actions.listed(TAB, [entry('alpha'), entry('beta')])
    actions.listing(TAB)
    expect(store.getSnapshot().byTab[TAB]!.list).toEqual({ phase: 'loading', skills: [entry('alpha'), entry('beta')] })
    const failure = offline()
    actions.listFailed(TAB, failure)
    expect(store.getSnapshot().byTab[TAB]!.list).toEqual({
      phase: 'ready', skills: [entry('alpha'), entry('beta')], failure,
    })
    actions.listing(TAB)
    expect(store.getSnapshot().byTab[TAB]!.list).toEqual({ phase: 'loading', skills: [entry('alpha'), entry('beta')] })
    actions.listed(TAB, [entry('alpha')])
    expect(store.getSnapshot().byTab[TAB]!.list).toEqual({ phase: 'ready', skills: [entry('alpha')] })
  })

  it('reports an empty first read as failed and rewinds the cursor on a fresh catalog', () => {
    const store = createSkillBrowserStore().create()
    const { actions } = store
    actions.start(TAB)
    const failure = offline()
    actions.listFailed(TAB, failure)
    expect(store.getSnapshot().byTab[TAB]!.list).toEqual({ phase: 'failed', skills: [], failure })
    actions.listed(TAB, [entry('alpha'), entry('beta')])
    actions.showMore(TAB)
    expect(store.getSnapshot().byTab[TAB]!.visible).toBe(2)
    actions.listed(TAB, [entry('alpha'), entry('beta')])
    expect(store.getSnapshot().byTab[TAB]!.visible).toBe(SKILL_PAGE_SIZE)
  })

  it('caps the lazy cursor at the catalog size', () => {
    const store = createSkillBrowserStore().create()
    const { actions } = store
    actions.start(TAB)
    actions.listed(TAB, [entry('alpha'), entry('beta')])
    actions.showMore(TAB)
    actions.showMore(TAB)
    expect(store.getSnapshot().byTab[TAB]!.visible).toBe(2)
  })

  it('opens, fails, and closes details', () => {
    const store = createSkillBrowserStore().create()
    const { actions } = store
    actions.start(TAB)
    actions.opening(TAB, 'alpha')
    expect(store.getSnapshot().byTab[TAB]!.detail).toEqual({ status: 'loading', name: 'alpha' })
    actions.detailFailed(TAB, 'alpha', offline())
    expect(store.getSnapshot().byTab[TAB]!.detail).toMatchObject({ status: 'failed', name: 'alpha' })
    actions.opened(TAB, detail(entry('alpha')))
    expect(store.getSnapshot().byTab[TAB]!.detail).toEqual({
      status: 'ready', skill: detail(entry('alpha')), saving: false,
    })
    actions.closeDetail(TAB)
    expect(store.getSnapshot().byTab[TAB]!.detail).toEqual({ status: 'idle' })
  })

  it('publishes a save onto the open detail and its card', () => {
    const store = createSkillBrowserStore().create()
    const { actions } = store
    actions.start(TAB)
    actions.listed(TAB, [entry('alpha'), entry('beta')])
    actions.opened(TAB, detail(entry('alpha')))
    actions.saving(TAB)
    expect(store.getSnapshot().byTab[TAB]!.detail).toMatchObject({ status: 'ready', saving: true })
    const saved = { ...detail(entry('alpha')), description: 'Updated', whenToUse: 'When testing' }
    actions.saved(TAB, saved)
    const state = store.getSnapshot().byTab[TAB]!
    expect(state.detail).toEqual({ status: 'ready', skill: saved, saving: false })
    expect(state.list.skills[0]).toMatchObject({ name: 'alpha', description: 'Updated', whenToUse: 'When testing' })
    expect(state.list.skills[1]).toEqual(entry('beta'))
  })

  it('keeps the draft view open after a failed save and ignores a stray save state', () => {
    const store = createSkillBrowserStore().create()
    const { actions } = store
    actions.start(TAB)
    actions.opened(TAB, detail(entry('alpha')))
    const failure = offline()
    actions.saveFailed(TAB, failure)
    expect(store.getSnapshot().byTab[TAB]!.detail).toMatchObject({
      status: 'ready', saving: false, failure,
    })
    actions.closeDetail(TAB)
    actions.saving(TAB)
    actions.saveFailed(TAB, failure)
    expect(store.getSnapshot().byTab[TAB]!.detail).toEqual({ status: 'idle' })
  })

  it('projects a saved skill onto a card without a path or routing hint', () => {
    const store = createSkillBrowserStore().create()
    const { actions } = store
    const virtual: SkillEntry = {
      name: 'virtual', description: 'Virtual', source: 'runtime',
      modelInvocable: true, userInvocable: false, editable: false,
    }
    actions.start(TAB)
    actions.listed(TAB, [virtual])
    actions.opened(TAB, detail(virtual))
    actions.saved(TAB, {
      ...detail(virtual), description: 'After',
    })
    expect(store.getSnapshot().byTab[TAB]!.list.skills[0]).toEqual({
      name: 'virtual',
      description: 'After',
      modelInvocable: true,
      userInvocable: false,
      source: 'runtime',
      editable: false,
    })
  })

  it('forgets one tab without touching another', () => {
    const store = createSkillBrowserStore().create()
    const { actions } = store
    const other = 'tab-2' as TabId
    actions.start(TAB)
    actions.start(other)
    actions.forget(TAB)
    expect(store.getSnapshot().byTab[TAB]).toBeUndefined()
    expect(store.getSnapshot().byTab[other]).toBeDefined()
  })

  it('rejects writes to a tab without a bucket', () => {
    const store = createSkillBrowserStore().create()
    expect(() => { store.actions.listed(TAB, []) }).toThrow('no state for tab')
  })
})
