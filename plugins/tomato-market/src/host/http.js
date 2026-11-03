// HTTP reads with the bounds this market needs: a deadline, a byte cap, no
// redirects beyond a small chain, and a stable user agent. The Host process
// supplies `fetch`, so the deployment's outbound proxy applies.

/** Default deadline of one read, including its body. */
export const DEFAULT_TIMEOUT_MS = 20_000
/** Default largest body this plugin keeps. */
export const DEFAULT_MAX_BYTES = 32 * 1024 * 1024

/**
 * Read a response body into bytes, stopping at a byte cap.
 * @param {Response} response - an ok response.
 * @param {number} maxBytes - largest accepted body.
 * @returns {Promise<Uint8Array>} the body.
 * @throws {Error} when the body exceeds `maxBytes`.
 */
async function readBytes(response, maxBytes) {
  const declared = Number(response.headers.get('content-length') ?? '0')
  if (Number.isFinite(declared) && declared > maxBytes) throw new Error(`body over ${maxBytes} bytes`)
  if (response.body === null) return new Uint8Array()
  const reader = response.body.getReader()
  const chunks = []
  let total = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maxBytes) throw new Error(`body over ${maxBytes} bytes`)
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return merged
}

/**
 * Read a response body into text.
 * @param {Response} response - an ok response.
 * @param {number} maxBytes - largest accepted body.
 * @returns {Promise<string>} the decoded body.
 */
async function readBody(response, maxBytes) {
  return new TextDecoder('utf-8').decode(await readBytes(response, maxBytes))
}

/**
 * Read a text resource.
 * @param {string} url - absolute http(s) URL.
 * @param {{ timeoutMs?: number, maxBytes?: number, signal?: AbortSignal, accept?: string }} [options] - read bounds.
 * @returns {Promise<{ text: string, url: string }>} the body and the URL that answered.
 * @throws {Error} on a network failure, non-2xx status, or oversized body.
 */
export async function fetchText(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
  const deadline = AbortSignal.timeout(timeoutMs)
  const signal = options.signal === undefined ? deadline : AbortSignal.any([deadline, options.signal])
  const response = await fetch(url, {
    redirect: 'follow',
    signal,
    headers: {
      'accept': options.accept ?? 'text/plain, application/json;q=0.9, */*;q=0.8',
      'user-agent': 'tomato-market/0.1.0 (+https://github.com/deepseek-ai/deepseek-harness)',
    },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`)
  return { text: await readBody(response, maxBytes), url: response.url === '' ? url : response.url }
}

/**
 * Read a binary resource.
 * @param {string} url - absolute http(s) URL.
 * @param {{ timeoutMs?: number, maxBytes?: number, signal?: AbortSignal }} [options] - read bounds.
 * @returns {Promise<{ bytes: Uint8Array, url: string }>} the body and the URL that answered.
 * @throws {Error} on a network failure, non-2xx status, or oversized body.
 */
export async function fetchBytes(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
  const deadline = AbortSignal.timeout(timeoutMs)
  const signal = options.signal === undefined ? deadline : AbortSignal.any([deadline, options.signal])
  const response = await fetch(url, { redirect: 'follow', signal, headers: { 'user-agent': 'tomato-market/0.1.0' } })
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`)
  return { bytes: await readBytes(response, maxBytes), url: response.url === '' ? url : response.url }
}

/**
 * Read a JSON resource.
 * @param {string} url - absolute http(s) URL.
 * @param {object} [options] - read bounds, as {@link fetchText}.
 * @returns {Promise<{ value: unknown, url: string }>} the parsed document and the URL that answered.
 * @throws {Error} on a network failure, non-2xx status, oversized body, or invalid JSON.
 */
export async function fetchJson(url, options = {}) {
  const { text, url: answered } = await fetchText(url, { ...options, accept: 'application/json' })
  return { value: JSON.parse(text), url: answered }
}

/**
 * A successful read remembered for a while, with concurrent callers sharing one in-flight read.
 * @param {{ read: () => Promise<unknown>, ttlMs: number }} options - the read and its lifetime.
 * @returns {{ get: (refresh?: boolean) => Promise<unknown>, clear: () => void }} the cache.
 */
export function createCache({ read, ttlMs }) {
  let settled
  let startedAt = 0
  let pending
  const start = () => {
    startedAt = Date.now()
    pending = read().then(
      value => {
        settled = { value }
        return value
      },
      error => {
        settled = undefined
        throw error
      },
    ).finally(() => {
      pending = undefined
    })
    return pending
  }
  return {
    get(refresh = false) {
      if (!refresh && settled !== undefined && Date.now() - startedAt < ttlMs) return Promise.resolve(settled.value)
      if (pending !== undefined) return pending
      return start()
    },
    clear() {
      settled = undefined
      startedAt = 0
    },
  }
}