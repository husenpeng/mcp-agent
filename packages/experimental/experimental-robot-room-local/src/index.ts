/**
 * Storage-backed provider for the `ctx.rooms` service: durable group
 * conversations, one visible log, asynchronous A2A admission, a bounded wake
 * scheduler, and one persistent Agent Session per member.
 * @module @tomato/experimental-robot-room-local
 */

import { randomUUID } from 'node:crypto'
import type { Agent, AgentHandle } from '@tomato/agent'
import type {} from '@tomato/agent-default-model'
import { brandString } from '@tomato/branded'
import type { Context } from '@tomato/cordis'
import {
  Rooms, RoomGuard, buildMemberInput, createEnvelopeV2, estimateTokens, grantFor, preflight,
  reviewSpecOf, routeHuman, validateRoomSpec, visibleTo,
} from '@tomato/experimental-robot-room'
import type {
  A2aEnvelopeV2, A2aIntent, AdmissionBudgets, MemberInput, Room, RoomApproval, RoomEpisode, RoomEpisodeId, RoomId,
  RoomMemberId, RoomMemberSpec, RoomMessage, RoomMessageId, RoomPost, RoomSpec, RoomWorkRecord, WakeReason,
} from '@tomato/experimental-robot-room'
import { createUserMessage } from '@tomato/llm'
import {
  assign as startAssignment, latestAssignment, recordReview, report as recordAssignmentReport,
} from '@tomato/superagent'
import type { Assignment, AssignmentReport, Ticket } from '@tomato/superagent'
import type { ReasoningEffortId } from '@tomato/llm/brand'
import type { RobotSpecId } from '@tomato/experimental-robot'
import type { SessionEvent } from '@tomato/session'
import type {} from '@tomato/skill'
import { Service } from '@tomato/cordis'
import z from '@tomato/schemastery'
import {
  approvalRowOf, episodeRowOf, guardRowOf, memberSessionOf, messageOf, roomDomain, roomOf, roomRowOf, withMemberSession,
} from './storage.ts'
import type { RoomRow, RoomStore } from './storage.ts'
import { acceptanceInstruction, memberCharter, reworkInstruction, selfReviewInstruction } from './prompt.ts'
import { summarizeWithModel } from './summary.ts'
import { registerRoomTools } from './tools.ts'
import type { RoomToolHost, RoomToolResult } from './tools.ts'
import { createRoomWorkStore, openRoomTicket, parseSelfReview, reportForTurn, workRecordOf } from './work.ts'
import type { RoomWorkStore, SelfReview } from './work.ts'

/** Deployment limits for room execution. */
export interface Config {
  /** Most members one room may run at the same time. */
  readonly maxConcurrentMembers?: number
}

const DEFAULT_MAX_CONCURRENT = 4

const now = (): number => Date.now()
const messageKey = (room: RoomId, seq: number): string => `${room}:${String(seq).padStart(12, '0')}`
const readKey = (room: RoomId, member: RoomMemberId): string => `${room}:${member}`

/** One member turn's Session reference recorded on the messages it produced. */
type MemberSessionRef = NonNullable<RoomMessage['sessionRef']>

/** One queued member wake. */
interface Wake {
  readonly room: RoomId
  readonly member: RoomMemberId
  readonly reason: WakeReason
}

/** One built member input and its decision. */
interface PreparedWake {
  readonly input: MemberInput
  readonly member: RoomMemberSpec
}

/** Capability one room member runs under after narrowing the robot's own lists. */
interface MemberCapability {
  readonly tools?: { readonly allow: readonly string[]; readonly deny: readonly string[] }
  readonly skills: readonly string[]
  readonly permissionPreset?: string
}

/** Prefix one MCP tool name carries for its server. */
const MCP_TOOL_PREFIX = 'mcp__'

/** The ticket one member wake owns and the assignment its current round runs as. */
interface MemberWork {
  readonly ticket: Ticket
  readonly session: string
  readonly directory: string
  assignment: Assignment
}

/**
 * Storage-backed room provider. Load it after a storage backend and
 * `@tomato/storage-domain`; it registers as `ctx.rooms`, opens the durable
 * `tomato_room` domain, and creates member Agents on demand.
 */
export default class LocalRooms extends Rooms {
  static inject = ['storageDomain']

  static Config: z<Config> = z.object({
    maxConcurrentMembers: z.number().step(1).min(1).default(DEFAULT_MAX_CONCURRENT),
  })

  /** Validated execution limits. */
  private readonly maxConcurrent: number
  private domain!: RoomStore
  private workStore!: RoomWorkStore
  private chain: Promise<unknown> = Promise.resolve()
  private readonly guards = new Map<RoomId, RoomGuard>()
  private readonly queues = new Map<RoomId, Wake[]>()
  private readonly running = new Map<RoomId, Set<RoomMemberId>>()
  private readonly pumping = new Set<RoomId>()
  private disposed = false
  private readonly summaries = new Map<string, { readonly upto: number; readonly text: string }>()
  private readonly currentTurns = new Map<string, MemberSessionRef>()
  private readonly outbound = new Map<string, (() => Promise<void>)[]>()

  constructor(ctx: Context, config: Config = {}) {
    super(ctx)
    this.maxConcurrent = Math.max(1, Math.floor(config.maxConcurrentMembers ?? DEFAULT_MAX_CONCURRENT))
  }

  protected async [Service.init](): Promise<void> {
    this.domain = await this.ctx.storageDomain.open(roomDomain)
    this.workStore = await createRoomWorkStore(this.ctx)
    this.ctx.effect(() => async () => {
      this.disposed = true
      await this.workStore.close()
      await this.domain.close()
    }, 'robot-room-local: close storage domains')
    // A restart never replays a robot chain: open episodes become interrupted and
    // an open breaker keeps the room tripped until an operator resumes it.
    for (const [, row] of this.rooms.entries()) {
      const guard = this.guard(row)
      if (guard.snapshot().breaker === 'open' && row.state === 'active') {
        row.state = 'tripped'
        await this.rooms.put(row.id, row)
      }
      if (row.activeEpisode !== undefined) {
        const episode = this.episodes.get(row.activeEpisode)
        if (episode !== undefined && episode.ended === undefined) {
          episode.ended = { at: now(), reason: 'interrupted' }
          await this.episodes.put(episode.id, episode)
        }
        delete row.activeEpisode
        await this.rooms.put(row.id, row)
      }
    }
  }

