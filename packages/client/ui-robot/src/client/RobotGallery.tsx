/** Card grid of hireable templates and hired robots, with search and a status filter. */
import type { ReactNode } from 'react'
import { useState } from 'react'
import type { Robot, RobotSpecRevision, RobotTemplate, RobotTemplateText, Run } from '@tomato/api-robot-controller/client'
import type { TranslateNS } from '@tomato/client-ui-slots'
import { Button, IconPlusOutlineRegular, IconSearchOutlineRegular, Input, Pill, StateDot, Tag } from '@tomato/client-ui-primitives'
import type { NS } from './locales.ts'
import type { RobotStatusFilter } from './store.ts'
import { RobotAvatar } from './RobotAvatar.tsx'
import css from './RobotGallery.module.css'

/** Props of the gallery. */
export interface RobotGalleryProps {
  readonly t: TranslateNS<typeof NS>
  readonly templates: readonly RobotTemplate[]
  readonly robots: readonly Robot[]
  readonly specs: readonly RobotSpecRevision[]
  readonly runs: readonly Run[]
  /** Template copy for the active locale. */
  readonly textOf: (template: RobotTemplate) => RobotTemplateText
  readonly query: string
  readonly filter: RobotStatusFilter
  readonly onQuery: (query: string) => void
  readonly onFilter: (filter: RobotStatusFilter) => void
  /** Hire the template; resolves after the robot exists or the failure was reported. */
  readonly onHire: (template: RobotTemplate) => Promise<void>
  readonly onOpen: (robot: Robot) => void
  readonly onCreate: () => void
  readonly onCreateWithChat?: (() => void) | undefined
}

const FILTERS: readonly RobotStatusFilter[] = ['all', 'running', 'idle']

function matches(query: string, ...fields: readonly (string | undefined)[]): boolean {
  const needle = query.trim().toLowerCase()
  return needle === '' || fields.some(field => field?.toLowerCase().includes(needle) === true)
}

/**
 * Render the template marketplace above the hired robots.
 * @param props - registry data, filter state, and actions.
 * @returns the gallery body.
 */
export function RobotGallery({
  t, templates, robots, specs, runs, textOf, query, filter, onQuery, onFilter, onHire, onOpen, onCreate, onCreateWithChat,
}: RobotGalleryProps): ReactNode {
  const [hiring, setHiring] = useState<string>()
  const runCount = new Map<string, number>()
  for (const run of runs) runCount.set(run.robot, (runCount.get(run.robot) ?? 0) + 1)
  const specOf = new Map(specs.map(revision => [revision.ref.spec, revision.spec] as const))

  const shownRobots = robots.filter(robot =>
    (filter === 'all' || (filter === 'running') === (robot.state === 'running'))
    && matches(query, robot.name, specOf.get(robot.spec.spec)?.description))
  const shownTemplates = filter === 'running' ? [] : templates.filter((template) => {
    const text = textOf(template)
    return matches(query, text.name, text.description, text.category)
  })

  const hire = (template: RobotTemplate): void => {
    setHiring(template.id)
    void onHire(template).finally(() => { setHiring(undefined) })
  }

  return (
    <div className={css.gallery}>
      <div className={css.toolbar}>
        <Input
          className={css.search}
          icon={<IconSearchOutlineRegular size={16} />}
          value={query}
          placeholder={t('gallery.search')}
          aria-label={t('gallery.search')}
          onChange={(event) => { onQuery(event.target.value) }}
        />
        <Button size="sm" variant="primary" onClick={onCreate}>{t('roster.new')}</Button>
        {onCreateWithChat === undefined ? null : <Button size="sm" variant="ghost" onClick={onCreateWithChat}>{t('roster.createWithChat')}</Button>}
      </div>
      <div className={css.filters} role="group" aria-label={t('gallery.filter')}>
        {FILTERS.map(value => (
          <Pill key={value} active={filter === value} aria-pressed={filter === value} onClick={() => { onFilter(value) }}>
            {t(`gallery.filter.${value}`)}
          </Pill>
        ))}
      </div>

      <section aria-label={t('gallery.mine')}>
        <h2 className={css.sectionTitle}>{t('gallery.mine')}</h2>
        {shownRobots.length === 0
          ? <p className={css.empty}>{robots.length === 0 ? t('roster.empty') : t('gallery.noMatch')}</p>
          : (
            <ul className={css.grid}>
              {shownRobots.map(robot => (
                <li key={robot.id} className={css.card}>
                  <div className={css.head}>
                    <RobotAvatar name={robot.name} skills={specOf.get(robot.spec.spec)?.capability.skills ?? []} />
                    <button type="button" className={css.open} onClick={() => { onOpen(robot) }}>{robot.name}</button>
                    <span className={css.state}>
                      <StateDot state={robot.state === 'running' ? 'ongoing' : robot.state === 'failed' ? 'error' : 'idle'} />
                      {robot.state === 'running' ? t('roster.running') : t('roster.idle')}
                    </span>
                  </div>
                  <p className={css.description}>{specOf.get(robot.spec.spec)?.description ?? ''}</p>
                  <span className={css.meta}>{t('gallery.runCount', { count: runCount.get(robot.id) ?? 0 })}</span>
                </li>
              ))}
            </ul>
          )}
      </section>

      {shownTemplates.length === 0 ? null : (
        <section aria-label={t('gallery.templates')}>
          <h2 className={css.sectionTitle}>{t('gallery.templates')}</h2>
          <ul className={css.grid}>
            {shownTemplates.map((template) => {
              const text = textOf(template)
              return (
                <li key={template.id} className={css.card}>
                  <div className={css.head}>
                    <RobotAvatar name={text.name} skills={template.spec.capability.skills} />
                    <span className={css.title}>{text.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={hiring !== undefined}
                      aria-label={t('gallery.hireNamed', { name: text.name })}
                      title={t('gallery.hire')}
                      onClick={() => { hire(template) }}
                    >
                      <IconPlusOutlineRegular size={16} />
                    </Button>
                  </div>
                  <p className={css.description}>{text.description}</p>
                  <Tag tone="info" className={css.category}>{text.category}</Tag>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
