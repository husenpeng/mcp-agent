import test from 'node:test'
import assert from 'node:assert/strict'
import { sameVersion, showsTomatoRow } from '../src/client/tomato-offer.js'

const npm = (verified, current = '0.2.0-rc.2') => ({ kind: 'npm', verified, current })
const app = (verified, current = '0.2.0-rc.2') => ({ kind: 'app', verified, current })

test('an npm Tomato shows the row while the verified version differs from the running one', () => {
  assert.equal(showsTomatoRow(npm('0.2.1-alpha.1')), true)
  assert.equal(showsTomatoRow(npm('0.2.0-rc.2')), false)
  assert.equal(showsTomatoRow(npm(null)), false)
  assert.equal(showsTomatoRow({ ...npm('0.2.1-alpha.1'), current: null }), false)
})

test('a packaged app shows the row only when its own updater found the verified version', () => {
  const tomato = app('0.2.1-alpha.1')
  assert.equal(showsTomatoRow(tomato, undefined), false)
  assert.equal(showsTomatoRow(tomato, { phase: 'idle' }), false)
  assert.equal(showsTomatoRow(tomato, { phase: 'available', version: '0.2.1-alpha.2' }), false)
  assert.equal(showsTomatoRow(tomato, { phase: 'available', version: '0.2.1-alpha.1' }), true)
  assert.equal(showsTomatoRow(tomato, { phase: 'downloading', version: 'v0.2.1-alpha.1' }), true)
  assert.equal(showsTomatoRow(tomato, { phase: 'error', version: '0.2.1-alpha.1' }), false)
})

test('a packaged app without a verified version shows nothing, whatever its updater found', () => {
  assert.equal(showsTomatoRow(app(null), { phase: 'available', version: '0.2.1-alpha.2' }), false)
})

test('sameVersion ignores a leading v and build metadata, and never matches an empty version', () => {
  assert.equal(sameVersion('v0.2.1', '0.2.1+build.7'), true)
  assert.equal(sameVersion('0.2.1-alpha.1', '0.2.1-alpha.2'), false)
  assert.equal(sameVersion(undefined, ''), false)
})
