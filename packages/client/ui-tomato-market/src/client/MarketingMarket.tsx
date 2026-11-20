/**
 * The Marketing plugins tab: the curated catalog, its search and kind filters, one entry's page, and the install and
 * uninstall dialogs. Plugin entries reuse the General tab's compatibility preflight; MCP servers and Skills are
 * installed by the Host from the entry id the bundled catalog pins.
 */
import { useMemo, useState, type ReactNode } from 'react'
import {
  Button, IconChevronDownOutlineRegular, IconChevronLeftOutlineRegular, IconSearchOutlineRegular, Input, MarkdownText,
  Menu, Modal, Pill, SegmentedControl, Tag, type MarkdownLabels,
} from '@tomato/client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
import type { MarketTabProps, MarketingEntry } from './contract.ts'
import type { GeneralState } from './general-controller.ts'
import type { MarketingFace, MarketingState } from './marketing-controller.ts'
import { listedEntries } from './marketing-controller.ts'
import {
  accessTag, entryCounts, filterEntries, kindKey, oneClick, type MarketingKind, type MarketingKindFilter,
} from './marketing-search.ts'
import { catalogMarkdownLabels, formatDate, formatStars, localized } from './catalog.ts'
import { MarketIcon } from './widgets.tsx'
import { InstallNoticeDialog } from './InstallNotice.tsx'
import type { TomatoMarketLocaleKey } from './locales.ts'
import css from './market.module.css'

/** Props of the Marketing plugins tab. */
export type MarketingMarketProps = PropsRuntime<'plugins.tab'> & PropsLocale<'tomatoMarket'> & InjectFace<MarketingFace>

/** The tabs' dictionary text: a key of the tabs' own dictionary, with optional parameters. */
type TranslateText = (key: TomatoMarketLocaleKey, params?: Readonly<Record<string, string>>) => string

/** The translate function the rendered tab receives. */
type Translate = TranslateText

/** The kind control's values, in display order. */
const KINDS: readonly MarketingKindFilter[] = ['all', 'plugin', 'mcp', 'skill']

/**
 * @param url - a repository URL.
 * @returns `owner/repo`, or the URL when it is not on GitHub.
 */
