/**
 * IPC registration for the remote-access page: the three channels the preload
 * bridge invokes. Kept apart from the Electron entrypoint so the sender fence,
 * the lifecycle forwarding, the keep-awake prompt, and the returned snapshots are
 * exercisable without an Electron process.
 */
import type { IpcMainInvokeEvent } from 'electron'
import { DESKTOP_IPC, type DesktopRemoteState } from './ipc.ts'

/** Lifecycle surface the start and stop channels drive; `RemoteTunnel` satisfies it. */
export interface RemoteTunnelControl {
  start(): void
  stop(): void
}

/** Channel registration surface; `ipcMain` satisfies it. */
export interface RemoteIpcHost {
  handle(channel: string, listener: (event: IpcMainInvokeEvent) => Promise<DesktopRemoteState>): void
}

/** Construction inputs for {@link registerRemoteIpc}. */
export interface RemoteIpcOptions {
  /** Channel host, normally the Electron `ipcMain`. */
  readonly host: RemoteIpcHost
  /** The supervised tunnel the start and stop channels drive. */
  readonly tunnel: RemoteTunnelControl
  /** Applies the product-sender fence; throws for an unowned renderer. */
  readonly assertSender: (event: IpcMainInvokeEvent) => void
  /** Reads the page snapshot, including the QR image when a link exists. */
  readonly snapshot: () => Promise<DesktopRemoteState>
  /** Keep-awake choice the running process was launched with. */
  readonly keepAwake: boolean
  /**
   * Asks whether the tunnel should keep the computer awake before starting it.
   * @returns the chosen state, or undefined when the user cancelled.
   */
  readonly askKeepAwake: () => Promise<boolean | undefined>
  /**
   * Persists a changed keep-awake choice, restarts the shell, and asks the next
   * launch to start the tunnel once so the phone link returns.
   */
  readonly restartWithKeepAwake: (keepAwake: boolean) => void
}

/**
 * Register the remote-access channels.
 * @param options - channel host, tunnel, fence, snapshot reader, and power prompt.
 */
export function registerRemoteIpc(options: RemoteIpcOptions): void {
  const fenced = async (event: IpcMainInvokeEvent): Promise<DesktopRemoteState> => {
    options.assertSender(event)
    return options.snapshot()
  }
  options.host.handle(DESKTOP_IPC.remoteStatus, fenced)
  options.host.handle(DESKTOP_IPC.remoteStart, async (event) => {
    options.assertSender(event)
    const keepAwake = await options.askKeepAwake()
    if (keepAwake === undefined) return options.snapshot()
    if (keepAwake !== options.keepAwake) {
      options.restartWithKeepAwake(keepAwake)
      return options.snapshot()
    }
    options.tunnel.start()
    return options.snapshot()
  })
  options.host.handle(DESKTOP_IPC.remoteStop, async (event) => {
    options.assertSender(event)
    options.tunnel.stop()
    return options.snapshot()
  })
}
