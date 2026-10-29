/** Development observation wrappers for connection sockets and in-process RPC carriers. */
import type { ConnectionObservation, ConnectionObserver } from '../rpc.ts'
import type { ConnectionWebSocket } from './socket.ts'

function publish(observe: ConnectionObserver, observation: ConnectionObservation): void {
  // Observation is diagnostic only; a failing observer never changes transport behavior.
  try { observe(observation) } catch { /* the observer owns its own reporting */ }
}

function frameOf(data: unknown): unknown {
  if (typeof data !== 'string') return data
  try { return JSON.parse(data) } catch { return data }
}

/**
 * Wrap one socket so its text frames reach a development observer.
 * @param socket - physical socket owned by the channel.
 * @param path - logical channel path reported with each frame.
 * @param observe - optional observer; omission returns the socket unchanged.
 * @returns the socket the channel consumes.
 */
export function observeConnectionWebSocket(
  socket: ConnectionWebSocket,
  path: string,
  observe?: ConnectionObserver,
): ConnectionWebSocket {
  if (observe === undefined) return socket
  // The shell's own listener keeps received frames observable even when the channel attaches none yet.
  socket.addEventListener('message', (payload) => {
    publish(observe, { kind: 'stream', path, direction: 'in', at: Date.now(), frame: frameOf(payload.data) })
  })
  return {
    get readyState() { return socket.readyState },
    send(data) {
      publish(observe, { kind: 'stream', path, direction: 'out', at: Date.now(), frame: frameOf(data) })
      socket.send(data)
    },
    close(code, reason) { socket.close(code, reason) },
    addEventListener(event, listener, options) { socket.addEventListener(event, listener, options) },
    removeEventListener(event, listener) { socket.removeEventListener(event, listener) },
  }
}
