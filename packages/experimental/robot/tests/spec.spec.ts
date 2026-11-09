import { describe, expect, it } from 'vitest'
import { emptyRobotSpec } from '../src/index.ts'

describe('empty robot specification', () => {
  it('selects the permission preset the base profile registers', () => {
    const spec = emptyRobotSpec()
    expect(spec.capability.sandbox).toBe('workspace')
    expect(spec.capability.permissionPreset).toBe('workspace-write')
  })
})
