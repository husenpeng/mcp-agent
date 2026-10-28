/** Resolve public release identifiers supplied by the packaging environment. */

/** Environment variable that supplies the Electron application identifier. */
export const DESKTOP_APP_ID_ENV = 'TOMATO_DESKTOP_APP_ID'

/** Environment variable that supplies electron-builder's macOS certificate qualifier. */
export const MACOS_SIGNING_IDENTITY_ENV = 'TOMATO_DESKTOP_MACOS_SIGNING_IDENTITY'

/** Environment variable that supplies the expected Apple Developer Team ID. */
export const MACOS_TEAM_ID_ENV = 'TOMATO_DESKTOP_MACOS_TEAM_ID'

/** Environment variable that selects the npm registry used for the bundled runtime install. */
export const NPM_REGISTRY_ENV = 'TOMATO_DESKTOP_NPM_REGISTRY'

/** Environment variable carrying the auth_service origin sealed into the application. */
export const AUTH_SERVICE_URL_ENV = 'TOMATO_DESKTOP_AUTH_SERVICE_URL'

/** Environment variable carrying the company BFF origin sealed into the application. */
export const TOMATO_WEB_URL_ENV = 'TOMATO_DESKTOP_TOMATO_WEB_URL'

const DEFAULT_NPM_REGISTRY = 'https://registry.npmjs.org/'

const APPLE_API_KEY_ENV = 'APPLE_API_KEY'
const APPLE_API_KEY_ID_ENV = 'APPLE_API_KEY_ID'
const APPLE_API_ISSUER_ENV = 'APPLE_API_ISSUER'
const APPLE_ID_ENV = 'APPLE_ID'
const APPLE_APP_SPECIFIC_PASSWORD_ENV = 'APPLE_APP_SPECIFIC_PASSWORD'
const APPLE_TEAM_ID_ENV = 'APPLE_TEAM_ID'
const APPLE_KEYCHAIN_ENV = 'APPLE_KEYCHAIN'
const APPLE_KEYCHAIN_PROFILE_ENV = 'APPLE_KEYCHAIN_PROFILE'

/**
 * Read one required non-empty environment variable.
 * @param {NodeJS.ProcessEnv} env - Packaging environment.
 * @param {string} name - Required variable name.
 * @returns {string} Trimmed variable value.
 */
function requireEnvironmentValue(env, name) {
  const value = env[name]?.trim()
  if (value === undefined || value === '') {
    throw new Error(`desktop release environment: ${name} must be set to a non-empty value`)
  }
  return value
}

/**
 * Resolve the npm registry used to materialize the bundled runtime and its external dependencies.
 * @param {NodeJS.ProcessEnv} env - Packaging environment.
 * @returns {string} Registry origin; the public registry unless a local mirror is configured.
 */
export function resolveNpmRegistry(env) {
  const configured = env[NPM_REGISTRY_ENV]?.trim() ?? ''
  if (configured === '') return DEFAULT_NPM_REGISTRY
  let url
  try { url = new URL(configured) }
  catch { throw new Error(`desktop release environment: ${NPM_REGISTRY_ENV} must be an HTTPS origin`) }
  if (url.protocol !== 'https:' || url.username !== '' || url.password !== '' || url.search !== '' || url.hash !== ''
    || (url.pathname !== '/' && url.pathname !== '')) {
    throw new Error(`desktop release environment: ${NPM_REGISTRY_ENV} must be an HTTPS origin without credentials, path, query, or fragment`)
  }
  return url.origin
}

/**
 * Resolve and validate the application identifier shared by every platform target.
 * @param {NodeJS.ProcessEnv} env - Packaging environment.
 * @returns {string} Reverse-DNS application identifier.
 */
export function resolveDesktopAppId(env) {
  const appId = requireEnvironmentValue(env, DESKTOP_APP_ID_ENV)
  if (!/^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/u.test(appId)) {
    throw new Error(`desktop release environment: ${DESKTOP_APP_ID_ENV} must be a reverse-DNS identifier`)
  }
  return appId
}

/**
 * Resolve and validate the public identity expected on a macOS release.
 * @param {NodeJS.ProcessEnv} env - Packaging environment.
 * @returns {{ signingIdentity: string, teamId: string }} Expected certificate qualifier and Team ID.
 */
