/**
 * Generate the iOS app's design tokens from the Web client's stylesheets.
 *
 * The Web GUI owns the product's colours, radii, and font stacks as CSS custom
 * properties. A native client that restates those values by hand drifts on the
 * first theme change, so this script reads the owned sources and emits SwiftUI
 * equivalents; `--check` re-generates in memory and fails when the committed
 * file is stale, which is what `pnpm run verify:ios-tokens` runs.
 *
 * Light values come from the `body` blocks of `design-platform.css`; the
 * `body[data-ds-dark-theme]` blocks override them exactly as the browser
 * cascade does, so a token the dark block does not restate keeps its light
 * value. Radii come from `base.css`.
 * @module scripts/gen-ios-tokens
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PLATFORM_CSS = join(ROOT, 'packages', 'client', 'ui-theme', 'src', 'styles', 'design-platform.css')
const BASE_CSS = join(ROOT, 'packages', 'client', 'ui-theme', 'src', 'styles', 'base.css')
const OUTPUT = join(ROOT, 'apps', 'ios', 'TomatoRemote', 'Design', 'Tokens.swift')

/** One colour in the `Color(.sRGB, red:green:blue:opacity:)` form. */
interface Rgba {
  readonly red: number
  readonly green: number
  readonly blue: number
  readonly alpha: number
}

/** One CSS rule block, reduced to the selector and its declaration text. */
interface CssBlock {
  readonly selector: string
  readonly body: string
}

const DARK_SELECTOR = 'body[data-ds-dark-theme]'
const ALIAS_PREFIX = '--dsw-alias-'
const RADIUS_PREFIX = '--dsw-radius-'

/**
 * Split a stylesheet into rule blocks, dropping comments.
 * @param css - the stylesheet source.
 * @returns every block in source order.
 */
