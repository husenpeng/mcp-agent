/** Multi-agent collaboration tab: the group-chat rail, the live transcript of one run, and the task composer that starts a run. */
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CrewRun, CrewRunId } from '@tomato/experimental-robot-crew'
import type { InjectFace, PropsLocale, PropsRuntime, TranslateNS } from '@tomato/client-ui-slots'
import { Button, IconPlayOutlineMedium, IconPlusOutlineMedium, Tag } from '@tomato/client-ui-primitives'
import type { TagTone } from '@tomato/client-ui-primitives'
import { chatLines, developmentCrew, groupChats, uniqueGroupName } from './chat.ts'
import type { ChatLine, GroupChat } from './chat.ts'
import { terminalRunState } from './draft.ts'
import { NS } from './locales.ts'
import type { GroupChatInjected, Notice } from './types.ts'
import css from './GroupChat.module.css'

/** Props of the multi-agent collaboration tab. */
export type GroupChatProps =
  PropsRuntime<'main'>
  & InjectFace<GroupChatInjected>
  & PropsLocale<typeof NS>

/** Tag tone of one run state. */
function toneOf(run: CrewRun): TagTone {
  if (run.state === 'succeeded') return 'success'
  if (run.state === 'failed') return 'danger'
  if (run.state === 'tripped') return 'warning'
  if (run.state === 'running' || run.state === 'queued') return 'info'
  return 'neutral'
}

/** Kind labels a system line carries instead of a speaker. */
const SYSTEM_KINDS: readonly ChatLine['kind'][] = ['start', 'end', 'guard', 'memory']

/** Longest report shown inline before it folds behind a disclosure. */
const LONG_REPORT_CHARS = 600

/**
 * Render one chat line as a group-chat row.
 * @param props.line - derived ledger line.
 * @param props.t - dictionary translator.
 * @returns the row.
 */
function Line({ line, t }: { readonly line: ChatLine; readonly t: TranslateNS<typeof NS> }): ReactNode {
  const system = SYSTEM_KINDS.includes(line.kind)
  const speaker = line.from === undefined
    ? t(`line.${line.kind}`)
    : line.to === undefined ? line.from : `${line.from} → ${line.to}`
  return (
    <li className={css.line} data-kind={line.kind}>
      {system
        ? (
          <span className={css.systemLine}>
            {t(`line.${line.kind}`)} · {line.kind === 'memory' && line.counts !== undefined
              ? t('line.carriedMemory', line.counts)
              : line.text}
          </span>
        )
        : (
          <div className={css.lineHead}>
            <span className={css.speaker}>{speaker}</span>
            {line.kind === 'report' || line.kind === 'working'
              ? null
              : <span className={css.lineKind}>{t(`line.${line.kind}`)}</span>}
          </div>
        )}
      {system || line.text === ''
        ? null
        : line.text.length > LONG_REPORT_CHARS
          ? (
            <details className={css.fold}>
              <summary className={css.foldSummary}>{line.text.slice(0, LONG_REPORT_CHARS)}…</summary>
              <pre className={css.foldBody}>{line.text}</pre>
            </details>
          )
          : <p className={css.lineText}>{line.text}</p>}
    </li>
  )
}

/**
 * Render the collaboration tab.
 * @param props - slot runtime seats, injected roster/ledger, actions, and copy.
 * @returns the tab body.
 */
