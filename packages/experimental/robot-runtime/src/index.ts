/**
 * Executes queued robot runs through one composed Agent per run. It reacts to
 * durable run writes, assembles the specification into the Agent scope, drives
 * the run's turns until the run settles, and records the outcome through
 * `ctx.robots.finish`.
 * @module @tomato/experimental-robot-runtime
 */

import { randomUUID } from 'node:crypto'
import type { Agent, AgentHandle } from '@tomato/agent'
import type {} from '@tomato/agent-default-model'
import { brandString } from '@tomato/branded'
import type { Context } from '@tomato/cordis'
import { isTerminalRunState } from '@tomato/experimental-robot'
import type { RobotSpec, Run, RunId, RunOutcome } from '@tomato/experimental-robot'
import { createUserMessage } from '@tomato/llm'
import type {} from '@tomato/mcp-resources'
import type {} from '@tomato/permission-presets'
import type {} from '@tomato/skill'
import type {} from '@tomato/tools'
import { appendPluginRecord } from '@tomato/session'
import type { SessionEvent, SessionId } from '@tomato/session'
import type {} from '@tomato/storage-domain'
import type {} from '@tomato/system-prompt'
import type {} from '@tomato/tools'
import type {} from '@tomato/workspace'
import { z } from 'zod'
import { robotRunProjectionDefinition } from './projection.ts'

/** Stable Cordis plugin name. */
export const name = 'robot-runtime'

/** Services required before queued runs can execute. */
export const inject = ['agentDefaultModel', 'agents', 'robots', 'sessionProjections', 'sessions']

/** Deployment limits for run execution. */
export const Config = z.object({
  /**
   * Wall-clock milliseconds a run may stay `waiting` for human input before the
   * executor settles it as `cancelled`. A paused run holds the robot's only
   * execution slot and its Agent, so the wait is always bounded.
   */
  pauseTimeoutMs: z.number().int().min(1).default(30 * 60 * 1000),
}).prefault({})

/** Validated run-execution limits. */
export type Config = z.infer<typeof Config>

const ROBOT_DOMAIN = 'tomato_robot'

type TurnEndReason = SessionEvent<'turn/end'>['data']['reason']

function promptText(spec: RobotSpec): string {
  const lines = ['## Robot mission', spec.goal.mission]
  if (spec.goal.successCriteria.length > 0) {
    lines.push('', '## Success criteria', ...spec.goal.successCriteria.map(item => `- ${item}`))
  }
  if (spec.goal.stopConditions.length > 0) {
    lines.push('', '## Stop conditions', ...spec.goal.stopConditions.map(item => `- ${item}`))
  }
  if (spec.io.acceptance.length > 0) {
    lines.push('', '## Output acceptance', ...spec.io.acceptance.map(item => `- ${item}`))
  }
  return lines.join('\n')
}

/**
 * Resolve the directory one run works in. The specification's first Workspace
 * root wins; an unpinned specification falls back to the deployment's first
 * registered Workspace, then to the Host process directory, so a robot always
 * has an inspectable working directory.
 * @param ctx - runtime context carrying the optional Workspace registry.
 * @param spec - specification of the queued run.
 * @returns the absolute working directory the Agent records on its Session.
 */
function resolveWorkspaceRoot(ctx: Context, spec: RobotSpec): string {
  const declared = spec.capability.workspaceRoots[0]
  if (declared !== undefined) return declared
  const registered = ctx.get('workspaceRegistry')?.list()[0]?.path
  return registered ?? process.cwd()
}

/** Prefix that namespaces every tool an MCP server registers. */
const MCP_TOOL_PREFIX = 'mcp__'

/** Capability filters one run applies to its Agent. */
interface RunCapabilities {
  /** Tool allow list; present when the run must exclude registered MCP tools it did not select. */
  readonly allow?: readonly string[]
  /** Tool names the specification forbids. */
  readonly deny: readonly string[]
  /** Skills the run may load; empty leaves the deployment catalog unfiltered. */
  readonly skills: readonly string[]
}

/**
 * Resolve the specification's skill and MCP selections against the live
 * deployment. A selection that no mounted service or configured server can
 * satisfy fails the run before an Agent is created, because silently running
 * without a requested capability would misreport what the run did.
 * @param ctx - runtime context carrying the optional skill, tool, and MCP services.
 * @param spec - specification of the queued run.
 * @param cwd - the run's working directory, which selects project skills.
 * @returns the restrictions to apply in the Agent scope.
 * @throws when a selected skill or MCP server is not available.
 */
