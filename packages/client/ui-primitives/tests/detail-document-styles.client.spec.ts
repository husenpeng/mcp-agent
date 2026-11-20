/**
 * DetailDocument's scroll region as CSS text. jsdom has no layout, so these read the declaration that keeps a
 * space-constrained page from squashing the document: a shrunk region squeezes size-less content such as a plugin
 * preview SVG that only carries a viewBox, so the region keeps its content height and scrolls instead.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const css = readFileSync(fileURLToPath(new URL('../src/DetailDocument.module.css', import.meta.url)), 'utf8')
const declarationText = css.replace(/\/\*[\s\S]*?\*\//g, ' ')

function declarations(selector: string): string[] {
  const rule = new RegExp(`(?:^|\\})\\s*${selector.replace(/[.[\]():*+^$\\]/g, '\\$&')}\\s*\\{([^{}]*)\\}`).exec(declarationText)
  if (rule === null) throw new Error(`DetailDocument.module.css has no \`${selector}\` rule`)
  return (rule[1] ?? '').split(';').map(part => part.trim()).filter(Boolean)
}

describe('DetailDocument.module.css scroll region', () => {
  it('keeps its content height when the parent runs out of space, and scrolls past the cap', () => {
    expect(declarations('.document')).toEqual(expect.arrayContaining([
      'flex-shrink: 0',
      'overflow-y: auto',
    ]))
  })
})
