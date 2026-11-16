/** Development login endpoints projected from the checked-in development config. */

/** Packaging-style key carrying the auth_service origin in the development file. */
const AUTH_SERVICE_FILE_KEY = 'TOMATO_DESKTOP_AUTH_SERVICE_URL'

/** Packaging-style key carrying the company BFF origin in the development file. */
const TOMATO_WEB_FILE_KEY = 'TOMATO_DESKTOP_TOMATO_WEB_URL'

/**
 * Host runtime variables that name login services. A launching Tomato process
 * exports these for its own Host (`TOMATO_WEB_URL` is also a Web session's own
 * GUI URL), so the development launcher never inherits them.
 */
export const HOST_LOGIN_VARIABLES = ['AUTH_SERVICE_URL', 'TOMATO_WEB_URL', 'TOMATO_COMPANY_WEB_URL'] as const

/**
 * Validate one login origin without normalizing the file's spelling.
 * @param value - candidate origin.
 * @param source - name reported on failure.
 * @returns the trimmed origin, or undefined when absent.
 */
function originOf(value: string | undefined, source: string): string | undefined {
  const trimmed = value?.trim() ?? ''
  if (trimmed === '') return undefined
  let url: URL
  try { url = new URL(trimmed) }
  catch { throw new Error(`desktop development: ${source} must be an HTTP(S) origin`) }
  if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username !== '' || url.password !== ''
    || url.search !== '' || url.hash !== '' || (url.pathname !== '/' && url.pathname !== '')) {
    throw new Error(`desktop development: ${source} must be an HTTP(S) origin without credentials, path, query, or fragment`)
  }
  return url.origin
}

/**
 * Resolve the Host login variables for a development launch. Only the
 * `TOMATO_DESKTOP_*` keys select them: an exported key wins over the file.
 * @param file - parsed development env file.
 * @param env - environment inherited by the launcher.
 * @returns runtime variables to overlay on the launcher environment.
 */
export function developmentLoginEnvironment(
  file: Readonly<NodeJS.Dict<string>>,
  env: NodeJS.ProcessEnv,
): Partial<Pick<NodeJS.ProcessEnv, 'AUTH_SERVICE_URL' | 'TOMATO_WEB_URL'>> {
  const auth = originOf(env[AUTH_SERVICE_FILE_KEY] ?? file[AUTH_SERVICE_FILE_KEY], AUTH_SERVICE_FILE_KEY)
  const web = originOf(env[TOMATO_WEB_FILE_KEY] ?? file[TOMATO_WEB_FILE_KEY], TOMATO_WEB_FILE_KEY)
  return {
    ...auth === undefined ? {} : { AUTH_SERVICE_URL: auth },
    ...web === undefined ? {} : { TOMATO_WEB_URL: web },
  }
}

/**
 * Remove the inherited Host login variables from the launcher environment.
 * @param env - environment inherited by the launcher.
 * @returns the environment without {@link HOST_LOGIN_VARIABLES}.
 */
export function withoutHostLogin(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const excluded: ReadonlySet<string> = new Set(HOST_LOGIN_VARIABLES)
  return Object.fromEntries(Object.entries(env).filter(([name]) => !excluded.has(name)))
}
