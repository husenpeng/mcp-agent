/**
 * Compose what the remote-access page needs from the Host's authenticated URL:
 * the phone pairing link (tunnel root plus the launch token), a QR image of it,
 * and the delivery that keeps a mounted page on the link of the running Host.
 */
import QRCode from 'qrcode'
import type { DesktopRemoteState } from './ipc.ts'
import type { RemoteTunnelState } from './remote-tunnel.ts'

/**
 * Build the page snapshot for one tunnel state.
 * @param state - tunnel phase as the supervisor reports it.
 * @param authenticatedUrl - the Host URL carrying this process's launch token, while the Host runs.
 * @returns the snapshot without the QR image; `encodePairingQr` fills that in.
 */
export function pairingSnapshot(state: RemoteTunnelState, authenticatedUrl: string | undefined): DesktopRemoteState {
  if (state.host === undefined || authenticatedUrl === undefined) {
    return {
      phase: state.phase,
      ...state.host === undefined ? {} : { host: state.host },
      ...state.message === undefined ? {} : { message: state.message },
    }
  }
  return {
    phase: state.phase,
    host: state.host,
    pairingUrl: `https://${state.host}/${new URL(authenticatedUrl).search}`,
    ...state.message === undefined ? {} : { message: state.message },
  }
}

/**
 * Encode one pairing link as a PNG data URL.
 * @param url - the pairing link the phone must open.
 * @returns the data URL, or undefined when encoding failed (the link text still works).
 */
export async function encodePairingQr(url: string): Promise<string | undefined> {
  try {
    return await QRCode.toDataURL(url, { margin: 1, width: 320 })
  } catch {
    // Encoding is a convenience: the page always shows the link itself.
    return undefined
  }
}

/** Construction inputs for {@link createPairingSnapshots}. */
export interface PairingSnapshotOptions {
  /** Tokenized URL of the running Host, or undefined while it is not running. */
  readonly hostUrl: () => string | undefined
  /** Receives a snapshot once its QR image is ready, unless a newer one replaced it first. */
  readonly send: (snapshot: DesktopRemoteState) => void
  /** QR encoder; {@link encodePairingQr} when absent. */
  readonly encodeQr?: (url: string) => Promise<string | undefined>
}

/** The Phone page's pairing source: answer the current snapshot, or deliver it after a change. */
export interface PairingSnapshots {
  /**
   * Compose the snapshot for one tunnel state, with its QR image, without delivering it.
   * @param state - tunnel phase the page should render.
   * @returns the snapshot the `status` channel answers with.
   */
  snapshot(state: RemoteTunnelState): Promise<DesktopRemoteState>
  /**
   * Compose and deliver the snapshot for one tunnel state.
   * @param state - tunnel phase the page should render.
   */
  publish(state: RemoteTunnelState): void
}

/**
 * Create the pairing source the shell feeds whenever the tunnel or the Host moves.
 *
 * The link joins two inputs that change independently: the tunnel hands out a new
 * hostname on every start, and a replacement Host process mints a new launch token.
 * Encoding a QR image is asynchronous, so a snapshot that a newer request replaced
 * while it was encoding is dropped rather than delivered late.
 * @param options - Host URL reader, delivery sink, and QR encoder.
 * @returns the snapshot reader and the publisher.
 */
export function createPairingSnapshots(options: PairingSnapshotOptions): PairingSnapshots {
  const encodeQr = options.encodeQr ?? encodePairingQr
  let issued = 0
  let qr: { readonly url: string; readonly data: string } | undefined
  const compose = async (state: RemoteTunnelState): Promise<DesktopRemoteState> => {
    const snapshot = pairingSnapshot(state, options.hostUrl())
    const url = snapshot.pairingUrl
    if (url === undefined) return snapshot
    if (qr?.url === url) return { ...snapshot, pairingQr: qr.data }
    const data = await encodeQr(url).catch(() => undefined)
    if (data === undefined) return snapshot
    qr = { url, data }
    return { ...snapshot, pairingQr: data }
  }
  return {
    snapshot: compose,
    publish: (state) => {
      const request = ++issued
      void compose(state).then((snapshot) => {
        if (request === issued) options.send(snapshot)
      })
    },
  }
}
