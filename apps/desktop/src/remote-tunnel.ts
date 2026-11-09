/**
 * Supervises the Cloudflare quick tunnel that lets a phone reach this Desktop Host.
 *
 * The tunnel is opt-in through `remote.tunnel` in the shell settings. It targets
 * the Host's own loopback listener, which the connection fence already trusts, so
 * no `--trusted-host` value is needed here; a tunnel that stops on its own is
 * restarted after a short delay while the user still has it enabled.
 */
import { spawn, type SpawnOptions } from 'node:child_process'
import { createInterface } from 'node:readline'

/** Tunnel lifecycle as the settings page renders it. */
export interface RemoteTunnelState {
  /** `off` before the first start and after a user stop. */
  readonly phase: 'off' | 'starting' | 'online' | 'failed'
  /** Bare authority of the quick tunnel, present once `online`. */
  readonly host?: string
  /** Operator-facing failure text; never carries the launch token. */
  readonly message?: string
}

/**
 * The child-process surface this supervisor uses. A real `ChildProcess` satisfies
 * it; tests supply a fake driven by their own event source.
 */
export interface TunnelChild {
  readonly stdout: NodeJS.ReadableStream | null
  readonly stderr: NodeJS.ReadableStream | null
  readonly exitCode: number | null
  readonly signalCode: NodeJS.Signals | null
  once(event: 'error', listener: (error: NodeJS.ErrnoException) => void): this
  once(event: 'exit', listener: (code: number | null, signal: NodeJS.Signals | null) => void): this
  kill(signal?: NodeJS.Signals): boolean
}

/** Loopback listener the tunnel forwards to. */
export interface RemoteTunnelTarget {
  /** Address literal the Host bound. */
  readonly host: string
  /** Port the Host listened on. */
  readonly port: number
}

/** Construction inputs and test seams. */
export interface RemoteTunnelOptions {
  /**
   * `cloudflared` candidates in order. A missing executable advances to the next
   * one, so a packaged application without the Homebrew PATH still finds a
   * user-installed binary at a conventional location.
   */
  readonly binaries: readonly string[]
  /** Reads the current Host listener, or undefined while the Host is not running. */
  readonly target: () => RemoteTunnelTarget | undefined
  /** Receives every state change. */
  readonly onChange: (state: RemoteTunnelState) => void
  /** Delay before restarting a tunnel that stopped on its own. Default: 5000 ms. */
  readonly restartDelayMs?: number
  /** Process factory; tests substitute a fake child. */
  readonly spawnProcess?: (command: string, args: readonly string[], options: SpawnOptions) => TunnelChild
}

/** Matches the quick-tunnel hostname cloudflared prints on startup. */
const TUNNEL_ROUTE = /https:\/\/([a-z0-9-]+\.trycloudflare\.com)/u

const DEFAULT_RESTART_DELAY_MS = 5_000

/**
 * Start one cloudflared quick tunnel.
 * @param command - executable name or path.
 * @param args - arguments after the executable.
 * @param options - Node spawn options for the child.
 * @returns the running child as the supervisor's minimal surface.
 */
function launchCloudflared(command: string, args: readonly string[], options: SpawnOptions): TunnelChild {
  return spawn(command, [...args], options)
}

/** One supervised quick tunnel; never more than one child at a time. */
export class RemoteTunnel {
  private child: TunnelChild | undefined
  private restart: ReturnType<typeof setTimeout> | undefined
  private candidate = 0
  private enabled = false
  private current: RemoteTunnelState = { phase: 'off' }

  /** @param options - binary, Host target, change sink, and test seams. */
  constructor(private readonly options: RemoteTunnelOptions) {}

  /** @returns the last published state. */
  state(): RemoteTunnelState {
    return this.current
  }

  /** Enable the tunnel and start the first attempt. */
  start(): void {
    this.enabled = true
    this.begin()
  }

  /** Disable the tunnel, cancel a pending restart, and stop the child. */
  stop(): void {
    this.enabled = false
    if (this.restart !== undefined) clearTimeout(this.restart)
    this.restart = undefined
    this.endChild()
    this.publish({ phase: 'off' })
  }

  private begin(): void {
    const target = this.options.target()
    if (target === undefined) {
      this.publish({ phase: 'failed', message: 'the Desktop Host is not running yet' })
      this.scheduleRestart()
      return
    }
    this.publish({ phase: 'starting' })
    const spawnProcess = this.options.spawnProcess ?? launchCloudflared
    const binary = this.options.binaries[Math.min(this.candidate, this.options.binaries.length - 1)]
    if (binary === undefined) {
      this.fail('no cloudflared location is configured')
      return
    }
    const child = spawnProcess(binary, [
      'tunnel', '--no-autoupdate', '--url', `http://${target.host}:${String(target.port)}`,
    ], { stdio: ['ignore', 'pipe', 'pipe'] })
    this.child = child
    child.once('error', (error: NodeJS.ErrnoException) => {
      if (this.child === child) this.child = undefined
      if (error.code === 'ENOENT' && this.candidate < this.options.binaries.length - 1) {
        this.candidate += 1
        this.begin()
        return
      }
      this.fail(error.code === 'ENOENT'
        ? 'cloudflared was not found; install it (brew install cloudflared) and start the tunnel again'
        : `the tunnel could not start: ${error.message}`)
    })
    child.once('exit', (code, signal) => {
      if (this.child === child) this.child = undefined
      if (!this.enabled) return
      this.fail(signal === null
        ? `cloudflared exited with code ${String(code)}`
        : `cloudflared exited on ${signal}`)
    })
    for (const stream of [child.stdout, child.stderr]) {
      if (stream === null) continue
      createInterface({ input: stream }).on('line', (line) => {
        const host = TUNNEL_ROUTE.exec(line)?.[1]
        if (host !== undefined && this.enabled) this.publish({ phase: 'online', host })
      })
    }
  }

  /** Publish a failure and schedule the retry that keeps a long-lived link alive. */
  private fail(message: string): void {
    this.publish({ phase: 'failed', message })
    this.scheduleRestart()
  }

  private scheduleRestart(): void {
    if (!this.enabled || this.restart !== undefined) return
    this.restart = setTimeout(() => {
      this.restart = undefined
      if (this.enabled) this.begin()
    }, this.options.restartDelayMs ?? DEFAULT_RESTART_DELAY_MS)
  }

  private endChild(): void {
    const child = this.child
    this.child = undefined
    if (child === undefined) return
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM')
  }

  private publish(state: RemoteTunnelState): void {
    this.current = state
    this.options.onChange(state)
  }
}
