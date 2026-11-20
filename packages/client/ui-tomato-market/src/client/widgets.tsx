/** Small pieces shared by both market lists and their entry pages. */
import { useState, type ReactNode } from 'react'
import { PluginArtworkDefault } from '@tomato/client-ui-primitives'
import { formatStars, latestVersion, targetsTomato, type ListedVersionView, type PluginView } from './catalog.ts'


/** Artwork, falling back to the shell's default plugin glyph. */
export function MarketIcon({ src, size = 36 }: { readonly src?: string | undefined; readonly size?: number }): ReactNode {
  const [failed, setFailed] = useState<string>()
  return src === undefined || src === failed
    ? <PluginArtworkDefault size={size} />
    : (
      <img className="tomatoMarket-image" src={src} width={size} height={size} alt="" loading="lazy" referrerPolicy="no-referrer"
        onError={() => { setFailed(src) }} />
    )
}

/**
 * The one-line meta of a plugin card: listed version, publish date, and author.
 * @param plugin - the plugin.
 * @param language - UI language.
 * @param t - the tabs' translator.
 * @param formatDateText - formats Unix seconds as a local date.
 * @returns the meta line.
 */
export function metaLine(
  plugin: PluginView,
  language: string,
  t: (key: 'noVersions' | 'versionListed' | 'published' | 'author', params?: Readonly<Record<string, string>>) => string,
  formatDateText: (timestamp: number | undefined, language: string) => string,
): string {
  const version: ListedVersionView | undefined = latestVersion(plugin)
  if (version === undefined) return t('noVersions')
  const date = formatDateText(version.publishTimestamp, language)
  const author = plugin.author === undefined ? '' : t('author', { author: plugin.author })
  return [
    t('versionListed', { version: version.version }),
    date === '' ? '' : t('published', { date }),
    author,
  ].filter(part => part !== '').join(' · ')
}

/**
 * Whether a card warns that the plugin targets TOMATO rather than this Tomato release.
 * @param plugin - the plugin.
 * @returns whether to show the warning tag.
 */
export function targetsTomatoCard(plugin: PluginView): boolean {
  return targetsTomato(latestVersion(plugin))
}

/**
 * A compact star count for a tag.
 * @param count - the count.
 * @param t - the tabs' translator.
 * @returns the label.
 */
export function starsLabel(count: number | undefined, t: (key: 'stars' | 'noStars', params?: Readonly<Record<string, string>>) => string): string {
  return count === undefined ? t('noStars') : t('stars', { count: formatStars(count) })
}
