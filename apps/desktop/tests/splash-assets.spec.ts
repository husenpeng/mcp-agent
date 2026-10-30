import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SPLASH_IPC } from '../src/splash-api.ts'

const root = join(import.meta.dirname, '..')
const html = readFileSync(join(root, 'renderer', 'splash.html'), 'utf8')
const css = readFileSync(join(root, 'renderer', 'splash.css'), 'utf8')
const client = (name: string): string => readFileSync(join(root, 'src', 'client', name), 'utf8')
const scene = client('splash-scene.ts')
const mark = client('splash-mark.ts')
const post = client('splash-post.ts')
const welcomeBrand = readFileSync(join(root, 'renderer', 'assets', 'welcome-brand.svg'), 'utf8')

describe('splash document assets', () => {
  it('loads only local resources under the same content policy as the welcome document', () => {
    expect(html).toContain("default-src 'none'")
    expect(html).toContain("script-src 'self'")
    expect(html).toContain('href="splash.css"')
    expect(html).toContain('src="../lib/splash/splash.js"')
    expect(html).toContain('href="../lib/welcome/brand-font.css"')
    for (const tag of html.match(/<script\b[^>]*>/gu) ?? []) expect(tag).toContain('src=')
  })

  it('builds the brand as extruded WebGL geometry from the shared Tomato path and lights it over a bloom pass', () => {
    expect(scene).toContain("from 'three'")
    expect(mark).toContain("from '@tomato/brand/src/client/mark.ts'")
    expect(mark).toContain('TOMATO_MARK_PATH')
    expect(mark).toContain('new THREE.ExtrudeGeometry')
    expect(mark).toContain('bevelEnabled: true')
    expect(post).toContain('new UnrealBloomPass')
    // Bloom never spreads a non-finite pixel, and the grade sharpens instead of splitting colour channels.
    expect(post).toContain('isnan(color)')
    expect(post).toContain('SHARPEN_PEAK')
    expect(post).not.toContain('fringe')
    expect(scene).toContain('splashCityLayout()')
    expect(scene).toContain('splashCameraAt(')
    expect(scene).toContain('createMarkGeometry(')
    expect(html).toContain('<canvas id="city-3d"')
    expect(html).toContain('<title>Tomato AI</title>')
  })

  it('sets the accessible brand name in the shared geometric typeface without localizing it', () => {
    expect(welcomeBrand).toContain('>Tomato AI</text>')
    expect(html).toContain('src="assets/welcome-brand.svg"')
    expect(html).toContain('class="wordmark"')
    expect(html).toContain('aria-label="Tomato AI"')
    expect(html).toContain('translate="no"')
    expect(html).toContain('<span class="wordmark-name" data-text="TOMATO">TOMATO</span><span class="wordmark-ai">AI</span>')
    expect(css).toMatch(/\.wordmark \{[^}]*font-family|font-family: 'Montserrat'/u)
    expect(css).toMatch(/\.wordmark \{[^}]*font-weight: 500/u)
  })

  it('uses a spatial city shot without the rejected flat skyline, rings, flashes, or camera shake', () => {
    expect(html).toContain('class="cinematic-vignette"')
    expect(html).toContain('CONSTRUCT // 001')
    expect(html).toContain('CITY LINK ESTABLISHED')
    expect(html).not.toContain('class="cityscape"')
    expect(html).not.toContain('target-ring')
    expect(html).not.toContain('shockwave')
    expect(html).not.toContain('impact-flash')
    expect(css).toContain('--boot-red: #ff2828')
    expect(css).toContain('--boot-cyan: #55e6ff')
    expect(css).not.toContain('encounter-impact')
    expect(css).not.toContain('city-far-in')
  })

  it('defines static fallback, reduced-motion, and forced-colors frames', () => {
    expect(css).toContain('--splash-canvas: #030105')
    expect(css).toContain('--splash-ink: #f4f6f7')
    expect(css).toContain("html[data-scene='fallback'] .fallback-brand")
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('@media (forced-colors: active)')
    expect(css).toContain("html[data-splash='done']")
  })

  it('reports completion over the one splash channel only', () => {
    const preload = readFileSync(join(root, 'src', 'preload-splash.ts'), 'utf8')
    const renderer = readFileSync(join(root, 'src', 'client', 'splash.ts'), 'utf8')
    expect(SPLASH_IPC.animationDone).toBe('tomato-desktop:splash-animation-done')
    expect(preload).toContain("exposeInMainWorld('tomatoSplash'")
    expect(preload).toContain('SPLASH_IPC.animationDone')
    expect(renderer).toContain('notifyAnimationDone')
    expect(renderer).toContain('scene.finish()')
    expect(renderer).toContain('keydown')
    expect(renderer).toContain("'Escape'")
  })
})
