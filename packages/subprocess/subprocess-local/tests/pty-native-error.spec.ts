/** A node-pty native throw must surface as a JS error, not abort the host, when koffi loaded first. */
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const resolve = createRequire(import.meta.url)
const fixture = join(import.meta.dirname, 'fixtures', 'pty-koffi-order.cjs')

// dyld and ELF coalesce the weak node-addon-api callback wrapper across addons;
// Windows has no weak-symbol interposition, so the hazard does not exist there.
describe.skipIf(process.platform === 'win32')('node-pty native error containment', () => {
  it('reports a native throw as a catchable JS error with koffi loaded first', () => {
    const child = spawnSync(process.execPath, [fixture, resolve.resolve('koffi'), resolve.resolve('node-pty')], {
      encoding: 'utf8', timeout: 30_000,
    })
    expect(child.error).toBeUndefined()
    expect(child.signal).toBeNull()
    expect(child.status).toBe(0)
    expect(child.stdout).toMatch(/^CAUGHT:/u)
  })
})