function parseBlocks(css: string): CssBlock[] {
  const source = css.replaceAll(/\/\*[\s\S]*?\*\//gu, '')
  const blocks: CssBlock[] = []
  let index = 0
  while (index < source.length) {
    const open = source.indexOf('{', index)
    if (open === -1) break
    const close = source.indexOf('}', open)
    if (close === -1) throw new Error('gen-ios-tokens: unbalanced brace in stylesheet')
    blocks.push({ selector: source.slice(index, open).trim(), body: source.slice(open + 1, close) })
    index = close + 1
  }
  return blocks
}

/**
 * Read custom-property declarations from one block body.
 * @param body - declaration text between the braces.
 * @returns name/value pairs in source order; `var(...)` values are preserved verbatim.
 */
function declarations(body: string): [string, string][] {
  const rows: [string, string][] = []
  for (const raw of body.split(';')) {
    const colon = raw.indexOf(':')
    if (colon === -1) continue
    const name = raw.slice(0, colon).trim()
    if (!name.startsWith('--')) continue
    rows.push([name, raw.slice(colon + 1).trim()])
  }
  return rows
}

/**
 * Collect the declarations that apply to one selector family, in cascade order.
 * @param blocks - parsed stylesheet blocks.
 * @param selector - exact selector text to gather.
 * @returns the merged custom-property map; a later block wins.
 */
function scope(blocks: readonly CssBlock[], selector: string): Map<string, string> {
  const values = new Map<string, string>()
  for (const block of blocks) {
    if (block.selector !== selector) continue
    for (const [name, value] of declarations(block.body)) values.set(name, value)
  }
  return values
}

/**
 * Follow `var(--x[, fallback])` references until a literal value is reached.
 * @param name - the custom property to resolve.
 * @param values - the scope to read from.
 * @param seen - properties already visited in this chain, to catch cycles.
 * @returns the literal value, or undefined when a reference is missing or circular.
 */
function resolve(name: string, values: ReadonlyMap<string, string>, seen: ReadonlySet<string> = new Set()): string | undefined {
  if (seen.has(name)) return undefined
  const value = values.get(name)
  if (value === undefined) return undefined
  const reference = /^var\(\s*(--[A-Za-z0-9-]+)\s*(?:,\s*([\s\S]+))?\)$/u.exec(value)
  if (reference === null) return value
  const target = reference[1]
  if (target === undefined) return undefined
  const resolved = resolve(target, values, new Set([...seen, name]))
  if (resolved !== undefined) return resolved
  return reference[2]?.trim()
}

/**
 * Parse one CSS colour into sRGB components.
 * @param value - a colour literal after `var()` resolution.
 * @returns components in the 0–1 range, or undefined for forms this generator does not carry
 *   (`color-mix()`, `currentColor`, gradients).
 */
function parseColor(value: string): Rgba | undefined {
  const text = value.trim().toLowerCase()
  if (text === 'transparent') return { red: 0, green: 0, blue: 0, alpha: 0 }
  const hex = /^#([0-9a-f]{3,8})$/u.exec(text)
  if (hex !== null) {
    const digits = hex[1] ?? ''
    const expand = (part: string): number => Number.parseInt(part.length === 1 ? part + part : part, 16) / 255
    if (digits.length === 3 || digits.length === 4) {
      const rgb = digits.split('').map(expand)
      return { red: rgb[0] ?? 0, green: rgb[1] ?? 0, blue: rgb[2] ?? 0, alpha: digits.length === 4 ? rgb[3] ?? 1 : 1 }
    }
    if (digits.length === 6 || digits.length === 8) {
      const pairs = digits.match(/.{2}/gu) ?? []
      const rgb = pairs.map(expand)
      return { red: rgb[0] ?? 0, green: rgb[1] ?? 0, blue: rgb[2] ?? 0, alpha: digits.length === 8 ? rgb[3] ?? 1 : 1 }
    }
    return undefined
  }
  const functional = /^rgba?\(([\s\S]+)\)$/u.exec(text)
  if (functional === null) return undefined
  const parts = (functional[1] ?? '').replaceAll('/', ' ').split(/[\s,]+/u).filter(part => part !== '')
  if (parts.length !== 3 && parts.length !== 4) return undefined
  const channel = (part: string | undefined): number | undefined => {
    if (part === undefined) return undefined
    return part.endsWith('%') ? Number(part.slice(0, -1)) / 100 : Number(part) / 255
  }
  const red = channel(parts[0])
  const green = channel(parts[1])
  const blue = channel(parts[2])
  const alpha = parts[3] === undefined
    ? 1
    : parts[3].endsWith('%') ? Number(parts[3].slice(0, -1)) / 100 : Number(parts[3])
  if (red === undefined || green === undefined || blue === undefined || !Number.isFinite(alpha)) return undefined
  return { red, green, blue, alpha }
}

/**
 * Camel-case a custom-property suffix for a Swift identifier.
 * @param name - a custom property name such as `--dsw-alias-bg-layer-1`.
 * @param prefix - the prefix to strip.
 * @returns the identifier, for example `bgLayer1`.
 */
function identifier(name: string, prefix: string): string {
  const parts = name.slice(prefix.length).split('-').filter(part => part !== '')
  return parts.map((part, index) => index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)).join('')
}

/**
 * Round one channel to a stable decimal form, so regeneration is byte-identical.
 * @param value - the channel in the 0–1 range.
 * @returns the literal written into Swift.
 */
function literal(value: number): string {
  return Number(value.toFixed(4)).toString()
}

/**
 * Render one colour literal as a SwiftUI initializer.
 * @param color - parsed components.
 * @returns the initializer expression.
 */
function color(color: Rgba): string {
  return `Color(.sRGB, red: ${literal(color.red)}, green: ${literal(color.green)}, blue: ${literal(color.blue)}, opacity: ${literal(color.alpha)})`
}

/**
 * Read the palette and radii this generator carries.
 * @returns light and dark colour maps plus the radius map, keyed by Swift identifier.
 */
