/**
 * Browser-side access to the company BFF through the plugin's same-origin proxy.
 *
 * Every call carries the harness session cookie implicitly (same origin), so the
 * page never handles a credential. Both upstream envelopes are normalized to the
 * payload the views render, and a response that is not an envelope still reports
 * its HTTP status instead of surfacing a parse error to the person.
 */

/** Prefix registered by the host half. */
export const PROXY_PATH = '/api/clientweb'

/** One rejected call with a message the views can show. */
export class ApiError extends Error {
  /**
   * @param message - text the view shows.
   * @param status - HTTP status, or the business code when the envelope carried one.
   */
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Text for a body that did not parse as JSON. */
const NOT_JSON = '服务返回了非 JSON 内容'

/**
 * Normalize the campaign (`{code,message,data}`) and search (`{data}`/`{error}`) envelopes.
 * @param body - decoded JSON body.
 * @returns the payload.
 * @throws {ApiError} when the envelope reports a failure.
 */
function unwrap(body) {
  if (body === null || body === undefined) return null
  if (typeof body !== 'object') return body
  if (typeof body.code === 'number') {
    if (body.code >= 40000) throw new ApiError(body.message || `请求失败（${body.code}）`, body.code)
    return body.data ?? null
  }
  if (body.error && typeof body.error === 'object') {
    throw new ApiError(body.error.message || '请求失败', body.error.code)
  }
  return body.data ?? body
}

/**
 * Escape one path segment.
 * @param value - raw id.
 * @returns the segment.
 */
function enc(value) {
  return encodeURIComponent(String(value))
}

/**
 * Call one BFF path through the proxy.
 * @param path - path below the proxy prefix, beginning with `/v1` or `/outreach`.
 * @param options - method, query, and JSON body.
 * @returns the unwrapped payload.
 * @throws {ApiError} when the call fails.
 */
export async function request(path, options = {}) {
  const url = new URL(`${PROXY_PATH}${path}`, window.location.origin)
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value === undefined || value === null || value === '') continue
    url.searchParams.set(key, String(value))
  }
  const init = { method: options.method ?? 'GET', headers: { accept: 'application/json' }, credentials: 'same-origin' }
  if (options.body !== undefined) {
    init.headers['content-type'] = 'application/json'
    init.body = JSON.stringify(options.body)
  }
  let response
  try {
    response = await fetch(url, init)
  } catch (cause) {
    throw new ApiError(`网络不可用：${cause.message}`, 0)
  }
  const text = await response.text()
  // The gateway answers an expired browser session before the proxy runs, so a
  // 401 means signing in again whatever the body looks like.
  if (response.status === 401) throw new ApiError('会话已失效，请重新登录公司账号。', 401)
  if (text === '') {
    if (!response.ok) throw new ApiError(`请求失败（HTTP ${response.status}）`, response.status)
    return null
  }
  let body
  try {
    body = JSON.parse(text)
  } catch {
    throw new ApiError(response.ok ? NOT_JSON : `${NOT_JSON}（HTTP ${response.status}）`, response.status)
  }
  if (!response.ok) {
    // An unreconciled error body (for example `{"message":"未登录"}`) must still
    // fail the call; otherwise the views render an empty list with no reason.
    const message = typeof body?.error?.message === 'string'
      ? body.error.message
      : typeof body?.message === 'string' ? body.message : `请求失败（HTTP ${response.status}）`
    throw new ApiError(message, response.status)
  }
  return unwrap(body)
}

/** Proxy health and session projection. */
export async function fetchStatus() {
  try {
    const response = await fetch(`${PROXY_PATH}/_status`, { credentials: 'same-origin' })
    if (!response.ok) return { signedIn: false, configured: false }
    return await response.json()
  } catch {
    return { signedIn: false, configured: false }
  }
}

/** @returns the campaign list payload. */
export function fetchCampaigns(query) {
  return request('/v1/campaigns', { query })
}

/** @returns one campaign's detail. */
export function fetchCampaign(campaignId) {
  return request(`/v1/campaigns/${enc(campaignId)}`)
}

/** @returns the campaign's creator roster. */
export function fetchRoster(campaignId, query) {
  return request(`/v1/campaigns/${enc(campaignId)}/creators`, { query })
}

/** @returns the campaign's role cards and their search-task state. */
export function fetchRoleCards(campaignId) {
  return request(`/v1/campaigns/${enc(campaignId)}/role-cards`)
}

/** @returns the outreach thread list for one box. */
export function fetchThreads(box, query) {
  const path = box === 'archived' ? '/outreach/threads/archived' : '/outreach/threads'
  return request(path, { query })
}

/** @returns campaigns with creators waiting to be contacted. */
export function fetchPendingOutreach(query) {
  return request('/outreach/campaigns/pending', { query })
}

/**
 * Patch the fields a campaign detail page owns.
 * @param campaignId - campaign id.
 * @param patch - fields to change, keyed as the detail response names them.
 * @returns the updated campaign.
 */
export function updateCampaign(campaignId, patch) {
  return request(`/v1/campaigns/${enc(campaignId)}`, { method: 'PATCH', body: patch })
}

/**
 * Create a campaign.
 * @param body - creation fields; name and brand are the minimum.
 * @returns the created campaign.
 */
export function createCampaign(body) {
  return request('/v1/campaigns', { method: 'POST', body })
}

/**
 * Append one role card.
 * @param campaignId - campaign id.
 * @param card - role-card fields.
 * @returns the created card and its field warnings.
 */
export function createRoleCard(campaignId, card) {
  return request(`/v1/campaigns/${enc(campaignId)}/role-cards`, { method: 'POST', body: card })
}

/**
 * Start the asynchronous creator search for one role card.
 * @param campaignId - campaign id.
 * @param cardId - role-card id.
 * @returns the task id and status.
 */
export function startSearchTask(campaignId, cardId) {
  return request(`/v1/campaigns/${enc(campaignId)}/role-cards/${enc(cardId)}/search-task`, { method: 'POST', body: {} })
}

/**
 * Read the latest report of one role card's search task.
 * @param campaignId - campaign id.
 * @param cardId - role-card id.
 * @returns the report payload.
 */
export function fetchSearchReport(campaignId, cardId) {
  return request(`/v1/campaigns/${enc(campaignId)}/role-cards/${enc(cardId)}/search-task/report`)
}

/**
 * Import creators from a Feishu sheet link.
 * @param campaignId - campaign id.
 * @param url - Feishu bitable link.
 * @returns the import acknowledgement.
 */
export function importFeishuRoster(campaignId, url) {
  return request(`/v1/campaigns/${enc(campaignId)}/creators/import-feishu`, { method: 'POST', body: { url } })
}

/**
 * Remove one creator from the campaign.
 * @param campaignId - campaign id.
 * @param creatorKey - roster key, such as `INSTAGRAM:handle`.
 * @returns null; the service answers 204.
 */
export function removeCreator(campaignId, creatorKey) {
  return request(`/v1/campaigns/${enc(campaignId)}/creators/${enc(creatorKey)}`, { method: 'DELETE' })
}

/** @returns the reply acknowledgment. */
export function replyToThread(threadId, text, subject) {
  const paragraphs = text.split(/\n{2,}/).map(part => part.trim()).filter(Boolean)
  const bodyHtml = paragraphs
    .map(part => `<p>${part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</p>`)
    .join('')
  return request(`/outreach/threads/${enc(threadId)}/reply`, {
    method: 'POST',
    body: { bodyHtml, bodyText: text, subject: subject ?? null },
  })
}