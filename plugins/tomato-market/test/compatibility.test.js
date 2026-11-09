import test from 'node:test'
import assert from 'node:assert/strict'
import { candidateOrder, evaluateCompatibility } from '../src/host/compatibility.js'

const RUNTIME = '0.2.1-rc.3'

test('an engines.tomato range decides alone', () => {
  const compatible = { engines: { tomato: '>=0.2.1-rc.3 <0.3.0' }, peerDependencies: { '@tomato/agent': '^9.0.0' } }
  assert.deepEqual(evaluateCompatibility(compatible, RUNTIME), { status: 'compatible' })
  const unmet = evaluateCompatibility({ engines: { tomato: '>=0.2.2-rc.1' } }, RUNTIME)
  assert.deepEqual(unmet, { status: 'incompatible', requirements: { 'engines.tomato': '>=0.2.2-rc.1' } })
})

test('engines.dsh reads as the same runtime selection', () => {
  assert.deepEqual(evaluateCompatibility({ engines: { dsh: '>=0.2.1-rc.1 <0.3.0' } }, RUNTIME), { status: 'compatible' })
})

test('TOMATO peers must match the runtime version', () => {
  assert.deepEqual(evaluateCompatibility({ peerDependencies: { '@tomato/agent': '^0.2.1-rc.1' } }, RUNTIME), { status: 'compatible' })
  assert.deepEqual(evaluateCompatibility({ peerDependencies: { '@tomato/agent': '^0.2.2-rc.1' } }, RUNTIME), {
    status: 'incompatible',
    requirements: { '@tomato/agent': '^0.2.2-rc.1' },
  })
})

test('published DeepSeek Harness peers are judged under their Tomato names', () => {
  const manifest = {
    peerDependencies: {
      '@deepseek-ai/cordis': '^4.0.5',
      '@deepseek-ai/schemastery': '~3.18.5',
      '@deepseek-ai/dsh-agent': '^0.2.2-rc.1',
      '@huanlin/dsh-plugin-better-locale': '^0.1.0',
      react: '^18.2.0',
    },
  }
  assert.deepEqual(evaluateCompatibility(manifest, RUNTIME), {
    status: 'incompatible',
    requirements: { '@tomato/agent': '^0.2.2-rc.1' },
  })
  assert.deepEqual(evaluateCompatibility({ peerDependencies: { '@deepseek-ai/dsh-agent': '^0.2.1-rc.1' } }, '0.2.2-rc.1'), { status: 'compatible' })
})

test('workspace ranges mean the running runtime', () => {
  assert.deepEqual(evaluateCompatibility({ peerDependencies: { '@tomato/session': 'workspace:^' } }, RUNTIME), { status: 'compatible' })
})

test('an unreadable declaration leaves the verdict unknown', () => {
  assert.equal(evaluateCompatibility({ engines: { tomato: 3 } }, RUNTIME).status, 'unknown')
  assert.equal(evaluateCompatibility({ peerDependencies: { '@tomato/agent': null } }, RUNTIME).status, 'unknown')
  assert.equal(evaluateCompatibility({ engines: 'x' }, RUNTIME).status, 'unknown')
  assert.equal(evaluateCompatibility(undefined, RUNTIME).status, 'unknown')
  assert.equal(evaluateCompatibility({}, 'not-a-version').status, 'unknown')
})

test('candidate order puts the requested version first, then the newest published ones', () => {
  const versions = [{ version: '0.28.2' }, { version: '0.30.1' }, { version: '0.30.0' }, { version: 'nightly' }]
  assert.deepEqual(candidateOrder(versions, '0.28.2').map(entry => entry.version), ['0.28.2', '0.30.1', '0.30.0', 'nightly'])
  assert.deepEqual(candidateOrder(versions, '9.9.9').map(entry => entry.version), ['0.30.1', '0.30.0', '0.28.2', 'nightly'])
})