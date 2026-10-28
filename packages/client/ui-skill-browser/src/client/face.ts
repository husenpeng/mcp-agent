/**
 * The Skills tab's asynchronous half: catalog reads, detail reads, and saves.
 *
 * Components never await RPCs directly. They call this face, which performs the
 * request and writes the outcome through the tab store's action set. One
 * request generation per tab keeps a superseded settlement from repainting a
 * newer view, and the tab record's signal ends a bucket when the tab closes.
 */
import type { BoundActions } from '@deepseek-ai/dsh-client-store'
import type { ClientRemote, RemoteFailure } from '@deepseek-ai/dsh-api-remotes/client'
import type { TabId } from '@deepseek-ai/dsh-client-ui-dockkit'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { RemoteError } from '@deepseek-ai/dsh-typert-protocol'
import type { createSkillBrowserStore } from './store.ts'

/** The Remote slice this package calls, exactly as the generated client declares it. */
export type SkillBrowserRemote = {
  readonly skills: Pick<ClientRemote['skills'], 'list' | 'get' | 'save'>
}

/** What the editor submits for one skill. */
export interface SkillDraft {
  readonly name: string
  readonly description: string
  /** `null` removes the routing hint. */
  readonly whenToUse: string | null
  readonly content: string
}

/** The face a tab body receives: every operation names the calling tab. */
export interface SkillBrowserInjected {
  /**
   * Seed a tab and read its catalog.
   * @param tabId - the tab being drawn.
   * @param signal - the tab record's lifetime.
   */
  readonly start: (tabId: TabId, signal: AbortSignal) => void
  /**
   * Read the catalog again.
   * @param tabId - the tab being drawn.
   * @param signal - the tab record's lifetime.
   */
  readonly reload: (tabId: TabId, signal: AbortSignal) => void
  /**
   * Open one skill's detail.
   * @param tabId - the tab being drawn.
   * @param name - the skill to read.
   * @param signal - the tab record's lifetime.
   */
  readonly openDetail: (tabId: TabId, name: string, signal: AbortSignal) => void
  /** Return one tab to its list. @param tabId - the tab being drawn. */
  readonly closeDetail: (tabId: TabId) => void
  /**
   * Save one skill and publish the Host's readback.
   * @param tabId - the tab being drawn.
   * @param draft - the fields to write.
   * @param signal - the tab record's lifetime.
   * @returns `null` on success or when the tab ended; the failure otherwise.
   */
  readonly save: (tabId: TabId, draft: SkillDraft, signal: AbortSignal) => Promise<RemoteFailure | null>
}

/**
 * Bind the asynchronous face to one Remote and one Session.
 * @param remote - the Client Remote face carrying the `skills` namespace.
 * @returns the registration inject factory.
 */
export function skillBrowserFace(
  remote: SkillBrowserRemote,
): (
  sessionId: string,
  actions: BoundActions<ReturnType<typeof createSkillBrowserStore>>,
) => SkillBrowserInjected {
  return (sessionId, actions): SkillBrowserInjected => {
    // The framework delivers the session's branded id as a plain string here.
    const session = sessionId as SessionId
    /** Per tab, the request generation a settlement must match. */
    const listGenerations = new Map<TabId, number>()
    const detailGenerations = new Map<TabId, number>()
    const nextGeneration = (generations: Map<TabId, number>, tabId: TabId): number => {
      const value = (generations.get(tabId) ?? 0) + 1
      generations.set(tabId, value)
      return value
    }
    const failureOf = (error: unknown): RemoteFailure => new RemoteError(
      'gateway/internal',
      error instanceof Error ? error.message : String(error),
      {},
    )

    const load = async (tabId: TabId, signal: AbortSignal): Promise<void> => {
      const aborted = (): boolean => signal.aborted
      if (aborted()) return
      const generation = nextGeneration(listGenerations, tabId)
      actions.listing(tabId)
      let result
      try {
        result = await remote.skills.list({ sessionId: session, includeModelOnly: true, brief: true }, signal)
      } catch (error: unknown) {
        if (aborted() || listGenerations.get(tabId) !== generation) return
        actions.listFailed(tabId, failureOf(error))
        return
      }
      if (aborted() || listGenerations.get(tabId) !== generation) return
      if (result.ok) actions.listed(tabId, result.value.skills)
      else actions.listFailed(tabId, result.error)
    }

    return {
      start(tabId, signal) {
        if (signal.aborted) return
        actions.start(tabId)
        signal.addEventListener('abort', () => {
          listGenerations.delete(tabId)
          detailGenerations.delete(tabId)
          actions.forget(tabId)
        }, { once: true })
        void load(tabId, signal)
      },
      reload(tabId, signal) {
        void load(tabId, signal)
      },
      openDetail(tabId, name, signal) {
        const aborted = (): boolean => signal.aborted
        if (aborted()) return
        const generation = nextGeneration(detailGenerations, tabId)
        actions.opening(tabId, name)
        void (async () => {
          let result
          try {
            result = await remote.skills.get({ sessionId: session, name }, signal)
          } catch (error: unknown) {
            if (aborted() || detailGenerations.get(tabId) !== generation) return
            actions.detailFailed(tabId, name, failureOf(error))
            return
          }
          if (aborted() || detailGenerations.get(tabId) !== generation) return
          if (result.ok) actions.opened(tabId, result.value)
          else actions.detailFailed(tabId, name, result.error)
        })()
      },
      closeDetail(tabId) {
        nextGeneration(detailGenerations, tabId)
        actions.closeDetail(tabId)
      },
      async save(tabId, draft, signal) {
        const aborted = (): boolean => signal.aborted
        if (aborted()) return null
        const generation = detailGenerations.get(tabId) ?? 0
        const current = (): number => detailGenerations.get(tabId) ?? 0
        actions.saving(tabId)
        let result
        try {
          result = await remote.skills.save({ sessionId: session, ...draft }, signal)
        } catch (error: unknown) {
          if (aborted() || current() !== generation) return null
          const failure = failureOf(error)
          actions.saveFailed(tabId, failure)
          return failure
        }
        if (aborted() || current() !== generation) return null
        if (result.ok) {
          actions.saved(tabId, result.value)
          return null
        }
        actions.saveFailed(tabId, result.error)
        return result.error
      },
    }
  }
}
