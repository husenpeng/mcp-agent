/** The NSIS sources compiled into the signed Windows installer and its uninstaller. */
import { join, resolve } from 'node:path'

const APP_ROOT = resolve(import.meta.dirname, '..')

/**
 * Every NSIS include that determines the produced installer.
 * The installed-update record hashes this list so an edit during packaging rejects instead of
 * producing an installer that the record does not describe.
 */
export const NSIS_SOURCES = [
  join(import.meta.dirname, 'installer.nsh'),
  join(import.meta.dirname, 'installer-directories.nsh'),
  ...['drawing', 'lifecycle', 'pages', 'path', 'theme', 'uninstall'].map(name => join(APP_ROOT, 'installer', `${name}.nsh`)),
]
