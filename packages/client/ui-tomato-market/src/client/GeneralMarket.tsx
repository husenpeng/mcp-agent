/**
 * The General plugins tab: the list, one plugin's page, the install notice, and the corrected-version note. These render at
 * one language and receive everything through props; the registered entry supplies state, actions, and the locale.
 */
import { useMemo, useState, type ReactNode } from 'react'
import {
  Button, IconChevronDownOutlineRegular, IconChevronLeftOutlineRegular, IconRefreshOutlineRegular, IconSearchOutlineRegular,
  Input, MarkdownText, Menu, Pill, Tag, Tooltip,
} from '@tomato/client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
import type { MarketCatalog, MarketTabProps } from './contract.ts'
import type { CompatibilityRead, GeneralFace, GeneralState } from './general-controller.ts'
import {
  catalogMarkdownLabels, categoryCounts, categorySections, compatibilityBadge, filterPlugins, formatDate, installTarget, latestVersion,
  localized, requirementOf, sortPlugins, starsOf, targetsTomato, unmetRequirements,
  type CategorySection, type ListedVersionView, type MarketSort, type PluginView,
} from './catalog.ts'
import { InstallNoticeDialog } from './InstallNotice.tsx'
import { MarketIcon, metaLine, starsLabel } from './widgets.tsx'
import type { TomatoMarketLocaleKey } from './locales.ts'
import css from './market.module.css'

/** Props of the General plugins tab. */
export type GeneralMarketProps = PropsRuntime<'plugins.tab'> & PropsLocale<'tomatoMarket'> & InjectFace<GeneralFace>

/** The translate function the rendered tab receives, including the shared common vocabulary. */
type Translate = (key: TomatoMarketLocaleKey, params?: Readonly<Record<string, string>>) => string

/** The orders the sort menu offers. */
const SORTS: readonly MarketSort[] = ['stars', 'updated', 'name']

/**
 * The sort menu's label key.
 * @param sort - the order.
 * @returns the copy key.
 */
function sortKey(sort: MarketSort): 'sortStars' | 'sortUpdated' | 'sortName' {
  switch (sort) {
    case 'updated': return 'sortUpdated'
    case 'name': return 'sortName'
    default: return 'sortStars'
  }
}

/**
 * One list row.
 * @param props - the plugin, the tab state, the actions, the install bridge, and the language.
 * @returns the row.
 */
function MarketRow(props: {
  readonly plugin: PluginView
  readonly state: GeneralState
  readonly face: Omit<GeneralFace, 'hooks'>
  readonly install: MarketTabProps['install']
  readonly t: Translate
  readonly language: string
}): ReactNode {
  const { plugin, state, face, install, t, language } = props
  const version = latestVersion(plugin)
  const title = localized(plugin.title, language) || plugin.name
  const description = localized(plugin.description, language)
  const checking = state.checking === plugin.name
  return (
    <li className={css.card} data-market-plugin={plugin.name}>
      <span className={css.icon} aria-hidden="true"><MarketIcon src={plugin.icon} /></span>
      <div className={css.main}>
        <div className={css.titleRow}>
          <button type="button" className={css.cardOpen} aria-label={t('open', { name: title })}
            onClick={() => { face.open(plugin) }}>
            {title}
          </button>
          {targetsTomato(version) ? <Tag tone="warning">{t('compatDsh')}</Tag> : null}
        </div>
        {description === '' ? null : <span className={css.description}>{description}</span>}
        <span className={css.meta}>{metaLine(plugin, language, t, formatDate)}</span>
      </div>
      <div className={css.end}>
        <Tag tone="quiet" className={css.stars}>{starsLabel(starsOf(plugin, state.catalog?.stars ?? {}), t)}</Tag>
        <Button variant="outline" size="sm" disabled={state.checking !== null || version === undefined}
          onClick={() => { if (version !== undefined) face.install(plugin, version, install) }}>
          {checking ? t('checking') : t('install')}
        </Button>
      </div>
    </li>
  )
}

