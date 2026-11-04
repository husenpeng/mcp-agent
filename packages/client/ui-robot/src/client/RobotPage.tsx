/** Tomato Rbot main page: the template and robot gallery, the specification editor, one robot's runs, and the run conversation. */
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import type {
  Robot, RobotCapabilityCatalog, RobotHireRequest, RobotSpec, RobotSpecIssue, RobotSpecRef, RobotSpecRevision,
  RobotTemplate, RobotTemplateText, Run,
} from '@tomato/api-robot-controller/client'
import type { SessionReference } from '@tomato/api-session-controller/client'
import type { RemoteResult } from '@tomato/typert-protocol'
import type { SessionId } from '@tomato/session/types'
import type { InjectFace, PropsLocale, PropsRenderSlots, PropsRuntime, PropsStore } from '@tomato/client-ui-slots'
import type { RobotRunsSource } from '@tomato/api-robot-controller/client'
import type { RobotPageInstance, RobotPageStore } from './store.ts'
import { Button, Input } from '@tomato/client-ui-primitives'
import { RobotConfigEditor } from './RobotConfigEditor.tsx'
import { RobotGallery } from './RobotGallery.tsx'
import { NS } from './locales.ts'
import { RunDetail, STATE_KEYS } from './RunDetail.tsx'
import type { RunStep } from './run-steps.ts'
import css from './RobotPage.module.css'

/** Run states that still hold the robot's only execution slot. */
const TERMINAL_RUN_STATES: ReadonlySet<Run['state']> = new Set<Run['state']>([
  'succeeded', 'failed', 'cancelled', 'timed_out',
])

/** Progress rows of a run whose Session the Client cannot read. */
const NO_STEPS: readonly RunStep[] = []

/** Registry and control actions the page drives. */
export interface RobotPageActions {
  readonly publish: (request: { spec: RobotSpec; previous?: RobotSpecRef }) => Promise<RemoteResult<RobotSpecRevision>>
  readonly instantiate: (request: { ref: RobotSpecRef }) => Promise<RemoteResult<Robot>>
  readonly rebind: (request: { robotId: Robot['id']; ref: RobotSpecRef }) => Promise<RemoteResult<Robot>>
  /** Publish and instantiate a user-owned copy of one template. */
  readonly hire: (request: RobotHireRequest) => Promise<RemoteResult<Robot>>
  readonly start: (request: { robotId: Robot['id']; message: string }) => Promise<RemoteResult<Run>>
  readonly cancel: (request: { runId: Run['id'] }) => Promise<RemoteResult<void>>
  readonly interrupt: (request: { runId: Run['id'] }) => Promise<RemoteResult<void>>
  readonly correct: (request: { runId: Run['id']; message: string }) => Promise<RemoteResult<void>>
  /**
   * Retain one run Session for the Conversation bound around the child slot,
   * re-reading the Host catalog once when the Client holds no row for it.
   * @param sessionId - Session the run record names.
   * @returns the owned reference, or undefined while the Session stays unresolvable.
   */
  readonly retainSession: (sessionId: SessionId) => Promise<SessionReference | undefined>
}

/** One selectable reference option (permission preset). */
export interface RobotReferenceOption {
  readonly value: string
  readonly label: string
}

/** Host-provided option lists the specification editor offers as references. */
export interface RobotReferenceData {
  readonly presets: readonly RobotReferenceOption[]
  /** Local skills, tools, MCP servers, and Workspace directories. */
  readonly capabilities: RobotCapabilityCatalog
  /**
   * Workspace directory the page is viewing. A new robot and a rootless
   * template hire start in it, and the editor fills an empty root list from it.
   */
  readonly defaultWorkspaceRoot?: string
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
  /** Active locale id used to pick template copy and the hire's language. */
  readonly locale: () => string
  /** Template copy for the active locale. */
  readonly templateText: (template: RobotTemplate) => RobotTemplateText
}