async function resolveCapabilities(ctx: Context, spec: RobotSpec, cwd: string): Promise<RunCapabilities> {
  const skills = spec.capability.skills
  if (skills.length > 0) {
    const registry = ctx.get('skills')
    if (registry === undefined) throw new Error('this deployment mounts no skill registry, so the selected skills cannot load')
    const available = new Set((await registry.list({ cwd })).map(skill => skill.name))
    const missing = skills.filter(name => !available.has(name))
    if (missing.length > 0) throw new Error(`unavailable skill${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`)
  }

  const servers = spec.capability.mcpServers
  if (servers.length > 0) {
    const mounted = ctx.get('mcpResources')?.list() ?? []
    const missing = servers.filter(name => !mounted.includes(name))
    if (missing.length > 0) throw new Error(`unavailable MCP server${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`)
  }

  const definitions = ctx.get('tools')?.definitions() ?? []
  const mcpTools = definitions.filter(tool => tool.name.startsWith(MCP_TOOL_PREFIX))
  const declared = spec.capability.tools.allow
  if (mcpTools.length === 0) {
    return { ...declared.length > 0 ? { allow: declared } : {}, deny: spec.capability.tools.deny, skills }
  }

  // A robot sees MCP tools only from servers it names; the selection is an
  // allow list over the registered names because the servers are mounted by
  // the deployment, not created per run.
  const selected = new Set(servers)
  const kept = mcpTools
    .filter(tool => [...selected].some(server => tool.name.startsWith(`${MCP_TOOL_PREFIX}${server}__`)))
    .map(tool => tool.name)
  const native = definitions.filter(tool => !tool.name.startsWith(MCP_TOOL_PREFIX)).map(tool => tool.name)
  return {
    allow: [...declared.length > 0 ? declared : native, ...kept],
    deny: spec.capability.tools.deny,
    skills,
  }
}

function setupFor(spec: RobotSpec, capabilities: RunCapabilities) {
  return (agentCtx: Context, _agent: Agent): void => {
    agentCtx.systemPrompt.section({ name: 'robot:mission', order: -500, text: promptText(spec) })
    const { allow, deny } = capabilities
    if (allow !== undefined) agentCtx.tools.restrict({ allow, deny })
    else if (deny.length > 0) agentCtx.tools.restrict({ deny })
    if (capabilities.skills.length > 0) {
      const skills = agentCtx.get('skills')
      /* v8 ignore next -- resolveCapabilities rejected this run before the Agent existed when no registry was mounted */
      if (skills === undefined) throw new Error('this deployment mounts no skill registry, so the selected skills cannot load')
      skills.restrict({ allow: capabilities.skills })
    }
  }
}

