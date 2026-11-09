// Builds client.js, the browser half, from src/client.
//
//   node scripts/build-client.mjs           writes client.js
//   node scripts/build-client.mjs --check   exits 1 when client.js differs from a fresh build
//
// Tomato loads it as a classic script; the wrapper mirrors the shell's own client
// bundles: `require` resolves the shell-seeded platform modules (react, react-dom,
// ui-primitives), which therefore stay external.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const PLUGIN = dirname(dirname(fileURLToPath(import.meta.url)))
const OUTPUT = join(PLUGIN, 'client.js')
const PLATFORM_MODULES = ['react', 'react-dom', '@tomato/client-ui-primitives']

export async function bundleClient() {
  const result = await build({
    absWorkingDir: PLUGIN,
    entryPoints: ['src/client/index.jsx'],
    bundle: true,
    format: 'cjs',
    jsx: 'automatic',
    platform: 'browser',
    target: 'es2022',
    external: PLATFORM_MODULES,
    treeShaking: false,
    charset: 'utf8',
    write: false,
    logLevel: 'silent',
  })
  if (result.warnings.length > 0) throw new Error(`esbuild warnings:\n${result.warnings.map(warning => warning.text).join('\n')}`)
  return [
    '// Generated from src/client by `npm run build` (scripts/build-client.mjs). Do not edit by hand.',
    'window.__ModuleLoader__.load({',
    "  id: 'tomato-campaign',",
    '  factory: (require) => {',
    'const module = { exports: {} }',
    result.outputFiles[0].text.trimEnd(),
    "return Object.defineProperty({ ...module.exports }, Symbol.toStringTag, { value: 'Module' })",
    '  },',
    '})',
    '',
  ].join('\n')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const next = await bundleClient()
  if (process.argv.includes('--check')) {
    let current = null
    try { current = readFileSync(OUTPUT, 'utf8') } catch { /* missing counts as stale */ }
    if (current !== next) {
      console.error('client.js is stale: run `npm run build` in the plugin')
      process.exit(1)
    }
  } else {
    writeFileSync(OUTPUT, next)
  }
}