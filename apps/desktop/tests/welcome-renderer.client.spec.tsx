// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Welcome } from '../src/client/WelcomePage.tsx'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveDesktopLocale } from '../src/locale.ts'
import type { WelcomeAccountView } from '../src/welcome-api.ts'
import type { WelcomeNotice } from '../src/welcome-api.ts'

const html = readFileSync(join(import.meta.dirname, '../renderer/welcome.html'), 'utf8')
afterEach(cleanup)

const LINKS = { usageUrl: 'http://localhost/usage', topUpUrl: 'http://localhost/top_up' }

function mount(language = 'zh-CN', takeNotice = vi.fn<() => Promise<WelcomeNotice | undefined>>().mockResolvedValue(undefined)) {
  cleanup()
  const stopAccount = vi.fn()
  const api = {
    takeNotice,
    analytics: vi.fn(async (_event: string, _attributes: object) => {}),
    analyticsEnabled: async () => true,
    onAccountState: vi.fn((_listener: (state: WelcomeAccountView) => void) => stopAccount),
    startSignIn: vi.fn(async (): Promise<WelcomeAccountView> => ({ links: LINKS, status: 'signed-out', attempt: null })),
    cancelSignIn: vi.fn(async (): Promise<WelcomeAccountView> => ({ links: LINKS, status: 'signed-out', attempt: null })),
    copySignInLink: vi.fn(async () => undefined),
    openLegal: vi.fn(async () => undefined),
    ...resolveDesktopLocale(language),
    saveApiKey: vi.fn(async () => ({ ok: true as const })),
    skip: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  }
  const mounted = render(<Welcome api={api} />)
  const button = (id: string) => document.querySelector<HTMLButtonElement>(id)!
  const copy = () => {
    const heading = document.querySelector('main')!.getAttribute('aria-labelledby')!
    return [
      document.title, document.querySelector('img')!.alt, document.getElementById(heading)!.textContent,
      ...heading === 'welcome-heading' ? [document.querySelector('#welcome-description')!.textContent] : [],
      ...[...document.querySelectorAll('button')].filter(item => item.closest('[hidden]') === null)
        .map(item => `${item.textContent || (item.getAttribute('aria-label') ?? '')}${item.disabled ? ' [disabled]' : ''}`),
      '',
    ].join('\n')
  }
  const consent = () => {
    const box = document.querySelector<HTMLInputElement>('#auth-consent')!
    fireEvent.click(box)
  }
  return { document, api, button, consent, copy, unmount: mounted.unmount, stopAccount }
}

