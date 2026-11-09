/**
 * Reactive view of the shell-owned phone tunnel.
 *
 * The Electron shell supervises the process and mints the pairing link; this
 * module only mirrors its state into the snapshot shape the Settings page
 * reads through the inject `hooks` compartment. A browser build has no bridge
 * and reports `supported: false`.
 */
import type { ObservableSnapshot } from '@tomato/client-store'

/** Tunnel phase reported by the shell. */
export type RemotePhase = 'off' | 'starting' | 'online' | 'failed'

/** What the page renders. */
export interface RemotePageState {
  /** Whether this document runs inside the Desktop shell at all. */
  readonly supported: boolean
  readonly phase: RemotePhase
  /** Bare quick-tunnel authority, present once online. */
  readonly host?: string
  /** Pairing link carrying the running Host's launch token. */
  readonly pairingUrl?: string
  /** PNG data URL of the pairing link. */
  readonly pairingQr?: string
  /** Shell-reported failure detail. */
  readonly message?: string
}

/** Structural view of `window.tomatoDesktop.remote`. */
export interface DesktopRemoteBridge {
  status(): Promise<RemotePageState>
  start(): Promise<RemotePageState>
  stop(): Promise<RemotePageState>
  subscribe(listener: (state: RemotePageState) => void): () => void
}

/**
 * Read the shell bridge, or undefined outside the Desktop shell.
 * @returns the bridge when the preload exposed all four members, otherwise undefined.
 */
export function desktopRemoteBridge(): DesktopRemoteBridge | undefined {
  const candidate = (globalThis as {
    readonly tomatoDesktop?: { readonly remote?: unknown }
  }).tomatoDesktop?.remote
  if (typeof candidate !== 'object' || candidate === null) return undefined
  const bridge = candidate as Partial<DesktopRemoteBridge>
  return typeof bridge.status === 'function' && typeof bridge.start === 'function'
    && typeof bridge.stop === 'function' && typeof bridge.subscribe === 'function'
    ? bridge as DesktopRemoteBridge
    : undefined
}

function normalize(state: RemotePageState): RemotePageState {
  return {
    supported: true,
    phase: state.phase,
    ...state.host === undefined ? {} : { host: state.host },
    ...state.pairingUrl === undefined ? {} : { pairingUrl: state.pairingUrl },
    ...state.pairingQr === undefined ? {} : { pairingQr: state.pairingQr },
    ...state.message === undefined ? {} : { message: state.message },
  }
}

function sameState(left: RemotePageState, right: RemotePageState): boolean {
  return left.supported === right.supported && left.phase === right.phase
    && left.host === right.host && left.pairingUrl === right.pairingUrl
    && left.pairingQr === right.pairingQr && left.message === right.message
}

/** Page-facing face: a stable snapshot plus the two lifecycle actions. */
export interface RemotePageStore {
  readonly snapshot: ObservableSnapshot<RemotePageState>
  start(): Promise<void>
  stop(): Promise<void>
  dispose(): void
}

/**
 * Mirror the shell bridge into one observable snapshot.
 * @param bridge - the shell bridge, or undefined in a browser build.
 * @returns the page face; subscriptions attach to the bridge on first reader.
 */
export function createRemotePageStore(bridge: DesktopRemoteBridge | undefined): RemotePageStore {
  let current: RemotePageState = bridge === undefined
    ? { supported: false, phase: 'off' }
    : { supported: true, phase: 'off' }
  const listeners = new Set<() => void>()
  let detach: (() => void) | undefined
  const publish = (next: RemotePageState): void => {
    if (sameState(current, next)) return
    current = next
    for (const listener of [...listeners]) listener()
  }
  const accept = (state: RemotePageState): void => { publish(normalize(state)) }
  const run = async (action: (target: DesktopRemoteBridge) => Promise<RemotePageState>): Promise<void> => {
    if (bridge === undefined) return
    try {
      accept(await action(bridge))
    } catch {
      publish({ ...current, phase: 'failed' })
    }
  }
  return {
    snapshot: {
      getSnapshot: () => current,
      subscribe: (listener) => {
        listeners.add(listener)
        if (detach === undefined && bridge !== undefined) {
          detach = bridge.subscribe(accept)
          void bridge.status().then(accept).catch(() => { publish({ ...current, phase: 'failed' }) })
        }
        return () => {
          listeners.delete(listener)
          if (listeners.size > 0) return
          detach?.()
          detach = undefined
        }
      },
    },
    start: () => run(target => target.start()),
    stop: () => run(target => target.stop()),
    dispose: () => {
      detach?.()
      detach = undefined
      listeners.clear()
    },
  }
}
