/** Read file-owned packaging settings without loading packaging dependencies. */
export function readDesktopPackageSettings(
  path: string,
  accepts: (name: string) => boolean,
): Record<string, string>