export function resolveMacOSSigningEnvironment(env) {
  const signingIdentity = requireEnvironmentValue(env, MACOS_SIGNING_IDENTITY_ENV)
  if (signingIdentity.startsWith('Developer ID Application:')) {
    throw new Error(`desktop release environment: ${MACOS_SIGNING_IDENTITY_ENV} must omit the "Developer ID Application:" prefix`)
  }
  const teamId = requireEnvironmentValue(env, MACOS_TEAM_ID_ENV)
  if (!/^[A-Z0-9]{10}$/u.test(teamId)) {
    throw new Error(`desktop release environment: ${MACOS_TEAM_ID_ENV} must contain 10 uppercase letters or digits`)
  }
  return { signingIdentity, teamId }
}

/**
 * Resolve one complete credential set accepted by Apple's notary service.
 * @param {NodeJS.ProcessEnv} env - Packaging environment.
 * @returns {{ appleId: string, appleIdPassword: string, teamId: string } | { appleApiKey: string, appleApiKeyId: string, appleApiIssuer: string } | { keychainProfile: string, keychain?: string }} Notary credentials without the submitted artifact path.
 */
export function resolveMacOSNotarizationEnvironment(env) {
  const appleIdValues = [env[APPLE_ID_ENV], env[APPLE_APP_SPECIFIC_PASSWORD_ENV], env[APPLE_TEAM_ID_ENV]]
  if (appleIdValues.some(value => value !== undefined)) {
    return {
      appleId: requireEnvironmentValue(env, APPLE_ID_ENV),
      appleIdPassword: requireEnvironmentValue(env, APPLE_APP_SPECIFIC_PASSWORD_ENV),
      teamId: requireEnvironmentValue(env, APPLE_TEAM_ID_ENV),
    }
  }

  const apiKeyValues = [env[APPLE_API_KEY_ENV], env[APPLE_API_KEY_ID_ENV], env[APPLE_API_ISSUER_ENV]]
  if (apiKeyValues.some(value => value !== undefined)) {
    return {
      appleApiKey: requireEnvironmentValue(env, APPLE_API_KEY_ENV),
      appleApiKeyId: requireEnvironmentValue(env, APPLE_API_KEY_ID_ENV),
      appleApiIssuer: requireEnvironmentValue(env, APPLE_API_ISSUER_ENV),
    }
  }

  const keychainProfile = env[APPLE_KEYCHAIN_PROFILE_ENV]?.trim()
  if (keychainProfile !== undefined && keychainProfile !== '') {
    const keychain = env[APPLE_KEYCHAIN_ENV]?.trim()
    return keychain === undefined || keychain === ''
      ? { keychainProfile }
      : { keychainProfile, keychain }
  }

  throw new Error('desktop release environment: macOS packaging requires APPLE_API_KEY, APPLE_API_KEY_ID, and APPLE_API_ISSUER; APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, and APPLE_TEAM_ID; or APPLE_KEYCHAIN_PROFILE')
}

/**
 * Read one optional HTTP(S) origin; empty means the login services are unavailable.
 * @param {NodeJS.ProcessEnv} env - Packaging environment.
 * @param {string} name - Variable name.
 * @returns {string} Normalized origin, or an empty string when unset.
 */
function resolveOptionalOrigin(env, name) {
  const value = env[name]?.trim() ?? ''
  if (value === '') return ''
  let url
  try { url = new URL(value) }
  catch { throw new Error(`desktop release environment: ${name} must be an HTTP(S) origin`) }
  if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username !== '' || url.password !== ''
    || url.search !== '' || url.hash !== '' || (url.pathname !== '/' && url.pathname !== '')) {
    throw new Error(`desktop release environment: ${name} must be an HTTP(S) origin without credentials, path, query, or fragment`)
  }
  return url.origin
}

/**
 * Resolve the login service origins sealed into the packaged application.
 * @param {NodeJS.ProcessEnv} env - Packaging environment.
 * @returns {{ authServiceUrl: string, tomatoWebUrl: string }} Origins, both empty when no login services are configured.
 */
export function resolveDesktopLoginEnvironment(env) {
  const authServiceUrl = resolveOptionalOrigin(env, AUTH_SERVICE_URL_ENV)
  const tomatoWebUrl = resolveOptionalOrigin(env, TOMATO_WEB_URL_ENV)
  if ((authServiceUrl === '') !== (tomatoWebUrl === '')) {
    throw new Error(`desktop release environment: ${AUTH_SERVICE_URL_ENV} and ${TOMATO_WEB_URL_ENV} must be set together`)
  }
  return { authServiceUrl, tomatoWebUrl }
}