/** Props of the robot main page. */
export type RobotPageProps =
  PropsRuntime<'main'>
  & PropsRenderSlots<'robots.run'>
  & PropsStore<RobotPageStore>
  & InjectFace<RobotInjected>
  & PropsLocale<typeof NS>

/**
 * Render the gallery, the specification editor, or one robot's runs and conversation.
 * @param props - slot runtime props, injected registry actions, and copy.
 * @returns the page body.
 */
export function RobotPage({
  useRobotPage, useRegistry, actions, registryActions, createWithConversation, references, locale, templateText,
  useRemoteAccess, SessionProvider, renderSlot, t,
}: RobotPageProps): ReactNode {
  const page = useRobotPage(snapshot => snapshot)
  const registry = useRegistry(snapshot => snapshot)
  const canCreateSession = useRemoteAccess('session/create')
  const robot = page.robotId === undefined
    ? undefined
    : registry.robots.find(candidate => candidate.id === page.robotId)
  const runs = robot === undefined ? [] : registry.runs.filter(run => run.robot === robot.id)
  const run = page.runId === undefined ? undefined : runs.find(candidate => candidate.id === page.runId)
  /** The Session reference held for one exact run Session. */
  const [owned, setOwned] = useState<{ readonly sessionId: SessionId; readonly reference: SessionReference }>()
  /** Run Session whose retention settled without a readable reference. */
  const [unresolved, setUnresolved] = useState<SessionId>()
  const runSessionId = run?.sessionId
  // A reference or failure names its own Session, so a different selection never
  // borrows the previous run's conversation while its own attempt is pending.
  const reference = owned !== undefined && owned.sessionId === runSessionId ? owned.reference : undefined
  const sessionUnavailable = runSessionId !== undefined && unresolved === runSessionId
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [issues, setIssues] = useState<readonly RobotSpecIssue[]>()
  const [referenceOptions, setReferenceOptions] = useState<RobotReferenceData>({
    presets: [],
    capabilities: { skills: [], tools: [], mcpServers: [], workspaceRoots: [] },
  })

  useEffect(() => {
    let live = true
    void references().then((data) => { if (live) setReferenceOptions(data) }).catch(() => undefined)
    return () => { live = false }
  }, [references])

  useEffect(() => {
    const sessionId = run?.sessionId
    if (sessionId === undefined) return
    const scope = { live: true }
    let held: SessionReference | undefined
    setUnresolved(undefined)
    void (async () => {
      const next = await registryActions.retainSession(sessionId)
      if (!scope.live) {
        next?.release()
        return
      }
      held = next
      if (next === undefined) setUnresolved(sessionId)
      else setOwned({ sessionId, reference: next })
    })()
    // Retiring the reference also retires the render state that names it: a
    // later selection of the same run must retain again, never render a
    // released reference.
    // A Session the Client cannot resolve keeps the run readable as a task
    // instead of failing the enclosing page (and blanking the main panel).
    return () => {
      scope.live = false
      setUnresolved(undefined)
      if (held === undefined) return
      setOwned(current => current !== undefined && current.reference === held ? undefined : current)
      held.release()
    }
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

  const hire = async (template: RobotTemplate): Promise<void> => {
    setError(undefined)
    const hired = await registryActions.hire({
      templateId: template.id,
      locale: locale(),
      ...(referenceOptions.defaultWorkspaceRoot === undefined ? {} : { workspaceRoot: referenceOptions.defaultWorkspaceRoot }),
    })
    if (!hired.ok) {
      setError(`${t('roster.hireFailed')}: ${hired.error.message}`)
      return
    }
    actions.selectRobot(hired.value.id)
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
  const runInProgress = runs.some(candidate => !TERMINAL_RUN_STATES.has(candidate.state))

  if (page.view === 'config') {
    return (
      <div className={css.page}>
        <div className={css.detail}>
          <RobotConfigEditor
            t={t}
            initial={edition?.spec}
            busy={busy}
            issues={issues}
            presetOptions={referenceOptions.presets}
            capabilities={referenceOptions.capabilities}
            defaultWorkspaceRoot={referenceOptions.defaultWorkspaceRoot}
            robotNames={registry.robots.map(candidate => candidate.name)}
            onSubmit={submitSpec}
            onCancel={() => {
              if (robot === undefined) actions.openRoster()
              else actions.selectRobot(robot.id)
            }}
          />
        </div>
      </div>
    )
  }

  if (robot === undefined) {
    return (
      <div className={css.page}>
        <div className={css.detail}>
          <RobotGallery
            t={t}
            templates={registry.templates}
            robots={registry.robots}
            specs={registry.specs}
            runs={registry.runs}
            textOf={templateText}
            query={page.query}
            filter={page.filter}
            onQuery={actions.search}
            onFilter={actions.filterBy}
            onHire={hire}
            onOpen={(candidate) => { actions.selectRobot(candidate.id) }}
            onCreate={() => { actions.configure(undefined) }}
            onCreateWithChat={canCreateSession ? createWithConversation : undefined}
          />
          {error === undefined ? null : <p className={css.error} role="alert">{error}</p>}
        </div>
      </div>
    )
  }

  const runActions = {
    interrupt: (target: Run): void => {
      void registryActions.interrupt({ runId: target.id }).then((result) => { if (!result.ok) setError(result.error.message) })
    },
    correct: (target: Run, text: string): void => {
      void registryActions.correct({ runId: target.id, message: text }).then((result) => { if (!result.ok) setError(result.error.message) })
    },
    stop: (target: Run): void => {
      void registryActions.cancel({ runId: target.id }).then((result) => { if (!result.ok) setError(result.error.message) })
    },
  }

  // The Session-bound occupant reads the run's Chat nodes; without a readable
  // Session the same detail still shows the task, status, and result.
  let detail: ReactNode = <p className={css.empty}>{t('run.emptyDetail')}</p>
  if (run !== undefined) {
    detail = reference === undefined
      ? (
        <RunDetail
          run={run}
          openState={sessionUnavailable ? 'error' : run.sessionId === undefined ? 'open' : 'loading'}
          openError={sessionUnavailable ? t('run.sessionUnavailable') : undefined}
          steps={NO_STEPS}
          actions={runActions}
          t={t}
        />
      )
      : <SessionProvider session={reference}>{renderSlot('robots.run', { run, actions: runActions })}</SessionProvider>
  }

  return (
    <div className={css.page}>
      <div className={css.runsPane}>
        <div>
          <Button size="sm" variant="ghost" onClick={() => { actions.back() }}>{t('roster.back')}</Button>
        </div>
        <h2 className={css.heading}>
          {robot.name}
          <span>
            <Button size="sm" variant="outline" onClick={() => { actions.configure(robot.id) }}>{t('roster.edit')}</Button>
          </span>
        </h2>
        {edition === undefined ? null : <p className={css.empty}>{edition.spec.goal.mission}</p>}
        <h3 className={css.heading}>{t('roster.runs')}</h3>
        {runs.length === 0 ? <p className={css.empty}>{t('roster.noRuns')}</p> : runs.map(candidate => (
          <button
            key={candidate.id}
            type="button"
            className={css.runItem}
            data-state={candidate.state}
            aria-current={run?.id === candidate.id ? 'true' : undefined}
            onClick={() => { actions.openRun(candidate.id) }}
          >
            <span className={css.runState}>{t(STATE_KEYS[candidate.state])}</span>
            <span className={css.runText}>{candidate.input.message}</span>
          </button>
        ))}
        <div className={css.runRow}>
          <Input
            className={css.runInput}
            value={message}
            placeholder={t('roster.message')}
            onChange={(event) => { setMessage(event.target.value) }}
          />
          <Button size="sm" variant="primary" disabled={busy || runInProgress} onClick={startRun}>{t('roster.run')}</Button>
        </div>
        {runInProgress ? <p className={css.empty}>{t('run.newRunBlocked')}</p> : null}
        {error === undefined ? null : <p className={css.error} role="alert">{error}</p>}
      </div>
      <div className={css.detail}>{detail}</div>
    </div>
  )
}
