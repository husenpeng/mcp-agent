// @vitest-environment jsdom
/**
 * Evidence status beside one pasted image: the projection entry decides what
 * the badge says (fresh read, reused record, or failed chain), the details
 * expand to the engine's attempts and time, and an image the bridge never read
 * renders nothing.
 */
import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, expect, it, onTestFinished } from 'vitest'
import { LocaleRuntime } from '@tomato/client-locale/client'
import { SlotTestRuntime } from '@tomato/client-test-runtime'
import type { ImageAttachmentRef } from '@tomato/attachment'
import type { SessionId } from '@tomato/session/types'
import type { ImageEvidenceProjectionEntry } from '@tomato/image-evidence/types'
import { en, zh } from '../src/client/locales.ts'
import * as plugin from '../src/client/index.ts'
import { apply as applyHost } from '../src/index.ts'

afterEach(cleanup)

const SESSION = 'session-a' as SessionId
const IMAGE: ImageAttachmentRef = {
  attachmentId: 'sha256:a' as ImageAttachmentRef['attachmentId'],
  mediaType: 'image/png',
  bytes: 4,
  width: 2,
  height: 2,
}

/** Fill `{name}` placeholders the way the locale runtime does. */
function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => name in values ? String(values[name]) : match)
}

/** Mount the plugin into a declared image-meta slot bound to one Session. */
async function bench(language: 'en' | 'zh' = 'en') {
  const runtime = await SlotTestRuntime.create()
  onTestFinished(() => runtime.dispose())
  const locale = new LocaleRuntime(runtime.ctx)
  locale.setLocale(language)
  runtime.ctx.provide('locale', locale)
  runtime.slots.installLocale(locale)
  await runtime.declare({ 'conversation.chat.user.image-meta': { kind: 'list', scope: 'session' } })
  const owner = await runtime.mount(plugin)
  await runtime.sessions.add({ id: SESSION })
  const reference = runtime.sessions.retain(SESSION)
  await reference.ready
  const view = runtime.renderSlot('conversation.chat.user.image-meta', { image: IMAGE }, { session: reference })
  /** Publish one entry for this attachment through the Host projection path. */
  const publish = async (entry: ImageEvidenceProjectionEntry): Promise<void> => {
    await runtime.sessions.setProjection(SESSION, 'imageEvidence', { [String(IMAGE.attachmentId)]: entry })
  }
  /** The expanded details panel of the mounted badge, if it is open. */
  const details = (): HTMLElement => {
    const id = screen.getByRole('button').getAttribute('aria-controls')
    const panel = id === null ? null : document.getElementById(id)
    if (panel === null) throw new Error('the details panel is not open')
    return panel
  }
  return { runtime, owner, view, publish, details }
}

function entry(overrides: Partial<ImageEvidenceProjectionEntry> = {}): ImageEvidenceProjectionEntry {
  return {
    engine: { provider: 'acme', model: 'vision-1' },
    attempts: 1,
    failed: false,
    truncated: false,
    cached: false,
    durationMs: 1_200,
    ...overrides,
  }
}

it('keeps the Host entry empty', () => {
  applyHost()
})

it('renders nothing until the Session records a read for this attachment', async () => {
  const { view } = await bench()
  expect(view.view.queryByRole('button')).toBeNull()
  expect(view.container.textContent).toBe('')
})

it('reports a fresh read and expands to the engine, attempts, and time', async () => {
  const { publish, details } = await bench()
  await publish(entry())
  expect(screen.getByRole('button').textContent).toBe('Read by acme/vision-1 · 1.2s')
  expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('false')
  expect(screen.getByRole('button').getAttribute('title')).toBe(en['action.expand'])

  fireEvent.click(screen.getByRole('button'))
  expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('true')
  expect(screen.getByRole('button').getAttribute('title')).toBe(en['action.collapse'])
  const panel = within(details())
  expect(panel.getByText(en['details.engine'])).toBeTruthy()
  expect(panel.getByText(en['details.attempts'])).toBeTruthy()
  expect(panel.getByText('1')).toBeTruthy()
  expect(panel.getByText(en['details.time'])).toBeTruthy()
  expect(panel.queryByText(en['note.failed'])).toBeNull()

  fireEvent.click(screen.getByRole('button'))
  expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('false')
  expect(screen.queryByText(en['details.engine'])).toBeNull()
})

it('reports a reused record with no attempts or time and explains the reuse', async () => {
  const { publish, details } = await bench()
  await publish(entry({ cached: true, attempts: 0, durationMs: 0, truncated: true }))
  expect(screen.getByRole('button').textContent).toBe('Read by acme/vision-1 · reused')

  fireEvent.click(screen.getByRole('button'))
  const panel = within(details())
  expect(panel.getByText(en['details.engine'])).toBeTruthy()
  expect(panel.queryByText(en['details.attempts'])).toBeNull()
  expect(panel.queryByText(en['details.time'])).toBeNull()
  expect(panel.getByText(en['note.cached'])).toBeTruthy()
  expect(panel.getByText(en['note.truncated'])).toBeTruthy()
})

it('reports a failed chain as a failure, not a read', async () => {
  const { publish, details } = await bench()
  await publish(entry({ failed: true, attempts: 2, durationMs: 900, truncated: false }))
  const badge = screen.getByRole('button')
  expect(badge.textContent).toBe(en['meta.failed'])
  expect(badge.getAttribute('data-state')).toBe('failed')

  fireEvent.click(badge)
  const panel = within(details())
  expect(panel.getByText('2')).toBeTruthy()
  expect(panel.getByText(en['note.failed'])).toBeTruthy()
  expect(panel.queryByText(en['note.cached'])).toBeNull()
})

it('uses the active locale for the status and its actions', async () => {
  const { publish } = await bench('zh')
  await publish(entry())
  expect(screen.getByRole('button').textContent).toBe(fill(zh['meta.read'], {
    engine: 'acme/vision-1',
    duration: fill(zh['duration.seconds'], { seconds: 1.2 }),
  }))
  expect(screen.getByRole('button').getAttribute('title')).toBe(zh['action.expand'])
})

it('removes the entry and the badge with the plugin', async () => {
  const { runtime, owner } = await bench()
  expect(runtime.slots.entries('conversation.chat.user.image-meta')).toHaveLength(1)
  await owner.dispose()
  expect(runtime.slots.entries('conversation.chat.user.image-meta')).toHaveLength(0)
  expect(screen.queryByRole('button')).toBeNull()
})
