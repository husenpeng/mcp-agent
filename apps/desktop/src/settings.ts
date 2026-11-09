/**
 * Local Electron shell settings, loaded once per process independently of the Host.
 * Ownership: .agents/notes/implemented/architecture/2026-10-08-desktop-shell-configuration.md.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** Default loopback port the Desktop Host listens on, so a paired phone reaches a stable address. */
export const DEFAULT_REMOTE_LISTEN_PORT = 43_110

/** Resolved shell preferences; absent fields use the defaults without rewriting existing files. */
export interface DesktopSettings {
  readonly updates: {
    readonly allowTestAuthPopupWindow: boolean
  }
  /**
   * Remote-access posture of this shell. Every field is opt-in: a default install
   * keeps the historical behavior of an OS-assigned port and no power assertion.
   */
  readonly remote: {
    /** Loopback port handed to the Host; `0` lets the operating system assign one. */
    readonly listenPort: number
    /** Hold a `prevent-app-suspension` power assertion so the Host keeps running with the display off. */
    readonly keepAwake: boolean
    /** Register the application as a login item. */
    readonly launchAtLogin: boolean
    /**
     * Extra authorities the API browser-trust fence accepts beyond loopback and the
     * bind address, matching one `--trusted-host` value each. A tunnel that forwards
     * its own hostname needs that name here.
     */
    readonly trustedHosts: readonly string[]
    /**
     * Supervise a Cloudflare quick tunnel from this shell so a paired phone can
     * reach the Host from another network. The emitted hostname changes on every
     * start, so the pairing link shown in Settings follows it.
     */
    readonly tunnel: boolean
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const defaults: DesktopSettings = {
  updates: { allowTestAuthPopupWindow: false },
  remote: { listenPort: DEFAULT_REMOTE_LISTEN_PORT, keepAwake: false, launchAtLogin: false, trustedHosts: [], tunnel: false },
}

/**
 * Validate the optional `remote` object, falling back field by field.
 * A rejected field throws so the caller's existing failure path logs once and
 * uses the whole default document, rather than silently mixing sources.
 * @param value - the parsed `remote` member, or undefined when absent.
 * @returns the resolved remote posture.
 */
function readRemote(value: unknown): DesktopSettings['remote'] {
  if (value === undefined) return defaults.remote
  if (!record(value)) throw new Error('remote must be a JSON object')
  const listenPort = value.listenPort
  if (listenPort !== undefined
    && (typeof listenPort !== 'number' || !Number.isInteger(listenPort)
      || listenPort < 0 || listenPort > 65_535)) {
    throw new Error('remote.listenPort must be an integer between 0 and 65535')
  }
  const boolean = (key: 'keepAwake' | 'launchAtLogin', fallback: boolean): boolean => {
    const candidate = value[key]
    if (candidate === undefined) return fallback
    if (typeof candidate !== 'boolean') throw new Error(`remote.${key} must be true or false`)
    return candidate
  }
  const hosts = value.trustedHosts
  if (hosts !== undefined
    && (!Array.isArray(hosts) || hosts.some(host => typeof host !== 'string' || host === ''))) {
    throw new Error('remote.trustedHosts must be an array of non-empty strings')
  }
  const tunnel = value.tunnel
  if (tunnel !== undefined && typeof tunnel !== 'boolean') throw new Error('remote.tunnel must be true or false')
  const tunnelEnabled = tunnel ?? defaults.remote.tunnel
  return {
    listenPort: listenPort ?? DEFAULT_REMOTE_LISTEN_PORT,
    keepAwake: boolean('keepAwake', defaults.remote.keepAwake),
    launchAtLogin: boolean('launchAtLogin', defaults.remote.launchAtLogin),
    trustedHosts: hosts ?? defaults.remote.trustedHosts,
    tunnel: tunnelEnabled,
  }
}

/**
 * Read shell settings, creating the default document exclusively when missing.
 * @param userData - Electron's userData directory, independent of TOMATO_HOME.
 * @returns Validated settings, or defaults when reading, creating or validating fails; changes require a restart.
 */
export function readDesktopSettings(userData: string): DesktopSettings {
  const directory = join(userData, 'desktop')
  const path = join(directory, 'settings.json')
  try {
    let raw: string
    try { raw = readFileSync(path, 'utf8') } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      mkdirSync(directory, { recursive: true, mode: 0o700 })
      try { writeFileSync(path, `${JSON.stringify(defaults, null, 2)}\n`, { flag: 'wx', mode: 0o600 }) } catch (error) {
        // An existing document belongs to the user, including one created during initialization.
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      }
      raw = readFileSync(path, 'utf8')
    }
    const value: unknown = JSON.parse(raw)
    if (!record(value) || (value.updates !== undefined && !record(value.updates))) {
      throw new Error('expected a JSON object with an optional updates object')
    }
    const allow = value.updates?.allowTestAuthPopupWindow
    if (allow !== undefined && typeof allow !== 'boolean') {
      throw new Error('updates.allowTestAuthPopupWindow must be true or false')
    }
    return {
      updates: { allowTestAuthPopupWindow: allow ?? false },
      remote: readRemote(value.remote),
    }
  } catch (error) {
    try {
      console.warn(`desktop settings: ${path}: using defaults because settings could not be loaded`, error)
    } catch (_logError) {
      // Diagnostic output is best effort; its failure must not make optional settings fatal.
      // TODO: Persist settings diagnostics when console output is unavailable, without blocking startup.
    }
    return defaults
  }
}
