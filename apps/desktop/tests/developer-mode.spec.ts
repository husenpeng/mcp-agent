// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { developerMenuItems, developerModeEnabled, DEVELOPER_MODE_ENV } from '../src/developer-mode.ts'
import type { DiagnosticsLog } from '../src/diagnostics-log.ts'
import { resolveDesktopLocale } from '../src/locale.ts'

const log: DiagnosticsLog = { path: '/tmp/tomato.log', write: () => {} }

describe('developer mode', () => {
  it('is on for an unpackaged launch unless explicitly disabled', () => {
    expect(developerModeEnabled({}, true)).toBe(true)
    expect(developerModeEnabled({ [DEVELOPER_MODE_ENV]: '0' }, true)).toBe(false)
  })

  it('is off for a packaged launch unless explicitly enabled', () => {
    expect(developerModeEnabled({}, false)).toBe(false)
    expect(developerModeEnabled({ [DEVELOPER_MODE_ENV]: '1' }, false)).toBe(true)
    expect(developerModeEnabled({ [DEVELOPER_MODE_ENV]: '0' }, false)).toBe(false)
  })

  it('contributes no menu rows while disabled', () => {
    expect(developerMenuItems({
      enabled: false, log, window: () => undefined, messages: () => resolveDesktopLocale('en').messages,
    })).toEqual([])
  })

  it('contributes the developer submenu while enabled', () => {
    const items = developerMenuItems({
      enabled: true, log, window: () => undefined, messages: () => resolveDesktopLocale('zh').messages,
    })
    expect(items).toHaveLength(1)
    const [developer] = items
    expect(developer?.label).toBe('开发者')
    const labels = (developer?.submenu as { label?: string }[]).map(item => item.label ?? '—')
    expect(labels).toEqual([
      '打开开发者工具', '检查元素', '—', '刷新页面', '在访达中显示日志', '打开日志文件',
    ])
  })

  it('opens DevTools on the live window and tolerates a closed one', () => {
    const openDevTools = vi.fn()
    const items = developerMenuItems({
      enabled: true, log,
      window: () => ({ isDestroyed: () => false, webContents: { openDevTools } }) as never,
      messages: () => resolveDesktopLocale('en').messages,
    })
    const rows = items[0]?.submenu as { label?: string; click?: () => void }[]
    rows[0]?.click?.()
    expect(openDevTools).toHaveBeenCalledWith({ mode: 'detach', activate: true })

    const closed = developerMenuItems({
      enabled: true, log, window: () => ({ isDestroyed: () => true, webContents: { openDevTools } }) as never,
      messages: () => resolveDesktopLocale('en').messages,
    })
    const closedRows = closed[0]?.submenu as { label?: string; click?: () => void }[]
    expect(() => { closedRows[0]?.click?.() }).not.toThrow()
    expect(openDevTools).toHaveBeenCalledTimes(1)
  })
})
