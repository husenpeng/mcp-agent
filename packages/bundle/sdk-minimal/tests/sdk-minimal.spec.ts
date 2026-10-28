/** The standalone SDK-minimal bundle's complete declared Cordis tree. */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as yaml from 'js-yaml'
import { describe, expect, it } from 'vitest'
import { entryListSchema } from '@tomato/cordis-plugin-include'

function packageName(specifier: string): string {
  return specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0]!
}

describe('@tomato/sdk-minimal bundle', () => {
  it('declares one standalone allowlisted tree with every row dependency', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      tomato?: { bundle?: { patch?: string } }
    }
    expect(manifest.tomato?.bundle?.patch).toBe('./cordis.patch.yml')
    const patches = yaml.load(
      readFileSync(resolve(root, manifest.tomato!.bundle!.patch!), 'utf8'),
      { schema: entryListSchema },
    ) as Array<{ insert?: Array<{ id?: string; inject?: string[]; name?: string; config?: Record<string, unknown>; disabled?: unknown }> }>
    expect(patches).toHaveLength(1)
    const rows = patches[0]?.insert ?? []
    expect(rows.map(row => [row.id, row.name])).toEqual([
      ['sdk-app-startup', '@tomato/sdk-app'],
      ['sdk-jsonrpc-server', '@tomato/sdk-jsonrpc-server'],
      ['deepseek-llm-api-extensions', '@tomato/deepseek-llm-api-extensions'],
      ['session-log-deepseek', '@tomato/session-log-deepseek'],
      ['plugin-package-inventory-deepseek', '@tomato/plugin-package-inventory-deepseek'],
      ['llm-deepseek', '@tomato/llm-deepseek-api-key'],
      ['sandbox', '@tomato/sandbox-local'],
      ['filesystem', '@tomato/fs-local'],
      ['attachment-local', '@tomato/attachment-local'],
      ['tool-fs', '@tomato/tool-fs'],
      ['working-directory', '@tomato/working-directory'],
      ['tool-working-directory', '@tomato/tool-working-directory'],
      ['session-projection', '@tomato/session-projection'],
      ['token-meter', '@tomato/token-meter'],
      ['compaction-basic', '@tomato/compaction-basic'],
      ['image-offload', '@tomato/compaction-image-offload'],
      ['sandbox-policy', '@tomato/sandbox-policy'],
      ['subprocess', '@tomato/subprocess-local'],
      ['pty', '@tomato/terminal'],
      ['terminal-bash', '@tomato/terminal-bash'],
      ['terminal-pwsh', '@tomato/terminal-bash'],
      ['timer', '@tomato/cordis-plugin-timer'],
      ['llm', '@tomato/llm'],
      ['session', '@tomato/session'],
      ['session-title', '@tomato/session-title'],
      ['system-prompt', '@tomato/system-prompt'],
      ['tools', '@tomato/tools'],
      ['tool-executor-native', '@tomato/tool-executor-native'],
      ['mcp-resources', '@tomato/mcp-resources'],
      ['agent', '@tomato/agent'],
      ['llm-retry', '@tomato/llm-retry'],
      ['jobs', '@tomato/jobs-local'],
      ['agent-loop', '@tomato/agent-loop'],
      ['persistent-bash', '@tomato/tool-bash-persistent'],
      ['persistent-pwsh', '@tomato/tool-pwsh-persistent'],
      ['sessions', '@tomato/session-persistence-jsonl'],
      ['session-checkpoint-policy', '@tomato/session-checkpoint-policy'],
    ])
    expect(rows.find(row => row.id === 'sdk-app-startup')?.config).toEqual({ profile: 'sdk-minimal' })
    expect(rows.find(row => row.id === 'sdk-jsonrpc-server')).toMatchObject({
      inject: ['sdkAppStartup', 'loader'],
      config: { maxTokensAsSuccess: false },
    })
    expect(rows.find(row => row.id === 'llm-deepseek')?.config).toEqual({
      apiKeyEnv: 'DEEPSEEK_API_KEY',
      defaultContextWindow: { __jsExpr: 'Number(process.env.TOMATO_CONTEXT_WINDOW ?? 1000000)' },
      streamIdleTimeoutMs: 172800000,
    })
    expect(rows.find(row => row.id === 'system-prompt')?.config).toEqual({
      includeHarnessIdentity: false,
      includeRuntimeContext: false,
      personaPrefix: { __jsExpr: "process.env.TOMATO_SYSTEM_PROMPT ?? 'You are a helpful software engineer assistant.'" },
    })
    expect(rows.find(row => row.id === 'agent-loop')?.config).toEqual({ agents: [] })
    expect(rows.find(row => row.id === 'tool-fs')?.config).toEqual({ read: false, readImage: true, write: false, edit: false })
    expect(rows.find(row => row.id === 'compaction-basic')?.config).toBeUndefined()
    expect(rows.find(row => row.id === 'terminal-bash')).toMatchObject({
      disabled: { __jsExpr: "process.platform === 'win32'" },
    })
    expect(rows.find(row => row.id === 'terminal-pwsh')).toMatchObject({
      disabled: { __jsExpr: "process.platform !== 'win32'" },
      config: { shellDialect: 'pwsh', timeoutMs: 300000 },
    })
    expect(Object.keys(manifest.dependencies ?? {}).sort()).toEqual(
      [...new Set(rows.map(row => row.name).filter((name): name is string => name !== undefined).map(packageName))].sort(),
    )
  })
})
