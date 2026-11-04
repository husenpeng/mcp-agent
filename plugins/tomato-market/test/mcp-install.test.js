import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as yaml from 'js-yaml'
import { createMcpInstaller, envExpression, marketRows, mcpRow, onPath, renderWithRows } from '../src/host/mcp-install.js'

const entry = (id = 'one', extra = {}) => ({ id, install: { type: 'mcp', runner: 'npx', package: `pkg-${id}`, version: '1.0.0' }, ...extra })
const USER_FILE = `# my notes
- id: llm-pi-ai
  name: "@tomato/llm-pi-ai"
  config:
    apiKey: !!js process.env.SECRET
    models: &shared
      - a
`

async function withFile(text, run) {
  const directory = await mkdtemp(join(tmpdir(), 'tomato-market-mcp-'))
  const patchPath = join(directory, 'cordis.patch.yml')
  try {
    if (text !== undefined) await writeFile(patchPath, text)
    await run(patchPath, directory)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

test('install keeps the user text byte for byte and uninstall restores it', async () => {
  await withFile(USER_FILE, async (patchPath, directory) => {
    const installer = createMcpInstaller({ patchPath })
    await installer.install(entry('one'))
    await installer.install(entry('two'))
    const installed = await readFile(patchPath, 'utf8')
    assert.ok(installed.startsWith(USER_FILE))
    assert.deepEqual(await installer.installed(), ['one', 'two'])
    await installer.uninstall('one')
    assert.deepEqual(await installer.installed(), ['two'])
    await installer.uninstall('two')
    assert.equal(await readFile(patchPath, 'utf8'), USER_FILE)
    assert.ok((await readdir(directory)).includes('cordis.patch.yml.bak-tomato-market'))
    assert.ok(!(await readdir(directory)).some(name => name.endsWith('.tmp')))
  })
})

test('the template empty layer stays loadable through install and uninstall', async () => {
  const template = '# Your patch layer\n[]\n'
  await withFile(template, async (patchPath) => {
    const installer = createMcpInstaller({ patchPath })
    await installer.install(entry())
    const installed = await readFile(patchPath, 'utf8')
    assert.ok(Array.isArray(yaml.load(installed.replace(/!!js.*/g, '""'))))
    assert.doesNotMatch(installed, /^\[\]$/m)
    await installer.uninstall('one')
    assert.equal(await readFile(patchPath, 'utf8'), template)
  })
})

test('a missing file is created and never ends up empty', async () => {
  await withFile(undefined, async (patchPath) => {
    const installer = createMcpInstaller({ patchPath })
    await installer.install(entry())
    await installer.uninstall('one')
    assert.equal(await readFile(patchPath, 'utf8'), '[]\n')
  })
})

test('user entries added after the market block survive', async () => {
  await withFile(USER_FILE, async (patchPath) => {
    const installer = createMcpInstaller({ patchPath })
    await installer.install(entry())
    const tail = '- id: later\n  disabled: true\n'
    await writeFile(patchPath, `${await readFile(patchPath, 'utf8')}${tail}`)
    await installer.install(entry('two'))
    assert.ok((await readFile(patchPath, 'utf8')).endsWith(tail))
    await installer.uninstall('one')
    await installer.uninstall('two')
    assert.equal(await readFile(patchPath, 'utf8'), `${USER_FILE}${tail}`)
  })
})

test('a refused change restores the exact bytes and reports why', async () => {
  await withFile(USER_FILE, async (patchPath) => {
    const applied = []
    const installer = createMcpInstaller({
      patchPath,
      profile: {
        run: operation => operation(),
        async apply(requiredIds) {
          applied.push(requiredIds)
          if (requiredIds.length > 0) throw new Error('bad row')
          return { application: 'applied', warnings: [] }
        },
      },
    })
    await assert.rejects(installer.install(entry()), /refused the change and was restored: bad row/)
    assert.equal(await readFile(patchPath, 'utf8'), USER_FILE)
    assert.deepEqual(applied, [['mkt-mcp-one'], []])
  })
})

test('a failed restore names the backup', async () => {
  await withFile(USER_FILE, async (patchPath) => {
    const installer = createMcpInstaller({
      patchPath,
      profile: { run: operation => operation(), apply: async () => { throw new Error('down') } },
    })
    await assert.rejects(installer.install(entry()), /restoring it failed; the previous file is .*bak-tomato-market: down/)
  })
})

test('concurrent installs keep every row', async () => {
  await withFile(USER_FILE, async (patchPath) => {
    const installer = createMcpInstaller({ patchPath })
    await Promise.all(['a', 'b', 'c', 'd'].map(id => installer.install(entry(id))))
    assert.deepEqual((await installer.installed()).sort(), ['a', 'b', 'c', 'd'])
  })
})

test('rows outside the market block are refused, not rewritten', async () => {
  const text = `${USER_FILE}- insert:\n    - id: mkt-mcp-one\n      name: mine\n`
  await withFile(text, async (patchPath) => {
    const installer = createMcpInstaller({ patchPath })
    await assert.rejects(installer.uninstall('one'), /outside the tomato-market block/)
    await assert.rejects(installer.install(entry()), /outside the tomato-market block/)
    assert.equal(await readFile(patchPath, 'utf8'), text)
  })
})

test('a hand-edited block stops the write', async () => {
  await withFile(USER_FILE, async (patchPath) => {
    const installer = createMcpInstaller({ patchPath })
    await installer.install(entry())
    const edited = (await readFile(patchPath, 'utf8')).replace('mkt-mcp-one', 'mine')
    await writeFile(patchPath, edited)
    await assert.rejects(installer.install(entry('two')), /edited by hand/)
    assert.equal(await readFile(patchPath, 'utf8'), edited)
    await writeFile(patchPath, edited.replace('# tomato-market: end of marketing MCP servers.\n', ''))
    await assert.rejects(installer.install(entry('two')), /lost its end comment/)
  })
})

test('env rows carry names through an expression, never values', () => {
  const row = mcpRow(entry('one', { env: ['RESEND_API_KEY'] }))
  assert.equal(row.config.env.__jsExpr, envExpression(['RESEND_API_KEY']))
  process.env.TOMATO_MARKET_TEST_KEY = 'value'
  // eslint-disable-next-line no-new-func
  const evaluated = new Function(`return ${envExpression(['TOMATO_MARKET_TEST_KEY', 'TOMATO_MARKET_UNSET'])}`)()
  delete process.env.TOMATO_MARKET_TEST_KEY
  assert.deepEqual(evaluated, { TOMATO_MARKET_TEST_KEY: 'value' })
  const text = renderWithRows('[]\n', [row])
  assert.match(text, /env: !!js /)
  assert.ok(marketRows(text).has('mkt-mcp-one'))
  assert.equal(mcpRow(entry()).config.env, undefined)
})

test('onPath finds executables on the given search path only', async () => {
  assert.equal(await onPath('node'), true)
  assert.equal(await onPath('node', { PATH: '' }), false)
})
