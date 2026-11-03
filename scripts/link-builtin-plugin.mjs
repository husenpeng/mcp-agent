// Link the repository's built-in plugin market into the installation node_modules.
// It is not a workspace package, so pnpm would otherwise leave it unreachable to
// the Desktop profile, whose `tomato.runtimePackages` declares it by name.
import { existsSync, lstatSync, rmSync, symlinkSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'plugins', 'tomato-market')
const link = join(root, 'node_modules', 'tomato-market')
if (existsSync(source) && existsSync(join(root, 'node_modules'))) {
  try { lstatSync(link); rmSync(link, { recursive: true, force: true }) } catch { /* absent */ }
  symlinkSync('../plugins/tomato-market', link, 'dir')
}
