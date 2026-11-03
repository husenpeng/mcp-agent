// @vitest-environment jsdom
/** The Marketing page as the Plugins page renders it: four provider groups, their switches, and their credential controls. */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { allowAllAccess, bindSnapshotSelector } from '@tomato/client-test-runtime'
import type { GlobalStandardProps } from '@tomato/client-ui-slots'
import { createSnapshotStore } from '@tomato/client-store'
import type { SettingsFormShell } from '@tomato/client-ui-primitives'
import { MarketingCard, type MarketingCardProps } from '../src/client/MarketingCard.tsx'
import type { MarketingCardState, MarketingProviderState } from '../src/client/marketing-card-controller.ts'
import { en, zh } from '../src/client/locales.ts'

afterEach(cleanup)

const t = (key: keyof typeof en) => en[key]

const settled: SettingsFormShell = { available: true, writable: true, dirty: false, invalid: false, saving: false, failed: false }

/** The four provider groups with every credential blank. */
function providers(overrides: Partial<Record<string, Partial<MarketingProviderState>>> = {}): MarketingProviderState[] {
  const base: MarketingProviderState[] = [
    { id: 'googleAds', enabled: false, secrets: [{ field: 'googleAdsDeveloperToken', text: '', configured: false, writable: true }] },
    { id: 'googleAnalytics', enabled: false, secrets: [{ field: 'googleAnalyticsCredentialsFile', text: '', configured: false, writable: true }] },
    {
      id: 'mosaic',
      enabled: false,
      secrets: [
        { field: 'mosaicMetaToken', text: '', configured: false, writable: true },
        { field: 'mosaicTiktokToken', text: '', configured: false, writable: true },
        { field: 'mosaicYoutubeToken', text: '', configured: false, writable: true },
        { field: 'mosaicXToken', text: '', configured: false, writable: true },
      ],
    },
    { id: 'mailchimp', enabled: false, secrets: [{ field: 'mailchimpApiKey', text: '', configured: false, writable: true }] },
  ]
  return base.map(provider => ({ ...provider, ...overrides[provider.id] }))
}

// Every fixture carries the seats the merged plugins add to GlobalStandardProps.
const useResource = (() => ({ status: 'none' as const, value: undefined, failure: undefined, reload: () => {} })) as GlobalStandardProps['useResource']
const usePanelInfo: GlobalStandardProps['usePanelInfo'] = selector => selector({ activePanelId: null })
const useSessions = bindSnapshotSelector(createSnapshotStore({
  ids: [], byId: {}, phase: 'ready' as const, projectionsBySession: {},
}))
const useSessionStatus = bindSnapshotSelector(createSnapshotStore(new Map()))
const useSessionRetainInfo: GlobalStandardProps['useSessionRetainInfo'] = () => undefined
const useWorkspaces = bindSnapshotSelector(createSnapshotStore({
  items: [], archivedSessionIds: [], pinnedSessionIds: [], state: 'idle' as const, phase: 'ready' as const, error: null,
}))

function cardActions() {
  return { edit: vi.fn(), resetField: vi.fn(), setProvider: vi.fn(), save: vi.fn(), discard: vi.fn() }
}

function renderCard(state: Partial<MarketingCardState> = {}) {
  const store = createSnapshotStore<MarketingCardState>({
    ...settled,
    providers: providers(),
    ...state,
  })
  const actions = cardActions()
  const props = {
    ...allowAllAccess, useResource, usePanelInfo, useSessions, useSessionStatus, useSessionRetainInfo, useWorkspaces,
    ...actions, view: 'page', t, useMarketingCard: bindSnapshotSelector(store),
  } as MarketingCardProps
  render(<MarketingCard {...props} />)
  return actions
}

describe('MarketingCard', () => {
  it('renders its one-liner alone in the summary view', () => {
    const store = createSnapshotStore<MarketingCardState>({ ...settled, providers: providers() })
    const props = {
      ...allowAllAccess, useResource, usePanelInfo, useSessions, useSessionStatus, useSessionRetainInfo, useWorkspaces,
      ...cardActions(), view: 'summary', t, useMarketingCard: bindSnapshotSelector(store),
    } as MarketingCardProps
    render(<MarketingCard {...props} />)

    expect(document.body.textContent).toBe(en.description)
    expect(screen.queryByLabelText(en.enable)).toBeNull()
  })

  it('renders one group per provider with its switch off', () => {
    renderCard()

    for (const title of [en.googleAds, en.googleAnalytics, en.mosaic, en.mailchimp]) {
      expect(screen.getByText(title)).toBeTruthy()
    }
    const switches = screen.getAllByLabelText(en.enable)
    expect(switches).toHaveLength(4)
    for (const control of switches) expect(control.getAttribute('aria-checked')).toBe('false')
  })

  it('stages a switch through the registration face', () => {
    const actions = renderCard()

    fireEvent.click(screen.getAllByLabelText(en.enable)[0] as HTMLElement)

    expect(actions.setProvider).toHaveBeenCalledWith('googleAds', true)
  })

  it('stages a credential through the form and never renders its literal', () => {
    const actions = renderCard()

    fireEvent.change(screen.getByLabelText(en.googleAdsDeveloperToken), { target: { value: 'dev-token' } })

    expect(actions.edit).toHaveBeenCalledWith('googleAdsDeveloperToken', 'dev-token')
    expect(screen.getByLabelText(en.googleAdsDeveloperToken)).toHaveProperty('type', 'password')
  })

  it('reports a configured credential without reading it', () => {
    renderCard({
      providers: providers({
        mailchimp: { secrets: [{ field: 'mailchimpApiKey', text: '', configured: true, writable: true }] },
      }),
    })

    expect(screen.getAllByText(en.configured)).toHaveLength(1)
    expect(screen.getAllByText(en.notConfigured)).toHaveLength(6)
  })

  it('disables every control while the settings document is read-only', () => {
    renderCard({ writable: false })

    for (const control of screen.getAllByLabelText(en.enable)) {
      expect((control as HTMLButtonElement).disabled).toBe(true)
    }
  })

  it('renders every group switched off when the state carries no provider row', () => {
    renderCard({ providers: [] })

    const switches = screen.getAllByLabelText(en.enable)
    expect(switches).toHaveLength(4)
    for (const control of switches) expect(control.getAttribute('aria-checked')).toBe('false')
    expect(screen.getAllByText(en.notConfigured)).toHaveLength(7)
  })

  it('ships a Simplified Chinese dictionary for the same keys', () => {
    expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort())
  })
})
