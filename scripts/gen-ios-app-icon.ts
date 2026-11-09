/**
 * Render the iOS app icon bitmap from the Web install tile.
 *
 * iOS draws the home-screen icon with its own superellipse mask, so an icon has
 * to be a full-bleed opaque square: the transparent margin, rounded corners, and
 * drop shadow that `apps/desktop/resources/icon-macos.svg` adds for the macOS
 * grid would surface as a shrunken tile with clipped corners on the phone.
 * Cropping the tile out of the shared artwork leaves the same mark on the same
 * `#FBFBFB` tile as the desktop and Web install icons; only the platform-mandated
 * cut differs.
 *
 * The source is `apps/web/assets/app-icon.svg`, the original that the desktop
 * artwork mirrors. The committed PNG is the asset-catalog bitmap, so rerun
 * `pnpm run gen-ios-app-icon` after changing the artwork.
 * @module scripts/gen-ios-app-icon
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Edge of the square tile inside the source artwork, in pixels. */
export const ICON_EDGE = 1024

/** The tile's top-left corner in the source artwork's 1104 px canvas; its drop shadow lies outside. */
export const TILE_ORIGIN = { left: 40, top: 32 } as const

/** Full width of the source artwork's canvas. */
const SOURCE_EDGE = 1104

/** Tile background; iOS requires every icon pixel to be opaque. */
const TILE_BACKGROUND = '#FBFBFB'

/** Artwork read and bitmap written by this generator. */
export const IOS_APP_ICON = {
  source: join(ROOT, 'apps', 'web', 'assets', 'app-icon.svg'),
  output: join(ROOT, 'apps', 'ios', 'TomatoRemote', 'Resources', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon.png'),
} as const

/**
 * Rasterize the icon bitmap.
 * @returns PNG bytes for a 1024 px square with three channels and no alpha.
 */
export async function renderAppIcon(): Promise<Buffer> {
  return sharp(readFileSync(IOS_APP_ICON.source))
    .resize(SOURCE_EDGE, SOURCE_EDGE, { fit: 'fill' })
    .extract({ ...TILE_ORIGIN, width: ICON_EDGE, height: ICON_EDGE })
    .flatten({ background: TILE_BACKGROUND })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toBuffer()
}

if (import.meta.main) {
  mkdirSync(dirname(IOS_APP_ICON.output), { recursive: true })
  writeFileSync(IOS_APP_ICON.output, await renderAppIcon())
  console.log(`gen-ios-app-icon: wrote ${IOS_APP_ICON.output}`)
}
