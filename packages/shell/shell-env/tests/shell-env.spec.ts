/**
 * Registry tests for `@tomato/shell-env`: built-in facts, contributor
 * ownership and validation, collection ordering, effect-scoped disposal, and
 * the explicit disposer contract.
 */

import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@tomato/cordis'
import { ToolCallId } from '@tomato/llm'
import type { Agent } from '@tomato/agent'
import { SESSION_FORMAT_VERSION } from '@tomato/session'
import type { ToolExecution } from '@tomato/tools'
import { ShellEnvRegistry } from '@tomato/shell-env'
import * as BashEnvPlugin from '@tomato/shell-env'

const testToolSignal = new AbortController().signal

afterEach(() => vi.unstubAllEnvs())

function execution(sessionId?: string): ToolExecution {
  return {
    signal: testToolSignal,
    token: Symbol('bash-env-test') as ToolExecution['token'],
    callId: ToolCallId('bash-env-call'),
    rootCallId: ToolCallId('bash-env-call'),
    name: 'bash',
    arguments: { command: 'true' },
    ...(sessionId === undefined
      ? {}
      : {
        agent: {
          session: {
            header: { version: SESSION_FORMAT_VERSION, id: sessionId, createdAt: 0, isSeeded: false },
          },
        } as unknown as Agent,
      }),
  }
}

