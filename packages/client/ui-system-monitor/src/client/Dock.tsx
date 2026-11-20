/**
 * The monitor overlay: a collapsed pill or a small dashboard of the host's
 * processor, graphics, memory, network, disk, power, and process readings, plus
 * a ball that a closed monitor parks against the nearer side edge. The
 * registration is a `shell.overlay` entry, so it floats above every column and
 * survives panel navigation; it owns only its own geometry, form, gesture, menu,
 * and pause state.
 * @module @tomato/client-ui-system-monitor/Dock
 */

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import type { MonitorStatus, SystemMonitorSource } from '@tomato/api-system-monitor-controller/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@tomato/client-ui-slots'
import { formatBytes, formatPercent, formatRate, formatUptime, shortProcessName } from './format.ts'
import { IconChevronDownOutlineRegular, Menu, type MenuEntry } from '@tomato/client-ui-primitives'
import { Meter } from './Meter.tsx'
import { Sparkline } from './Sparkline.tsx'
import {
  ballLayout, ballTone, clampLayout, defaultLayout, expandLayout, formSize, parkLayout, readLayout, writeLayout,
  type OverlayForm, type OverlayLayout, type RestingForm,
} from './overlay-layout.ts'
import { NS } from './locales.ts'
import css from './Dock.module.css'

/** Registration-side business face of the overlay. */
export interface SystemMonitorInjected {
  hooks: {
    /** Client monitor snapshot bound by the renderer as `useMonitor`. */
    monitor: SystemMonitorSource
  }
  /** Keep the observation stream open while the card samples; returns the release. */
  watch: () => () => void
  /** Which surface this registration renders: the in-app overlay or the desktop panel. */
  surface: 'overlay' | 'window'
  /** Open or hide the desktop panel; null when this build has no desktop panel. */
  floatPanel: (() => void) | null
  /** Close this document's native window; null outside the desktop panel. */
  closeWindow: (() => void) | null
  /** Size the desktop panel's native window to the form it shows; null outside the desktop panel. */
  resizeWindow: ((form: RestingForm) => void) | null
}

/** Full props of the monitor overlay entry. */
export type SystemMonitorDockProps =
  PropsRuntime<'shell.overlay'>
  & PropsLocale<typeof NS>
  & InjectFace<SystemMonitorInjected>

/** Storage face used when the browser refuses persistent storage. */
const NULL_STORAGE: Pick<Storage, 'getItem' | 'setItem'> = {
  getItem: () => null,
  setItem: () => {},
}

/**
 * Read the browser's persistent storage.
 * @returns the storage face, or null when the browser blocks it.
 */
function browserStorage(): Pick<Storage, 'getItem' | 'setItem'> | null {
  try {
    return window.localStorage
  } catch (_blockedStorage) {
    return null
  }
}

/**
 * Point-capture guard: jsdom and older browsers omit the method.
 * @param element - the element that received the pointer.
 * @param pointerId - the pointer to capture.
 */
function capturePointer(element: Element, pointerId: number): void {
  if (typeof element.setPointerCapture === 'function') element.setPointerCapture(pointerId)
}

/** Travel in CSS pixels past which a press becomes a drag instead of a click. */
const DRAG_THRESHOLD = 4

/**
 * Decide whether a press has travelled far enough to be a drag.
 * @param dx - horizontal travel since the press, in CSS pixels.
 * @param dy - vertical travel since the press, in CSS pixels.
 * @returns whether either axis passed {@link DRAG_THRESHOLD}.
 */
function exceedsDragThreshold(dx: number, dy: number): boolean {
  return Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD
}

/** The one gesture the monitor tracks across pointer events. */
interface DragState {
  readonly pointerId: number
  readonly offsetX: number
  readonly offsetY: number
  /** Window position the press started from, before any movement. */
  readonly originX: number
  readonly originY: number
  /** True once the pointer travelled past {@link DRAG_THRESHOLD}. */
  moved: boolean
}

/** Where the monitor's context menu opened, and for which form. */
interface MenuState {
  readonly x: number
  readonly y: number
  readonly form: OverlayLayout['form']
}

/**
 * Draw the monitor overlay.
 * @param props - the injected snapshot hook, stream watch, and copy seat.
 * @returns the parked ball, the collapsed pill, or the expanded card.
 */