/**
 * The catalog list.
 * @param props - the tab state, the actions, the install bridge, and the language.
 * @returns the list.
 */
export function GeneralBrowse(props: {
  readonly state: GeneralState
  readonly face: Omit<GeneralFace, 'hooks'>
  readonly install: MarketTabProps['install']
  readonly t: Translate
  readonly language: string
}): ReactNode {
  const { state, face, install, t, language } = props
  const [sortMenu, setSortMenu] = useState(false)
  const catalog = state.catalog
  const counts = useMemo(() => (catalog === null ? new Map<string, number>() : categoryCounts(catalog.plugins)), [catalog])
  const pills = useMemo(() => catalog === null ? [] : categoryPills(catalog, counts, language), [catalog, counts, language])
  const matched = useMemo(
    () => (catalog === null ? [] : filterPlugins(catalog.plugins, { query: state.query, category: state.category, language })),
    [catalog, state.query, state.category, language],
  )
  const ordered = useMemo(
    () => (catalog === null ? [] : sortPlugins(matched, state.sort, catalog.stars, language)),
    [catalog, matched, state.sort, language],
  )
  const grouped = state.query.trim() === '' && state.category === null
  const sections = useMemo(
    () => (catalog === null || !grouped
      ? []
      : categorySections(catalog.plugins, catalog.categories, catalog.stars, language, 6, state.sort)),
    [catalog, grouped, language, state.sort],
  )
  const shown = grouped ? ordered : ordered.slice(0, state.limit)
  const scope = { face, install, t, language, state, matched: matched.length }
  return (
    <div className={css.section}>
      {catalog === null
        ? null
        : (
          <>
            <p className={css.lede}>
              {t('fromCatalog', { title: localized(catalog.title, language) })}
              {' · '}
              {t('plugins', { count: String(catalog.plugins.length) })}
              {' · '}
              {t('categories', { count: String(pills.length) })}
            </p>
            <p className={css.banner}>{t('banner')}</p>
          </>
        )}
      {state.status === 'loading' ? <p className={css.lede} role="status">{t('loading')}</p> : null}
      {state.status === 'error'
        ? (
          <div className={css.status}>
            <p className={css.error} role="alert">{t('loadFailed')}：{state.failure}</p>
            <Button variant="outline" size="sm" onClick={face.retry}>{t('retry')}</Button>
          </div>
        )
        : null}
      {catalog === null ? null : (
        <CatalogBody
          catalog={catalog}
          state={state}
          pills={pills}
          shown={shown}
          total={ordered.length}
          sections={sections}
          grouped={grouped}
          scope={scope}
          t={t}
          face={face}
          sortMenu={sortMenu}
          onSortMenu={setSortMenu}
        />
      )}
    </div>
  )
}

/** What a market row and the toolbar actions read from the tab. */
interface BrowseScope {
  readonly state: GeneralState
  readonly face: Omit<GeneralFace, 'hooks'>
  readonly install: MarketTabProps['install']
  readonly t: Translate
  readonly language: string
  /** Plugins matching the query and category. */
  readonly matched: number
}

/**
 * The category pills the toolbar offers: declared categories that hold plugins, most populated first.
 * @param catalog - the loaded catalog.
 * @param counts - plugins per category.
 * @param language - the tab's language.
 * @returns the pills.
 */
function categoryPills(
  catalog: MarketCatalog,
  counts: Map<string, number>,
  language: string,
): Array<{ id: string; title: string; count: number }> {
  return catalog.categories
    .filter(category => counts.has(category.id))
    .map(category => ({ id: category.id, title: localized(category.title, language), count: counts.get(category.id) ?? 0 }))
    .sort((left, right) => right.count - left.count)
}

/**
 * The loaded catalog's toolbar, category pills, and rows.
 * @param props - the loaded catalog, the list state, and the tab's actions.
 * @returns the body.
 */
