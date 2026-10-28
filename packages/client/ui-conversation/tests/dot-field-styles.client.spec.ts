/** Hero dot field layering and the CSS fallback contract. */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const root = readFileSync(new URL('../src/client/skeleton/ConversationRoot.module.css', import.meta.url), 'utf8')
const field = readFileSync(new URL('../src/client/skeleton/DotField.module.css', import.meta.url), 'utf8')

function rule(source: string, selector: string): string {
  const pattern = new RegExp(`${selector.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&')}\\s*\\{([^}]*)\\}`, 'u')
  return pattern.exec(source)?.[1] ?? ''
}

describe('hero dot field styles', () => {
  it('scopes the stacking context to the hero phase', () => {
    expect(rule(root, ".root[data-phase='hero']")).toContain('isolation: isolate')
    expect(rule(root, '.root')).not.toContain('isolation')
  })

  it('keeps the CSS dots as the fallback and hides them after a canvas frame', () => {
    expect(rule(root, ".root[data-phase='hero']")).toContain('radial-gradient')
    expect(rule(root, ".root[data-phase='hero']:has(> [data-dot-field][data-ready])"))
      .toContain('background-image: none')
  })

  it('keeps the composer seat clear of the page dots', () => {
    expect(rule(root, ".root[data-phase='hero'] .composerSeat")).toContain('background: none')
  })

  it('paints the canvas below content and outside the hit path', () => {
    const css = rule(field, '.dotField')
    expect(css).toContain('position: absolute')
    expect(css).toContain('inset: 0')
    expect(css).toContain('z-index: -1')
    expect(css).toContain('pointer-events: none')
  })
})
