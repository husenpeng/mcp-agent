// Keyless assembled-browser coverage for the Work Team layer: the work-team tab
// replaces the collaboration room, create-from-chat seeds the work_team_create
// prompt, and the work-team settings card is present in the Plugins page.
import { fileURLToPath } from 'node:url'
import type { Browser, Page } from 'playwright'
import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it, onTestFailed } from 'vitest'
import { launchWebScaffold, watchConsole, type WebScaffold } from './scaffold.ts'
import { connectFreshWorkspaceZh, saveFailureShot } from './support.ts'

const OVERLAY = fileURLToPath(new URL('./work-team-layer.overlay.yml', import.meta.url))
const INSTALL_ANCHORS = [
  fileURLToPath(new URL('../../../packages/experimental/tool-work-team/package.json', import.meta.url)),
  fileURLToPath(new URL('../../../packages/experimental/client-ui-settings-work-team/package.json', import.meta.url)),
  fileURLToPath(new URL('../../../packages/experimental/robot-local/package.json', import.meta.url)),
  fileURLToPath(new URL('../../../packages/experimental/experimental-robot-crew-local/package.json', import.meta.url)),
  fileURLToPath(new URL('../../../packages/experimental/experimental-robot-room-local/package.json', import.meta.url)),
  fileURLToPath(new URL('../../../packages/experimental/experimental-robot-room-remote/package.json', import.meta.url)),
  fileURLToPath(new URL('../../../packages/api/api-robot-room-controller/package.json', import.meta.url)),
  fileURLToPath(new URL('../../../packages/client/client-ui-robot-room/package.json', import.meta.url)),
]

describe('web e2e: work team layer', () => {
  let scaffold: WebScaffold
  let browser: Browser
  let page: Page
  let tripwire: ReturnType<typeof watchConsole>

  beforeAll(async () => {
    scaffold = await launchWebScaffold({ extraOverlayPath: OVERLAY, extraInstallAnchors: INSTALL_ANCHORS })
    browser = await chromium.launch({ channel: 'chrome' })
    page = await browser.newPage({ viewport: { width: 1440, height: 950 }, locale: 'zh-CN', timezoneId: 'Asia/Shanghai' })
    tripwire = watchConsole(page)
    await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
    await page.waitForSelector('[class*="frame"]', { timeout: 30_000 })
    for (const name of ['继续', 'Continue']) {
      const notice = page.getByRole('button', { name, exact: true })
      if (await notice.count() > 0) { await notice.first().click(); break }
    }
    await connectFreshWorkspaceZh(page, scaffold.workspaceCwd)
    await page.addStyleTag({ content: '[data-system-monitor-pill]{display:none!important}' })
  }, 120_000)

  afterAll(async () => {
    await browser?.close()
    await scaffold?.close()
  })

  it('replaces the collaboration room with the work-team tab and seeds chat creation', async () => {
    onTestFailed(() => saveFailureShot(page, 'web-e2e-work-team-layer'))
    const tab = page.getByRole('button', { name: '工作团队', exact: true }).first()
    await tab.waitFor({ timeout: 20_000 })
    expect(await page.getByRole('button', { name: '协作空间', exact: true }).count()).toBe(0)

    await tab.click()
    await page.waitForTimeout(1000)
    const createBtn = page.getByRole('button', { name: /通过对话创建|Create from chat/u }).first()
    await createBtn.waitFor({ timeout: 10_000 })
    await createBtn.click()
    await page.waitForTimeout(1200)
    const draft = await page.locator('[data-composer-input]').first().innerText()
    expect(draft).toContain('work_team_create')
    expect(tripwire.pageErrors).toEqual([])
  })

  it('shows the work-team settings card in the Plugins page', async () => {
    onTestFailed(() => saveFailureShot(page, 'web-e2e-work-team-settings'))
    await page.getByRole('button', { name: '插件', exact: true }).first().click()
    await page.waitForTimeout(1500)
    const settingsDesc = page.getByText('设置工作团队新建机器人的默认配置', { exact: false }).first()
    expect(await settingsDesc.count()).toBeGreaterThan(0)
    expect(tripwire.pageErrors).toEqual([])
  })
})
