/** The Marketing plugins tab: curated catalog list, entry page, and install and uninstall dialogs. */
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import {
  Button, DetailDocument, IconChevronDownOutlineRegular, IconChevronLeftOutlineRegular, IconSearchOutlineRegular,
  Input, MarkdownText, Menu, Modal, Pill, SegmentedControl, Tag, useDetailDocumentLabels,
} from '@tomato/client-ui-primitives'
import { accessTag, entryCounts, filterEntries, kindKey, oneClick, pluginTarget, sortEntries } from './marketing-search.js'
import { formatStars, localized } from './search.js'
import { installStyles } from './styles.js'
import { MarketIcon, MarketSkeletons } from './widgets.jsx'
import { InstallNotice } from './notice.jsx'

const SORTS = ['stars', 'updated', 'name']
const KINDS = ['all', 'plugin', 'mcp', 'skill']

/** @param {string} sort - sort id. @returns {string} its label key. */
function sortKey(sort) {
  switch (sort) {
    case 'updated': return 'sortUpdated'
    case 'name': return 'sortName'
    default: return 'sortStars'
  }
}

/** @param {string} url - repository URL. @returns {string} `owner/repo`, or the URL when it is not on GitHub. */
function repositoryLabel(url) {
  return url.replace(/^https?:\/\/github\.com\//, '')
}

/** Start one entry's install: plugins go through the Plugins page's dialog, MCP and Skill entries through this tab's. */
function beginInstall(controller, entry, install) {
  if (entry.install.type === 'plugin') {
    const { plugin, version } = pluginTarget(entry)
    void controller.plugins.install(plugin, version, install)
  } else {
    void controller.startInstall(entry)
  }
}

/** Localized chrome of the Markdown this tab renders. */
function useMarkdownLabels(t) {
  return useDetailDocumentLabels({
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
}

/** The labels shared by a card and an entry page. */
function EntryTags({ entry, installed, t }) {
  const access = accessTag(entry.access)
  return (
    <span className="tm-tags">
      <Tag tone="outline">{t(kindKey(entry.kind))}</Tag>
      {access === undefined ? null : <Tag tone={access.tone}>{t(access.key)}</Tag>}
      {oneClick(entry) ? null : <Tag tone="neutral">{t('manualInstall')}</Tag>}
      {installed ? <Tag tone="success">{t('installed')}</Tag> : null}
    </span>
  )
}

/** One catalog row. */
function EntryCard({ entry, installed, checking, language, t, onOpen, onInstall }) {
  const title = localized(entry.title, language)
  return (
    <li className="tm-card" data-marketing-entry={entry.id}>
      <span className="tm-icon" aria-hidden="true"><MarketIcon /></span>
      <div className="tm-main">
        <div className="tm-titleRow">
          <button type="button" className="tm-cardOpen" aria-label={t('open', { name: title })} onClick={onOpen}>{title}</button>
          <EntryTags entry={entry} installed={installed} t={t} />
        </div>
        <span className="tm-description">{localized(entry.description, language)}</span>
        <span className="tm-meta">{[entry.license, entry.pushedAt, repositoryLabel(entry.repository)].join(' · ')}</span>
      </div>
      <div className="tm-end">
        <Tag tone="quiet" className="tm-stars">{t('stars', { count: formatStars(entry.stars) })}</Tag>
        {installed || !oneClick(entry)
          ? <Button variant="outline" size="sm" onClick={onOpen}>{t(installed ? 'viewDetails' : 'viewSteps')}</Button>
          : <Button variant="outline" size="sm" disabled={checking} onClick={onInstall}>{t(checking ? 'checking' : 'install')}</Button>}
      </div>
    </li>
  )
}

/** The catalog list. */
function Browse({ state, pluginCheck, controller, install, t }) {
  const [sortMenu, setSortMenu] = useState(false)
  const { catalog, language } = state
  const entries = catalog?.entries ?? []
  const categories = catalog?.categories ?? []
  const installed = useMemo(() => new Set(catalog?.installed ?? []), [catalog])
  const typed = useMemo(() => filterEntries(entries, { kind: state.kind, categories, language }), [entries, state.kind, categories, language])
  const counts = useMemo(() => entryCounts(typed), [typed])
  const matched = useMemo(() => filterEntries(entries, {
    query: state.query, category: state.category, kind: state.kind, categories, language,
  }), [entries, state.query, state.category, state.kind, categories, language])
  const ordered = useMemo(() => sortEntries(matched, state.sort, language), [matched, state.sort, language])
  const shown = ordered.slice(0, state.limit)
  const totals = useMemo(() => {
    const count = kind => entries.filter(entry => entry.kind === kind).length
    return { plugins: String(count('plugin')), mcp: String(count('mcp')), skills: String(count('skill')) }
  }, [entries])
  return (
    <div className="tm-section">
      {catalog === null ? null : (
        <>
          <p className="tm-lede">{t('marketingLede', totals)}</p>
          <p className="tm-banner">{t('marketingBanner')}</p>
        </>
      )}
      {state.status === 'loading' ? <MarketSkeletons label={t('loading')} /> : null}
      {state.status === 'error' ? (
        <div className="tm-status">
          <p className="tm-error" role="alert">{t('marketingLoadFailed')}：{state.failure}</p>
          <Button variant="outline" size="sm" onClick={controller.reload}>{t('retry')}</Button>
        </div>
      ) : null}
      {catalog === null ? null : (
        <>
          <div className="tm-toolbar">
            <Input
              className="tm-search"
              type="search"
              value={state.query}
              placeholder={t('marketingSearch')}
              aria-label={t('marketingSearch')}
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
              items={SORTS.map(sort => ({ id: sort, label: t(sortKey(sort)) }))}
              onSelect={(id) => {
                setSortMenu(false)
                controller.setSort(id)
              }}
              anchor={(
                <Button variant="ghost" size="sm" aria-haspopup="menu" aria-expanded={sortMenu}
                  onClick={() => { setSortMenu(value => !value) }}>
                  {t('sortLabel')}：{t(sortKey(state.sort))}
                  <IconChevronDownOutlineRegular size={12} aria-hidden="true" />
                </Button>
              )}
            />
          </div>
          <div className="tm-filters">
            <SegmentedControl
              id="tomato-market-kind"
              label={t('kindFilter')}
              value={state.kind}
              options={KINDS.map(kind => ({ value: kind, label: t(kind === 'all' ? 'kindAll' : kindKey(kind)) }))}
              onChange={controller.setKind}
            />
            <div className="tm-pills" role="group" aria-label={t('categories', { count: String(categories.length) })}>
              <Pill active={state.category === null} onClick={() => { controller.setCategory(null) }}>{t('all')} {typed.length}</Pill>
              {categories.filter(category => counts.has(category.id)).map(category => (
                <Pill key={category.id} active={state.category === category.id}
                  onClick={() => { controller.setCategory(state.category === category.id ? null : category.id) }}>
                  {localized(category.title, language)} {counts.get(category.id)}
                </Pill>
              ))}
            </div>
          </div>
          {matched.length === 0 ? <p className="tm-lede">{t('empty')}</p> : (
            <>
              <ul className="tm-cards">
                {shown.map(entry => (
                  <EntryCard key={entry.id} entry={entry} installed={installed.has(entry.id)} language={language} t={t}
                    checking={entry.install.type === 'plugin' && pluginCheck === entry.install.name}
                    onOpen={() => { controller.open(entry) }} onInstall={() => { beginInstall(controller, entry, install) }} />
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
      )}
    </div>
  )
}

/** Markdown the catalog authors. */
function CatalogMarkdown({ text, labels }) {
  return <div className="tm-markdown"><MarkdownText text={text} labels={labels.markdown} omitHtml /></div>
}

/** One fact row. */
function Fact({ label, value, link }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{link === undefined ? value : <a href={link} target="_blank" rel="noreferrer noopener">{value}</a>}</dd>
    </>
  )
}

/** One entry's page. */
function EntryPage({ entry, state, pluginCheck, controller, install, openPackage, t }) {
  const { language } = state
  const installed = state.catalog.installed.includes(entry.id)
  const { install: target } = entry
  const labels = useMarkdownLabels(t)
  const documentState = state.detail.status === 'found'
    ? { status: 'found', markdown: state.detail.markdown }
    : state.detail.status === 'none' ? { status: 'none' }
      : state.detail.status === 'error' ? { status: 'error', message: `${t('detailFailed')}：${state.detail.message}` }
        : { status: 'loading' }
  const action = () => {
    if (target.type === 'manual') return null
    if (!installed) return (
      <Button variant="outline" size="sm" disabled={pluginCheck === target.name} onClick={() => { beginInstall(controller, entry, install) }}>
        {pluginCheck === target.name ? t('checking') : t('install')}
      </Button>
    )
    return target.type === 'plugin'
      ? <Button variant="outline" size="sm" onClick={() => { openPackage(target.name) }}>{t('managePlugin')}</Button>
      : <Button variant="outline" size="sm" onClick={() => { controller.startUninstall(entry) }}>{t('uninstall')}</Button>
  }
  return (
    <div className="tm-detail">
      <button type="button" className="tm-back" onClick={controller.back}>
        <IconChevronLeftOutlineRegular size={14} aria-hidden="true" />
        {t('marketingBack')}
      </button>
      <div className="tm-head">
        <span className="tm-headIcon" aria-hidden="true"><MarketIcon size={40} /></span>
        <div className="tm-headMain">
          <h2 className="tm-headTitle">{localized(entry.title, language)}</h2>
          <div className="tm-headMeta">
            <EntryTags entry={entry} installed={installed} t={t} />
            <span className="tm-stars">{t('stars', { count: formatStars(entry.stars) })}</span>
            {entry.categories.map(id => (
              <span key={id}>{localized(state.catalog.categories.find(category => category.id === id)?.title, language)}</span>
            ))}
          </div>
        </div>
        <div className="tm-end">{action()}</div>
      </div>
      <p className="tm-descriptionFull">{localized(entry.description, language)}</p>
      <dl className="tm-facts">
        <Fact label={t('repository')} value={repositoryLabel(entry.repository)} link={entry.repository} />
        <Fact label={t('license')} value={entry.license} />
        <Fact label={t('updated')} value={entry.pushedAt} />
        {target.type === 'mcp' || target.type === 'plugin' ? <Fact label={t('packageName')} value={target.package ?? target.name} /> : null}
        {target.type === 'mcp' || target.type === 'plugin' ? <Fact label={t('pinnedVersion')} value={target.version} /> : null}
        {target.type === 'skill' ? <Fact label={t('pinnedCommit')} value={target.commit.slice(0, 12)} /> : null}
      </dl>
      {entry.access === 'login' ? <LoginRisk t={t} /> : null}
      {entry.setup === undefined ? null : (
        <section className="tm-group">
          <h3 className="tm-sectionTitle">{t('setupTitle')}</h3>
          <CatalogMarkdown text={localized(entry.setup, language)} labels={labels} />
        </section>
      )}
      {entry.env === undefined ? null : <EnvList names={entry.env} labels={labels} t={t} />}
      {target.type !== 'manual' ? null : (
        <section className="tm-group">
          <h3 className="tm-sectionTitle">{t('stepsTitle')}</h3>
          <CatalogMarkdown text={localized(target.steps, language)} labels={labels} />
        </section>
      )}
      {target.type !== 'skill' ? null : (
        <section className="tm-group">
          <h3 className="tm-sectionTitle">{t('skillsTitle', { count: String(target.skills.length) })}</h3>
          <ul className="tm-chips">{target.skills.map(skill => <li key={skill.name}><Tag tone="outline">{skill.name}</Tag></li>)}</ul>
        </section>
      )}
      <section className="tm-group">
        <h3 className="tm-sectionTitle">{t('detailTitle')}</h3>
        {state.detail.status === 'none' ? <p className="tm-lede">{t('detailNone')}</p> : null}
        <DetailDocument state={documentState} labels={labels} onRetry={controller.retryDetail} />
      </section>
    </div>
  )
}

/** The account-risk warning of an entry that reads with the user's login. */
function LoginRisk({ t }) {
  return (
    <p className="tm-callout" role="note">
      <span className="tm-calloutTitle">{t('loginRiskTitle')}</span>
      <span>{t('loginRiskBody')}</span>
    </p>
  )
}

/** The variables an entry reads from the user's environment. */
function EnvList({ names, labels, t }) {
  return (
    <section className="tm-group">
      <h3 className="tm-sectionTitle">{t('envTitle')}</h3>
      <ul className="tm-chips">{names.map(name => <li key={name}><Tag tone="outline">{name}</Tag></li>)}</ul>
      <CatalogMarkdown text={t('envHint')} labels={labels} />
    </section>
  )
}

/** @param {object} dialog - dialog state. @param {string} title - entry title. @param {Function} t - translator. @returns {string} the dialog title. */
function dialogTitle(dialog, title, t) {
  if (dialog.mode === 'uninstall') return t('confirmUninstallTitle', { name: title })
  return t(dialog.entry.kind === 'mcp' ? 'confirmMcpTitle' : 'confirmSkillTitle', { name: title })
}

/** What the confirmation shows before an install. */
function InstallPreview({ dialog, language, labels, t }) {
  const { entry, preview } = dialog
  const conflicts = preview.conflicts ?? []
  return (
    <>
      <p>{t('confirmSource', { repository: repositoryLabel(entry.repository) })}</p>
      {entry.access === 'login' ? <LoginRisk t={t} /> : null}
      {preview.kind === 'mcp' ? (
        <>
          <p>{t('confirmCommand')}</p>
          <pre className="tm-code">{preview.command}</pre>
          <p>{t('confirmYaml')}</p>
          <pre className="tm-code">{preview.yaml}</pre>
        </>
      ) : (
        <>
          <p>{t('confirmSkills')}</p>
          <pre className="tm-code">{preview.skills.join('\n')}</pre>
        </>
      )}
      {preview.runnerMissing === undefined ? null : (
        <p className="tm-callout" role="alert">
          {t('runnerMissing', { runner: preview.runnerMissing, hint: t(preview.runnerMissing === 'uvx' ? 'runnerHintUvx' : 'runnerHintNpx') })}
        </p>
      )}
      {conflicts.length === 0 ? null : <p className="tm-callout" role="alert">{t('skillConflict', { skills: conflicts.join(', ') })}</p>}
      {entry.setup === undefined ? null : (
        <div className="tm-group">
          <span className="tm-sectionTitle">{t('setupTitle')}</span>
          <CatalogMarkdown text={localized(entry.setup, language)} labels={labels} />
        </div>
      )}
      {entry.env === undefined ? null : <EnvList names={entry.env} labels={labels} t={t} />}
    </>
  )
}

/** What the dialog shows after the Host finished. */
function ActionResult({ dialog, title, t }) {
  const { mode, entry, result } = dialog
  const warnings = result.warnings ?? []
  const hint = entry.kind === 'skill' ? 'skillAppliedHint' : result.application === 'applied' ? 'appliedHint' : 'restartHint'
  return (
    <>
      <p role="status">{t(mode === 'install' ? 'installDone' : 'uninstallDone', { name: title })}</p>
      <p>{t(hint)}</p>
      {warnings.length === 0 ? null : (
        <>
          <p>{t('warningsTitle')}</p>
          <pre className="tm-code">{warnings.join('\n')}</pre>
        </>
      )}
    </>
  )
}

/** The install and uninstall dialog. */
function ActionDialog({ dialog, language, controller, t }) {
  const labels = useMarkdownLabels(t)
  const { entry, phase, mode } = dialog
  const title = localized(entry.title, language)
  const blocked = mode === 'install' && (dialog.preview?.conflicts ?? []).length > 0
  const skillNames = entry.install.skills?.map(skill => skill.name).join(', ') ?? ''
  return (
    <Modal
      open
      onClose={controller.closeDialog}
      title={dialogTitle(dialog, title, t)}
      closeLabel={t('close')}
      footer={(
        <>
          {phase === 'ready' && !blocked ? (
            <Button variant="primary" size="sm" onClick={() => { void controller.confirm() }}>
              {t(mode === 'install' ? 'confirmInstall' : 'confirmUninstall')}
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={controller.closeDialog}>{t('close')}</Button>
        </>
      )}
    >
      <div className="tm-notice">
        {phase === 'loading' ? <p role="status">{t('confirmLoading')}</p> : null}
        {phase === 'working' ? <p role="status">{t('working')}</p> : null}
        {phase === 'failed' ? <p className="tm-error" role="alert">{t('actionFailed', { reason: dialog.reason })}</p> : null}
        {phase === 'ready' && mode === 'install' ? <InstallPreview dialog={dialog} language={language} labels={labels} t={t} /> : null}
        {phase === 'ready' && mode === 'uninstall' ? (
          <p>{entry.kind === 'mcp' ? t('uninstallMcpBody') : t('uninstallSkillBody', { skills: skillNames })}</p>
        ) : null}
        {phase === 'done' ? <ActionResult dialog={dialog} title={title} t={t} /> : null}
      </div>
    </Modal>
  )
}

/**
 * The tab component the Plugins page renders.
 * @param {{ controller: object, t: Function, install: Function, openPackage: Function }} props - the page's bridges and this tab's state.
 * @returns {JSX.Element} the tab.
 */
export function MarketingTab({ controller, t, install, openPackage }) {
  const state = useSyncExternalStore(controller.store.subscribe, controller.store.get, controller.store.get)
  const pluginState = useSyncExternalStore(controller.plugins.store.subscribe, controller.plugins.store.get, controller.plugins.store.get)
  useEffect(() => { installStyles() }, [])
  useEffect(() => { controller.ensure() }, [controller])
  const entry = state.selected === null ? undefined : state.catalog?.entries.find(candidate => candidate.id === state.selected)
  return (
    <>
      {entry === undefined
        ? <Browse state={state} pluginCheck={pluginState.checking} controller={controller} install={install} t={t} />
        : <EntryPage entry={entry} state={state} pluginCheck={pluginState.checking} controller={controller} install={install} openPackage={openPackage} t={t} />}
      {state.dialog === null ? null : <ActionDialog dialog={state.dialog} language={state.language} controller={controller} t={t} />}
      {pluginState.notice === null ? null : (
        <InstallNotice notice={pluginState.notice} t={t} onClose={controller.plugins.dismissNotice}
          onContinue={() => { controller.plugins.confirmOverride(install) }}
          onAdapt={() => { void controller.plugins.adaptAndInstall(install) }} />
      )}
    </>
  )
}
