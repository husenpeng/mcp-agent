/** The Tomato Rbot specification editor: basic fields first, advanced blocks behind one tab. */
import type { ReactNode } from 'react'
import { useEffect, useId, useState } from 'react'
import { type RobotSpec, type RobotSpecIssue } from '@tomato/api-robot-controller/client'
import { emptyRobotSpec } from './spec.ts'
import { Button, Checkbox, Input, SegmentedTabs } from '@tomato/client-ui-primitives'
import type { PropsLocale } from '@tomato/client-ui-slots'
import { ChoiceRow, TagField, type Choice } from './SpecFields.tsx'
import { NS, type RobotKey } from './locales.ts'
import css from './RobotConfigEditor.module.css'

/** One nested value made writable for draft editing. */
type Writable<T> = T extends (infer U)[]
  ? Writable<U>[]
  : T extends object
    ? { -readonly [K in keyof T]: Writable<T[K]> }
    : T

type Trigger = RobotSpec['goal']['triggers'][number]
type Peer = RobotSpec['a2a']['peers'][number]

/** Tool names this harness ships, offered as allow/deny suggestions. */
const TOOL_SUGGESTIONS = ['read', 'write', 'edit', 'glob', 'grep', 'bash', 'web_search', 'web_fetch', 'todo_write'] as const
/** Data classes the specification schema accepts. */
const DATA_CLASSES = ['public', 'internal', 'confidential'] as const
/** A2A intents the specification schema accepts. */
const INTENTS = ['request', 'delegate', 'event'] as const
/** Memory namespaces the robot documentation uses as examples. */
const MEMORY_NAMESPACES = ['team:main', 'robot:self'] as const

/** Specification scopes the editor presents: the simple form first, every block behind one tab. */
type ConfigScope = 'basic' | 'advanced'

/** Issue paths the basic panel renders; any other path needs the advanced panel. */
const BASIC_ISSUE_PATHS: ReadonlySet<string> = new Set(['name', 'description', 'goal.mission', 'goal.successCriteria'])

const lines = (text: string): string[] => text.split('\n').map(item => item.trim()).filter(item => item !== '')

/** Props of the specification editor. */
export interface RobotConfigEditorProps extends PropsLocale<typeof NS> {
  /** Specification to edit; omitted starts a new robot. */
  readonly initial?: RobotSpec | undefined
  /** Whether a save is in flight. */
  readonly busy?: boolean | undefined
  /** Provider field issues from the last rejected save. */
  readonly issues?: readonly RobotSpecIssue[] | undefined
  /** Save the edited specification. */
  readonly onSubmit: (spec: RobotSpec) => void
  /** Close the editor without saving. */
  readonly onCancel: () => void
  /** Permission presets this deployment offers. */
  readonly presetOptions?: readonly Choice<string>[]
  /** Existing robot names offered for caller, callee, escalation, and peer fields. */
  readonly robotNames?: readonly string[]
  /** Skill names visible to the current workspace session. */
  readonly skillSuggestions?: readonly string[]
}