describe('ShellEnvRegistry', () => {
  it('collects unconditional shell facts and the current agent session id', () => {
    const ctx = new Context()
    const registry = new ShellEnvRegistry(ctx, { tomatoHome: './test-tomato-home' })

    expect(registry.collect(execution())).toEqual({
      TOMATO_HOME: resolve('./test-tomato-home'),
      TOMATO_SHELL: '1',
    })
    expect(registry.collect(execution('session-a'))).toEqual({
      TOMATO_HOME: resolve('./test-tomato-home'),
      TOMATO_SESSION_ID: 'session-a',
      TOMATO_SHELL: '1',
    })
  })

  it('collects the launcher-provided profile name and directory when a profile context exists', () => {
    const ctx = new Context()
    ctx.provide('profileContext', {
      name: 'web', dir: '/profiles/web', patchPath: '/profiles/web/cordis.patch.yml', installAnchor: '/tomato/package.json',
      cwd: '/work', home: '/home', startedBundles: [], overlays: [], telemetryDisabledEnv: undefined,
    })
    const registry = new ShellEnvRegistry(ctx, { tomatoHome: './test-tomato-home' })
    expect(registry.collect(execution())).toMatchObject({ TOMATO_PROFILE: 'web', TOMATO_PROFILE_DIR: '/profiles/web' })
    expect(() => registry.register({
      name: 'profile-claimer',
      variables: { TOMATO_PROFILE: { description: 'Reserved key.' } },
      resolve: () => ({}),
    })).toThrow(/reserved key "TOMATO_PROFILE"/)
  })

  it('resolves TOMATO_HOME from the ambient override or the user-home default', () => {
    vi.stubEnv('TOMATO_HOME', './ambient-tomato-home')
    const fromEnvironment = new ShellEnvRegistry(new Context())
    expect(fromEnvironment.collect(execution()).TOMATO_HOME).toBe(resolve('./ambient-tomato-home'))

    vi.stubEnv('TOMATO_HOME', undefined)
    const fromDefault = new ShellEnvRegistry(new Context())
    expect(fromDefault.collect(execution()).TOMATO_HOME).toBe(join(homedir(), '.tomato'))
  })

  it('collects declared contributor variables and omits unavailable values', () => {
    const ctx = new Context()
    const registry = new ShellEnvRegistry(ctx, { tomatoHome: './test-tomato-home' })
    registry.register({
      name: 'optional-session-fact',
      variables: {
        TOMATO_SESSION_OPTIONAL: { description: 'Optional session-scoped test fact.' },
      },
      resolve: exec => exec.agent === undefined ? {} : { TOMATO_SESSION_OPTIONAL: exec.agent.session.header.id },
    })
    registry.register({
      name: 'always-available-fact',
      variables: {
        TOMATO_ALWAYS_AVAILABLE: { description: 'Always-available test fact.' },
      },
      resolve: () => ({ TOMATO_ALWAYS_AVAILABLE: 'yes' }),
    })

    expect(registry.collect(execution())).not.toHaveProperty('TOMATO_SESSION_OPTIONAL')
    expect(registry.collect(execution()).TOMATO_ALWAYS_AVAILABLE).toBe('yes')
    expect(registry.collect(execution('session-b')).TOMATO_SESSION_OPTIONAL).toBe('session-b')
    expect(registry.list()).toEqual([
      {
        contributor: 'always-available-fact',
        description: 'Always-available test fact.',
        key: 'TOMATO_ALWAYS_AVAILABLE',
      },
      {
        contributor: 'optional-session-fact',
        description: 'Optional session-scoped test fact.',
        key: 'TOMATO_SESSION_OPTIONAL',
      },
    ])
  })

  it('rejects duplicate variable ownership at registration time', () => {
    const ctx = new Context()
    const registry = new ShellEnvRegistry(ctx, { tomatoHome: './test-tomato-home' })
    registry.register({
      name: 'first',
      variables: { TOMATO_SHARED: { description: 'First owner.' } },
      resolve: () => ({ TOMATO_SHARED: 'first' }),
    })

    expect(() => registry.register({
      name: 'second',
      variables: { TOMATO_SHARED: { description: 'Second owner.' } },
      resolve: () => ({ TOMATO_SHARED: 'second' }),
    })).toThrow(/TOMATO_SHARED.*first.*second|TOMATO_SHARED.*second.*first/)
  })

  it('rejects duplicate contributor names and malformed declarations', () => {
    const registry = new ShellEnvRegistry(new Context(), { tomatoHome: './test-tomato-home' })
    registry.register({
      name: 'declared',
      variables: { TOMATO_DECLARED: { description: 'Declared fact.' } },
      resolve: () => ({}),
    })

    expect(() => registry.register({
      name: 'declared',
      variables: { TOMATO_ANOTHER: { description: 'Another fact.' } },
      resolve: () => ({}),
    })).toThrow(/already registered/)
    expect(() => registry.register({
      name: ' ',
      variables: { TOMATO_BLANK_NAME: { description: 'Blank owner.' } },
      resolve: () => ({}),
    })).toThrow(/name must be non-empty/)
    expect(() => registry.register({
      name: 'invalid-key',
      variables: { dsh_invalid: { description: 'Invalid key.' } } as unknown as Record<'TOMATO_INVALID', { description: string }>,
      resolve: () => ({}),
    })).toThrow(/invalid key/)
    expect(() => registry.register({
      name: 'reserved-key',
      variables: { TOMATO_HOME: { description: 'Reserved key.' } },
      resolve: () => ({}),
    })).toThrow(/reserved key/)
    expect(() => registry.register({
      name: 'blank-description',
      variables: { TOMATO_BLANK_DESCRIPTION: { description: ' ' } },
      resolve: () => ({}),
    })).toThrow(/must describe/)
  })

  it('rejects undeclared variables returned by a contributor', () => {
    const ctx = new Context()
    const registry = new ShellEnvRegistry(ctx, { tomatoHome: './test-tomato-home' })
    registry.register({
      name: 'drifted-provider',
      variables: { TOMATO_DECLARED: { description: 'Declared fact.' } },
      resolve: () => ({ TOMATO_UNDECLARED: 'bad' }),
    })

    expect(() => registry.collect(execution())).toThrow(/drifted-provider.*TOMATO_UNDECLARED/)
  })

  it('rejects non-string values returned by a contributor', () => {
    const registry = new ShellEnvRegistry(new Context(), { tomatoHome: './test-tomato-home' })
    registry.register({
      name: 'wrong-value-type',
      variables: { TOMATO_STRING: { description: 'String fact.' } },
      resolve: () => ({ TOMATO_STRING: 42 }) as unknown as Record<'TOMATO_STRING', string>,
    })

    expect(() => registry.collect(execution())).toThrow(/wrong-value-type.*non-string.*TOMATO_STRING/)
  })

  it('removes an effect-scoped contributor when its plugin is disposed', async () => {
    const ctx = new Context()
    const registry = new ShellEnvRegistry(ctx, { tomatoHome: './test-tomato-home' })
    const fiber = await ctx.plugin({
      inject: ['shellEnv'],
      apply(inner: Context) {
        inner.shellEnv.register({
          name: 'temporary',
          variables: { TOMATO_TEMPORARY: { description: 'Temporary fact.' } },
          resolve: () => ({ TOMATO_TEMPORARY: 'present' }),
        })
      },
    })

    expect(registry.collect(execution()).TOMATO_TEMPORARY).toBe('present')
    await fiber.dispose()
    expect(registry.collect(execution())).not.toHaveProperty('TOMATO_TEMPORARY')
  })

  it('returns an explicit contributor disposer', () => {
    const registry = new ShellEnvRegistry(new Context(), { tomatoHome: './test-tomato-home' })
    const dispose = registry.register({
      name: 'explicit-disposal',
      variables: { TOMATO_EXPLICIT_DISPOSAL: { description: 'Explicitly disposed fact.' } },
      resolve: () => ({ TOMATO_EXPLICIT_DISPOSAL: 'present' }),
    })

    expect(registry.collect(execution()).TOMATO_EXPLICIT_DISPOSAL).toBe('present')
    dispose()
    expect(registry.collect(execution())).not.toHaveProperty('TOMATO_EXPLICIT_DISPOSAL')
  })

  it('the plugin registers the service with no contributors on load', async () => {
    const ctx = new Context()
    await ctx.plugin(BashEnvPlugin)
    expect(ctx.shellEnv).toBeInstanceOf(ShellEnvRegistry)
    expect(ctx.shellEnv.list()).toEqual([])
  })
})
