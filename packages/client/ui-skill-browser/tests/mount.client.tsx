/**
 * Mount the Skills body over a real store instance and a scripted Remote.
 *
 * The component reads a handful of its props; the rest of the standard kit is
 * framework-injected and never touched here, so one documented cast keeps the
 * harness to what is actually exercised.
 */
import { useSyncExternalStore } from 'react'
import { render } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { onTestFinished, vi } from 'vitest'
import type { Mock } from 'vitest'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { SidebarRightTabActions } from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type { TabId } from '@deepseek-ai/dsh-client-ui-dockkit'
import { skillBrowserFace } from '../src/client/face.ts'
import type { SkillBrowserInjected } from '../src/client/face.ts'
import { scriptedRemote, type ScriptedRemote } from './scripted-remote.client.ts'
import { SkillsBody } from '../src/client/SkillsBody.tsx'
import type { SkillsBodyProps } from '../src/client/SkillsBody.tsx'
import { zh } from '../src/client/locales.ts'
import { createSkillBrowserStore } from '../src/client/store.ts'

export const SESSION = 's-test' as SessionId
export const TAB = 'tab-1' as TabId

/** Test-local selector hook over a framework-neutral store instance. */
function hookOf<T>(inst: { subscribe: (fn: () => void) => () => void; getSnapshot: () => T }) {
  return function useSelector<S>(sel: (s: T) => S): S {
    return sel(useSyncExternalStore(inst.subscribe, inst.getSnapshot))
  }
}

/** A live instance of the Skills store, as the framework would mint one per session. */
export type SkillsStoreInstance = ReturnType<ReturnType<typeof createSkillBrowserStore>['create']>

/** The owner's tab actions as recording mocks. */
interface MockedTabActions {
  readonly bindCommands: Mock<SidebarRightTabActions['bindCommands']>
  readonly openResource: Mock<SidebarRightTabActions['openResource']>
  readonly openTab: Mock<SidebarRightTabActions['openTab']>
  readonly close: Mock<SidebarRightTabActions['close']>
}

/** What a spec holds after mounting: the view and every hand on the panel. */
export interface Mounted {
  readonly view: RenderResult
  readonly instance: SkillsStoreInstance
  readonly remote: ScriptedRemote
  readonly face: SkillBrowserInjected
  readonly controller: AbortController
  readonly tabActions: MockedTabActions
}

/**
 * Mount the body.
 * @param remote - scripted Remote face; a default catalog when omitted.
 * @param refreshShortcut - effective binding advertised by the tab owner.
 */
export function mountBody(
  remote: ScriptedRemote = scriptedRemote(),
  refreshShortcut?: ReturnType<SkillsBodyProps['useTabInfo']>['tab']['refreshShortcut'],
): Mounted {
  const instance = createSkillBrowserStore().create()
  const face = skillBrowserFace(remote.remote)(SESSION, instance.actions)
  const controller = new AbortController()
  onTestFinished(() => { controller.abort() })
  const tabActions: MockedTabActions = {
    bindCommands: vi.fn(() => vi.fn()),
    openResource: vi.fn<SidebarRightTabActions['openResource']>(),
    openTab: vi.fn<SidebarRightTabActions['openTab']>(),
    close: vi.fn<SidebarRightTabActions['close']>(),
  }
  const shared = {
    useTabInfo: () => ({
      sidebar: { expanded: true, fullscreen: false },
      panel: { id: 'pane-1' },
      tab: {
        id: TAB, kind: 'skills', contentId: 'skills', title: zh['type.label'], visible: true,
        navigation: { address: 'skills', params: undefined, revision: 1 },
        signal: controller.signal,
        actions: tabActions, refreshShortcut,
      },
    }),
    sessionId: SESSION,
    useStore: hookOf(instance),
    actions: instance.actions,
    ...face,
    t: makeTranslate(zh),
  }
  const view = render(<SkillsBody {...shared as unknown as SkillsBodyProps} />)
  return { view, instance, remote, face, controller, tabActions }
}
