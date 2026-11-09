// @vitest-environment jsdom
/** The Muse insights row's configuration page: every policy field, its staged route, and the save control. */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { bindSnapshotSelector } from '@tomato/client-test-runtime'
import { createSnapshotStore } from '@tomato/client-store'
import type { SettingsFieldState, SettingsFormShell } from '@tomato/client-ui-primitives'
import { MuseInsightsConfigPage, type MuseInsightsConfigPageProps } from '../src/client/ConfigPage.tsx'
import { CONFIG_FIELDS, type MuseInsightsConfigState } from '../src/client/config-form.ts'
import { en } from '../src/client/locales.ts'
import type { RouteOptions } from '../src/client/route-catalog.ts'

afterEach(cleanup)

const t = (key: keyof typeof en) => en[key]

const settled: SettingsFormShell = { available: true, writable: true, dirty: false, invalid: false, saving: false, failed: false }

const routes: RouteOptions = {
  providers: [
    { id: 'blueai', models: [{ id: 'DeepSeek-V4.1-Flash-1017', name: 'DeepSeek V4.1 Flash' }] },
    { id: 'blueai-anthropic', models: [{ id: 'claude-opus-5-5', name: 'Claude Opus 5.5' }] },
    { id: 'bare', models: [] },
  ],
}

function field(text: string, rest: Partial<SettingsFieldState> = {}): SettingsFieldState {
  return { text, overridden: false, invalid: false, ...rest }
}

function state(rest: Partial<MuseInsightsConfigState> = {}): MuseInsightsConfigState {
  const numbers = Object.fromEntries(CONFIG_FIELDS.map(name => [name, field(name === 'provider' || name === 'model' ? '' : '30')]))
  return {
    ...settled,
    ...numbers,
    recapNoticeMinutes: field('240', { overridden: true }),
    summaryIntervalMinutes: field('120'),
    provider: field('blueai'),
    model: field('DeepSeek-V4.1-Flash-1017'),
    ...rest,
  } as MuseInsightsConfigState
}

function pageActions() {
  return { edit: vi.fn(), resetField: vi.fn(), save: vi.fn(), discard: vi.fn() }
}

function renderPage(value: Partial<MuseInsightsConfigState> = {}) {
  const store = createSnapshotStore<MuseInsightsConfigState>(state(value))
  const routeStore = createSnapshotStore<RouteOptions>(routes)
  const actions = pageActions()
  const props = {
    ...actions,
    view: 'page',
    t,
    useConfig: bindSnapshotSelector(store),
    useRoutes: bindSnapshotSelector(routeStore),
  } as MuseInsightsConfigPageProps
  render(<MuseInsightsConfigPage {...props} />)
  return actions
}