/** Render the six-block specification form. */
export function RobotConfigEditor({
  initial, busy, issues, onSubmit, onCancel, presetOptions = [], robotNames = [], skillSuggestions = [], t,
}: RobotConfigEditorProps): ReactNode {
  const [spec, setSpec] = useState<Writable<RobotSpec>>(() => structuredClone(initial ?? emptyRobotSpec()) as Writable<RobotSpec>)
  const [scope, setScope] = useState<ConfigScope>('basic')
  const scopeId = useId()
  // A rejected advanced field must be visible; keep the basic form selected while every issue fits it.
  useEffect(() => {
    if (issues !== undefined && issues.some(issue => !BASIC_ISSUE_PATHS.has(issue.path))) setScope('advanced')
  }, [issues])
  const set = (mutate: (draft: Writable<RobotSpec>) => void): void => {
    const next = structuredClone(spec)
    mutate(next)
    setSpec(next)
  }
  const issueFor = (path: string): string | undefined => issues?.find(issue => issue.path === path)?.message
  const heading = initial === undefined ? t('editor.create') : t('editor.edit')

  const text = (label: RobotKey, value: string, change: (next: string) => void, path?: string): ReactNode => (
    <label className={css.field}>
      <span className={css.label}>{t(label)}</span>
      <Input value={value} onChange={(event) => { change(event.target.value) }} />
      {path === undefined || issueFor(path) === undefined ? null : <em className={css.issue}>{issueFor(path)}</em>}
    </label>
  )
  const area = (label: RobotKey, value: string, change: (next: string) => void, path?: string): ReactNode => (
    <label className={css.field}>
      <span className={css.label}>{t(label)}</span>
      <textarea rows={3} value={value} onChange={(event) => { change(event.target.value) }} />
      {path === undefined || issueFor(path) === undefined ? null : <em className={css.issue}>{issueFor(path)}</em>}
    </label>
  )
  const number = (label: RobotKey, value: number, change: (next: number) => void): ReactNode => (
    <label className={css.field}>
      <span className={css.label}>{t(label)}</span>
      <Input
        type="number"
        value={String(value)}
        onChange={(event) => { change(Number(event.target.value)) }}
      />
    </label>
  )
  const tags = (
    label: RobotKey, values: readonly string[], change: (next: string[]) => void,
    suggestions: readonly string[], hint?: RobotKey, path?: string,
  ): ReactNode => (
    <TagField
      label={t(label)}
      values={values}
      onChange={change}
      suggestions={suggestions}
      addLabel={t('editor.add')}
      removeLabel={t('editor.remove')}
      suggestionsLabel={t('editor.suggestions')}
      {...hint === undefined ? {} : { hint: t(hint) }}
      {...path === undefined ? {} : { issue: issueFor(path) }}
    />
  )
  const presetChoices: Choice<string>[] = [...new Map(
    [...presetOptions, { value: spec.capability.permissionPreset, label: spec.capability.permissionPreset }]
      .filter(option => option.value !== '')
      .map(option => [option.value, option] as const),
  ).values()]

  const updateTrigger = (index: number, next: Trigger): void => {
    set((draft) => { draft.goal.triggers[index] = next })
  }
  const updatePeer = (index: number, next: Partial<Peer>): void => {
    set((draft) => {
      const current = draft.a2a.peers[index]
      if (current === undefined) return
      Object.assign(current, next)
    })
  }

  const submit = (): void => {
    const next = structuredClone(spec)
    // Empty peer rows are unfinished entries, not records the provider may reject.
    next.a2a.peers = next.a2a.peers.filter(peer => peer.peer.trim() !== '')
    if (next.description !== undefined && next.description.trim() === '') delete next.description
    onSubmit(next)
  }

  return (
    <div className={css.editor}>
      <header className={css.header}>
        <h2>{heading}</h2>
        <p>{t('editor.subtitle')}</p>
        <span className={css.notice}>{t('editor.storedOnly')}</span>
      </header>

      <SegmentedTabs<ConfigScope>
        className={css.scopeTabs}
        size="sm"
        label={t('editor.scopeTabs')}
        value={scope}
        onChange={setScope}
        items={[
          { value: 'basic', label: t('editor.basicTab'), id: `${scopeId}-basic-tab`, panelId: `${scopeId}-basic-panel` },
          { value: 'advanced', label: t('editor.advancedTab'), id: `${scopeId}-advanced-tab`, panelId: `${scopeId}-advanced-panel` },
        ]}
      />

      <div
        id={`${scopeId}-basic-panel`}
        role="tabpanel"
        aria-labelledby={`${scopeId}-basic-tab`}
        className={css.panel}
        hidden={scope !== 'basic'}
        tabIndex={0}
      >
        <section className={css.card}>
          <h3>{t('config.basicInfo')}</h3>
          <div className={css.row}>
            {text('field.name', spec.name, (value) => { set((draft) => { draft.name = value }) }, 'name')}
            {text('field.description', spec.description ?? '', (value) => {
              set((draft) => { if (value === '') delete draft.description; else draft.description = value })
            }, 'description')}
          </div>
          {area('field.mission', spec.goal.mission, (value) => { set((draft) => { draft.goal.mission = value }) }, 'goal.mission')}
          {area('field.successCriteria', spec.goal.successCriteria.join('\n'), (value) => {
            set((draft) => { draft.goal.successCriteria = lines(value) })
          })}
          <span className={css.notice}>{t('editor.basicDefaults')}</span>
        </section>
      </div>

      <div
        id={`${scopeId}-advanced-panel`}
        role="tabpanel"
        aria-labelledby={`${scopeId}-advanced-tab`}
        className={css.panel}
        hidden={scope !== 'advanced'}
        tabIndex={0}
      >
        <span className={css.notice}>{t('editor.advancedDefaults')}</span>

        <section className={css.card}>
          <h3>{t('config.position')}</h3>
          <div className={css.row}>
            {text('field.owner', spec.position.owner, (value) => { set((draft) => { draft.position.owner = value }) }, 'position.owner')}
            {text('field.reportsTo', spec.position.reportsTo ?? '', (value) => {
              set((draft) => { if (value === '') delete draft.position.reportsTo; else draft.position.reportsTo = value })
            })}
          </div>
          <div className={css.row}>
            {tags('field.callers', spec.position.callers, (value) => { set((draft) => { draft.position.callers = value }) }, robotNames)}
            {tags('field.callees', spec.position.callees, (value) => { set((draft) => { draft.position.callees = value }) }, robotNames)}
            {tags('field.escalation', spec.position.escalation, (value) => { set((draft) => { draft.position.escalation = value }) }, robotNames)}
          </div>
          <div className={css.row}>
            <ChoiceRow
              label={t('field.visibility')}
              value={spec.position.visibility}
              options={[
                { value: 'private', label: t('field.private') },
                { value: 'team', label: t('field.team') },
                { value: 'organization', label: t('field.organization') },
              ]}
              onChange={(value) => { set((draft) => { draft.position.visibility = value }) }}
            />
          </div>
        </section>

        <section className={css.card}>
          <h3>{t('config.goal')}</h3>
          <div className={css.row}>
            {area('field.stopConditions', spec.goal.stopConditions.join('\n'), (value) => {
              set((draft) => { draft.goal.stopConditions = lines(value) })
            })}
          </div>
          <div className={css.row}>
            <ChoiceRow
              label={t('field.strategy')}
              value={typeof spec.goal.strategy === 'string' ? spec.goal.strategy : 'plan'}
              options={[{ value: 'plan', label: t('field.plan') }, { value: 'loop', label: t('field.loop') }]}
              onChange={(value) => { set((draft) => { draft.goal.strategy = value }) }}
            />
            <ChoiceRow
              label={t('field.failurePolicy')}
              value={spec.goal.failurePolicy}
              options={[
                { value: 'retry', label: t('field.retry') },
                { value: 'pause', label: t('field.pause') },
                { value: 'fail', label: t('field.fail') },
                { value: 'escalate', label: t('field.escalate') },
              ]}
              onChange={(value) => { set((draft) => { draft.goal.failurePolicy = value }) }}
            />
          </div>
          <div className={css.row}>
            {number('field.tokens', spec.goal.budget.tokens, (value) => { set((draft) => { draft.goal.budget.tokens = value }) })}
            {number('field.millis', spec.goal.budget.millis, (value) => { set((draft) => { draft.goal.budget.millis = value }) })}
            {number('field.cost', spec.goal.budget.cost, (value) => { set((draft) => { draft.goal.budget.cost = value }) })}
            {number('field.toolCalls', spec.goal.budget.toolCalls, (value) => { set((draft) => { draft.goal.budget.toolCalls = value }) })}
            {number('field.maxConcurrentRuns', spec.goal.maxConcurrentRuns, (value) => { set((draft) => { draft.goal.maxConcurrentRuns = value }) })}
          </div>
          <div className={css.triggerList}>
            {spec.goal.triggers.map((trigger, index) => (
              <div key={index} className={css.triggerRow}>
                <ChoiceRow
                  label={t('editor.triggerKind')}
                  value={trigger.kind}
                  options={[
                    { value: 'manual', label: t('editor.manual') },
                    { value: 'cron', label: t('editor.cron') },
                    { value: 'event', label: t('editor.event') },
                  ]}
                  onChange={(kind) => {
                    updateTrigger(index, kind === 'manual'
                      ? { kind: 'manual' }
                      : kind === 'cron' ? { kind: 'cron', expression: '0 9 * * *', timeZone: 'UTC' } : { kind: 'event', topic: '' })
                  }}
                />
                {trigger.kind === 'cron' ? (
                  <>
                    {text('editor.expression', trigger.expression, (value) => { updateTrigger(index, { ...trigger, expression: value }) })}
                    {text('editor.timeZone', trigger.timeZone, (value) => { updateTrigger(index, { ...trigger, timeZone: value }) })}
                  </>
                ) : null}
                {trigger.kind === 'event'
                  ? text('editor.topic', trigger.topic, (value) => { updateTrigger(index, { ...trigger, topic: value }) })
                  : null}
                <Button
                  size="sm"
                  variant="outline"
                  className={css.iconButton}
                  aria-label={`${t('editor.remove')} ${String(index + 1)}`}
                  onClick={() => { set((draft) => { draft.goal.triggers.splice(index, 1) }) }}
                >×</Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              className={css.addButton}
              onClick={() => { set((draft) => { draft.goal.triggers.push({ kind: 'manual' }) }) }}
            >{t('editor.addTrigger')}</Button>
            {issueFor('goal.triggers') === undefined ? null : <em className={css.issue}>{issueFor('goal.triggers')}</em>}
          </div>
        </section>

        <section className={css.card}>
          <h3>{t('config.capability')}</h3>
          <div className={css.row}>
            {tags('field.toolsAllow', spec.capability.tools.allow, (value) => { set((draft) => { draft.capability.tools.allow = value }) }, TOOL_SUGGESTIONS, undefined, 'capability.tools')}
            {tags('field.toolsDeny', spec.capability.tools.deny, (value) => { set((draft) => { draft.capability.tools.deny = value }) }, TOOL_SUGGESTIONS)}
          </div>
          <div className={css.row}>
            {tags('field.skills', spec.capability.skills, (value) => { set((draft) => { draft.capability.skills = value }) }, skillSuggestions, 'editor.skillsHint')}
            {tags('field.mcpServers', spec.capability.mcpServers, (value) => { set((draft) => { draft.capability.mcpServers = value }) }, [], 'editor.mcpHint')}
          </div>
          <div className={css.row}>
            {tags('field.workspaceRoots', spec.capability.workspaceRoots, (value) => { set((draft) => { draft.capability.workspaceRoots = value }) }, [])}
            {tags('field.credentials', spec.capability.credentials, (value) => { set((draft) => { draft.capability.credentials = value }) }, [])}
          </div>
          <div className={css.row}>
            {tags('field.dataClasses', spec.capability.dataClasses, (value) => {
              set((draft) => { draft.capability.dataClasses = value as Writable<RobotSpec['capability']['dataClasses']> })
            }, DATA_CLASSES)}
            {presetChoices.length === 0
              ? text('field.permissionPreset', spec.capability.permissionPreset, (value) => { set((draft) => { draft.capability.permissionPreset = value }) })
              : (
                <ChoiceRow
                  label={t('field.permissionPreset')}
                  value={spec.capability.permissionPreset}
                  options={presetChoices}
                  onChange={(value) => { set((draft) => { draft.capability.permissionPreset = value }) }}
                  hint={t('editor.permissionsHint')}
                />
              )}
          </div>
          <div className={css.row}>
            <ChoiceRow
              label={t('field.sandbox')}
              value={spec.capability.sandbox}
              options={[
                { value: 'none', label: t('field.sandboxNone') },
                { value: 'workspace', label: t('field.sandboxWorkspace') },
                { value: 'full', label: t('field.sandboxFull') },
              ]}
              onChange={(value) => { set((draft) => { draft.capability.sandbox = value }) }}
            />
            <ChoiceRow
              label={t('field.network')}
              value={spec.capability.network}
              options={[
                { value: 'none', label: t('field.networkNone') },
                { value: 'allowlist', label: t('field.networkAllowlist') },
                { value: 'any', label: t('field.networkAny') },
              ]}
              onChange={(value) => { set((draft) => { draft.capability.network = value }) }}
            />
          </div>
        </section>

        <section className={css.card}>
          <h3>{t('config.io')}</h3>
          <div className={css.row}>
            {text('field.inputSchema', spec.io.input.schema, (value) => { set((draft) => { draft.io.input.schema = value }) })}
            {number('field.inputVersion', spec.io.input.version, (value) => { set((draft) => { draft.io.input.version = value }) })}
            {text('field.outputSchema', spec.io.output.schema, (value) => { set((draft) => { draft.io.output.schema = value }) })}
          </div>
          <div className={css.row}>
            <ChoiceRow
              label={t('field.outputFormat')}
              value={spec.io.output.format}
              options={[
                { value: 'text', label: t('field.formatText') },
                { value: 'markdown', label: t('field.formatMarkdown') },
                { value: 'json', label: t('field.formatJson') },
                { value: 'file', label: t('field.formatFile') },
              ]}
              onChange={(value) => { set((draft) => { draft.io.output.format = value }) }}
            />
            <ChoiceRow
              label={t('field.delivery')}
              value={spec.io.output.delivery}
              options={[
                { value: 'chat', label: t('field.deliveryChat') },
                { value: 'task', label: t('field.deliveryTask') },
                { value: 'artifact', label: t('field.deliveryArtifact') },
                { value: 'webhook', label: t('field.deliveryWebhook') },
              ]}
              onChange={(value) => { set((draft) => { draft.io.output.delivery = value }) }}
            />
          </div>
          {area('field.acceptance', spec.io.acceptance.join('\n'), (value) => { set((draft) => { draft.io.acceptance = lines(value) }) })}
        </section>

        <section className={css.card}>
          <h3>{t('config.memory')}</h3>
          <div className={css.row}>
            {tags('field.memoryRead', spec.memory.read, (value) => { set((draft) => { draft.memory.read = value }) }, MEMORY_NAMESPACES, 'editor.memoryHint')}
            {tags('field.memoryWrite', spec.memory.write, (value) => { set((draft) => { draft.memory.write = value }) }, MEMORY_NAMESPACES)}
          </div>
          <div className={css.row}>
            {number('field.retentionDays', spec.memory.retentionDays ?? 0, (value) => {
              set((draft) => { if (value > 0) draft.memory.retentionDays = value; else delete draft.memory.retentionDays })
            })}
            <ChoiceRow
              label={t('field.recall')}
              value={spec.memory.recall}
              options={[
                { value: 'none', label: t('field.recallNone') },
                { value: 'keyword', label: t('field.recallKeyword') },
                { value: 'hybrid', label: t('field.recallHybrid') },
              ]}
              onChange={(value) => { set((draft) => { draft.memory.recall = value }) }}
            />
          </div>
        </section>

        <section className={css.card}>
          <h3>{t('config.a2a')}</h3>
          <div className={css.row}>
            {tags('field.intents', spec.a2a.intents, (value) => {
              set((draft) => { draft.a2a.intents = value as Writable<RobotSpec['a2a']['intents']> })
            }, INTENTS, 'editor.intentsHint')}
          </div>
          <div className={css.peerList}>
            {spec.a2a.peers.map((peer, index) => (
              <div key={index} className={css.peerRow}>
                <Input
                  className={css.peerInput}
                  aria-label={t('editor.peerName')}
                  placeholder={t('editor.peerName')}
                  list="robot-peer-names"
                  value={peer.peer}
                  onChange={(event) => { updatePeer(index, { peer: event.target.value }) }}
                />
                <Checkbox
                  checked={peer.requiresApproval}
                  onChange={(next) => { updatePeer(index, { requiresApproval: next }) }}
                  label={t('editor.peerApproval')}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className={css.iconButton}
                  aria-label={`${t('editor.remove')} ${peer.peer === '' ? t('editor.peerName') : peer.peer}`}
                  onClick={() => { set((draft) => { draft.a2a.peers.splice(index, 1) }) }}
                >×</Button>
              </div>
            ))}
            <datalist id="robot-peer-names">
              {robotNames.map(name => <option key={name} value={name} />)}
            </datalist>
            <Button size="sm" variant="outline" className={css.addButton} onClick={() => {
              set((draft) => {
                draft.a2a.peers.push({
                  peer: '',
                  budget: { tokens: 10_000, millis: 60_000, cost: 0, toolCalls: 10 },
                  requiresApproval: false,
                })
              })
            }}>{t('editor.addPeer')}</Button>
          </div>
        </section>
      </div>

      <footer className={css.actions}>
        <Button variant="outline" onClick={onCancel}>{t('roster.cancel')}</Button>
        <Button variant="primary" disabled={busy === true} onClick={submit}>{t('roster.publish')}</Button>
      </footer>
    </div>
  )
}
