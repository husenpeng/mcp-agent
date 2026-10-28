/**
 * Apply the Tomato namespace rename to the vendored DS Bot fork.
 *
 * The rename itself is the repository's single-source-of-truth codemod
 * (`scripts/rescope-to-tomato.ts`), restricted to the package, environment,
 * identifier, and CLI layers. The prose layer stays off: this fork is a
 * third-party code copy and its user-facing copy is reviewed by hand.
 *
 * File names holding the old prefix are renamed too; the codemod rewrites the
 * import specifiers that point at them.
 *
 * Usage: `pnpm exec tsx plugins/ds-bot/scripts/tomato-codemod.ts`
 */

import { readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { rescopeTomatoText, type RescopeLayer } from '../../../scripts/rescope-to-tomato.ts'

const pluginDir = fileURLToPath(new URL('..', import.meta.url))
const layers = new Set<RescopeLayer>(['pkg', 'env', 'ident', 'cli'])

/** Files whose content is generated, vendored evidence, or not source text. */
const SKIP_FILES = new Set(['client.js', 'package-lock.json'])

/** Directories scanned for source text; everything else under the plugin is copied or generated. */
const SOURCE_DIRS = ['src', 'scripts', 'test']

let changedFiles = 0
let changedLines = 0

function rewrite(path: string): void {
  const result = rescopeTomatoText(readFileSync(path, 'utf8'), layers)
  if (result.lines === 0) return
  writeFileSync(path, result.text)
  changedFiles += 1
  changedLines += result.lines
}

function walk(dir: string): void {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      walk(path)
      continue
    }
    if (SKIP_FILES.has(name)) continue
    if (!['.js', '.mjs', '.json', '.yml'].includes(extname(name))) continue
    rewrite(path)
  }
}

for (const dir of SOURCE_DIRS) walk(join(pluginDir, dir))
for (const file of ['index.js', 'web-search.js', 'cordis.patch.yml', 'package.json']) {
  rewrite(join(pluginDir, file))
}

// The codemod renames import specifiers; the files they name must move with them.
for (const [from, to] of [
  ['src/host/dsh-update.js', 'src/host/tomato-update.js'],
  ['src/client/dsh-primitives.js', 'src/client/tomato-primitives.js'],
  ['src/client/dsh-offer.js', 'src/client/tomato-offer.js'],
  ['test/dsh-update.test.js', 'test/tomato-update.test.js'],
  ['test/dsh-offer.test.js', 'test/tomato-offer.test.js'],
]) {
  const source = join(pluginDir, from)
  try {
    statSync(source)
  } catch {
    continue
  }
  renameSync(source, join(pluginDir, to))
}

console.log(`tomato-codemod: ${changedLines} lines in ${changedFiles} files`)