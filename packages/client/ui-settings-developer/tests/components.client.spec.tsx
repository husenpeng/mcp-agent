// @vitest-environment jsdom
/** The developer page as the Settings shell renders it: switch, gateway log, and page facts. */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { bindSnapshotSelector } from '@tomato/client-test-runtime'
import { createSnapshotStore } from '@tomato/client-store'
import { DeveloperSection, type DeveloperSectionProps } from '../src/client/DeveloperSection.tsx'
import { DeveloperOverlay, type DeveloperOverlayProps } from '../src/client/DeveloperOverlay.tsx'
import { en } from '../src/client/locales.ts'
import type { DeveloperState } from '../src/client/store.ts'

afterEach(cleanup)

const t = (key: keyof typeof en) => en[key]

function renderPage(options: {
  enabled?: boolean
  state?: Partial<DeveloperState>
  actions?: Partial<Pick<DeveloperSectionProps, 'setEnabled' | 'clear' | 'refreshPageInfo'>>
} = {}) {
  const enabledStore = createSnapshotStore(options.enabled ?? false)
  const gatewayStore = createSnapshotStore<DeveloperState>({ entries: [], dropped: 0, page: undefined, ...options.state })
  const actions = {
    setEnabled: vi.fn(async () => {}),
    clear: vi.fn(),
    refreshPageInfo: vi.fn(),
    ...options.actions,
  }
  const props = { ...actions, t, close: vi.fn(),
    useEnabled: bindSnapshotSelector(enabledStore), useGateway: bindSnapshotSelector(gatewayStore) } as DeveloperSectionProps
  render(<DeveloperSection {...props} />)
  return actions
}

function renderOverlay(enabled: boolean) {
  const enabledStore = createSnapshotStore(enabled)
  const gatewayStore = createSnapshotStore<DeveloperState>({ entries: [], dropped: 0, page: undefined })
  const setEnabled = vi.fn(async () => {})
  const props = { setEnabled, clear: vi.fn(), refreshPageInfo: vi.fn(), t, close: vi.fn(),
    useEnabled: bindSnapshotSelector(enabledStore), useGateway: bindSnapshotSelector(gatewayStore) } as never as DeveloperOverlayProps
  render(<DeveloperOverlay {...props} />)
  return setEnabled
}

describe('DeveloperOverlay', () => {
  it('renders nothing while recording is off', () => {
    renderOverlay(false)
    expect(document.body.textContent).toBe('')
  })

  it('shows the log and page facts and closes through the switch', () => {
    const setEnabled = renderOverlay(true)
    expect(screen.getByRole('complementary', { name: en.title })).toBeDefined()
    expect(screen.getByText(en.gatewayTitle)).toBeDefined()
    expect(screen.getByText(en.pageTitle)).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: en.close }))
    expect(setEnabled).toHaveBeenCalledWith(false)
  })
})

describe('DeveloperSection', () => {
  it('renders the switch, empty log, and an unread page block', () => {
    renderPage()
    expect(screen.getByText(en.title)).toBeDefined()
    expect(screen.getByRole('switch', { name: en.enable })).toBeDefined()
    expect(screen.getByText(en.empty)).toBeDefined()
    expect(screen.queryByText(en.pageRelease)).toBeNull()
  })

  it('turns the switch on through the injected action', async () => {
    const actions = renderPage()
    fireEvent.click(screen.getByRole('switch', { name: en.enable }))
    expect(actions.setEnabled).toHaveBeenCalledWith(true)
  })

  it('shows a failed switch write', async () => {
    renderPage({ actions: { setEnabled: vi.fn(async () => { throw new Error('refused') }) } })
    fireEvent.click(screen.getByRole('switch', { name: en.enable }))
    expect(await screen.findByRole('alert')).toBeDefined()
  })

  it('lists exchanges and expands the complete payload', () => {
    renderPage({ state: { entries: [
      { id: 0, observation: { kind: 'rpc', channel: '/api', endpoint: 'settings/describe',
        startedAt: 0, durationMs: 12, request: { a: 1 }, response: { ok: true, value: 2 }, outcome: 'ok' } },
      { id: 1, observation: { kind: 'stream', path: '/api/remote.mux', direction: 'in', at: 0, frame: { type: 'item' } } },
    ], dropped: 3 } })
    expect(screen.getByText(new RegExp('RPC · settings/describe · 12 ms'))).toBeDefined()
    expect(screen.getByText(new RegExp('Stream · /api/remote.mux · in'))).toBeDefined()
    expect(screen.getByText(`${en.dropped}3`)).toBeDefined()
    const rows = screen.getAllByRole('button').filter(button => button.getAttribute('aria-expanded') !== null)
    expect(rows).toHaveLength(2)
    fireEvent.click(rows[0]!)
    const detail = document.querySelector('pre')
    expect(detail?.textContent).toContain(en.detailRequest)
    expect(detail?.textContent).toContain('"a": 1')
    fireEvent.click(rows[0]!)
    expect(document.querySelector('pre')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: en.clear }))
  })

  it('renders page facts and refreshes them', () => {
    const actions = renderPage({ state: { page: {
      release: '0.2.1', modules: 3, plugins: 4, connection: 'connected', panel: 'conversation',
      sessions: 2, slotNodes: 5, slotTree: '[]',
    } } })
    expect(screen.getByText('0.2.1')).toBeDefined()
    expect(screen.getByText('connected')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: en.refresh }))
    expect(actions.refreshPageInfo).toHaveBeenCalled()
    expect(screen.getByText(en.pageTree)).toBeDefined()
  })
})
