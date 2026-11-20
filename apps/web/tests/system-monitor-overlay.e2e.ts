// Keyless assembled-browser coverage for the shipped system monitor overlay:
// the plugin is part of the Web bundle, so this run is its user-visible
// evidence outside the jsdom lane.
import type { Browser, Page } from 'playwright'
import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it, onTestFailed } from 'vitest'
import { launchWebScaffold, watchConsole, type WebScaffold } from './scaffold.ts'
import { newEnglishPage, saveFailureShot } from './support.ts'

describe('web e2e: system monitor overlay', () => {
  let scaffold: WebScaffold
  let browser: Browser
  let page: Page
  let tripwire: ReturnType<typeof watchConsole>

  beforeAll(async () => {
    scaffold = await launchWebScaffold()
    browser = await chromium.launch()
    page = await newEnglishPage(browser)
    tripwire = watchConsole(page)
    await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
    await page.waitForSelector('[class*="frame"]', { timeout: 30_000 })
    // A profile that has not seen the preview notice opens it over an inert
    // frame; a scaffolded profile may have dismissed it already.
    const notice = page.getByRole('button', { name: 'Continue', exact: true })
    await notice.waitFor({ timeout: 5_000 }).catch(() => undefined)
    if (await notice.count() > 0) await notice.click()
  }, 120_000)

  afterAll(async () => {
    await browser?.close()
    await scaffold?.close()
  })

  it('rests as a pill of live readings and opens the dashboard', async () => {
    onTestFailed(() => saveFailureShot(page, 'web-e2e-system-monitor'))
    // The pill waits for the first frame the Host samples over Remote.
    await page.waitForFunction(() => {
      const pill = document.querySelector('[data-system-monitor-pill]')
      return pill !== null && (pill.textContent ?? '').includes('%')
    }, undefined, { timeout: 20_000 })

    const pillText = await page.locator('[data-system-monitor-pill]').innerText()
    expect(pillText).toContain('CPU')
    expect(pillText).toContain('MEM')

    // The pill is a draggable group; its open control expands the card.
    await page.locator('[data-system-monitor-pill]').getByRole('button', { name: 'Open the system monitor' }).click()
    const card = page.locator('[data-system-monitor-card]')
    await card.waitFor({ timeout: 10_000 })
    // The card reports the sampled frame, not placeholder copy.
    expect(await card.getByText('Processor', { exact: true }).count()).toBe(1)
    expect(await card.getByText('live', { exact: true }).count()).toBe(1)

    // Pausing releases the shared stream; the control flips to resume.
    await card.getByRole('button', { name: 'Pause sampling' }).click()
    await card.getByRole('button', { name: 'Resume sampling' }).waitFor({ timeout: 5_000 })

    // Collapsing returns the pill and keeps the remembered offset.
    await card.getByRole('button', { name: 'Collapse the system monitor' }).click()
    await page.locator('[data-system-monitor-pill]').waitFor({ timeout: 5_000 })

    // The close control parks the monitor as a ball against the nearer edge.
    await page.locator('[data-system-monitor-pill]').getByRole('button', { name: 'Tuck to the edge' }).click()
    const ball = page.locator('[data-system-monitor-ball]')
    await ball.waitFor({ timeout: 5_000 })
    expect(await ball.getAttribute('data-edge')).toBe('right')
    expect((await ball.innerText()).trim()).toMatch(/^\d+%$/u)
    // The ball is 44px wide, half of it past the overlay's right edge: the overlay
    // layer spans the frame, so the ball's right edge sits one radius beyond it.
    const [right, layerRight, width] = await ball.evaluate((node) => {
      const rect = node.getBoundingClientRect()
      return [rect.right, node.parentElement?.getBoundingClientRect().right ?? 0, rect.width]
    })
    expect(width).toBe(44)
    expect(Math.round(right - layerRight)).toBe(22)

    // Clicking the ball returns the pill it came from.
    await ball.click()
    await page.locator('[data-system-monitor-pill]').waitFor({ timeout: 5_000 })
    expect(await page.locator('[data-system-monitor-ball]').count()).toBe(0)
    expect(tripwire.pageErrors).toEqual([])
    expect(tripwire.warnings).toEqual([])
  })
})
