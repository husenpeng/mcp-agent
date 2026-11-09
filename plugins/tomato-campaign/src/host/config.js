/**
 * Configuration for the campaign workspace plugin.
 *
 * The company BFF origin comes from the profile (or `TOMATO_WEB_URL`, which the
 * Desktop shell sets to the company origin). Absence is reported at request time
 * instead of failing plugin activation, so a checkout without the URL still boots.
 */

/** Default prefix the browser half calls on the harness origin. */
export const DEFAULT_PROXY_PATH = '/api/clientweb'

/** Cookie the local gateway writes for its auth_service session. */
export const DEFAULT_SESSION_COOKIE = 'tomato_session'

/** Header the Desktop main process uses to carry the session to the Host. */
export const DEFAULT_SESSION_HEADER = 'x-tomato-session'

/**
 * Normalize one HTTP(S) origin.
 * @param value - configured or environment-provided origin.
 * @returns the origin without a trailing slash, or an empty string.
 */
export function normalizeOrigin(value) {
  if (typeof value !== 'string' || value.trim() === '') return ''
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return ''
    return url.origin
  } catch {
    return ''
  }
}

/**
 * Resolve the effective configuration.
 * @param raw - plugin config from cordis.yml.
 * @param env - process environment.
 * @returns validated settings; every field has a documented default.
 */
export function resolveConfig(raw = {}, env = {}) {
  const baseUrl = normalizeOrigin(raw.baseUrl ?? env.TOMATO_WEB_URL ?? '')
  const proxyPath = typeof raw.proxyPath === 'string' && raw.proxyPath.startsWith('/')
    ? raw.proxyPath.replace(/\/$/, '')
    : DEFAULT_PROXY_PATH
  const timeoutMs = Number.isFinite(raw.timeoutMs) && raw.timeoutMs > 0 ? raw.timeoutMs : 30000
  return {
    baseUrl,
    proxyPath,
    sessionCookie: raw.sessionCookie || DEFAULT_SESSION_COOKIE,
    sessionHeader: raw.sessionHeader || DEFAULT_SESSION_HEADER,
    timeoutMs,
    tools: raw.tools !== false,
    allowWrites: raw.allowWrites !== false,
    skill: raw.skill !== false,
  }
}

/**
 * Whether the proxy has an upstream to forward to.
 * @param config - resolved configuration.
 * @returns true when a base URL was configured.
 */
export function isConfigured(config) {
  return config.baseUrl !== ''
}