function CatalogBody(props: {
  readonly catalog: MarketCatalog
  readonly state: GeneralState
  readonly pills: ReadonlyArray<{ readonly id: string; readonly title: string; readonly count: number }>
  readonly shown: readonly PluginView[]
  readonly total: number
  readonly sections: readonly CategorySection[]
  readonly grouped: boolean
  readonly scope: BrowseScope
  readonly t: Translate
  readonly face: Omit<GeneralFace, 'hooks'>
  readonly sortMenu: boolean
  readonly onSortMenu: (open: boolean) => void
}): ReactNode {
  const { catalog, state, pills, shown, total, sections, grouped, scope, t, face, sortMenu, onSortMenu } = props
  const searching = state.query.trim() !== ''
  const narrowed = searching || state.category !== null
  const row = (plugin: PluginView, key: string): ReactNode => <MarketRow key={key} plugin={plugin} {...scope} />
  return (
    <>
      <div className={css.toolbar}>
        <Input
          className={css.search}
          type="search"
          value={state.query}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          icon={<IconSearchOutlineRegular size={16} />}
          onChange={(event) => { face.setQuery(event.target.value) }}
        />
        <Menu
          open={sortMenu}
          onClose={() => { onSortMenu(false) }}
          portal
          autoFocus
          align="end"
          selectedId={state.sort}
          items={SORTS.map(sort => ({ id: sort, label: t(sortKey(sort)) }))}
          onSelect={(id) => {
            onSortMenu(false)
            face.setSort(id as MarketSort)
          }}
          anchor={(
            <Button variant="ghost" size="sm" aria-haspopup="menu" aria-expanded={sortMenu}
              onClick={() => { onSortMenu(!sortMenu) }}>
              {t('sortLabel')}：{t(sortKey(state.sort))}
              <IconChevronDownOutlineRegular size={12} aria-hidden="true" />
            </Button>
          )}
        />
        <Tooltip label={t('refresh')} side="bottom" portal delayMs={500}>
          <Button variant="ghost" size="sm" aria-label={t('refresh')} onClick={face.reload}>
            <IconRefreshOutlineRegular size={14} aria-hidden="true" />
          </Button>
        </Tooltip>
        {narrowed ? <Button variant="ghost" size="sm" onClick={() => { face.setQuery('') }}>{t('clear')}</Button> : null}
        {narrowed
          ? <span className={css.count}>{t('filtered')} · {t('plugins', { count: String(scope.matched) })}</span>
          : null}
      </div>
      <div className={css.pills} role="group" aria-label={t('categories', { count: String(pills.length) })}>
        <Pill active={state.category === null} onClick={() => { face.setCategory(null) }}>
          {t('all')} {catalog.plugins.length}
        </Pill>
        {pills.map(pill => (
          <Pill key={pill.id} active={state.category === pill.id}
            onClick={() => { face.setCategory(state.category === pill.id ? null : pill.id) }}>
            {pill.title} {pill.count}
          </Pill>
        ))}
      </div>
      {total === 0
        ? <p className={css.lede}>{t('empty')}</p>
        : grouped
          ? sections.map(section => (
            <section className={css.group} key={section.id} aria-label={section.title}>
              <div className={css.groupHead}>
                <h3 className={css.groupTitle}>{section.title}</h3>
                <span className={css.groupCount}>{t('plugins', { count: String(section.total) })}</span>
                <button type="button" className={css.groupMore} onClick={() => { face.setCategory(section.id) }}>
                  {t('viewAll', { count: String(section.total) })}
                </button>
              </div>
              <ul className={css.cards}>{section.plugins.map(plugin => row(plugin, plugin.name))}</ul>
            </section>
          ))
          : (
            <>
              <ul className={css.cards}>{shown.map(plugin => row(plugin, plugin.name))}</ul>
              {shown.length < total
                ? (
                  <div className={css.more}>
                    <Button variant="outline" size="sm" onClick={face.showMore}>{t('more')}</Button>
                  </div>
                )
                : null}
            </>
          )}
    </>
  )
}

/**
 * One fact row: a value, or a link that opens in a new tab.
 * @param props - the label, the value, and an optional link.
 * @returns the row.
 */