  /** Rooms in creation order. */
  list(): Promise<readonly Room[]> {
    return Promise.resolve([...this.rooms.entries()]
      .map(([, row]) => roomOf(row))
      .sort((left, right) => left.createdAt - right.createdAt))
  }

  /** One room. */
  room(id: RoomId): Promise<Room | undefined> {
    const row = this.rooms.get(id)
    return Promise.resolve(row === undefined ? undefined : roomOf(row))
  }

  /** Publish a new room or a new revision. */
  async publish(id: RoomId | undefined, spec: RoomSpec): Promise<Room> {
    const issues = validateRoomSpec(spec)
    if (issues.length > 0) {
      const detail = issues.map(issue => `${issue.path}: ${issue.message}`).join('; ')
      throw new Error(`invalid room specification: ${detail}`)
    }
    return await this.serialized(async () => {
      const at = now()
      const current = id === undefined ? undefined : this.rooms.get(id)
      const roomId = id ?? brandString<RoomId>(`room-${randomUUID()}`)
      const revision = current === undefined ? 1 : current.revision + 1
      const room: Room = Object.freeze({
        id: roomId,
        spec,
        revision,
        state: current?.state ?? 'active',
        createdAt: current?.createdAt ?? at,
        updatedAt: at,
      })
      await this.rooms.put(roomId, roomRowOf(room, current?.nextSeq ?? 1, current?.episodeNumber ?? 0, current?.activeEpisode))
      await this.revisions.put(`${roomId}@${revision}`, { room: roomId, revision, spec, savedAt: at })
      this.guards.delete(roomId)
      this.ctx.emit('room/changed', roomId)
      return room
    })
  }

  /** Record one human message and schedule its wakes. */
  async post(input: RoomPost): Promise<RoomMessage> {
    return await this.serialized(async () => {
      const row = this.require(input.room)
      if (row.state === 'archived') throw new Error(`room "${input.room}" is archived`)
      const episode = await this.ensureEpisode(row, undefined)
      const message = await this.append(row, episode, {
        author: { kind: 'human', id: input.author.id, name: input.author.name },
        kind: 'chat',
        text: input.text,
        mentions: input.mentions ?? [],
        depth: 0,
      })
      const route = routeHuman(row.spec, { text: input.text, mentions: input.mentions ?? [] })
      for (const target of route.targets) this.enqueue(input.room, target, {
        kind: 'human', detail: `human message #${message.seq} (${route.reason})`, messageSeqs: [message.seq],
      })
      this.ctx.emit('room/changed', input.room)
      return message
    })
  }

  /**
   * Read room messages in sequence order.
   * @param id - room identity.
   * @param afterSeq - read messages after this sequence.
   * @param limit - maximum messages to return.
   * @returns messages; a member message recorded before its turn was tracked still
   *   carries the member's stable Session and turn 0.
   */
  messages(id: RoomId, afterSeq = 0, limit = 200): Promise<readonly RoomMessage[]> {
    return Promise.resolve(this.messagesFor(id)
      .filter(message => message.seq > afterSeq)
      .slice(0, Math.max(1, Math.min(500, limit)))
      .map(message => withMemberSession(id, message)))
  }

  /** Work records one room produced, oldest first. */
  work(id: RoomId): Promise<readonly RoomWorkRecord[]> {
    const records: RoomWorkRecord[] = []
    for (const [ticketId, seat] of this.workStore.seats()) {
      if (seat.room !== id) continue
      const entry = this.workStore.ticket(ticketId)
      if (entry === undefined) continue
      records.push(workRecordOf(entry, seat))
    }
    return Promise.resolve(records.sort((left, right) => left.at - right.at))
  }

  /** Pause or resume a room. */
  async pause(id: RoomId, paused: boolean): Promise<Room> {
    return await this.serialized(async () => {
      const row = this.require(id)
      row.state = paused ? 'paused' : 'active'
      row.updatedAt = now()
      await this.rooms.put(id, row)
      this.ctx.emit('room/changed', id)
      return roomOf(row)
    })
  }

  /** Resume a tripped room; the breaker enters half-open. */
  async resume(id: RoomId): Promise<Room> {
    const room = await this.serialized(async () => {
      const row = this.require(id)
      row.state = 'active'
      row.updatedAt = now()
      await this.rooms.put(id, row)
      this.guard(row).resume()
      await this.saveGuard(row)
      this.ctx.emit('room/changed', id)
      return roomOf(row)
    })
    void this.pump(id)
    return room
  }

  /** Raise the current episode's limits by 50% once. */
  async relaxOnce(id: RoomId): Promise<Room> {
    const room = await this.serialized(async () => {
      const row = this.require(id)
      this.guard(row).relaxOnce()
      await this.saveGuard(row)
      row.state = 'active'
      row.updatedAt = now()
      await this.rooms.put(id, row)
      this.ctx.emit('room/changed', id)
      return roomOf(row)
    })
    void this.pump(id)
    return room
  }

  /** End the current episode and close the breaker. */
  async endEpisode(id: RoomId): Promise<Room> {
    return await this.serialized(async () => {
      const row = this.require(id)
      if (row.activeEpisode !== undefined) {
        const episode = this.episodes.get(row.activeEpisode)
        if (episode !== undefined && episode.ended === undefined) {
          episode.ended = { at: now(), reason: 'completed' }
          await this.episodes.put(episode.id, episode)
        }
      }
      delete row.activeEpisode
      row.state = 'active'
      row.updatedAt = now()
      await this.rooms.put(id, row)
      this.queues.set(id, [])
      this.ctx.emit('room/changed', id)
      return roomOf(row)
    })
  }

  /** Decide one pending approval. */
  async approve(id: RoomId, approval: string, decision: 'approved' | 'rejected'): Promise<Room> {
    return await this.serialized(async () => {
      const row = this.require(id)
      const stored = this.approvals.get(`${id}:${approval}`)
      if (stored === undefined) throw new Error(`unknown approval "${approval}"`)
      stored.decision = decision
      await this.approvals.put(`${id}:${approval}`, stored)
      if (decision === 'approved') {
        const envelope = stored.envelope as A2aEnvelopeV2
        await this.emitEnvelope(row, envelope)
      } else {
        const envelope = stored.envelope as A2aEnvelopeV2
        await this.append(row, await this.currentEpisode(row), {
          author: { kind: 'system' }, kind: 'chat', text: `approval ${approval} was rejected`, mentions: [], depth: envelope.depth,
        })
      }
      row.updatedAt = now()
      await this.rooms.put(id, row)
      this.ctx.emit('room/changed', id)
      return roomOf(row)
    })
  }

