import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it, onTestFinished } from 'vitest'
import {
  acknowledgeDevelopmentRelaunch,
  developmentRelaunchAcknowledged,
  developmentRelaunchRequest,
  waitForDevelopmentRelaunch,
} from '../src/development-relaunch.ts'

it('reads a relaunch request only from an unpackaged development launch', () => {
  const argv = ['electron', 'app', '--tomato-dev-relaunch=request-a']
  expect(developmentRelaunchRequest(argv, true)).toBe('request-a')
  expect(developmentRelaunchRequest(argv, false)).toBeUndefined()
  expect(developmentRelaunchRequest(['electron', 'app'], true)).toBeUndefined()
  expect(developmentRelaunchRequest(['electron', 'app', '--tomato-dev-relaunch='], true)).toBeUndefined()
  expect(developmentRelaunchRequest(undefined, true)).toBeUndefined()
})

it('confirms a relaunch only for the acknowledged request', async () => {
  const userData = mkdtempSync(join(tmpdir(), 'tomato-development-relaunch-'))
  onTestFinished(() => { rmSync(userData, { recursive: true, force: true }) })

  const waiting = waitForDevelopmentRelaunch(userData, 'request-b', 2_000)
  acknowledgeDevelopmentRelaunch(userData, 'request-a')
  expect(await waitForDevelopmentRelaunch(userData, 'request-a', 200)).toBe(true)
  acknowledgeDevelopmentRelaunch(userData, 'request-b')
  await expect(waiting).resolves.toBe(true)
})

it('recognizes a request this shell already acknowledged', () => {
  const userData = mkdtempSync(join(tmpdir(), 'tomato-development-relaunch-'))
  onTestFinished(() => { rmSync(userData, { recursive: true, force: true }) })

  expect(developmentRelaunchAcknowledged(userData, 'request-a')).toBe(false)
  acknowledgeDevelopmentRelaunch(userData, 'request-a')
  expect(developmentRelaunchAcknowledged(userData, 'request-a')).toBe(true)
  expect(developmentRelaunchAcknowledged(userData, 'request-b')).toBe(false)
})

it('reports an unacknowledged relaunch when the deadline passes', async () => {
  const userData = mkdtempSync(join(tmpdir(), 'tomato-development-relaunch-'))
  onTestFinished(() => { rmSync(userData, { recursive: true, force: true }) })

  await expect(waitForDevelopmentRelaunch(userData, 'request-c', 150)).resolves.toBe(false)
})
