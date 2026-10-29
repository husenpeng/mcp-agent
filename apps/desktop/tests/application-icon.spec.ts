import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function resource(name: string): string {
  return readFileSync(new URL(`../resources/${name}`, import.meta.url), 'utf8')
}

/** Edge lengths and color type from a PNG's IHDR chunk. */
function pngHeader(name: string): { width: number; height: number; colorType: number } {
  const png = readFileSync(new URL(`../resources/${name}`, import.meta.url))
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20), colorType: png.readUInt8(25) }
}

describe('application icon artwork', () => {
  it('uses the Web install tile as the original artwork', () => {
    expect(resource('icon.svg')).toBe(readFileSync(new URL('../../web/assets/app-icon.svg', import.meta.url), 'utf8'))
  })

  it('draws the original tile mark in every platform adaptation', () => {
    const mark = /<path [^>]*\/>/u.exec(resource('icon.svg'))?.[0]
    expect(mark).toBeDefined()
    for (const name of ['icon-macos.svg', 'icon-windows.svg']) expect(resource(name)).toContain(mark)
  })

  it('exports each platform icon as a transparent 1024 px square', () => {
    // Color type 6 is truecolor with alpha.
    for (const name of ['icon-macos.png', 'icon-windows.png']) expect(pngHeader(name)).toEqual({ width: 1024, height: 1024, colorType: 6 })
  })
})