function outcomeOf(reason: TurnEndReason | undefined, text: string): RunOutcome {
  if (reason === undefined) return { state: 'failed', error: 'run ended without a turn result' }
  switch (reason.kind) {
    case 'completed':
      return { state: 'succeeded', output: text }
    case 'aborted':
      return { state: 'cancelled' }
    case 'error':
      return { state: 'failed', error: `${reason.error.code}: ${reason.error.message}` }
    default:
      return { state: 'failed', error: `run ended with ${reason.kind}` }
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Why a paused run stopped waiting for human input. */
type ResumeOutcome = 'resumed' | 'terminal' | 'timeout'

/**
 * Mount the queued-run executor. It scans existing queued runs on load and
 * follows `domain/changed` writes afterwards; each run drives its own Agent,
 * across as many turns as the run stays non-terminal, and records the Session
 * it runs in.
 * @param ctx - plugin context carrying the robot service and Agent factory.
 * @param config - validated run-execution limits; direct composition without a
 *   configuration gets the schema defaults.
 */
export async function apply(ctx: Context, config: Config = Config.parse({})): Promise<void> {
  await ctx.sessionProjections.register(robotRunProjectionDefinition)
  const active = new Map<RunId, AgentHandle>()
  const queued = new Set<RunId>()
  /** One resolver per run a paused executor is waiting on. */
  const stateWaiters = new Map<RunId, () => void>()

  /**
   * Wait until the run's stored state changes or the budget expires.
   * @param id - run the executor waits on.
   * @param millis - remaining wait budget.
   * @returns whether a durable run write woke the waiter.
   */
  const waitForRunWrite = (id: RunId, millis: number): Promise<boolean> => new Promise((resolve) => {
    let settled = false
    const finish = (changed: boolean): void => {
      if (settled) return
      settled = true
      stateWaiters.delete(id)
      clearTimeout(timer)
      resolve(changed)
    }
    const timer = setTimeout(() => { finish(false) }, millis)
    timer.unref()
    stateWaiters.set(id, () => { finish(true) })
  })

  /**
   * Hold a paused run open until it resumes, settles, or exhausts its wait.
   * @param id - run awaiting human input.
   * @returns whether the run resumed, settled, or timed out.
   */
  const awaitResume = async (id: RunId): Promise<ResumeOutcome> => {
    const deadline = Date.now() + config.pauseTimeoutMs
    for (;;) {
      const current = await ctx.robots.run(id)
      if (current === undefined || isTerminalRunState(current.state)) return 'terminal'
      if (current.state !== 'waiting') return 'resumed'
      const remaining = deadline - Date.now()
      if (remaining <= 0) return 'timeout'
      await waitForRunWrite(id, remaining)
    }
  }

  const execute = async (candidate: Run): Promise<void> => {
    const revision = await ctx.robots.revision(candidate.spec)
    /* v8 ignore next 4 -- the provider accepts runs only for published revisions */
    if (revision === undefined) {
      await ctx.robots.finish(candidate.id, { state: 'failed', error: 'robot specification revision is missing' })
      return
    }
    const spec = revision.spec
    const cwd = resolveWorkspaceRoot(ctx, spec)
    let capabilities: RunCapabilities
    try {
      capabilities = await resolveCapabilities(ctx, spec, cwd)
    } catch (error: unknown) {
      await ctx.robots.finish(candidate.id, { state: 'failed', error: messageOf(error) })
      return
    }
    const sessionId = candidate.sessionId ?? brandString<SessionId>(`robot-run-${randomUUID()}`)
    let handle: AgentHandle
    try {
      handle = await ctx.agents.create({
        sessionId,
        meta: { cwd },
        agentOptions: ctx.agentDefaultModel.currentSelection(),
        setup: setupFor(spec, capabilities),
      })
    } catch (error: unknown) {
      await ctx.robots.finish(candidate.id, { state: 'failed', error: messageOf(error) })
      return
    }
    await ctx.robots.attachSession(candidate.id, sessionId)
    // Log-only record: clients resolve the run's Session from this projection,
    // and the record precedes any other event so the fold starts from the link.
    appendPluginRecord(handle.agent.session, 'plugin:robot/run', { robotId: candidate.robot, runId: candidate.id })
    await ctx.sessions.flush(handle.agent.session)
    active.set(candidate.id, handle)
    const presets = ctx.get('permissionPresets')
    if (presets !== undefined) presets.set(handle.agent.session, spec.capability.permissionPreset)
    let text = ''
    let reason: TurnEndReason | undefined
    const stop = ctx.on('session/event', (session, event) => {
      if (session !== handle.agent.session) return
      if (event.type === 'assistant/message') {
        text = event.data.message.content.filter(block => block.type === 'text').map(block => block.text).join('')
      }
      if (event.type === 'turn/end') reason = event.data.reason
    })
    try {
      await ctx.robots.advance(candidate.id, 'running')
      handle.agent.followup(createUserMessage({
        content: [{ type: 'text', text: candidate.input.message }],
        source: { kind: 'user' },
      }))
      for (;;) {
        await handle.agent.whenIdle()
        await ctx.sessions.flush(handle.agent.session)
        const current = await ctx.robots.run(candidate.id)
        if (current === undefined || isTerminalRunState(current.state)) return
        if (current.state === 'waiting') {
          const resumed = await awaitResume(candidate.id)
          if (resumed === 'terminal') return
          if (resumed === 'timeout') {
            await ctx.robots.finish(candidate.id, {
              state: 'cancelled',
              error: 'the run stayed paused for human input until its wait budget expired',
            })
            return
          }
          continue
        }
        await ctx.robots.finish(candidate.id, outcomeOf(reason, text))
        return
      }
    } catch (error: unknown) {
      await ctx.robots.finish(candidate.id, { state: 'failed', error: messageOf(error) })
    } finally {
      stop()
      active.delete(candidate.id)
      stateWaiters.delete(candidate.id)
      await handle.dispose()
    }
  }

  const dispatch = (candidate: Run): void => {
    // Only a queued run needs a claim. A run the executor already reported on
    // keeps its own Agent, including across a pause.
    if (candidate.state !== 'queued' || queued.has(candidate.id)) return
    queued.add(candidate.id)
    void execute(candidate).finally(() => { queued.delete(candidate.id) })
  }

  ctx.on('domain/changed', (change) => {
    if (change.domain !== ROBOT_DOMAIN || change.table !== 'runs' || change.operation !== 'put') return
    const id = brandString<RunId>(change.key)
    const wake = stateWaiters.get(id)
    if (wake !== undefined) {
      stateWaiters.delete(id)
      wake()
    }
    void ctx.robots.run(id).then((candidate) => {
      /* v8 ignore next -- the provider never deletes a run record */
      if (candidate === undefined) return
      if (isTerminalRunState(candidate.state)) {
        const handle = active.get(id)
        if (handle !== undefined) handle.agent.cancel({ kind: 'user' })
        return
      }
      dispatch(candidate)
    })
  })

  ctx.effect(() => () => Promise.all([...active.values()].map(handle => handle.dispose())))

  void (async () => {
    for (const robot of await ctx.robots.robots()) {
      for (const candidate of await ctx.robots.runs(robot.id)) dispatch(candidate)
    }
  })()
}
