/** Canvas of the crew studio: draggable member cards, handoff edges, and the add/connect toolbar. */
import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import type { CrewEdge, CrewNode, CrewRun, CrewRunState } from '@tomato/experimental-robot-crew'
import type { TranslateNS } from '@tomato/client-ui-slots'
import {
  Button, IconAgentPresetOutlineMedium, IconCheckOutlineMedium, IconSearchOutlineMedium, StateDot,
} from '@tomato/client-ui-primitives'
import { NS } from './locales.ts'
import type { SelectedEdge } from './types.ts'
import { NODE_HEIGHT, NODE_WIDTH, edgeMidpoint, edgePath, positionOf, progressOf } from './graph.ts'
import css from './CrewStudio.module.css'

/** Owner callbacks of the canvas. */
export interface CrewCanvasProps {
  readonly nodes: readonly CrewNode[]
  readonly edges: readonly CrewEdge[]
  readonly selectedId?: string | undefined
  readonly selectedEdge?: SelectedEdge | undefined
  readonly connectFrom?: string | undefined
  readonly run?: CrewRun | undefined
  readonly t: TranslateNS<typeof NS>
  readonly onSelectNode: (id: string) => void
  readonly onSelectEdge: (edge: SelectedEdge) => void
  readonly onMoveNode: (id: string, position: { readonly x: number; readonly y: number }) => void
  readonly onAddNode: () => void
  readonly onToggleConnect: () => void
  readonly onAutoLayout: () => void
  /** Clear the canvas selection when the empty surface is pressed. */
  readonly onClearSelection: () => void
}

/** Radius and status color by run state. */
function nodeTone(state: string | undefined): 'done' | 'warning' | 'error' | 'idle' | 'ongoing' {
  if (state === 'succeeded') return 'done'
  if (state === 'failed') return 'error'
  if (state === 'skipped') return 'warning'
  if (state === 'running') return 'ongoing'
  return 'idle'
}

/** Crew run states that keep the canvas live. */
const LIVE: ReadonlySet<CrewRunState> = new Set<CrewRunState>(['queued', 'running'])

/**
 * Render one member card and every handoff between members.
 * @param props - graph, selection, run progress, and owner callbacks.
 * @returns the scrollable canvas.
 */
