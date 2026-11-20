/**
 * Robot Room page: the room rail, the visible message log, the composer, and the
 * monitor/member/settings inspector. Every robot-to-robot message is rendered
 * from the same log the operator reads.
 */
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { InjectFace, PropsLocale, PropsRuntime, TranslateNS } from '@tomato/client-ui-slots'
import {
  Button, Checkbox, IconCloseOutlineMedium, IconPauseOutlineMedium,
  IconPlayOutlineMedium, IconPlusOutlineMedium, IconSendOutlineMedium, IconWarningTriangleOutlineMedium, Tag, Tooltip,
} from '@tomato/client-ui-primitives'
import type { TagTone } from '@tomato/client-ui-primitives'
import type {
  A2aEnvelopeV2, MemberRole, Room, RoomMemberId, RoomMemberSpec, RoomMessage, RoomSpec, RoomWorkRecord, WakeRule,
} from '@tomato/api-robot-room-controller/types'
import type {
  RobotCapabilitiesRequest, RobotCapabilityCatalog, RobotCapabilityOption,
} from '@tomato/api-robot-controller/types'
import type { RemoteResult } from '@tomato/typert-protocol'
import { NS } from './locales.ts'
import type { RoomInjected, RoomRobotOption } from './types.ts'
import css from './RoomPage.module.css'

/** Tone one ticket state renders with. */
function ticketTone(state: RoomWorkRecord['state']): TagTone {
  if (state === 'ready') return 'success'
  if (state === 'blocked') return 'warning'
  if (state === 'failed') return 'danger'
  if (state === 'running') return 'info'
  return 'neutral'
}

/** Render one room's tickets grouped by the request thread they belong to. */
function Tickets({ records, loading, onRefresh, t }: {
  readonly records: readonly RoomWorkRecord[]
  readonly loading: boolean
  readonly onRefresh: () => void
  readonly t: TranslateNS<typeof NS>
}): ReactNode {
  const groups = useMemo(() => {
    const byThread = new Map<string, RoomWorkRecord[]>()
    for (const record of records) {
      const list = byThread.get(record.thread) ?? []
      list.push(record)
      byThread.set(record.thread, list)
    }
    return [...byThread.entries()]
  }, [records])
  return (
    <div className={css.tickets}>
      <div className={css.ticketsBar}>
        <span className={css.ticketsTitle}>{t('tickets.title')}</span>
        <Button size="sm" onClick={onRefresh}>{t('tickets.refresh')}</Button>
      </div>
      {loading && records.length === 0
        ? <div className={css.ticketsEmpty}>{t('tickets.loading')}</div>
        : records.length === 0
          ? <div className={css.ticketsEmpty}>{t('tickets.empty')}</div>
          : groups.map(([thread, rows]) => (
            <section key={thread} className={css.ticketGroup}>
              <div className={css.ticketThread}>{t('tickets.thread')} · {thread}</div>
              {rows.map(record => (
                <div key={record.ticket} className={css.ticketRow}>
                  <div className={css.ticketHead}>
                    <span className={css.ticketMember}>{record.member}</span>
                    <span className={css.ticketSubject}>{record.subject}</span>
                    <Tag tone={ticketTone(record.state)}>{t(`tickets.state.${record.state}`)}</Tag>
                  </div>
                  <div className={css.ticketMeta}>
                    <span>{t('tickets.rounds', { count: record.rounds })}</span>
                    {record.review === undefined
                      ? null
                      : <span>{t('tickets.review', { rounds: record.review.rounds })}</span>}
                    {record.review !== undefined && record.review.findings.length > 0
                      ? <span className={css.ticketFindings}>{record.review.findings.join(' · ')}</span>
                      : null}
                  </div>
                </div>
              ))}
            </section>
          ))}
    </div>
  )
}

/** Props of the Robot Room page. */
export type RoomPageProps =
  PropsRuntime<'main'>
  & InjectFace<RoomInjected>
  & PropsLocale<typeof NS>

const COLORS = ['#5b6cf0', '#12a594', '#8e5cf0', '#d98a00', '#e5486d', '#1b8fd6', '#6b8e23', '#b56576']

type Mutable<T> = T extends string ? T
  : T extends readonly (infer U)[] ? Mutable<U>[]
    : T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> }
      : T

function colorOf(member: RoomMemberSpec, index: number): string {
  return member.color ?? COLORS[index % COLORS.length] ?? '#5b6cf0'
}

function initial(name: string): string {
  return Array.from(name.trim())[0] ?? '?'
}

function tokenText(tokens: number): string {
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(tokens)
}

