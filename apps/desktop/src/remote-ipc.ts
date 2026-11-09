/**
 * IPC registration for the remote-access page: the three channels the preload
 * bridge invokes. Kept apart from the Electron entrypoint so the sender fence,
 * the lifecycle forwarding, and the returned snapshots are exercisable without
 * an Electron process.
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
}

/**
 * Register the remote-access channels.
 * @param options - channel host, tunnel, fence, and snapshot reader.
 */
export function registerRemoteIpc(options: RemoteIpcOptions): void {
  const fenced = async (event: IpcMainInvokeEvent): Promise<DesktopRemoteState> => {
    options.assertSender(event)
    return options.snapshot()
  }
  options.host.handle(DESKTOP_IPC.remoteStatus, fenced)
  options.host.handle(DESKTOP_IPC.remoteStart, async (event) => {
    options.assertSender(event)
    options.tunnel.start()
    return options.snapshot()
  })
  options.host.handle(DESKTOP_IPC.remoteStop, async (event) => {
    options.assertSender(event)
    options.tunnel.stop()
    return options.snapshot()
  })
}
