/** Tomato Rbot main page: roster, specification editor, runs, and the run conversation. */
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import type {
  Robot, RobotSpec, RobotSpecIssue, RobotSpecRef, RobotSpecRevision, Run,
} from '@tomato/api-robot-controller/client'
import type { SessionReference } from '@tomato/api-session-controller/client'
import type { RemoteResult } from '@tomato/typert-protocol'
import type { SessionId } from '@tomato/session/types'
import type { InjectFace, PropsLocale, PropsRenderSlots, PropsRuntime, PropsStore } from '@tomato/client-ui-slots'
import type { RobotRunsSource } from '@tomato/api-robot-controller/client'
import type { RobotPageInstance, RobotPageStore } from './store.ts'
import { Button, Input } from '@tomato/client-ui-primitives'
import { RobotConfigEditor } from './RobotConfigEditor.tsx'
import { NS } from './locales.ts'
import css from './RobotPage.module.css'

/** Registry and control actions the page drives. */
export interface RobotPageActions {
  readonly publish: (request: { spec: RobotSpec; previous?: RobotSpecRef }) => Promise<RemoteResult<RobotSpecRevision>>
  readonly instantiate: (request: { ref: RobotSpecRef }) => Promise<RemoteResult<Robot>>
  readonly rebind: (request: { robotId: Robot['id']; ref: RobotSpecRef }) => Promise<RemoteResult<Robot>>
  readonly start: (request: { robotId: Robot['id']; message: string }) => Promise<RemoteResult<Run>>
  readonly cancel: (request: { runId: Run['id'] }) => Promise<RemoteResult<void>>
  /** Retain one run Session for the Conversation bound around the child slot. */
  readonly retainSession: (sessionId: SessionId) => SessionReference
}

/** One selectable reference option (permission preset). */
export interface RobotReferenceOption {
  readonly value: string
  readonly label: string
}

/** Host-provided option lists the specification editor offers as references. */
export interface RobotReferenceData {
  readonly presets: readonly RobotReferenceOption[]
  readonly skills: readonly string[]
}

/** Injected face of the robot page and sidebar registrations. */
export interface RobotInjected {
  readonly hooks: {
    /** Page selection snapshot source. */
    readonly robotPage: RobotPageInstance
    /** Registry snapshot source. */
    readonly registry: RobotRunsSource
  }
  readonly registryActions: RobotPageActions
  /** Open a new Session carrying the robot-creation skill and its interview prompt. */
  readonly createWithConversation: () => void
  /** Load option lists from the Host; failures degrade to empty lists. */
  readonly references: () => Promise<RobotReferenceData>
}

/** Props of the robot main page. */
export type RobotPageProps =
  PropsRuntime<'main'>
  & PropsRenderSlots<'robots.conversation'>
  & PropsStore<RobotPageStore>
  & InjectFace<RobotInjected>
  & PropsLocale<typeof NS>

/**
 * Render the robot roster, the specification editor, and one robot's runs.
 * @param props - slot runtime props, injected registry actions, and copy.
 * @returns the page body.
 */
