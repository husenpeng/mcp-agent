/** Environment projection for the unpackaged Desktop launcher. */

/**
 * Packaging and release settings that must not reach the development shell.
 * A sourced packaging preset can supply login origins, but its app identity,
 * update policy, and signing inputs belong to packaged builds.
 */
const RELEASE_SETTING = new RegExp('^(?:TOMATO_DESKTOP_(?:APP_ID|AUTO_UPDATE_ENV|AUTH_SERVICE_URL|'
  + 'TOMATO_WEB_URL|MANDATORY_UPDATE_.*|WINDOWS_.*|MACOS_.*|UNSIGNED|UPDATE_CHANNEL)|APPLE_.*|'
  + '(?:WIN_)?CSC_.*|DOWNLOAD_(?:TEST|PROD)_.*)$', 'iu')

/**
 * Remove packaged-build settings from the launcher environment.
 * @param environment - Environment inherited by the development launcher.
 * @returns The environment without packaging and release inputs.
 */
export function withoutReleaseSettings(environment: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return Object.fromEntries(Object.entries(environment).filter(([name]) => !RELEASE_SETTING.test(name)))
}
