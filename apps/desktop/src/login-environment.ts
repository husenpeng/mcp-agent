/** Login service origins sealed into the packaged manifest and overridable at launch. */

/** Login endpoints the Host gateway and the account links both read. */
export interface DesktopLoginEnvironment {
  /** auth_service origin, or an empty string when login is unconfigured. */
  readonly authServiceUrl: string
  /** Company BFF origin, or an empty string when login is unconfigured. */
  readonly tomatoWebUrl: string
}

/** Manifest key carrying the auth_service origin baked by packaging. */
const AUTH_MANIFEST_KEY = 'dshAuthServiceUrl'

/** Manifest key carrying the company BFF origin baked by packaging. */
const TOMATO_MANIFEST_KEY = 'dshTomatoWebUrl'

/** Runtime variable that overrides the packaged auth_service origin. */
export const AUTH_SERVICE_ENV = 'AUTH_SERVICE_URL'

/** Runtime variable that overrides the packaged company BFF origin. */
export const TOMATO_WEB_ENV = 'TOMATO_WEB_URL'

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
  }
}

/**
 * Project the resolved origins into a Host environment, leaving the inherited
 * values in place when neither source configures one.
 * @param env - environment inherited by the Desktop shell.
 * @param login - resolved origins.
 * @returns a new environment carrying the effective login variables.
 */
export function withLoginEnvironment(env: NodeJS.ProcessEnv, login: DesktopLoginEnvironment): NodeJS.ProcessEnv {
  return {
    ...env,
    ...login.authServiceUrl === '' ? {} : { [AUTH_SERVICE_ENV]: login.authServiceUrl },
    ...login.tomatoWebUrl === '' ? {} : { [TOMATO_WEB_ENV]: login.tomatoWebUrl },
  }
}
