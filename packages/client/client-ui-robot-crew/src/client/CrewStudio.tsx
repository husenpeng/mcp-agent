/** Crew studio: the roster rail, the workflow canvas, the inspector, and the live flow ledger. */
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CrewRun, CrewRunId, CrewSpec, CrewSpecRevision } from '@tomato/experimental-robot-crew'
import { draftIssues, starterDraft, terminalRunState } from './draft.ts'
import type { InjectFace, PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
import {
  Button, IconChevronDownOutlineMedium, IconPlayOutlineMedium, IconPlusOutlineMedium, IconSettingsOutlineMedium,
  IconUsersOutlineMedium, IconWarningTriangleOutlineMedium, Input,
} from '@tomato/client-ui-primitives'
import { NS } from './locales.ts'
import type {
  CrewStudioInjected, LedgerFilter, Notice, SelectedEdge,
} from './types.ts'
import type { CrewPatch, EdgePatch, NodePatch } from './types.ts'
import { composeDraft } from './compose.ts'
import { applyCrewPatch, applyEdgePatch, applyNodePatch, withoutEdge, withoutNode } from './edit.ts'
import { createDraftNode, duplicateEdge, createsCycle } from './graph.ts'
import { CrewCanvas } from './CrewCanvas.tsx'
import { CrewInspector } from './CrewInspector.tsx'
import { CrewLedger } from './CrewLedger.tsx'
import css from './CrewStudio.module.css'

/** Props of the crew studio page. */
export type CrewStudioProps =
  PropsRuntime<'main'>
  & InjectFace<CrewStudioInjected>
  & PropsLocale<typeof NS>

/**
 * Render the crew studio.
 * @param props - slot runtime seats, injected roster/actions, and copy.
 * @returns the page body.
 */
export function CrewStudio({
  useRegistry, useRobots, useLedger, actions, createWithConversation, t, useRemoteAccess,
}: CrewStudioProps): ReactNode {
  const registry = useRegistry(snapshot => snapshot)
  const robots = useRobots(snapshot => snapshot)
  const ledger = useLedger(snapshot => snapshot)
  const canCreateSession = useRemoteAccess('session/create')

  const [selectedSpecId, setSelectedSpecId] = useState<string | null>()
  const [draft, setDraft] = useState<CrewSpec>(() => starterDraft(
    t('crew.defaultName'),
    t('crew.defaultMission'),
    { research: t('role.research'), draft: t('role.draft'), review: t('role.review') },
  ))
  const [previousRef, setPreviousRef] = useState<CrewSpecRevision['ref']>()
  const [dirty, setDirty] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string>()
  const [selectedEdge, setSelectedEdge] = useState<SelectedEdge>()
  const [connectFrom, setConnectFrom] = useState<string>()
  const [runId, setRunId] = useState<CrewRunId>()
  const [filter, setFilter] = useState<LedgerFilter>('all')
  const [notice, setNotice] = useState<Notice>()
  const [saving, setSaving] = useState(false)
  const [starting, setStarting] = useState(false)
  const [compose, setCompose] = useState('')
  const [runInput, setRunInput] = useState('')
  const [ledgerOpen, setLedgerOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(() =>
    typeof window === 'undefined' || typeof window.matchMedia !== 'function'
      ? true
      : !window.matchMedia('(max-width: 1180px)').matches)
  const loaded = useRef<string>()

  const effectiveSpecId = selectedSpecId === undefined ? registry.specs[0]?.ref.spec : selectedSpecId ?? undefined
  const revision = effectiveSpecId === undefined
    ? undefined
    : registry.specs.find(candidate => candidate.ref.spec === effectiveSpecId)
  const crewRuns = effectiveSpecId === undefined ? [] : registry.runs.filter(run => run.spec.spec === effectiveSpecId)
  const shownRun: CrewRun | undefined = runId === undefined
    ? crewRuns.at(-1)
    : registry.runs.find(candidate => candidate.id === runId) ?? crewRuns.at(-1)
  const selectedNode = selectedNodeId === undefined ? undefined : draft.nodes.find(node => node.id === selectedNodeId)
  const selectedEdgeSpec = selectedEdge === undefined
    ? undefined
    : draft.edges.find(edge => edge.from === selectedEdge.from && edge.to === selectedEdge.to)

  // Load the published revision when the selection changes, or when a newer
  // revision lands; a chat-created crew arrives this way.
  useEffect(() => {
    if (revision === undefined) return
    const key = `${revision.ref.spec}@${revision.ref.revision}`
    if (loaded.current === key) return
    loaded.current = key
    setDraft(structuredClone(revision.spec))
    setPreviousRef(revision.ref)
    setDirty(false)
    setSelectedNodeId(undefined)
    setSelectedEdge(undefined)
  }, [revision?.ref.spec, revision?.ref.revision])

  // Follow the selected run's ledger while it is live.
  useEffect(() => {
    actions.track(shownRun?.id, shownRun !== undefined && !terminalRunState(shownRun.state))
  }, [actions, shownRun?.id, shownRun?.state, shownRun?.steps])

  useEffect(() => {
    if (notice === undefined) return
    const timer = setTimeout(() => { setNotice(undefined) }, 6000)
    return () => { clearTimeout(timer) }
  }, [notice])

  const labels = useMemo(() => ({
    research: t('role.research'),
    draft: t('role.draft'),
    review: t('role.review'),
    publish: t('role.publish'),
    analyze: t('role.analyze'),
    step: (index: number) => t('role.step', { index }),
  }), [t])

  const mutate = (change: (next: CrewSpec) => CrewSpec): void => {
    setDraft(current => change(current))
    setDirty(true)
  }

  const patchCrew = (patch: CrewPatch): void => { mutate(current => applyCrewPatch(current, patch)) }
  const patchNode = (id: string, patch: NodePatch): void => {
    mutate(current => ({ ...current, nodes: current.nodes.map(node => node.id === id ? applyNodePatch(node, patch) : node) }))
  }
  const patchEdge = (from: string, to: string, patch: EdgePatch): void => {
    mutate(current => ({
      ...current,
      edges: current.edges.map(edge => edge.from === from && edge.to === to ? applyEdgePatch(edge, patch) : edge),
    }))
  }

  const addNode = (): void => {
    const node = createDraftNode(draft.nodes, t('role.step', { index: draft.nodes.length + 1 }))
    mutate(current => ({ ...current, nodes: [...current.nodes, node] }))
    setSelectedNodeId(node.id)
    setSelectedEdge(undefined)
    setInspectorOpen(true)
  }

  const selectNode = (id: string): void => {
    if (connectFrom !== undefined) {
      if (id === connectFrom) { setConnectFrom(undefined); return }
      if (duplicateEdge(draft.edges, connectFrom, id)) { setNotice({ tone: 'warning', text: t('notice.duplicateEdge') }); setConnectFrom(undefined); return }
      if (createsCycle(draft.edges, connectFrom, id)) { setNotice({ tone: 'warning', text: t('notice.cycle') }); return }
      const from = connectFrom
      mutate(current => ({ ...current, edges: [...current.edges, { from, to: id, kind: 'handoff', when: 'always' }] }))
      setConnectFrom(undefined)
      setSelectedEdge({ from, to: id })
      setSelectedNodeId(undefined)
      return
    }
    setSelectedNodeId(id)
    setSelectedEdge(undefined)
    setInspectorOpen(true)
  }

  const selectEdge = (edge: SelectedEdge): void => {
    setSelectedEdge(edge)
    setSelectedNodeId(undefined)
    setInspectorOpen(true)
  }

  const save = async (): Promise<CrewSpecRevision | undefined> => {
    const issues = draftIssues(draft)
    if (issues.length > 0) {
      const first = issues.slice(0, 2).join('; ')
      setNotice({ tone: 'error', text: t('notice.invalid', { detail: first }) })
      return undefined
    }
    setSaving(true)
    try {
      const result = await actions.publish({ spec: draft, ...previousRef === undefined ? {} : { previous: previousRef } })
      if (!result.ok) {
        setNotice({ tone: 'error', text: t('notice.saveFailed', { detail: result.error.message }) })
        return undefined
      }
      setPreviousRef(result.value.ref)
      setSelectedSpecId(result.value.ref.spec)
      setDirty(false)
      setNotice({ tone: 'success', text: t('notice.saved') })
      return result.value
    } finally {
      setSaving(false)
    }
  }

  const start = async (): Promise<void> => {
    const target: CrewSpecRevision | undefined = dirty || revision === undefined ? await save() : revision
    if (target === undefined) return
    const message = runInput.trim() === '' ? draft.input.prompt : runInput.trim()
    setStarting(true)
    try {
      const result = await actions.start({ ref: target.ref, message })
      if (!result.ok) {
        setNotice({ tone: 'error', text: t('notice.startFailed', { detail: result.error.message }) })
        return
      }
      setRunId(result.value.id)
      setLedgerOpen(true)
      setRunInput('')
      setNotice({ tone: 'success', text: t('notice.started') })
    } finally {
      setStarting(false)
    }
  }

  const cancel = async (id: CrewRunId): Promise<void> => {
    const result = await actions.cancel({ runId: id })
    setNotice(result.ok
      ? { tone: 'success', text: t('notice.cancelled') }
      : { tone: 'error', text: t('notice.startFailed', { detail: result.error.message }) })
  }

  const applyCompose = (): void => {
    if (compose.trim() === '') { setNotice({ tone: 'warning', text: t('notice.composeEmpty') }); return }
    const graph = composeDraft(compose.trim(), labels)
    mutate(current => ({
      ...current,
      ...current.mission.trim() === '' ? { mission: compose.trim() } : {},
      nodes: graph.nodes,
      edges: graph.edges,
    }))
    setSelectedNodeId(graph.nodes[0]?.id)
    setSelectedEdge(undefined)
    setConnectFrom(undefined)
    setNotice(undefined)
  }

  const newCrew = (): void => {
    loaded.current = undefined
    setSelectedSpecId(null)
    setPreviousRef(undefined)
    setDraft(starterDraft(
      t('crew.defaultName'),
      t('crew.defaultMission'),
      { research: t('role.research'), draft: t('role.draft'), review: t('role.review') },
    ))
    setDirty(true)
    setSelectedNodeId(undefined)
    setSelectedEdge(undefined)
    setRunId(undefined)
  }

  const runnable = !saving && !starting
  const latestRevision = revision
  const noticeTone = notice?.tone ?? 'success'

  return (
    <div className={css.studio} data-inspector={inspectorOpen}>

      <div className={css.main}>
        <div className={css.crewBar}>
          <button type="button" className={css.newCrewButton} onClick={newCrew}>
            <IconPlusOutlineMedium size={14} />{t('list.new')}
          </button>
          <div className={css.crewChips}>
            {registry.specs.length === 0 ? <span className={css.crewBarEmpty}>{t('list.empty')}</span> : null}
            {registry.specs.map((candidate) => {
              const latest = registry.runs.filter(run => run.spec.spec === candidate.ref.spec).at(-1)
              return (
                <button
                  key={candidate.ref.spec}
                  type="button"
                  className={css.crewChip}
                  data-active={candidate.ref.spec === effectiveSpecId}
                  onClick={() => { setSelectedSpecId(candidate.ref.spec); setRunId(undefined) }}
                  title={candidate.spec.mission}
                >
                  <span className={css.crewChipName}>{candidate.spec.name}</span>
                  <span className={css.crewChipMeta}>{t('list.nodes', { count: candidate.spec.nodes.length })}{latest === undefined ? '' : ` · ${t(`run.state.${latest.state}`)}`}</span>
                </button>
              )
            })}
          </div>
          <div className={css.composeInline}>
            <Input value={compose} placeholder={t('compose.placeholder')} onChange={(event) => { setCompose(event.target.value) }} onKeyDown={(event) => { if (event.key === 'Enter') applyCompose() }} />
            <Button variant="outline" onClick={applyCompose}>{t('compose.apply')}</Button>
            <Button
              variant="ghost"
              disabled={!canCreateSession}
              title={canCreateSession ? t('compose.chatPrompt') : t('compose.chatUnavailable')}
              onClick={createWithConversation}
            >
              {t('compose.chat')}
            </Button>
          </div>
        </div>
        <header className={css.toolbar}>
          <div className={css.identity}>
            <span className={css.crewAvatar} aria-hidden="true"><IconUsersOutlineMedium size={16} /></span>
            <div className={css.identityText}>
              <strong>{draft.name.trim() === '' ? t('crew.defaultName') : draft.name}</strong>
              <span data-dirty={dirty}>
                {dirty || latestRevision === undefined ? t('toolbar.draft') : t('toolbar.saved')}
              </span>
            </div>
          </div>

          <div className={css.runBox}>
            <Input
              value={runInput}
              placeholder={draft.input.prompt}
              onChange={(event) => { setRunInput(event.target.value) }}
              onKeyDown={(event) => { if (event.key === 'Enter' && runnable) { void start() } }}
            />
          </div>
          <Button variant="outline" disabled={saving} onClick={() => { void save() }}>
            {saving ? t('toolbar.saving') : t('toolbar.save')}
          </Button>
          <Button variant="primary" disabled={!runnable} onClick={() => { void start() }}>
            <IconPlayOutlineMedium size={14} />
            {shownRun !== undefined && !terminalRunState(shownRun.state) ? t('toolbar.running') : t('toolbar.run')}
          </Button>
          {shownRun !== undefined && !terminalRunState(shownRun.state)
            ? <Button variant="ghost" onClick={() => { void cancel(shownRun.id) }}>{t('toolbar.cancel')}</Button>
            : null}
          <button
            type="button"
            className={css.iconButton}
            aria-label={t('toolbar.inspector')}
            onClick={() => { setInspectorOpen(open => !open) }}
          >
            <IconSettingsOutlineMedium size={16} />
          </button>
        </header>

        {notice === undefined ? null : (
          <div className={css.notice} data-tone={noticeTone} role="status">
            {noticeTone === 'error' || noticeTone === 'warning' ? <IconWarningTriangleOutlineMedium size={14} /> : null}
            <span>{notice.text}</span>
          </div>
        )}

        <div className={css.workArea}>
          <CrewCanvas
            nodes={draft.nodes}
            edges={draft.edges}
            selectedId={selectedNodeId}
            selectedEdge={selectedEdge}
            connectFrom={connectFrom}
            run={shownRun}
            t={t}
            onSelectNode={selectNode}
            onSelectEdge={selectEdge}
            onMoveNode={(id, position) => { patchNode(id, { at: position }) }}
            onAddNode={addNode}
            onClearSelection={() => { setSelectedNodeId(undefined); setSelectedEdge(undefined) }}
            onToggleConnect={() => {
              setConnectFrom(connectFrom === undefined ? selectedNodeId ?? draft.nodes[0]?.id : undefined)
            }}
            onAutoLayout={() => {
              mutate(current => ({
                ...current,
                nodes: current.nodes.map((node, index) => ({
                  ...node,
                  at: { x: 16 + (index % 3) * 240, y: 64 + Math.floor(index / 3) * 168 },
                })),
              }))
            }}
          />
        </div>

        {ledgerOpen ? (
          <CrewLedger
            run={shownRun}
            runs={crewRuns}
            entries={ledger.entries}
            filter={filter}
            guard={draft.guard}
            t={t}
            onFilter={setFilter}
            onSelectRun={(id) => { setRunId(id); setLedgerOpen(true) }}
            onCancel={(id) => { void cancel(id) }}
            onCollapse={() => { setLedgerOpen(false) }}
            error={ledger.error}
          />
        ) : (
          <button type="button" className={css.ledgerBar} onClick={() => { setLedgerOpen(true) }}>
            <IconChevronDownOutlineMedium size={14} />
            {t('run.title')}
            {shownRun === undefined ? '' : ` · ${t(`run.state.${shownRun.state}`)}`}
          </button>
        )}
      </div>

      <div className={css.inspectorSlot} data-open={inspectorOpen}>
        <CrewInspector
          draft={draft}
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          selectedEdgeSpec={selectedEdgeSpec}
          robots={robots.options}
          t={t}
          onClose={() => { setInspectorOpen(false) }}
          onPatchCrew={patchCrew}
          onPatchNode={patchNode}
          onPatchEdge={patchEdge}
          onDeleteNode={(id) => {
            mutate(current => withoutNode(current, id))
            setSelectedNodeId(undefined)
          }}
          onDeleteEdge={(edge) => {
            mutate(current => withoutEdge(current, edge))
            setSelectedEdge(undefined)
          }}
        />
      </div>
    </div>
  )
}
