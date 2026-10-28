// Web e2e scenario: the Skills tab lists names first, loads one selected
// skill's detail beside the list, and saves an edit to a personal skill file.
// The catalog is intentionally lazy: descriptions stay off the list request,
// and the detail pane reads `skills/get` only after a row is selected.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium, type Browser } from 'playwright'
import { expect, it, onTestFinished } from 'vitest'
import { launchWebScaffold, watchConsole, type WebScaffold } from './scaffold.ts'
import { connectFreshWorkspace, newEnglishPage } from './support.ts'

const SKILL = 'browser-demo'
const FILLER_COUNT = 30
const TOTAL = FILLER_COUNT + 1
const PAGE = 24

/** Write one skill file under a personal root. */
async function writeSkill(root: string, name: string, description: string, body: string, extra: readonly string[] = []): Promise<string> {
  const directory = join(root, name)
  await mkdir(directory, { recursive: true })
  const path = join(directory, 'SKILL.md')
  await writeFile(path, [
    '---',
    `name: ${name}`,
    `description: ${description}`,
    ...extra,
    '---',
    '',
    body,
    '',
  ].join('\n'))
  return path
}

it('browses names, loads the selected detail, and saves a personal edit', { timeout: 240_000 }, async () => {
  const resources: { browser?: Browser; scaffold?: WebScaffold } = {}
  onTestFinished(async () => {
    try { await resources.browser?.close() } finally { await resources.scaffold?.close() }
  })
  const scaffold = await launchWebScaffold()
  resources.scaffold = scaffold

  const personalRoot = join(scaffold.workspaceCwd, '.agents-home', 'skills')
  const skillPath = await writeSkill(
    personalRoot,
    SKILL,
    'Before the edit',
    '# Demo\n\nOriginal body.',
    ['whenToUse: When testing the panel', 'metadata:', '  owner: qa'],
  )
  await Promise.all(Array.from({ length: FILLER_COUNT }, (_, index) => {
    const name = `filler-${String(index).padStart(2, '0')}`
    return writeSkill(personalRoot, name, `${name} description`, `${name} body.`)
  }))

  const browser = await chromium.launch()
  resources.browser = browser
  const page = await newEnglishPage(browser)
  const tripwire = watchConsole(page)
  await page.setViewportSize({ width: 1680, height: 640 })
  await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
  await connectFreshWorkspace(page, scaffold.workspaceCwd)
  await page.getByRole('button', { name: 'Open right sidebar', exact: true }).click()

  const column = page.locator('[data-rightbar-col]')
  await column.locator('[data-sidebar-right-guide-entry="skills"]').click()
  await expect.poll(async () => await column.locator('[data-dockkit-tab-title]').allInnerTexts()).toEqual(['Skills'])

  const list = column.locator('[data-skills-list]')
  await expect.poll(async () => await list.locator('[data-skill-name]').count(), { timeout: 30_000 }).toBe(PAGE)
  expect(await list.getByText('Before the edit').count()).toBe(0)

  await list.locator('[data-skills-more]').scrollIntoViewIfNeeded()
  await expect.poll(async () => await list.locator('[data-skill-name]').count(), { timeout: 30_000 }).toBe(TOTAL)

  await list.locator(`[data-skill-name="${SKILL}"]`).click()
  const detail = column.locator('[data-skills-detail]')
  await detail.getByText('Before the edit').waitFor({ timeout: 30_000 })
  expect(await detail.getByText('When testing the panel').count()).toBe(1)
  expect(await detail.getByText('Original body.').count()).toBe(1)
  expect(await list.locator('[data-skill-name]').count()).toBe(TOTAL)
  expect(await list.locator(`[data-skill-name="${SKILL}"]`).getAttribute('data-skill-selected')).toBe('')

  await detail.getByRole('button', { name: 'Edit', exact: true }).click()
  await detail.getByLabel('Description', { exact: true }).fill('After the edit')
  await detail.getByLabel('Instructions', { exact: true }).fill('# Demo\n\nEdited body.')
  await detail.getByRole('button', { name: 'Save', exact: true }).click()
  await detail.getByText('After the edit').waitFor({ timeout: 30_000 })

  const text = await readFile(skillPath, 'utf8')
  expect(text).toContain('description: After the edit')
  expect(text).toContain('owner: qa')
  expect(text).toContain('Edited body.')
  expect(text).toContain('whenToUse: When testing the panel')

  await detail.getByRole('button', { name: 'Close', exact: true }).click()
  await detail.getByText('Select a skill to see its details.', { exact: true }).waitFor()
  expect(await list.locator('[data-skill-name]').count()).toBe(TOTAL)
  expect(tripwire.pageErrors).toEqual([])
})
