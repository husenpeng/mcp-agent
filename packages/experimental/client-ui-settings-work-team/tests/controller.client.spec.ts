/** The staged team-defaults form: effective values, fenced writes, sandbox validation, and disposal. */

import { describe, expect, it, vi } from 'vitest'
import { stubConfigForm } from '@tomato/client-test-runtime'
import {
  WorkTeamDefaultsCardController, type WorkTeamDefaultsSettings,
} from '../src/client/work-team-card-controller.ts'

const VALUE: WorkTeamDefaultsSettings = {
  defaultProvider: 'blueai',
  defaultModel: 'DeepSeek-V4.1-Flash-1017',
  permissionPreset: 'workspace-write',
  sandbox: 'workspace',
}

function bench() {
  const stub = stubConfigForm<WorkTeamDefaultsSettings>()
  const controller = new WorkTeamDefaultsCardController(stub.scope)
  const face = controller.inject()
  const store = face.hooks.workTeamDefaults
  stub.publish({ status: 'ready', value: VALUE, base: VALUE, user: {}, writable: true, revision: 3 })
  return { stub, controller, face, store }
}

describe('WorkTeamDefaultsCardController', () => {
  it('publishes the effective values once the Host serves the entry', () => {
    const { store, controller } = bench()
    const snapshot = store.getSnapshot()
    expect(snapshot.available).toBe(true)
    expect(snapshot.defaultProvider.text).toBe('blueai')
    expect(snapshot.defaultModel.text).toBe('DeepSeek-V4.1-Flash-1017')
    expect(snapshot.permissionPreset.text).toBe('workspace-write')
    expect(snapshot.sandbox.text).toBe('workspace')
    expect(snapshot.defaultProvider.overridden).toBe(false)
    controller.dispose()
  })

  it('writes a staged edit as one revision-fenced mutation and re-seeds from the acceptance', async () => {
    const { stub, face, store, controller } = bench()
    face.edit('defaultProvider', 'other')
    expect(store.getSnapshot().dirty).toBe(true)
    face.save()
    await vi.waitFor(() => { expect(stub.mutate).toHaveBeenCalledTimes(1) })
    expect(stub.mutate).toHaveBeenCalledWith([{ op: 'set', path: ['defaultProvider'], value: 'other' }], 3)
    stub.publish({ value: { ...VALUE, defaultProvider: 'other' }, revision: 4 })
    await vi.waitFor(() => { expect(store.getSnapshot().dirty).toBe(false) })
    expect(store.getSnapshot().defaultProvider.text).toBe('other')
    controller.dispose()
  })

  it('stages a clear when a text draft is emptied', async () => {
    const { stub, face, controller } = bench()
    stub.publish({ user: { defaultModel: 'custom' } })
    face.edit('defaultModel', '')
    face.save()
    await vi.waitFor(() => { expect(stub.mutate).toHaveBeenCalledTimes(1) })
    expect(stub.mutate).toHaveBeenCalledWith([{ op: 'unset', path: ['defaultModel'] }], 3)
    controller.dispose()
  })

  it('blocks the save on a sandbox draft outside the three levels', async () => {
    const { stub, face, store, controller } = bench()
    face.edit('sandbox', 'loose')
    expect(store.getSnapshot().sandbox.invalid).toBe(true)
    expect(store.getSnapshot().invalid).toBe(true)
    face.save()
    await vi.waitFor(() => { expect(store.getSnapshot().saving).toBe(false) })
    expect(stub.mutate).not.toHaveBeenCalled()
    face.edit('sandbox', 'full')
    expect(store.getSnapshot().invalid).toBe(false)
    face.save()
    await vi.waitFor(() => { expect(stub.mutate).toHaveBeenCalledTimes(1) })
    expect(stub.mutate).toHaveBeenCalledWith([{ op: 'set', path: ['sandbox'], value: 'full' }], 3)
    controller.dispose()
  })

  it('stages a clear when the sandbox draft is emptied', async () => {
    const { stub, face, controller } = bench()
    stub.publish({ user: { sandbox: 'full' } })
    face.edit('sandbox', '')
    face.save()
    await vi.waitFor(() => { expect(stub.mutate).toHaveBeenCalledTimes(1) })
    expect(stub.mutate).toHaveBeenCalledWith([{ op: 'unset', path: ['sandbox'] }], 3)
    controller.dispose()
  })

  it('reports a refused save and keeps the draft', async () => {
    const { stub, face, store, controller } = bench()
    stub.mutate.mockImplementation(() => Promise.resolve(false))
    face.edit('permissionPreset', 'danger-full-access')
    face.save()
    await vi.waitFor(() => { expect(store.getSnapshot().failed).toBe(true) })
    expect(store.getSnapshot().permissionPreset.text).toBe('danger-full-access')
    expect(store.getSnapshot().dirty).toBe(true)
    controller.dispose()
  })

  it('releases the scope subscription on dispose', () => {
    const { stub, controller } = bench()
    expect(stub.listenerCount()).toBe(1)
    controller.dispose()
    expect(stub.listenerCount()).toBe(0)
  })
})
