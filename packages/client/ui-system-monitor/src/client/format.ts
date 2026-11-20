/**
 * Compact number formatting for the monitor overlay: bytes, rates,
 * percentages, and uptimes. Pure functions so the wire contract never carries
 * presentation strings.
 * @module @tomato/client-ui-system-monitor/format
 */

/** Byte units, largest first. */
const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const

/**
 * Format a byte count with one unit step per 1024 bytes.
 * @param bytes - the byte count; negative values are clamped to zero.
 * @returns a short value such as `1.4 GB`.
 */
export function formatBytes(bytes: number): string {
  const value = Number.isFinite(bytes) ? Math.max(bytes, 0) : 0
  let unit = 0
  let scaled = value
  while (scaled >= 1024 && unit < BYTE_UNITS.length - 1) {
    scaled /= 1024
    unit += 1
  }
  const digits = scaled >= 100 || unit === 0 ? 0 : 1
  // The loop bound keeps `unit` inside the tuple.
  /* v8 ignore next -- the loop bound keeps `unit` inside BYTE_UNITS */
  return `${scaled.toFixed(digits)} ${BYTE_UNITS[unit] ?? 'B'}`
}

/**
 * Format a byte rate.
 * @param bytesPerSecond - bytes transferred per second.
 * @returns a short value such as `820 KB/s`.
 */
export function formatRate(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`
}

/**
 * Format a 0–1 ratio as a whole percentage.
 * @param ratio - the ratio; values outside 0–1 are clamped.
 * @returns a short value such as `63%`.
 */
export function formatPercent(ratio: number): string {
  const value = Number.isFinite(ratio) ? Math.min(Math.max(ratio, 0), 1) : 0
  return `${Math.round(value * 100)}%`
}

/**
 * Format an uptime in seconds as the two largest whole units.
 * @param seconds - seconds since boot.
 * @returns a short value such as `3d 4h` or `12m`.
 */
export function formatUptime(seconds: number): string {
  const total = Number.isFinite(seconds) ? Math.max(Math.floor(seconds), 0) : 0
  const days = Math.floor(total / 86_400)
  const hours = Math.floor((total % 86_400) / 3_600)
  const minutes = Math.floor((total % 3_600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

/**
 * Shorten a process command path to its executable name.
 * @param name - the reported executable path.
 * @param limit - maximum characters to keep.
 * @returns the basename, truncated to the limit.
 */
export function shortProcessName(name: string, limit = 28): string {
  const base = name.slice(Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\')) + 1) || name
  return base.length > limit ? `${base.slice(0, limit - 1)}…` : base
}