  private get rooms() { return this.domain.table('rooms') }
  private get revisions() { return this.domain.table('revisions') }
  private get messageTable() { return this.domain.table('messages') }
  private get episodes() { return this.domain.table('episodes') }
  private get approvals() { return this.domain.table('approvals') }
  private get guardTable() { return this.domain.table('guards') }
  private get reads() { return this.domain.table('reads') }

  private serialized<T>(work: () => Promise<T>): Promise<T> {
    const result = this.chain.then(work)
    this.chain = result.then(() => undefined, () => undefined)
    return result
  }

  private require(id: RoomId): RoomRow {
    const row = this.rooms.get(id)
    if (row === undefined) throw new Error(`unknown room "${id}"`)
    return row
  }

  private guard(row: RoomRow): RoomGuard {
    const existing = this.guards.get(row.id)
    if (existing !== undefined) return existing
    const guard = new RoomGuard(row.spec)
    const stored = this.guardTable.get(row.id)
    if (stored !== undefined) {
      guard.restore({
        snapshot: {
          breaker: stored.breaker,
          ...stored.reason === undefined ? {} : { reason: stored.reason },
          turns: stored.turns,
          messages: stored.messages,
          tokens: stored.tokens,
          depth: stored.depth,
          elapsedMs: 0,
        },
        startedAt: stored.startedAt,
        signatures: new Map(Object.entries(stored.signatures)),
        pairs: new Map(Object.entries(stored.pairs).map(([key, pair]) => [key, {
          alternations: pair.alternations,
          ...pair.brokenUntil === undefined ? {} : { brokenUntil: pair.brokenUntil },
        }])),
        pending: new Map(Object.entries(stored.pending) as [RoomMemberId, number][]),
      })
    }
    this.guards.set(row.id, guard)
    return guard
  }

  private async saveGuard(row: RoomRow): Promise<void> {
    const state = this.guard(row).export()
    await this.guardTable.put(row.id, guardRowOf({
      room: row.id,
      snapshot: state.snapshot,
      signatures: state.signatures,
      pairs: state.pairs,
      pending: state.pending,
      startedAt: state.startedAt,
    }))
  }

  private async ensureEpisode(row: RoomRow, startedBy: RoomMessageId | undefined): Promise<RoomEpisodeId> {
    if (row.activeEpisode !== undefined) {
      const episode = this.episodes.get(row.activeEpisode)
      if (episode !== undefined && episode.ended === undefined) return episode.id
    }
    const number = row.episodeNumber + 1
    const id = brandString<RoomEpisodeId>(`episode-${row.id}-${number}`)
    const at = now()
    const episode: RoomEpisode = {
      id, room: row.id, startedBy: startedBy ?? brandString<RoomMessageId>(`episode-${number}`),
      startedAt: at, turns: 0, messages: 0, tokens: 0, depth: 0,
    }
    await this.episodes.put(id, episodeRowOf(episode))
    row.episodeNumber = number
    row.activeEpisode = id
    await this.rooms.put(row.id, row)
    this.guard(row).beginEpisode(at)
    return id
  }

  private async currentEpisode(row: RoomRow): Promise<RoomEpisodeId> {
    return row.activeEpisode ?? await this.ensureEpisode(row, undefined)
  }

  private async append(row: RoomRow, episode: RoomEpisodeId, input: {
    readonly author: RoomMessage['author']
    readonly kind: RoomMessage['kind']
    readonly text: string
    readonly mentions: readonly RoomMemberId[]
    readonly depth: number
    readonly a2a?: A2aEnvelopeV2
    readonly activity?: RoomMessage['activity']
    readonly guard?: RoomMessage['guard']
    readonly approval?: RoomMessage['approval']
    readonly usage?: number
    readonly causedBy?: RoomMessageId
    readonly sessionRef?: RoomMessage['sessionRef'] | undefined
  }): Promise<RoomMessage> {
    const seq = row.nextSeq
    const at = now()
    const message: RoomMessage = Object.freeze({
      id: brandString<RoomMessageId>(`${row.id}-${seq}`),
      room: row.id,
      seq,
      episode,
      author: input.author,
      kind: input.kind,
      text: input.text,
      mentions: [...input.mentions],
      ...input.a2a === undefined ? {} : { a2a: input.a2a },
      ...input.activity === undefined ? {} : { activity: input.activity },
      ...input.guard === undefined ? {} : { guard: input.guard },
      ...input.approval === undefined ? {} : { approval: input.approval },
      ...input.usage === undefined ? {} : { usage: input.usage },
      ...input.causedBy === undefined ? {} : { causedBy: input.causedBy },
      ...input.sessionRef === undefined ? {} : { sessionRef: input.sessionRef },
      depth: input.depth,
      at,
    })
    await this.messageTable.put(messageKey(row.id, seq), messageOf(message))
    row.nextSeq = seq + 1
    row.updatedAt = at
    await this.rooms.put(row.id, row)
    const stored = this.episodes.get(episode)
    if (stored !== undefined) {
      stored.messages += 1
      stored.depth = Math.max(stored.depth, input.depth)
      await this.episodes.put(episode, stored)
    }
    return message
  }

  private enqueue(room: RoomId, member: RoomMemberId, reason: WakeReason): void {
    const row = this.rooms.get(room)
    if (row === undefined || row.state === 'archived') return
    const spec = row.spec.members.find(candidate => candidate.id === member)
    if (spec === undefined || !spec.enabled || spec.role === 'observer') return
    const queue = this.queues.get(room) ?? []
    if (!queue.some(wake => wake.member === member)) queue.push({ room, member, reason })
    else {
      const index = queue.findIndex(wake => wake.member === member)
      queue[index] = { room, member, reason }
    }
    this.queues.set(room, queue)
    void this.pump(room)
  }

  private isDisposed(): boolean { return this.disposed }

