/** Load the packaged sqlite-vec extension under the Desktop Electron Node runtime. */

import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'

const root = resolve(process.argv[2] ?? '')
assert.ok(root, 'Pass the prepared resources/tomato directory')
const requireRuntime = createRequire(join(root, 'package.json'))
const { getLoadablePath } = requireRuntime('sqlite-vec')
const { DatabaseSync } = await import('node:sqlite')
const db = new DatabaseSync(':memory:', { allowExtension: true })
try {
  db.enableLoadExtension(true)
  const resolved = process.env.TOMATO_SQLITE_VEC_PATH ?? getLoadablePath()
// SQLite opens the file through the OS, outside Electron's patched filesystem, so an ASAR path must name its unpacked sibling.
const extension = resolved.includes('app.asar') && !resolved.includes('app.asar.unpacked')
  ? resolved.replace('app.asar', 'app.asar.unpacked')
  : resolved
  db.loadExtension(extension)
  db.exec('CREATE TABLE vectors (value BLOB NOT NULL)')
  const query = Buffer.from(new Float32Array([1, 0]).buffer)
  db.prepare('INSERT INTO vectors (value) VALUES (?)').run(query)
  const row = db.prepare('SELECT vec_distance_cosine(value, ?) AS distance FROM vectors').get(query)
  assert.equal(row.distance, 0)
  console.log(JSON.stringify({ sqliteVec: true, node: process.versions.node, extension }))
} finally {
  db.close()
}
