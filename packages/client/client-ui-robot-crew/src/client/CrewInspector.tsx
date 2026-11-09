/** Right-hand inspector of the crew studio: crew settings, member settings, or the selected handoff. */
import type { ChangeEvent, ReactNode } from 'react'
import type { CrewEdge, CrewNode, CrewSpec } from '@tomato/experimental-robot-crew'
import type { TranslateNS } from '@tomato/client-ui-slots'
import { Button, IconCloseOutlineMedium, Input } from '@tomato/client-ui-primitives'
import { NS } from './locales.ts'
import type { CrewPatch, EdgePatch, NodePatch, RobotOption, SelectedEdge } from './types.ts'
import css from './CrewStudio.module.css'

/** Owner callbacks of the inspector. */
export interface CrewInspectorProps {
  readonly draft: CrewSpec
  readonly selectedNode?: CrewNode | undefined
  readonly selectedEdge?: SelectedEdge | undefined
  readonly selectedEdgeSpec?: CrewEdge | undefined
  readonly robots: readonly RobotOption[]
  readonly t: TranslateNS<typeof NS>
  readonly onClose: () => void
  readonly onPatchCrew: (patch: CrewPatch) => void
  readonly onPatchNode: (id: string, patch: NodePatch) => void
  readonly onPatchEdge: (from: string, to: string, patch: EdgePatch) => void
  readonly onDeleteNode: (id: string) => void
  readonly onDeleteEdge: (edge: SelectedEdge) => void
}

/** Lines to array, keeping blank lines out of the stored value. */
function linesOf(value: string): string[] {
  return value.split('\n').map(line => line.trim()).filter(line => line.length > 0)
}

/** One labelled control row. */
function Field({ label, hint, children }: { readonly label: string; readonly hint?: string; readonly children: ReactNode }) {
  return (
    <label className={css.field}>
      <span className={css.fieldLabel}>{label}</span>
      {children}
      {hint === undefined ? null : <span className={css.fieldHint}>{hint}</span>}
    </label>
  )
}

/** One titled block of related controls. */
function Section({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <section className={css.section}>
      <h3 className={css.sectionTitle}>{title}</h3>
      <div className={css.sectionBody}>{children}</div>
    </section>
  )
}

/**
 * Render the settings for the current canvas selection.
 * @param props - draft specification, selection, robot catalog, and callbacks.
 * @returns the inspector column.
 */