export function CrewCanvas({
  nodes, edges, selectedId, selectedEdge, connectFrom, run, t, onSelectNode, onSelectEdge, onMoveNode, onAddNode,
  onToggleConnect, onAutoLayout, onClearSelection,
}: CrewCanvasProps): ReactNode {
  const [drag, setDrag] = useState<{
    readonly id: string
    readonly startX: number
    readonly startY: number
    readonly dx: number
    readonly dy: number
  }>()
  const moved = useRef(false)
  const positions = new Map(nodes.map((node, index) => [node.id, positionOf(node, index)]))
  const shown = (id: string): { readonly x: number; readonly y: number } => {
    const base = positions.get(id) ?? { x: 0, y: 0 }
    if (drag === undefined || drag.id !== id) return base
    return { x: base.x + drag.dx, y: base.y + drag.dy }
  }
  const width = Math.max(696, ...[...positions.values()].map(point => point.x + NODE_WIDTH + 48))
  const height = Math.max(420, ...[...positions.values()].map(point => point.y + NODE_HEIGHT + 64))
  const live = run !== undefined && LIVE.has(run.state)

  return (
    <div className={css.canvasArea}>
      <div className={css.canvasTools}>
        <Button variant="outline" onClick={onAddNode}>＋ {t('canvas.add')}</Button>
        <Button variant={connectFrom === undefined ? 'outline' : 'primary'} onClick={onToggleConnect}>
          {connectFrom === undefined ? t('canvas.connect') : t('canvas.connectCancel')}
        </Button>
        <Button variant="ghost" onClick={onAutoLayout}>{t('canvas.autoLayout')}</Button>
        {connectFrom === undefined
          ? <span className={css.canvasHint}>{t('canvas.gridHint')}</span>
          : <span className={css.canvasHintActive}>{t('canvas.connectHint')}</span>}
      </div>

      <div className={css.canvasScroll}>
        <div
          className={css.canvas}
          style={{ width, height }}
          onClick={(event) => { if (event.target === event.currentTarget) onClearSelection() }}
        >
          <svg className={css.edges} width={width} height={height} aria-hidden="true">
            <defs>
              <marker id="crew-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
            </defs>
            {edges.map((edge) => {
              const from = shown(edge.from)
              const to = shown(edge.to)
              const active = selectedEdge?.from === edge.from && selectedEdge?.to === edge.to
              const mid = edgeMidpoint(from, to)
              return (
                <g key={`${edge.from}>${edge.to}`} className={css.edgeGroup} data-active={active}>
                  <path className={css.edgeHit} d={edgePath(from, to)} />
                  <path className={css.edgeLine} d={edgePath(from, to)} markerEnd="url(#crew-arrow)" />
                  <circle className={css.edgeDot} cx={mid.x} cy={mid.y} r="3.5" />
                  <circle
                    className={css.edgeButton}
                    cx={mid.x}
                    cy={mid.y}
                    r="13"
                    role="button"
                    tabIndex={0}
                    aria-label={`${edge.from} → ${edge.to}`}
                    onClick={() => { onSelectEdge({ from: edge.from, to: edge.to }) }}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') return
                      event.preventDefault()
                      onSelectEdge({ from: edge.from, to: edge.to })
                    }}
                  />
                </g>
              )
            })}
          </svg>

          {nodes.map((node, index) => {
            const point = shown(node.id)
            const progress = progressOf(run, node.id)
            // A terminal run leaves untouched members pending; the graph states
            // them as skipped so the picture matches what executed.
            const state = progress?.state === 'pending' && run !== undefined && !live ? 'skipped' : progress?.state
            const selected = node.id === selectedId
            const source = node.id === connectFrom
            return (
              <button
                key={node.id}
                type="button"
                className={css.node}
                style={{ left: point.x, top: point.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
                data-selected={selected}
                data-source={source}
                data-live={progress?.state === 'running'}
                aria-label={`${node.label} ${node.role}`}
                aria-pressed={selected}
                onPointerDown={(event) => {
                  if (event.button !== 0) return
                  moved.current = false
                  setDrag({ id: node.id, startX: event.clientX, startY: event.clientY, dx: 0, dy: 0 })
                  event.currentTarget.setPointerCapture(event.pointerId)
                }}
                onPointerMove={(event) => {
                  if (drag === undefined || drag.id !== node.id) return
                  const dx = event.clientX - drag.startX
                  const dy = event.clientY - drag.startY
                  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved.current = true
                  setDrag({ ...drag, dx, dy })
                }}
                onPointerUp={(event) => {
                  if (drag !== undefined && drag.id === node.id && moved.current) {
                    const base = positions.get(node.id) ?? { x: 0, y: 0 }
                    onMoveNode(node.id, {
                      x: Math.max(16, Math.round(base.x + drag.dx)),
                      y: Math.max(16, Math.round(base.y + drag.dy)),
                    })
                  }
                  event.currentTarget.releasePointerCapture(event.pointerId)
                  setDrag(undefined)
                }}
                onPointerCancel={() => { setDrag(undefined) }}
                onClick={() => {
                  if (moved.current) { moved.current = false; return }
                  onSelectNode(node.id)
                }}
              >
                <span className={css.nodeHead}>
                  <span className={css.nodeGlyph} data-kind={node.kind} aria-hidden="true">
                    {node.kind === 'reviewer'
                      ? <IconCheckOutlineMedium size={13} />
                      : node.kind === 'observer'
                        ? <IconSearchOutlineMedium size={13} />
                        : <IconAgentPresetOutlineMedium size={13} />}
                  </span>
                  <span className={css.nodeTitle}>{node.label}</span>
                </span>
                <span className={css.nodeRole}>{node.role}</span>
                <span className={css.nodeFoot}>
                  <span className={css.nodeKind} data-kind={node.kind}>{t(`node.kind.${node.kind}`)}</span>
                  {node.robot === undefined
                    ? null
                    : <span className={css.nodeRobot}>{node.robot.spec.slice(0, 8)}</span>}
                  <StateDot state={nodeTone(state)} />
                  <span className={css.nodeState}>
                    {state === undefined ? `#${index + 1}` : t(`node.state.${state}`)}
                  </span>
                </span>
                {live && state === 'running' ? <span className={css.nodePulse} aria-hidden="true" /> : null}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
