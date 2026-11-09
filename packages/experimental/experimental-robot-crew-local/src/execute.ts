/**
 * Crew execution: one Agent per node, a shared flow ledger, execution-time
 * memory briefs, A2A messages between nodes, and one loop guard per run.
 * @module @tomato/experimental-robot-crew-local
 */

import { randomUUID } from 'node:crypto'
import type { Agent, AgentHandle } from '@tomato/agent'
import type {} from '@tomato/agent-default-model'
import { brandString } from '@tomato/branded'
import type { Context } from '@tomato/cordis'
import {
  CrewLoopGuard, a2aSignature, bound, carriedCount, composeBrief, createEnvelope, extractMemory,
  renderProjectHistory, summarize, topologicalOrder,
} from '@tomato/experimental-robot-crew'
import type {
  BriefArtifact, BriefMemory, CrewEntry, CrewNode, CrewNodeProgress, CrewRun, CrewSpec, CrewSpecRevision, CrewTripReason,
} from '@tomato/experimental-robot-crew'
import type { CapabilitySpec, GoalSpec, RobotSpecId } from '@tomato/experimental-robot'
import type {} from '@tomato/experimental-memory'
import type { MemoryView } from '@tomato/experimental-memory'
import type {} from '@tomato/experimental-robot'
import { createUserMessage } from '@tomato/llm'
import type {} from '@tomato/permission-presets'
import type { SessionEvent, SessionId } from '@tomato/session'
import type {} from '@tomato/skill'
import type {} from '@tomato/system-prompt'
import { defineTool } from '@tomato/tools'
import type {} from '@tomato/workspace'

/** One field patch the orchestrator reports on its run. */
export interface CrewRunPatch {
  readonly state?: CrewRun['state']
  readonly output?: string
  readonly error?: string
  readonly trip?: CrewTripReason
  readonly nodes?: readonly CrewNodeProgress[]
  readonly tokens?: number
  readonly messages?: number
  readonly steps?: number
  readonly endedAt?: number
}

/** Everything one stored run needs to execute. */
export interface ExecuteCrewOptions {
  /** Host context carrying the Agent factory and optional capability services. */
  readonly ctx: Context
  /** Exact published revision the run executes. */
  readonly revision: CrewSpecRevision
  /** The accepted run, as stored before execution. */
  readonly run: CrewRun
  /** Cancellation owned by the provider. */
  readonly signal: AbortSignal
  /** Absolute directory every node agent works in. */
  readonly cwd: string
  /** Task memory earlier finished runs of this crew left, already bounded by the provider. */
  readonly carried?: BriefMemory
  /** Append one ledger entry; the provider assigns its sequence. */
  readonly record: (entry: Omit<CrewEntry, 'run' | 'seq'>) => Promise<void>
  /** Persist one run patch. */
  readonly patch: (patch: CrewRunPatch) => Promise<void>
}

/** Approximate model tokens in one text; stable and cheap, not a meter. */
function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 3))
}

/** Tool name every node agent receives. */
export const A2A_TOOL_NAME = 'crew_a2a_send'

/** Longest step result kept in the ledger. */
const STEP_RESULT_CHARS = 8000

/** Most memory items the flow keeps per kind. */
const MEMORY_ITEMS = 12

/** Characters the injected project-history block may use. */
const PROJECT_HISTORY_CHARS = 2000

/** Readable text of a thrown value. */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Execute one crew run to a terminal state, reporting every patch through the
 * provider. Never throws for a step failure: the failure becomes the run's
 * state and error.
 * @param options - revision, run, cancellation, and persistence callbacks.
 * @returns after the run reached a terminal state and every patch landed.
 */
