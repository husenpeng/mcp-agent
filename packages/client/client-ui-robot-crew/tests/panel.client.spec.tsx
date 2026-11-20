/** The existing group-chat page is reachable from the sidebar only while its plugin is mounted. */
import { renderToStaticMarkup } from 'react-dom/server'
import { Context } from '@tomato/cordis'
import { createSnapshotStore } from '@tomato/client-store'
import { LocaleRuntime } from '@tomato/client-locale/client'
import { SlotRegistry } from '@tomato/client-ui-renderer/client'
import { resolveSlotLabel } from '@tomato/client-ui-slots'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { apply, inject } from '../src/client/index.ts'
import { GroupChatPanelIcon } from '../src/client/GroupChatPanelIcon.tsx'
import { en, zh } from '../src/client/locales.ts'

describe('collaboration sidebar entry', () => {
  it('registers the existing collab page and a localized icon, then removes both on unload', async () => {
    const ctx = new Context()
    onTestFinished(() => ctx.fiber.dispose())
    await ctx.plugin(SlotRegistry).await()
    ctx.slots.register({
      name: 'root',
      children: {
        main: { kind: 'keyed', scope: 'root' },
        'sidebar.panellist': { kind: 'list', scope: 'root' },
      },
    } as never, () => null)
    ctx.provide('locale', new LocaleRuntime(ctx))
    ctx.provide('layout', { selectPanel: vi.fn() })
    ctx.provide('uiWorkspace', { startSession: vi.fn() })
    ctx.provide('crewRuns', {
      state: createSnapshotStore({ specs: [], runs: [] }),
      entries: vi.fn(), publish: vi.fn(), start: vi.fn(), cancel: vi.fn(),
    })
    ctx.provide('robotRuns', { state: createSnapshotStore({ specs: [] }) })

    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber.await()

    expect(ctx.slots.entries('main').map(entry => entry.options.key).sort()).toEqual(['collab', 'crews'])
    const entry = ctx.slots.entries('sidebar.panellist')[0]
    expect(entry).toMatchObject({ options: { id: 'collab', order: 44 }, locale: 'crew', component: GroupChatPanelIcon })
    expect([en['group.nav'], zh['group.nav']]).toContain(resolveSlotLabel(entry?.options.label))
    const icon = renderToStaticMarkup(<GroupChatPanelIcon size={18} active={false} />)
    expect(icon).toContain('width="18"')
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())

    await fiber.dispose()
    expect(ctx.slots.entries('main')).toEqual([])
    expect(ctx.slots.entries('sidebar.panellist')).toEqual([])
  })
})
