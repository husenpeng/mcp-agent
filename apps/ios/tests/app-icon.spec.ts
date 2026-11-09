import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { ICON_EDGE, IOS_APP_ICON, renderAppIcon } from '../../../scripts/gen-ios-app-icon.ts'

const CONTENTS = new URL('../TomatoRemote/Resources/Assets.xcassets/AppIcon.appiconset/Contents.json', import.meta.url)

/** Edge lengths, bit depth, and colour type from a PNG's IHDR chunk. */
function pngHeader(png: Buffer): { width: number; height: number; bitDepth: number; colorType: number } {
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20), bitDepth: png.readUInt8(24), colorType: png.readUInt8(25) }
}

/** Red, green, and blue channels at one pixel of a three-channel bitmap. */
function pixel(rgb: Buffer, x: number, y: number): number[] {
  const at = (y * ICON_EDGE + x) * 3
  return [rgb.readUInt8(at), rgb.readUInt8(at + 1), rgb.readUInt8(at + 2)]
}

/** Average sRGB colour of every cell in a 16 px grid, row-major. */
async function coarseColours(png: Buffer): Promise<Buffer> {
  const { data } = await sharp(png).resize(16, 16, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true })
  return data
}

describe('iOS app icon', () => {
  it('declares one universal 1024 px icon in the asset catalog', () => {
    const catalog = JSON.parse(readFileSync(CONTENTS, 'utf8')) as { images: Record<string, string>[] }
    expect(catalog.images).toEqual([{ filename: 'AppIcon.png', idiom: 'universal', platform: 'ios', size: '1024x1024' }])
    expect(pngHeader(readFileSync(IOS_APP_ICON.output))).toMatchObject({ width: ICON_EDGE, height: ICON_EDGE })
  })

  it('ships an opaque square because iOS supplies the mask', async () => {
    const png = readFileSync(IOS_APP_ICON.output)
    // Color type 2 is truecolor without alpha; App Store Connect rejects a transparent app icon.
    expect(pngHeader(png)).toEqual({ width: ICON_EDGE, height: ICON_EDGE, bitDepth: 8, colorType: 2 })
    const { data } = await sharp(png).raw().toBuffer({ resolveWithObject: true })
    // Full bleed: the macOS export's transparent margin and rounded corners would leave dark corners here.
    const corners: readonly (readonly [number, number])[] = [
      [0, 0],
      [ICON_EDGE - 1, 0],
      [0, ICON_EDGE - 1],
      [ICON_EDGE - 1, ICON_EDGE - 1],
    ]
    for (const [x, y] of corners) expect(pixel(data, x, y).every(channel => channel > 220)).toBe(true)
  })

  it('carries the tile the desktop icon mirrors', async () => {
    // Rasterizer output differs in the last bits between platforms, so compare a
    // coarse grid instead of bytes; an artwork change moves the averages far more.
    const fresh = await coarseColours(await renderAppIcon())
    const shipped = await coarseColours(readFileSync(IOS_APP_ICON.output))
    expect(shipped.length).toBe(fresh.length)
    for (let index = 0; index < shipped.length; index += 1) {
      expect(Math.abs(fresh.readUInt8(index) - shipped.readUInt8(index))).toBeLessThanOrEqual(6)
    }
  })
})
