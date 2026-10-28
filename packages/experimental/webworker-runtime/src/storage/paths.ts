/**
 * Virtual root of the worker host's in-memory filesystem. Kept
 * in one module so the process shim, the path/os shims, and the VFS image
 * collector cannot drift apart.
 */

/** Virtual filesystem root; `process.cwd()` and every absolute path start here. */
export const TOMATO_ROOT = '/tomato'

/** `$TOMATO_HOME`: durable-state directory inside the image. */
export const TOMATO_HOME = `${TOMATO_ROOT}/home`

/** Flat, symlink-free package tree resolved by the worker module loader. */
export const TOMATO_NODE_MODULES = `${TOMATO_ROOT}/node_modules`

/** Image configuration directory: the VFS manifest and the shipped agent presets. */
export const TOMATO_CONFIG = `${TOMATO_ROOT}/config`

/** Default (empty) workspace directory. */
export const TOMATO_WORKSPACE = `${TOMATO_ROOT}/workspace`

/** Temporary directory reported by `os.tmpdir()`. */
export const TOMATO_TMP = `${TOMATO_ROOT}/tmp`