export function RobotPage({
  useRobotPage, useRegistry, actions, registryActions, createWithConversation, references, useRemoteAccess, SessionProvider, renderSlot, t,
}: RobotPageProps): ReactNode {
  const page = useRobotPage(snapshot => snapshot)
  const registry = useRegistry(snapshot => snapshot)
  const canCreateSession = useRemoteAccess('session/create')
  const robot = page.robotId === undefined
    ? undefined
    : registry.robots.find(candidate => candidate.id === page.robotId)
  const runs = robot === undefined ? [] : registry.runs.filter(run => run.robot === robot.id)
  const run = page.runId === undefined ? undefined : runs.find(candidate => candidate.id === page.runId)
  const [reference, setReference] = useState<SessionReference>()
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [issues, setIssues] = useState<readonly RobotSpecIssue[]>()
  const [referenceOptions, setReferenceOptions] = useState<RobotReferenceData>({ presets: [], skills: [] })

  useEffect(() => {
    let live = true
    void references().then((data) => { if (live) setReferenceOptions(data) }).catch(() => undefined)
    return () => { live = false }
  }, [references])

  useEffect(() => {
    if (run?.sessionId === undefined) {
      setReference(undefined)
      return
    }
    const next = registryActions.retainSession(run.sessionId)
    setReference(next)
    return () => { next.release() }
  }, [run?.sessionId, actions])

  const submitSpec = (spec: RobotSpec): void => {
    setBusy(true)
    setError(undefined)
    setIssues(undefined)
    void (async () => {
      const published = await registryActions.publish({ spec, ...(robot === undefined ? {} : { previous: robot.spec }) })
      if (!published.ok) {
        setBusy(false)
        setError(published.error.message)
        if (published.error.code === 'robot/spec-invalid') setIssues(published.error.details.issues)
        return
      }
      const target = robot === undefined
        ? await registryActions.instantiate({ ref: published.value.ref })
        : await registryActions.rebind({ robotId: robot.id, ref: published.value.ref })
      setBusy(false)
      if (!target.ok) {
        setError(target.error.message)
        return
      }
      actions.selectRobot(target.value.id)
    })()
  }

  const startRun = (): void => {
    if (robot === undefined || message.trim() === '') return
    setBusy(true)
    setError(undefined)
    void (async () => {
      const started = await registryActions.start({ robotId: robot.id, message })
      setBusy(false)
      if (!started.ok) {
        setError(started.error.message)
        return
      }
      setMessage('')
      actions.openRun(started.value.id)
    })()
  }

  const edition = robot === undefined ? undefined : registry.specs.find(spec => spec.ref.spec === robot.spec.spec)

  return (
    <div className={css.page}>
      <div className={css.roster}>
        <h2 className={css.heading}>
          {t('roster.heading')}
          <span className={css.headingActions}>
            <Button size="sm" variant="outline" onClick={() => { actions.configure(undefined) }}>{t('roster.new')}</Button>
            {canCreateSession
              ? <Button size="sm" variant="ghost" onClick={createWithConversation}>{t('roster.createWithChat')}</Button>
              : null}
          </span>
        </h2>
        {registry.robots.length === 0 ? <p className={css.empty}>{t('roster.empty')}</p> : registry.robots.map(candidate => (
          <button
            key={candidate.id}
            type="button"
            className={css.robotRow}
            data-active={candidate.id === page.robotId}
            onClick={() => { actions.selectRobot(candidate.id) }}
          >
            <span className={css.robotName}>{candidate.name}</span>
            <span className={css.robotState}>{candidate.state === 'running' ? t('roster.running') : t('roster.idle')}</span>
          </button>
        ))}
      </div>

      <div className={css.detail}>
        {page.view === 'config' ? (
          <RobotConfigEditor
            t={t}
            initial={edition?.spec}
            busy={busy}
            issues={issues}
            presetOptions={referenceOptions.presets}
            skillSuggestions={referenceOptions.skills}
            robotNames={registry.robots.map(candidate => candidate.name)}
            onSubmit={submitSpec}
            onCancel={() => {
              if (robot === undefined) actions.openRoster()
              else actions.selectRobot(robot.id)
            }}
          />
        ) : robot === undefined ? (
          <p className={css.empty}>{t('roster.select')}</p>
        ) : (
          <>
            <h2 className={css.heading}>
              {robot.name}
              <span>
                <Button size="sm" variant="outline" onClick={() => { actions.configure(robot.id) }}>{t('roster.edit')}</Button>
              </span>
            </h2>
            {edition === undefined ? null : <p className={css.empty}>{edition.spec.goal.mission}</p>}
            <h3 className={css.heading}>{t('roster.runs')}</h3>
            {runs.length === 0 ? <p className={css.empty}>{t('roster.noRuns')}</p> : runs.map(candidate => (
              <div key={candidate.id} className={css.runRow}>
                <span>{candidate.state}</span>
                <Button size="sm" variant="ghost" onClick={() => { actions.openRun(candidate.id) }}>{t('roster.openChat')}</Button>
              </div>
            ))}
            <div className={css.runRow}>
              <Input
                className={css.runInput}
                value={message}
                placeholder={t('roster.message')}
                onChange={(event) => { setMessage(event.target.value) }}
              />
              <Button size="sm" variant="primary" disabled={busy} onClick={startRun}>{t('roster.run')}</Button>
            </div>
            {error === undefined ? null : <p className={css.error}>{error}</p>}
            {run?.sessionId === undefined || reference === undefined ? null : (
              <div className={css.conversation}>
                <SessionProvider session={reference}>{renderSlot('robots.conversation', {})}</SessionProvider>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
