/** Skills browser browser half: two-stage tab registration, dictionaries, and teardown. */
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, onTestFinished } from 'vitest'
import { TestRemote } from '@deepseek-ai/dsh-client-test-runtime'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { SidebarRightTabDefinition } from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import { apply, inject } from '../src/client/index.ts'
import { SKILLS_ID } from '../src/client/definition.tsx'
import { en, zh } from '../src/client/locales.ts'
import { SkillsBody, SkillsTitle } from '../src/client/SkillsBody.tsx'

interface PresentationCapture {
  slots: SlotRegistry
  definitions: SidebarRightTabDefinition[]
  dictionaries: Array<{ namespace: string; dictionaries: unknown }>
  localeDisposed: boolean
  definitionsDisposed: boolean
}

/** Provide the registries the plugin binds and capture what it contributes. */
function providePresentation(ctx: Context): PresentationCapture {
  const slots = new SlotRegistry(ctx)
  slots.register({
    name: 'root',
    children: {
      'sidebar.right.pane.tab': { kind: 'keyed', scope: 'session' },
      'sidebar.right.pane.tab.title': { kind: 'keyed', scope: 'session' },
    },
  } as never, () => null)
  const capture: PresentationCapture = {
    slots,
    definitions: [],
    dictionaries: [],
    localeDisposed: false,
    definitionsDisposed: false,
  }
  ctx.provide('sidebarRightTabs', {
    register(definition: SidebarRightTabDefinition) {
      capture.definitions.push(definition)
      return () => { capture.definitionsDisposed = true }
    },
  } as never)
  ctx.provide('locale', {
    register(namespace: string, dictionaries: unknown) {
      capture.dictionaries.push({ namespace, dictionaries })
      return () => { capture.localeDisposed = true }
    },
    // The bound translate resolves through the Chinese dictionary, as the real service would.
    bind: () => (key: string) => (zh as Record<string, string>)[key] ?? key,
  })
  return capture
}

/** Boot the plugin over a scripted skills Remote. */
async function bench() {
  const ctx = new Context()
  onTestFinished(async () => { await ctx.fiber.dispose() })
  new TestRemote(ctx, {
    skills: {
      list: () => Promise.resolve({ ok: true, value: { skills: [] } }),
      get: () => Promise.resolve({ ok: false, error: { code: 'skill/not-found', message: 'missing', details: {} } }),
      save: () => Promise.resolve({ ok: false, error: { code: 'skill/invalid', message: 'invalid', details: {} } }),
    },
  })
  const presentation = providePresentation(ctx)
  const fiber = ctx.plugin({ inject: [...inject], apply })
  onTestFinished(async () => { await fiber.dispose() })
  await fiber.await()
  return { ctx, fiber, presentation }
}

describe('apply', () => {
  it('declares the services it binds', () => {
    expect(inject).toEqual(['slots', 'locale', 'sidebarRightTabs', 'remote', 'remote.skills'])
  })

  it('registers the Skills page type, its guide entry, and its two seats', async () => {
    const { presentation } = await bench()

    expect(presentation.definitions).toHaveLength(1)
    const definition = presentation.definitions[0]!
    expect(definition).toMatchObject({ id: SKILLS_ID, kind: 'skills', priority: 'builtin' })
    expect(definition.title('skills')).toBe(zh['type.label'])
    expect(definition.guide?.[0]).toMatchObject({ id: 'skills', order: 40 })
    expect(definition.guide?.[0]?.title()).toBe('Skills')
    expect(definition.guide?.[0]?.description?.()).toBe(zh['guide.description'])
    expect(presentation.dictionaries).toHaveLength(1)
    expect(presentation.dictionaries[0]).toMatchObject({ namespace: 'skillBrowser' })
    expect(presentation.dictionaries[0]?.dictionaries).toMatchObject({ zh, en })

    const body = presentation.slots.entries('sidebar.right.pane.tab').find(entry => entry.options.key === SKILLS_ID)
    expect(body?.component).toBe(SkillsBody)
    expect(body?.locale).toBe('skillBrowser')
    expect(body?.store).toBeDefined()
    expect(body?.inject).toBeTypeOf('function')

    const title = presentation.slots.entries('sidebar.right.pane.tab.title').find(entry => entry.options.key === SKILLS_ID)
    expect(title?.component).toBe(SkillsTitle)
  })

  it('removes its registrations and dictionaries on disposal', async () => {
    const { presentation, ctx } = await bench()
    await ctx.fiber.dispose()

    expect(presentation.definitionsDisposed).toBe(true)
    expect(presentation.localeDisposed).toBe(true)
    expect(presentation.slots.entries('sidebar.right.pane.tab')).toHaveLength(0)
    expect(presentation.slots.entries('sidebar.right.pane.tab.title')).toHaveLength(0)
  })

  it('builds an inject face that reads the catalog through the skills namespace', async () => {
    const { presentation } = await bench()
    const body = presentation.slots.entries('sidebar.right.pane.tab').find(entry => entry.options.key === SKILLS_ID)
    const injectFace = body?.inject as ((sessionId: string, actions: unknown) => Record<string, unknown>) | undefined
    const face = injectFace?.('session-1', {})
    expect(face?.start).toBeTypeOf('function')
    expect(face?.reload).toBeTypeOf('function')
    expect(face?.openDetail).toBeTypeOf('function')
    expect(face?.closeDetail).toBeTypeOf('function')
    expect(face?.save).toBeTypeOf('function')
  })
})
