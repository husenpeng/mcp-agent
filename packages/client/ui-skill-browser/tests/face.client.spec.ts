/** Skills tab async face: catalog generations, detail reads, saves, and tab-lifetime cleanup. */
import { describe, expect, it, vi } from 'vitest'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { TabId } from '@deepseek-ai/dsh-client-ui-dockkit'
import type { SkillGetValue } from '@deepseek-ai/dsh-api-remotes/client'
import { skillBrowserFace } from '../src/client/face.ts'
import { createSkillBrowserStore } from '../src/client/store.ts'
import { BRIEF_CATALOG, CATALOG, detailOf, failure, scriptedRemote } from './scripted-remote.client.ts'

const SESSION = 's-test' as SessionId
const TAB = 'tab-1' as TabId

/** One store instance, one face, one tab lifetime. */
function bench(remote = scriptedRemote()) {
  const instance = createSkillBrowserStore().create()
  const controller = new AbortController()
  const face = skillBrowserFace(remote.remote)(SESSION, instance.actions)
  return { instance, controller, face, remote }
}

/** The live store instance the framework would mint for one session. */
type Instance = ReturnType<ReturnType<typeof createSkillBrowserStore>['create']>

/** State of the mounted tab. */
function tab(instance: Instance) {
  return instance.getSnapshot().byTab[TAB]
}