export async function executeCrew(options: ExecuteCrewOptions): Promise<void> {
  const { revision, run } = options
  const guard = new CrewLoopGuard(revision.spec.guard)
  const executor = new NodeExecutor(options, revision, guard)
  try {
    await options.patch({ state: 'running' })
    await options.record({ kind: 'run-start', at: Date.now(), text: run.input })
    if (options.carried !== undefined && carriedCount(options.carried) > 0) {
      await options.record({
        kind: 'memory',
        at: Date.now(),
        text: `Carried task memory from earlier runs (decisions ${options.carried.decisions.length}, `
          + `constraints ${options.carried.constraints.length}, open questions ${options.carried.open.length}).`,
        data: {
          carried: true,
          decisions: options.carried.decisions.length,
          constraints: options.carried.constraints.length,
          open: options.carried.open.length,
        },
      })
    }
    const outcome = await executor.run(run.input)
    if (outcome.kind === 'tripped') {
      await options.record({ kind: 'guard', at: Date.now(), text: outcome.detail, data: { reason: outcome.reason } })
      await options.patch({
        state: 'tripped', trip: outcome.reason, error: outcome.detail, endedAt: Date.now(), ...executor.counters(),
      })
      return
    }
    if (outcome.kind === 'cancelled') {
      await options.patch({
        state: 'cancelled', error: 'the run was cancelled', endedAt: Date.now(), ...executor.counters(),
      })
      return
    }
    if (outcome.kind === 'failed') {
      await options.patch({ state: 'failed', error: outcome.detail, endedAt: Date.now(), ...executor.counters() })
      return
    }
    await options.record({ kind: 'run-end', at: Date.now(), text: outcome.output.slice(0, STEP_RESULT_CHARS) })
    await options.patch({
      state: 'succeeded', output: outcome.output, endedAt: Date.now(), ...executor.counters(),
    })
    await executor.rememberSummary()
  } catch (error: unknown) {
    await options.patch({
      state: options.signal.aborted ? 'cancelled' : 'failed',
      error: options.signal.aborted ? 'the run was cancelled' : error instanceof Error ? error.message : String(error),
      endedAt: Date.now(),
      ...executor.counters(),
    })
  }
}

/** Terminal outcome the graph loop reports. */
type FlowOutcome =
  | { readonly kind: 'succeeded'; readonly output: string }
  | { readonly kind: 'failed'; readonly detail: string }
  | { readonly kind: 'cancelled' }
  | { readonly kind: 'tripped'; readonly reason: CrewTripReason; readonly detail: string }

/** Memory carried between activations. */
interface FlowMemory {
  readonly decisions: readonly string[]
  readonly constraints: readonly string[]
  readonly open: readonly string[]
}

/** One activation's result. */
interface Activation {
  readonly text: string
  readonly turns: number
  readonly tokens: number
  /** Why a turn ended before the activation was complete. */
  readonly failure?: string
}

/** A bound robot's resolved values, applied when its node's Agent is created. */
interface ResolvedRobot {
  readonly capability: CapabilitySpec
  readonly goal: GoalSpec
}

/** Mutable per-run orchestrator state and every step it drives. */
class NodeExecutor {
  private readonly memory: { decisions: string[]; constraints: string[]; open: string[] } = {
    decisions: [],
    constraints: [],
    open: [],
  }

  private readonly artifacts = new Map<string, BriefArtifact>()
  private readonly replies = new Map<string, BriefArtifact[]>()
  private readonly warnings = new Map<string, string[]>()
  private readonly states = new Map<string, CrewNodeProgress>()
  private readonly robots = new Map<string, ResolvedRobot>()
  private readonly failed = new Set<string>()
  private activations = 0
  private tokens = 0
  private lastOutput = ''
  private memoryView: MemoryView | undefined
  private projectHistory: string | undefined
  private lastSessionId: SessionId | undefined

  constructor(
    private readonly options: ExecuteCrewOptions,
    private readonly revision: CrewSpecRevision,
    private readonly guard: CrewLoopGuard,
  ) {
    for (const node of revision.spec.nodes) {
      this.states.set(node.id, { id: node.id, state: 'pending', turns: 0 })
    }
    // Earlier runs' statements seed the same flow memory a run extracts, so
    // every node brief restates them before the first step has run.
    const carried = options.carried
    if (carried !== undefined) {
      this.memory.decisions.push(...carried.decisions.slice(0, MEMORY_ITEMS))
      this.memory.constraints.push(...carried.constraints.slice(0, MEMORY_ITEMS))
      this.memory.open.push(...carried.open.slice(0, MEMORY_ITEMS))
    }
  }

  private get spec(): CrewSpec {
    return this.revision.spec
  }

  private get patched(): (patch: CrewRunPatch) => Promise<void> {
    return this.options.patch
  }

  private get recorded(): (entry: Omit<CrewEntry, 'run' | 'seq'>) => Promise<void> {
    return this.options.record
  }