export function SystemMonitorDock({ useMonitor, watch, surface, floatPanel, closeWindow, resizeWindow, t }: SystemMonitorDockProps) {
  const snapshot = useMonitor(state => state)
  const [storage] = useState(browserStorage)
  const [layout, setLayout] = useState<OverlayLayout>(() => {
    return readLayout(storage ?? NULL_STORAGE) ?? defaultLayout(window.innerWidth, window.innerHeight)
  })
  const [menu, setMenu] = useState<MenuState | null>(null)
  const layoutRef = useRef(layout)
  const dragRef = useRef<DragState | null>(null)
  // A drag ends with a click, and that click must not open or close the monitor.
  // Every click passes the monitor's capture phase before any control's own
  // handler, so the capture phase stops the click right there and clears the
  // flag before dismissing it, never leaving it armed for the next click.
  const suppressClick = useRef(false)
  // The form the monitor showed when the gesture began and when its click ran.
  const dragStartForm = useRef<RestingForm>(layout.form === 'card' ? 'card' : 'pill')
  const clickedForm = useRef<OverlayForm>(layout.form)

  // Sampling follows the pause control: the release closes the shared stream
  // with this card's reference, and the Host stops probing.
  useEffect(() => {
    if (layout.paused) return
    return watch()
  }, [layout.paused, watch])

  // A window resize keeps a parked ball against the same edge and a free form
  // inside the new window.
  useEffect(() => {
    const onResize = (): void => { keepInWindow() }
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize) }
  })

  /**
   * Record one layout in both the live ref and the rendered state.
   * @param next - the layout the gesture produced.
   */
  const apply = (next: OverlayLayout): void => {
    layoutRef.current = next
    setLayout(next)
  }

  /** Keep the current layout for the next mount. */
  const persist = (): void => {
    writeLayout(storage ?? NULL_STORAGE, layoutRef.current)
  }

  // The desktop panel's native window follows the form it shows; the effect asks
  // on mount and on every change, never during render.
  const shownForm: RestingForm = layout.form === 'card' ? 'card' : 'pill'
  useEffect(() => {
    if (resizeWindow === null) return
    resizeWindow(shownForm)
  })

  /** Keep the monitor inside the window after its size changed. */
  const keepInWindow = (): void => {
    const current = layoutRef.current
    const next = current.form === 'ball'
      ? ballLayout(current, current.edge, current.axis, current.restore, window.innerHeight)
      : clampLayout(current, window.innerWidth, window.innerHeight)
    if (next !== current) apply(next)
  }

  /**
   * Swallow the click a drag ends with, so a drag does not also change the form.
   * The click reaches the control under the release, whose handler runs before
   * this capture handler, so a click that already expanded the monitor is undone.
   * @param event - the click that follows the pointer gesture.
   */
  const claimClick = (event: { stopPropagation(): void }): void => {
    if (!suppressClick.current) return
    suppressClick.current = false
    event.stopPropagation()
    // A press begins on a pill or a card, so the recorded form is one of those.
    if (clickedForm.current !== dragStartForm.current) show(dragStartForm.current)
  }

  /** Collapse or expand into a requested form. @param form - the form to show. */
  const show = (form: RestingForm): void => {
    const current = layoutRef.current
    apply(expandLayout(current, form, window.innerWidth, window.innerHeight))
    clickedForm.current = layoutRef.current.form
    persist()
  }

  const toggleExpanded = (): void => {
    show(layoutRef.current.form === 'card' ? 'pill' : 'card')
  }

  /** Park the monitor against the nearer edge as a ball. */
  const park = (): void => {
    apply(parkLayout(layoutRef.current, window.innerWidth, window.innerHeight))
    clickedForm.current = layoutRef.current.form
    persist()
  }

  const togglePaused = (): void => {
    const current = layoutRef.current
    apply({ ...current, paused: !current.paused })
    persist()
  }

  /**
   * Begin a drag, unless the press belongs to a control, a process row, or the
   * dashboard body. A parked ball has no drag handler.
   * @param event - the pointer press on the monitor.
   */
  const startDrag = (event: PointerEvent<HTMLElement>): void => {
    // A press on a control, on a process row, or in the dashboard body is that
    // element's, not the drag's.
    if (event.target instanceof Element && event.target.closest('button, li, [data-no-drag]') !== null) return
    if (event.button !== 0) return
    const current = layoutRef.current
    capturePointer(event.target as Element, event.pointerId)
    dragStartForm.current = current.form === 'card' ? 'card' : 'pill'
    // Every click on a control records the form it saw, after that handler runs.
    clickedForm.current = current.form
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - current.x,
      offsetY: event.clientY - current.y,
      originX: event.clientX,
      originY: event.clientY,
      moved: false,
    }
  }

  const dragTo = (event: PointerEvent<HTMLElement>): void => {
    const drag = dragRef.current
    if (drag === null || drag.pointerId !== event.pointerId) return
    // A press that has not travelled stays a click on the pill's open control.
    if (!drag.moved) {
      if (!exceedsDragThreshold(event.clientX - drag.originX, event.clientY - drag.originY)) return
      drag.moved = true
    }
    const current = layoutRef.current
    apply(clampLayout({
      ...current,
      x: event.clientX - drag.offsetX,
      y: event.clientY - drag.offsetY,
    }, window.innerWidth, window.innerHeight))
  }

  const endDrag = (event: PointerEvent<HTMLElement>): void => {
    const drag = dragRef.current
    if (drag === null || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    if (!drag.moved) return
    suppressClick.current = true
    persist()
  }

  /**
   * Record the form a monitored press began in; every gesture starts here.
   * @param event - the pointer press on the monitor.
   */
  const beginGesture = (event: PointerEvent<HTMLElement>): void => {
    dragStartForm.current = layoutRef.current.form === 'card' ? 'card' : 'pill'
    startDrag(event)
  }


  /**
   * Open the monitor's own menu at a viewport point.
   * @param x - horizontal viewport offset in CSS pixels.
   * @param y - vertical viewport offset in CSS pixels.
   */
  const showMenuAt = (x: number, y: number): void => {
    setMenu({ x, y, form: layoutRef.current.form })
  }

  /**
   * Open the monitor's own menu from a context gesture.
   * @param event - the context gesture on the monitor.
   */
  const openMenu = (event: MouseEvent<HTMLElement>): void => {
    event.preventDefault()
    showMenuAt(event.clientX, event.clientY)
  }

  const closeMenu = (): void => { setMenu(null) }

  const status = statusLabel(snapshot.status, t)
  // A paused card says so even before the released stream settles to idle.
  const pillStatus = layout.paused ? t('status.idle') : status
  // The ball keeps one reading: live CPU, or the paused or waiting label.
  const ballReading = layout.paused || snapshot.frame === null ? pillStatus : formatPercent(snapshot.frame.cpu.usage)

  const frame = snapshot.frame
  /** The monitor's menu rows; a parked ball adds its own expand row. */
  const menuItems = (): MenuEntry[] => {
    const rows: MenuEntry[] = [{ id: 'pause', label: layout.paused ? t('action.resume') : t('action.pause') }]
    if (menu?.form === 'ball') rows.push({ id: 'expand', label: t('action.expand') })
    if (floatPanel !== null) rows.push({ id: 'float', label: t('action.float') })
    if (closeWindow !== null) rows.push({ id: 'close-window', label: t('action.closeWindow') })
    rows.push({ type: 'separator', id: 'sep' }, { id: 'park', label: t('action.park'), danger: true })
    return rows
  }

  /**
   * Run one row of the monitor's menu.
   * @param id - the selected row's id.
   */
  const selectMenu = (id: string): void => {
    setMenu(null)
    switch (id) {
      case 'pause': togglePaused(); break
      case 'expand': show(layoutRef.current.restore); break
      case 'float': floatPanel?.(); break
      case 'close-window': closeWindow?.(); break
      case 'park': park(); break
    }
  }
  const body = frame === null
    ? <p className={css.empty}>{t('status.waiting')}</p>
    : (
      <>
        <p className={css.facts}>
          {[frame.host.model, frame.host.chip].filter(part => part.length > 0).join(' · ')}
        </p>
        <p className={css.facts}>
          {t('field.cores', { count: frame.host.cores })}
          {' · '}
          {formatBytes(frame.host.totalMemoryBytes)}
          {' · '}
          {t('field.uptime', { duration: formatUptime(frame.host.uptimeSeconds) })}
        </p>

        <section className={css.section}>
          <div className={css.sectionHead}>
            <span>{t('section.cpu')}</span>
            <span className={css.reading}>{formatPercent(frame.cpu.usage)}</span>
          </div>
          <Sparkline values={snapshot.points.map(point => point.cpu)} className={`${css.spark} ${css.cpuSpark}`} />
          <div className={css.cores}>
            {frame.cpu.perCore.map((value, index) => (
              <span key={index} className={css.core} style={{ height: `${Math.max(Math.round(value * 100), 4)}%` }} />
            ))}
          </div>
          <div className={css.row}>
            <span className={css.rowLabel}>{t('field.load')}</span>
            <span className={css.rowValue}>{frame.cpu.loadAverage.map(load => load.toFixed(2)).join(' · ')}</span>
          </div>
        </section>

        {frame.gpu === null ? null : (
          <section className={css.section}>
            <div className={css.sectionHead}>
              <span>{t('section.gpu')}</span>
              <span className={css.reading}>{formatPercent(frame.gpu.utilization)}</span>
            </div>
            <Sparkline values={snapshot.points.map(point => point.gpu ?? 0)} className={`${css.spark} ${css.gpuSpark}`} />
            <div className={css.row}>
              <span className={css.rowLabel}>{t('field.gpuMemory')}</span>
              <span className={css.rowValue}>{formatBytes(frame.gpu.inUseMemoryBytes ?? 0)}</span>
            </div>
          </section>
        )}

        <section className={css.section}>
          <div className={css.sectionHead}>
            <span>{t('section.memory')}</span>
            <span className={css.reading}>{formatPercent(memoryRatio(frame.memory))}</span>
          </div>
          <Meter value={memoryRatio(frame.memory)} tone="memory" />
          <Sparkline values={snapshot.points.map(point => point.memory)} className={`${css.spark} ${css.memSpark}`} />
          <div className={css.row}>
            <span className={css.rowLabel}>{t('field.free')}</span>
            <span className={css.rowValue}>{formatBytes(frame.memory.freeBytes)}</span>
          </div>
          <div className={css.row}>
            <span className={css.rowLabel}>{t('field.swap')}</span>
            <span className={css.rowValue}>
              {formatBytes(frame.memory.swapUsedBytes)} / {formatBytes(frame.memory.swapTotalBytes)}
            </span>
          </div>
        </section>

        {frame.network === null ? null : (
          <section className={css.section}>
            <div className={css.row}>
              <span className={css.rowLabel}>{t('section.network')} · {t('field.down')}</span>
              <span className={css.rowValue}>{formatRate(frame.network.receivedBytesPerSecond)}</span>
            </div>
            <div className={css.row}>
              <span className={css.rowLabel}>{t('section.network')} · {t('field.up')}</span>
              <span className={css.rowValue}>{formatRate(frame.network.sentBytesPerSecond)}</span>
            </div>
          </section>
        )}

        {frame.disk === null ? null : (
          <section className={css.section}>
            <div className={css.sectionHead}>
              <span>{t('section.disk')}</span>
              <span className={css.reading}>{formatPercent(diskRatio(frame.disk.totalBytes, frame.disk.freeBytes))}</span>
            </div>
            <Meter value={diskRatio(frame.disk.totalBytes, frame.disk.freeBytes)} tone="disk" />
            <div className={css.row}>
              <span className={css.rowLabel}>{t('field.free')}</span>
              <span className={css.rowValue}>
                {formatBytes(frame.disk.freeBytes)} / {formatBytes(frame.disk.totalBytes)}
              </span>
            </div>
          </section>
        )}

        {frame.power === null ? null : (
          <section className={css.section}>
            <div className={css.row}>
              <span className={css.rowLabel}>{t('field.battery')}</span>
              <span className={css.rowValue}>
                {frame.power.batteryPercent === null ? '—' : formatPercent(frame.power.batteryPercent / 100)}
                {' · '}
                {frame.power.charging === null
                  ? '—'
                  : frame.power.charging ? t('field.charging') : t('field.onBattery')}
              </span>
            </div>
            <div className={css.row}>
              <span className={css.rowLabel}>{t('field.thermal')}</span>
              <span className={css.rowValue}>{frame.power.thermalPressure}</span>
            </div>
          </section>
        )}

        <section className={css.section}>
          <div className={css.sectionHead}>
            <span>{t('section.processes')}</span>
          </div>
          {frame.processes.length === 0 ? <p className={css.empty}>{t('empty.processes')}</p> : (
            <ul className={css.processes}>
              <li className={`${css.process} ${css.processHead}`}>
                <span>{t('column.process')}</span>
                <span>{t('column.cpu')}</span>
                <span>{t('column.memory')}</span>
              </li>
              {frame.processes.map(process => (
                <li key={process.pid} className={css.process}>
                  <span className={css.processName} data-pid={process.pid}>{shortProcessName(process.name)}</span>
                  <span className={css.processValue}>{formatPercent(process.cpuPercent / 100)}</span>
                  <span className={css.processValue}>{formatPercent(process.memoryPercent / 100)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {frame.unavailable.length === 0 ? null : (
          <p className={css.unavailable}>{t('unavailable', { list: frame.unavailable.join(', ') })}</p>
        )}
      </>
    )

  if (surface === 'window') {
    return (
      <div className={css.windowLayer}>
        <section
          className={css.windowCard}
          aria-label={t('title')}
          data-system-monitor-card
          data-window-surface
        >
          <header className={css.windowHeader}>
            <span className={css.title}>{t('title')}</span>
            <span className={css.status}>
              <span className={css.dot} data-state={snapshot.status} aria-hidden="true" />
              {status}
            </span>
            <button
              type="button"
              className={css.control}
              onClick={togglePaused}
              aria-label={layout.paused ? t('action.resume') : t('action.pause')}
            >
              {layout.paused ? <IconChevronDownOutlineRegular size={16} className={css.rotated} /> : '\u275a\u275a'}
            </button>
            {layout.form === 'card' ? (
              <button
                type="button"
                className={css.control}
                onClick={toggleExpanded}
                aria-label={t('action.collapse')}
              >
                <IconChevronDownOutlineRegular size={16} />
              </button>
            ) : null}
            {closeWindow === null ? null : (
              <button
                type="button"
                className={css.control}
                onClick={closeWindow}
                aria-label={t('action.closeWindow')}
              >
                ✕
              </button>
            )}
          </header>
          <div className={css.body}>{body}</div>
        </section>
      </div>
    )
  }

  const dragHandlers = {
    onPointerDown: beginGesture,
    onPointerMove: dragTo,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onClickCapture: claimClick,
  }
  const menuOpen = menu !== null
  // Half of a parked ball hangs outside the edge it rests against.
  const overhang = formSize('ball').width / 2

  if (layout.form === 'ball') {
    return (
      <div className={css.layer}>
        <button
          type="button"
          className={css.ball}
          style={{
            left: layout.edge === 'left' ? -overhang : undefined,
            right: layout.edge === 'left' ? undefined : -overhang,
            top: layout.axis - overhang,
          }}
          data-system-monitor-ball
          data-edge={layout.edge}
          data-tone={ballTone(frame?.cpu.usage, layout.paused)}
          aria-label={t('ball.open', { cpu: ballReading })}
          onClick={() => { show(layout.restore) }}
          onContextMenu={openMenu}
        >
          <span className={css.ballValue}>{ballReading}</span>
        </button>
        {menuOpen ? (
          <Menu
            open
            portal
            contextual
            anchor={null}
            anchorPoint={{ x: menu.x, y: menu.y }}
            items={menuItems()}
            onSelect={selectMenu}
            onClose={closeMenu}
          />
        ) : null}
      </div>
    )
  }

  if (layout.form === 'pill') {
    return (
      <div className={css.layer}>
        <div
          className={css.pill}
          style={{ left: layout.x, top: layout.y }}
          role="group"
          aria-label={t('title')}
          data-system-monitor-pill
          {...dragHandlers}
          onContextMenu={openMenu}
        >
          <button
            type="button"
            className={css.pillOpen}
            onClick={toggleExpanded}
            aria-label={t('pill.open')}
            onKeyDown={(event) => {
              if (!(event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))) return
              event.preventDefault()
              const rect = event.currentTarget.getBoundingClientRect()
              showMenuAt(rect.left, rect.bottom)
            }}
          >
            <span className={css.dot} data-state={snapshot.status} aria-hidden="true" />
            {frame === null || layout.paused
              ? (
                <span className={css.pillText}>
                  <span className={css.pillPair}>{pillStatus}</span>
                </span>
              )
              : (
                <span className={css.pillText}>
                  <span className={css.pillPair}>
                    <span className={css.pillLabel}>{t('pill.cpu')}</span>
                    {formatPercent(frame.cpu.usage)}
                  </span>
                  <span className={css.pillPair}>
                    <span className={css.pillLabel}>{t('pill.gpu')}</span>
                    {frame.gpu === null ? '\u2014' : formatPercent(frame.gpu.utilization)}
                  </span>
                  <span className={css.pillPair}>
                    <span className={css.pillLabel}>{t('pill.mem')}</span>
                    {formatPercent(memoryRatio(frame.memory))}
                  </span>
                </span>
              )}
          </button>
          <button
            type="button"
            className={css.pillClose}
            onClick={park}
            aria-label={t('action.park')}
          >
            ✕
          </button>
        </div>
        {menuOpen ? (
          <Menu
            open
            portal
            contextual
            anchor={null}
            anchorPoint={{ x: menu.x, y: menu.y }}
            items={menuItems()}
            onSelect={selectMenu}
            onClose={closeMenu}
          />
        ) : null}
      </div>
    )
  }

  return (
    <div className={css.layer}>
      <section
        className={css.card}
        style={{ left: layout.x, top: layout.y }}
        aria-label={t('title')}
        data-system-monitor-card
        {...dragHandlers}
        onContextMenu={openMenu}
      >
        <header
          className={css.header}
          data-drag-handle
        >
          <span className={css.title}>{t('title')}</span>
          <span className={css.status}>
            <span className={css.dot} data-state={snapshot.status} aria-hidden="true" />
            {status}
          </span>
          <button
            type="button"
            className={css.control}
            onClick={togglePaused}
            aria-label={layout.paused ? t('action.resume') : t('action.pause')}
          >
            {layout.paused ? <IconChevronDownOutlineRegular size={16} className={css.rotated} /> : '\u275a\u275a'}
          </button>
          {floatPanel === null ? null : (
            <button
              type="button"
              className={css.control}
              onClick={floatPanel}
              aria-label={t('action.float')}
            >
              ⧉
            </button>
          )}
          <button
            type="button"
            className={css.control}
            onClick={toggleExpanded}
            aria-label={t('action.collapse')}
          >
            <IconChevronDownOutlineRegular size={16} />
          </button>
          <button
            type="button"
            className={css.control}
            onClick={park}
            aria-label={t('action.park')}
          >
            ✕
          </button>
        </header>

        <div className={css.body} data-no-drag>{body}</div>
        <footer className={css.footer}>{t('hint.drag')}</footer>
      </section>
      {menuOpen ? (
        <Menu
          open
          portal
          contextual
          anchor={null}
          anchorPoint={{ x: menu.x, y: menu.y }}
          items={menuItems()}
          onSelect={selectMenu}
          onClose={closeMenu}
        />
      ) : null}
    </div>
  )
}

/**
 * Label one stream state.
 * @param status - the model's stream state.
 * @param t - this plugin's copy seat.
 * @returns the localized label.
 */
function statusLabel(
  status: MonitorStatus,
  t: SystemMonitorDockProps['t'],
): string {
  switch (status) {
    case 'live': return t('status.live')
    case 'reconnecting': return t('status.reconnecting')
    case 'failed': return t('status.failed')
    case 'idle': return t('status.idle')
  }
}

/** The two memory fields the headline ratio needs. */
interface MemoryOccupancy {
  readonly totalBytes: number
  readonly usedBytes: number
}

/**
 * Reduce memory occupancy to a 0–1 ratio.
 * @param memory - the frame's memory reading.
 * @returns used share of physical memory.
 */
function memoryRatio(memory: MemoryOccupancy): number {
  return memory.totalBytes > 0 ? memory.usedBytes / memory.totalBytes : 0
}

/**
 * Reduce disk occupancy to a 0–1 ratio.
 * @param totalBytes - capacity in bytes.
 * @param freeBytes - available bytes.
 * @returns used share of capacity.
 */
function diskRatio(totalBytes: number, freeBytes: number): number {
  return totalBytes > 0 ? (totalBytes - freeBytes) / totalBytes : 0
}
