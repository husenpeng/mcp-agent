/** Command correlation, deadlines, and replacement are the registry's whole job. */
import { describe, expect, it } from 'vitest'
import { PhoneDevices } from '../src/registry.ts'
import type { PhoneAttachRequest } from '../src/protocol.ts'

const request: PhoneAttachRequest = {
  deviceId: 'device-1',
  deviceName: '测试 iPhone',
  protocol: 1,
  runnerVersion: '0.1.0',
  screen: { width: 393, height: 852, scale: 3 },
  capabilities: ['observe', 'screenshot', 'act', 'ocr'],
}

describe('PhoneDevices', () => {
  it('answers ready, forwards a command, and settles it with the reported value', async () => {
    const registry = new PhoneDevices({ commandTimeoutMs: 2000 })
    const controller = new AbortController()
    const stream = registry.attach(request, controller.signal)
    const iterator = stream[Symbol.asyncIterator]()
    const ready = await iterator.next()
    const readyFrame = ready.value as { type: string; attachId: string }
    expect(readyFrame.type).toBe('ready')
    expect(typeof readyFrame.attachId).toBe('string')
    const attachId = readyFrame.attachId

    const call = registry.call('device-1', 'observe', { maxElements: 10 }, controller.signal)
    const command = await iterator.next()
    expect(command.value).toMatchObject({ type: 'command', method: 'observe', params: { maxElements: 10 } })
    const commandId = (command.value as { commandId: string }).commandId

    registry.accept({ attachId, commandId, ok: true, value: { elements: [] } })
    await expect(call).resolves.toEqual({ elements: [] })
    registry.dispose()
  })

  it('fails a command that outlives its deadline and cancels it', async () => {
    const registry = new PhoneDevices({ commandTimeoutMs: 30 })
    const controller = new AbortController()
    const iterator = registry.attach(request, controller.signal)[Symbol.asyncIterator]()
    await iterator.next()

    const call = registry.call(undefined, 'act', {}, controller.signal, 30)
    await iterator.next()
    await expect(call).rejects.toMatchObject({ code: 'phone/timeout' })
    const cancel = await iterator.next()
    expect(cancel.value).toMatchObject({ type: 'cancel' })
    registry.dispose()
  })

  it('fails everything waiting when the runner disconnects', async () => {
    const registry = new PhoneDevices({ commandTimeoutMs: 5000 })
    const attach = new AbortController()
    const iterator = registry.attach(request, attach.signal)[Symbol.asyncIterator]()
    await iterator.next()

    const call = registry.call('device-1', 'observe', {}, new AbortController().signal)
    await iterator.next()
    // The stream ending is the disconnect; the call's own signal stays live.
    attach.abort()
    await expect(call).rejects.toMatchObject({ code: 'phone/disconnected' })
    registry.dispose()
  })

  it('replaces an earlier attachment of the same device', async () => {
    const registry = new PhoneDevices()
    const first = new AbortController()
    const firstIterator = registry.attach(request, first.signal)[Symbol.asyncIterator]()
    await firstIterator.next()
    const second = new AbortController()
    const secondIterator = registry.attach({ ...request, runnerVersion: '0.2.0' }, second.signal)[Symbol.asyncIterator]()
    await secondIterator.next()

    const ended = await firstIterator.next()
    expect(ended.done).toBe(true)
    expect(registry.list()).toHaveLength(1)
    expect(registry.list()[0]?.runnerVersion).toBe('0.2.0')
    registry.dispose()
  })

  it('refuses a protocol version it does not speak', () => {
    const registry = new PhoneDevices()
    const controller = new AbortController()
    expect(() => registry.attach({ ...request, protocol: 2 }, controller.signal)).toThrow(/协议/)
  })

  it('requires an explicit device when more than one is attached', () => {
    const registry = new PhoneDevices()
    const controller = new AbortController()
    registry.attach(request, controller.signal)
    registry.attach({ ...request, deviceId: 'device-2' }, controller.signal)
    expect(() => registry.require()).toThrow(/指定 device/)
    expect(registry.require('device-2').request.deviceId).toBe('device-2')
    registry.dispose()
  })

  it('marks a halted device and refuses work until it is unlocked', async () => {
    const registry = new PhoneDevices()
    const controller = new AbortController()
    const iterator = registry.attach(request, controller.signal)[Symbol.asyncIterator]()
    const ready = await iterator.next()
    const attachId = (ready.value as { attachId: string }).attachId

    registry.event({ attachId, type: 'halted' })
    expect(registry.list()[0]?.halted).toBe(true)
    await expect(registry.call('device-1', 'observe', {}, controller.signal)).rejects.toMatchObject({ code: 'phone/halted' })

    registry.event({ attachId, type: 'unlocked' })
    expect(registry.list()[0]?.halted).toBe(false)
    registry.dispose()
  })
})
