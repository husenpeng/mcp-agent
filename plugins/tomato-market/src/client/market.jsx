/** The Plugin Market tab: catalog toolbar, category sections, search results, and the plugin page. */
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import {
  Button, IconChevronDownOutlineRegular, IconRefreshOutlineRegular, IconSearchOutlineRegular, Input, Menu, Pill, Tooltip,
} from '@tomato/client-ui-primitives'
import { categoryCounts, categorySections, filterPlugins, latestVersion, localized, sortPlugins } from './search.js'
import { installStyles } from './styles.js'
import { MarketCard, MarketSkeletons } from './widgets.jsx'
import { PluginPage } from './detail.jsx'
import { InstallNotice } from './notice.jsx'

const SORTS = ['stars', 'updated', 'name']

/** @param {object} state - tab state. @param {Function} t - translator. @returns {string} the active sort's label. */
function sortLabel(state, t) {
  switch (state.sort) {
    case 'updated': return t('sortUpdated')
    case 'name': return t('sortName')
    default: return t('sortStars')
  }
}

/** The scroll root's catalog view. */
function Browse({ state, controller, install, t }) {
  const [sortMenu, setSortMenu] = useState(false)
  const catalog = state.catalog
  const language = state.language

  const counts = useMemo(() => (catalog === null ? new Map() : categoryCounts(catalog.plugins)), [catalog])
  const pills = useMemo(() => {
    if (catalog === null) return []
    return catalog.categories
      .filter(category => counts.has(category.id))
      .map(category => ({ id: category.id, title: localized(category.title, language), count: counts.get(category.id) ?? 0 }))
      .sort((a, b) => b.count - a.count)
  }, [catalog, counts, language])
  const matched = useMemo(() => (catalog === null ? [] : filterPlugins(catalog.plugins, {
    query: state.query, category: state.category, language,
  })), [catalog, state.query, state.category, language])
  const ordered = useMemo(() => (catalog === null ? [] : sortPlugins(matched, state.sort, catalog.stars ?? {}, language)),
    [catalog, matched, state.sort, language])
  const grouped = state.query.trim() === '' && state.category === null
  const sections = useMemo(() => (catalog === null || !grouped ? [] : categorySections(catalog.plugins, catalog.categories, catalog.stars ?? {}, language, 6, state.sort)),
    [catalog, grouped, language, state.sort])
  const shown = grouped ? ordered : ordered.slice(0, state.limit)

  const installVersion = (plugin) => {
    const version = latestVersion(plugin)
    if (version !== undefined) void controller.install(plugin, version, install)
  }

  const total = catalog?.plugins.length ?? 0
  return (
    <div className="tm-section">
      {catalog === null ? null : (
        <>
          <p className="tm-lede">
            {t('fromCatalog', { title: localized(catalog.title, language) })}
            {' · '}
            {t('plugins', { count: String(total) })}
            {' · '}
            {t('categories', { count: String(pills.length) })}
            {' · '}
            <a className="tm-source" href="https://awesome-dsh-plugin.com" target="_blank" rel="noreferrer noopener">awesome-dsh-plugin.com</a>
          </p>
          <p className="tm-banner">{t('banner')}</p>
        </>
      )}

      {state.status === 'loading' ? <MarketSkeletons label={t('loading')} /> : null}
      {state.status === 'error' ? (
        <div className="tm-status">
          <p className="tm-error" role="alert">{t('loadFailed')}：{state.failure}</p>
          <Button variant="outline" size="sm" onClick={controller.retry}>{t('retry')}</Button>
        </div>
      ) : null}

      {catalog !== null ? (
        <>
          <div className="tm-toolbar">
            <Input
              className="tm-search"
              type="search"
              value={state.query}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
              icon={<IconSearchOutlineRegular size={16} />}
              onChange={(event) => { controller.setQuery(event.target.value) }}
            />
            <Menu
              open={sortMenu}
              onClose={() => { setSortMenu(false) }}
              portal
              autoFocus
              align="end"
              selectedId={state.sort}
              items={SORTS.map(sort => ({ id: sort, label: t(sort === 'updated' ? 'sortUpdated' : sort === 'name' ? 'sortName' : 'sortStars') }))}
              onSelect={(id) => {
                setSortMenu(false)
                controller.setSort(id)
              }}
              anchor={(
                <Button variant="ghost" size="sm" aria-haspopup="menu" aria-expanded={sortMenu}
                  onClick={() => { setSortMenu(value => !value) }}>
                  {t('sortLabel')}：{sortLabel(state, t)}
                  <IconChevronDownOutlineRegular size={12} aria-hidden="true" />
                </Button>
              )}
            />
            <Tooltip label={t('refresh')} side="bottom" portal delayMs={500}>
              <Button variant="ghost" size="sm" aria-label={t('refresh')} onClick={controller.reload}>
                <IconRefreshOutlineRegular size={14} aria-hidden="true" />
              </Button>
            </Tooltip>
            {matched.length !== 0 && state.query.trim() !== '' ? (
              <Button variant="ghost" size="sm" onClick={() => { controller.setQuery('') }}>{t('clear')}</Button>
            ) : null}
            {state.query.trim() === '' && state.category === null ? null : (
              <span className="tm-count">{t('filtered')} · {t('plugins', { count: String(matched.length) })}</span>
            )}
          </div>

          <div className="tm-pills" role="group" aria-label={t('categories', { count: String(pills.length) })}>
            <Pill active={state.category === null} onClick={() => { controller.setCategory(null) }}>
              {t('all')} {total}
            </Pill>
            {pills.map(pill => (
              <Pill key={pill.id} active={state.category === pill.id} onClick={() => { controller.setCategory(state.category === pill.id ? null : pill.id) }}>
                {pill.title} {pill.count}
              </Pill>
            ))}
          </div>

          {matched.length === 0 ? (
            <p className="tm-lede">{t('empty')}</p>
          ) : grouped ? (
            sections.map(section => (
              <section className="tm-group" key={section.id} aria-label={section.title}>
                <div className="tm-groupHead">
                  <h3 className="tm-groupTitle">{section.title}</h3>
                  <span className="tm-groupCount">{t('plugins', { count: String(section.total) })}</span>
                  <button type="button" className="tm-groupMore" onClick={() => { controller.setCategory(section.id) }}>
                    {t('viewAll', { count: String(section.total) })}
                  </button>
                </div>
                <ul className="tm-cards">
                  {section.plugins.map(plugin => (
                    <MarketCard key={plugin.name} plugin={plugin} t={t} language={language}
                      stars={catalog.stars ?? {}} checking={state.checking === plugin.name}
                      onOpen={() => { void controller.open(plugin) }} onInstall={installVersion} />
                  ))}
                </ul>
              </section>
            ))
          ) : (
            <>
              <ul className="tm-cards">
                {shown.map(plugin => (
                  <MarketCard key={plugin.name} plugin={plugin} t={t} language={language}
                    stars={catalog.stars ?? {}} checking={state.checking === plugin.name}
                    onOpen={() => { void controller.open(plugin) }} onInstall={installVersion} />
                ))}
              </ul>
              {shown.length < ordered.length ? (
                <div className="tm-more">
                  <Button variant="outline" size="sm" onClick={controller.showMore}>{t('more')}</Button>
                </div>
              ) : null}
            </>
          )}
        </>
      ) : null}
    </div>
  )
}

