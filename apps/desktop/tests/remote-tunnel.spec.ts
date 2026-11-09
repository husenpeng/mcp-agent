import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { RemoteTunnel, type RemoteTunnelState, type TunnelChild } from '../src/remote-tunnel.ts'

class FakeChild extends EventEmitter implements TunnelChild {
  readonly stdout = new PassThrough()
  readonly stderr = new PassThrough()
  exitCode: number | null = null
  signalCode: NodeJS.Signals | null = null
  readonly signals: NodeJS.Signals[] = []

  kill(signal: NodeJS.Signals = 'SIGTERM'): boolean {
    this.signals.push(signal)
    this.signalCode = signal
    this.emit('exit', null, signal)
    return true
  }

  announce(line: string): void {
    this.stderr.write(`${line}\n`)
  }

  crash(code: number): void {
    this.exitCode = code
    this.emit('exit', code, null)
  }
}

function harness(options: { binaryFails?: boolean; binaries?: readonly string[] } = {}) {
  const states: RemoteTunnelState[] = []
  const children: FakeChild[] = []
  const attempted: string[] = []
  const tunnel = new RemoteTunnel({
    binaries: options.binaries ?? ['/opt/homebrew/bin/cloudflared'],
    target: () => ({ host: '127.0.0.1', port: 43_110 }),
    restartDelayMs: 1_000,
    onChange: (state) => { states.push(state) },
    spawnProcess: (command: string) => {
      attempted.push(command)
      const child = new FakeChild()
      children.push(child)
      if (options.binaryFails === true) queueMicrotask(() => { child.emit('error', Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' })) })
      return child
    },
  })
  return { tunnel, states, children, attempted }
}

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

it('reports offline until started, then announces the tunnel hostname', async () => {
  const { tunnel, states, children } = harness()
  expect(tunnel.state()).toEqual({ phase: 'off' })
  tunnel.start()
  expect(states.at(-1)).toEqual({ phase: 'starting' })
  children[0]?.announce('INF |  https://calm-herself-dev-philosophy.trycloudflare.com   |')
  await vi.waitFor(() => {
    expect(states.at(-1)).toEqual({
      phase: 'online',
      host: 'calm-herself-dev-philosophy.trycloudflare.com',
    })
  })
  expect(tunnel.state().host).toBe('calm-herself-dev-philosophy.trycloudflare.com')
})

it('stops the child and stays off when the user disables it', () => {
  const { tunnel, states, children } = harness()
  tunnel.start()
  children[0]?.announce('INF |  https://sizes-wendy-spoken-subscribers.trycloudflare.com  |')
  tunnel.stop()
  expect(children[0]?.signals).toEqual(['SIGTERM'])
  expect(states.at(-1)).toEqual({ phase: 'off' })
  vi.advanceTimersByTime(10_000)
  expect(children).toHaveLength(1)
})

it('restarts a tunnel that exited on its own', () => {
  const { tunnel, states, children } = harness()
  tunnel.start()
  children[0]?.crash(1)
  expect(states.at(-1)).toEqual({ phase: 'failed', message: 'cloudflared exited with code 1' })
  vi.advanceTimersByTime(1_000)
  expect(children).toHaveLength(2)
  expect(states.at(-1)).toEqual({ phase: 'starting' })
})

it('reports a missing binary with an actionable message and keeps retrying', () => {
  const { tunnel, states, children } = harness({ binaryFails: true })
  tunnel.start()
  return vi.waitFor(() => {
    expect(states.at(-1)).toEqual({ phase: 'failed', message: 'cloudflared was not found; install it (brew install cloudflared) and start the tunnel again' })
    vi.advanceTimersByTime(1_000)
    expect(children.length).toBeGreaterThan(1)
  })
})

it('reports when the Host is not running yet', () => {
  const states: RemoteTunnelState[] = []
  const tunnel = new RemoteTunnel({
    binaries: ['cloudflared'],
    target: () => undefined,
    onChange: (state) => { states.push(state) },
    spawnProcess: () => { throw new Error('must not spawn without a Host') },
  })
  tunnel.start()
  expect(states.at(-1)).toEqual({ phase: 'failed', message: 'the Desktop Host is not running yet' })
})

it('tries the next conventional location when the first candidate is missing', async () => {
  const { tunnel, states, children, attempted } = harness({
    binaries: ['cloudflared', '/opt/homebrew/bin/cloudflared'],
    binaryFails: true,
  })
  tunnel.start()
  await vi.waitFor(() => { expect(attempted).toHaveLength(2) })
  expect(attempted[1]).toBe('/opt/homebrew/bin/cloudflared')
  children[1]?.announce('INF |  https://fallback-candidate.trycloudflare.com  |')
  await vi.waitFor(() => { expect(states.at(-1)).toEqual({ phase: 'online', host: 'fallback-candidate.trycloudflare.com' }) })
})
