/**
 * Executes queued robot runs through one composed Agent per run. It reacts to
 * durable run writes, assembles the specification into the Agent scope, drives
 * one turn, and records the outcome through `ctx.robots.finish`.
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
import type {} from '@tomato/permission-presets'
import { appendPluginRecord } from '@tomato/session'
import type { SessionEvent, SessionId } from '@tomato/session'
import type {} from '@tomato/storage-domain'
import type {} from '@tomato/system-prompt'
import type {} from '@tomato/tools'
import { robotRunProjectionDefinition } from './projection.ts'

/** Stable Cordis plugin name. */
export const name = 'robot-runtime'

/** Services required before queued runs can execute. */
export const inject = ['agentDefaultModel', 'agents', 'robots', 'sessionProjections', 'sessions']

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

function setupFor(spec: RobotSpec) {
  return (agentCtx: Context, _agent: Agent): void => {
    agentCtx.systemPrompt.section({ name: 'robot:mission', order: -500, text: promptText(spec) })
    const { allow, deny } = spec.capability.tools
    if (allow.length > 0) agentCtx.tools.restrict({ allow, deny })
    else if (deny.length > 0) agentCtx.tools.restrict({ deny })
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

/**
 * Mount the queued-run executor. It scans existing queued runs on load and
 * follows `domain/changed` writes afterwards; each run drives its own Agent and
 * records the Session it runs in.
 * @param ctx - plugin context carrying the robot service and Agent factory.
 */
export async function apply(ctx: Context): Promise<void> {
  await ctx.sessionProjections.register(robotRunProjectionDefinition)
  const active = new Map<RunId, AgentHandle>()
  const queued = new Set<RunId>()

  const execute = async (candidate: Run): Promise<void> => {
    const revision = await ctx.robots.revision(candidate.spec)
    /* v8 ignore next 4 -- the provider accepts runs only for published revisions */
    if (revision === undefined) {
      await ctx.robots.finish(candidate.id, { state: 'failed', error: 'robot specification revision is missing' })
      return
    }
    const spec = revision.spec
    const cwd = spec.capability.workspaceRoots[0]
    const sessionId = candidate.sessionId ?? brandString<SessionId>(`robot-run-${randomUUID()}`)
    let handle: AgentHandle
    try {
      handle = await ctx.agents.create({
        sessionId,
        ...(cwd === undefined ? {} : { meta: { cwd } }),
        agentOptions: ctx.agentDefaultModel.currentSelection(),
        setup: setupFor(spec),
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
      handle.agent.followup(createUserMessage({
        content: [{ type: 'text', text: candidate.input.message }],
        source: { kind: 'user' },
      }))
      await handle.agent.whenIdle()
      await ctx.sessions.flush(handle.agent.session)
      await ctx.robots.finish(candidate.id, outcomeOf(reason, text))
    } catch (error: unknown) {
      await ctx.robots.finish(candidate.id, { state: 'failed', error: messageOf(error) })
    } finally {
      stop()
      active.delete(candidate.id)
      await handle.dispose()
    }
  }

  const dispatch = (candidate: Run): void => {
    if (candidate.state !== 'queued' || queued.has(candidate.id)) return
    queued.add(candidate.id)
    void execute(candidate).finally(() => { queued.delete(candidate.id) })
  }

  ctx.on('domain/changed', (change) => {
    if (change.domain !== ROBOT_DOMAIN || change.table !== 'runs' || change.operation !== 'put') return
    const id = brandString<RunId>(change.key)
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
