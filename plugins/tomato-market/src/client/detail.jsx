/** One plugin's page: compatibility, install actions, versions, source facts, and its README. */
import {
  Button, DetailDocument, IconChevronLeftOutlineRegular, Tag, Tooltip, useDetailDocumentLabels,
} from '@tomato/client-ui-primitives'
import { formatDate, formatStars, installTarget, latestVersion, localized, starsOf, targetsDeepSeek } from './search.js'
import { MarketIcon } from './widgets.jsx'

/** @param {object} version - one listed version. @returns {Array<{ label: string, value: string }>} source facts. */
function sourceFacts(plugin, version, t) {
  const facts = []
  if (version.source.type === 'git') {
    facts.push({ label: t('sourceGit'), value: version.source.url })
    facts.push({ label: t('sourceCommit'), value: version.source.commit })
    if (version.source.path !== undefined) facts.push({ label: t('sourceDirectory'), value: version.source.path })
  } else {
    facts.push({ label: t('sourcePackage'), value: `${plugin.name}@${version.version}` })
    if (version.source.registry !== undefined) facts.push({ label: t('sourceRegistry'), value: version.source.registry })
  }
  return facts
}

/** @param {object} compat - manifest facts or the read failure. @returns {string} the tag label key. */
function compatKey(compat) {
  if (compat.status !== 'ready') return 'compatUnknown'
  switch (compat.data?.class) {
    case 'tomato': return 'compatTomato'
    case 'dsh': return 'compatDsh'
    case 'other': return 'compatOther'
    default: return 'compatUnknown'
  }
}

/** @param {object} compat - manifest facts. @returns {'success' | 'warning' | 'neutral' | 'quiet'} tag tone. */
function compatTone(compat) {
  if (compat.status !== 'ready') return 'quiet'
  switch (compat.data?.class) {
    case 'tomato': return 'success'
    case 'dsh': return 'info'
    case 'other': return 'neutral'
    default: return 'quiet'
  }
}

/** A version row with its own install control. */
function VersionRow({ plugin, version, state, controller, install, t }) {
  const reg = installTarget(plugin, version)
  const date = formatDate(version.publishTimestamp, state.language)
  const requirement = version.dsh !== undefined
    ? t('dshRequirement', { range: version.dsh })
    : version.tomato !== undefined ? t('tomatoRequirement', { range: version.tomato }) : ''
  return (
    <li className="tm-version">
      <div className="tm-versionMain">
        <span className="tm-versionName">{version.version}</span>
        <span className="tm-meta">{[date, requirement, reg.spec].filter(part => part !== '').join(' · ')}</span>
      </div>
      <Button variant="ghost" size="sm" disabled={state.checking !== null}
        onClick={() => { void controller.install(plugin, version, install) }}>
        {t('install')}
      </Button>
    </li>
  )
}

/**
 * The plugin page.
 * @param {{ plugin: object, state: object, controller: object, install: Function, t: Function }} props - the subject and the tab.
 * @returns {JSX.Element} the page.
 */
export function PluginPage({ plugin, state, controller, install, t }) {
  const language = state.language
  const title = localized(plugin.title, language) || plugin.name
  const version = latestVersion(plugin)
  const stars = starsOf(plugin, state.catalog?.stars ?? {})
  const description = localized(plugin.description, language)
  const facts = version === undefined ? [] : sourceFacts(plugin, version, t)
  const labels = useDetailDocumentLabels({
    title: t('detailTitle'),
    loading: t('detailLoading'),
    retry: t('retryDetail'),
    copy: t('codeCopy'),
    copied: t('codeCopied'),
    codeBlock: t('codeBlock'),
    wrap: t('codeWrap'),
    unwrap: t('codeUnwrap'),
    footnotes: t('footnotes'),
  })
  const documentState = state.detail.status === 'found'
    ? { status: 'found', markdown: state.detail.markdown }
    : state.detail.status === 'none' ? { status: 'none' }
      : state.detail.status === 'error' ? { status: 'error', message: `${t('detailFailed')}：${state.detail.message}` }
        : { status: 'loading' }

  return (
    <div className="tm-detail">
      <button type="button" className="tm-back" onClick={controller.back}>
        <IconChevronLeftOutlineRegular size={14} aria-hidden="true" />
        {t('back')}
      </button>

      <div className="tm-head">
        <span className="tm-headIcon" aria-hidden="true"><MarketIcon src={plugin.icon} size={40} /></span>
        <div className="tm-headMain">
          <h2 className="tm-headTitle">{title}</h2>
          <div className="tm-headMeta">
            {plugin.category === undefined ? null : (
              <Tag tone="info">{localized(state.catalog?.categories?.find(entry => entry.id === plugin.category)?.title, language) || plugin.category}</Tag>
            )}
            {targetsDeepSeek(version) ? <Tag tone="warning">{t('compatDsh')}</Tag> : null}
            <Tooltip label={t('starNote')} side="bottom" portal delayMs={400}>
              <span className="tm-stars">{stars === undefined ? t('noStars') : t('stars', { count: formatStars(stars) })}</span>
            </Tooltip>
            {plugin.author === undefined ? null : <span>{t('author', { author: plugin.author })}</span>}
          </div>
        </div>
        <div className="tm-end">
          <Tag tone={compatTone(state.compat)}>{t(compatKey(state.compat))}</Tag>
          <Button variant="outline" size="sm" disabled={state.checking !== null || version === undefined}
            onClick={() => { if (version !== undefined) void controller.install(plugin, version, install) }}>
            {state.checking === plugin.name ? t('checking') : t('install')}
          </Button>
        </div>
      </div>

      {description === '' ? null : <p className="tm-descriptionFull">{description}</p>}

      {facts.length === 0 ? null : (
        <dl className="tm-facts">
          {facts.map(fact => (
            <Row key={fact.label} label={fact.label} value={fact.value} />
          ))}
          {plugin.homepage === undefined ? null : <Row label={t('homepage')} link={plugin.homepage} />}
          {plugin.repository === undefined ? null : <Row label={t('repository')} link={plugin.repository.url} directory={plugin.repository.directory} />}
        </dl>
      )}

      <section className="tm-group">
        <h3 className="tm-sectionTitle">{t('versions')}</h3>
        <ul className="tm-versions">
          {plugin.versions.map(entry => (
            <VersionRow key={entry.version} plugin={plugin} version={entry} state={state} controller={controller} install={install} t={t} />
          ))}
        </ul>
      </section>

      <section className="tm-group">
        <h3 className="tm-sectionTitle">{t('detailTitle')}</h3>
        {state.detail.status === 'none' ? <p className="tm-lede">{t('detailNone')}</p> : null}
        <DetailDocument state={documentState} labels={labels} onRetry={controller.retryDetail} />
      </section>
    </div>
  )
}

/** One fact row: a value, or a link that opens in a new tab. */
function Row({ label, value, link, directory }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>
        {link === undefined
          ? value
          : <a href={link} target="_blank" rel="noreferrer noopener">{value ?? link}</a>}
        {directory === undefined ? null : <span className="tm-meta"> · {directory}</span>}
      </dd>
    </>
  )
}