function readTokens(): { light: Map<string, Rgba>; dark: Map<string, Rgba>; skipped: string[]; radii: Map<string, string> } {
  const platform = parseBlocks(readFileSync(PLATFORM_CSS, 'utf8'))
  const base = parseBlocks(readFileSync(BASE_CSS, 'utf8'))
  const lightScope = scope(platform, 'body')
  const darkScope = new Map([...lightScope, ...scope(platform, DARK_SELECTOR)])

  const collect = (values: ReadonlyMap<string, string>): { colors: Map<string, Rgba>; skipped: string[] } => {
    const colors = new Map<string, Rgba>()
    const skipped: string[] = []
    const aliases = [...values.keys()].filter(name => name.startsWith(ALIAS_PREFIX)).sort()
    for (const alias of aliases) {
      const resolved = resolve(alias, values)
      const parsed = resolved === undefined ? undefined : parseColor(resolved)
      if (parsed === undefined) { skipped.push(alias); continue }
      colors.set(identifier(alias, ALIAS_PREFIX), parsed)
    }
    return { colors, skipped }
  }

  const light = collect(lightScope)
  const dark = collect(darkScope)

  const radii = new Map<string, string>()
  // `base.css` declares the radii on `:root`; later sheets may restate them on `body`.
  for (const [name, value] of [...scope(base, ':root'), ...scope(base, 'body')]) {
    if (!name.startsWith(RADIUS_PREFIX)) continue
    const pixels = /^(\d+(?:\.\d+)?)px$/u.exec(value.trim())
    if (pixels === null) continue
    radii.set(identifier(name, RADIUS_PREFIX), pixels[1] ?? '0')
  }
  return { light: light.colors, dark: dark.colors, skipped: light.skipped, radii }
}

/**
 * Build the Swift source.
 * @returns the complete `Tokens.swift` contents.
 */
function render(): string {
  const { light, dark, skipped, radii } = readTokens()
  const shared = [...light.keys()].filter(name => dark.has(name)).sort()
  const lightOnly = [...light.keys()].filter(name => !dark.has(name)).sort()
  const collisions = shared.length + lightOnly.length !== light.size
  if (collisions) throw new Error('gen-ios-tokens: alias identifiers collide after camel-casing')

  const lines: string[] = [
    '// Generated by scripts/gen-ios-tokens.ts from',
    '// packages/client/ui-theme/src/styles/design-platform.css and base.css.',
    '// Do not edit by hand: run `pnpm run gen:ios-tokens`, and `pnpm run verify:ios-tokens`',
    '// fails when this file is stale.',
    '',
    'import SwiftUI',
    '',
    '/** Resolve one token to the appearance the system currently asks for. */',
    'private func tomatoDynamic(light: Color, dark: Color) -> Color {',
    '  Color(uiColor: UIColor { traits in traits.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light) })',
    '}',
    '',
    'private enum TomatoLight {',
    ...shared.map(name => `  static let ${name} = ${color(light.get(name) as Rgba)}`),
    ...lightOnly.map(name => `  static let ${name} = ${color(light.get(name) as Rgba)}`),
    '}',
    '',
    'private enum TomatoDark {',
    ...shared.map(name => `  static let ${name} = ${color(dark.get(name) as Rgba)}`),
    ...lightOnly.map(name => `  static let ${name} = ${color(light.get(name) as Rgba)}`),
    '}',
    '',
    '/** Semantic colour tokens mirrored from the Web client\'s `--dsw-alias-*` set. */',
    'enum TomatoToken {',
    ...shared.map(name => `  static let ${name} = tomatoDynamic(light: TomatoLight.${name}, dark: TomatoDark.${name})`),
    ...lightOnly.map(name => `  static let ${name} = tomatoDynamic(light: TomatoLight.${name}, dark: TomatoDark.${name})`),
    '}',
    '',
    '/** Corner radii mirrored from the Web client\'s `--dsw-radius-*` set, in points. */',
    'enum TomatoRadius {',
    ...[...radii.entries()].sort(([left], [right]) => left.localeCompare(right))
      .map(([name, value]) => `  static let ${name}: CGFloat = ${value}`),
    '}',
    '',
  ]
  if (skipped.length > 0) {
    lines.push('/**', ' * Tokens this generator could not carry, because their value uses a form with no', ' * sRGB equivalent: ' + skipped.join(', ') + '.', ' */')
  }
  return lines.join('\n')
}

const generated = render()
const check = process.argv.includes('--check')
if (check) {
  let current: string
  try { current = readFileSync(OUTPUT, 'utf8') } catch {
    console.error(`verify:ios-tokens: ${OUTPUT} is missing; run pnpm run gen:ios-tokens`)
    process.exit(1)
  }
  if (current !== generated) {
    console.error(`verify:ios-tokens: ${OUTPUT} is stale; run pnpm run gen:ios-tokens`)
    process.exit(1)
  }
  console.log('verify:ios-tokens: up to date')
} else {
  mkdirSync(dirname(OUTPUT), { recursive: true })
  writeFileSync(OUTPUT, generated)
  console.log(`gen:ios-tokens: wrote ${OUTPUT}`)
}