function Fact(
  { label, value, link }: { readonly label: string; readonly value?: string | undefined; readonly link?: string | undefined },
): ReactNode {
  return (
    <>
      <dt>{label}</dt>
      <dd>{link === undefined ? value : <a href={link} target="_blank" rel="noreferrer noopener">{value ?? link}</a>}</dd>
    </>
  )
}

/**
 * The compatibility tag of one plugin page.
 * @param props - the manifest read and the translator.
 * @returns the tag.
 */
function CompatibilityTag({ read, t }: { readonly read: CompatibilityRead; readonly t: Translate }): ReactNode {
  const badge = compatibilityBadge(read.status === 'ready' ? read.facts : undefined)
  return <Tag tone={badge.tone}>{t(badge.key)}</Tag>
}

/**
 * One plugin's page.
 * @param props - the plugin, the tab state, the actions, the install bridge, and the language.
 * @returns the page.
 */
export function GeneralPluginPage(props: {
  readonly plugin: PluginView
  readonly state: GeneralState
  readonly face: Omit<GeneralFace, 'hooks'>
  readonly install: MarketTabProps['install']
  readonly t: Translate
  readonly language: string
}): ReactNode {
  const { plugin, state, face, install, t, language } = props
  const title = localized(plugin.title, language) || plugin.name
  const version = latestVersion(plugin)
  const facts = state.compatibility.status === 'ready' ? state.compatibility.facts : undefined
  const verdict = facts?.compatibility
  const requirement = requirementOf(unmetRequirements(verdict))
  const category = plugin.category === undefined
    ? undefined
    : state.catalog?.categories.find(entry => entry.id === plugin.category)
  return (
    <div className={css.detail}>
      <button type="button" className={css.back} onClick={face.back}>
        <IconChevronLeftOutlineRegular size={14} aria-hidden="true" />
        {t('back')}
      </button>
      <div className={css.head}>
        <span className={css.headIcon} aria-hidden="true"><MarketIcon src={plugin.icon} size={40} /></span>
        <div className={css.headMain}>
          <h2 className={css.headTitle}>{title}</h2>
          <div className={css.headMeta}>
            {plugin.category === undefined
              ? null
              : <Tag tone="info">{localized(category?.title, language) || plugin.category}</Tag>}
            {targetsTomato(version) ? <Tag tone="warning">{t('compatDsh')}</Tag> : null}
            {verdict?.status !== 'compatible' ? null : <Tag tone="success">{t('compatCurrent')}</Tag>}
            {requirement === undefined ? null : <Tag tone="warning">{t(requirement.key, requirement.params)}</Tag>}
            {facts?.runtimeVersion === undefined
              ? null
              : <span>{t('runtimeVersion', { version: facts.runtimeVersion })}</span>}
            <Tooltip label={t('starNote')} side="bottom" portal delayMs={400}>
              <span className={css.stars}>{starsLabel(starsOf(plugin, state.catalog?.stars ?? {}), t)}</span>
            </Tooltip>
            {plugin.author === undefined ? null : <span>{t('author', { author: plugin.author })}</span>}
          </div>
        </div>
        <div className={css.end}>
          <CompatibilityTag read={state.compatibility} t={t} />
          <Button variant="outline" size="sm" disabled={state.checking !== null || version === undefined}
            onClick={() => { if (version !== undefined) face.install(plugin, version, install) }}>
            {state.checking === plugin.name ? t('checking') : t('install')}
          </Button>
        </div>
      </div>
      {localized(plugin.description, language) === ''
        ? null
        : <p className={css.descriptionFull}>{localized(plugin.description, language)}</p>}
      {version === undefined
        ? null
        : (
          <dl className={css.facts}>
            {version.source.type === 'git'
              ? (
                <>
                  <Fact label={t('sourceGit')} value={version.source.url} />
                  <Fact label={t('sourceCommit')} value={version.source.commit} />
                  {version.source.path === undefined ? null : <Fact label={t('sourceDirectory')} value={version.source.path} />}
                </>
              )
              : (
                <>
                  <Fact label={t('sourcePackage')} value={`${plugin.name}@${version.version}`} />
                  {version.source.registry === undefined ? null : <Fact label={t('sourceRegistry')} value={version.source.registry} />}
                </>
              )}
            {plugin.homepage === undefined ? null : <Fact label={t('homepage')} value={plugin.homepage} link={plugin.homepage} />}
            {plugin.repository === undefined
              ? null
              : <Fact label={t('repository')} value={plugin.repository.url} link={plugin.repository.url} />}
          </dl>
        )}
      <section className={css.group}>
        <h3 className={css.sectionTitle}>{t('versions')}</h3>
        <ul className={css.versions}>
          {plugin.versions.map((entry: ListedVersionView) => (
            <li className={css.version} key={entry.version}>
              <div className={css.versionMain}>
                <span className={css.versionName}>{entry.version}</span>
                <span className={css.meta}>
                  {[
                    formatDate(entry.publishTimestamp, language),
                    entry.tomato === undefined ? '' : t('tomatoRequirement', { range: entry.tomato }),
                    installTarget(plugin, entry).spec,
                  ].filter(part => part !== '').join(' · ')}
                </span>
              </div>
              <Button variant="ghost" size="sm" disabled={state.checking !== null}
                onClick={() => { face.install(plugin, entry, install) }}>
                {t('install')}
              </Button>
            </li>
          ))}
        </ul>
      </section>
      <section className={css.group}>
        <h3 className={css.sectionTitle}>{t('detailTitle')}</h3>
        {state.detail.status === 'none' ? <p className={css.lede}>{t('detailNone')}</p> : null}
        {state.detail.status === 'loading' ? <p className={css.lede} role="status">{t('detailLoading')}</p> : null}
        {state.detail.status === 'found'
          ? (
            <div className={css.markdown}>
              <MarkdownText text={state.detail.markdown} labels={catalogMarkdownLabels(t)} omitHtml />
            </div>
          )
          : null}
        {state.detail.status === 'error'
          ? (
            <div className={css.status}>
              <p className={css.error} role="alert">{t('detailFailed')}：{state.detail.message}</p>
              <Button variant="outline" size="sm" onClick={face.retryDetail}>{t('retryDetail')}</Button>
            </div>
          )
          : null}
      </section>
    </div>
  )
}

