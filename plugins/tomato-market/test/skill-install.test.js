import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MARKER_FILE, createSkillInstaller, skillFiles } from '../src/host/skill-install.js'

const COMMIT = 'c'.repeat(40)
const entry = (id = 'pack', skills = [{ name: 'one', path: 'skills/one' }, { name: 'two', path: 'skills/two' }]) => ({
  id, install: { type: 'skill', repo: 'o/r', commit: COMMIT, skills },
})
const FILES = [
  { name: '/README.md', size: 1 },
  { name: '/skills/one/SKILL.md', size: 5 },
  { name: '/skills/one/references/a b.md', size: 3 },
  { name: '/skills/two/SKILL.md', size: 5 },
  { name: '/skills/three/notes.md', size: 5 },
]

async function bench(run, { fail } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'tomato-market-skill-'))
  const skillRoot = join(directory, 'skills')
  const reads = []
  const installer = createSkillInstaller({
    skillRoot,
    readJson: async () => ({ value: { files: FILES } }),
    readBytes: async (url) => {
      reads.push(url)
      if (fail !== undefined && url.includes(fail)) throw new Error('offline')
      return { bytes: new TextEncoder().encode('body') }
    },
  })
  try {
    await run({ installer, skillRoot, reads })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

test('skillFiles selects one directory and requires SKILL.md', () => {
  assert.deepEqual(skillFiles(FILES, 'skills/one').map(file => file.path), ['SKILL.md', 'references/a b.md'])
  assert.deepEqual(skillFiles([{ name: '/SKILL.md' }, { name: '/x/y.md' }], '').map(file => file.path), ['SKILL.md'])
  assert.throws(() => skillFiles(FILES, 'skills/three'), /no SKILL.md/)
  assert.throws(() => skillFiles([{ name: '/s/SKILL.md', size: 5 * 1024 * 1024 }], 's'), /larger than/)
})

test('install copies the pinned files and marks each directory', async () => {
  await bench(async ({ installer, skillRoot, reads }) => {
    assert.deepEqual(await installer.install(entry()), { skills: ['one', 'two'] })
    assert.equal(await readFile(join(skillRoot, 'one', 'references', 'a b.md'), 'utf8'), 'body')
    const marker = JSON.parse(await readFile(join(skillRoot, 'one', MARKER_FILE), 'utf8'))
    assert.deepEqual([marker.entry, marker.commit, marker.path], ['pack', COMMIT, 'skills/one'])
    assert.ok(reads.every(url => url.startsWith(`https://cdn.jsdelivr.net/gh/o/r@${COMMIT}/skills/`)))
    assert.ok(reads.some(url => url.endsWith('references/a%20b.md')))
    assert.deepEqual([...(await installer.installed())], [['pack', ['one', 'two']]])
    assert.deepEqual((await readdir(skillRoot)).filter(name => name.startsWith('.')), [])
  })
})

test('a failed download leaves the skill root unchanged', async () => {
  await bench(async ({ installer, skillRoot }) => {
    await assert.rejects(installer.install(entry()), /offline/)
    assert.deepEqual(await readdir(skillRoot), [])
  }, { fail: 'skills/two' })
})

test('a skill the user wrote is neither overwritten nor removed', async () => {
  await bench(async ({ installer, skillRoot }) => {
    await mkdir(join(skillRoot, 'one'), { recursive: true })
    await writeFile(join(skillRoot, 'one', 'SKILL.md'), 'mine')
    assert.deepEqual(await installer.conflicts(entry()), ['one'])
    await assert.rejects(installer.install(entry()), /already exist.*one/)
    assert.deepEqual(await installer.uninstall(entry()), { skills: [] })
    assert.equal(await readFile(join(skillRoot, 'one', 'SKILL.md'), 'utf8'), 'mine')
  })
})

test('a flat skill file of the same name conflicts', async () => {
  await bench(async ({ installer, skillRoot }) => {
    await mkdir(skillRoot, { recursive: true })
    await writeFile(join(skillRoot, 'two.md'), 'mine')
    assert.deepEqual(await installer.conflicts(entry()), ['two'])
  })
})

test('another entry\'s directory conflicts; reinstalling your own does not', async () => {
  await bench(async ({ installer, skillRoot }) => {
    await installer.install(entry())
    assert.deepEqual(await installer.conflicts(entry('other')), ['one', 'two'])
    await writeFile(join(skillRoot, 'one', 'stale.md'), 'old')
    await installer.install(entry())
    await assert.rejects(stat(join(skillRoot, 'one', 'stale.md')), { code: 'ENOENT' })
  })
})

test('uninstall removes only marked directories', async () => {
  await bench(async ({ installer, skillRoot }) => {
    await installer.install(entry())
    await rm(join(skillRoot, 'two', MARKER_FILE))
    assert.deepEqual(await installer.uninstall(entry()), { skills: ['one'] })
    assert.deepEqual(await readdir(skillRoot), ['two'])
  })
})

test('an absent skill root reads as nothing installed', async () => {
  await bench(async ({ installer }) => {
    assert.equal((await installer.installed()).size, 0)
    assert.deepEqual(await installer.conflicts(entry()), [])
  })
})
