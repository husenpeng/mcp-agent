/** The recap route catalog mirrors the configured third-party providers and their models. */
import { describe, expect, it, vi } from 'vitest'
import { MuseRouteCatalog, routeOptions, type PiAiSection } from '../src/client/route-catalog.ts'

describe('routeOptions', () => {
  it('lists providers sorted by id with model ids and display names', () => {
    expect(routeOptions({
      providers: {
        zeta: { models: [{ id: 'm2', name: 'Model 2' }, { id: 'm1' }] },
        alpha: { models: [{ id: '  ', name: 'x' }, { id: 'm3', name: '  ' }] },
      },
    })).toEqual({
      providers: [
        { id: 'alpha', models: [{ id: 'm3', name: 'm3' }] },
        { id: 'zeta', models: [{ id: 'm2', name: 'Model 2' }, { id: 'm1', name: 'm1' }] },
      ],
    })
  })

  it('yields no providers without a usable section', () => {
    expect(routeOptions(undefined)).toEqual({ providers: [] })
    expect(routeOptions({})).toEqual({ providers: [] })
    expect(routeOptions({ providers: null })).toEqual({ providers: [] })
    expect(routeOptions({ providers: {} })).toEqual({ providers: [] })
  })

  it('keeps a provider that declares no models and skips a malformed model list', () => {
    expect(routeOptions({
      providers: {
        bare: {},
        malformed: { models: null },
      },
    })).toEqual({
      providers: [
        { id: 'bare', models: [] },
        { id: 'malformed', models: [] },
      ],
    })
  })
})

describe('MuseRouteCatalog', () => {
  it('mirrors section replacements and releases its subscription', () => {
    let value: PiAiSection | undefined = { providers: { blueai: { models: [{ id: 'm' }] } } }
    let listener: (() => void) | undefined
    const release = vi.fn()
    const scope = {
      getSnapshot: () => ({ value }),
      subscribe: (next: () => void) => {
        listener = next
        return release
      },
    }
    const catalog = new MuseRouteCatalog(scope)
    expect(catalog.options().getSnapshot()).toEqual({
      providers: [{ id: 'blueai', models: [{ id: 'm', name: 'm' }] }],
    })
    value = { providers: { other: { models: [] } } }
    listener?.()
    expect(catalog.options().getSnapshot()).toEqual({ providers: [{ id: 'other', models: [] }] })
    catalog.dispose()
    expect(release).toHaveBeenCalledTimes(1)
  })
})
