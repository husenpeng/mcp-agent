/**
 * Resolve the installed sqlite-vec loadable extension for this host. The
 * platform package ships one binary per supported OS/architecture; an ASAR
 * path is rewritten to its unpacked sibling because SQLite loads the file
 * through the operating system, outside Electron's patched filesystem.
 */

/**
 * Rewrite one extension path to its ASAR-unpacked sibling.
 * @param path - path reported by the platform package.
 * @returns a path SQLite can load through the operating system.
 */
export function unpackedExtensionPath(path: string): string {
  if (!path.includes('app.asar')) return path
  return path.includes('app.asar.unpacked') ? path : path.replace('app.asar', 'app.asar.unpacked')
}

/**
 * Resolve the sqlite-vec extension path.
 * @returns the loadable path, or `undefined` when this host or installation has no binary.
 */
export async function resolveVecExtensionPath(): Promise<string | undefined> {
  try {
    const { getLoadablePath } = await import('sqlite-vec')
    return unpackedExtensionPath(getLoadablePath())
  } catch {
    /* v8 ignore next -- unsupported hosts and absent installations have no binary. */
    return undefined
  }
}
