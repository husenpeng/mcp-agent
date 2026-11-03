import { describe, expect, it, vi } from 'vitest'
import { claimDesktopSingleInstance, type DesktopSingleInstanceApplication } from '../src/single-instance.ts'

describe('desktop single-instance ownership', () => {
  it('registers no lifecycle work without the lock', () => {
    const on = vi.fn()
    const application = {
      requestSingleInstanceLock: () => false,
      on,
    } satisfies DesktopSingleInstanceApplication

    expect(claimDesktopSingleInstance(application, vi.fn())).toBe(false)
    expect(on).not.toHaveBeenCalled()
  })

  it('routes a later launch to the primary process', () => {
    let secondInstance: ((event: unknown, argv?: readonly string[]) => void) | undefined
    const laterLaunch = vi.fn()
    const application = {
      requestSingleInstanceLock: () => true,
      on: vi.fn((_event: 'second-instance', listener: (event: unknown, argv?: readonly string[]) => void) => {
        secondInstance = listener
      }),
    } satisfies DesktopSingleInstanceApplication

    expect(claimDesktopSingleInstance(application, laterLaunch)).toBe(true)
    secondInstance?.({}, ['--tomato-dev-relaunch=request'])
    expect(laterLaunch).toHaveBeenCalledExactlyOnceWith(['--tomato-dev-relaunch=request'])
    // A later launch without reported arguments still reaches the owner as an empty request.
    secondInstance?.({})
    expect(laterLaunch).toHaveBeenLastCalledWith([])
  })
})
