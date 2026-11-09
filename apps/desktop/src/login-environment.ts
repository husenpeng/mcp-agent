/** Login service origins sealed into the packaged manifest and overridable at launch. */

/** Login endpoints the Host gateway and the account links both read. */
export interface DesktopLoginEnvironment {
  /** auth_service origin, or an empty string when login is unconfigured. */
  readonly authServiceUrl: string
  /** Company BFF origin, or an empty string when login is unconfigured. */
  readonly tomatoWebUrl: string
  /** Company IM service origin for the direct MCP connection, or an empty string. */
  readonly imServiceUrl: string
}

/** Manifest key carrying the auth_service origin baked by packaging. */
const AUTH_MANIFEST_KEY = 'tomatoAuthServiceUrl'

/** Manifest key carrying the company BFF origin baked by packaging. */
const TOMATO_MANIFEST_KEY = 'tomatoTomatoWebUrl'

/** Manifest key carrying the company IM service origin baked by packaging. */
const IM_MANIFEST_KEY = 'tomatoImServiceUrl'

/** Runtime variable that overrides the packaged auth_service origin. */
export const AUTH_SERVICE_ENV = 'AUTH_SERVICE_URL'

/** Runtime variable that overrides the packaged company BFF origin. */
export const TOMATO_WEB_ENV = 'TOMATO_WEB_URL'

/**
 * Runtime variable carrying the company search gateway origin. The Host's
 * `web-search-company` provider reads it; it defaults to the same BFF origin
 * because `/api/v1/search/web` is served by that BFF.
 */
export const SEARCH_GATEWAY_ENV = 'TOMATO_SEARCH_GATEWAY_URL'

/**
 * Runtime variable carrying the company IM service origin (`/mcp/im` base).
 * The direct MCP row reads it; packaging may bake the same value.
 */
export const IM_SERVICE_ENV = 'TOMATO_IM_SERVICE_URL'

/**
 * Read one optional HTTP(S) origin.
 * @param value - candidate value from the manifest or the environment.
 * @param source - name reported in the failure.
 * @returns the normalized origin, or undefined when the value is absent or empty.
 */
function readOrigin(value: unknown, source: string): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string') throw new Error(`desktop login: ${source} must be an HTTP(S) origin`)
  const trimmed = value.trim()
  if (trimmed === '') return undefined
  let url: URL
  try { url = new URL(trimmed) }
  catch { throw new Error(`desktop login: ${source} must be an HTTP(S) origin`) }
  if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username !== '' || url.password !== ''
    || url.search !== '' || url.hash !== '' || (url.pathname !== '/' && url.pathname !== '')) {
    throw new Error(`desktop login: ${source} must be an HTTP(S) origin without credentials, path, query, or fragment`)
  }
  return url.origin
}

/**
 * Resolve the effective login origins: an explicit launch environment wins over
 * the origins packaging sealed into the manifest.
 * @param manifest - parsed application manifest.
 * @param env - environment inherited by the Desktop shell.
 * @returns both origins, individually empty when neither source configures them.
 */
export function resolveLoginEnvironment(manifest: unknown, env: NodeJS.ProcessEnv): DesktopLoginEnvironment {
  if (typeof manifest !== 'object' || manifest === null) throw new Error('desktop login: invalid application manifest')
  const record = manifest as Record<string, unknown>
  return {
    authServiceUrl: readOrigin(env[AUTH_SERVICE_ENV], AUTH_SERVICE_ENV)
      ?? readOrigin(record[AUTH_MANIFEST_KEY], AUTH_MANIFEST_KEY)
      ?? '',
    tomatoWebUrl: readOrigin(env[TOMATO_WEB_ENV], TOMATO_WEB_ENV)
      ?? readOrigin(record[TOMATO_MANIFEST_KEY], TOMATO_MANIFEST_KEY)
      ?? '',
    imServiceUrl: readOrigin(env[IM_SERVICE_ENV], IM_SERVICE_ENV)
      ?? readOrigin(record[IM_MANIFEST_KEY], IM_MANIFEST_KEY)
      ?? '',
  }
}

/**
 * Project the resolved origins into a Host environment, leaving the inherited
 * values in place when neither source configures one. The search gateway
 * defaults to the BFF origin because the BFF serves the search endpoint; an
 * explicit `TOMATO_SEARCH_GATEWAY_URL` wins.
 * @param env - environment inherited by the Desktop shell.
 * @param login - resolved origins.
 * @returns a new environment carrying the effective login variables.
 */
export function withLoginEnvironment(env: NodeJS.ProcessEnv, login: DesktopLoginEnvironment): NodeJS.ProcessEnv {
  return {
    ...env,
    ...login.authServiceUrl === '' ? {} : { [AUTH_SERVICE_ENV]: login.authServiceUrl },
    ...login.tomatoWebUrl === '' ? {} : { [TOMATO_WEB_ENV]: login.tomatoWebUrl },
    ...login.tomatoWebUrl === '' || env[SEARCH_GATEWAY_ENV] !== undefined
      ? {} : { [SEARCH_GATEWAY_ENV]: login.tomatoWebUrl },
    ...login.imServiceUrl === '' ? {} : { [IM_SERVICE_ENV]: login.imServiceUrl },
  }
}