export function CrewInspector({
  draft, selectedNode, selectedEdge, selectedEdgeSpec, robots, t, onClose, onPatchCrew, onPatchNode, onPatchEdge,
  onDeleteNode, onDeleteEdge,
}: CrewInspectorProps): ReactNode {
  const number = (event: ChangeEvent<HTMLInputElement>, fallback: number): number => {
    const parsed = Number(event.target.value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  const robotValue = (node: CrewNode): string => node.robot === undefined ? '' : `${node.robot.spec}@${node.robot.revision}`
  const edgeText = selectedEdge === undefined
    ? ''
    : t('node.edgeFromTo', {
      from: draft.nodes.find(node => node.id === selectedEdge.from)?.label ?? selectedEdge.from,
      to: draft.nodes.find(node => node.id === selectedEdge.to)?.label ?? selectedEdge.to,
    })
  const heading = selectedNode !== undefined
    ? selectedNode.label
    : selectedEdge !== undefined
      ? edgeText
      : draft.name.trim() === '' ? t('crew.defaultName') : draft.name

  return (
    <aside className={css.inspector}>
      <div className={css.inspectorHead}>
        <span>{heading}</span>
        <button type="button" className={css.iconButton} onClick={onClose} aria-label={t('common.close')}>
          <IconCloseOutlineMedium size={16} />
        </button>
      </div>
      <div className={css.inspectorBody}>
        {selectedNode !== undefined ? (
          <>
            <Section title={t('node.title')}>
              <Field label={t('node.label')}>
                <Input value={selectedNode.label} onChange={(event) => { onPatchNode(selectedNode.id, { label: event.target.value }) }} />
              </Field>
              <Field label={t('node.role')}>
                <textarea
                  className={css.textarea}
                  rows={2}
                  value={selectedNode.role}
                  onChange={(event) => { onPatchNode(selectedNode.id, { role: event.target.value }) }}
                />
              </Field>
              <Field label={t('node.instruction')}>
                <textarea
                  className={css.textarea}
                  rows={4}
                  value={selectedNode.instruction}
                  onChange={(event) => { onPatchNode(selectedNode.id, { instruction: event.target.value }) }}
                />
              </Field>
              <div className={css.grid2}>
                <Field label={t('node.kind')}>
                  <select
                    className={css.select}
                    value={selectedNode.kind}
                    onChange={(event) => { onPatchNode(selectedNode.id, { kind: event.target.value as CrewNode['kind'] }) }}
                  >
                    <option value="worker">{t('node.kind.worker')}</option>
                    <option value="reviewer">{t('node.kind.reviewer')}</option>
                    <option value="observer">{t('node.kind.observer')}</option>
                  </select>
                </Field>
                <Field label={t('node.turns')}>
                  <Input
                    type="number"
                    min={1}
                    max={8}
                    value={String(selectedNode.maxTurns)}
                    onChange={(event) => { onPatchNode(selectedNode.id, { maxTurns: number(event, selectedNode.maxTurns) }) }}
                  />
                </Field>
              </div>
              <Field label={t('node.budget')}>
                <Input
                  type="number"
                  min={1000}
                  step={1000}
                  value={String(selectedNode.budgetTokens)}
                  onChange={(event) => { onPatchNode(selectedNode.id, { budgetTokens: number(event, selectedNode.budgetTokens) }) }}
                />
              </Field>
              <Field label={t('node.robot')}>
                <select
                  className={css.select}
                  value={robotValue(selectedNode)}
                  onChange={(event) => {
                    const value = event.target.value
                    if (value === '') {
                      onPatchNode(selectedNode.id, { robot: undefined })
                      return
                    }
                    const [spec, revision] = value.split('@')
                    onPatchNode(selectedNode.id, { robot: { spec: spec ?? '', revision: Number(revision) } })
                  }}
                >
                  <option value="">{t('node.robotNone')}</option>
                  {robots.map(robot => (
                    <option key={`${robot.spec}@${robot.revision}`} value={`${robot.spec}@${robot.revision}`}>
                      {t('node.robotOption', { name: robot.name, revision: robot.revision })}
                    </option>
                  ))}
                </select>
              </Field>
            </Section>
            <Button variant="ghost" onClick={() => { onDeleteNode(selectedNode.id) }}>{t('node.delete')}</Button>
          </>
        ) : selectedEdge !== undefined ? (
          <>
            <Section title={t('node.edge')}>
              <Field label={t('node.edge')}>
                <div className={css.edgeSummary}>{edgeText}</div>
              </Field>
              <Field label={t('node.kind')}>
                <select
                  className={css.select}
                  value={selectedEdgeSpec?.kind ?? 'handoff'}
                  onChange={(event) => { onPatchEdge(selectedEdge.from, selectedEdge.to, { kind: event.target.value as CrewEdge['kind'] }) }}
                >
                  <option value="handoff">{t('edge.kind.handoff')}</option>
                  <option value="delegate">{t('edge.kind.delegate')}</option>
                  <option value="review">{t('edge.kind.review')}</option>
                </select>
              </Field>
            </Section>
            <Button variant="ghost" onClick={() => { onDeleteEdge(selectedEdge) }}>{t('canvas.edgeDelete')}</Button>
          </>
        ) : (
          <>
            <Section title={t('crew.basics')}>
              <Field label={t('crew.name')}>
                <Input value={draft.name} onChange={(event) => { onPatchCrew({ name: event.target.value }) }} />
              </Field>
              <Field label={t('crew.description')}>
                <Input value={draft.description ?? ''} onChange={(event) => { onPatchCrew({ description: event.target.value }) }} />
              </Field>
              <Field label={t('crew.mission')}>
                <textarea className={css.textarea} rows={3} value={draft.mission}
                  onChange={(event) => { onPatchCrew({ mission: event.target.value })}}
                />
              </Field>
              <Field label={t('crew.success')} hint={t('crew.lineHint')}>
                <textarea className={css.textarea} rows={3} value={draft.successCriteria.join('\n')}
                  onChange={(event) => { onPatchCrew({ successCriteria: linesOf(event.target.value) })}}
                />
              </Field>
              <Field label={t('crew.stop')} hint={t('crew.lineHint')}>
                <textarea className={css.textarea} rows={2} value={draft.stopConditions.join('\n')}
                  onChange={(event) => { onPatchCrew({ stopConditions: linesOf(event.target.value) })}}
                />
              </Field>
              <Field label={t('crew.inputPrompt')}>
                <Input value={draft.input.prompt}
                  onChange={(event) => { onPatchCrew({ input: { ...draft.input, prompt: event.target.value } }) }}
                />
              </Field>
              <Field label={t('crew.workspace')}>
                <Input value={draft.workspaceRoot ?? ''}
                  onChange={(event) => {
                    const value = event.target.value.trim()
                    onPatchCrew(value === '' ? { workspaceRoot: undefined } : { workspaceRoot: value })
                  }}
                />
              </Field>
            </Section>

            <Section title={t('crew.guard')}>
              <div className={css.grid2}>
                <Field label={t('guard.steps')}>
                  <Input type="number" min={1} max={200} value={String(draft.guard.maxSteps)}
                    onChange={(event) => { onPatchCrew({ guard: { ...draft.guard, maxSteps: number(event, draft.guard.maxSteps) } }) }}
                  />
                </Field>
                <Field label={t('guard.messages')}>
                  <Input type="number" min={0} max={500} value={String(draft.guard.maxMessages)}
                    onChange={(event) => {
                      onPatchCrew({ guard: { ...draft.guard, maxMessages: number(event, draft.guard.maxMessages) } })
                    }}
                  />
                </Field>
                <Field label={t('guard.hops')}>
                  <Input type="number" min={0} max={5} value={String(draft.guard.maxHops)}
                    onChange={(event) => {
                      onPatchCrew({ guard: { ...draft.guard, maxHops: number(event, draft.guard.maxHops) } })
                    }}
                  />
                </Field>
                <Field label={t('guard.duplicates')}>
                  <Input type="number" min={0} max={10} value={String(draft.guard.maxDuplicates)}
                    onChange={(event) => {
                      onPatchCrew({ guard: { ...draft.guard, maxDuplicates: number(event, draft.guard.maxDuplicates) } })
                    }}
                  />
                </Field>
                <Field label={t('guard.noProgress')}>
                  <Input type="number" min={2} max={10} value={String(draft.guard.noProgressWindow)}
                    onChange={(event) => {
                      onPatchCrew({ guard: { ...draft.guard, noProgressWindow: number(event, draft.guard.noProgressWindow) } })
                    }}
                  />
                </Field>
                <Field label={t('guard.wallClock')}>
                  <Input type="number" min={1} step={1} value={String(Math.round(draft.guard.wallClockMs / 60_000))}
                    onChange={(event) => {
                      onPatchCrew({ guard: { ...draft.guard, wallClockMs: number(event, draft.guard.wallClockMs / 60_000) * 60_000 } })
                    }}
                  />
                </Field>
              </div>
              <Field label={t('guard.tokens')}>
                <Input type="number" min={1000} step={10_000} value={String(draft.guard.tokens)}
                  onChange={(event) => {
                    onPatchCrew({ guard: { ...draft.guard, tokens: number(event, draft.guard.tokens) } })
                  }}
                />
              </Field>
              <p className={css.hint}>{t('guard.hint')}</p>
            </Section>

            <Section title={t('crew.memory')}>
              <div className={css.grid2}>
                <Field label={t('memory.briefChars')}>
                  <Input type="number" min={500} step={500} value={String(draft.memory.briefChars)}
                    onChange={(event) => {
                      onPatchCrew({ memory: { ...draft.memory, briefChars: number(event, draft.memory.briefChars) } })
                    }}
                  />
                </Field>
                <Field label={t('memory.artifactChars')}>
                  <Input type="number" min={100} step={100} value={String(draft.memory.artifactChars)}
                    onChange={(event) => {
                      onPatchCrew({ memory: { ...draft.memory, artifactChars: number(event, draft.memory.artifactChars) } })
                    }}
                  />
                </Field>
              </div>
              <label className={css.checkRow}>
                <input type="checkbox" checked={draft.memory.extract}
                  onChange={(event) => { onPatchCrew({ memory: { ...draft.memory, extract: event.target.checked } }) }}
                />
                {t('memory.extract')}
              </label>
              <p className={css.hint}>{t('memory.hint')}</p>
            </Section>

            <Section title={t('crew.a2a')}>
              <div className={css.checkRow}>
                {(['request', 'delegate', 'event'] as const).map(intent => (
                  <label key={intent} className={css.checkInline}>
                    <input
                      type="checkbox"
                      checked={draft.a2a.intents.includes(intent)}
                      onChange={(event) => {
                        const next = event.target.checked
                          ? [...draft.a2a.intents, intent]
                          : draft.a2a.intents.filter(candidate => candidate !== intent)
                        onPatchCrew({ a2a: { ...draft.a2a, intents: next } })
                      }}
                    />
                    {intent}
                  </label>
                ))}
              </div>
              <Field label={t('a2a.peers')} hint={t('a2a.allPeers')}>
                <Input
                  value={draft.a2a.peers.join(', ')}
                  onChange={(event) => {
                    const peers = event.target.value.split(',').map(value => value.trim()).filter(value => value.length > 0)
                    onPatchCrew({ a2a: { ...draft.a2a, peers } })
                  }}
                />
              </Field>
              <p className={css.hint}>{t('a2a.hint')}</p>
            </Section>
          </>
        )}
      </div>
    </aside>
  )
}
