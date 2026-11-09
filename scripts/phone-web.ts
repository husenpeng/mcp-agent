/**
 * Serve this checkout's Web GUI to a phone through a Cloudflare quick tunnel.
 *
 * A quick tunnel gets a random hostname on every start, and the `/api`
 * Host/Origin fence only admits authorities declared as `--trusted-host`.
 * The tunnel therefore comes up first, and the Web server starts afterwards
 * with that hostname, the same root as its advertised URL, and `--no-open`.
 * Restarting the pair mints a new hostname and a new launch token, so the URL
 * handed to the phone changes; an already-authenticated browser keeps its
 * cookie only for the old hostname.
 *
 * Usage: `pnpm run web:phone [--port 43299] [--bind 127.0.0.1] [--bin cloudflared]`.
 * `--bind` other than loopback also trusts `<bind>:<port>` for the local-network
 * leg; the default keeps the port on this machine and exposes only the tunnel.
 *
 * Shutdown: Ctrl+C stops the Web server and the tunnel; the Web server's own
 * exit code is mirrored, and a tunnel that dies first ends the pair with 1.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'

/** Repository root; the Web application launcher resolves against it. */
const REPO_ROOT = resolve(import.meta.dirname, '..')

/** Default loopback port, kept below the ephemeral range so restarts reuse it. */
const DEFAULT_PORT = 43_299

/** Hostname Cloudflare reports for a quick tunnel. */
const TUNNEL_ROUTE = /https:\/\/([a-z0-9-]+\.trycloudflare\.com)/u

/** How long the tunnel may take to report its hostname. */
const TUNNEL_TIMEOUT_MS = 30_000

/** Loopback address literals whose requests the connection fence admits without `--trusted-host`. */
const LOOPBACK_ADDRESS = /^(?:127\.\d+\.\d+\.\d+|::1|localhost)$/u

/** Resolved invocation of this script. */
export interface PhoneWebOptions {
  /** Loopback port the Web server listens on and the tunnel forwards to. */
  readonly port: number
  /** Address literal the Web server binds. */
  readonly bind: string
  /** `cloudflared` executable name or path. */
  readonly binary: string
}

/** A rejected command line; `main` prints it as usage and exits 2. */
export class UsageError extends Error {
  constructor() {
    super('usage: pnpm run web:phone [--port <1-65535>] [--bind <address>] [--bin <cloudflared path>]')
    this.name = 'UsageError'
  }
}

function usage(): never {
  throw new UsageError()
}

/**
 * Read this script's flags.
 * @param argv - arguments after the script name.
 * @param environment - process environment carrying the `CLOUDFLARED_BIN` fallback.
 * @returns the resolved invocation.
 */
export function parseOptions(argv: readonly string[], environment: NodeJS.ProcessEnv = process.env): PhoneWebOptions {
  let port = DEFAULT_PORT
  let bind = '127.0.0.1'
  let binary = environment.CLOUDFLARED_BIN ?? 'cloudflared'
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]
    const value = argv[index + 1]
    if (value === undefined || value.startsWith('--')) usage()
    switch (flag) {
      case '--port': {
        if (!/^\d+$/u.test(value)) usage()
        port = Number(value)
        if (port < 1 || port > 65_535) usage()
        break
      }
      case '--bind': bind = value; break
      case '--bin': binary = value; break
      default: usage()
    }
    index += 1
  }
  return { port, bind, binary }
}

/**
 * Extract the quick-tunnel hostname from one cloudflared line.
 * @param line - a line of cloudflared output.
 * @returns the bare `host` authority, or undefined for lines that carry none.
 */
export function tunnelHostFrom(line: string): string | undefined {
  return TUNNEL_ROUTE.exec(line)?.[1]
}

/**
 * Arguments for the Web application launcher.
 * @param options - resolved invocation.
 * @param hostname - the tunnel's hostname.
 * @returns the `node` arguments that start the Web profile behind that hostname.
 */
