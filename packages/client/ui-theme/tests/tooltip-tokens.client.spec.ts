/** Tooltip ink comes from ui-theme aliases; an alias the theme never defines leaves the inherited page label color on the dark bubble. */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'
import { parseRules, varReferences } from './stylesheet-scan.ts'

const theme = readFileSync(resolve(import.meta.dirname, '../src/styles/design-platform.css'), 'utf8')
const primitives = ['Tooltip.module.css', 'ShortcutKeys.module.css']
  .map(name => readFileSync(resolve(import.meta.dirname, '../../ui-primitives/src', name), 'utf8'))
  .join('\n')

/**
 * Custom properties one rule set declares, with later rules overriding earlier ones.
 * @param selector - exact selector part to match, such as `body[data-ds-dark-theme]`.
 * @returns declared custom-property values keyed by name.
 */
function palette(selector: string): Map<string, string> {
  return new Map(parseRules(theme)
    .filter(rule => rule.selectors.includes(selector))
    .flatMap(rule => rule.declarations)
    .filter(([property]) => property.startsWith('--')))
}

it('defines every tooltip alias the primitives consume in both palettes', () => {
  const aliases = [...new Set(parseRules(primitives)
    .flatMap(rule => rule.declarations.flatMap(([, value]) => varReferences(value))
      .filter(name => name.startsWith('--dsw-alias-tooltip-'))))]
  expect(aliases.length).toBeGreaterThan(0)
  for (const [selector, label] of [['body', 'light'], ['body[data-ds-dark-theme]', 'dark']] as const) {
    const declared = palette(selector)
    for (const alias of aliases) expect(declared.has(alias), `${label} ${alias}`).toBe(true)
  }
})