export function GroupChat({
  useRegistry, useLedger, actions, createWithConversation, openCanvas, workspaceRoot, t, useRemoteAccess,
}: GroupChatProps): ReactNode {
  const registry = useRegistry(snapshot => snapshot)
  const ledger = useLedger(snapshot => snapshot)
  const canCreateSession = useRemoteAccess('session/create')
  const chats = useMemo(() => groupChats(registry), [registry])

  const [selectedSpecId, setSelectedSpecId] = useState<string>()
  const [task, setTask] = useState('')
  const [notice, setNotice] = useState<Notice>()
  const [busy, setBusy] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)

  const selected: GroupChat | undefined = chats.find(chat => chat.ref.spec === selectedSpecId) ?? chats[0]
  const revision = selected === undefined
    ? undefined
    : registry.specs.find(candidate => candidate.ref.spec === selected.ref.spec)
  const latest = selected?.latestRun
  const entries = latest !== undefined && ledger.runId === latest.id ? ledger.entries : []
  const lines = revision === undefined ? [] : chatLines(entries, revision.spec)
  const live = latest !== undefined && !terminalRunState(latest.state)

  // Follow the selected chat's latest run while it executes.
  useEffect(() => {
    actions.track(latest?.id, live)
  }, [actions, latest?.id, live, latest?.steps])

  // Keep the newest line in view as a live run appends to the transcript.
  useEffect(() => {
    const element = scroller.current
    if (element !== null) element.scrollTop = element.scrollHeight
  }, [lines.length, latest?.id])

  useEffect(() => {
    if (notice === undefined) return
    const timer = setTimeout(() => { setNotice(undefined) }, 6000)
    return () => { clearTimeout(timer) }
  }, [notice])

  const createFromTemplate = async (): Promise<void> => {
    setBusy(true)
    try {
      const result = await actions.publish({
        spec: developmentCrew({
          name: uniqueGroupName(chats.map(chat => chat.name), t('template.name')),
          mission: t('template.mission'),
          prompt: t('group.taskPlaceholder'),
          labels: {
            kickoff: t('label.kickoff'),
            build: t('label.build'),
            verify: t('label.verify'),
            audit: t('label.audit'),
            dispatch: t('label.dispatch'),
          },
          workspaceRoot: workspaceRoot(),
        }),
      })
      if (!result.ok) {
        setNotice({ tone: 'error', text: t('group.notice.publishFailed', { detail: result.error.message }) })
        return
      }
      setSelectedSpecId(result.value.ref.spec)
      setNotice({ tone: 'success', text: t('group.notice.published') })
    } finally {
      setBusy(false)
    }
  }

  const startTask = async (): Promise<void> => {
    if (selected === undefined) return
    const message = task.trim()
    if (message === '') {
      setNotice({ tone: 'warning', text: t('group.notice.taskEmpty') })
      return
    }
    setBusy(true)
    try {
      const result = await actions.start({ ref: selected.ref, message })
      if (!result.ok) {
        setNotice({ tone: 'error', text: t('group.notice.startFailed', { detail: result.error.message }) })
        return
      }
      setTask('')
      setNotice({ tone: 'success', text: t('group.notice.started') })
      actions.track(result.value.id, true)
    } finally {
      setBusy(false)
    }
  }

  const stopRun = async (runId: CrewRunId): Promise<void> => {
    const result = await actions.cancel({ runId })
    setNotice(result.ok
      ? { tone: 'success', text: t('group.notice.cancelled') }
      : { tone: 'error', text: t('group.notice.cancelFailed', { detail: result.error.message }) })
  }

  return (
    <div className={css.page}>
      <aside className={css.rail}>
        <header className={css.railHead}>
          <h1 className={css.railTitle}>{t('group.title')}</h1>
          <div className={css.railActions}>
            <Button variant="outline" size="sm" icon={<IconPlusOutlineMedium />} onClick={openCanvas}>
              {t('group.manual')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canCreateSession}
              onClick={createWithConversation}
            >
              {t('group.auto')}
            </Button>
          </div>
        </header>
        <button
          type="button"
          className={css.templateButton}
          disabled={busy}
          onClick={() => { void createFromTemplate() }}
        >
          {t('group.template')}
        </button>
        {chats.length === 0
          ? <p className={css.railEmpty}>{t('group.emptyHint')}</p>
          : (
            <ul className={css.chatList}>
              {chats.map(chat => (
                <li key={chat.ref.spec}>
                  <button
                    type="button"
                    className={css.chatItem}
                    data-active={chat.ref.spec === selected?.ref.spec}
                    onClick={() => { setSelectedSpecId(chat.ref.spec) }}
                  >
                    <span className={css.chatName}>{chat.name}</span>
                    <span className={css.chatMeta}>
                      {t('group.members', { count: chat.members.length })}
                      {chat.latestRun === undefined
                        ? null
                        : <span className={css.chatState}>{t(`run.state.${chat.latestRun.state}`)}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
      </aside>

      <main className={css.main}>
        {selected === undefined || revision === undefined
          ? (
            <div className={css.empty}>
              <h2>{t('group.empty')}</h2>
              <p>{t('group.emptyHint')}</p>
            </div>
          )
          : (
            <>
              <header className={css.mainHead}>
                <div className={css.mainTitleBlock}>
                  <h2 className={css.mainTitle}>{selected.name}</h2>
                  <p className={css.mission}>{selected.mission}</p>
                </div>
                <div className={css.headActions}>
                  {latest === undefined ? null : <Tag tone={toneOf(latest)}>{t(`run.state.${latest.state}`)}</Tag>}
                  {latest !== undefined && live
                    ? (
                      <Button variant="outline" size="sm" onClick={() => { void stopRun(latest.id) }}>
                        {t('group.stop')}
                      </Button>
                    )
                    : null}
                  <Button variant="ghost" size="sm" onClick={openCanvas}>{t('group.openCanvas')}</Button>
                </div>
              </header>

              <ul className={css.members}>
                {revision.spec.nodes.map((node) => {
                  const progress = latest?.nodes.find(candidate => candidate.id === node.id)
                  return (
                    <li key={node.id} className={css.memberChip} data-state={progress?.state ?? 'pending'}>
                      <span className={css.memberDot} data-state={progress?.state ?? 'pending'} />
                      <span className={css.memberLabel}>{node.label}</span>
                      <span className={css.memberState}>{t(`node.state.${progress?.state ?? 'pending'}`)}</span>
                    </li>
                  )
                })}
              </ul>

              <div className={css.transcript} ref={scroller} aria-live="polite">
                {latest === undefined
                  ? <p className={css.transcriptEmpty}>{t('group.transcript.empty')}</p>
                  : lines.length === 0
                    ? <p className={css.transcriptEmpty}>{t('group.transcript.waiting')}</p>
                    : <ul className={css.lines}>{lines.map(line => <Line key={line.seq} line={line} t={t} />)}</ul>}
              </div>

              <footer className={css.composer}>
                {latest?.output === undefined || live
                  ? null
                  : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setTask(latest.output ?? '') }}
                    >
                      {t('group.useDispatch')}
                    </Button>
                  )}
                <textarea
                  className={css.taskInput}
                  value={task}
                  placeholder={revision.spec.input.prompt}
                  aria-label={t('group.taskPlaceholder')}
                  onChange={(event) => { setTask(event.target.value) }}
                />
                <div className={css.composerBar}>
                  <span className={css.notice} data-tone={notice?.tone}>{notice?.text ?? ''}</span>
                  <Button
                    variant="primary"
                    icon={<IconPlayOutlineMedium />}
                    disabled={busy}
                    onClick={() => { void startTask() }}
                  >
                    {busy ? t('group.starting') : t('group.start')}
                  </Button>
                </div>
              </footer>
            </>
          )}
      </main>
    </div>
  )
}