/**
 * The tab the Plugins page renders: the list or one plugin's page, its install notice, and a corrected version's note.
 * @param props - owners, translator, the injected state and actions, and the shell's locale hook.
 * @returns the general market tab.
 */
export function GeneralMarket(props: GeneralMarketProps): ReactNode {
  const state = props.useGeneral(snapshot => snapshot)
  // The locale seat re-renders every entry body at a new revision; the selector reads the new language here.
  const language = props.locale(snapshot => snapshot.active)
  props.ensure()
  return (
    <>
      {state.selected === null
        ? <GeneralBrowse state={state} face={props} install={props.install} t={props.t} language={language} />
        : (
          <GeneralPluginPage
            plugin={state.selected}
            state={state}
            face={props}
            install={props.install}
            t={props.t}
            language={language}
          />
        )}
      {state.substitution === null
        ? null
        : (
          <p className={css.substitution} role="status">
            <span className={css.substitutionText}>
              {props.t('substitutedVersion', {
                requested: state.substitution.requested.version,
                selected: state.substitution.selected.version,
                runtime: state.substitution.runtimeVersion ?? '',
              })}
            </span>
            <button type="button" className={css.groupMore} onClick={props.dismissSubstitution}>{props.t('close')}</button>
          </p>
        )}
      {state.notice === null
        ? null
        : (
          <InstallNoticeDialog
            notice={state.notice}
            onClose={props.dismissNotice}
            onContinue={() => { props.confirmOverride(props.install) }}
            onAdapt={() => { props.adaptAndInstall(props.install) }}
            t={props.t}
          />
        )}
    </>
  )
}
