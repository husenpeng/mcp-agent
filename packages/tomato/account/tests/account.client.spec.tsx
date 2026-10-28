// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import { AccountController } from '../src/client/account-controller.ts'
import { AccountSection } from '../src/client/AccountSection.tsx'
import type { AccountSnapshot } from '../src/client/account-controller.ts'
import { en } from '../src/client/locales.ts'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

/** Build one injected face with a fixed snapshot. */
function injectedOf(snapshot: AccountSnapshot) {
  const store = createSnapshotStore<AccountSnapshot>(snapshot)
  const hooks = { account: store }
  return {
    hooks,
    startSignIn: vi.fn(() => Promise.resolve()),
    signOut: vi.fn(() => Promise.resolve()),
    refresh: vi.fn(() => Promise.resolve()),
    dismissNotice: vi.fn(),
  }
}

function renderSection(snapshot: AccountSnapshot) {
  const face = injectedOf(snapshot)
  render(<AccountSection
    startSignIn={face.startSignIn}
    signOut={face.signOut}
    refresh={face.refresh}
    dismissNotice={face.dismissNotice}
    useAccount={selector => selector(snapshot)}
    t={key => (en as Readonly<Record<string, string>>)[key] ?? key}
  />)
  return face
}

it('renders the signed-in identity and signs out', async () => {
  const face = renderSection({
    status: 'signed-in', user: { id: 'u1', email: 'u@example.com', name: 'User One', avatarUrl: null },
    busy: false, notice: null,
  })
  expect(screen.getByText('User One')).toBeTruthy()
  expect(screen.getByText('Email: u@example.com')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
  expect(face.signOut).toHaveBeenCalledOnce()
})

it('renders the signed-out call to action', () => {
  const face = renderSection({ status: 'signed-out', user: null, busy: false, notice: null })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(face.startSignIn).toHaveBeenCalledOnce()
})

it('renders the unavailable state with retry', () => {
  const face = renderSection({ status: 'unavailable', user: null, busy: false, notice: null })
  expect(screen.getByText('Sign-in service unavailable')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(face.refresh).toHaveBeenCalledWith(false)
})

it('renders a transient notice with dismiss', () => {
  const face = renderSection({ status: 'signed-in', user: null, busy: false, notice: 'remoteUnconfirmed' })
  expect(screen.getByText('Signed out on this device; the server did not confirm revocation.')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
  expect(face.dismissNotice).toHaveBeenCalledOnce()
})

it('maps a gateway unavailability response to the unavailable state', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ status: 'unavailable' }), {
    status: 503, headers: { 'content-type': 'application/json' },
  })))
  const controller = new AccountController()
  await controller.refresh(false)
  expect(controller.store.getSnapshot()).toMatchObject({ status: 'unavailable', user: null })
  controller.dispose()
})

it('recovers from unavailable when the retry reaches a working gateway', async () => {
  const fetch = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'unavailable' }), {
      status: 503, headers: { 'content-type': 'application/json' },
    }))
    .mockResolvedValueOnce(new Response(JSON.stringify({
      status: 'signed-in', user: { id: 'u1', email: 'u@example.com', name: 'User One', avatarUrl: null },
    }), { status: 200, headers: { 'content-type': 'application/json' } }))
  vi.stubGlobal('fetch', fetch)
  const controller = new AccountController()
  await controller.refresh(false)
  expect(controller.store.getSnapshot()).toMatchObject({ status: 'unavailable' })
  // The Retry button and launcher menu send the same non-quiet refresh.
  await controller.refresh(false)
  expect(controller.store.getSnapshot()).toMatchObject({ status: 'signed-in', user: { id: 'u1' } })
  expect(fetch).toHaveBeenCalledTimes(2)
  controller.dispose()
})
