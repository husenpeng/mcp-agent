import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SPLASH_IPC } from '../src/splash-api.ts'

const root = join(import.meta.dirname, '..')
const html = readFileSync(join(root, 'renderer', 'splash.html'), 'utf8')
const css = readFileSync(join(root, 'renderer', 'splash.css'), 'utf8')
const brandMark = readFileSync(join(root, '..', '..', 'packages', 'tomato', 'brand', 'src', 'client', 'mark.ts'), 'utf8')
const welcomeBrand = readFileSync(join(root, 'renderer', 'assets', 'welcome-brand.svg'), 'utf8')

function match(source: string, pattern: RegExp): string {
  const result = pattern.exec(source)
  if (result === null) throw new Error(`missing match for ${pattern.source}`)
  return result[1] ?? ''
}

describe('splash document assets', () => {
  it('loads only local resources under the same content policy as the welcome document', () => {
    expect(html).toContain("default-src 'none'")
    expect(html).toContain("script-src 'self'")
    expect(html).toContain('href="splash.css"')
    expect(html).toContain('src="../lib/splash/splash.js"')
    expect(html).toContain('href="../lib/welcome/brand-font.css"')
    for (const tag of html.match(/<script\b[^>]*>/gu) ?? []) expect(tag).toContain('src=')
  })

  it('draws the mark with the brand geometry and titles the window with the product name', () => {
    const brandPath = match(brandMark, /export const TOMATO_MARK_PATH = '([^']+)'/u)
    const paths = [...html.matchAll(/class="ink-(?:base|full)" d="([^"]+)"/gu)].map(result => result[1])
    expect(paths).toHaveLength(2)
    for (const path of paths) expect(path).toBe(brandPath)
    expect(html).toContain('viewBox="0 0 64 64"')
    expect(html).toContain('<title>Tomato AI</title>')
  })

  it('sets the accessible brand name in the shared geometric typeface without localizing it', () => {
    const welcomeName = match(welcomeBrand, /<text[^>]*>([^<]+)<\/text>/u)
    expect(welcomeName).toBe('Tomato AI')
    expect(html).toContain('class="wordmark"')
    expect(html).toContain('aria-label="Tomato AI"')
    expect(html).toContain('translate="no"')
    expect(html).toContain('<span class="wordmark-name">Tomato</span><span class="wordmark-ai">AI</span>')
    expect(css).toMatch(/\.wordmark \{[^}]*font-family: 'Montserrat'/u)
    expect(css).toMatch(/\.wordmark \{[^}]*font-weight: 500/u)
    expect(css).toContain('wordmark-in')
  })

  it('uses the brand-red palette in both color schemes and defines the reduced-motion final frame', () => {
    expect(css.match(/--splash-mark-start: #ff2828/gu)).toHaveLength(2)
    expect(css.match(/--splash-mark-end: #fe5042/gu)).toHaveLength(2)
    expect(css).toContain('--splash-canvas: #10070a')
    expect(css).toContain('--splash-ink: #fff7f4')
    expect(css).toContain('@media (prefers-color-scheme: dark)')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain("html[data-splash='done']")
  })

  it('reports completion over the one splash channel only', () => {
    const preload = readFileSync(join(root, 'src', 'preload-splash.ts'), 'utf8')
    const renderer = readFileSync(join(root, 'src', 'client', 'splash.ts'), 'utf8')
    expect(SPLASH_IPC.animationDone).toBe('tomato-desktop:splash-animation-done')
    expect(preload).toContain("exposeInMainWorld('tomatoSplash'")
    expect(preload).toContain('SPLASH_IPC.animationDone')
    expect(renderer).toContain('notifyAnimationDone')
    expect(renderer).toContain('keydown')
    expect(renderer).toContain("'Escape'")
  })
})
