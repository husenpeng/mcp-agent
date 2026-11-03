/** Release-owned profile patches applied after the Desktop profile layer. */

/**
 * Patch files a packaged Desktop application ships. The Electron shell resolves the release overlay beside its
 * runtime and passes it as `TOMATO_DESKTOP_RELEASE_OVERLAY`; an unpackaged launch leaves the variable unset, so
 * development keeps the default profile composition.
 * @param environment - Host process environment supplied by the Electron shell.
 * @returns Overlay paths in application order, empty when the shell supplies none.
 */
export function releasePatchFiles(environment: NodeJS.ProcessEnv): string[] {
  const overlay = environment.TOMATO_DESKTOP_RELEASE_OVERLAY
  return overlay === undefined || overlay === '' ? [] : [overlay]
}
