// @vitest-environment jsdom
/** The Muse insights row's configuration page: every policy field, its staging, and the save control. */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { bindSnapshotSelector } from '@tomato/client-test-runtime'
import { createSnapshotStore } from '@tomato/client-store'
import type { SettingsFieldState, SettingsFormShell } from '@tomato/client-ui-primitives'
import { MuseInsightsConfigPage, type MuseInsightsConfigPageProps } from '../src/client/ConfigPage.tsx'
import { CONFIG_FIELDS, type MuseInsightsConfigState } from '../src/client/config-form.ts'
import { en } from '../src/client/locales.ts'

afterEach(cleanup)

const t = (key: keyof typeof en) => en[key]

const settled: SettingsFormShell = { available: true, writable: true, dirty: false, invalid: false, saving: false, failed: false }

function field(text: string, rest: Partial<SettingsFieldState> = {}): SettingsFieldState {
  return { text, overridden: false, invalid: false, ...rest }
}

function state(rest: Partial<MuseInsightsConfigState> = {}): MuseInsightsConfigState {
  const numbers = Object.fromEntries(CONFIG_FIELDS.map(name => [name, field(name === 'provider' || name === 'model' ? '' : '30')]))
  return {
    ...settled,
    ...numbers,
    recapIntervalMinutes: field('60', { overridden: true }),
    provider: field('blueai'),
    model: field('claude-haiku-4-5-20251001'),
    ...rest,
  } as MuseInsightsConfigState
}

function pageActions() {
  return { edit: vi.fn(), resetField: vi.fn(), save: vi.fn(), discard: vi.fn() }
}

function renderPage(value: Partial<MuseInsightsConfigState> = {}) {
  const store = createSnapshotStore<MuseInsightsConfigState>(state(value))
  const actions = pageActions()
  const props = {
    ...actions,
    view: 'page',
    t,
    useConfig: bindSnapshotSelector(store),
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

  it('shows the served values and the pinned route', () => {
    renderPage()

    expect(screen.getByLabelText(en['config.recapIntervalMinutes'])).toHaveProperty('value', '60')
    expect(screen.getByLabelText(en['config.provider'])).toHaveProperty('value', 'blueai')
    expect(screen.getByLabelText(en['config.model'])).toHaveProperty('value', 'claude-haiku-4-5-20251001')
  })

  it('stages an edit, a reset, and the save', () => {
    const actions = renderPage({ dirty: true })

    fireEvent.change(screen.getByLabelText(en['config.maxTasks']), { target: { value: '5' } })
    expect(actions.edit).toHaveBeenCalledWith('maxTasks', '5')

    fireEvent.click(screen.getAllByRole('button', { name: en['config.reset'] })[0]!)
    expect(actions.resetField).toHaveBeenCalledWith('recapIntervalMinutes')

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
    const props = {
      ...pageActions(), view: 'summary', t, useConfig: bindSnapshotSelector(store),
    } as MuseInsightsConfigPageProps
    const view = render(<MuseInsightsConfigPage {...props} />)

    expect(view.container.textContent).toBe('')
  })
})
