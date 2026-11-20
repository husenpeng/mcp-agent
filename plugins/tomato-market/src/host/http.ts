// HTTP reads with the bounds this market needs: a deadline, a byte cap, no
// redirects beyond a small chain, and a stable user agent. The Host process
// supplies `fetch`, so the deployment's outbound proxy applies.

/** Default deadline of one read, including its body. */
export const DEFAULT_TIMEOUT_MS = 20_000
/** Default largest body this plugin keeps. */
export const DEFAULT_MAX_BYTES = 32 * 1024 * 1024

/** Bounds one read may set. */
export interface ReadOptions {
  readonly timeoutMs?: number | undefined
  readonly maxBytes?: number | undefined
  readonly signal?: AbortSignal | undefined
  readonly accept?: string | undefined
}

/** A text read's result. */
export interface TextRead {
  readonly text: string
  readonly url: string
}

/** A byte read's result. */
export interface BytesRead {
  readonly bytes: Uint8Array
  readonly url: string
}

/** A JSON read's result. */
export interface JsonRead {
  readonly value: unknown
  readonly url: string
}

/** A read function the market caches and reuses; tests supply their own. */
export type HttpReader = (url: string, options?: ReadOptions) => Promise<JsonRead>

/**
 * Read a response body into bytes, stopping at a byte cap.
 * @param response - an ok response.
 * @param maxBytes - largest accepted body.
 * @returns the body.
 * @throws {Error} when the body exceeds `maxBytes`.
 */
async function readBytes(response: Response, maxBytes: number): Promise<Uint8Array> {
  const declared = Number(response.headers.get('content-length') ?? '0')
  if (Number.isFinite(declared) && declared > maxBytes) throw new Error(`body over ${maxBytes} bytes`)
  if (response.body === null) return new Uint8Array()
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
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
 * @param response - an ok response.
 * @param maxBytes - largest accepted body.
 * @returns the decoded body.
 */
async function readBody(response: Response, maxBytes: number): Promise<string> {
  return new TextDecoder('utf-8').decode(await readBytes(response, maxBytes))
}

/**
 * The signal one read runs under: its own deadline, combined with the caller's cancellation.
 * @param options - the read bounds.
 * @returns the combined signal.
 */
function readSignal(options: ReadOptions): AbortSignal {
  const deadline = AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  return options.signal === undefined ? deadline : AbortSignal.any([deadline, options.signal])
}

/**
 * Read a text resource.
 * @param url - absolute http(s) URL.
 * @param options - read bounds.
 * @returns the body and the URL that answered.
 * @throws {Error} on a network failure, non-2xx status, or oversized body.
 */
export async function fetchText(url: string, options: ReadOptions = {}): Promise<TextRead> {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: readSignal(options),
    headers: {
      'accept': options.accept ?? 'text/plain, application/json;q=0.9, */*;q=0.8',
      'user-agent': 'tomato-market/0.1.0 (+https://github.com/deepseek-ai/deepseek-harness)',
    },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`)
  return {
    text: await readBody(response, options.maxBytes ?? DEFAULT_MAX_BYTES),
    url: response.url === '' ? url : response.url,
  }
}

/**
 * Read a binary resource.
 * @param url - absolute http(s) URL.
 * @param options - read bounds.
 * @returns the body and the URL that answered.
 * @throws {Error} on a network failure, non-2xx status, or oversized body.
 */
export async function fetchBytes(url: string, options: ReadOptions = {}): Promise<BytesRead> {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: readSignal(options),
    headers: { 'user-agent': 'tomato-market/0.1.0' },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`)
  return {
    bytes: await readBytes(response, options.maxBytes ?? DEFAULT_MAX_BYTES),
    url: response.url === '' ? url : response.url,
  }
}

/**
 * Read a JSON resource.
 * @param url - absolute http(s) URL.
 * @param options - read bounds, as {@link fetchText}.
 * @returns the parsed document and the URL that answered.
 * @throws {Error} on a network failure, non-2xx status, oversized body, or invalid JSON.
 */
export async function fetchJson(url: string, options: ReadOptions = {}): Promise<JsonRead> {
  const { text, url: answered } = await fetchText(url, { ...options, accept: 'application/json' })
  return { value: JSON.parse(text), url: answered }
}

/** A successful read remembered for a while, with concurrent callers sharing one in-flight read. */
export interface Cache<T> {
  /** @param refresh - read again instead of answering from the lifetime. @returns the read value. */
  get(refresh?: boolean): Promise<T>
  /** Forget the remembered value. */
  clear(): void
}

/**
 * A successful read remembered for a while, with concurrent callers sharing one in-flight read.
 * @param options - the read and its lifetime.
 * @returns the cache.
 */
export function createCache<T>({ read, ttlMs }: { readonly read: () => Promise<T>; readonly ttlMs: number }): Cache<T> {
  let settled: { value: T } | undefined
  let startedAt = 0
  let pending: Promise<T> | undefined
  const start = (): Promise<T> => {
    startedAt = Date.now()
    pending = read().then(
      (value) => {
        settled = { value }
        return value
      },
      (error: unknown) => {
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