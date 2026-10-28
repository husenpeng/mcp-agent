/**
 * The Skills tab: a lightweight name list beside the selected skill's detail.
 *
 * The body owns no fetch state. It starts a tab through its injected face, reads
 * the tab's bucket from the store, and turns a card's click into a detail read;
 * the catalog arrives without descriptions, and one selection loads that
 * skill's summary and instruction body. The sentinel below the mounted cards is
 * the lazy cursor: it asks the store for the next batch whenever it enters the
 * list's scroller.
 */
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import clsx from 'clsx'
import { Button, Tooltip, IconRefreshOutlineRegular, IconSkillOutlineRegular, Tag } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SkillEntry } from '@deepseek-ai/dsh-api-remotes/client'
import type {
  InjectFace, PropsLocale, PropsRuntime, PropsStore, TranslateNS,
} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from './locales.ts'
import type { SkillBrowserInjected } from './face.ts'
import { failureLine, sourceLabel } from './format.ts'
import type { createSkillBrowserStore, SkillDetailState } from './store.ts'
import { SkillDetail } from './SkillDetail.tsx'
import css from './SkillsBody.module.css'

/** The body's composed props: the tab it draws, its store, its face, and its copy. */
export type SkillsBodyProps =
  & PropsRuntime<'sidebar.right.pane.tab'>
  & PropsStore<ReturnType<typeof createSkillBrowserStore>>
  & InjectFace<SkillBrowserInjected>
  & PropsLocale<'skillBrowser'>

/** The glyph before the chip's title. */
export function SkillsTitle({ useTabInfo }: PropsRuntime<'sidebar.right.pane.tab.title'>): ReactNode {
  const { tab } = useTabInfo()
  return (
    <>
      <IconSkillOutlineRegular size={16} className={css.titleIcon} />
      {tab.title}
    </>
  )
}

/**
 * The name of the skill the detail pane is showing, while one is loading, or
 * `undefined` when the pane is empty.
 * @param detail - the tab's detail state.
 * @returns the selected skill name.
 */
export function selectedName(detail: SkillDetailState): string | undefined {
  if (detail.status === 'idle') return undefined
  if (detail.status === 'ready') return detail.skill.name
  return detail.name
}

/**
 * One skill's row in the name list.
 * @param props.skill - the catalog entry.
 * @param props.selected - whether the detail pane shows this skill.
 * @param props.onOpen - select the skill.
 * @param props.t - localized copy.
 * @returns the list item.
 */
function SkillCard({ skill, selected, onOpen, t }: {
  readonly skill: SkillEntry
  readonly selected: boolean
  readonly onOpen: (name: string) => void
  readonly t: TranslateNS<'skillBrowser'>
}): ReactNode {
  return (
    <li className={css.cardItem}>
      <button
        type="button"
        className={clsx(css.card, selected && css.selected)}
        data-skill-name={skill.name}
        data-skill-selected={selected ? '' : undefined}
        aria-current={selected ? 'true' : undefined}
        aria-label={skill.name}
        onClick={() => { onOpen(skill.name) }}
      >
        <span className={css.cardName}>{skill.name}</span>
        <span className={css.cardTags}>
          <Tag tone="outline">{sourceLabel(t, skill.source)}</Tag>
          {!skill.userInvocable && <Tag tone="quiet">{t('invocation.modelOnly')}</Tag>}
        </span>
      </button>
    </li>
  )
}

/**
 * Render the Skills name list and the selected skill's detail side by side.
 * @param props - framework runtime, store, injected face, and localized copy.
 * @returns the tab body.
 */
export function SkillsBody({
  useTabInfo, useStore, actions, start, reload, openDetail, closeDetail, save, t,
}: SkillsBodyProps): ReactNode {
  const { tab } = useTabInfo()
  const state = useStore(store => store.byTab[tab.id])
  const sentinel = useRef<HTMLLIElement | null>(null)

  useEffect(() => tab.actions.bindCommands({ refresh: () => { reload(tab.id, tab.signal) } }),
    [tab.actions, tab.id, tab.signal, reload])
  useEffect(() => {
    if (state !== undefined || tab.signal.aborted) return
    start(tab.id, tab.signal)
  }, [state, tab.id, tab.signal, start])

  const hasMore = state !== undefined && state.visible < state.list.skills.length
  useEffect(() => {
    if (!hasMore || sentinel.current === null) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) actions.showMore(tab.id)
    })
    observer.observe(sentinel.current)
    return () => { observer.disconnect() }
  }, [actions, tab.id, hasMore, state?.visible])

  if (state === undefined) return null
  const { list, detail } = state
  const selected = selectedName(detail)
  const shown = list.skills.slice(0, state.visible)
  return (
    <div className={css.root} data-skills-state={list.phase}>
      <div className={css.header}>
        <span className={css.heading}>{t('type.label')}</span>
        {list.phase !== 'loading' || list.skills.length > 0
          ? <span className={css.count}>{t('list.count', { count: list.skills.length })}</span>
          : null}
        <Tooltip label={t('list.refresh')} shortcutKeys={tab.refreshShortcut?.keys} side="bottom" delayMs={500}>
          <button
            type="button"
            className={css.tool}
            aria-label={t('list.refresh')}
            aria-keyshortcuts={tab.refreshShortcut?.aria}
            data-skills-reload
            onClick={() => { reload(tab.id, tab.signal) }}
          >
            <IconRefreshOutlineRegular />
          </button>
        </Tooltip>
      </div>
      <div className={css.main}>
        <div className={css.listPane} data-skills-list>
          <div className={css.body}>
            {list.phase === 'loading' && list.skills.length === 0 && (
              <div className={css.skeleton} role="status" aria-label={t('list.loading')} aria-busy="true">
                {[0, 1, 2, 3].map(key => <span key={key} className={css.skeletonCard} />)}
              </div>
            )}
            {list.phase === 'failed' && list.failure !== undefined && (
              <div className={css.failure}>
                <p className={css.failureLine} role="alert">{failureLine(t, list.failure)}</p>
                <Button variant="outline" size="sm" onClick={() => { reload(tab.id, tab.signal) }}>
                  {t('list.retry')}
                </Button>
              </div>
            )}
            {list.failure !== undefined && list.phase === 'ready' && (
              <p className={css.inlineFailure} role="alert">{failureLine(t, list.failure)}</p>
            )}
            {list.phase === 'ready' && list.skills.length === 0 && (
              <p className={css.empty}>{t('list.empty')}</p>
            )}
            {shown.length > 0 && (
              <ul className={css.cards} data-skills-cards>
                {shown.map(skill => (
                  <SkillCard key={skill.name} skill={skill} selected={selected === skill.name} t={t}
                    onOpen={(name) => { openDetail(tab.id, name, tab.signal) }} />
                ))}
                {hasMore && <li ref={sentinel} className={css.sentinel} aria-hidden="true" data-skills-more />}
              </ul>
            )}
          </div>
        </div>
        <div className={css.detailPane} data-skills-detail>
          {detail.status === 'idle'
            ? <p className={css.placeholder}>{t('detail.placeholder')}</p>
            : (
              <SkillDetail
                state={detail}
                t={t}
                onClose={() => { closeDetail(tab.id) }}
                onRetry={(name) => { openDetail(tab.id, name, tab.signal) }}
                onSave={draft => save(tab.id, draft, tab.signal)}
              />
            )}
        </div>
      </div>
    </div>
  )
}