function timeOf(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function stateTone(state: Room['state']): TagTone {
  if (state === 'active') return 'success'
  if (state === 'tripped') return 'warning'
  if (state === 'paused') return 'neutral'
  return 'neutral'
}

function roleKey(role: MemberRole): `members.role.${MemberRole}` {
  return `members.role.${role}`
}

function wakeKey(rule: WakeRule): `members.wake.${WakeRule['kind']}` {
  return `members.wake.${rule.kind}`
}

function intentKey(intent: A2aEnvelopeV2['intent']): `intent.${A2aEnvelopeV2['intent']}` {
  return `intent.${intent}`
}

/**
 * Render the page.
 * @param props - runtime seat, injected room face, and dictionary.
 * @returns the page.
 */
export function RoomPage(props: RoomPageProps): ReactNode {
  const { useRooms, useRobots, actions, t } = props
  const openRobots = (): void => { props.openRobots() }
  const roomsSnapshot = useRooms(snapshot => snapshot)
  const robotsSnapshot = useRobots(snapshot => snapshot)
  const rooms = roomsSnapshot.rooms
  const [selected, setSelected] = useState<string | undefined>(rooms[0]?.id)
  const [messages, setMessages] = useState<readonly RoomMessage[]>([])
  const [view, setView] = useState<'chat' | 'tickets'>('chat')
  const [work, setWork] = useState<readonly RoomWorkRecord[]>([])
  const [workLoading, setWorkLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [tab, setTab] = useState<'monitor' | 'members'>('monitor')
  const [editing, setEditing] = useState<RoomMemberId | undefined>(undefined)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<string | undefined>(undefined)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const feed = useRef<HTMLDivElement>(null)
  const [text, setText] = useState('')

  const room = rooms.find(candidate => candidate.id === selected) ?? rooms[0]
  const spec = room?.spec
  const members = spec?.members ?? []
  const labels = useMemo(() => new Map(members.map(member => [member.id, member.displayName ?? member.id])), [members])
  const usage = useMemo(() => {
    const totals = new Map<string, number>()
    for (const message of messages) {
      if (message.author.kind !== 'member' || message.usage === undefined) continue
      totals.set(message.author.id, (totals.get(message.author.id) ?? 0) + message.usage)
    }
    return totals
  }, [messages])
  const episode = useMemo(() => {
    const id = messages.at(-1)?.episode
    if (id === undefined) return undefined
    const current = messages.filter(message => message.episode === id)
    return {
      id,
      tokens: current.reduce((sum, message) => sum + (message.usage ?? 0), 0),
      turns: current.filter(message => message.kind === 'activity' && message.activity?.done === true).length,
      messages: current.length,
      depth: current.reduce((max, message) => Math.max(max, message.depth), 0),
      startedAt: current[0]?.at,
    }
  }, [messages])

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => feed.current,
    estimateSize: () => 110,
    overscan: 8,
    getItemKey: index => messages[index]?.id ?? index,
  })

  useEffect(() => {
    if (room === undefined) return
    if (room.id !== selected) setSelected(room.id)
  }, [room, selected])

  useEffect(() => {
    if (room === undefined) { setMessages([]); return }
    let live = true
    const read = async (): Promise<void> => {
      const result = await actions.messages({ room: room.id, limit: 500 })
      if (!live) return
      if (result.ok) { setMessages(result.value); setError(undefined) }
      else setError(result.error.message)
    }
    void read()
    const timer = setInterval(() => { void read() }, 1000)
    return () => { live = false; clearInterval(timer) }
  }, [room?.id, actions])

  const loadWork = async (roomId: Room['id']): Promise<void> => {
    setWorkLoading(true)
    const result = await actions.work({ room: roomId })
    setWorkLoading(false)
    if (result.ok) { setWork(result.value); setError(undefined) }
    else setError(result.error.message)
  }

  useEffect(() => {
    if (view !== 'tickets' || room === undefined) return
    void loadWork(room.id)
    const timer = setInterval(() => { void loadWork(room.id) }, 2000)
    return () => { clearInterval(timer) }
  }, [view, room?.id, actions])

  useEffect(() => {
    if (messages.length === 0) return
    virtualizer.scrollToIndex(messages.length - 1, { align: 'end' })
  }, [messages.length, room?.id, virtualizer])

  useEffect(() => {
    if (toast === undefined) return
    const timer = setTimeout(() => { setToast(undefined) }, 2200)
    return () => { clearTimeout(timer) }
  }, [toast])

  const send = async (): Promise<void> => {
    if (room === undefined) return
    const value = text.trim()
    if (value === '') return
    const mentions = members.filter(member => value.includes(`@${labels.get(member.id) ?? member.id}`)).map(member => member.id)
    const result = await actions.post({ room: room.id, text: value, ...mentions.length === 0 ? {} : { mentions } })
    if (result.ok) {
      setText('')
      setToast(t('toast.posted'))
      const refreshed = await actions.messages({ room: room.id, limit: 500 })
      if (refreshed.ok) setMessages(refreshed.value)
    } else {
      setError(result.error.message)
    }
  }

  const togglePause = async (): Promise<void> => {
    if (room === undefined) return
    const result = room.state === 'paused'
      ? await actions.pause({ room: room.id, paused: false })
      : await actions.pause({ room: room.id, paused: true })
    if (result.ok) setToast(result.value.state === 'paused' ? t('toast.paused') : t('toast.resumed'))
    else setError(result.error.message)
  }

  const resume = async (): Promise<void> => {
    if (room === undefined) return
    const result = await actions.resume({ room: room.id })
    if (result.ok) setToast(t('toast.resumed'))
    else setError(result.error.message)
  }

  const relax = async (): Promise<void> => {
    if (room === undefined) return
    const result = await actions.relaxOnce({ room: room.id })
    if (result.ok) setToast(t('toast.relaxed'))
    else setError(result.error.message)
  }

  const endEpisode = async (): Promise<void> => {
    if (room === undefined) return
    const result = await actions.endEpisode({ room: room.id })
    if (result.ok) setToast(t('toast.ended'))
    else setError(result.error.message)
  }

  const approve = async (message: RoomMessage, decision: 'approved' | 'rejected'): Promise<void> => {
    if (room === undefined || message.approval === undefined) return
    const result = await actions.approve({ room: room.id, approval: message.approval.id, decision })
    if (result.ok) setToast(decision === 'approved' ? t('toast.approved') : t('toast.rejected'))
    else setError(result.error.message)
  }

  const saveSpec = async (next: RoomSpec): Promise<boolean> => {
    if (room === undefined) return false
    const result = await actions.publish({ id: room.id, spec: next })
    if (result.ok) { setToast(t('toast.saved')); setEditing(undefined); return true }
    setError(result.error.message)
    return false
  }

  const createRoom = async (next: RoomSpec): Promise<boolean> => {
    const result = await actions.publish({ spec: next })
    if (result.ok) {
      setSelected(result.value.id)
      setCreating(false)
      setToast(t('toast.saved'))
      return true
    }
    setError(result.error.message)
    return false
  }

  const addMember = async (robot: RoomRobotOption): Promise<void> => {
    if (room === undefined) return
    if (room.spec.members.length >= 12) { setError(t('members.full')); return }
    const id = `member-${room.spec.members.length + 1}` as RoomMemberId
    const member: RoomMemberSpec = {
      id,
      robot: { spec: robot.spec, revision: robot.revision },
      displayName: robot.name,
      role: 'worker',
      wake: { kind: 'mention' },
      a2a: { canAddress: '*', accepts: ['request', 'delegate', 'handoff', 'reply'], requiresApproval: [] },
      budget: { turnInputTokens: 48_000, turnOutputTokens: 6_000, dailyTokens: 600_000 },
      enabled: true,
    }
    await saveSpec({ ...room.spec, members: [...room.spec.members, member] })
  }

  const memberOf = (id: string): RoomMemberSpec | undefined => members.find(member => member.id === id)
  const editingMember = editing === undefined ? undefined : memberOf(editing)
  const lastGuard = [...messages].reverse().find(message => message.kind === 'guard')

  return (
    <div className={css.page}>
      <aside className={css.rail}>
        <div className={css.railHead}>
          <span className={css.brand}>{initial(t('title'))}</span>
          <span className={css.railTitle}>{t('title')}</span>
          <Button size="sm" variant="ghost" onClick={() => { setCreating(true) }}>
            <IconPlusOutlineMedium size={16} />
          </Button>
        </div>
        <div className={css.section}>{t('rail.rooms')}</div>
        {rooms.length === 0
          ? (
            <div className={css.empty}>
              <p>{t('rail.empty')}</p>
              <p className={css.hint}>{t('rail.emptyHint')}</p>
              <Button variant="primary" size="sm" onClick={() => { setCreating(true) }}>{t('rail.new')}</Button>
            </div>
          )
          : (
            <div className={css.list}>
              {rooms.map(candidate => (
                <button
                  key={candidate.id}
                  className={`${css.roomItem} ${candidate.id === room?.id ? css.active : ''}`}
                  onClick={() => { setSelected(candidate.id) }}
                >
                  <span className={css.roomGlyph} data-state={candidate.state}>
                    {initial(candidate.spec.name)}
                  </span>
                  <span className={css.roomMeta}>
                    <span className={css.roomName}>{candidate.spec.name}</span>
                    <span className={css.roomSub}>{candidate.spec.members.length} · {t(`state.${candidate.state}`)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        <div className={css.railAction}>
          <Button className={css.block} size="sm" onClick={() => { setCreating(true) }}>
            <IconPlusOutlineMedium size={14} />
            {t('rail.new')}
          </Button>
        </div>
        <div className={css.section}>{t('rail.bots')}</div>
        <div className={css.list}>
          {robotsSnapshot.options.slice(0, 8).map(robot => (
            <div key={`${robot.spec}@${robot.revision}`} className={css.botItem}>
              <span className={css.botAvatar}>{initial(robot.name)}</span>
              <span className={css.botName}>{robot.name}</span>
            </div>
          ))}
        </div>
        <div className={css.railFoot}>
          <Button className={css.block} onClick={openRobots}>{t('new.openRobots')}</Button>
        </div>
      </aside>

      <main className={css.main}>
        {room === undefined
          ? <div className={css.noRoom}>{t('rail.emptyHint')}</div>
          : (
            <>
              <header className={css.head}>
                <span className={css.headGlyph}>{initial(room.spec.name)}</span>
                <div className={css.headTitles}>
                  <h1>{room.spec.name}<Tag tone={stateTone(room.state)}>{t(`state.${room.state}`)}</Tag></h1>
                  <p>{room.spec.charter}</p>
                </div>
                <div className={css.avatarStack}>
                  {members.slice(0, 6).map((member, index) => (
                    <span
                      key={member.id}
                      className={css.avatar}
                      style={{ background: colorOf(member, index) }}
                      title={member.displayName ?? member.id}
                    >
                      {initial(member.displayName ?? member.id)}
                    </span>
                  ))}
                </div>
                <Button size="sm" onClick={() => { setSettingsOpen(true) }}>{t('settings.open')}</Button>
                <Button size="sm" onClick={() => { void togglePause() }}>
                  {room.state === 'paused' ? <IconPlayOutlineMedium size={15} /> : <IconPauseOutlineMedium size={15} />}
                  {room.state === 'paused' ? t('header.resume') : t('header.pause')}
                </Button>
              </header>

              <div className={css.viewTabs}>
                {(['chat', 'tickets'] as const).map(key => (
                  <button
                    key={key}
                    className={`${css.viewTab} ${view === key ? css.viewTabActive : ''}`}
                    onClick={() => { setView(key) }}
                  >
                    {t(`view.${key}`)}
                  </button>
                ))}
              </div>

              {view === 'tickets'
                ? (
                  <Tickets
                    records={work}
                    loading={workLoading}
                    t={t}
                    onRefresh={() => { void loadWork(room.id) }}
                  />
                )
                : (
                  <>
                    <div className={css.feed} ref={feed}>
                      <div className={css.feedInner} style={{ height: virtualizer.getTotalSize() }}>
                        {virtualizer.getVirtualItems().map((virtual) => {
                          const message = messages[virtual.index]
                          if (message === undefined) return null
                          const previous = messages[virtual.index - 1]
                          const showEpisode = message.kind === 'episode' || previous === undefined || previous.episode !== message.episode
                          return (
                            <div
                              key={message.id}
                              data-index={virtual.index}
                              ref={virtualizer.measureElement}
                              className={css.virtualRow}
                              style={{ transform: `translateY(${virtual.start}px)` }}
                            >
                              {showEpisode
                                ? (
                                  <div className={css.episode}>
                                    <span>{t('episode.label', { n: message.episode })}</span>
                                    <span>{t('episode.by', { name: message.author.kind === 'human' ? message.author.name : '—' })}</span>
                                  </div>
                                )
                                : null}
                              <Message
                                message={message}
                                memberOf={memberOf}
                                labels={labels}
                                t={t}
                                onApprove={approve}
                                onOpenSession={props.openSession}
                                guardActive={room.state === 'tripped' && lastGuard?.id === message.id}
                                onResume={resume}
                                onRelax={relax}
                                onEnd={endEpisode}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {error === undefined ? null : (
                      <div className={css.error}><IconWarningTriangleOutlineMedium size={16} />{error}<button onClick={() => { setError(undefined) }}>{t('common.close')}</button></div>
                    )}

                    <div className={css.composerWrap}>
                      {room.state === 'tripped' ? <div className={css.lock}>{t('composer.locked')}</div> : null}
                      <div className={css.composer}>
                        <textarea
                          ref={textarea}
                          rows={2}
                          value={text}
                          placeholder={t('composer.placeholder')}
                          onChange={(event) => { setText(event.target.value) }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                              event.preventDefault()
                              void send()
                            }
                          }}
                        />
                        <div className={css.composerRow}>
                          <div className={css.mentions}>
                            {members.slice(0, 5).map((member, index) => (
                              <button
                                key={member.id}
                                className={css.mention}
                                onClick={() => {
                                  setText(value => `${value} @${labels.get(member.id) ?? member.id} `)
                                  textarea.current?.focus()
                                }}
                              >
                                <span className={css.miniAvatar} style={{ background: colorOf(member, index) }}>
                                  {initial(member.displayName ?? member.id)}
                                </span>
                                {member.displayName ?? member.id}
                              </button>
                            ))}
                          </div>
                          <Button variant="primary" size="sm" disabled={text.trim() === ''} onClick={() => { void send() }}>
                            <IconSendOutlineMedium size={15} />
                            {t('composer.send')}
                          </Button>
                        </div>
                      </div>
                      <div className={css.composerHint}>{t('composer.hint')}</div>
                    </div>
                  </>
                )}
            </>
          )}
      </main>

      <aside className={css.inspector}>
        <div className={css.tabs}>
          {(['monitor', 'members'] as const).map(key => (
            <button key={key} className={`${css.tab} ${tab === key ? css.tabActive : ''}`} onClick={() => { setTab(key) }}>
              {t(`inspector.${key}`)}
            </button>
          ))}
        </div>
        <div className={css.pane}>
          {tab === 'monitor' ? (
            <Monitor room={room} episode={episode} usage={usage} members={members} t={t} />
          ) : null}
          {tab === 'members' ? (
            <Members
              members={members}
              robots={robotsSnapshot.options}
              usage={usage}
              t={t}
              onEdit={(member) => { setEditing(member.id) }}
              onAdd={(robot) => { void addMember(robot) }}
            />
          ) : null}
        </div>
      </aside>

      {settingsOpen && room !== undefined ? (
        <SettingsDrawer
          room={room}
          t={t}
          pickDirectory={props.pickDirectory}
          capabilities={request => props.capabilities(request)}
          onClose={() => { setSettingsOpen(false) }}
          onSave={async (spec) => { await saveSpec(spec) }}
        />
      ) : null}
      {editingMember === undefined || room === undefined ? null : (
        <MemberEditor
          room={room} member={editingMember} t={t}
          onClose={() => { setEditing(undefined) }}
          onSave={async (spec) => { await saveSpec(spec) }}
        />
      )}
      {creating ? (
        <NewRoom
          robots={robotsSnapshot.options}
          t={t}
          onClose={() => { setCreating(false) }}
          onCreate={async spec => await createRoom(spec)}
        />
      ) : null}
      {toast === undefined ? null : <div className={css.toast}>{toast}</div>}
    </div>
  )
}

function Message(props: {
  readonly message: RoomMessage
  memberOf(id: string): RoomMemberSpec | undefined
  readonly labels: ReadonlyMap<string, string>
  readonly t: TranslateNS<typeof NS>
  onApprove(message: RoomMessage, decision: 'approved' | 'rejected'): Promise<void>
  onOpenSession(sessionId: string): void
  readonly guardActive: boolean
  onResume(): Promise<void>
  onRelax(): Promise<void>
  onEnd(): Promise<void>
}): ReactNode {
  const { message, labels, t } = props
  const memberOf = (id: string): RoomMemberSpec | undefined => props.memberOf(id)
  if (message.kind === 'episode') return <div className={css.episode}>{message.text}</div>
  if (message.kind === 'activity') {
    const member = message.author.kind === 'member' ? memberOf(message.author.id) : undefined
    if (member === undefined) return null
    const done = message.activity?.done === true
    const sessionId = message.sessionRef?.sessionId
    return (
      <div className={css.activity}>
        <span className={`${css.pulse} ${done ? css.pulseIdle : ''}`} />
        <b>{member.displayName ?? member.id}</b>
        <span>{done ? t('activity.finished') : t('activity.started')}</span>
        {message.activity?.tools.map(tool => <span key={tool} className={css.chip}>{tool}</span>)}
        {message.usage === undefined ? null : <span className={css.usage}>{tokenText(message.usage)}</span>}
        {sessionId === undefined ? null : (
          <button className={css.link} onClick={() => { props.onOpenSession(sessionId) }}>{t('activity.open')}</button>
        )}
      </div>
    )
  }
  if (message.kind === 'guard') {
    return (
      <div className={`${css.guard} ${props.guardActive ? '' : css.guardMuted}`}>
        <div className={css.guardIcon}>!</div>
        <div>
          <div className={css.guardTitle}>{t('guard.title', { reason: message.guard?.code ?? 'guard' })}</div>
          <div className={css.guardDetail}>{message.guard?.detail ?? message.text}</div>
          <div className={css.guardFacts}>
            {(message.guard?.members ?? []).map(id => <span key={id}>{labels.get(id) ?? id}</span>)}
          </div>
          {props.guardActive ? (
            <div className={css.guardActions}>
              <Button size="sm" variant="primary" onClick={() => { void props.onResume() }}>{t('guard.recover')}</Button>
              <Button size="sm" onClick={() => { void props.onRelax() }}>{t('guard.relax')}</Button>
              <Button size="sm" variant="ghost" onClick={() => { void props.onEnd() }}>{t('guard.end')}</Button>
            </div>
          ) : null}
        </div>
      </div>
    )
  }
  if (message.kind === 'approval' && message.approval !== undefined) {
    const envelope = message.approval.envelope
    const from = labels.get(envelope.from) ?? envelope.from
    const to = envelope.to.map(id => labels.get(id) ?? id).join(', ')
    const decided = message.approval.decision
    return (
      <div className={`${css.approval} ${decided === undefined ? '' : css.approvalDone}`}>
        <div className={css.approvalHead}>
          <b>{t('approval.title', { from, intent: t(intentKey(envelope.intent)), to })}</b>
          <Tag tone={decided === undefined ? 'info' : decided === 'approved' ? 'success' : 'danger'}>
            {decided === undefined ? t('approval.needs') : decided === 'approved' ? t('approval.approved') : t('approval.rejected')}
          </Tag>
        </div>
        <div className={css.approvalTask}>{message.text}</div>
        <div className={css.approvalFoot}>
          <span>{t('approval.grant', { grant: tokenText(envelope.grantTokens), depth: envelope.depth })}</span>
          {decided === undefined ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => { void props.onApprove(message, 'rejected') }}>{t('approval.reject')}</Button>
              <Button size="sm" variant="primary" onClick={() => { void props.onApprove(message, 'approved') }}>{t('approval.approve')}</Button>
            </>
          ) : null}
        </div>
      </div>
    )
  }
  if (message.kind === 'a2a' || message.kind === 'reply') {
    const envelope = message.a2a
    if (envelope === undefined) return null
    const from = labels.get(envelope.from) ?? envelope.from
    const to = envelope.to.map(id => labels.get(id) ?? id).join(', ')
    return (
      <div className={`${css.relay} ${envelope.visibility === 'private' ? css.private : ''}`}>
        <div className={css.relayHead}>
          <span className={css.speaker}>{from}</span>
          <span className={css.arrow}>→</span>
          <span className={css.speaker}>{to}</span>
          <span className={css.intent} data-intent={envelope.intent}>{t(intentKey(envelope.intent))}</span>
          {envelope.visibility === 'private' ? <span className={css.lock}>{t('relay.private')}</span> : null}
          <span className={css.time}>{timeOf(message.at)}</span>
        </div>
        <div className={css.relayBody}>{message.text}</div>
        <div className={css.relayFoot}>
          <span>{t('relay.depth')} {envelope.depth}</span>
          <span>{t('relay.grant')} {tokenText(envelope.grantTokens)}</span>
          <span>{t('relay.expect')} {envelope.expect ?? '—'}</span>
        </div>
      </div>
    )
  }
  const member = message.author.kind === 'member' ? memberOf(message.author.id) : undefined
  if (member === undefined && message.author.kind !== 'human') {
    return <div className={css.system}>{message.text}</div>
  }
  const human = message.author.kind === 'human'
  const name = human ? message.author.name : member?.displayName ?? member?.id ?? ''
  const background = human || member === undefined ? '#3a3d40' : colorOf(member, membersIndex(member, labels))
  const sessionId = message.sessionRef?.sessionId
  const avatar = sessionId === undefined
    ? <span className={css.avatar} style={{ background }}>{initial(name)}</span>
    : (
      <Tooltip label={t('message.openSessionTitle', { name })} side="right" delayMs={400} portal>
        <button
          className={`${css.avatar} ${css.avatarAction}`}
          style={{ background }}
          aria-label={t('message.openSessionTitle', { name })}
          onClick={() => { props.onOpenSession(sessionId) }}
        >
          {initial(name)}
        </button>
      </Tooltip>
    )
  return (
    <div className={`${css.message} ${human ? css.human : ''}`}>
      {avatar}
      <div className={css.messageBody}>
        <div className={css.who}>
          <b>{name}</b>
          {human || member === undefined ? null : <span className={css.role}>{t(roleKey(member.role))}</span>}
          <span className={css.time}>{timeOf(message.at)}</span>
          {sessionId === undefined ? null : (
            <button className={css.link} onClick={() => { props.onOpenSession(sessionId) }}>{t('message.openSession')}</button>
          )}
        </div>
        <div className={css.text}>{message.text}</div>
      </div>
    </div>
  )
}

function membersIndex(member: RoomMemberSpec, labels: ReadonlyMap<string, string>): number {
  return [...labels.keys()].indexOf(member.id)
}

function Monitor(props: {
  readonly room: Room | undefined
  readonly episode: { readonly tokens: number; readonly turns: number; readonly messages: number; readonly depth: number } | undefined
  readonly usage: ReadonlyMap<string, number>
  readonly members: readonly RoomMemberSpec[]
  readonly t: TranslateNS<typeof NS>
}): ReactNode {
  const { room, episode, usage, members, t } = props
  if (room === undefined) return null
  const guard = room.spec.guard
  const breaker = room.state === 'tripped' ? 'open' : 'closed'
  const maxUsage = Math.max(1, ...members.map(member => usage.get(member.id) ?? 0))
  return (
    <>
      <div className={css.card}>
        <div className={css.cardTitle}>{t('monitor.breaker')}</div>
        <div className={css.breaker}>
          <span className={css.lamp} data-state={breaker}>{breaker === 'open' ? '!' : '✓'}</span>
          <div><b>{breaker === 'open' ? t('monitor.open') : t('monitor.closed')}</b><span>{breaker === 'open' ? t('monitor.openHint') : t('monitor.closedHint')}</span></div>
        </div>
      </div>
      <div className={css.card}>
        <div className={css.cardTitle}>{t('monitor.episode')}</div>
        <Gauge label={t('monitor.tokens')} used={episode?.tokens ?? 0} limit={guard.episodeTokens} />
        <Gauge label={t('monitor.turns')} used={episode?.turns ?? 0} limit={guard.episodeTurns} unit="" />
        <Gauge label={t('monitor.messages')} used={episode?.messages ?? 0} limit={guard.episodeMessages} unit="" />
        <div className={css.statGrid}>
          <div className={css.stat}><b>{episode?.depth ?? 0}<small>/{guard.maxDepth}</small></b><span>{t('monitor.depth')}</span></div>
          <div className={css.stat}><b>{room.spec.routing.floor}</b><span>{t('monitor.floor')}</span></div>
          <div className={css.stat}><b>{members.length}</b><span>{t('members.title')}</span></div>
        </div>
      </div>
      <div className={css.card}>
        <div className={css.cardTitle}>{t('monitor.daily')}</div>
        <Gauge label={t('monitor.tokens')} used={[...usage.values()].reduce((sum, value) => sum + value, 0)} limit={room.spec.budget.dailyTokens} />
      </div>
      <div className={css.card}>
        <div className={css.cardTitle}>{t('monitor.usage')}</div>
        {members.map((member, index) => (
          <div key={member.id} className={css.memberUsage}>
            <span className={css.miniAvatar} style={{ background: colorOf(member, index) }}>
              {initial(member.displayName ?? member.id)}
            </span>
            <span className={css.usageName}>{member.displayName ?? member.id}</span>
            <span className={css.bar}><i style={{ width: `${(usage.get(member.id) ?? 0) / maxUsage * 100}%` }} /></span>
            <span className={css.usageNum}>{tokenText(usage.get(member.id) ?? 0)}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function Gauge(props: {
  readonly label: string
  readonly used: number
  readonly limit: number
  readonly unit?: string
}): ReactNode {
  const ratio = props.limit <= 0 ? 0 : Math.min(1, props.used / props.limit)
  const level = ratio >= 1 ? css.hard : ratio >= 0.8 ? css.soft : ''
  return (
    <div className={css.gauge}>
      <div className={css.gaugeRow}><b>{props.label}</b><span>{tokenText(props.used)} / {tokenText(props.limit)}{props.unit ?? ''}</span></div>
      <span className={css.bar}><i className={level} style={{ width: `${ratio * 100}%` }} /></span>
    </div>
  )
}

function Members(props: {
  readonly members: readonly RoomMemberSpec[]
  readonly robots: readonly RoomRobotOption[]
  readonly usage: ReadonlyMap<string, number>
  readonly t: TranslateNS<typeof NS>
  onEdit(member: RoomMemberSpec): void
  onAdd(robot: RoomRobotOption): void
}): ReactNode {
  const [choice, setChoice] = useState('')
  const picked = props.robots.find(robot => `${robot.spec}@${robot.revision}` === choice)
  return (
    <div className={css.card}>
      <div className={css.cardTitle}>{props.t('members.title')}<small>{props.members.length} / 12</small></div>
      {props.members.map((member, index) => (
        <div key={member.id} className={css.memberRow}>
          <span className={css.avatar} style={{ background: colorOf(member, index) }}>{initial(member.displayName ?? member.id)}</span>
          <div className={css.memberMeta}>
            <b>{member.displayName ?? member.id}</b>
            <span>{props.t(roleKey(member.role))} · {props.t(wakeKey(member.wake))} · {tokenText(member.budget.dailyTokens)}</span>
          </div>
          <Button size="sm" onClick={() => { props.onEdit(member) }}>{props.t('members.config')}</Button>
        </div>
      ))}
      {props.members.length >= 12
        ? <p className={css.hint}>{props.t('members.full')}</p>
        : (
          <div className={css.selectRow}>
            <select value={choice} onChange={(event) => { setChoice(event.target.value) }}>
              <option value="">{props.t('members.pick')}</option>
              {props.robots.map(robot => (
                <option key={`${robot.spec}@${robot.revision}`} value={`${robot.spec}@${robot.revision}`}>
                  {robot.name} · {props.t('members.version', { revision: robot.revision })}
                </option>
              ))}
            </select>
            <Button size="sm" disabled={picked === undefined} onClick={() => { if (picked !== undefined) props.onAdd(picked) }}>
              {props.t('members.add')}
            </Button>
          </div>
        )}
    </div>
  )
}

function CapabilityPicker(props: {
  readonly label: string
  readonly options: readonly RobotCapabilityOption[]
  readonly selected: readonly string[]
  onChange(next: readonly string[]): void
}): ReactNode {
  const selected = new Set(props.selected)
  return (
    <div className={css.picker}>
      <div className={css.pickerLabel}>{props.label}</div>
      {props.options.length === 0
        ? <div className={css.pickerEmpty}>—</div>
        : (
          <div className={css.pickerBox}>
            {props.options.map(option => (
              <Checkbox
                key={option.value}
                label={option.label}
                title={option.description ?? option.value}
                checked={selected.has(option.value)}
                onChange={(checked) => {
                  const next = checked
                    ? [...props.selected, option.value]
                    : props.selected.filter(value => value !== option.value)
                  props.onChange(next)
                }}
              />
            ))}
          </div>
        )}
    </div>
  )
}

function SettingsDrawer(props: {
  readonly room: Room
  readonly t: TranslateNS<typeof NS>
  readonly pickDirectory: () => Promise<string | null>
  readonly capabilities: (request: RobotCapabilitiesRequest) => Promise<RemoteResult<RobotCapabilityCatalog>>
  onClose(): void
  onSave(spec: RoomSpec): Promise<void>
}): ReactNode {
  const { room, t } = props
  const [draft, setDraft] = useState<RoomSpec>(room.spec)
  const [section, setSection] = useState<'basic' | 'advanced'>('basic')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string>()
  const [catalog, setCatalog] = useState<RobotCapabilityCatalog>()
  useEffect(() => { setDraft(room.spec) }, [room.revision])
  useEffect(() => {
    let live = true
    void props.capabilities({}).then((result) => {
      if (!live || !result.ok) return
      setCatalog(result.value)
    })
    return () => { live = false }
  }, [props.capabilities])
  const update = (mutate: (spec: Mutable<RoomSpec>) => void): void => {
    const next = structuredClone(draft) as Mutable<RoomSpec>
    mutate(next)
    setDraft(next)
  }
  const number = (label: string, value: number, set: (value: number) => void, unit = ''): ReactNode => (
    <label className={css.field}><span>{label}</span><input type="number" value={value} onChange={(event) => { set(Number(event.target.value)) }} />{unit}</label>
  )
  const review = draft.review ?? { selfReview: true, acceptance: true, maxRounds: 3 }
  const setReview = (mutate: (review: Mutable<NonNullable<RoomSpec['review']>>) => void): void => {
    update((spec) => {
      const next = structuredClone(review) as Mutable<NonNullable<RoomSpec['review']>>
      mutate(next)
      spec.review = next
    })
  }
  const capability = draft.capability ?? {}
  const setCapability = (mutate: (capability: Mutable<NonNullable<RoomSpec['capability']>>) => void): void => {
    update((spec) => {
      const next = structuredClone(capability) as Mutable<NonNullable<RoomSpec['capability']>>
      mutate(next)
      spec.capability = next
    })
  }
  const pick = async (): Promise<void> => {
    try {
      const path = await props.pickDirectory()
      if (path !== null && path.trim() !== '') update((spec) => { spec.workspaceRoot = path.trim() })
    } catch {
      setNotice(t('settings.pickUnavailable'))
    }
  }
  return (
    <div className={css.scrim} onClick={() => { props.onClose() }}>
      <div className={`${css.drawer} ${css.settingsDrawer}`} onClick={(event) => { event.stopPropagation() }}>
        <div className={css.drawerHead}>
          <b>{t('settings.title')}</b>
          <span>{t('settings.subtitle')}</span>
          <button className={css.iconButton} onClick={() => { props.onClose() }}><IconCloseOutlineMedium size={16} /></button>
        </div>
        <div className={css.segRow}>
          <div className={css.seg}>
            {(['basic', 'advanced'] as const).map(key => (
              <button key={key} className={section === key ? css.segOn : ''} onClick={() => { setSection(key) }}>
                {t(`settings.section.${key}`)}
              </button>
            ))}
          </div>
        </div>
        <div className={css.drawerBody}>
          {section === 'basic' ? (
            <>
              <div className={css.group}>
                <h4>{t('settings.routing')}</h4>
                <label className={css.field}><span>{t('settings.humanDefault')}</span>
                  <select
                    value={draft.routing.humanDefault}
                    onChange={(event) => {
                      update((spec) => { spec.routing.humanDefault = event.target.value as RoomSpec['routing']['humanDefault'] })
                    }}
                  >
                    <option value="coordinator">{t('settings.coordinator')}</option>
                    <option value="mentioned">{t('members.wake.mention')}</option>
                    <option value="all-eligible">{t('members.wake.all-human')}</option>
                  </select>
                </label>
                {number(t('settings.maxFanout'), draft.routing.maxFanout, (value) => { update((spec) => { spec.routing.maxFanout = value }) })}
                {number(t('settings.floor'), draft.routing.floor, (value) => { update((spec) => { spec.routing.floor = value }) })}
              </div>
              <div className={css.group}>
                <h4>{t('settings.review')}</h4>
                <Checkbox
                  label={t('settings.selfReview')}
                  checked={review.selfReview}
                  onChange={(value) => { setReview((next) => { next.selfReview = value }) }}
                />
                <Checkbox
                  label={t('settings.acceptance')}
                  checked={review.acceptance}
                  onChange={(value) => { setReview((next) => { next.acceptance = value }) }}
                />
                {number(t('settings.maxRounds'), review.maxRounds, (value) => { setReview((next) => { next.maxRounds = value }) })}
                <p className={css.hint}>{t('settings.reviewHint')}</p>
              </div>
              <div className={css.group}>
                <h4>{t('settings.workspace')}</h4>
                <div className={css.pathRow}>
                  <input
                    value={draft.workspaceRoot ?? ''}
                    placeholder={t('settings.workspacePlaceholder')}
                    onChange={(event) => {
                      update((spec) => {
                        const path = event.target.value.trim()
                        if (path === '') delete spec.workspaceRoot
                        else spec.workspaceRoot = path
                      })
                    }}
                  />
                  <Button size="sm" onClick={() => { void pick() }}>{t('settings.pickDirectory')}</Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={css.group}>
                <h4>{t('settings.guard')}</h4>
                {number(t('settings.maxDepth'), draft.guard.maxDepth, (value) => { update((spec) => { spec.guard.maxDepth = value }) })}
                {number(t('settings.episodeTurns'), draft.guard.episodeTurns, (value) => { update((spec) => { spec.guard.episodeTurns = value }) })}
                {number(t('settings.episodeMessages'), draft.guard.episodeMessages, (value) => { update((spec) => { spec.guard.episodeMessages = value }) })}
                {number(t('settings.episodeTokens'), draft.guard.episodeTokens, (value) => { update((spec) => { spec.guard.episodeTokens = value }) })}
                {number(t('settings.wallClock'), Math.round(draft.guard.wallClockMs / 60_000), (value) => { update((spec) => { spec.guard.wallClockMs = value * 60_000 }) })}
                {number(t('settings.turnTimeout'), Math.round(draft.guard.memberTurnTimeoutMs / 1000), (value) => { update((spec) => { spec.guard.memberTurnTimeoutMs = value * 1000 }) })}
                {number(t('settings.pingPong'), draft.guard.pingPongLimit, (value) => { update((spec) => { spec.guard.pingPongLimit = value }) })}
                {number(t('settings.duplicates'), draft.guard.maxDuplicates, (value) => { update((spec) => { spec.guard.maxDuplicates = value }) })}
                {number(t('settings.noProgress'), draft.guard.noProgressWindow, (value) => { update((spec) => { spec.guard.noProgressWindow = value }) })}
              </div>
              <div className={css.group}>
                <h4>{t('settings.budget')}</h4>
                {number(t('settings.dailyTokens'), Math.round(draft.budget.dailyTokens / 1000), (value) => { update((spec) => { spec.budget.dailyTokens = value * 1000 }) })}
                {number(t('settings.softLimit'), Math.round(draft.budget.softLimitRatio * 100), (value) => { update((spec) => { spec.budget.softLimitRatio = value / 100 }) })}
              </div>
              <div className={css.group}>
                <h4>{t('settings.context')}</h4>
                {number(t('settings.window'), draft.context.window, (value) => { update((spec) => { spec.context.window = value }) })}
                {number(t('settings.messageChars'), draft.context.messageChars, (value) => { update((spec) => { spec.context.messageChars = value }) })}
                {number(t('settings.summaryChars'), draft.context.summaryChars, (value) => { update((spec) => { spec.context.summaryChars = value }) })}
                {number(t('settings.triggerChars'), draft.context.triggerChars, (value) => { update((spec) => { spec.context.triggerChars = value }) })}
              </div>
              <div className={css.group}>
                <h4>{t('settings.capability')}</h4>
                <p className={css.hint}>{t('settings.capabilityHint')}</p>
                <CapabilityPicker
                  label={t('settings.skills')}
                  options={catalog?.skills ?? []}
                  selected={capability.skills ?? []}
                  onChange={(next) => {
                    setCapability((target) => {
                      if (next.length === 0) delete target.skills
                      else target.skills = [...next]
                    })
                  }}
                />
                <CapabilityPicker
                  label={t('settings.mcpServers')}
                  options={catalog?.mcpServers ?? []}
                  selected={capability.mcpServers ?? []}
                  onChange={(next) => {
                    setCapability((target) => {
                      if (next.length === 0) delete target.mcpServers
                      else target.mcpServers = [...next]
                    })
                  }}
                />
                <CapabilityPicker
                  label={t('settings.toolsAllow')}
                  options={catalog?.tools ?? []}
                  selected={capability.tools?.allow ?? []}
                  onChange={(next) => {
                    setCapability((target) => {
                      target.tools = { ...target.tools ?? {}, allow: [...next] }
                    })
                  }}
                />
                <CapabilityPicker
                  label={t('settings.toolsDeny')}
                  options={catalog?.tools ?? []}
                  selected={capability.tools?.deny ?? []}
                  onChange={(next) => {
                    setCapability((target) => {
                      target.tools = { ...target.tools ?? {}, deny: [...next] }
                    })
                  }}
                />
              </div>
            </>
          )}
        </div>
        <div className={css.drawerFoot}>
          <span className={css.hint}>{notice ?? t('settings.footHint')}</span>
          <Button
            variant="primary"
            disabled={saving}
            onClick={() => {
              setSaving(true)
              void props.onSave(draft).finally(() => { setSaving(false) })
            }}
          >
            {saving ? t('settings.saving') : t('settings.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}

function MemberEditor(props: {
  readonly room: Room
  readonly member: RoomMemberSpec
  readonly t: TranslateNS<typeof NS>
  onClose(): void
  onSave(spec: RoomSpec): Promise<void>
}): ReactNode {
  const { room, member, t } = props
  const [draft, setDraft] = useState<RoomMemberSpec>(member)
  const update = (mutate: (member: Mutable<RoomMemberSpec>) => void): void => {
    const next = structuredClone(draft) as Mutable<RoomMemberSpec>
    mutate(next)
    setDraft(next)
  }
  const others = room.spec.members.filter(candidate => candidate.id !== member.id)
  const save = (): void => {
    const next = structuredClone(room.spec) as Mutable<RoomSpec>
    next.members = next.members.map(candidate => candidate.id === draft.id ? draft as Mutable<RoomMemberSpec> : candidate)
    void props.onSave(next)
  }
  return (
    <div className={css.scrim} onClick={() => { props.onClose() }}>
      <div className={css.drawer} onClick={(event) => { event.stopPropagation() }}>
        <div className={css.drawerHead}>
          <b>{t('member.edit.title', { name: member.displayName ?? member.id })}</b>
          <span>{t('member.edit.subtitle')}</span>
          <button className={css.iconButton} onClick={() => { props.onClose() }}><IconCloseOutlineMedium size={16} /></button>
        </div>
        <div className={css.drawerBody}>
          <div className={css.group}>
            <h4>{t('member.edit.identity')}</h4>
            <label className={css.field}><span>{t('member.edit.name')}</span><input value={draft.displayName ?? ''} onChange={(event) => { update((next) => { next.displayName = event.target.value }) }} /></label>
            <div className={css.swatches}>
              {COLORS.map(color => (
                <button key={color} className={`${css.swatch} ${draft.color === color ? css.swatchOn : ''}`} style={{ background: color }} onClick={() => { update((next) => { next.color = color }) }} />
              ))}
            </div>
          </div>
          <div className={css.group}>
            <h4>{t('members.role')}</h4>
            <div className={css.seg}>
              {(['coordinator', 'worker', 'reviewer', 'observer'] as const).map(role => (
                <button key={role} className={draft.role === role ? css.segOn : ''} onClick={() => { update((next) => { next.role = role }) }}>{t(roleKey(role))}</button>
              ))}
            </div>
            {draft.role === 'observer' ? <p className={css.hint}>{t('member.edit.observerHint')}</p> : null}
          </div>
          <div className={css.group}>
            <h4>{t('member.edit.wake')}</h4>
            <div className={css.seg}>
              {(['mention', 'keywords', 'all-human'] as const).map(kind => (
                <button key={kind} className={draft.wake.kind === kind ? css.segOn : ''} onClick={() => { update((next) => { next.wake = kind === 'keywords' ? { kind, keywords: [] } : { kind } }) }}>{t(wakeKey({ kind } as WakeRule))}</button>
              ))}
            </div>
          </div>
          <div className={css.group}>
            <h4>{t('member.edit.canAddress')}</h4>
            <div className={css.checks}>
              {others.map(other => (
                <label key={other.id} className={css.check}>
                  <input
                    type="checkbox"
                    checked={draft.a2a.canAddress === '*' || draft.a2a.canAddress.includes(other.id)}
                    onChange={(event) => {
                      update((next) => {
                        const current = next.a2a.canAddress === '*' ? others.map(candidate => candidate.id) : [...next.a2a.canAddress]
                        next.a2a = {
                          ...next.a2a,
                          canAddress: event.target.checked
                            ? [...current, other.id]
                            : current.filter(id => id !== other.id),
                        }
                      })
                    }}
                  />
                  {other.displayName ?? other.id}
                </label>
              ))}
            </div>
          </div>
          <div className={css.group}>
            <h4>{t('member.edit.requiresApproval')}</h4>
            <div className={css.checks}>
              {others.map(other => (
                <label key={other.id} className={css.check}>
                  <input
                    type="checkbox"
                    checked={draft.a2a.requiresApproval.includes(other.id)}
                    onChange={(event) => {
                      update((next) => {
                        next.a2a = {
                          ...next.a2a,
                          requiresApproval: event.target.checked
                            ? [...next.a2a.requiresApproval, other.id]
                            : next.a2a.requiresApproval.filter(id => id !== other.id),
                        }
                      })
                    }}
                  />
                  {other.displayName ?? other.id}
                </label>
              ))}
            </div>
          </div>
          <div className={css.group}>
            <h4>{t('member.edit.budget')}</h4>
            <label className={css.field}><span>{t('member.edit.turnIn')}</span><input type="number" value={Math.round(draft.budget.turnInputTokens / 1000)} onChange={(event) => { update((next) => { next.budget = { ...next.budget, turnInputTokens: Number(event.target.value) * 1000 } }) }} /></label>
            <label className={css.field}><span>{t('member.edit.turnOut')}</span><input type="number" value={Math.round(draft.budget.turnOutputTokens / 1000)} onChange={(event) => { update((next) => { next.budget = { ...next.budget, turnOutputTokens: Number(event.target.value) * 1000 } }) }} /></label>
            <label className={css.field}><span>{t('member.edit.daily')}</span><input type="number" value={Math.round(draft.budget.dailyTokens / 1000)} onChange={(event) => { update((next) => { next.budget = { ...next.budget, dailyTokens: Number(event.target.value) * 1000 } }) }} /></label>
          </div>
        </div>
        <div className={css.drawerFoot}>
          <Button variant="ghost" onClick={() => { props.onClose() }}>{t('member.edit.cancel')}</Button>
          <Button variant="primary" onClick={save}>{t('member.edit.save')}</Button>
        </div>
      </div>
    </div>
  )
}

function NewRoom(props: {
  readonly robots: readonly RoomRobotOption[]
  readonly t: TranslateNS<typeof NS>
  onClose(): void
  onCreate(spec: RoomSpec): Promise<boolean>
}): ReactNode {
  const { robots, t } = props
  const [name, setName] = useState('')
  const [charter, setCharter] = useState(t('new.defaultCharter'))
  const [chosen, setChosen] = useState<readonly string[]>([])
  const [saving, setSaving] = useState(false)
  const create = async (): Promise<void> => {
    const picked = chosen.flatMap((value) => {
      const robot = robots.find(candidate => `${candidate.spec}@${candidate.revision}` === value)
      return robot === undefined ? [] : [robot]
    })
    if (picked.length < 2) return
    setSaving(true)
    const members = picked.map((robot, index): RoomMemberSpec => ({
      id: `member-${index + 1}` as RoomMemberId,
      robot: { spec: robot.spec, revision: robot.revision },
      displayName: robot.name,
      role: index === 0 ? 'coordinator' : 'worker',
      wake: { kind: index === 0 ? 'all-human' : 'mention' },
      a2a: { canAddress: '*', accepts: ['request', 'delegate', 'handoff', 'reply'], requiresApproval: [] },
      budget: { turnInputTokens: 48_000, turnOutputTokens: 6_000, dailyTokens: 600_000 },
      enabled: true,
    }))
    const coordinator = members[0]?.id
    if (coordinator === undefined) return
    const spec: RoomSpec = {
      name: name.trim() === '' ? t('new.title') : name.trim(),
      charter: charter.trim(),
      members,
      routing: { humanDefault: 'coordinator', coordinator, maxFanout: Math.min(3, members.length - 1), floor: 1 },
      guard: {
        maxDepth: 4, episodeTurns: 12, episodeMessages: 40, episodeTokens: 250_000, wallClockMs: 20 * 60 * 1000,
        memberTurnTimeoutMs: 2 * 60 * 1000,
        memberTurnsPerMinute: 6, memberBurst: 3, maxPendingPerMember: 3, maxDuplicates: 2, pingPongLimit: 4,
        noProgressWindow: 3, noProgressSimilarity: 0.85,
      },
      budget: { dailyTokens: 3_000_000, softLimitRatio: 0.8 },
      context: { window: 20, messageChars: 1500, summaryChars: 1200, triggerChars: 6000 },
    }
    await props.onCreate(spec).finally(() => { setSaving(false) })
  }
  return (
    <div className={css.scrim} onClick={() => { props.onClose() }}>
      <div className={css.modal} onClick={(event) => { event.stopPropagation() }}>
        <div className={css.drawerHead}>
          <b>{t('new.title')}</b>
          <button className={css.iconButton} onClick={() => { props.onClose() }}><IconCloseOutlineMedium size={16} /></button>
        </div>
        <div className={css.drawerBody}>
          <label className={css.field}><span>{t('new.name')}</span><input value={name} onChange={(event) => { setName(event.target.value) }} /></label>
          <label className={css.field}><span>{t('new.charter')}</span><textarea value={charter} onChange={(event) => { setCharter(event.target.value) }} /></label>
          <div className={css.group}>
            <h4>{t('new.members')}</h4>
            {robots.length === 0
              ? <p className={css.hint}>{t('new.emptyRoster')}</p>
              : robots.map((robot) => {
                const value = `${robot.spec}@${robot.revision}`
                const index = chosen.indexOf(value)
                return (
                  <label key={value} className={css.robotRow}>
                    <input
                      type="checkbox"
                      checked={index >= 0}
                      onChange={(event) => {
                        setChosen(current => event.target.checked ? [...current, value] : current.filter(item => item !== value))
                      }}
                    />
                    <span className={css.botAvatar}>{initial(robot.name)}</span>
                    <span><b>{robot.name}</b><small>{robot.mission}</small></span>
                  </label>
                )
              })}
          </div>
          {chosen.length > 0 && chosen.length < 2 ? <p className={css.hint}>{t('new.needTwo')}</p> : null}
        </div>
        <div className={css.drawerFoot}>
          <Button variant="ghost" onClick={() => { props.onClose() }}>{t('new.cancel')}</Button>
          <Button variant="primary" disabled={chosen.length < 2 || saving} onClick={() => { void create() }}>{saving ? t('common.saving') : t('new.create')}</Button>
        </div>
      </div>
    </div>
  )
}
