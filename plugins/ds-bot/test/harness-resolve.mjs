// Tests import web-search.js outside a tomato profile, so its @tomato peers resolve from a
// Tomato Harness checkout, as a profile would supply them: TOMATO_HARNESS, else the nearest
// checkout above the plugin (this fork lives at <checkout>/plugins/ds-bot), else the packages
// `npm run harness` installs in dev/harness.
import { existsSync, readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const plugin = resolve(import.meta.dirname, '..')
const installed = join(plugin, 'dev', 'harness')

/** The nearest directory whose package.json declares the Tomato Harness root package. */
const findHarness = () => {
  if (process.env.TOMATO_HARNESS) return process.env.TOMATO_HARNESS
  for (let dir = dirname(plugin); ; dir = dirname(dir)) {
    const manifest = join(dir, 'package.json')
    if (existsSync(manifest)) {
      try {
        if (JSON.parse(readFileSync(manifest, 'utf8')).name === '@tomato/harness') return dir
      } catch {
        // An unreadable manifest is not the harness root; keep walking up.
      }
    }
    if (dirname(dir) === dir) break
  }
  if (existsSync(join(installed, 'node_modules'))) return installed
  return resolve(plugin, '../..')
}

const harness = findHarness()
// Tests that load other harness packages (jsdom) read the same checkout.
process.env.TOMATO_HARNESS = harness

// A checkout can resolve different peers from different composition roots: `apps/cli` carries
// the runtime surface, while `@tomato/web` and the client module system are declared by the
// Web bundle. Try each existing anchor in turn.
const anchors = ['apps/cli/package.json', 'packages/bundle/web-app/package.json', 'packages/bundle/base/package.json',
  'apps/desktop-host/package.json']
  .map(relative => resolve(harness, relative))
  .filter(existsSync)
  .map(path => pathToFileURL(path).href)
const pluginUrl = `${pathToFileURL(plugin).href}/`

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@tomato/') && context.parentURL?.startsWith(pluginUrl)) {
      for (const anchor of anchors) {
        try {
          return nextResolve(specifier, { ...context, parentURL: anchor })
        } catch {
          // This composition root does not declare the package; try the next one.
        }
      }
    }
    return nextResolve(specifier, context)
  },
})