  /** Counters the provider persists on every terminal patch. */
  counters(): Pick<CrewRunPatch, 'tokens' | 'messages' | 'steps' | 'nodes'> {
    const snapshot = this.guard.snapshot()
    return { tokens: this.tokens, messages: snapshot.messages, steps: snapshot.steps, nodes: this.progress() }
  }

  /** Per-node progress in specification order. */
  progress(): readonly CrewNodeProgress[] {
    return this.spec.nodes.map(node => this.states.get(node.id) ?? { id: node.id, state: 'pending', turns: 0 })
  }

  /**
   * Run the acyclic graph in topological order.
   * @param message - the run's goal message.
   * @returns the terminal outcome.
   */
  async run(message: string): Promise<FlowOutcome> {
    const order = topologicalOrder(this.spec.nodes, this.spec.edges)
    if (order === undefined) return { kind: 'failed', detail: 'the crew graph has a cycle' }
    await this.loadProjectHistory()
    for (const id of order) {
      if (this.options.signal.aborted) return { kind: 'cancelled' }
      const check = this.guard.check()
      if (check !== undefined) return { kind: 'tripped', reason: check.reason, detail: check.detail }
      const node = this.spec.nodes.find(candidate => candidate.id === id)
      if (node === undefined) continue
      if (this.skipped(node)) {
        this.states.set(id, { id, state: 'skipped', turns: 0 })
        await this.patched({ nodes: this.progress() })
        continue
      }
      const outcome = await this.activateGraphNode(node, message)
      if (outcome !== undefined) return outcome
    }
    return { kind: 'succeeded', output: this.lastOutput }
  }

  /** Whether every incoming edge should skip this node because its source failed. */
  private skipped(node: CrewNode): boolean {
    const incoming = this.spec.edges.filter(edge => edge.to === node.id && edge.when === 'onSuccess')
    return incoming.length > 0 && incoming.every(edge => this.failed.has(edge.from))
  }

