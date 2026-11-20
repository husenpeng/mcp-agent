/** Selected saturated fills read the documented white on-color ink in every palette. */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'
import { parseRules, varReferences } from './stylesheet-scan.ts'

const stylesheet = readFileSync(resolve(import.meta.dirname, '../src/styles/design-platform.css'), 'utf8')
const rules = parseRules(stylesheet)
const TOKEN = '--dsw-alias-label-on-color'

/**
 * Alias declarations that apply to one palette's `body`.
 * @param dark - whether to read the dark-theme override block.
 * @returns custom-property values by name.
 */
function definitions(dark: boolean): Map<string, string> {
  const selector = dark ? 'body[data-ds-dark-theme]' : 'body'
  return new Map(rules.filter(rule => rule.selectors.includes(selector)).flatMap(rule => rule.declarations))
}

/**
 * Follow one `var()` chain to its rgb() literal.
 * @param palette - one palette's custom-property values.
 * @returns the resolved channels.
 */
function resolveColor(palette: Map<string, string>): [number, number, number] {
  const seen = new Set<string>()
  let current = TOKEN
  while (!seen.has(current)) {
    seen.add(current)
    const value = palette.get(current)
    if (value === undefined) throw new Error(`Unresolved color ${current}`)
    const [reference] = varReferences(value)
    if (reference !== undefined) {
      if (!/^var\(\s*--[\w-]+\s*\)$/.test(value)) throw new Error(`Unresolved color ${current} = ${value}`)
      current = reference
      continue
    }
    const rgb = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/.exec(value)
    if (rgb === null) throw new Error(`Unresolved color ${current} = ${value}`)
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  }
  throw new Error(`Unresolved color ${current}`)
}

it.each([false, true])('defines white on-color ink in the dark=%s palette', (dark) => {
  const palette = definitions(dark)
  expect(palette.has(TOKEN)).toBe(true)
  expect(resolveColor(palette)).toEqual([255, 255, 255])
})

it('reports a palette that drops the token instead of inheriting the fill color', () => {
  const palette = definitions(false)
  palette.delete(TOKEN)
  expect(() => resolveColor(palette)).toThrow('Unresolved color')
})
