/** Development login endpoints projected from the checked-in development config. */

/** Packaging-style key carrying the auth_service origin in the development file. */
const AUTH_SERVICE_FILE_KEY = 'DSH_DESKTOP_AUTH_SERVICE_URL'

/** Packaging-style key carrying the company BFF origin in the development file. */
const TOMATO_WEB_FILE_KEY = 'DSH_DESKTOP_TOMATO_WEB_URL'

/** Host runtime variable consumed by the local gateway. */
const AUTH_SERVICE_ENV = 'AUTH_SERVICE_URL'

/** Host runtime variable consumed by the local gateway and account links. */
const TOMATO_WEB_ENV = 'TOMATO_WEB_URL'

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
 * Resolve the Host login variables for a development launch.
 * @param file - parsed development env file.
 * @param env - environment inherited by the launcher.
 * @returns runtime variables to overlay on the launcher environment.
 */
export function developmentLoginEnvironment(
  file: Readonly<NodeJS.Dict<string>>,
  env: NodeJS.ProcessEnv,
): Partial<Pick<NodeJS.ProcessEnv, 'AUTH_SERVICE_URL' | 'TOMATO_WEB_URL'>> {
  const auth = originOf(env[AUTH_SERVICE_ENV] ?? env[AUTH_SERVICE_FILE_KEY] ?? file[AUTH_SERVICE_FILE_KEY], AUTH_SERVICE_ENV)
  const web = originOf(env[TOMATO_WEB_ENV] ?? env[TOMATO_WEB_FILE_KEY] ?? file[TOMATO_WEB_FILE_KEY], TOMATO_WEB_ENV)
  return {
    ...auth === undefined ? {} : { AUTH_SERVICE_URL: auth },
    ...web === undefined ? {} : { TOMATO_WEB_URL: web },
  }
}
