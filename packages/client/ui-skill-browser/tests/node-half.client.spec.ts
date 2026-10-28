/** The package's node half contributes nothing to the host tree. */
import { describe, expect, it } from 'vitest'
import { apply } from '../src/index.ts'

describe('node half', () => {
  it('registers nothing on the host', () => {
    expect(() => { apply() }).not.toThrow()
  })
})