describe('skillBrowserFace', () => {
  it('seeds a tab, reads the complete catalog, and forgets it when the tab ends', async () => {
    const { instance, controller, face, remote } = bench()
    face.start(TAB, controller.signal)
    expect(tab(instance)?.list.phase).toBe('loading')

    await vi.waitFor(() => { expect(tab(instance)?.list).toEqual({ phase: 'ready', skills: BRIEF_CATALOG }) })
    expect(remote.list).toHaveBeenCalledWith({ sessionId: SESSION, includeModelOnly: true, brief: true }, controller.signal)

    controller.abort()
    expect(tab(instance)).toBeUndefined()
  })

  it('ignores a superseded list settlement', async () => {
    const { instance, controller, face, remote } = bench()
    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    remote.list.mockImplementationOnce(async () => {
      await gate
      return { ok: true, value: { skills: [{ ...CATALOG[0]!, name: 'stale' }] } }
    })
    face.start(TAB, controller.signal)
    face.reload(TAB, controller.signal)

    await vi.waitFor(() => { expect(tab(instance)?.list).toEqual({ phase: 'ready', skills: BRIEF_CATALOG }) })
    release()
    await Promise.resolve()
    await Promise.resolve()
    expect(tab(instance)?.list).toEqual({ phase: 'ready', skills: BRIEF_CATALOG })
  })

  it('reports a failed or thrown list read', async () => {
    const first = bench()
    first.remote.list.mockResolvedValueOnce({ ok: false, error: failure('gateway/internal', 'offline') })
    first.face.start(TAB, first.controller.signal)
    await vi.waitFor(() => {
      expect(tab(first.instance)?.list).toMatchObject({ phase: 'failed', failure: { message: 'offline' } })
    })

    const second = bench()
    second.remote.list.mockRejectedValueOnce(new Error('carrier down'))
    second.face.start(TAB, second.controller.signal)
    await vi.waitFor(() => {
      expect(tab(second.instance)?.list).toMatchObject({ phase: 'failed', failure: { message: 'carrier down' } })
    })
  })

  it('opens a detail, reports a failure, and drops a read superseded by Close', async () => {
    const { instance, controller, face, remote } = bench()
    instance.actions.start(TAB)
    face.openDetail(TAB, 'alpha', controller.signal)
    await vi.waitFor(() => { expect(tab(instance)?.detail).toEqual({ status: 'ready', skill: detailOf(CATALOG[0]!), saving: false }) })
    expect(remote.get).toHaveBeenCalledWith({ sessionId: SESSION, name: 'alpha' }, controller.signal)

    remote.get.mockResolvedValueOnce({ ok: false, error: failure('skill/not-found', 'gone') })
    face.openDetail(TAB, 'missing', controller.signal)
    await vi.waitFor(() => {
      expect(tab(instance)?.detail).toMatchObject({ status: 'failed', name: 'missing', failure: { code: 'skill/not-found' } })
    })

    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    remote.get.mockImplementationOnce(async () => {
      await gate
      return { ok: true, value: detailOf(CATALOG[1]!) }
    })
    face.openDetail(TAB, 'beta', controller.signal)
    face.closeDetail(TAB)
    release()
    await Promise.resolve()
    await Promise.resolve()
    expect(tab(instance)?.detail).toEqual({ status: 'idle' })
  })

  it('classifies a thrown detail read', async () => {
    const { instance, controller, face, remote } = bench()
    instance.actions.start(TAB)
    remote.get.mockRejectedValueOnce(new Error('carrier down'))
    face.openDetail(TAB, 'alpha', controller.signal)
    await vi.waitFor(() => {
      expect(tab(instance)?.detail).toMatchObject({
        status: 'failed', name: 'alpha', failure: { code: 'gateway/internal', message: 'carrier down' },
      })
    })
  })

  it('publishes a successful save and reports a refused one', async () => {
    const { instance, controller, face, remote } = bench()
    instance.actions.start(TAB)
    instance.actions.opened(TAB, detailOf(CATALOG[0]!))

    const draft = { name: 'alpha', description: 'After', whenToUse: null, content: 'After body.' }
    await expect(face.save(TAB, draft, controller.signal)).resolves.toBeNull()
    expect(remote.save).toHaveBeenCalledWith({ sessionId: SESSION, ...draft }, controller.signal)
    const saved: SkillGetValue = {
      ...detailOf(CATALOG[0]!), description: 'After', content: 'After body.',
    }
    expect(tab(instance)?.detail).toEqual({ status: 'ready', skill: saved, saving: false })

    const refusal = failure('skill/not-editable', 'not personal')
    remote.save.mockResolvedValueOnce({ ok: false, error: refusal })
    await expect(face.save(TAB, draft, controller.signal)).resolves.toBe(refusal)
    expect(tab(instance)?.detail).toMatchObject({ status: 'ready', saving: false, failure: refusal })
  })

  it('classifies a thrown save', async () => {
    const { instance, controller, face, remote } = bench()
    instance.actions.start(TAB)
    instance.actions.opened(TAB, detailOf(CATALOG[0]!))
    remote.save.mockRejectedValueOnce(new Error('carrier down'))
    const draft = { name: 'alpha', description: 'After', whenToUse: null, content: 'After body.' }

    await expect(face.save(TAB, draft, controller.signal)).resolves.toMatchObject({ code: 'gateway/internal', message: 'carrier down' })
    expect(tab(instance)?.detail).toMatchObject({ status: 'ready', saving: false })
  })

  it('does nothing for a save on an ended tab', async () => {
    const { instance, face, remote } = bench()
    instance.actions.start(TAB)
    const controller = new AbortController()
    controller.abort()
    await expect(face.save(TAB, {
      name: 'alpha', description: 'After', whenToUse: null, content: 'Body.',
    }, controller.signal)).resolves.toBeNull()
    expect(remote.save).not.toHaveBeenCalled()
  })

  it('does nothing when start, reload, or openDetail is called on an ended tab', async () => {
    const { instance, face, remote } = bench()
    const controller = new AbortController()
    controller.abort()

    face.start(TAB, controller.signal)
    face.reload(TAB, controller.signal)
    face.openDetail(TAB, 'alpha', controller.signal)

    expect(instance.getSnapshot().byTab[TAB]).toBeUndefined()
    expect(remote.list).not.toHaveBeenCalled()
    expect(remote.get).not.toHaveBeenCalled()
  })

  it('drops a settlement that arrives after its signal aborted', async () => {
    const listed = bench()
    const listController = new AbortController()
    listed.remote.list.mockImplementationOnce(async () => {
      listController.abort()
      throw 'plain failure'
    })
    listed.face.start(TAB, listController.signal)
    await vi.waitFor(() => { expect(listed.remote.list).toHaveBeenCalledTimes(1) })
    expect(tab(listed.instance)).toBeUndefined()

    const read = bench()
    const detailController = new AbortController()
    read.instance.actions.start(TAB)
    read.remote.get.mockImplementationOnce(async () => {
      detailController.abort()
      throw new Error('late read')
    })
    read.face.openDetail(TAB, 'alpha', detailController.signal)
    await vi.waitFor(() => { expect(read.remote.get).toHaveBeenCalledTimes(1) })
    expect(tab(read.instance)?.detail).toEqual({ status: 'loading', name: 'alpha' })

    const saved = bench()
    const saveController = new AbortController()
    saved.instance.actions.start(TAB)
    saved.instance.actions.opened(TAB, detailOf(CATALOG[0]!))
    const draft = { name: 'alpha', description: 'After', whenToUse: null, content: 'After body.' }
    saved.remote.save.mockImplementationOnce(async () => {
      saveController.abort()
      return { ok: true, value: detailOf(CATALOG[0]!) }
    })
    await expect(saved.face.save(TAB, draft, saveController.signal)).resolves.toBeNull()
    expect(tab(saved.instance)?.detail).toMatchObject({ status: 'ready', saving: true })
  })

  it('drops a save that rejects after its signal aborted', async () => {
    const { instance, controller, face, remote } = bench()
    instance.actions.start(TAB)
    instance.actions.opened(TAB, detailOf(CATALOG[0]!))
    remote.save.mockImplementationOnce(async () => {
      controller.abort()
      throw new Error('late save')
    })

    await expect(face.save(TAB, {
      name: 'alpha', description: 'After', whenToUse: null, content: 'After body.',
    }, controller.signal)).resolves.toBeNull()
    expect(tab(instance)?.detail).toMatchObject({ status: 'ready', saving: true })
  })

  it('reports a non-Error carrier failure and drops a save settled after Close', async () => {
    const { instance, controller, face, remote } = bench()
    remote.list.mockRejectedValueOnce('plain failure')
    face.start(TAB, controller.signal)
    await vi.waitFor(() => {
      expect(tab(instance)?.list).toMatchObject({ phase: 'failed', failure: { message: 'plain failure' } })
    })

    const saveBench = bench()
    saveBench.instance.actions.start(TAB)
    saveBench.instance.actions.opened(TAB, detailOf(CATALOG[0]!))
    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    saveBench.remote.save.mockImplementationOnce(async () => {
      await gate
      return { ok: true, value: detailOf(CATALOG[0]!) }
    })
    const pending = saveBench.face.save(TAB, {
      name: 'alpha', description: 'After', whenToUse: null, content: 'After body.',
    }, saveBench.controller.signal)
    saveBench.face.closeDetail(TAB)
    release()
    await expect(pending).resolves.toBeNull()
    expect(tab(saveBench.instance)?.detail).toEqual({ status: 'idle' })
  })
})