function repositoryLabel(url: string): string {
  return url.replace(/^https?:\/\/github\.com\//, '')
}

/**
 * Catalog Markdown, with raw HTML omitted.
 * @param props - the document and the labels of its chrome.
 * @returns the rendered text.
 */
function CatalogMarkdown({ text, labels }: { readonly text: string; readonly labels: MarkdownLabels }): ReactNode {
  return <div className={css.markdown}><MarkdownText text={text} labels={labels} omitHtml /></div>
}

/**
 * The labels a card and an entry page share.
 * @param props - the entry, whether the profile has it, and the translator.
 * @returns the tag row.
 */
function EntryTags(
  { entry, installed, t }: { readonly entry: MarketingEntry; readonly installed: boolean; readonly t: Translate },
): ReactNode {
  const access = accessTag(entry.access)
  return (
    <span className={css.tags}>
      <Tag tone="outline">{t(kindKey(entry.kind))}</Tag>
      {access === undefined ? null : <Tag tone={access.tone}>{t(access.key)}</Tag>}
      {oneClick(entry) ? null : <Tag tone="neutral">{t('manualInstall')}</Tag>}
      {installed ? <Tag tone="success">{t('installed')}</Tag> : null}
    </span>
  )
}

/**
 * The catalog list.
 * @param props - tab state, the entries, and the actions.
 * @returns the list.
 */
function Browse(props: {
  readonly state: MarketingState
  readonly pluginState: GeneralState
  readonly face: Omit<MarketingFace, 'hooks'>
  readonly install: MarketTabProps['install']
  readonly t: Translate
  readonly language: string
}): ReactNode {
  const { state, pluginState, face, install, t, language } = props
  const [sortMenu, setSortMenu] = useState(false)
  const catalog = state.catalog
  const entries = catalog?.entries ?? []
  const categories = catalog?.categories ?? []
  const installed = useMemo(() => new Set(catalog?.installed ?? []), [catalog])
  const typed = useMemo(
    () => filterEntries(entries, { kind: state.kind, categories, language }),
    [entries, state.kind, categories, language],
  )
  const counts = useMemo(() => entryCounts(typed), [typed])
  const ordered = listedEntries(state)
  const shown = ordered.slice(0, state.limit)
  const totals = useMemo(() => {
    const count = (kind: MarketingKind): string => String(entries.filter(entry => entry.kind === kind).length)
    return { plugins: count('plugin'), mcp: count('mcp'), skills: count('skill') }
  }, [entries])
  return (
    <div className={css.section}>
      {catalog === null ? null : (
        <>
          <p className={css.lede}>{t('marketingLede', totals)}</p>
          <p className={css.banner}>{t('marketingBanner')}</p>
        </>
      )}
      {state.status === 'loading' ? <p className={css.lede} role="status">{t('loading')}</p> : null}
      {state.status === 'error' ? (
        <div className={css.status}>
          <p className={css.error} role="alert">{t('marketingLoadFailed')}：{state.failure}</p>
          <Button variant="outline" size="sm" onClick={face.reload}>{t('retry')}</Button>
        </div>
      ) : null}
      {catalog === null ? null : (
        <>
          <div className={css.toolbar}>
            <Input
              className={css.search}
              type="search"
              value={state.query}
              placeholder={t('marketingSearch')}
              aria-label={t('marketingSearch')}
              icon={<IconSearchOutlineRegular size={16} />}
              onChange={(event) => { face.setQuery(event.target.value) }}
            />
            <Menu
              open={sortMenu}
              onClose={() => { setSortMenu(false) }}
              portal
              autoFocus
              align="end"
              selectedId={state.sort}
              items={(['stars', 'updated', 'name'] as const).map(sort => ({
                id: sort,
                label: t(sort === 'updated' ? 'sortUpdated' : sort === 'name' ? 'sortName' : 'sortStars'),
              }))}
              onSelect={(id) => {
                setSortMenu(false)
                face.setSort(id as 'stars' | 'updated' | 'name')
              }}
              anchor={(
                <Button variant="ghost" size="sm" aria-haspopup="menu" aria-expanded={sortMenu}
                  onClick={() => { setSortMenu(value => !value) }}>
                  {t('sortLabel')}：{t(state.sort === 'updated' ? 'sortUpdated' : state.sort === 'name' ? 'sortName' : 'sortStars')}
                  <IconChevronDownOutlineRegular size={12} aria-hidden="true" />
                </Button>
              )}
            />
          </div>
          <div className={css.filters}>
            <SegmentedControl
              id="tomato-market-kind"
              label={t('kindFilter')}
              value={state.kind}
              options={KINDS.map(kind => ({ value: kind, label: t(kind === 'all' ? 'kindAll' : kindKey(kind)) }))}
              onChange={(kind) => { face.setKind(kind) }}
            />
            <div className={css.pills} role="group" aria-label={t('categories', { count: String(categories.length) })}>
              <Pill active={state.category === null} onClick={() => { face.setCategory(null) }}>{t('all')} {typed.length}</Pill>
              {categories.filter(category => counts.has(category.id)).map(category => (
                <Pill key={category.id} active={state.category === category.id}
                  onClick={() => { face.setCategory(state.category === category.id ? null : category.id) }}>
                  {localized(category.title, language)} {counts.get(category.id)}
                </Pill>
              ))}
            </div>
          </div>
          {ordered.length === 0 ? <p className={css.lede}>{t('empty')}</p> : (
            <>
              <ul className={css.cards}>
                {shown.map(entry => (
                  <li className={css.card} key={entry.id} data-marketing-entry={entry.id}>
                    <span className={css.icon} aria-hidden="true"><MarketIcon /></span>
                    <div className={css.main}>
                      <div className={css.titleRow}>
                        <button type="button" className={css.cardOpen}
                          aria-label={t('open', { name: localized(entry.title, language) })}
                          onClick={() => { face.open(entry) }}>
                          {localized(entry.title, language)}
                        </button>
                        <EntryTags entry={entry} installed={installed.has(entry.id)} t={t} />
                      </div>
                      <span className={css.description}>{localized(entry.description, language)}</span>
                      <span className={css.meta}>{[entry.license, entry.updatedAt, entry.homepage === undefined ? '' : repositoryLabel(entry.homepage)].join(' · ')}</span>
                    </div>
                    <div className={css.end}>
                      <Tag tone="quiet" className={css.stars}>{t('stars', { count: formatStars(entry.stars) })}</Tag>
                      {installed.has(entry.id) || !oneClick(entry)
                        ? <Button variant="outline" size="sm" onClick={() => { face.open(entry) }}>{t(installed.has(entry.id) ? 'viewDetails' : 'viewSteps')}</Button>
                        : (
                          <Button variant="outline" size="sm" disabled={pluginState.checking !== null}
                            onClick={() => {
                              if (entry.install.type === 'plugin') face.installPinned(entry, install)
                              else face.startInstall(entry)
                            }}>
                            {pluginState.checking !== null && entry.install.type === 'plugin' ? t('checking') : t('install')}
                          </Button>
                        )}
                    </div>
                  </li>
                ))}
              </ul>
              {shown.length < ordered.length
                ? (
                  <div className={css.more}>
                    <Button variant="outline" size="sm" onClick={face.showMore}>{t('more')}</Button>
                  </div>
                )
                : null}
            </>
          )}
        </>
      )}
    </div>
  )
}

/**
 * One fact row.
 * @param props - the label, the value, and an optional link.
 * @returns the row.
 */
function Fact({ label, value, link }: { readonly label: string; readonly value?: string; readonly link?: string }): ReactNode {
  return (
    <>
      <dt>{label}</dt>
      <dd>{link === undefined ? value : <a href={link} target="_blank" rel="noreferrer noopener">{value}</a>}</dd>
    </>
  )
}

/**
 * One entry's page.
 * @param props - the entry, the tab state, and the actions.
 * @returns the page.
 */
function EntryPage(props: {
  readonly entry: MarketingEntry
  readonly state: MarketingState
  readonly face: Omit<MarketingFace, 'hooks'>
  readonly install: MarketTabProps['install']
  readonly t: Translate
  readonly language: string
  readonly labels: MarkdownLabels
}): ReactNode {
  const { entry, state, face, install, t, language, labels } = props
  const installed = state.catalog?.installed.includes(entry.id) === true
  const target = entry.install
  const action = (): ReactNode => {
    if (target.type === 'manual') return null
    if (!installed) {
      return (
        <Button variant="outline" size="sm" onClick={() => {
          if (target.type === 'plugin') face.installPinned(entry, install)
          else face.startInstall(entry)
        }}>
          {t('install')}
        </Button>
      )
    }
    return target.type === 'plugin'
      ? <Button variant="outline" size="sm" onClick={() => { face.closeDialog() }}>{t('managePlugin')}</Button>
      : <Button variant="outline" size="sm" onClick={() => { face.startUninstall(entry) }}>{t('uninstall')}</Button>
  }
  return (
    <div className={css.detail}>
      <button type="button" className={css.back} onClick={face.back}>
        <IconChevronLeftOutlineRegular size={14} aria-hidden="true" />
        {t('marketingBack')}
      </button>
      <div className={css.head}>
        <span className={css.headIcon} aria-hidden="true"><MarketIcon size={40} /></span>
        <div className={css.headMain}>
          <h2 className={css.headTitle}>{localized(entry.title, language)}</h2>
          <div className={css.headMeta}>
            <EntryTags entry={entry} installed={installed} t={t} />
            <span className={css.stars}>{t('stars', { count: formatStars(entry.stars) })}</span>
            {entry.categories.map(id => (
              <span key={id}>{localized(state.catalog?.categories.find(category => category.id === id)?.title, language)}</span>
            ))}
          </div>
        </div>
        <div className={css.end}>{action()}</div>
      </div>
      <p className={css.descriptionFull}>{localized(entry.description, language)}</p>
      <dl className={css.facts}>
        {entry.homepage === undefined ? null : <Fact label={t('repository')} value={repositoryLabel(entry.homepage)} link={entry.homepage} />}
        {entry.license === undefined ? null : <Fact label={t('license')} value={entry.license} />}
        {entry.updatedAt === undefined ? null : <Fact label={t('updated')} value={formatDate(Date.parse(entry.updatedAt) / 1000, language)} />}
        {target.type === 'mcp' || target.type === 'plugin'
          ? <Fact label={t('packageName')} value={target.type === 'mcp' ? target.package : target.name} />
          : null}
        {target.type === 'mcp' || target.type === 'plugin' ? <Fact label={t('pinnedVersion')} value={target.version} /> : null}
        {target.type === 'skill' ? <Fact label={t('pinnedCommit')} value={target.commit.slice(0, 12)} /> : null}
      </dl>
      {entry.access === 'login'
        ? (
          <p className={css.callout} role="note">
            <span className={css.calloutTitle}>{t('loginRiskTitle')}</span>
            <span>{t('loginRiskBody')}</span>
          </p>
        )
        : null}
      {target.type === 'manual'
        ? (
          <section className={css.group}>
            <h3 className={css.sectionTitle}>{t('stepsTitle')}</h3>
            <CatalogMarkdown text={localized(target.steps, language)} labels={labels} />
          </section>
        )
        : null}
      {target.type === 'skill'
        ? (
          <section className={css.group}>
            <h3 className={css.sectionTitle}>{t('skillsTitle', { count: String(target.skills.length) })}</h3>
            <ul className={css.chips}>{target.skills.map(skill => <li key={skill.name}><Tag tone="outline">{skill.name}</Tag></li>)}</ul>
          </section>
        )
        : null}
      {state.detail.status === 'loading' ? <p className={css.lede} role="status">{t('detailLoading')}</p> : null}
      {state.detail.status === 'none' ? <p className={css.lede}>{t('detailNone')}</p> : null}
      {state.detail.status === 'found' ? <CatalogMarkdown text={state.detail.markdown} labels={labels} /> : null}
      {state.detail.status === 'error'
        ? (
          <div className={css.status}>
            <p className={css.error} role="alert">{t('detailFailed')}：{state.detail.message}</p>
            <Button variant="outline" size="sm" onClick={face.retryDetail}>{t('retryDetail')}</Button>
          </div>
        )
        : null}
    </div>
  )
}

/**
 * The install and uninstall confirmation.
 * @param props - the dialog, the actions, and the translator.
 * @returns the dialog.
 */
function ActionDialog(props: { readonly dialog: NonNullable<MarketingState['dialog']>; readonly face: Omit<MarketingFace, 'hooks'>; readonly t: Translate; readonly language: string }): ReactNode {
  const { dialog, face, t, language } = props
  const { entry, phase } = dialog
  const title = localized(entry.title, language)
  const blocked = dialog.mode === 'install' && dialog.phase === 'ready' && dialog.preview.kind === 'skill' && dialog.preview.conflicts.length > 0
  // An uninstall dialog only opens for MCP servers and Skill entries, whose installs name what they own.
  const skillNames = entry.install.type === 'skill' ? entry.install.skills.map(skill => skill.name).join(', ') : ''
  const dialogTitle = dialog.mode === 'uninstall'
    ? t('confirmUninstallTitle', { name: title })
    : t(entry.kind === 'mcp' ? 'confirmMcpTitle' : 'confirmSkillTitle', { name: title })
  return (
    <Modal
      open
      onClose={face.closeDialog}
      title={dialogTitle}
      closeLabel={t('close')}
      footer={(
        <>
          {phase === 'ready' && !blocked
            ? <Button variant="primary" size="sm" onClick={face.confirm}>{t(dialog.mode === 'install' ? 'confirmInstall' : 'confirmUninstall')}</Button>
            : null}
          <Button variant="ghost" size="sm" onClick={face.closeDialog}>{t('close')}</Button>
        </>
      )}
    >
      <div className={css.notice}>
        {phase === 'loading' ? <p role="status">{t('confirmLoading')}</p> : null}
        {phase === 'working' ? <p role="status">{t('working')}</p> : null}
        {phase === 'failed' ? <p className={css.error} role="alert">{t('actionFailed', { reason: dialog.reason })}</p> : null}
        {phase === 'ready' && dialog.mode === 'install' ? (
          <>
            <p>{t('confirmSource', { repository: entry.homepage === undefined ? '' : repositoryLabel(entry.homepage) })}</p>
            {dialog.preview.kind === 'mcp' ? (
              <>
                <p>{t('confirmCommand')}</p>
                <pre className={css.code}>{dialog.preview.command}</pre>
                <p>{t('confirmYaml')}</p>
                <pre className={css.code}>{dialog.preview.yaml}</pre>
                {dialog.preview.runnerMissing === undefined ? null : (
                  <p className={css.callout} role="alert">
                    {t('runnerMissing', {
                      runner: dialog.preview.runnerMissing,
                      hint: t(dialog.preview.runnerMissing === 'uvx' ? 'runnerHintUvx' : 'runnerHintNpx'),
                    })}
                  </p>
                )}
              </>
            ) : (
              <>
                <p>{t('confirmSkills')}</p>
                <pre className={css.code}>{dialog.preview.skills.join('\n')}</pre>
                {dialog.preview.conflicts.length === 0
                  ? null
                  : <p className={css.callout} role="alert">{t('skillConflict', { skills: dialog.preview.conflicts.join(', ') })}</p>}
              </>
            )}
          </>
        ) : null}
        {phase === 'ready' && dialog.mode === 'uninstall'
          ? <p>{entry.kind === 'mcp' ? t('uninstallMcpBody') : t('uninstallSkillBody', { skills: skillNames })}</p>
          : null}
        {phase === 'done' ? (
          <>
            <p role="status">{t(dialog.mode === 'install' ? 'installDone' : 'uninstallDone', { name: title })}</p>
            <p>{t(entry.kind === 'skill' ? 'skillAppliedHint' : dialog.result.application === 'applied' ? 'appliedHint' : 'restartHint')}</p>
            {(dialog.result.warnings ?? []).length === 0 ? null : (
              <>
                <p>{t('warningsTitle')}</p>
                <pre className={css.code}>{(dialog.result.warnings ?? []).map(String).join('\n')}</pre>
              </>
            )}
          </>
        ) : null}
      </div>
    </Modal>
  )
}

/**
 * The tab the Plugins page renders.
 * @param props - the owner bridges, the translator, the injected state and actions, and the shell's locale hook.
 * @returns the marketing tab.
 */
export function MarketingMarket(props: MarketingMarketProps): ReactNode {
  const state = props.useMarketing(snapshot => snapshot)
  const pluginState = props.usePlugins(snapshot => snapshot)
  const language = props.locale(snapshot => snapshot.active)
  props.ensure()
  return (
    <MarketingTab
      state={state}
      pluginState={pluginState}
      container={props}
      tab={{ install: props.install, t: props.t }}
      language={language}
      labels={catalogMarkdownLabels(props.t)}
    />
  )
}

/**
 * What the Marketing tab renders: the list or an entry's page, the confirmation dialog, and the preflight outcomes
 * the General tab's plugin checks produce.
 * @param props - the tab state, the preflight state, the actions, and the language.
 * @returns the rendered tab.
 */
export function MarketingTab(props: {
  readonly state: MarketingState
  readonly pluginState: GeneralState
  readonly container: Omit<MarketingFace, 'hooks'>
  readonly tab: { readonly install: MarketTabProps['install']; readonly t: TranslateText }
  readonly language: string
  /** The Markdown chrome, bound once by the registered tab so a render passes stable labels. */
  readonly labels: MarkdownLabels
}): ReactNode {
  const { state, pluginState, container, tab, language, labels } = props
  const { t, install } = tab
  const entry = state.selected === null ? undefined : state.catalog?.entries.find(candidate => candidate.id === state.selected)
  return (
    <>
      {entry === undefined
        ? <Browse state={state} pluginState={pluginState} face={container} install={install} t={t} language={language} />
        : <EntryPage entry={entry} state={state} face={container} install={install} t={t} language={language} labels={labels} />}
      {state.dialog === null ? null : <ActionDialog dialog={state.dialog} face={container} t={t} language={language} />}
      {pluginState.notice === null
        ? null
        : (
          <InstallNoticeDialog
            notice={pluginState.notice}
            onClose={container.dismissPluginNotice}
            onContinue={() => { container.confirmPluginOverride(install) }}
            onAdapt={() => { container.adaptPlugin(install) }}
            t={t}
          />
        )}
      {pluginState.substitution === null
        ? null
        : (
          <p className={css.substitution} role="status">
            <span className={css.substitutionText}>
              {t('substitutedVersion', {
                requested: pluginState.substitution.requested.version,
                selected: pluginState.substitution.selected.version,
                runtime: pluginState.substitution.runtimeVersion ?? '',
              })}
            </span>
            <button type="button" className={css.groupMore} onClick={container.dismissPluginNotice}>{t('close')}</button>
          </p>
        )}
    </>
  )
}
