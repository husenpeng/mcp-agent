import { executeToolFixture } from '@tomato/tool-testkit'
import * as NativeToolExecutor from '@tomato/tool-executor-native'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { unsupportedModel, provideWorkingDirectoryFixture, unsupportedInbox } from '@tomato/agent-loop-testkit'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@tomato/cordis'
import Loader from '@tomato/cordis-plugin-loader'
import Include from '@tomato/cordis-plugin-include'
import { ToolCallId } from '@tomato/llm'
import { Session, SessionId } from '@tomato/session'
import AgentRegistry from '@tomato/agent'
import type { Agent } from '@tomato/agent'
import SystemPrompt from '@tomato/system-prompt'
import ToolRuntime from '@tomato/tools'
import TerminalSessionService from '@tomato/terminal'
import SandboxProvider from '@tomato/sandbox'
import type { ConfinedArgv, SandboxPolicy } from '@tomato/sandbox'
import SandboxPolicyService from '@tomato/sandbox-policy'
import SessionProjectionRegistry from '@tomato/session-projection'
import LocalSubprocessRuntime from '@tomato/subprocess-local'
import * as TerminalLocal from '@tomato/terminal-bash'
import * as ToolPty from '@tomato/tool-terminal'

let root: string | undefined
let context: Context | undefined

afterEach(async () => {
  await context?.fiber.dispose()
  context = undefined
  if (root !== undefined) await rm(root, { recursive: true, force: true })
  root = undefined
})

class PassthroughSandbox extends SandboxProvider {
  async confine(argv: readonly string[], _policy: SandboxPolicy): Promise<ConfinedArgv> {
    return { argv: [...argv], enforcement: 'full', denialSignatures: [], runnerFailureRules: [] }
  }
}

async function agent(ctx: Context): Promise<Agent> {
  const scope = ctx.plugin(() => {})
  const id = SessionId('pty-loader-agent')
  const session = Session.create(id)
  const value: Agent = {
    id, options: {}, session, model: unsupportedModel(),
    inbox: unsupportedInbox(),
    status: 'idle',
    ctx: scope.ctx,
    send: () => {},
    followup: () => {}, steer: () => {}, inject: () => {}, cancel() {},
    runMaintenance: job => job(new AbortController().signal),
    whenIdle: () => Promise.resolve(),
  }
  await ctx.agents.register(value)
  return value
}

function resultText(result: { content: { type: string; text?: string }[] }): string {
  return result.content.filter(block => block.type === 'text').map(block => block.text).join('')
}

const suite = process.platform === 'linux' || process.platform === 'darwin' ? describe : describe.skip

suite('terminal real Loader composition through cordis.yml', () => {
  it('boots cordis.yml and preserves shell state across real tool calls', async () => {
    root = await mkdtemp(join(tmpdir(), 'tomato-pty-loader-'))
    const configPath = join(root, 'cordis.yml')
    await writeFile(configPath, [
      "- name: '@tomato/agent'",
      "- name: '@tomato/system-prompt'",
      "- name: '@tomato/tools'",
      "- name: '@tomato/tool-executor-native'",
      "- name: '@tomato/terminal'",
      "- name: '@tomato/test-sandbox'",
      "- name: '@tomato/session-projection'",
      "- name: '@tomato/sandbox-policy'",
      '  config:',
      '    mode: danger-full-access',
      `    workspaceRoot: ${JSON.stringify(root)}`,
      "- name: '@tomato/subprocess-local'",
      "- name: '@tomato/terminal-bash'",
      '  config:',
      '    pollIntervalMs: 10',
      '    exactProbeAfterMs: 20',
      '    idleSilenceMs: 250',
      '    handoffGraceMs: 250',
      '    timeoutMs: 2000',
      '    disposeGraceMs: 500',
      "- name: '@tomato/tool-terminal'",
      '',
    ].join('\n'))

    context = new Context()

    provideWorkingDirectoryFixture(context)
    context.baseUrl = pathToFileURL(root).href + '/'
    await context.plugin(Loader)
    context.loader.builtins.include = Include
    const modules = new Map<string, unknown>([
      ['@tomato/agent', AgentRegistry],
      ['@tomato/system-prompt', SystemPrompt],
      ['@tomato/tools', ToolRuntime],
      ['@tomato/tool-executor-native', NativeToolExecutor],
      ['@tomato/terminal', TerminalSessionService],
      ['@tomato/test-sandbox', PassthroughSandbox],
      ['@tomato/session-projection', SessionProjectionRegistry],
      ['@tomato/sandbox-policy', SandboxPolicyService],
      ['@tomato/subprocess-local', LocalSubprocessRuntime],
      ['@tomato/terminal-bash', TerminalLocal],
      ['@tomato/tool-terminal', ToolPty],
    ])
    context.loader.internal = {
      version: 'v2',
      async import(specifier: string) {
        if (!modules.has(specifier)) throw new Error(`unexpected Loader import: ${specifier}`)
        return modules.get(specifier)
      },
    } as unknown as NonNullable<typeof context.loader.internal>
    await context.loader.create({ name: 'cordis:include', config: { path: pathToFileURL(configPath).href } })
    await context.loader.await()

    const owner = await agent(context)
    const signal = new AbortController().signal
    const spawn = await executeToolFixture(context, {
      signal, callId: ToolCallId('spawn'), name: 'terminal_open', arguments: { type: 'shell', name: 'main', cwd: root }, agent: owner,
    })
    expect(resultText(spawn)).toContain('started terminal session pty-1 (main)')

    await executeToolFixture(context, {
      signal, callId: ToolCallId('state'), name: 'terminal_send', arguments: { sessionId: 'pty-1', text: 'export KEEP=loader; cd /' }, agent: owner,
    })
    const read = await executeToolFixture(context, {
      signal, callId: ToolCallId('read'), name: 'terminal_send', arguments: { sessionId: 'pty-1', text: 'printf "cwd=%s keep=%s\\n" "$PWD" "$KEEP"' }, agent: owner,
    })
    expect(resultText(read)).toContain('cwd=/ keep=loader')
    expect(context.terminals.list(owner)).toHaveLength(1)
  }, 15_000)
})
