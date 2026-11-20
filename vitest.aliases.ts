/**
 * Workspace resolution shared by every Vitest lane: pin bare workspace names
 * and declared subpaths to `src/`, because Vite's package exports would load a
 * built `lib/` copy beside the source copy another import pulls in.
 */
import { existsSync, globSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Explicit workspace aliases built from `tsconfig.base.json`. Vite's package
 * exports win over the paths plugin for a workspace package's own name, so a
 * spec importing its package by name would load the built `lib/` copy beside the
 * source copy another import pulls in — two module singletons, two class
 * identities, one test failure. The aliases pin every bare workspace name to
 * `src/`, matching the paths facade's intent.
 */
export const workspaceAliases = ((): { find: RegExp; replacement: string }[] => {
  const raw = readFileSync(new URL('./tsconfig.base.json', import.meta.url), 'utf8')
    .replace(/^\s*\/\/.*$/gmu, '')
  const paths = (JSON.parse(raw) as { compilerOptions?: { paths?: Record<string, string[]> } })
    .compilerOptions?.paths ?? {}
  return Object.entries(paths)
    .filter(([, targets]) => targets.length === 1)
    .map(([name, [target]]) => ({
      find: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}$`),
      replacement: fileURLToPath(new URL(target!, new URL('./tsconfig.base.json', import.meta.url))),
    }))
})()

/**
 * Subpath aliases: package `exports` such as `./client` point at bundled `lib/`
 * files that expect the browser boot, so a Node-environment spec importing one
 * would execute browser-only code. Map each declared subpath to its `src/`
 * counterpart when that source exists, matching the paths facade's intent.
 */
export const subpathAliases = ((): { find: RegExp; replacement: string }[] => {
  const root = fileURLToPath(new URL('.', import.meta.url))
  const aliases: { find: RegExp; replacement: string }[] = []
  const groups = globSync('packages/*/*', { cwd: root })
  for (const group of groups) {
    const manifestPath = `${group}/package.json`
    if (!existsSync(manifestPath)) continue
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { name?: string; exports?: Record<string, unknown> }
    const name = manifest.name
    if (name === undefined || !name.startsWith('@tomato/') || manifest.exports === undefined) continue
    for (const subpath of Object.keys(manifest.exports)) {
      if (!subpath.startsWith('./') || subpath === './package.json' || subpath.includes('*')) continue
      const leaf = subpath.slice(2)
      const source = [`${root}${group}/src/${leaf}.ts`, `${root}${group}/src/${leaf}/index.ts`]
        .find(file => existsSync(file))
      if (source === undefined) continue
      aliases.push({
        find: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}/${leaf.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}$`),
        replacement: source,
      })
    }
  }
  return aliases
})()