  /**
   * Activate one graph node, record its memory, and deliver its handoffs.
   * @param node - node to run.
   * @param message - run goal.
   * @returns a terminal outcome when the run must stop, otherwise undefined.
   */
  private async activateGraphNode(node: CrewNode, message: string): Promise<FlowOutcome | undefined> {
    const brief = this.briefFor(node)
    await this.recorded({ kind: 'brief', at: Date.now(), node: node.id, text: brief })
    await this.recorded({ kind: 'step-start', at: Date.now(), node: node.id })
    this.states.set(node.id, { id: node.id, state: 'running', turns: 0 })
    await this.patched({ nodes: this.progress() })
    let activation: Activation
    try {
      await this.resolveRobot(node)
      activation = await this.activate(node, brief, message, 1)
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error)
      this.failed.add(node.id)
      this.states.set(node.id, { id: node.id, state: 'failed', turns: 0, summary: detail })
      await this.recorded({ kind: 'step-result', at: Date.now(), node: node.id, text: detail, data: { failed: true } })
      return { kind: 'failed', detail: `node "${node.id}" failed: ${detail}` }
    }
    this.states.set(node.id, {
      id: node.id,
      state: activation.failure === undefined ? 'succeeded' : 'failed',
      turns: activation.turns,
      summary: summarize(activation.text, 160),
    })
    this.tokens += activation.tokens
    const stepTrip = this.guard.recordTokens(activation.tokens) ?? this.guard.recordStep(activation.text)
    await this.recorded({
      kind: 'step-result',
      at: Date.now(),
      node: node.id,
      text: activation.text.slice(0, STEP_RESULT_CHARS),
      data: {
        turns: activation.turns,
        tokens: activation.tokens,
        ...activation.failure === undefined ? {} : { failure: activation.failure },
      },
    })
    if (activation.failure !== undefined || activation.text.trim() === '') {
      this.failed.add(node.id)
      await this.recorded({
        kind: 'drift',
        at: Date.now(),
        node: node.id,
        text: activation.failure ?? 'the node finished without an answer',
      })
      return { kind: 'failed', detail: `node "${node.id}" finished without a usable answer` }
    }
    await this.absorb(node, activation.text)
    await this.patched({ nodes: this.progress(), tokens: this.tokens, steps: this.guard.snapshot().steps })
    if (stepTrip !== undefined) return { kind: 'tripped', reason: stepTrip.reason, detail: stepTrip.detail }
    this.lastOutput = activation.text
    return await this.handoffs(node, activation.text)
  }

  /**
   * Deliver the finished output along every outgoing edge.
   * @param node - finished node.
   * @param output - its final text.
   * @returns a terminal outcome when the guard refuses to continue.
   */
  private async handoffs(node: CrewNode, output: string): Promise<FlowOutcome | undefined> {
    const outgoing = this.spec.edges.filter(edge => edge.from === node.id)
    if (outgoing.length === 0) return undefined
    const summary = summarize(output, this.spec.memory.artifactChars)
    const knownNodes = new Set(this.spec.nodes.map(candidate => candidate.id))
    for (const edge of outgoing) {
      if (edge.when === 'onSuccess' && output.trim() === '') continue
      const signature = a2aSignature({ from: node.id, to: edge.to, intent: 'event', task: 'handoff', payload: summary })
      // A graph handoff is structural, not a peer intent: it is always admitted
      // for the declared edge, and the guard still bounds count, depth, and
      // repetition. Peer admission rules apply to the A2A tool instead.
      const verdict = this.guard.admitMessage({
        from: node.id, to: edge.to, intent: 'event', signature, hop: 1,
        a2a: { intents: [], peers: [] }, knownNodes,
      })
      if (!verdict.ok) {
        await this.recorded({
          kind: 'guard', at: Date.now(), node: edge.to, text: verdict.detail, data: { refusal: verdict.refusal },
        })
        continue
      }
      const target = this.spec.nodes.find(candidate => candidate.id === edge.to)
      this.artifacts.set(edge.to, { node: node.id, label: target?.label ?? node.label, summary })
      await this.recorded({
        kind: 'handoff', at: Date.now(), node: edge.to, text: summary,
        data: { from: node.id, to: edge.to, kind: edge.kind },
      })
    }
    await this.patched({ messages: this.guard.snapshot().messages, nodes: this.progress() })
    return undefined
  }

  /**
   * Fold one finished output into the run's execution memory.
   * @param node - producing node.
   * @param output - its final text.
   */
  private async absorb(node: CrewNode, output: string): Promise<void> {
    if (!this.spec.memory.extract) return
    const extracted = extractMemory(output)
    this.artifacts.set(node.id, { node: node.id, label: node.label, summary: summarize(output, this.spec.memory.artifactChars) })
    await this.mergeMemory(node, extracted.decisions, 'decision')
    await this.mergeMemory(node, extracted.constraints, 'constraint')
    await this.mergeMemory(node, extracted.open, 'open')
  }

  private async mergeMemory(node: CrewNode, items: readonly string[], kind: string): Promise<void> {
    const target = kind === 'decision' ? this.memory.decisions : kind === 'constraint' ? this.memory.constraints : this.memory.open
    for (const item of items) {
      if (target.some(existing => existing.toLowerCase() === item.toLowerCase())) continue
      if (target.length >= MEMORY_ITEMS) target.shift()
      target.push(item)
      await this.recorded({ kind: 'memory', at: Date.now(), node: node.id, text: item, data: { memory: kind } })
    }
  }

  /** Whether this node may reach any other node through A2A. */
  private canMessage(node: CrewNode): boolean {
    return this.spec.nodes.length > 1 && this.spec.a2a.intents.length > 0 && node.kind !== 'observer'
  }

  /**
   * Read the project history the deployment's long-term memory holds for this
   * directory, so members start from what earlier work recorded instead of
   * rediscovering it. An absent service or an unavailable directory leaves the
   * run without the block; a failed read is recorded and does not fail the run.
   */
  private async loadProjectHistory(): Promise<void> {
    const memory = this.options.ctx.get('memory')
    if (memory === undefined) return
    try {
      const access = await memory.accessFor(this.options.cwd)
      if (access.kind !== 'available') return
      this.memoryView = access.view
      const episodes = await memory.history(access.view, `${this.spec.mission}\n${this.options.run.input}`)
      this.projectHistory = renderProjectHistory(
        episodes.map(episode => ({
          kind: episode.kind,
          title: episode.title,
          narrative: episode.narrative,
          at: episode.createdAt,
        })),
        PROJECT_HISTORY_CHARS,
      )
    } catch (error: unknown) {
      await this.recorded({ kind: 'drift', at: Date.now(), text: `project memory is unavailable: ${messageOf(error)}` })
    }
  }

  /**
   * Record one summary episode for the finished run, so the next task in this
   * project can recall what this crew decided. A failed write is recorded and
   * never changes the settled run.
   */
  async rememberSummary(): Promise<void> {
    const memory = this.options.ctx.get('memory')
    if (memory === undefined || this.memoryView === undefined || this.lastSessionId === undefined) return
    if (this.lastOutput.trim() === '') return
    const facts = [...this.memory.decisions, ...this.memory.constraints, ...this.memory.open]
      .slice(0, 6)
      .map(item => bound(item, 240))
    try {
      await memory.rememberEpisode({
        owner: this.memoryView.owner,
        scope: { kind: 'project', path: this.memoryView.workspace ?? this.options.cwd },
        kind: 'summary',
        type: 'crew-run',
        title: bound(`${this.spec.name}: ${this.options.run.input}`, 200),
        narrative: bound(this.lastOutput, 1200),
        facts,
        concepts: [this.spec.name],
        fingerprint: `crew-run:${this.options.run.id}`,
        source: { sessionId: this.lastSessionId, runId: this.options.run.id },
      })
    } catch (error: unknown) {
      await this.recorded({ kind: 'drift', at: Date.now(), text: `could not record this run in project memory: ${messageOf(error)}` })
    }
  }

  /**
   * Compose the bounded brief one node receives.
   * @param node - receiving node.
   * @param extra - an A2A task and context that replace the node's graph task.
   * @returns the brief text.
   */
  private briefFor(node: CrewNode, extra?: { readonly from: string; readonly task: string; readonly context: string }): string {
    const incoming = new Set(this.spec.edges.filter(edge => edge.to === node.id).map(edge => edge.from))
    const artifacts = [...this.artifacts.entries()]
      .filter(([id]) => id !== node.id && (incoming.size === 0 || incoming.has(id)))
      .map(([, artifact]) => artifact)
      .slice(-4)
    const replies = this.replies.get(node.id) ?? []
    const warnings = [...(this.warnings.get(node.id) ?? [])]
    const task = extra === undefined
      ? node.instruction
      : `Peer ${extra.from} asks you to act: ${extra.task}${extra.context === '' ? '' : `\n\nContext passed with the request:\n${extra.context}`}`
    const memory: FlowMemory = this.memory
    return composeBrief({
      mission: this.spec.mission,
      successCriteria: this.spec.successCriteria,
      stopConditions: this.spec.stopConditions,
      nodeLabel: node.label,
      nodeRole: node.role,
      instruction: task,
      memory,
      artifacts,
      replies,
      warnings,
      budgetChars: this.spec.memory.briefChars,
    })
  }

  /**
   * Resolve a node's bound robot revision before its Agent is created.
   * @param node - node whose binding to resolve.
   */
  private async resolveRobot(node: CrewNode): Promise<void> {
    if (node.robot === undefined || this.robots.has(node.id)) return
    const robots = this.options.ctx.get('robots')
    if (robots === undefined) throw new Error('the crew names a robot but this deployment mounts no robot registry')
    const revision = await robots.revision({ spec: brandString<RobotSpecId>(node.robot.spec), revision: node.robot.revision })
    if (revision === undefined) throw new Error(`unavailable robot revision ${node.robot.spec}@${node.robot.revision}`)
    this.robots.set(node.id, { capability: revision.spec.capability, goal: revision.spec.goal })
  }

  /**
   * Create one Agent for a node, run its turn or turns, and dispose it.
   * @param node - node to activate.
   * @param brief - system-prompt brief.
   * @param message - user message the activation starts from.
   * @param hop - A2A forwarding depth this activation may use.
   * @returns the activation's text, turns, and token estimate.
   */
  private async activate(node: CrewNode, brief: string, message: string, hop: number): Promise<Activation> {
    if (this.options.signal.aborted) throw new Error('the run was cancelled')
    this.activations += 1
    const sessionId = brandString<SessionId>(`crew-${this.options.run.id}-${node.id}-${this.activations}`)
    this.lastSessionId = sessionId
    const handle: AgentHandle = await this.options.ctx.agents.create({
      sessionId,
      meta: { cwd: this.options.cwd },
      agentOptions: this.options.ctx.agentDefaultModel.currentSelection(),
      setup: (agentCtx: Context, agent: Agent) => {
        agentCtx.systemPrompt.section({ name: 'crew:brief', order: -500, text: brief })
        if (this.projectHistory !== undefined) {
          agentCtx.systemPrompt.section({ name: 'crew:memory', order: -490, text: this.projectHistory })
        }
        this.applyRobot(agentCtx, agent, node)
        if (this.canMessage(node)) this.registerA2aTool(agentCtx, node, hop)
      },
    })
    let text = ''
    let turnFailure: string | undefined
    const stop = this.options.ctx.on('session/event', (session, event: SessionEvent) => {
      if (session !== handle.agent.session) return
      if (event.type === 'assistant/message') {
        text = event.data.message.content.filter(block => block.type === 'text').map(block => block.text).join('')
      }
      if (event.type === 'turn/end') {
        const reason = event.data.reason
        if (reason.kind === 'error') turnFailure = `${reason.error.code}: ${reason.error.message}`
        else if (reason.kind !== 'completed') turnFailure = `the turn ended with ${reason.kind}`
      }
    })
    const abort = (): void => { handle.agent.cancel({ kind: 'user' }) }
    this.options.signal.addEventListener('abort', abort, { once: true })
    try {
      handle.agent.followup(createUserMessage({ content: [{ type: 'text', text: message }], source: { kind: 'user' } }))
      await handle.agent.whenIdle()
      let turns = 1
      while (turns < node.maxTurns && !this.options.signal.aborted && turnFailure === undefined && /CONTINUE\s*:/iu.test(text)) {
        turns += 1
        handle.agent.followup(createUserMessage({
          content: [{ type: 'text', text: 'Continue and finish your answer. Keep the final answer first.' }],
          source: { kind: 'user' },
        }))
        await handle.agent.whenIdle()
      }
      if (this.options.signal.aborted) throw new Error('the run was cancelled')
      const tokens = estimateTokens(brief) + estimateTokens(message) + estimateTokens(text)
      if (tokens > node.budgetTokens) {
        const note = `This node used about ${tokens} tokens, over its ${node.budgetTokens} budget.`
        for (const successor of this.spec.edges.filter(edge => edge.from === node.id).map(edge => edge.to)) {
          this.warnings.set(successor, [...(this.warnings.get(successor) ?? []), note])
        }
      }
      return { text, turns, tokens, ...turnFailure === undefined ? {} : { failure: turnFailure } }
    } finally {
      this.options.signal.removeEventListener('abort', abort)
      stop()
      await handle.dispose()
    }
  }

  /** Apply a bound robot's capabilities and mission to one node agent. */
  private applyRobot(agentCtx: Context, agent: Agent, node: CrewNode): void {
    const resolved = this.robots.get(node.id)
    if (resolved === undefined) return
    agentCtx.systemPrompt.section({
      name: 'crew:robot',
      order: -600,
      text: [`## ${resolved.goal.mission}`, ...resolved.goal.successCriteria.map(item => `- ${item}`)].join('\n'),
    })
    const tools = agentCtx.get('tools')
    if (tools !== undefined) {
      const { allow, deny } = resolved.capability.tools
      if (allow.length > 0 || deny.length > 0) {
        tools.restrict({ ...allow.length === 0 ? {} : { allow: [...allow] }, ...deny.length === 0 ? {} : { deny: [...deny] } })
      }
    }
    const skills = agentCtx.get('skills')
    if (skills !== undefined && resolved.capability.skills.length > 0) skills.restrict({ allow: [...resolved.capability.skills] })
    const presets = this.options.ctx.get('permissionPresets')
    if (presets !== undefined) presets.set(agent.session, resolved.capability.permissionPreset)
  }

  /** Register the A2A tool in one node agent's scope. */
  private registerA2aTool(agentCtx: Context, node: CrewNode, hop: number): void {
    const tools = agentCtx.get('tools')
    if (tools === undefined) return
    tools.register(defineTool({
      name: A2A_TOOL_NAME,
      description: 'Ask another agent in this crew to perform a task and return its answer. '
        + 'Use it when the work belongs to a different role; the reply arrives before this turn continues.',
      parameters: {
        to: { type: 'string', required: true, description: 'Node id of the crew member to ask.' },
        intent: { type: 'string', enum: ['request', 'delegate'], description: 'Request an answer, or delegate a unit of work.' },
        task: { type: 'string', required: true, description: 'What the peer must do, stated as an outcome.' },
        context: { type: 'string', description: 'Facts the peer needs; omit what it reads from the crew brief.' },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            ok: { type: 'boolean', required: true },
            node: { type: 'string' },
            reply: { type: 'string' },
            refusal: { type: 'string' },
            detail: { type: 'string' },
          },
        },
        render: (args, value) => {
          const result = value as { ok?: boolean; node?: string; reply?: string; refusal?: string; detail?: string }
          const requested = (args as { to?: string }).to ?? 'peer'
          const text = result.ok === true
            ? `${result.node ?? requested}: ${result.reply ?? ''}`
            : `Blocked by the crew loop guard (${result.refusal ?? 'unknown'}): ${result.detail ?? ''}`
          return [{ type: 'text', text }]
        },
      },
      execute: async (args, exec) => {
        const input = args as { to: string; intent?: 'request' | 'delegate'; task: string; context?: string }
        return await this.onA2aSend(node, input, hop + 1, exec.signal)
      },
    }))
  }

  /**
   * Deliver one A2A request, activate the peer, and return its answer.
   * @param sender - node that asked.
   * @param input - target, intent, task, and context.
   * @param hop - forwarding depth of this message.
   * @param signal - cancellation of the tool call.
   * @returns the canonical tool value.
   */
  private async onA2aSend(
    sender: CrewNode,
    input: { readonly to: string; readonly intent?: 'request' | 'delegate'; readonly task: string; readonly context?: string },
    hop: number,
    signal: AbortSignal,
  ): Promise<{ ok: boolean; node?: string; reply?: string; refusal?: string; detail?: string }> {
    const target = this.spec.nodes.find(node => node.id === input.to)
    if (target === undefined) return { ok: false, refusal: 'unknown-peer', detail: `no node "${input.to}" in this crew` }
    const intent = input.intent ?? 'request'
    const signature = a2aSignature({ from: sender.id, to: target.id, intent, task: input.task, payload: input.context ?? '' })
    const verdict = this.guard.admitMessage({
      from: sender.id,
      to: target.id,
      intent,
      signature,
      hop,
      a2a: this.spec.a2a,
      knownNodes: new Set(this.spec.nodes.map(node => node.id)),
    })
    if (!verdict.ok) {
      await this.recorded({
        kind: 'guard', at: Date.now(), node: target.id, text: verdict.detail, data: { refusal: verdict.refusal },
      })
      return { ok: false, refusal: verdict.refusal, detail: verdict.detail }
    }
    if (signal.aborted || this.options.signal.aborted) return { ok: false, refusal: 'scope', detail: 'the run was cancelled' }
    const envelope = createEnvelope({
      id: randomUUID(), run: this.options.run.id, from: sender.id, to: target.id, intent,
      task: input.task, payload: input.context ?? '', hop,
    })
    await this.recorded({
      kind: 'a2a-request', at: Date.now(), node: target.id, text: input.task,
      data: { from: sender.id, to: target.id, intent, hop },
    })
    try {
      await this.resolveRobot(target)
      const brief = this.briefFor(target, { from: sender.id, task: input.task, context: input.context ?? '' })
      await this.recorded({ kind: 'brief', at: Date.now(), node: target.id, text: brief, data: { a2a: envelope.id } })
      const activation = await this.activate(target, brief, input.task, hop)
      this.tokens += activation.tokens
      const trip = this.guard.recordTokens(activation.tokens) ?? this.guard.recordStep(activation.text)
      await this.mergeMemory(target, extractMemory(activation.text).decisions, 'decision')
      const summary = summarize(activation.text, this.spec.memory.artifactChars)
      const list = this.replies.get(sender.id) ?? []
      list.push({ node: target.id, label: target.label, summary })
      this.replies.set(sender.id, list)
      await this.recorded({
        kind: 'a2a-reply', at: Date.now(), node: target.id, text: summary,
        data: { from: target.id, to: sender.id, hop, replyTo: envelope.id },
      })
      await this.patched({
        tokens: this.tokens, messages: this.guard.snapshot().messages, steps: this.guard.snapshot().steps,
      })
      if (trip !== undefined) {
        this.warnings.set(sender.id, [...(this.warnings.get(sender.id) ?? []), `The crew stopped after this request: ${trip.detail}`])
        return { ok: false, refusal: 'scope', detail: trip.detail }
      }
      return { ok: true, node: target.id, reply: summary }
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error)
      await this.recorded({ kind: 'drift', at: Date.now(), node: target.id, text: detail, data: { failed: true } })
      return { ok: false, refusal: 'scope', detail }
    }
  }
}