/**
 * The tab component the Plugins page renders.
 * @param {{ controller: object, t: Function, install: Function }} props - the page's install bridge and this plugin's state.
 * @returns {JSX.Element} the market tab.
 */
export function MarketTab({ controller, t, install }) {
  const state = useSyncExternalStore(controller.store.subscribe, controller.store.get, controller.store.get)
  useEffect(() => { installStyles() }, [])
  useEffect(() => { controller.ensure() }, [controller])
  return (
    <>
      {state.selected === null
        ? <Browse state={state} controller={controller} install={install} t={t} />
        : (
          <PluginPage
            plugin={state.selected}
            state={state}
            controller={controller}
            install={install}
            t={t}
          />
        )}
      {state.substitution === null ? null : (
        <p className="tm-substitution" role="status">
          <span className="tm-substitutionText">
            {t('substitutedVersion', {
              requested: state.substitution.requested.version,
              selected: state.substitution.selected.version,
              runtime: state.substitution.runtimeVersion ?? '',
            })}
          </span>
          <button type="button" className="tm-groupMore" onClick={controller.dismissSubstitution}>{t('close')}</button>
        </p>
      )}
      {state.notice === null ? null : (
        <InstallNotice notice={state.notice} t={t} onClose={controller.dismissNotice}
          onContinue={() => { controller.confirmOverride(install) }}
          onAdapt={() => { void controller.adaptAndInstall(install) }} />
      )}
    </>
  )
}