/**
 * Page-wide client-entry synchronization state and the render decisions that
 * survive a code swap. Replacing one client entry disposes its fiber — and so
 * the services, slot entries, and scope adapters it installs — before the
 * replacement applies. The root therefore keeps its last committed tree while
 * a swap is in flight, and a scope without an adapter renders nothing during
 * that window instead of failing assembly.
 * @module @tomato/client-ui-renderer/src/client/page-sync
 */
import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'

/** Bare snapshot source of the page's client-entry synchronization. */
export interface PageSyncSource {
  getSnapshot(): { readonly syncing: boolean }
  subscribe(listener: () => void): () => void
}

const PageSyncContext = createContext(false)

/**
 * Read whether the page is replacing client-entry code right now.
 * @returns true while a client-entry swap is in flight.
 */
export function usePageSyncing(): boolean {
  return useContext(PageSyncContext)
}

/**
 * Publish the page's synchronization state and hold the last committed tree
 * during a swap, so the root slot is not re-rendered against a roster the swap
 * has not finished applying.
 * @param props - provider inputs.
 * @param props.source - page synchronization source; absent outside a page shell.
 * @param props.render - root tree factory, called only when the swap allows it.
 * @returns the committed root tree, wrapped in the synchronization state.
 */
export function PageSyncProvider({ source, render }: {
  source?: PageSyncSource | undefined
  render: () => ReactNode
}): ReactNode {
  if (source === undefined) return <PageSyncContext.Provider value={false}>{render()}</PageSyncContext.Provider>
  return <ObservedPageSync source={source} render={render} />
}

/**
 * Subscribed form of {@link PageSyncProvider}: freezes the committed tree and
 * republishes the current synchronization state to its descendants.
 * @param props - provider inputs with a resolved source.
 * @returns the committed root tree, wrapped in the current synchronization state.
 */
function ObservedPageSync({ source, render }: { source: PageSyncSource; render: () => ReactNode }): ReactNode {
  const subscribe = useCallback((listener: () => void) => source.subscribe(listener), [source])
  const getSnapshot = useCallback(() => source.getSnapshot(), [source])
  const syncing = useSyncExternalStoreWithSelector(subscribe, getSnapshot, undefined, snapshot => snapshot.syncing)
  const committed = useRef<ReactNode>(undefined)
  // The first render has no committed tree to hold, so it renders as usual.
  if (!syncing || committed.current === undefined) committed.current = render()
  return <PageSyncContext.Provider value={syncing}>{committed.current}</PageSyncContext.Provider>
}
