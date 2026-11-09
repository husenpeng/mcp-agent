/**
 * Compose what the remote-access page needs from the Host's authenticated URL:
 * the phone pairing link (tunnel root plus the launch token) and a QR image of it.
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