export function webArguments(options: PhoneWebOptions, hostname: string): string[] {
  return [
    '--import', 'tsx/esm', resolve(REPO_ROOT, 'apps/cli/src/bin.ts'),
    '--profile', 'web',
    '--host', options.bind,
    '--port', String(options.port),
    '--public-url', `https://${hostname}/`,
    '--trusted-host', hostname,
    ...LOOPBACK_ADDRESS.test(options.bind) ? [] : ['--trusted-host', `${options.bind}:${options.port}`],
    '--no-open',
  ]
}

/**
 * Wait for cloudflared to report its hostname.
 * @param tunnel - the running tunnel process.
 * @returns the hostname it announced.
 */
async function waitForHostname(tunnel: ChildProcess): Promise<string> {
  return new Promise<string>((resolveHostname, reject) => {
    const timer = setTimeout(() => {
      settle(undefined, new Error(`the tunnel did not report a hostname within ${String(TUNNEL_TIMEOUT_MS / 1000)}s`))
    }, TUNNEL_TIMEOUT_MS)
    const lines = (stream: NodeJS.ReadableStream | null): void => {
      if (stream === null) return
      createInterface({ input: stream }).on('line', (line) => {
        const hostname = tunnelHostFrom(line)
        if (hostname !== undefined) settle(hostname, undefined)
      })
    }
    const settle = (hostname: string | undefined, error: Error | undefined): void => {
      clearTimeout(timer)
      if (error === undefined && hostname !== undefined) resolveHostname(hostname)
      else reject(error ?? new Error('tunnel stopped before announcing a hostname'))
    }
    tunnel.once('error', (error: NodeJS.ErrnoException) => {
      settle(undefined, error.code === 'ENOENT'
        ? new Error(`could not start ${JSON.stringify(tunnel.spawnargs[0])}: install cloudflared (macOS: brew install cloudflared) or pass --bin`)
        : error)
    })
    tunnel.once('exit', (code) => { settle(undefined, new Error(`the tunnel exited with code ${String(code)}`)) })
    lines(tunnel.stdout)
    lines(tunnel.stderr)
  })
}

/**
 * Stop the tunnel and the Web server, then exit.
 * @param children - the processes to stop, Web server first.
 * @param code - process exit code.
 */
async function stop(children: readonly ChildProcess[], code: number): Promise<never> {
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM')
  }
  const deadline = Date.now() + 5_000
  while (children.some(child => child.exitCode === null && child.signalCode === null) && Date.now() < deadline) {
    await new Promise(resolveWait => setTimeout(resolveWait, 50))
  }
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
  }
  process.exit(code)
}

/** Start the tunnel, then the Web server behind it, and print the phone URL. */
async function main(): Promise<void> {
  let options: PhoneWebOptions
  try {
    options = parseOptions(process.argv.slice(2))
  } catch (error) {
    if (!(error instanceof UsageError)) throw error
    process.stderr.write(`${error.message}\n`)
    process.exit(2)
  }
  const tunnel = spawn(options.binary, [
    'tunnel', '--no-autoupdate', '--url', `http://${options.bind}:${options.port}`,
  ], { stdio: ['ignore', 'pipe', 'pipe'] })
  const hostname = await waitForHostname(tunnel).catch(async (error: unknown) => {
    await stop([tunnel], 1)
    throw error
  })

  const app = spawn(process.execPath, webArguments(options, hostname), {
    cwd: REPO_ROOT,
    stdio: ['inherit', 'pipe', 'pipe'],
  })
  const children = [app, tunnel]
  let announced = false
  const relay = (stream: NodeJS.ReadableStream | null): void => {
    if (stream === null) return
    createInterface({ input: stream }).on('line', (line) => {
      process.stdout.write(`${line}\n`)
      if (announced || !line.startsWith('tomato web: https://')) return
      announced = true
      process.stdout.write(`web:phone: tunnel ${hostname} is live; open the line above on the phone\n`)
    })
  }
  relay(app.stdout)
  relay(app.stderr)

  process.once('SIGINT', () => { void stop(children, 130) })
  process.once('SIGTERM', () => { void stop(children, 0) })

  const ending = await new Promise<string>((resolveEnd) => {
    app.once('exit', () => { resolveEnd('app') })
    tunnel.once('exit', () => { resolveEnd('tunnel') })
  })
  await stop(children, ending === 'app' ? (app.exitCode ?? 1) : 1)
}

if (import.meta.main) await main()