describe('MuseInsightsConfigPage', () => {
  it('renders every policy field under its section', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: en['config.rhythm'] })).toBeTruthy()
    expect(screen.getByRole('heading', { name: en['config.evidence'] })).toBeTruthy()
    expect(screen.getByRole('heading', { name: en['config.modelSection'] })).toBeTruthy()
    expect(screen.getByRole('heading', { name: en['config.retention'] })).toBeTruthy()
    for (const name of CONFIG_FIELDS) {
      expect(screen.getByLabelText(en[`config.${name}` as keyof typeof en])).toBeTruthy()
    }
  })

  it('shows the served values and offers the configured routes', () => {
    renderPage()

    expect(screen.getByLabelText(en['config.recapNoticeMinutes'])).toHaveProperty('value', '240')
    expect(screen.getByLabelText(en['config.summaryIntervalMinutes'])).toHaveProperty('value', '120')
    const provider = screen.getByLabelText(en['config.provider']) as HTMLSelectElement
    expect([...provider.options].map(option => option.value)).toEqual(['blueai', 'blueai-anthropic', 'bare'])
    expect(provider.value).toBe('blueai')
    const model = screen.getByLabelText(en['config.model']) as HTMLSelectElement
    expect([...model.options].map(option => option.value)).toEqual(['DeepSeek-V4.1-Flash-1017'])
    expect(model.value).toBe('DeepSeek-V4.1-Flash-1017')
  })

  it('keeps a stored route the catalog does not list as a selectable value', () => {
    renderPage({ provider: field('custom-gateway'), model: field('my-model') })

    const provider = screen.getByLabelText(en['config.provider']) as HTMLSelectElement
    expect([...provider.options].map(option => option.value)).toContain('custom-gateway')
    expect(provider.value).toBe('custom-gateway')
    const model = screen.getByLabelText(en['config.model']) as HTMLSelectElement
    expect([...model.options].map(option => option.value)).toContain('my-model')
    expect(model.value).toBe('my-model')
  })

  it('stages a model change and its reset', () => {
    const actions = renderPage({
      dirty: true,
      provider: field('blueai', { overridden: true }),
      model: field('DeepSeek-V4.1-Flash-1017', { overridden: true }),
    })

    fireEvent.change(screen.getByLabelText(en['config.model']), { target: { value: 'DeepSeek-V4.1-Flash-1017' } })
    expect(actions.edit).toHaveBeenCalledWith('model', 'DeepSeek-V4.1-Flash-1017')
    fireEvent.click(screen.getAllByRole('button', { name: en['config.reset'] })[2]!)
    expect(actions.resetField).toHaveBeenCalledWith('model')
  })

  it('leaves the model unset when the chosen provider declares none', () => {
    const actions = renderPage({ dirty: true })

    fireEvent.change(screen.getByLabelText(en['config.provider']), { target: { value: 'bare' } })
    expect(actions.edit).toHaveBeenCalledWith('provider', 'bare')
    expect(actions.edit).not.toHaveBeenCalledWith('model', expect.anything())
  })

  it('disables the model select while the staged provider declares no models', () => {
    renderPage({ provider: field('bare'), model: field('DeepSeek-V4.1-Flash-1017') })

    expect(screen.getByLabelText(en['config.model'])).toHaveProperty('disabled', true)
  })

  it('stages a provider change and picks that provider’s first model', () => {
    const actions = renderPage({ dirty: true })

    fireEvent.change(screen.getByLabelText(en['config.provider']), { target: { value: 'blueai-anthropic' } })
    expect(actions.edit).toHaveBeenCalledWith('provider', 'blueai-anthropic')
    expect(actions.edit).toHaveBeenCalledWith('model', 'claude-opus-5-5')
  })

  it('stages a numeric edit, a reset, and the save', () => {
    const actions = renderPage({ dirty: true })

    fireEvent.change(screen.getByLabelText(en['config.maxTasks']), { target: { value: '5' } })
    expect(actions.edit).toHaveBeenCalledWith('maxTasks', '5')

    fireEvent.click(screen.getAllByRole('button', { name: en['config.reset'] })[0]!)
    expect(actions.resetField).toHaveBeenCalledWith('recapNoticeMinutes')

    fireEvent.click(screen.getByRole('button', { name: en['config.save'] }))
    expect(actions.save).toHaveBeenCalledTimes(1)
  })

  it('blocks the controls on a read-only profile', () => {
    renderPage({ writable: false })

    expect(screen.getByLabelText(en['config.lookbackDays'])).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: en['config.save'] })).toHaveProperty('disabled', true)
  })

  it('blocks a save that would store half a model route', () => {
    renderPage({ dirty: true, model: field('') })

    expect(screen.getByRole('button', { name: en['config.save'] })).toHaveProperty('disabled', true)
    expect(screen.getAllByText(en['config.routePair'])).toHaveLength(2)
  })

  it('renders nothing for the summary view', () => {
    const store = createSnapshotStore<MuseInsightsConfigState>(state())
    const routeStore = createSnapshotStore<RouteOptions>(routes)
    const props = {
      ...pageActions(),
      view: 'summary',
      t,
      useConfig: bindSnapshotSelector(store),
      useRoutes: bindSnapshotSelector(routeStore),
    } as MuseInsightsConfigPageProps
    const view = render(<MuseInsightsConfigPage {...props} />)

    expect(view.container.textContent).toBe('')
  })
})
