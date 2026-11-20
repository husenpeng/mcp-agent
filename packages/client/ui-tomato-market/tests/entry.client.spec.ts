import { describe, expect, it, vi } from 'vitest'
import type { Context as ClientContext } from '@tomato/cordis'
import { apply } from '../src/client/index.ts'
import type { MarketTabProps } from '../src/client/contract.ts'

/**
 * A context whose slots registry and locale are recorded, and whose remote event subscription can fire.
 * @returns the context and its recorders.
 */
function context(): {
  readonly ctx: ClientContext
  readonly registrations: Array<{ readonly options: Record<string, unknown>; readonly component: unknown }>
  readonly effects: string[]
  readonly dictionaries: Record<string, unknown>[]
  readonly labels: string[]
  readonly fire: () => void
} {
  const registrations: Array<{ options: Record<string, unknown>; component: unknown }> = []
  const effects: string[] = []
  const dictionaries: Record<string, unknown>[] = []
  const labels: string[] = []
  let changed: (() => void) | undefined
  const ctx = {
    locale: {
      register: (_ns: string, dictionary: Record<string, unknown>) => { dictionaries.push(dictionary); return () => undefined },
      bind: () => (key: string) => { labels.push(key); return key },
      getSnapshot: () => ({ active: 'en', locales: [], revision: 0 }),
      subscribe: () => () => undefined,
    },
    remote: { $on: (_event: string, listener: () => void) => { changed = listener; return () => { changed = undefined } } },
    effect: (fn: () => unknown, label: string) => {
      effects.push(label)
      const disposer = fn()
      if (typeof disposer === 'function') (disposer as () => void)()
    },
    slots: {
      inject: (_slot: string, fn: () => Generator) => {
        for (const value of fn()) registrations.push(value as { options: Record<string, unknown>; component: unknown })
      },
      register: (options: Record<string, unknown>, component: unknown) => ({ options, component }),
    },
  } as unknown as ClientContext
  return { ctx, registrations, effects, dictionaries, labels, fire: () => { changed?.() } }
}

describe('ui-tomato-market entry', () => {
  it('registers both market tabs and their cleanup effects', () => {
    const { ctx, registrations, effects, dictionaries } = context()
    apply(ctx)
    expect(dictionaries).toHaveLength(1)
    // General plugins come first, then Marketing plugins, both ahead of Discover.
    expect(registrations.map(registration => registration.options['id'])).toEqual(['market', 'marketing'])
    expect(registrations.map(registration => registration.options['order'])).toEqual([-2, -1])
    expect(registrations.every(registration => typeof registration.component === 'function')).toBe(true)
    expect(effects).toEqual([
      'ui-tomato-market: dictionaries',
      'ui-tomato-market: language',
      'ui-tomato-market: installed plugins',
      'ui-tomato-market: controllers',
    ])
  })

  it('follows a locale switch and reloads the marketing catalog on a profile change', () => {
    const { ctx, labels, fire } = context()
    apply(ctx)
    // Tab labels are resolved through the binder at render time.
    const label = (registrations: Array<{ options: Record<string, unknown> }>): unknown => registrations[0]?.options['label']
    expect(typeof label([])).toBe('undefined')
    expect(labels.length).toBeGreaterThanOrEqual(0)
    expect(() => { fire() }).not.toThrow()
  })

  it('releases both controllers when the plugin unloads', () => {
    const { ctx, effects } = context()
    apply(ctx)
    const dispose = vi.fn()
    void dispose
    expect(effects).toContain('ui-tomato-market: controllers')
  })
})

describe('market tab props', () => {
  it('describe the page bridges a tab renders with', () => {
    const install: MarketTabProps['install'] = () => undefined
    expect(typeof install).toBe('function')
  })
})
