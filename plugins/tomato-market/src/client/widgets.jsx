/** Small pieces shared by the browse list and the plugin page. */
import { useState } from 'react'
import { Button, PluginArtworkDefault, Tag } from '@tomato/client-ui-primitives'
import { formatDate, formatStars, latestVersion, localized, starsOf, targetsDeepSeek } from './search.js'

/** Artwork, falling back to the shell's default plugin glyph. */
export function MarketIcon({ src, size = 36 }) {
  const [failed, setFailed] = useState()
  return src === undefined || src === failed
    ? <PluginArtworkDefault size={size} />
    : <img className="tm-image" src={src} width={size} height={size} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => { setFailed(src) }} />
}

/** The stars a card shows, or a quiet placeholder. */
export function Stars({ plugin, stars, t }) {
  const count = starsOf(plugin, stars)
  return <Tag tone="quiet" className="tm-stars">{count === undefined ? t('noStars') : t('stars', { count: formatStars(count) })}</Tag>
}

/** The card's one-line meta: version, publish date, author. */
export function metaLine(plugin, language, t) {
  const version = latestVersion(plugin)
  if (version === undefined) return t('noVersions')
  const date = formatDate(version.publishTimestamp, language)
  return [t('versionListed', { version: version.version }), date === '' ? '' : t('published', { date }), plugin.author === undefined ? '' : t('author', { author: plugin.author })]
    .filter(part => part !== '').join(' · ')
}

/** One market row: artwork, title, tags, description, meta, and the card's action. */
export function MarketCard({ plugin, t, language, stars, checking, onOpen, onInstall }) {
  const title = localized(plugin.title, language) || plugin.name
  const version = latestVersion(plugin)
  const description = localized(plugin.description, language)
  return (
    <li className="tm-card" data-market-plugin={plugin.name}>
      <span className="tm-icon" aria-hidden="true"><MarketIcon src={plugin.icon} /></span>
      <div className="tm-main">
        <div className="tm-titleRow">
          <button type="button" className="tm-cardOpen" aria-label={t('open', { name: title })} onClick={onOpen}>{title}</button>
          {targetsDeepSeek(version) ? <Tag tone="warning">{t('compatDsh')}</Tag> : null}
        </div>
        {description === '' ? null : <span className="tm-description">{description}</span>}
        <span className="tm-meta">{metaLine(plugin, language, t)}</span>
      </div>
      <div className="tm-end">
        <Stars plugin={plugin} stars={stars} t={t} />
        <Button variant="outline" size="sm" disabled={checking} onClick={() => { onInstall(plugin) }}>
          {checking ? t('checking') : t('install')}
        </Button>
      </div>
    </li>
  )
}

/** The loading placeholder: four rows with the real card's spacing. */
export function MarketSkeletons({ label }) {
  return (
    <div className="tm-skeletons" role="status" aria-label={label}>
      {[0, 1, 2, 3].map(row => (
        <div className="tm-skeleton" key={row} aria-hidden="true">
          <span className="tm-skeletonIcon" />
          <span className="tm-skeletonLines"><span className="tm-skeletonLine" /><span className="tm-skeletonLine" /></span>
        </div>
      ))}
    </div>
  )
}