  private async pump(room: RoomId): Promise<void> {
    if (this.isDisposed() || this.pumping.has(room)) return
    this.pumping.add(room)
    try {
      for (;;) {
        const row = this.rooms.get(room)
        if (row === undefined || row.state !== 'active') return
        const queue = this.queues.get(room) ?? []
        const running = this.running.get(room) ?? new Set<RoomMemberId>()
        if (queue.length === 0) return
        if (running.size >= Math.max(1, Math.min(this.maxConcurrent, row.spec.routing.floor))) return
        const wake = queue.shift()
        if (wake === undefined) return
        this.queues.set(room, queue)
        running.add(wake.member)
        this.running.set(room, running)
        try {
          await this.deliver(row, wake)
        } catch (error) {
          if (this.isDisposed()) return
          const detail = error instanceof Error ? error.message : String(error)
          await this.append(row, await this.currentEpisode(row), {
            author: { kind: 'system' },
            kind: 'guard',
            text: `member turn failed: ${detail}`,
            mentions: [wake.member],
            depth: 0,
            guard: { code: 'preflight', detail, members: [wake.member] },
          })
        } finally {
          running.delete(wake.member)
          this.running.set(room, running)
        }
      }
    } finally {
      this.pumping.delete(room)
    }
  }

  private async settles(agent: Agent, timeoutMs: number): Promise<boolean> {
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      return await Promise.race([
        agent.whenIdle().then(() => true),
        new Promise<boolean>((resolve) => { timer = setTimeout(() => { resolve(false) }, timeoutMs) }),
      ])
    } finally {
      if (timer !== undefined) clearTimeout(timer)
    }
  }

  private async deliver(row: RoomRow, wake: Wake): Promise<void> {
    const guard = this.guard(row)
    const check = guard.check()
    if (check !== undefined) { await this.trip(row, check.reason, check.detail); return }
    const member = row.spec.members.find(candidate => candidate.id === wake.member)
    if (member === undefined) return
    const prepared = await this.prepare(row, member, wake.reason)
    if (prepared === undefined) return
    const agent = await this.memberAgent(row, member)
    const sessionRef: MemberSessionRef = {
      sessionId: agent.session.id,
      turn: (this.ctx.get('agents')?.turnBoundaryOf(agent.session).lastTurn ?? 0) + 1,
    }
    const started = await this.append(row, await this.currentEpisode(row), {
      author: { kind: 'member', id: member.id }, kind: 'activity',
      text: wake.reason.detail, mentions: [], depth: 0,
      activity: { label: 'started', tools: [], done: false },
      sessionRef,
    })
    this.currentTurns.set(readKey(row.id, member.id), sessionRef)
    const reviewSpec = reviewSpecOf(row.spec)
    const work = this.openWork(row, member, wake, agent)
    let usage = 0
    let output = ''
    let round = 1
    let delivered = false
    try {
      let input = prepared.input.text
      for (;;) {
        const turn = await this.runMemberTurn(agent, input, row.spec.guard.memberTurnTimeoutMs)
        usage += turn.usage
        output = turn.text
        if (turn.timedOut) {
          agent.cancel({ kind: 'user' })
          await this.trip(row, 'storm', `member turn did not settle within ${row.spec.guard.memberTurnTimeoutMs}ms`)
          return
        }
        let review: SelfReview = { passed: true, parsed: true, findings: [] }
        if (reviewSpec.selfReview) {
          const reviewTurn = await this.runMemberTurn(agent, selfReviewInstruction(), row.spec.guard.memberTurnTimeoutMs)
          usage += reviewTurn.usage
          if (reviewTurn.timedOut) {
            agent.cancel({ kind: 'user' })
            await this.trip(row, 'storm', `member self-review did not settle within ${row.spec.guard.memberTurnTimeoutMs}ms`)
            return
          }
          review = parseSelfReview(reviewTurn.text)
        }
        const report = reportForTurn({ text: output, review })
        await this.recordWork(work, report)
        if (report.state === 'ready') {
          delivered = true
          await this.flushOutbound(row, member)
          await this.appendSystem(row, reviewSpec.selfReview
            ? `self-review passed in round ${String(round)}`
            : 'result accepted without self-review')
          if (reviewSpec.acceptance) {
            const verdict = await this.acceptThread(row, work, reviewSpec.maxRounds)
            if (verdict.kind === 'rework') {
              input = reworkInstruction(verdict.findings)
              work.assignment = this.startWorkRound(work)
              round = 1
              continue
            }
          }
          break
        }
        if (round >= reviewSpec.maxRounds) {
          await this.appendSystem(
            row,
            `self-review did not pass after ${String(round)} rounds; the task waits for the operator`,
          )
          break
        }
        round += 1
        await this.appendSystem(row, `self-review failed; rework round ${String(round)}`)
        input = reworkInstruction(review.findings)
        work.assignment = this.startWorkRound(work)
      }
    } finally {
      this.currentTurns.delete(readKey(row.id, member.id))
      if (!delivered) await this.dropOutbound(row, member)
    }
    await this.reads.put(readKey(row.id, member.id), { room: row.id, member: member.id, seq: prepared.input.toSeq })
    const trip = guard.recordTurn({ member: member.id, tokens: usage, output })
    await this.append(row, await this.currentEpisode(row), {
      author: { kind: 'member', id: member.id }, kind: 'activity',
      text: 'finished', mentions: [], depth: 0, usage,
      activity: { label: 'finished', tools: [], done: true, tokens: usage },
      sessionRef,
    })
    this.ctx.emit('room/changed', row.id)
    await this.saveGuard(row)
    if (trip !== undefined) await this.trip(row, trip.reason, trip.detail)
    else { guard.settle(); await this.saveGuard(row) }
    void started
  }

  /**
   * Ask the room's reviewer member to accept a finished request.
   * @param row - room row.
   * @param work - the ticket whose thread finished.
   * @param maxRounds - acceptance rounds the room allows.
   * @returns what happened: skipped, waiting, escalated, passed, or rework with findings.
   */
  private async acceptThread(row: RoomRow, work: MemberWork, maxRounds: number): Promise<
  { readonly kind: 'skipped' | 'waiting' | 'escalated' | 'passed' }
  | { readonly kind: 'rework'; readonly findings: readonly string[] }
  > {
    const thread = work.ticket.follows[0]
    if (thread === undefined) return { kind: 'skipped' }
    const tickets = this.workStore.tickets().filter(entry =>
      entry.ticket.follows.some(follow => follow.source === thread.source && follow.id === thread.id))
    const complete = tickets.every(entry => latestAssignment(entry.ticket)?.report?.state === 'ready')
    if (!complete) return { kind: 'skipped' }
    const reviewer = row.spec.members.find(candidate => candidate.role === 'reviewer' && candidate.enabled)
    if (reviewer === undefined) {
      await this.appendSystem(row, 'the request is ready; acceptance waits for a reviewer member')
      return { kind: 'waiting' }
    }
    const current = this.workStore.ticket(work.ticket.id)?.ticket ?? work.ticket
    const rounds = current.review?.rounds ?? 0
    if (rounds >= maxRounds) {
      await this.appendSystem(row, `acceptance did not pass after ${String(maxRounds)} rounds; the task waits for the operator`)
      return { kind: 'escalated' }
    }
    const agent = await this.memberAgent(row, reviewer)
    const results = tickets.map(entry => latestAssignment(entry.ticket)?.report?.summary ?? '')
    const turn = await this.runMemberTurn(agent, acceptanceInstruction(current.subject, results), row.spec.guard.memberTurnTimeoutMs)
    if (turn.timedOut) {
      agent.cancel({ kind: 'user' })
      await this.trip(row, 'storm', `reviewer turn did not settle within ${row.spec.guard.memberTurnTimeoutMs}ms`)
      return { kind: 'escalated' }
    }
    const verdict = parseSelfReview(turn.text)
    recordReview(this.workStore, work.ticket.id, {
      findings: verdict.findings.map(summary => ({ summary, severity: 'p0' as const, file: '(room)' })),
      rounds: rounds + 1,
    })
    await this.workStore.flush()
    if (verdict.passed) {
      const seq = thread.id.split('#')[1] ?? ''
      await this.appendSystem(row, `acceptance passed for request #${seq}`)
      return { kind: 'passed' }
    }
    if (rounds + 1 >= maxRounds) {
      await this.appendSystem(row, `acceptance did not pass after ${String(maxRounds)} rounds; the task waits for the operator`)
      return { kind: 'escalated' }
    }
    await this.appendSystem(row, `acceptance failed; rework round ${String(rounds + 2)}`)
    return { kind: 'rework', findings: verdict.findings }
  }

  /**
   * Hold one outbound message until the member's self-review clears it.
   * @param room - room identity.
   * @param member - member that produced the message.
   * @param send - delivery to run once the review passes.
   */
  private holdOutbound(room: RoomId, member: RoomMemberId, send: () => Promise<void>): void {
    const key = readKey(room, member)
    const queue = this.outbound.get(key) ?? []
    queue.push(send)
    this.outbound.set(key, queue)
  }

  /**
   * Deliver the messages one member held during a passing round.
   * @param row - room row.
   * @param member - member whose review passed.
   */
  private async flushOutbound(row: RoomRow, member: RoomMemberSpec): Promise<void> {
    const key = readKey(row.id, member.id)
    const queue = this.outbound.get(key) ?? []
    this.outbound.delete(key)
    for (const send of queue) await send()
  }

  /**
   * Release the held messages of a round whose self-review did not pass.
   * @param row - room row.
   * @param member - member whose review failed.
   */
  private async dropOutbound(row: RoomRow, member: RoomMemberSpec): Promise<void> {
    const key = readKey(row.id, member.id)
    const queue = this.outbound.get(key) ?? []
    this.outbound.delete(key)
    if (queue.length === 0) return
    this.guard(row).settlePending(member.id)
    await this.saveGuard(row)
    await this.appendSystem(
      row,
      `${String(queue.length)} message(s) were not delivered because self-review did not pass`,
    )
  }

  /**
   * Run one member turn and collect the text and token usage it reported.
   * @param agent - member Agent the turn runs in.
   * @param text - user message the turn starts from.
   * @param timeoutMs - longest the turn may stay unsettled.
   * @returns its assistant text, measured tokens, and whether it timed out.
   */
  private async runMemberTurn(agent: Agent, text: string, timeoutMs: number): Promise<{
    readonly text: string
    readonly usage: number
    readonly timedOut: boolean
  }> {
    let captured = ''
    let usage = 0
    const stop = this.ctx.on('session/event', (session, event: SessionEvent) => {
      if (session !== agent.session) return
      if (event.type === 'assistant/message') {
        captured = event.data.message.content.filter(block => block.type === 'text').map(block => block.text).join('\n')
        if (event.data.usage !== undefined) usage += event.data.usage.inputTokens + event.data.usage.outputTokens
      }
    })
    try {
      agent.followup(createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'user' } }))
      const settled = await this.settles(agent, timeoutMs)
      return { text: captured, usage, timedOut: !settled }
    } finally {
      stop()
    }
  }

  /**
   * Open the ticket one member wake owns and start its first assignment.
   * @param row - room row the wake belongs to.
   * @param member - member that was woken.
   * @param wake - wake reason carrying the triggering message.
   * @param agent - member Agent the work runs in.
   * @returns the ticket, its run target, and the started assignment.
   */
  private openWork(row: RoomRow, member: RoomMemberSpec, wake: Wake, agent: Agent): MemberWork {
    const trigger = (wake.reason as { readonly messageSeqs?: readonly number[] }).messageSeqs?.[0]
    const messages = this.messagesFor(row.id)
    const message = trigger === undefined ? undefined : messages.find(item => item.seq === trigger)
    const sender = message?.author.kind === 'human'
      ? { kind: 'human' as const, id: message.author.id }
      : message?.author.kind === 'member'
        ? { kind: 'member' as const, id: message.author.id }
        : { kind: 'member' as const, id: member.id }
    const session = String(agent.session.id)
    const directory = this.workDirectory(row)
    const seq = message?.seq ?? messages.at(-1)?.seq ?? 1
    const ticket = openRoomTicket({
      store: this.workStore,
      room: row.id,
      messageSeq: seq,
      subject: message?.text ?? wake.reason.detail,
      sender,
      supervisor: session,
      scope: 'change',
      policyVersion: 'room-1',
      now: new Date(),
    })
    this.workStore.putSeat(ticket.id, { room: row.id, member: member.id, seq, at: now() })
    const assignment = startAssignment(this.workStore, ticket.id, { session, directory })
    return { ticket, session, directory, assignment }
  }

  /**
   * Start another assignment on one ticket for a rework round.
   * @param work - the ticket and its run target.
   * @returns the started assignment.
   */
  private startWorkRound(work: MemberWork): Assignment {
    return startAssignment(this.workStore, work.ticket.id, { session: work.session, directory: work.directory })
  }

  /**
   * Record what one round reported on its ticket.
   * @param work - the ticket and the assignment that reported.
   * @param report - the report itself.
   */
  private async recordWork(work: MemberWork, report: AssignmentReport): Promise<void> {
    recordAssignmentReport(this.workStore, work.ticket.id, work.assignment.id, report)
    await this.workStore.flush()
  }

  /**
   * Append one operator-facing system line to the room log.
   * @param row - room row.
   * @param text - line text.
   */
  private async appendSystem(row: RoomRow, text: string): Promise<void> {
    await this.append(row, await this.currentEpisode(row), {
      author: { kind: 'system' }, kind: 'chat', text, mentions: [], depth: 0,
    })
    this.ctx.emit('room/changed', row.id)
  }

  /**
   * Directory every member of one room works in.
   * @param row - room row supplying its workspace root.
   * @returns the absolute working directory.
   */
  private workDirectory(row: RoomRow): string {
    return row.spec.workspaceRoot ?? this.ctx.get('workspaceRegistry')?.list()[0]?.path ?? process.cwd()
  }

  private async prepare(row: RoomRow, member: RoomMemberSpec, reason: WakeReason): Promise<PreparedWake | undefined> {
    const cursor = this.reads.get(readKey(row.id, member.id))?.seq ?? 0
    const messages = this.messagesFor(row.id)
    const labels = new Map(row.spec.members.map(candidate => [candidate.id, candidate.displayName ?? candidate.id]))
    const window = Math.max(1, row.spec.context.window)
    const older = messages
      .filter(message => message.seq > cursor && visibleTo(message, member.id))
      .slice(0, Math.max(0, messages.filter(message => message.seq > cursor && visibleTo(message, member.id)).length - window))
    let summaryText: string | undefined
    if (older.length > 0) {
      const key = `${row.id}:${member.id}`
      const cached = this.summaries.get(key)
      const upto = older.at(-1)?.seq ?? 0
      if (cached !== undefined && cached.upto >= upto) summaryText = cached.text
      else {
        const selection = member.model ?? this.ctx.get('agentDefaultModel')?.currentSelection()
        if (selection !== undefined) {
          const text = await summarizeWithModel(
            this.ctx, selection, older, labels, row.spec.context.messageChars, row.spec.context.summaryChars,
          )
          if (text !== undefined) {
            summaryText = text
            this.summaries.set(key, { upto, text })
          }
        }
      }
    }
    const input = buildMemberInput({
      member: member.id, labels, messages, fromSeq: cursor,
      window: row.spec.context.window, messageChars: row.spec.context.messageChars,
      summaryChars: row.spec.context.summaryChars, triggerChars: row.spec.context.triggerChars,
      wake: reason,
      ...summaryText === undefined ? {} : { summary: summaryText },
    })
    const guard = this.guard(row)
    const used = this.memberUsage(row.id, member.id)
    const verdict = preflight({
      estimatedPromptTokens: estimateTokens(input.text),
      expectedOutputTokens: member.budget.turnOutputTokens,
      limits: {
        turnInputTokens: member.budget.turnInputTokens,
        turnOutputTokens: member.budget.turnOutputTokens,
        episodeRemaining: Math.max(0, row.spec.guard.episodeTokens - guard.snapshot().tokens),
        dailyRemaining: Math.max(0, member.budget.dailyTokens - used),
      },
    })
    if (!verdict.ok) {
      await this.append(row, await this.currentEpisode(row), {
        author: { kind: 'system' }, kind: 'guard', text: verdict.detail, mentions: [member.id], depth: 0,
        guard: { code: 'preflight', detail: verdict.detail, members: [member.id] },
      })
      return undefined
    }
    return { input, member }
  }

  private async memberAgent(row: RoomRow, member: RoomMemberSpec): Promise<Agent> {
    const agents = this.ctx.get('agents')
    const defaultModel = this.ctx.get('agentDefaultModel')
    if (agents === undefined || defaultModel === undefined) {
      throw new Error('Robot Room execution needs the agents and agentDefaultModel services')
    }
    const sessionId = memberSessionOf(row.id, member.id)
    const existing = agents.get(sessionId)
    if (existing !== undefined) return existing
    const cwd = this.workDirectory(row)
    const used = this.memberUsage(row.id, member.id)
    const soft = used >= member.budget.dailyTokens * row.spec.budget.softLimitRatio
    const selection = member.model ?? (soft && member.fallbackModel !== undefined ? member.fallbackModel : undefined)
    const options = selection === undefined
      ? defaultModel.currentSelection()
      : {
        provider: selection.provider,
        model: selection.model,
        ...selection.reasoningEffort === undefined
          ? {}
          : { reasoningEffort: selection.reasoningEffort as ReasoningEffortId },
      }
    const host = this.toolHost(row, member)
    const capability = await this.capabilityOf(row, member)
    const setup = (agentCtx: Context, agent: Agent): void => {
      agentCtx.systemPrompt.section({
        name: 'room:charter', order: -600,
        text: memberCharter(row.spec, member),
      })
      registerRoomTools(agentCtx, member.id, host)
      if (capability.tools !== undefined) agentCtx.get('tools')?.restrict(capability.tools)
      if (capability.skills.length > 0) agentCtx.get('skills')?.restrict({ allow: [...capability.skills] })
      if (capability.permissionPreset !== undefined) {
        this.ctx.get('permissionPresets')?.set(agent.session, capability.permissionPreset)
      }
      void agent
    }
    try {
      const handle = await agents.resume({
        resumeSessionId: sessionId,
        setup,
        agentOptions: options,
      })
      return handle.agent
    } catch {
      const handle: AgentHandle = await agents.create({
        sessionId,
        meta: { cwd },
        setup,
        agentOptions: options,
      })
      return handle.agent
    }
  }

  /**
   * Resolve the capability one member runs under: its Rbot revision's lists,
   * narrowed by the room's own selection. The room can only narrow the robot.
   * @param row - room row carrying the narrowing selection.
   * @param member - member whose robot revision supplies the allowed sets.
   * @returns the tool lists, skills, and permission preset to apply.
   */
  private async capabilityOf(row: RoomRow, member: RoomMemberSpec): Promise<MemberCapability> {
    const narrowing = row.spec.capability
    const robots = this.ctx.get('robots')
    const revision = robots === undefined
      ? undefined
      : await robots.revision({
        spec: brandString<RobotSpecId>(member.robot.spec),
        revision: member.robot.revision,
      })
    const robot = revision?.spec.capability
    const roomAllow = narrowing?.tools?.allow ?? []
    const robotAllow = robot?.tools.allow ?? []
    let allow = roomAllow.length === 0
      ? robotAllow
      : robotAllow.length === 0 ? roomAllow : roomAllow.filter(name => robotAllow.includes(name))
    const deny = [...new Set([...(robot?.tools.deny ?? []), ...narrowing?.tools?.deny ?? []])]

    const roomSkills = narrowing?.skills ?? []
    const robotSkills = robot?.skills ?? []
    const skills = roomSkills.length === 0
      ? robotSkills
      : robotSkills.length === 0 ? roomSkills : roomSkills.filter(name => robotSkills.includes(name))

    const servers = narrowing?.mcpServers ?? []
    if (servers.length > 0) {
      const definitions = this.ctx.get('tools')?.definitions() ?? []
      const prefixes = servers.map(server => `${MCP_TOOL_PREFIX}${server}__`)
      for (const tool of definitions) {
        if (!tool.name.startsWith(MCP_TOOL_PREFIX)) continue
        if (!prefixes.some(prefix => tool.name.startsWith(prefix))) deny.push(tool.name)
      }
      if (allow.length > 0) allow = allow.filter(name => !name.startsWith(MCP_TOOL_PREFIX) || !deny.includes(name))
    }

    const preset = narrowing?.permissionPreset
    const robotPreset = robot?.permissionPreset.trim() ?? ''
    if (preset !== undefined && robotPreset !== '' && preset !== robotPreset) {
      throw new Error(`room ${row.id} names permission preset "${preset}" but member ${member.id} runs as ${robotPreset}`)
    }
    return {
      ...allow.length === 0 && deny.length === 0 ? {} : { tools: { allow: [...new Set(allow)], deny: [...new Set(deny)] } },
      skills,
      ...((preset ?? robotPreset) === '' ? {} : { permissionPreset: preset ?? robotPreset }),
    }
  }

  private toolHost(row: RoomRow, member: RoomMemberSpec): RoomToolHost {
    return {
      post: async (text, mentions) => await this.memberPost(row, member, text, mentions),
      ask: async (to, intent, task, context) => await this.memberAsk(row, member, to, intent, task, context),
      reply: async (replyTo, text, status) => await this.memberReply(row, member, replyTo, text, status),
      read: async (afterSeq, limit) => await this.memberRead(row, member, afterSeq, limit),
      pass: () => Promise.resolve({ ok: true, text: 'Passed; no message was posted.' }),
    }
  }

  private resolveMember(row: RoomRow, token: string): RoomMemberSpec | undefined {
    const wanted = token.trim().replace(/^@/, '')
    return row.spec.members.find(candidate => candidate.id === wanted
      || candidate.displayName === wanted
      || (candidate.displayName ?? candidate.id).toLowerCase() === wanted.toLowerCase())
  }

  private async memberPost(row: RoomRow, member: RoomMemberSpec, text: string, mentions: readonly string[]): Promise<RoomToolResult> {
    return await this.serialized(async () => {
      const targets = mentions.flatMap(id => this.resolveMember(row, id)?.id ?? [])
        .filter((id, index, all) => all.indexOf(id) === index)
      const message = await this.append(row, await this.currentEpisode(row), {
        author: { kind: 'member', id: member.id }, kind: 'chat', text, mentions: targets, depth: 0,
        sessionRef: this.currentTurns.get(readKey(row.id, member.id)),
      })
      const trip = this.guard(row).recordMessage(1)
      if (trip !== undefined) await this.trip(row, trip.reason, trip.detail)
      for (const target of targets) this.enqueue(row.id, target, {
        kind: 'mention', detail: `member ${member.id} mentioned you in #${message.seq}`, messageSeqs: [message.seq],
      })
      this.ctx.emit('room/changed', row.id)
      return { ok: true, text: `Posted #${message.seq}.` }
    })
  }

  private async memberAsk(
    row: RoomRow, member: RoomMemberSpec, to: readonly string[], intent: A2aIntent, task: string, context: string | undefined,
  ): Promise<RoomToolResult> {
    return await this.serialized(async () => {
      const guard = this.guard(row)
      const receivers = to.flatMap(id => this.resolveMember(row, id)?.id ?? [])
        .filter((id, index, all) => all.indexOf(id) === index)
      const used = this.memberUsage(row.id, member.id)
      const envelope = createEnvelopeV2({
        id: randomUUID(), room: row.id, episode: await this.currentEpisode(row), from: member.id,
        to: receivers, intent, task, ...context === undefined ? {} : { context },
        depth: Math.max(1, guard.snapshot().depth + 1),
        grantTokens: grantFor({
          senderRemaining: Math.max(0, member.budget.dailyTokens - used),
          episodeRemaining: Math.max(0, row.spec.guard.episodeTokens - guard.snapshot().tokens),
          memberTurnCap: member.budget.turnInputTokens,
        }),
        deadline: now() + 5 * 60 * 1000,
      })
      const budgets: AdmissionBudgets = {
        episodeRemaining: Math.max(0, row.spec.guard.episodeTokens - guard.snapshot().tokens),
        senderRemaining: Math.max(0, member.budget.dailyTokens - used),
        memberRemaining: new Map(row.spec.members.map(candidate => [
          candidate.id,
          Math.max(0, candidate.budget.dailyTokens - this.memberUsage(row.id, candidate.id)),
        ])),
      }
      const verdict = guard.admit({
        from: member.id, to: receivers, intent, task, ...context === undefined ? {} : { context },
        depth: envelope.depth, grantTokens: envelope.grantTokens,
      }, budgets)
      if (!verdict.ok) {
        await this.saveGuard(row)
        await this.append(row, await this.currentEpisode(row), {
          author: { kind: 'system' }, kind: 'guard', text: `${verdict.refusal}: ${verdict.detail}`, mentions: [member.id], depth: 0,
          guard: { code: verdict.refusal, detail: verdict.detail, members: [member.id] },
        })
        return { ok: false, text: `Refused (${verdict.refusal}): ${verdict.detail}` }
      }
      await this.saveGuard(row)
      const needsApproval = receivers.some(id =>
        row.spec.members.find(candidate => candidate.id === id)?.a2a.requiresApproval.includes(member.id) === true)
      this.holdOutbound(row.id, member.id, async () => {
        if (!needsApproval) {
          await this.emitEnvelope(row, envelope)
          return
        }
        const approval: RoomApproval = { id: randomUUID(), envelope, at: now() }
        await this.approvals.put(`${row.id}:${approval.id}`, approvalRowOf(approval))
        await this.append(row, await this.currentEpisode(row), {
          author: { kind: 'member', id: member.id }, kind: 'approval', text: task, mentions: receivers, depth: envelope.depth,
          a2a: envelope, approval,
          sessionRef: this.currentTurns.get(readKey(row.id, member.id)),
        })
        this.ctx.emit('room/notice', { room: row.id, kind: 'approval', text: task, at: approval.at })
      })
      return {
        ok: true,
        text: needsApproval
          ? 'Held for operator approval; it is released after your self-review passes.'
          : 'Accepted; the peer is notified after your self-review passes.',
      }
    })
  }

  private async memberReply(
    row: RoomRow,
    member: RoomMemberSpec,
    replyTo: string,
    text: string,
    status: 'done' | 'partial' | 'declined',
  ): Promise<RoomToolResult> {
    return await this.serialized(async () => {
      const wanted = replyTo.replace(/^#/, '')
      const original = this.messagesFor(row.id).find(message => message.id === replyTo || String(message.seq) === wanted)
      if (original === undefined) return { ok: false, text: `Unknown request "${replyTo}".` }
      const addressed = original.a2a?.to.includes(member.id) === true && original.a2a.from !== member.id
      if (!addressed) return { ok: false, text: `That request was not addressed to ${member.id}.` }
      const guard = this.guard(row)
      const envelope = createEnvelopeV2({
        id: randomUUID(), room: row.id, episode: await this.currentEpisode(row), from: member.id,
        to: [original.author.kind === 'member' ? original.author.id : member.id], intent: 'reply',
        task: text, replyTo, status, depth: Math.max(1, guard.snapshot().depth),
        grantTokens: 0, deadline: now() + 5 * 60 * 1000,
      })
      guard.settlePending(member.id)
      this.holdOutbound(row.id, member.id, async () => {
        await this.append(row, await this.currentEpisode(row), {
          author: { kind: 'member', id: member.id }, kind: 'reply', text, mentions: envelope.to, depth: envelope.depth,
          a2a: envelope, causedBy: original.id,
          sessionRef: this.currentTurns.get(readKey(row.id, member.id)),
        })
        if (original.author.kind === 'member') this.enqueue(row.id, original.author.id, {
          kind: 'reply', detail: `member ${member.id} answered #${original.seq}`, messageSeqs: [original.seq],
        })
        this.ctx.emit('room/changed', row.id)
      })
      return { ok: true, text: `Reply to #${original.seq} is held until your self-review passes.` }
    })
  }

  private memberRead(
    row: RoomRow,
    member: RoomMemberSpec,
    afterSeq: number | undefined,
    limit: number | undefined,
  ): Promise<RoomToolResult> {
    const messages = this.messagesFor(row.id)
      .filter(message => message.seq > (afterSeq ?? 0))
      .slice(0, Math.min(50, Math.max(1, limit ?? 20)))
    const labels = new Map(row.spec.members.map(candidate => [candidate.id, candidate.displayName ?? candidate.id]))
    const author = (message: RoomMessage): string => message.author.kind === 'member'
      ? labels.get(message.author.id) ?? message.author.id
      : message.author.kind === 'human' ? message.author.name : 'system'
    const text = messages.map(message => `[#${message.seq}] ${author(message)}: ${message.text}`).join('\n')
    void member
    return Promise.resolve({ ok: true, text: text === '' ? 'No messages.' : text })
  }

  private async emitEnvelope(row: RoomRow, envelope: A2aEnvelopeV2): Promise<void> {
    const message = await this.append(row, envelope.episode, {
      author: { kind: 'member', id: envelope.from }, kind: 'a2a', text: envelope.task,
      mentions: envelope.to, depth: envelope.depth, a2a: envelope,
      sessionRef: this.currentTurns.get(readKey(row.id, envelope.from)),
    })
    for (const receiver of envelope.to) this.enqueue(row.id, receiver, {
      kind: envelope.intent === 'handoff' ? 'handoff' : 'request',
      detail: `member ${envelope.from} sent a ${envelope.intent} in #${message.seq}`,
      messageSeqs: [message.seq],
    })
    this.ctx.emit('room/changed', row.id)
  }

  private async trip(row: RoomRow, reason: Parameters<RoomGuard['trip']>[0], detail: string): Promise<void> {
    this.guard(row).trip(reason, detail)
    await this.saveGuard(row)
    const agents = this.ctx.get('agents')
    for (const member of this.running.get(row.id) ?? []) {
      agents?.get(memberSessionOf(row.id, member))?.cancel({ kind: 'user' })
    }
    row.state = 'tripped'
    row.updatedAt = now()
    await this.rooms.put(row.id, row)
    this.queues.set(row.id, [])
    await this.append(row, await this.currentEpisode(row), {
      author: { kind: 'system' }, kind: 'guard', text: detail, mentions: [], depth: 0,
      guard: { code: 'trip', detail, members: [] },
    })
    this.ctx.emit('room/changed', row.id)
    this.ctx.emit('room/notice', { room: row.id, kind: 'tripped', text: detail, at: now() })
  }

  private messagesFor(room: RoomId): RoomMessage[] {
    return [...this.messageTable.entries()]
      .filter(([key]) => key.startsWith(`${room}:`))
      .map(([, row]) => row)
      .sort((left, right) => left.seq - right.seq)
  }

  private memberUsage(room: RoomId, member: RoomMemberId): number {
    return this.messagesFor(room)
      .filter(message => message.author.kind === 'member' && message.author.id === member && message.usage !== undefined)
      .reduce((sum, message) => sum + (message.usage ?? 0), 0)
  }
}
