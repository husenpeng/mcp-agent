/**
 * Client for the company BFF used by the model-facing tools.
 *
 * Two envelopes live behind the BFF: campaign answers `{ code, message, data,
 * meta }` with a numeric code (`< 40000` is success, `2xxxx` is a warning), while
 * search and outreach answer `{ data, meta }` or `{ error: { code, message } }`.
 * This module normalizes both into one `{ ok, data, error, meta, httpStatus }`
 * result so tools never branch on the upstream family.
 */

/** Numeric campaign code from which an answer is an error. */
const CAMPAIGN_ERROR_CODE = 40000

/** One failed BFF call, classified for tool guidance. */
export class BffError extends Error {
  /**
   * @param failure - stable category the tool maps to advice.
   * @param message - model-facing explanation.
   * @param options - standard error options.
   */
  constructor(failure, message, options = {}) {
    super(message, options)
    this.name = 'BffError'
    this.failure = failure
  }
}

/**
 * Normalize one decoded body.
 * @param body - decoded JSON, or undefined when the answer had none.
 * @param httpStatus - upstream HTTP status.
 * @returns the normalized result.
 */
export function normalizeEnvelope(body, httpStatus) {
  if (body === undefined || body === null) {
    return { ok: httpStatus >= 200 && httpStatus < 400, data: null, error: null, meta: null, httpStatus }
  }
  if (Array.isArray(body)) {
    return { ok: httpStatus >= 200 && httpStatus < 400, data: body, error: null, meta: null, httpStatus }
  }
  if (typeof body !== 'object') {
    return { ok: httpStatus >= 200 && httpStatus < 400, data: body, error: null, meta: null, httpStatus }
  }
  const meta = body.meta ?? null
  if (typeof body.code === 'number') {
    const ok = body.code < CAMPAIGN_ERROR_CODE
    return {
      ok,
      data: ok ? body.data ?? null : null,
      error: ok ? null : { code: body.code, message: body.message ?? 'campaign request failed', details: body.details ?? null },
      meta,
      httpStatus,
    }
  }
  if (body.error && typeof body.error === 'object') {
    return {
      ok: false,
      data: null,
      error: { code: body.error.code ?? 'UPSTREAM_ERROR', message: body.error.message ?? 'request failed', retryable: body.error.retryable },
      meta,
      httpStatus,
    }
  }
  return { ok: httpStatus >= 200 && httpStatus < 400, data: body.data ?? body, error: null, meta, httpStatus }
}

/**
 * Build the BFF client.
 * @param options - base URL, timeout, and a callback receiving the session the last call used.
 * @returns an async caller plus its bound origin.
 */
export function createBff({ baseUrl, timeoutMs, onSession }) {
  /**
   * Call one BFF path.
   * @param path - absolute path beginning with `/api/`.
   * @param options - method, query, JSON body, session, and an optional abort signal.
   * @returns the normalized result.
   * @throws {BffError} on transport failure, unconfigured origin, or a missing session.
   */
  async function call(path, options = {}) {
    if (baseUrl === '') throw new BffError('unconfigured', '公司 BFF 未配置：在插件配置里设置 baseUrl（或 TOMATO_WEB_URL）。')
    const session = options.session
    if (!session) throw new BffError('unauthenticated', '还没有登录公司账号：先在 Settings → Account 用飞书登录，再调用这个工具。')
    if (typeof path !== 'string' || !path.startsWith('/api/')) {
      throw new BffError('rejected', `BFF 路径必须以 /api/ 开头：${String(path)}`)
    }
    if (onSession) onSession(session)
    const url = new URL(path, baseUrl)
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value === undefined || value === null || value === '') continue
      url.searchParams.set(key, String(value))
    }
    const headers = { accept: 'application/json', cookie: `session_id=${session}` }
    let body
    if (options.body !== undefined) {
      headers['content-type'] = 'application/json'
      body = JSON.stringify(options.body)
    }
    const signals = [AbortSignal.timeout(timeoutMs)]
    if (options.signal) signals.push(options.signal)
    let response
    try {
      response = await fetch(url, {
        method: options.method ?? 'GET',
        headers,
        body,
        redirect: 'manual',
        signal: signals.length > 1 ? AbortSignal.any(signals) : signals[0],
      })
    } catch (cause) {
      throw new BffError('transient', `请求公司 BFF 失败：${cause?.message ?? String(cause)}`, { cause })
    }
    const text = await response.text()
    let decoded
    if (text !== '') {
      try {
        decoded = JSON.parse(text)
      } catch {
        throw new BffError('rejected', `公司 BFF 返回了非 JSON 内容（HTTP ${response.status}）。`)
      }
    }
    const result = normalizeEnvelope(decoded, response.status)
    if (response.status === 401 || response.status === 403) {
      return { ...result, ok: false, error: { code: 'UNAUTHENTICATED', message: '会话已失效，请重新登录。' } }
    }
    return result
  }

  return { call, origin: baseUrl }
}