describe('desktop welcome presentation', () => {
  it.each(['zh-CN', 'en'])('renders the %s entry with a company sign-in action', async (language) => {
    const view = mount(language)
    expect(view.document.documentElement.lang).toBe(language)
    expect(view.document.querySelector('img')!.getAttribute('src')).toBe('assets/tomato-mark-light.svg')
    await expect(view.copy()).toMatchFileSnapshot(`./expected/welcome/${language}.expected.txt`)
  })

  it('starts a sign-in and shows the waiting page with a copy action', async () => {
    const view = mount('en')
    const waiting = Promise.withResolvers<WelcomeAccountView>()
    view.consent()
    view.api.startSignIn.mockReturnValueOnce(waiting.promise)
    await act(async () => { fireEvent.click(view.button('#sign-in')) })
    expect(view.button('#auth-loading').hidden).toBe(false)
    act(() => {
      view.api.onAccountState.mock.calls[0]![0]({ status: 'signed-out', links: LINKS,
        attempt: { id: 'waiting' as NonNullable<WelcomeAccountView['attempt']>['id'], phase: 'waiting-browser', authorizeUrl: 'https://example.test/login' } })
    })
    await act(async () => { waiting.resolve({ status: 'signed-out', links: LINKS, attempt: null }); await waiting.promise })
    expect(view.button('#auth-copy').hidden).toBe(false)
    fireEvent.click(view.button('#auth-copy'))
    await vi.waitFor(() => { expect(view.button('#auth-copy').textContent).toBe(view.api.messages.welcomeAuthCopied) })
    expect(view.api.copySignInLink).toHaveBeenCalledWith('waiting')
  })

  it.each(['zh-CN', 'en'])('renders %s timeout with manual retry', async (language) => {
    const view = mount(language)
    const receive = (state: WelcomeAccountView) => { act(() => { view.api.onAccountState.mock.calls[0]![0](state) }) }
    receive({ status: 'signed-out', links: LINKS, attempt: { id: 'expired' as NonNullable<WelcomeAccountView['attempt']>['id'], phase: 'expired' } })
    expect(view.button('#auth-retry').hidden).toBe(false)
    expect(view.api.startSignIn).not.toHaveBeenCalled()
    fireEvent.click(view.button('#auth-retry'))
    expect(view.api.startSignIn).toHaveBeenCalledOnce()
  })

  it('cancels an in-flight attempt', async () => {
    const view = mount('en')
    act(() => {
      view.api.onAccountState.mock.calls[0]![0]({ status: 'signed-out', links: LINKS,
        attempt: { id: 'waiting' as NonNullable<WelcomeAccountView['attempt']>['id'], phase: 'waiting-browser' } })
    })
    fireEvent.click(view.button('#auth-cancel'))
    await vi.waitFor(() => { expect(view.api.cancelSignIn).toHaveBeenCalledWith('waiting') })
  })

  it('returns to the entry after sign-out', async () => {
    const view = mount('en')
    const publish = view.api.onAccountState.mock.calls[0]![0]
    act(() => { publish({ status: 'credential-stored', links: LINKS,
      attempt: { id: 'completed' as NonNullable<WelcomeAccountView['attempt']>['id'], phase: 'succeeded' } }) })
    expect(view.document.querySelector<HTMLElement>('#auth-page')!.hidden).toBe(false)
    act(() => { publish({ status: 'signed-out', links: LINKS, attempt: null }) })
    expect(view.button('#sign-in').closest('[hidden]')).toBeNull()
    await expect(view.copy()).toMatchFileSnapshot('./expected/welcome/en.expected.txt')
  })

  it('skips into the workspace and reports the failure when it cannot', async () => {
    const view = mount('en')
    fireEvent.click(view.button('#later'))
    await vi.waitFor(() => { expect(view.api.skip).toHaveBeenCalledOnce() })
    await vi.waitFor(() => { expect(view.button('#later').disabled).toBe(false) })
    view.api.skip.mockRejectedValueOnce(new Error('host unavailable'))
    fireEvent.click(view.button('#later'))
    await vi.waitFor(() => {
      expect(view.document.querySelector('#entry-error')!.textContent).toBe(view.api.messages.welcomeContinueFailed)
    })
  })

  it('keeps the expiry notice until it dismisses and releases the subscription on unmount', async () => {
    vi.useFakeTimers()
    try {
      const takeNotice = vi.fn<() => Promise<WelcomeNotice | undefined>>().mockResolvedValueOnce('session-expired').mockResolvedValue(undefined)
      const view = mount('en', takeNotice)
      await act(async () => {})
      const notice = screen.getByRole('alert')
      expect(notice.textContent).toBe(view.api.messages.welcomeSessionExpired)
      await act(async () => { await vi.advanceTimersByTimeAsync(4000) })
      expect(screen.queryByRole('alert')).toBeNull()
      view.unmount()
      expect(view.stopAccount).toHaveBeenCalledOnce()
    } finally { cleanup(); vi.useRealTimers() }
  })

  it('keeps the entry usable when notification IPC fails', async () => {
    const view = mount('en', vi.fn<() => Promise<WelcomeNotice | undefined>>().mockRejectedValue(new Error('closed')))
    await act(async () => {})
    expect(screen.queryByRole('alert')).toBeNull()
    expect(view.button('#sign-in').closest('[hidden]')).toBeNull()
  })

  it('blocks the Feishu action until the user consents and opens localized legal pages', () => {
    const view = mount('en')
    expect(view.button('#sign-in').disabled).toBe(true)
    view.consent()
    expect(view.button('#sign-in').disabled).toBe(false)
    fireEvent.click(view.document.querySelector('#terms-link')!)
    fireEvent.click(view.document.querySelector('#privacy-link')!)
    expect(view.api.openLegal).toHaveBeenNthCalledWith(1, 'terms')
    expect(view.api.openLegal).toHaveBeenNthCalledWith(2, 'privacy')
  })

  it.each([
    ['denied', 'welcomeAuthFeishuDenied'],
    ['email-missing', 'welcomeAuthFeishuEmailMissing'],
    ['failed', 'welcomeAuthFeishuFailed'],
  ] as const)('renders the %s Feishu reason', (feishuFailure, key) => {
    const view = mount('en')
    act(() => {
      view.api.onAccountState.mock.calls[0]![0]({ status: 'signed-out', links: LINKS,
        attempt: { id: 'failed' as NonNullable<WelcomeAccountView['attempt']>['id'], phase: 'failed', errorCode: 'protocol', feishuFailure } })
    })
    expect(screen.getByRole('alert').textContent).toBe(view.api.messages[key])
  })

  it('keeps visible copy in the shell dictionaries and denies network access', () => {
    expect([...html.matchAll(/>([^<]*\p{L}[^<]*)</gu)]).toEqual([])
    expect(html).toContain("default-src 'none'")
    expect(html).toContain("form-action 'none'")
  })
})
