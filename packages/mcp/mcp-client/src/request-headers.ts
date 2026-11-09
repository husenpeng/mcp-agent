/**
 * Per-request header injection for the Streamable HTTP transport.
 *
 * Static `headers` cannot carry identity that changes between calls (the
 * signed-in company account, a request-scoped token). The transport therefore
 * accepts a `requestHeaders(execution)` resolver: the tool bridge evaluates it
 * around one `tools/call`, and the wrapped `fetch` merges the resulting headers
 * into that call's request only. `AsyncLocalStorage` keeps concurrent calls
 * isolated, including calls that interleave inside the same client.
 *
 * @module
 */

import { AsyncLocalStorage } from 'node:async_hooks'

/** Headers resolved for the tool call currently running on this async chain. */
const scope = new AsyncLocalStorage<Record<string, string>>()

/**
 * Run work with the headers resolved for one outbound call.
 * @param headers - resolved headers; an empty or absent record runs unchanged.
 * @param run - the call to execute inside the header scope.
 * @returns the call's result.
 */
export function withRequestHeaders<T>(headers: Record<string, string> | undefined, run: () => Promise<T>): Promise<T> {
  if (headers === undefined || Object.keys(headers).length === 0) return run()
  return scope.run(headers, run)
}

/**
 * Read the headers that belong to the current async chain.
 * @returns the resolved headers, or undefined outside a scoped call.
 */
export function currentRequestHeaders(): Record<string, string> | undefined {
  return scope.getStore()
}

/** Minimal fetch surface the wrapper preserves. */
export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

/**
 * Wrap a fetch so every request sent inside a header scope carries that scope's
 * headers. Explicit values win over the transport's static `headers`, while the
 * scope's own keys never remove unrelated request headers.
 * @param base - the fetch that performs the request (global fetch by default).
 * @returns a fetch that applies the current scope's headers.
 */
export function headersApplyingFetch(base: FetchLike = fetch): FetchLike {
  return (input, init) => {
    const scoped = currentRequestHeaders()
    if (scoped === undefined) return base(input, init)
    const headers = new Headers(init?.headers)
    for (const [name, value] of Object.entries(scoped)) headers.set(name, value)
    return base(input, { ...init, headers })
  }
}
