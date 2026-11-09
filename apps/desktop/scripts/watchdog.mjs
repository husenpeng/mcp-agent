#!/usr/bin/env node
/**
 * Process keeper for Tomato Remote.
 *
 * The Desktop Host cannot supervise itself: a hung or crashed Host leaves a
 * paired phone with no way back, and a phone cannot tell "the Mac is asleep",
 * "the app crashed", and "the network is down" apart from the outside. This
 * process runs under launchd beside the application, answers liveness on a
 * separate loopback port, and restarts or stops the application through
 * `launchctl`.
 *
 * Run it as a launchd agent (`apps/desktop/launchd/ai.tomato.watchdog.plist`)
 * so it survives both the application and a login session boundary:
 *
 *   node apps/desktop/scripts/watchdog.mjs
 *
 * Environment:
 *   TOMATO_WATCHDOG_PORT         listen port, default 43111
 *   TOMATO_HUB_PORT              the Desktop Host loopback port, default 43110
 *   TOMATO_DESKTOP_LAUNCH_LABEL  launchd job label, default ai.tomato.desktop
 *   TOMATO_WATCHDOG_HOME         token directory, default ~/.tomato-watchdog
 * @module apps/desktop/scripts/watchdog
 */

import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { timingSafeEqual } from 'node:crypto'

const PORT = Number(process.env.TOMATO_WATCHDOG_PORT ?? 43_111)
const HUB_PORT = Number(process.env.TOMATO_HUB_PORT ?? 43_110)
const LABEL = process.env.TOMATO_DESKTOP_LAUNCH_LABEL ?? 'ai.tomato.desktop'
const HOME = process.env.TOMATO_WATCHDOG_HOME ?? join(homedir(), '.tomato-watchdog')
const TIMEOUT_MS = 2_000

/**
 * Create the bearer token on first run and reuse it afterwards.
 * @returns the shared secret this watchog accepts.
 */
function token() {
  mkdirSync(HOME, { recursive: true, mode: 0o700 })
  const path = join(HOME, 'token')
  try {
    const existing = readFileSync(path, 'utf8').trim()
    if (existing !== '') return existing
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const created = randomBytes(32).toString('hex')
  writeFileSync(path, `${created}\n`, { mode: 0o600, flag: 'w' })
  chmodSync(path, 0o600)
  return created
}

/**
 * Compare the presented credential with the shared secret in constant time.
 * @param presented - the raw `Authorization` header value, when present.
 * @param expected - the token this process issued.
 * @returns true only for an exact bearer match.
 */
function authorized(presented, expected) {
  if (typeof presented !== 'string' || !presented.startsWith('Bearer ')) return false
  const actual = Buffer.from(presented.slice('Bearer '.length), 'utf8')
  const wanted = Buffer.from(expected, 'utf8')
  return actual.byteLength === wanted.byteLength && timingSafeEqual(actual, wanted)
}

/**
 * Decide whether the Desktop Host is serving right now.
 *
 * Any HTTP response proves the listener is alive, including the 401 its index
 * route returns without a cookie; only a timeout or a refused connection says
 * anything about the process itself.
 * @param signal - cancellation for the probe.
 * @returns the observed state and, for a live listener, the HTTP status.
 */
async function probeHost(signal) {
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)])
  try {
    const response = await fetch(`http://127.0.0.1:${String(HUB_PORT)}/`, {
      method: 'HEAD',
      redirect: 'manual',
      signal: deadline,
    })
    return { state: 'running', status: response.status }
  } catch (error) {
    const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError'
    return { state: timedOut ? 'unresponsive' : 'stopped' }
  }
}

/**
 * Run one `launchctl` subcommand.
 * @param argv - arguments after the binary name.
 * @returns the exit code, or a failure description.
 */
function launchctl(argv) {
  return new Promise((resolve) => {
    const child = spawn('launchctl', argv, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('error', (error) => { resolve({ code: -1, reason: error.message }) })
    child.on('close', (code) => { resolve(code === 0 ? { code: 0 } : { code: code ?? -1, reason: stderr.trim() }) })
  })
}

/**
 * Write one JSON response.
 * @param response - the response to complete.
 * @param status - HTTP status code.
 * @param body - JSON-serialisable payload.
 */
function send(response, status, body) {
  const payload = JSON.stringify(body)
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'cache-control': 'no-store',
  })
  response.end(payload)
}

const secret = token()
const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://watchdog.invalid')
  void (async () => {
    if (url.pathname === '/health') {
      if (request.method !== 'GET' && request.method !== 'HEAD') { send(response, 405, { ok: false }); return }
      const controller = new AbortController()
      request.on('close', () => { controller.abort() })
      send(response, 200, { pid: process.pid, ...await probeHost(controller.signal) })
      return
    }
    if (url.pathname === '/restart' || url.pathname === '/stop') {
      if (request.method !== 'POST') { send(response, 405, { ok: false }); return }
      if (!authorized(request.headers.authorization, secret)) {
        send(response, 401, { ok: false, error: { code: 'unauthorized' } })
        return
      }
      const domain = `gui/${String(process.getuid())}/${LABEL}`
      // `kickstart -k` kills a hung job and restarts it; `kill TERM` stops one and
      // leaves it stopped until the next login.
      const outcome = url.pathname === '/restart'
        ? await launchctl(['kickstart', '-k', domain])
        : await launchctl(['kill', 'SIGTERM', domain])
      send(response, outcome.code === 0 ? 200 : 502, outcome.code === 0
        ? { ok: true }
        : { ok: false, error: { code: 'launchctl-failed', message: outcome.reason ?? 'launchctl exited non-zero' } })
      return
    }
    send(response, 404, { ok: false })
  })()
})
server.listen(PORT, '127.0.0.1', () => {
  console.log(`tomato watchdog: listening on 127.0.0.1:${String(PORT)}, watching ${LABEL} on port ${String(HUB_PORT)}`)
})
