/** The wire contract accepts what the runner sends and rejects what it must not. */
import { describe, expect, it } from 'vitest'
import {
  PhoneAction, PhoneCommandResult, PhoneObservation, PhoneAttachRequest,
} from '../src/protocol.ts'

describe('phone protocol', () => {
  it('accepts an observation with elements and OCR', () => {
    const value = PhoneObservation.parse({
      observationId: 'o-1',
      screen: { width: 393, height: 852, scale: 3 },
      elements: [{ ref: 'e0', role: 'Button', label: '通用', frame: [16, 565, 361, 56], enabled: true }],
      ocr: [{ ref: 't0', text: '电池', frame: [24, 520, 60, 20] }],
      truncated: false,
      keyboardVisible: false,
    })
    expect(value.elements[0]?.label).toBe('通用')
  })

  it('rejects an element without a ref or with a malformed frame', () => {
    expect(() => PhoneObservation.parse({
      observationId: 'o-1',
      screen: { width: 393, height: 852, scale: 3 },
      elements: [{ role: 'Button', label: '通用', frame: [16, 565], enabled: true }],
      truncated: false,
      keyboardVisible: false,
    })).toThrow()
  })

  it('rejects an action whose type is not one of the eight', () => {
    expect(() => PhoneAction.parse({ type: 'scrollTo' })).toThrow()
  })

  it('accepts a launch action with a name and a fresh flag', () => {
    expect(PhoneAction.parse({ type: 'launch', name: '设置', fresh: true })).toMatchObject({ type: 'launch' })
  })

  it('rejects an attach request whose protocol is missing', () => {
    expect(() => PhoneAttachRequest.parse({
      deviceId: 'device-1', deviceName: 'iPhone', runnerVersion: '0.1.0',
      screen: { width: 393, height: 852, scale: 3 }, capabilities: [],
    })).toThrow()
  })

  it('accepts a success and a failure command result', () => {
    expect(PhoneCommandResult.parse({ attachId: 'a', commandId: 'c', ok: true, value: { n: 1 } }).ok).toBe(true)
    expect(PhoneCommandResult.parse({
      attachId: 'a', commandId: 'c', ok: false,
      error: { code: 'STALE_REF', message: '元素已经不在屏幕上', retryable: false },
    }).error?.code).toBe('STALE_REF')
  })
})
