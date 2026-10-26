/** Built Desktop Host acceptance; run after the repository build, without provider credentials. */

import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DesktopHostProcess } from '../src/host-process.ts'
import { DesktopProjectManager } from '../src/project-manager.ts'
import { resolveDesktopPaths } from '../src/paths.ts'
import { connectDesktopWelcome } from '../src/welcome-backend.ts'
import { DESKTOP_HOST_PROTOCOL_VERSION } from '../src/host-protocol.ts'
import { prepareDevelopmentProject } from '../scripts/development-project.ts'

const repository = fileURLToPath(new URL('../../../', import.meta.url))
const builtHost = join(repository, 'apps/desktop-host/lib/index.js')
afterEach(() => { vi.unstubAllEnvs() })

function version(path: string): string {
  return (JSON.parse(readFileSync(path, 'utf8')) as { version: string }).version
}

/** Stand-in login service: session verification and the desktop token exchange. */
async function mockAuth() {
  const sessions = new Set(['session-test'])
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    let body = ''
    req.setEncoding('utf8')
    req.on('data', (chunk: string) => { body += chunk })
    req.on('end', () => {
      if (url.pathname === '/api/v1/auth/session/verify') {
        const parsed = JSON.parse(body) as { sessionId?: string }
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ valid: sessions.has(parsed.sessionId ?? '') }))
        return
      }
      if (url.pathname === '/api/v1/auth/desktop/token' && req.method === 'POST') {
        const parsed = JSON.parse(body) as { sessionId?: string }
        if (!sessions.has(parsed.sessionId ?? '')) { res.writeHead(401).end(); return }
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ token: `token-${String(Date.now())}` }))
        return
      }
      res.writeHead(404).end()
    })
  })
  await new Promise<void>((resolve) => { server.listen(0, '127.0.0.1', () => { resolve() }) })
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('missing mock listener')
  return {
    origin: `http://127.0.0.1:${String(address.port)}`,
    close: () => new Promise<void>((resolve) => { server.close(() => { resolve() }); server.closeAllConnections() }),
  }
}

describe.skipIf(!existsSync(builtHost))('built Desktop welcome flow', () => {
  it('persists locale preference and the relay credential the shell writes', async () => {
    vi.stubEnv('DSH_CLIENT_VERSION', '1.2.3')
    const root = mkdtempSync(join(tmpdir(), 'tomato-desktop-welcome-'))
    let host: DesktopHostProcess | undefined
    const auth = await mockAuth()
    try {
      for (const name of Object.keys(process.env)) {
        if (/KEY|TOKEN|SECRET|PASSWORD/u.test(name)) vi.stubEnv(name, undefined)
      }
      const home = join(root, 'home')
      mkdirSync(home)
      vi.stubEnv('DSH_HOME', home)
      vi.stubEnv('TOMATO_AUTH_URL', auth.origin)
      const project = prepareDevelopmentProject({
        projectDir: join(root, 'project'),
        cliDir: join(repository, 'apps/cli'),
        hostDir: join(repository, 'apps/desktop-host'),
        dependencyDir: join(repository, 'node_modules/.pnpm/node_modules'),
        release: {
          schemaVersion: 1,
          version: version(join(repository, 'apps/desktop/package.json')),
          pnpmVersion: version(join(repository, 'apps/desktop/node_modules/pnpm/package.json')),
          nodeVersion: process.versions.node,
          hostProtocolVersion: DESKTOP_HOST_PROTOCOL_VERSION,
        },
        target: 'mac-x64',
      })
      cpSync(join(repository, 'packages/skill/skill-office/assets'), join(root, 'runtime/office-skills'), { recursive: true })
      const nodeBin = join(root, 'runtime/primary-runtime/dependencies/node/bin')
      mkdirSync(nodeBin, { recursive: true })
      cpSync(process.execPath, join(nodeBin, process.platform === 'win32' ? 'node.exe' : 'node'))
      const paths = resolveDesktopPaths(home)
      const manager = new DesktopProjectManager(paths, { dsh: project })
      await manager.applyRelease()
      writeFileSync(join(paths.profile, 'cordis.patch.yml'), '- id: webserver\n  config:\n    host: 127.0.0.1\n    port: 0\n')
      let backend: Awaited<ReturnType<typeof connectDesktopWelcome>> | undefined
      const restart = async (): Promise<void> => {
        await host?.stop()
        host = new DesktopHostProcess(process.execPath, project, paths.profile)
        const { url } = await host.start()
        const send: typeof fetch = (input, init) => fetch(input, init)
        backend = await connectDesktopWelcome(url, send)
      }
      await restart()
      expect(await backend!.read()).toMatchObject({ loggedIn: false, hasApiKey: false, localePreference: null })
      const credentials = join(home, '.credentials.yaml')
      const fingerprint = (): string => createHash('sha256').update(readFileSync(credentials)).digest('hex')
      await host!.stop()
      writeFileSync(join(paths.profile, 'cordis.patch.yml'),
        '- id: webserver\n  config:\n    host: 127.0.0.1\n    port: 0\n- id: locale\n  config:\n    preference: zh\n')
      await restart()
      expect(await backend!.read()).toMatchObject({ localePreference: 'zh' })
      // The shell writes the exchanged token into the credential store the relay route names.
      await expect(backend!.save('sk-local-onboarding-test')).rejects.toThrow()
      const before = existsSync(credentials) ? fingerprint() : 'absent'
      expect(await backend!.read()).toMatchObject({ loggedIn: false })
      await restart()
      expect(existsSync(credentials) ? fingerprint() : 'absent').toBe(before)
      await host!.stop(true)
    } finally {
      await host?.stop()
      await auth.close()
      rmSync(root, { recursive: true, force: true })
    }
  })
})
