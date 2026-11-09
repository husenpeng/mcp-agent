// @vitest-environment jsdom
/** The remote-access page as Settings renders it: status, link, QR, and lifecycle buttons. */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { bindSnapshotSelector } from '@tomato/client-test-runtime'
import { createSnapshotStore } from '@tomato/client-store'
// Type-only: the plugin entry declares this page's locale namespace.
import type {} from '../src/client/index.ts'
import { RemoteSection, type RemoteSectionProps } from '../src/client/RemoteSection.tsx'
import { en } from '../src/client/locales.ts'
import type { RemotePageState } from '../src/client/state.ts'

afterEach(cleanup)

// The slot's translator also accepts the shared `common` vocabulary; this page
// renders only its own keys.
const t: RemoteSectionProps['t'] = key => (en as Record<string, string>)[key] ?? key

function renderPage(state: RemotePageState, actions: Partial<Pick<RemoteSectionProps, 'start' | 'stop'>> = {}) {
  const store = createSnapshotStore<RemotePageState>(state)
  const callbacks = { start: vi.fn(async () => {}), stop: vi.fn(async () => {}), ...actions }
  // The slot renderer supplies every standard seat; this page reads only its own
  // inject face, so the unused seats stay explicit and never-typed.
  const unusedSeats = {
    useAccess: undefined as never, useConversation: undefined as never, useInput: undefined as never,
    usePanelInfo: undefined as never, useProjection: undefined as never, useRemoteAccess: undefined as never,
    useResource: undefined as never,
    useSession: undefined as never, useSessionAccess: undefined as never, useSessionRetainInfo: undefined as never,
    useSessionStatus: undefined as never, useSessions: undefined as never, useWorkspaceAccess: undefined as never,
    useWorkspaces: undefined as never,
  }
  const props: RemoteSectionProps = {
    ...unusedSeats,
    ...callbacks,
    close: vi.fn(),
    t,
    useRemote: bindSnapshotSelector(store),
  }
  render(<RemoteSection {...props} />)
  return callbacks
}

describe('outside the desktop shell', () => {
  it('explains that the connection lives in the Desktop app', () => {
    renderPage({ supported: false, phase: 'off' })
    expect(screen.getByText(en.title)).toBeTruthy()
    expect(screen.getByText(en.desktopOnly)).toBeTruthy()
    expect(screen.queryByText(en.start)).toBeNull()
  })
})

describe('online tunnel', () => {
  it('shows the pairing link, its QR code, and enables stopping only', () => {
    renderPage({
      supported: true,
      phase: 'online',
      host: 'example.trycloudflare.com',
      pairingUrl: 'https://example.trycloudflare.com/?token=abc',
      pairingQr: 'data:image/png;base64,AAAA',
    })
    expect(screen.getByText(en['phase.online'])).toBeTruthy()
    expect(screen.getByText('https://example.trycloudflare.com/?token=abc')).toBeTruthy()
    expect(screen.getByAltText(en.qrAlt).getAttribute('src')).toBe('data:image/png;base64,AAAA')
    expect(screen.getByText(en.start).closest('button')!.disabled).toBe(true)
    expect(screen.getByText(en.stop).closest('button')!.disabled).toBe(false)
  })
})

describe('off tunnel', () => {
  it('starts the tunnel from the page', async () => {
    const actions = renderPage({ supported: true, phase: 'off' })
    fireEvent.click(screen.getByText(en.start))
    await vi.waitFor(() => { expect(actions.start).toHaveBeenCalledTimes(1) })
    expect(screen.getByText(en.stop).closest('button')!.disabled).toBe(true)
  })
})

describe('failures', () => {
  it('shows the shell detail and a retryable notice', async () => {
    renderPage({ supported: true, phase: 'failed', message: 'cloudflared exited with code 1' }, {
      start: vi.fn(async () => { throw new Error('refused') }),
    })
    expect(screen.getByText('cloudflared exited with code 1')).toBeTruthy()
    fireEvent.click(screen.getByText(en.start))
    expect(await screen.findByText(en.failed)).toBeTruthy()
  })
})
