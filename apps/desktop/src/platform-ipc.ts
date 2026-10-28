/** Shared names for the desktop Platform bridge. */
/** Private desktop channels; the Platform renderer receives bootstrap and locale updates. */
export const PLATFORM_IPC = {
  bootstrap: 'tomato-platform:bootstrap',
  localeChanged: 'tomato-platform:locale-changed',
  open: 'tomato-platform:open',
  bounds: 'tomato-platform:bounds',
  close: 'tomato-platform:close',
} as const

/** Resolved Platform language; Desktop resolves the system preference before sending it. */
export type PlatformLocale = 'en_US' | 'zh_CN'
