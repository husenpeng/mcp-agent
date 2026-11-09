/**
 * Translate the Electron shell's remote-access environment into the Host
 * application's flag family.
 *
 * The shell owns these values (they live in its own settings document), while
 * `web-startup` owns the flags. Keeping the translation here, rather than in
 * the settings reader or the boot code, means neither side has to know the
 * other's spelling.
 * @module apps/desktop-host/launch-arguments
 */

/**
 * Read the loopback port this launch serves on.
 * @param environment - the Host process environment supplied by the Electron shell.
 * @returns the `--port` argument; `'0'` asks the operating system to assign a free port.
 */
export function listenPortArgument(environment: NodeJS.ProcessEnv): string {
  const configured = environment.TOMATO_DESKTOP_LISTEN_PORT?.trim()
  return configured === undefined || configured === '' ? '0' : configured
}

/**
 * Read the authorities a forwarding host presents to this listener.
 *
 * The value is newline-separated because an authority never contains a newline,
 * so no configured entry can be split by the separator itself.
 * @param environment - the Host process environment supplied by the Electron shell.
 * @returns one `--trusted-host <authority>` pair per configured entry.
 */
export function trustedHostArguments(environment: NodeJS.ProcessEnv): string[] {
  const configured = environment.TOMATO_DESKTOP_TRUSTED_HOSTS
  if (configured === undefined) return []
  return configured.split('\n')
    .map(host => host.trim())
    .filter(host => host !== '')
    .flatMap(host => ['--trusted-host', host])
}
