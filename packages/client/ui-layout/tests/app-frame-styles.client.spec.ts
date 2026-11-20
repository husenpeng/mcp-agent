/** macOS frame surfaces: the sidebar keeps one warm colour in every window mode. */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const read = (path: string): string => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
const frameCss = read('../src/client/AppFrame.module.css')
const paletteCss = read('../../ui-theme/src/styles/design-platform.css')

const REDUCED_TRANSPARENCY = '(prefers-reduced-transparency: reduce)'

/**
 * Split a stylesheet into its unconditional rules and its `@media` blocks.
 * @param css - stylesheet text.
 * @returns the sheet without `@media` blocks, plus each block's query and body.
 */
function splitMedia(css: string): { plain: string; blocks: { query: string; body: string }[] } {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, ' ')
  let plain = ''
  const blocks: { query: string; body: string }[] = []
  for (let index = 0; index < withoutComments.length; index++) {
    if (!withoutComments.startsWith('@media', index)) {
      plain += withoutComments.charAt(index)
      continue
    }
    const opened = withoutComments.indexOf('{', index)
    let depth = 1
    let end = opened + 1
    for (; end < withoutComments.length && depth > 0; end++) {
      if (withoutComments[end] === '{') depth++
      else if (withoutComments[end] === '}') depth--
    }
    blocks.push({
      query: withoutComments.slice(index, opened).replace(/^@media\s*/u, '').trim(),
      body: withoutComments.slice(opened + 1, end - 1),
    })
    index = end - 1
  }
  return { plain, blocks }
}

/**
 * Declarations for one exact selector, merged across every matching rule.
 * @param css - stylesheet text.
 * @param selector - exact selector text.
 * @returns the normalized declarations, or undefined when the selector is absent.
 */
function declarations(css: string, selector: string): Map<string, string> | undefined {
  let found: Map<string, string> | undefined
  for (const [, selectorList = '', body = ''] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!selectorList.split(',').map(value => value.trim()).includes(selector)) continue
    found ??= new Map()
    for (const part of body.split(';')) {
      const colon = part.indexOf(':')
      if (colon === -1) continue
      found.set(part.slice(0, colon).trim(), part.slice(colon + 1).trim().replace(/\s+/g, ' '))
    }
  }
  return found
}

const sheet = splitMedia(frameCss)
const DARWIN_FRAME = ":global([data-platform='darwin']) .frame"
const SURFACE = 'var(--dsw-specific-sidebar-surface)'
const OPAQUE = `var(--tomato-sidebar-wash), ${SURFACE}`

describe('AppFrame.module.css macOS sidebar surface', () => {
  it('paints the darwin sidebar as a warm surface instead of a thin tint over the window material', () => {
    expect(declarations(sheet.plain, DARWIN_FRAME)?.get('background')).toBe('transparent')
    expect(declarations(sheet.plain, ":global([data-platform='darwin']) .sidebarCol")?.get('background'))
      .toBe('var(--tomato-sidebar-backing)')
  })

  it('draws the wash above a 94%-opaque surface so the desktop behind the window cannot swing the hue', () => {
    const frame = declarations(sheet.plain, DARWIN_FRAME)
    expect(frame?.get('--tomato-sidebar-wash')).toMatch(/^linear-gradient\(\s*to bottom,/)
    expect(frame?.get('--tomato-sidebar-backing'))
      .toBe(`var(--tomato-sidebar-wash), color-mix(in srgb, ${SURFACE} 94%, transparent)`)
  })

  it('keeps one warm wash per theme without a second translucent fill', () => {
    const dark = declarations(sheet.plain, ":global([data-platform='darwin']) :global([data-ds-dark-theme]) .frame")
    expect(dark?.get('--tomato-sidebar-wash')).toMatch(/^linear-gradient\(\s*to bottom,\s*rgb\(255 84 73 \/ 0\.06\)/)
    expect(dark?.get('--tomato-sidebar-backing')).toBeUndefined()
    expect(frameCss).not.toContain('color-mix(in srgb, var(--dsw-specific-sidebar-fill) 50%, transparent)')
  })

  it('paints the narrow drawer and Reduce Transparency with the same surface, opaque', () => {
    expect(declarations(sheet.plain, ":global([data-platform='darwin']) .frame[data-sidebar-drawer]")
      ?.get('--tomato-sidebar-backing')).toBe(OPAQUE)
    const [reduced] = sheet.blocks.filter(block => block.query === REDUCED_TRANSPARENCY)
    expect(reduced?.query).toBe(REDUCED_TRANSPARENCY)
    expect(declarations(reduced?.body ?? '', DARWIN_FRAME)?.get('--tomato-sidebar-backing')).toBe(OPAQUE)
  })

  it('leaves no drawer rule repainting the sidebar with the plain panel fill', () => {
    expect(frameCss).not.toContain('.frame[data-sidebar-drawer] .sidebarCol {\n  background:')
  })

  it('defines the surface for both themes', () => {
    const values = [...paletteCss.matchAll(/--dsw-specific-sidebar-surface:\s*rgb\((\d+), (\d+), (\d+)\)/gu)]
      .map(([, r = '', g = '', b = '']) => [Number(r), Number(g), Number(b)])
    // A warm near-white above the conversation paper, and a warm neutral ink-side
    // surface, so neither theme's sidebar collapses into the centre column.
    expect(values).toEqual([[236, 234, 232], [33, 30, 29]])
  })
})
