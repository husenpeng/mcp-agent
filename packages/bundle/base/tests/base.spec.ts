/**
 * The bundle's substance is its patch file: the `tomato.bundle.patch` manifest
 * field must name a real, parseable patch list.
 */

import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import * as yaml from 'js-yaml'
import { Context } from '@tomato/cordis'
import LlmRuntime, { createUserMessage } from '@tomato/llm'
import * as LlmPiAi from '@tomato/llm-pi-ai'
import { entryListSchema } from '@tomato/cordis-plugin-include'
import { evaluate } from '@tomato/cordis-plugin-loader'

describe('@tomato/base bundle', () => {
  it('declares a parseable patch list through the tomato.bundle.patch manifest field', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const manifest = JSON.parse(
      readFileSync(resolve(root, 'package.json'), 'utf8'),
    ) as {
      dependencies?: Record<string, string>
      tomato?: { bundle?: { patch?: string } }
    }
    expect(manifest.tomato?.bundle?.patch).toBe('./cordis.patch.yml')
    const parsed = yaml.load(
      readFileSync(resolve(root, manifest.tomato!.bundle!.patch!), 'utf8'),
      { schema: entryListSchema },
    )
    expect(Array.isArray(parsed)).toBe(true)
    // The base layer is one insert list over the empty profile root.
    const rows = (parsed as { insert?: { id?: string; config?: Record<string, unknown>; disabled?: boolean }[] }[]).flatMap(
      patch => patch.insert ?? [],
    )
    expect(rows.length).toBeGreaterThan(50)
    expect(rows.some(row => row.id === 'agent-loop')).toBe(true)
    // Tomato's own OTLP reporter replaces the official session-log channel.
    expect(rows.find(row => row.id === 'session-telemetry-otel')?.disabled).toBe(true)
    expect(rows.find(row => row.id === 'hmr')).toMatchObject({
      config: { root: [] },
    })
    expect(rows.filter(row => row.id === 'subagent-codex')).toHaveLength(0)
    expect(rows.filter(row => row.id === 'subagent-claude-code')).toHaveLength(0)
    expect(rows.find(row => row.id === 'web')?.config).toMatchObject({ fetchProvider: 'company' })
    expect(rows.find(row => row.id === 'web-fetch-http')).toBeDefined()
    expect(rows.find(row => row.id === 'tool-web')?.config).toMatchObject({ fetch: true })
    expect(manifest.dependencies).not.toHaveProperty('@tomato/subagent-codex')
    expect(manifest.dependencies).not.toHaveProperty('@tomato/subagent-claude-code')
    expect(manifest.dependencies).toHaveProperty('@tomato/web-fetch-http')
  })

  it('resolves the packaged protected-read roots from the shell environment', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const parsed = yaml.load(
      readFileSync(resolve(root, 'cordis.patch.yml'), 'utf8'),
      { schema: entryListSchema },
    )
    if (!Array.isArray(parsed)) throw new TypeError('base patch must parse to a patch list')
    const rows = parsed.flatMap((patch): Record<string, unknown>[] =>
      typeof patch === 'object' && patch !== null
        ? (patch as { insert?: Record<string, unknown>[] }).insert ?? []
        : [],
    )
    const config = rows.find(row => row.id === 'sandbox-policy')?.config as
      { protectedReadRoots?: { __jsExpr?: string } } | undefined
    const expression = config?.protectedReadRoots?.__jsExpr
    if (expression === undefined) throw new Error('sandbox-policy protectedReadRoots must be a !!js expression')
    // An unpackaged launch leaves the variable unset, keeping the schema default.
    expect(evaluate({ process: { env: {} } }, expression)).toBeUndefined()
    expect(evaluate({ process: { env: { TOMATO_PROTECTED_READ_ROOTS: '["/install/app.asar"]' } } }, expression))
      .toEqual(['/install/app.asar'])
  })

  it('gates each shell stack by platform with a symmetric disabled expression', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const parsed = yaml.load(
      readFileSync(resolve(root, 'cordis.patch.yml'), 'utf8'),
      { schema: entryListSchema },
    )
    if (!Array.isArray(parsed)) throw new TypeError('base patch must parse to a patch list')
    const rows = parsed.flatMap((patch): Record<string, unknown>[] =>
      typeof patch === 'object' && patch !== null
        ? (patch as { insert?: Record<string, unknown>[] }).insert ?? []
        : [],
    )
    // Symmetric gating: each stack's executor and tool rows carry the same
    // platform fact, inverted between the bash and pwsh twins, so exactly one
    // shell stack mounts per host. Evaluate with a platform-scoped context
    // (the `with` scope shadows the global `process`) so both outcomes pin on
    // every host.
    for (const [id, win32, linux] of [
      ['bash-sandbox', true, false],
      ['tool-bash', true, false],
      ['pwsh-sandbox', false, true],
      ['tool-pwsh', false, true],
    ] as const) {
      const row = rows.find(candidate => candidate.id === id)
      if (row === undefined) throw new Error(`base patch must mount ${id}`)
      const expression = (row.disabled as { __jsExpr?: string } | undefined)?.__jsExpr
      if (expression === undefined) throw new Error(`${id} must gate on a !!js disabled expression`)
      expect(Boolean(evaluate({ process: { platform: 'win32' } }, expression)), `${id} on win32`).toBe(win32)
      expect(Boolean(evaluate({ process: { platform: 'linux' } }, expression)), `${id} on linux`).toBe(linux)
    }
    // The platform layer folded into these rows: no separate patch file ships.
    expect(existsSync(resolve(root, 'windows.cordis.patch.yml'))).toBe(false)
  })

  it('ships a default Claude route whose models inherit catalog capacities and efforts', async () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const parsed = yaml.load(
      readFileSync(resolve(root, 'cordis.patch.yml'), 'utf8'),
      { schema: entryListSchema },
    )
    if (!Array.isArray(parsed)) throw new TypeError('base patch must parse to a patch list')
    const rows = parsed.flatMap((patch): { id?: string; config?: Record<string, unknown> }[] =>
      typeof patch === 'object' && patch !== null
        ? (patch as { insert?: { id?: string; config?: Record<string, unknown> }[] }).insert ?? []
        : [],
    )
    expect(rows.find(row => row.id === 'agent-default-model')?.config)
      .toEqual({ provider: 'blueai-anthropic', model: 'claude-opus-5-5', reasoningEffort: 'high' })
    const piAi = rows.find(row => row.id === 'llm-pi-ai')?.config as LlmPiAi.Options | undefined
    if (piAi === undefined) throw new Error('base patch must configure llm-pi-ai')
    // The package names the credential reference, never the key.
    expect(piAi.providers?.['blueai-anthropic']).toMatchObject({ apiKeyEnv: 'BLUEAI_API_KEY', api: 'anthropic-messages' })

    const ctx = new Context()
    try {
      await ctx.plugin(LlmRuntime)
      await ctx.plugin(LlmPiAi, piAi)
      await vi.waitFor(() => {
        expect(ctx.llm.listProviders().map(provider => provider.id)).toContain('blueai-anthropic')
      })
      // The shipped row names only the id; capacities, modalities, and
      // efforts come from the first-party catalog entry.
      const info = await ctx.llm.resolveModelInfo('blueai-anthropic', 'claude-opus-5-5')
      expect(info).toMatchObject({
        id: 'claude-opus-5-5',
        inputModalities: ['text', 'image'],
        context: { contextWindow: 1_000_000 },
      })
      expect(info.reasoning?.efforts.map(effort => effort.id)).toContain('high')
    }
    finally {
      await ctx.fiber.dispose()
    }
  })

  it('marks the last user block of a shipped-route request for prompt caching', async () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const parsed = yaml.load(
      readFileSync(resolve(root, 'cordis.patch.yml'), 'utf8'),
      { schema: entryListSchema },
    )
    if (!Array.isArray(parsed)) throw new TypeError('base patch must parse to a patch list')
    const rows = parsed.flatMap((patch): { id?: string; config?: Record<string, unknown> }[] =>
      typeof patch === 'object' && patch !== null
        ? (patch as { insert?: { id?: string; config?: Record<string, unknown> }[] }).insert ?? []
        : [],
    )
    const shipped = (rows.find(row => row.id === 'llm-pi-ai')?.config as LlmPiAi.Options).providers!['blueai-anthropic']!
    // Only the endpoint is replaced; protocol, cache retention, and the
    // id-only model entry stay exactly as shipped.
    const bodies: Record<string, unknown>[] = []
    const server = createServer((request, response) => {
      let text = ''
      request.on('data', (chunk: Buffer) => { text += chunk.toString() })
      request.on('end', () => {
        bodies.push(JSON.parse(text) as Record<string, unknown>)
        response.writeHead(200, { 'content-type': 'text/event-stream' })
        for (const frame of [
          { type: 'message_start', message: { id: 'msg', role: 'assistant', model: 'claude-opus-5-5', content: [], stop_reason: null,
            usage: { input_tokens: 5, output_tokens: 0 } } },
          { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
          { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'ok' } },
          { type: 'content_block_stop', index: 0 },
          { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 1 } },
          { type: 'message_stop' },
        ]) response.write(`event: ${frame.type}\ndata: ${JSON.stringify(frame)}\n\n`)
        response.end()
      })
    })
    await new Promise<void>((resolve) => { server.listen(0, '127.0.0.1', resolve) })
    const address = server.address() as { port: number }
    vi.stubEnv('BLUEAI_API_KEY', 'shipped-route-key')
    const ctx = new Context()
    try {
      await ctx.plugin(LlmRuntime)
      await ctx.plugin(LlmPiAi, {
        providers: { 'blueai-anthropic': { ...shipped, baseURL: `http://127.0.0.1:${address.port}` } },
      })
      await vi.waitFor(() => {
        expect(ctx.llm.listProviders().map(provider => provider.id)).toContain('blueai-anthropic')
      })
      for await (const _chunk of ctx.llm.stream({
        provider: 'blueai-anthropic',
        model: 'claude-opus-5-5',
        messages: [createUserMessage({ content: [{ type: 'text', text: 'hi' }], source: { kind: 'test' } })],
      })) { /* drain */ }

      // Without the breakpoint the relay bills the whole history as uncached
      // input on every step.
      const body = bodies[0] as { messages?: { role: string; content?: unknown }[] }
      const lastUser = body.messages?.findLast(message => message.role === 'user')
      expect(lastUser?.content).toMatchObject([{ type: 'text', text: 'hi', cache_control: { type: 'ephemeral' } }])
    }
    finally {
      await ctx.fiber.dispose()
      vi.unstubAllEnvs()
      await new Promise<void>((resolve) => { server.close(() => { resolve() }) })
    }
  })
})
