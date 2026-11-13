/**
 * Ad-hoc sign and load the packaged sqlite-vec extension.
 *
 * This checks that the dylib is signable with the hardened runtime and still
 * loads under the Desktop Electron Node runtime. It is not a release-signature
 * check: only a Developer ID identity with a secure timestamp satisfies the
 * signed-release verifier.
 */

import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

if (process.platform !== 'darwin') {
  console.log('sqlite-vec signature smoke: skipped (macOS only)')
  process.exit(0)
}

const root = resolve(process.argv[2] ?? 'apps/desktop/.desktop-build/targets/mac-arm64/tomato')
const electron = resolve(process.argv[3] ?? 'apps/desktop/.desktop-build/targets/mac-arm64/electron/Electron.app/Contents/MacOS/Electron')
const source = execFileSync('find', [join(root, 'node_modules'), '-path', '*/sqlite-vec-*/vec0.dylib', '-print'], {
  encoding: 'utf8',
}).trim().split('\n')[0]
if (source === undefined || source === '') throw new Error(`sqlite-vec extension not found under ${root}`)
const scratch = mkdtempSync(join(tmpdir(), 'sqlite-vec-signature-'))
const signed = join(scratch, 'vec0.dylib')
try {
  copyFileSync(source, signed)
  execFileSync('codesign', ['--force', '--options', 'runtime', '--timestamp=none', '--sign', '-', signed])
  execFileSync('codesign', ['--verify', '--strict', '--verbose=2', signed], { stdio: 'inherit' })
  const display = spawnSync('codesign', ['--display', '--verbose=4', signed], { encoding: 'utf8' })
  const details = `${display.stdout}${display.stderr}`
  if (!/flags=0x[0-9a-f]+\([^)]*\bruntime\b[^)]*\)/iu.test(details)) throw new Error('ad-hoc signature did not enable the hardened runtime')
  const output = execFileSync(electron, ['tests/fixtures/sqlite-vec-smoke.mjs', root], {
    cwd: resolve('apps/desktop'), encoding: 'utf8',
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', TOMATO_SQLITE_VEC_PATH: signed },
  })
  console.log(output.trim())
  console.log('sqlite-vec signature smoke: ad-hoc signature verified and loaded')
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
