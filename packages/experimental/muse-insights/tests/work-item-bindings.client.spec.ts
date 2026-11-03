// @vitest-environment jsdom
/** Work item tab bindings recover the item one restored page last showed, and survive absent or failing storage. */
import { afterEach, expect, it, vi } from 'vitest'
import { SessionId } from '@tomato/session/types'
import type { TabId } from '@tomato/client-ui-sidebar-right/client'
import { WorkItemTabBindings } from '../src/client/work-item-bindings.ts'

const session = SessionId('session.with.dot')
const otherSession = SessionId('session-other')
const tab = 'tab1' as TabId
const otherTab = 'tab2' as TabId
const target = { day: '2026-11-02', title: 'Draft the plan' }
const otherTarget = { day: '2026-11-02', title: 'Send the brief' }

/** The single storage key this Session's bindings were written under. */
function storedKey(): string {
  return localStorage.key(0)!
}

/** The value one Session's bindings were written under. */
function storedValue(): unknown {
  return JSON.parse(localStorage.getItem(storedKey())!)
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  localStorage.clear()
})

it('recovers the item a tab page last showed after a new window loads', () => {
  const bindings = new WorkItemTabBindings()
  expect(bindings.read(session, tab)).toBeUndefined()
  bindings.write(session, tab, target)
  expect(new WorkItemTabBindings().read(session, tab)).toEqual(target)
})

it('keeps one entry per tab page and one document per Session', () => {
  const bindings = new WorkItemTabBindings()
  bindings.write(session, tab, target)
  bindings.write(session, otherTab, otherTarget)
  bindings.write(otherSession, tab, otherTarget)
  const reloaded = new WorkItemTabBindings()
  expect(reloaded.read(session, tab)).toEqual(target)
  expect(reloaded.read(session, otherTab)).toEqual(otherTarget)
  expect(reloaded.read(otherSession, tab)).toEqual(otherTarget)
  expect(localStorage.length).toBe(2)
})

it('keeps only the last item one page showed and stores only its day and title', () => {
  const bindings = new WorkItemTabBindings()
  bindings.write(session, tab, target)
  bindings.write(session, tab, otherTarget)
  expect(new WorkItemTabBindings().read(session, tab)).toEqual(otherTarget)
  expect(storedValue()).toEqual({ [tab]: otherTarget })
})

it('drops entries of tabs the Session no longer holds, and keeps them while that list is unknown', () => {
  const live = new WorkItemTabBindings(() => [otherTab])
  live.write(session, tab, target)
  live.write(session, otherTab, otherTarget)
  expect(live.read(session, tab)).toBeUndefined()
  expect(live.read(session, otherTab)).toEqual(otherTarget)
  expect(storedValue()).toEqual({ [otherTab]: otherTarget })

  const unknown = new WorkItemTabBindings(() => undefined)
  unknown.write(session, tab, target)
  expect(storedValue()).toEqual({ [otherTab]: otherTarget, [tab]: target })

  const unadopted = new WorkItemTabBindings(() => [])
  unadopted.write(session, otherTab, otherTarget)
  expect(storedValue()).toEqual({ [otherTab]: otherTarget, [tab]: target })
})

it('removes the document once no entry is left', () => {
  const bindings = new WorkItemTabBindings(() => ['tab3'])
  bindings.write(session, tab, target)
  expect(localStorage.length).toBe(0)
})

it('drops stored text this store did not write and keeps the values it did', () => {
  const bindings = new WorkItemTabBindings()
  localStorage.setItem(`tomato.muse-insights.work-item-tab.v1.${session}`, JSON.stringify({
    broken: null,
    scalar: 'text',
    missingTitle: { day: '2026-11-02' },
    missingDay: { title: 'Send the brief' },
    typedDay: { day: 1, title: 'Send the brief' },
    kept: target,
  }))
  expect(bindings.read(session, 'broken' as TabId)).toBeUndefined()
  expect(bindings.read(session, 'scalar' as TabId)).toBeUndefined()
  expect(bindings.read(session, 'missingTitle' as TabId)).toBeUndefined()
  expect(bindings.read(session, 'missingDay' as TabId)).toBeUndefined()
  expect(bindings.read(session, 'typedDay' as TabId)).toBeUndefined()
  expect(bindings.read(session, 'kept' as TabId)).toEqual(target)
})

it('treats unparseable or non-object documents as empty', () => {
  const bindings = new WorkItemTabBindings()
  const key = `tomato.muse-insights.work-item-tab.v1.${session}`
  localStorage.setItem(key, '{')
  expect(bindings.read(session, tab)).toBeUndefined()
  localStorage.setItem(key, 'null')
  expect(new WorkItemTabBindings().read(session, tab)).toBeUndefined()
})

it('keeps this window’s value when storage is absent', () => {
  vi.stubGlobal('localStorage', undefined)
  const bindings = new WorkItemTabBindings()
  expect(bindings.read(session, tab)).toBeUndefined()
  bindings.write(session, tab, target)
  expect(bindings.read(session, tab)).toEqual(target)
  expect(new WorkItemTabBindings().read(session, tab)).toBeUndefined()
})

it('reports a rejected read without failing the page', () => {
  vi.stubGlobal('localStorage', {
    getItem: () => { throw new Error('denied') },
    setItem: () => undefined,
    removeItem: () => undefined,
  })
  expect(new WorkItemTabBindings().read(session, tab)).toBeUndefined()
})

it('reports a rejected write and keeps the value in this window', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: () => { throw new Error('quota') },
    removeItem: () => undefined,
  })
  const bindings = new WorkItemTabBindings()
  bindings.write(session, tab, target)
  expect(bindings.read(session, tab)).toEqual(target)
  expect(error).toHaveBeenCalledWith('Work item tab binding persistence failed:', new Error('quota'))
})
