/** One-shot tunnel resume marker: request, consumption, and unreadable states. */

import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import * as fs from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it, onTestFinished, vi } from 'vitest'
import { clearTunnelResume, consumeTunnelResume, requestTunnelResume } from '../src/remote-resume.ts'

vi.mock('node:fs', async importOriginal => ({ ...await importOriginal<typeof import('node:fs')>() }))

function fixture() {
  const userData = mkdtempSync(join(tmpdir(), 'tomato-desktop-resume-'))
  onTestFinished(() => { rmSync(userData, { recursive: true, force: true }) })
  return { userData, marker: join(userData, 'remote-tunnel-resume') }
}

afterEach(() => { vi.restoreAllMocks() })

it('reports no resume when the previous launch left no marker', () => {
  const { userData, marker } = fixture()
  expect(consumeTunnelResume(userData)).toBe(false)
  expect(fs.existsSync(marker)).toBe(false)
})

it('consumes the request exactly once', () => {
  const { userData, marker } = fixture()
  requestTunnelResume(userData)
  expect(fs.existsSync(marker)).toBe(true)
  expect(consumeTunnelResume(userData)).toBe(true)
  expect(fs.existsSync(marker)).toBe(false)
  expect(consumeTunnelResume(userData)).toBe(false)
})

it('treats an unreadable marker as no request', () => {
  const { userData, marker } = fixture()
  mkdirSync(marker)
  expect(consumeTunnelResume(userData)).toBe(false)
})

it('still resumes when the stale marker cannot be removed', () => {
  const { userData, marker } = fixture()
  requestTunnelResume(userData)
  vi.spyOn(fs, 'rmSync').mockImplementation(() => { throw new Error('marker is locked') })
  expect(consumeTunnelResume(userData)).toBe(true)
  expect(fs.existsSync(marker)).toBe(true)
})

it('drops a cancelled request without resuming it', () => {
  const { userData, marker } = fixture()
  requestTunnelResume(userData)
  clearTunnelResume(userData)
  expect(fs.existsSync(marker)).toBe(false)
  expect(consumeTunnelResume(userData)).toBe(false)
})
