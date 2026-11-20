// @vitest-environment jsdom
/** The floating monitor card: pill, dashboard sections, drag, pause, and storage. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { allowAllAccess, makeTranslate } from '@tomato/client-test-runtime'
import type { GlobalStandardProps } from '@tomato/client-ui-slots'
import type { SystemMonitorSnapshot } from '@tomato/api-system-monitor-controller/client'
import { SystemMonitorDock, type SystemMonitorDockProps } from '../src/client/Dock.tsx'
import { en } from '../src/client/locales.ts'
import { OVERLAY_STORAGE_KEY } from '../src/client/overlay-layout.ts'
import type { SystemSampleFrame } from '@tomato/api-system-monitor-controller/types'

const GIB = 1024 ** 3
const MIB = 1024 ** 2

const unused = (): never => { throw new Error('The monitor card does not read that framework hook') }
const standard: GlobalStandardProps = {
  usePanelInfo: unused, useSessions: unused, useSessionStatus: unused, useSessionRetainInfo: unused,
  useResource: unused, useContextMenu: unused, useWorkspaces: unused,
  ...allowAllAccess,
}

const frame: SystemSampleFrame = {
  type: 'sample',
  at: 1_000,
  host: {
    hostname: 'studio',
    platform: 'darwin',
    arch: 'arm64',
    osVersion: '25G76',
    model: 'Mac14,10',
    chip: 'Apple M2 Pro',
    cores: 12,
    totalMemoryBytes: 16 * GIB,
    uptimeSeconds: 3 * 86_400 + 4 * 3_600,
  },
  cpu: { usage: 0.32, perCore: [0.5, 0.25, 0], loadAverage: [1.2, 1.5, 1.8] },
  memory: {
    totalBytes: 16 * GIB,
    usedBytes: 10 * GIB,
    freeBytes: 6 * GIB,
    appBytes: 5 * GIB,
    wiredBytes: 4 * GIB,
    compressedBytes: 1 * GIB,
    cachedBytes: 2 * GIB,
    swapTotalBytes: 2 * GIB,
    swapUsedBytes: 1 * GIB,
  },
  gpu: {
    name: 'Apple M2 Pro GPU',
    utilization: 0.12,
    renderer: 0.1,
    tiler: 0.11,
    inUseMemoryBytes: 700 * MIB,
    allocatedMemoryBytes: 2 * GIB,
  },
  disk: { mount: '/', totalBytes: 460 * GIB, freeBytes: 35 * GIB },
  network: {
    receivedBytesPerSecond: 1024 * 1024,
    sentBytesPerSecond: 2048,
    totalReceivedBytes: 10,
    totalSentBytes: 5,
  },
  power: { batteryPercent: 80, charging: false, thermalPressure: 'nominal' },
  processes: [{ pid: 42, name: '/usr/libexec/WindowServer', cpuPercent: 12.5, memoryPercent: 1.2 }],
  unavailable: [],
}

/** Build one client snapshot around a frame. */
function snapshotOf(overrides: Partial<SystemMonitorSnapshot> = {}): SystemMonitorSnapshot {
  return {
    frame,
    points: [{ at: 1_000, cpu: 0.32, gpu: 0.12, memory: 0.625 }],
    status: 'live',
    failure: null,
    ...overrides,
  }
}

/**
 * Mount the card with one snapshot, a watch stub, and the surface face.
 * @param snapshot - client state the hook reports.
 * @param face - surface plus the desktop callbacks the registration injects.
 */
/** The card's props for one snapshot and face, for mounting and rerendering. */
function dockProps(
  snapshot: SystemMonitorSnapshot = snapshotOf(),
  face: {
    surface?: 'overlay' | 'window'
    floatPanel?: (() => void) | null
    closeWindow?: (() => void) | null
    resizeWindow?: (form: 'pill' | 'card') => void
  } = {},
  release: ReturnType<typeof vi.fn> = vi.fn(),
): SystemMonitorDockProps {
  return {
    ...standard,
    useMonitor: select => select(snapshot),
    watch: () => release,
    surface: face.surface ?? 'overlay',
    floatPanel: face.floatPanel ?? null,
    closeWindow: face.closeWindow ?? null,
    resizeWindow: face.resizeWindow ?? null,
    t: makeTranslate(en),
  } as SystemMonitorDockProps
}

/**
 * Mount the card with one snapshot, a watch stub, and the surface face.
 * @param snapshot - client state the hook reports.
 * @param face - surface plus the desktop callbacks the registration injects.
 * @returns the watch and release stubs, and the render result for rerendering.
 */
function mount(snapshot: SystemMonitorSnapshot = snapshotOf(), face: Parameters<typeof dockProps>[1] = {}) {
  const release = vi.fn()
  const watch = vi.fn()
  const props = dockProps(snapshot, face, release)
  props.watch = watch
  watch.mockImplementation(() => release)
  const view = render(<SystemMonitorDock {...props} />)
  return { props, view, watch, release }
}

/** Store a layout so the card mounts expanded at a known offset. */
function storeLayout(x: number, y: number, extra: Record<string, unknown> = {}): void {
  localStorage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify({ x, y, form: 'card', restore: 'card', paused: false, placed: true, ...extra }))
}

/** The card's current offsets. */
function cardOffsets(): { left: string; top: string } {
  const card = screen.getByLabelText('System monitor')
  return { left: card.style.left, top: card.style.top }
}

beforeEach(() => { localStorage.clear() })
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear() })

describe('SystemMonitorDock', () => {
  it('reports live readings in the pill and opens the dashboard', () => {
    const { view } = mount()
    expect(screen.getByRole('button', { name: 'Open the system monitor' })).toBeTruthy()
    expect(screen.getByText('32%')).toBeTruthy()
    expect(screen.getByText('12%')).toBeTruthy()
    expect(screen.getByText('63%')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Open the system monitor' }))
    expect(screen.getByLabelText('System monitor')).toBeTruthy()
    view.unmount()
  })

  it('draws the dashboard sections, readings, and process rows', () => {
    storeLayout(100, 100)
    mount()
    expect(screen.getByText('Processor')).toBeTruthy()
    expect(screen.getByText('Graphics')).toBeTruthy()
    expect(screen.getAllByText('Memory').length).toBeGreaterThan(1)
    expect(screen.getByText('Network · down')).toBeTruthy()
    expect(screen.getByText('Network · up')).toBeTruthy()
    expect(screen.getByText('Disk')).toBeTruthy()
    expect(screen.getByText('Battery')).toBeTruthy()
    expect(screen.getByText('nominal')).toBeTruthy()
    expect(screen.getByText('Mac14,10 · Apple M2 Pro')).toBeTruthy()
    expect(screen.getByText('WindowServer')).toBeTruthy()
    expect(screen.getByText('92%')).toBeTruthy()
    expect(screen.getByText('1.0 MB/s')).toBeTruthy()
  })

  it('omits absent collectors and names the unavailable ones', () => {
    storeLayout(100, 100)
    mount(snapshotOf({
      frame: {
        ...frame,
        gpu: null,
        disk: null,
        network: null,
        power: null,
        processes: [],
        unavailable: ['gpu', 'disk'],
      },
    }))
    expect(screen.queryByText('Graphics')).toBeNull()
    expect(screen.queryByText('Disk')).toBeNull()
    expect(screen.queryByText('Battery')).toBeNull()
    expect(screen.queryByText('Network · down')).toBeNull()
    expect(screen.getByText('No process data')).toBeTruthy()
    expect(screen.getByText('Collectors unavailable: gpu, disk')).toBeTruthy()
  })

  it('shows the waiting state before the first frame', () => {
    const { view } = mount(snapshotOf({ frame: null, points: [], status: 'idle' }))
    expect(screen.getByText('paused')).toBeTruthy()
    view.unmount()
    storeLayout(100, 100)
    mount(snapshotOf({ frame: null, points: [], status: 'idle' }))
    expect(screen.getByText('Waiting for the host…')).toBeTruthy()
  })

  it.each([
    ['reconnecting', 'reconnecting'],
    ['failed', 'unavailable'],
    ['idle', 'paused'],
    ['live', 'live'],
  ] as const)('labels the %s stream state', (status, label) => {
    storeLayout(100, 100)
    mount(snapshotOf({ status }))
    expect(screen.getAllByText(label).length).toBeGreaterThan(0)
  })

  it('pauses and resumes the shared stream', () => {
    storeLayout(100, 100)
    const { watch, release } = mount()
    expect(watch).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Pause sampling' }))
    expect(release).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Resume sampling' }))
    expect(watch).toHaveBeenCalledTimes(2)
  })

  it('drags the card by its title bar and keeps the offset', () => {
    storeLayout(100, 100)
    mount()
    const header = document.querySelector('[data-drag-handle]') as HTMLElement
    const capture = vi.fn()
    header.setPointerCapture = capture
    fireEvent.pointerDown(header, { button: 0, pointerId: 1, clientX: 150, clientY: 120 })
    expect(capture).toHaveBeenCalledWith(1)
    fireEvent.pointerMove(header, { pointerId: 1, clientX: 250, clientY: 200 })
    expect(cardOffsets()).toEqual({ left: '200px', top: '180px' })
    fireEvent.pointerUp(header, { pointerId: 1 })
    expect(JSON.parse(localStorage.getItem(OVERLAY_STORAGE_KEY) ?? '{}')).toMatchObject({ x: 200, y: 180 })
  })

  it('drags the card by its surface, but leaves the readings to their own rows', () => {
    storeLayout(100, 100)
    mount()
    const card = screen.getByLabelText('System monitor')
    fireEvent.pointerDown(card, { button: 0, pointerId: 9, clientX: 150, clientY: 220 })
    fireEvent.pointerMove(card, { pointerId: 9, clientX: 260, clientY: 230 })
    expect(cardOffsets()).toEqual({ left: '210px', top: '110px' })
    fireEvent.pointerUp(card, { pointerId: 9 })
    const row = screen.getByText('WindowServer')
    expect(row.closest('li')).toBeTruthy()
    fireEvent.pointerDown(row.closest('li')!, { button: 0, pointerId: 10, clientX: 260, clientY: 230 })
    fireEvent.pointerMove(card, { pointerId: 10, clientX: 400, clientY: 400 })
    expect(cardOffsets()).toEqual({ left: '210px', top: '110px' })
  })

  it('drags the pill from its own open control, which covers almost all of it', () => {
    mount()
    const pill = document.querySelector('[data-system-monitor-pill]') as HTMLElement
    const open = screen.getByRole('button', { name: 'Open the system monitor' })
    const start = Math.round(Number.parseFloat(pill.style.left))
    fireEvent.pointerDown(open, { button: 0, pointerId: 30, clientX: 900, clientY: 700 })
    fireEvent.pointerMove(open, { pointerId: 30, clientX: 820, clientY: 660 })
    fireEvent.pointerUp(open, { pointerId: 30 })
    expect(Math.round(Number.parseFloat(pill.style.left))).toBe(start - 80)
    // The click that ends the drag never reaches the control, so the pill stays closed.
    fireEvent.click(open)
    expect(document.querySelector('[data-system-monitor-card]')).toBeNull()
  })

  it('drags the pill anywhere but only opens it for a press that did not move', () => {
    mount()
    const pill = document.querySelector('[data-system-monitor-pill]') as HTMLElement
    const open = screen.getByRole('button', { name: 'Open the system monitor' })
    const start = Math.round(Number.parseFloat(pill.style.left))
    fireEvent.pointerDown(pill, { button: 0, pointerId: 3, clientX: 200, clientY: 200 })
    fireEvent.pointerMove(pill, { pointerId: 3, clientX: 201, clientY: 201 })
    fireEvent.pointerMove(pill, { pointerId: 3, clientX: 140, clientY: 140 })
    fireEvent.pointerUp(pill, { pointerId: 3 })
    // The click that ends a drag stays with the drag.
    fireEvent.click(open)
    expect(document.querySelector('[data-system-monitor-card]')).toBeNull()
    expect(Math.round(Number.parseFloat(pill.style.left))).toBeLessThan(start)
    // Opening still follows a press that stays put.
    fireEvent.click(open)
    expect(screen.getByLabelText('System monitor')).toBeTruthy()
    expect(screen.getByLabelText('System monitor')).toBeTruthy()
  })

  it('parks the closed monitor as a ball against the nearer edge and restores its form', () => {
    storeLayout(100, 100)
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Tuck to the edge' }))
    const ball = document.querySelector('[data-system-monitor-ball]') as HTMLElement
    expect(ball.dataset.edge).toBe('left')
    expect(ball.style.left).toBe('-22px')
    expect(ball.style.top).toBe(`${100 + 452 / 2 - 22}px`)
    expect(ball.dataset.tone).toBe('calm')
    expect(ball.textContent).toBe('32%')
    expect(JSON.parse(localStorage.getItem(OVERLAY_STORAGE_KEY) ?? '{}')).toMatchObject({ form: 'ball', edge: 'left', restore: 'card' })
    fireEvent.click(ball)
    expect(cardOffsets()).toEqual({ left: '100px', top: '100px' })
  })

  it('parks a pill against the right edge and returns the pill', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Tuck to the edge' }))
    const ball = document.querySelector('[data-system-monitor-ball]') as HTMLElement
    expect(ball.dataset.edge).toBe('right')
    expect(ball.style.right).toBe('-22px')
    expect(ball.style.left).toBe('')
    fireEvent.click(ball)
    expect(screen.getByRole('button', { name: 'Open the system monitor' })).toBeTruthy()
  })

  it('colours the ball by processor load and greys it while paused', () => {
    const toneOf = (cpu: number): string => {
      localStorage.clear()
      const view = mount(snapshotOf({ frame: { ...frame, cpu: { ...frame.cpu, usage: cpu } } }))
      fireEvent.click(screen.getByRole('button', { name: 'Tuck to the edge' }))
      const value = (document.querySelector('[data-system-monitor-ball]') as HTMLElement).dataset.tone ?? ''
      view.view.unmount()
      return value
    }
    expect(toneOf(0.9)).toBe('hot')
    expect(toneOf(0.7)).toBe('busy')
    localStorage.clear()
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Tuck to the edge' }))
    fireEvent.contextMenu(document.querySelector('[data-system-monitor-ball]') as HTMLElement)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Pause sampling' }))
    const ball = document.querySelector('[data-system-monitor-ball]') as HTMLElement
    expect(ball.dataset.tone).toBe('neutral')
    expect(ball.textContent).toBe('paused')
  })

  it('leaves other keys to the open control', () => {
    mount()
    const open = screen.getByRole('button', { name: 'Open the system monitor' })
    fireEvent.keyDown(open, { key: 'Enter' })
    expect(screen.queryByRole('menuitem', { name: 'Tuck to the edge' })).toBeNull()
  })

  it('opens the monitor menu on a context gesture and runs its rows', () => {
    storeLayout(100, 100)
    const floatPanel = vi.fn()
    const closeWindow = vi.fn()
    const { watch, release } = mount(snapshotOf(), { floatPanel, closeWindow })
    const card = document.querySelector('[data-system-monitor-card]') as HTMLElement
    fireEvent.contextMenu(card)
    expect(screen.getByRole('menuitem', { name: 'Pause sampling' })).toBeTruthy()
    expect(screen.queryByRole('menuitem', { name: 'Expand' })).toBeNull()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Pause sampling' }))
    expect(release).toHaveBeenCalledTimes(1)
    fireEvent.contextMenu(card)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Resume sampling' }))
    expect(watch).toHaveBeenCalledTimes(2)
    fireEvent.contextMenu(card)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Float on the desktop' }))
    expect(floatPanel).toHaveBeenCalledTimes(1)
    fireEvent.contextMenu(card)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Hide the panel' }))
    expect(closeWindow).toHaveBeenCalledTimes(1)
  })

  it('opens the pill menu with the keyboard menu key and dismisses it', () => {
    mount()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Open the system monitor' }), { key: 'F10', shiftKey: true })
    expect(screen.getByRole('menuitem', { name: 'Tuck to the edge' })).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menuitem', { name: 'Tuck to the edge' })).toBeNull()
  })

  it('parks from the pill menu and expands the ball back through its own row', () => {
    mount()
    fireEvent.contextMenu(document.querySelector('[data-system-monitor-pill]') as HTMLElement)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Tuck to the edge' }))
    expect(document.querySelector('[data-system-monitor-ball]')).toBeTruthy()
    fireEvent.contextMenu(document.querySelector('[data-system-monitor-ball]') as HTMLElement)
    expect(screen.queryByRole('menuitem', { name: 'Pause sampling' })).toBeTruthy()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Expand' }))
    expect(screen.getByRole('button', { name: 'Open the system monitor' })).toBeTruthy()
  })

  it('sizes the desktop panel window to the form it shows', () => {
    storeLayout(100, 100)
    const resizeWindow = vi.fn()
    mount(snapshotOf(), { surface: 'window', resizeWindow })
    expect(resizeWindow).toHaveBeenLastCalledWith('card')
    fireEvent.click(screen.getByRole('button', { name: 'Collapse the system monitor' }))
    expect(resizeWindow).toHaveBeenLastCalledWith('pill')
    fireEvent.click(screen.getByRole('button', { name: 'Pause sampling' }))
    // A fresh document starts as the pill it shows before the first toggle.
    const fresh = vi.fn()
    mount(snapshotOf(), { surface: 'window', resizeWindow: fresh })
    expect(fresh).toHaveBeenLastCalledWith('pill')
  })

  it('starts the ball against the right edge from the recency record', () => {
    localStorage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify({ x: 40, y: 60, form: 'ball', axis: 30, edge: 'left', restore: 'pill', placed: true }))
    mount()
    const ball = document.querySelector('[data-system-monitor-ball]') as HTMLElement
    expect(ball.dataset.edge).toBe('left')
    expect(ball.style.left).toBe('-22px')
    expect(ball.style.top).toBe('8px')
  })

  it('draws the ball as waiting while the host has not sent a frame', () => {
    mount(snapshotOf({ frame: null, points: [], status: 'reconnecting' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tuck to the edge' }))
    const ball = document.querySelector('[data-system-monitor-ball]') as HTMLElement
    expect(ball.textContent).toBe('reconnecting')
    expect(ball.dataset.tone).toBe('neutral')
  })

  it('reports the first frame from the ball before any pocket click', () => {
    mount(snapshotOf({ frame: null, points: [], status: 'idle' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tuck to the edge' }))
    expect((document.querySelector('[data-system-monitor-ball]') as HTMLElement).textContent).toBe('paused')
  })

  it('does not move a card the current window size already holds', () => {
    window.innerWidth = 1024
    window.innerHeight = 768
    storeLayout(100, 100)
    const { view } = mount()
    const card = screen.getByLabelText('System monitor')
    const before = card.style.cssText
    fireEvent(window, new Event('resize'))
    expect(card.style.cssText).toBe(before)
    view.unmount()
  })

  it('keeps a free card inside a window that shrank', () => {
    window.innerWidth = 1024
    window.innerHeight = 768
    storeLayout(400, 300)
    const { view, props } = mount()
    view.rerender(<SystemMonitorDock {...props} />)
    expect(cardOffsets()).toEqual({ left: '400px', top: '300px' })
    // A zero-area store keeps the recorded layout without unwrapping it.
    window.innerWidth = 500
    window.innerHeight = 500
    fireEvent(window, new Event('resize'))
    expect(cardOffsets()).toEqual({ left: `${500 - 348 - 16}px`, top: `${Math.max(16, 500 - 452 - 16)}px` })
    view.unmount()
  })

  it('keeps a parked ball against its edge when the window resizes', () => {
    window.innerWidth = 1024
    window.innerHeight = 768
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Tuck to the edge' }))
    window.innerWidth = 700
    window.innerHeight = 400
    fireEvent(window, new Event('resize'))
    const ball = document.querySelector('[data-system-monitor-ball]') as HTMLElement
    expect(ball.dataset.edge).toBe('right')
    expect(ball.style.right).toBe('-22px')
    expect(ball.style.top).toBe(`${400 - 22 - 22}px`)
  })

  it('leaves a header control press to the control', () => {
    storeLayout(100, 100)
    const { watch } = mount()
    const header = document.querySelector('[data-drag-handle]') as HTMLElement
    const pause = screen.getByRole('button', { name: 'Pause sampling' })
    fireEvent.pointerDown(pause, { button: 0, pointerId: 7, clientX: 150, clientY: 120 })
    fireEvent.pointerMove(header, { pointerId: 7, clientX: 400, clientY: 400 })
    expect(cardOffsets()).toEqual({ left: '100px', top: '100px' })
    fireEvent.click(pause)
    expect(watch).toHaveBeenCalledTimes(1)
  })

  it('ignores a secondary press and a foreign pointer', () => {
    storeLayout(100, 100)
    mount()
    const header = document.querySelector('[data-drag-handle]') as HTMLElement
    fireEvent.pointerDown(header, { button: 2, pointerId: 1, clientX: 150, clientY: 120 })
    fireEvent.pointerMove(header, { pointerId: 1, clientX: 250, clientY: 200 })
    expect(cardOffsets()).toEqual({ left: '100px', top: '100px' })
    fireEvent.pointerDown(header, { button: 0, pointerId: 2, clientX: 150, clientY: 120 })
    fireEvent.pointerMove(header, { pointerId: 3, clientX: 400, clientY: 400 })
    expect(cardOffsets()).toEqual({ left: '100px', top: '100px' })
    fireEvent.pointerUp(header, { pointerId: 3 })
    fireEvent.pointerUp(header)
  })

  it('keeps the card inside the viewport and survives a missing capture API', () => {
    storeLayout(100, 100)
    mount()
    const header = document.querySelector('[data-drag-handle]') as HTMLElement
    Object.defineProperty(header, 'setPointerCapture', { configurable: true, value: undefined })
    fireEvent.pointerDown(header, { button: 0, pointerId: 4, clientX: 150, clientY: 120 })
    fireEvent.pointerMove(header, { pointerId: 4, clientX: 5000, clientY: 5000 })
    // The card keeps its margin, and a window shorter than the card pins it to the top margin.
    expect(cardOffsets()).toEqual({
      left: `${window.innerWidth - 348 - 16}px`,
      top: `${Math.max(16, window.innerHeight - 452 - 16)}px`,
    })
    // jsdom also omits the capture the browser would have taken here.
    fireEvent.pointerUp(header, { pointerId: 4 })
  })

  it('ignores a press on a parked ball and a stray pointer release', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Tuck to the edge' }))
    const ball = document.querySelector('[data-system-monitor-ball]') as HTMLElement
    fireEvent.pointerDown(ball, { button: 0, pointerId: 6, clientX: 10, clientY: 10 })
    fireEvent.pointerMove(ball, { pointerId: 6, clientX: 300, clientY: 300 })
    expect(ball.style.top).not.toBe('278px')
    fireEvent.pointerUp(document.body, { pointerId: 99 })
    fireEvent.click(ball)
    expect(screen.getByRole('button', { name: 'Open the system monitor' })).toBeTruthy()
  })

  it('leaves a press below the drag threshold as a click', () => {
    window.innerWidth = 1024
    window.innerHeight = 768
    storeLayout(100, 100)
    mount()
    const card = document.querySelector('[data-system-monitor-card]') as HTMLElement
    fireEvent.pointerDown(card, { button: 0, pointerId: 13, clientX: 150, clientY: 120 })
    fireEvent.pointerMove(card, { pointerId: 13, clientX: 153, clientY: 122 })
    expect(cardOffsets()).toEqual({ left: '100px', top: '100px' })
    // Five pixels on either axis alone is a drag.
    fireEvent.pointerMove(card, { pointerId: 13, clientX: 155, clientY: 122 })
    expect(cardOffsets()).toEqual({ left: '105px', top: '102px' })
    // The monitor captured the pointer, so its element also hears the release.
    fireEvent.pointerUp(card, { pointerId: 13 })
  })

  it('swallows a click that ends a drag on the pill even after the pill already opened', () => {
    mount()
    const pill = document.querySelector('[data-system-monitor-pill]') as HTMLElement
    const open = screen.getByRole('button', { name: 'Open the system monitor' })
    fireEvent.pointerDown(pill, { button: 0, pointerId: 14, clientX: 200, clientY: 200 })
    fireEvent.pointerMove(pill, { pointerId: 14, clientX: 260, clientY: 260 })
    fireEvent.pointerUp(pill, { pointerId: 14 })
    fireEvent.click(open)
    expect(document.querySelector('[data-system-monitor-card]')).toBeNull()
    expect(document.querySelector('[data-system-monitor-pill]')).toBeTruthy()
  })

  it('keeps an unsettled click from changing the form', () => {
    // Window size survives localStorage.clear() in afterEach from an earlier test.
    window.innerWidth = 1024
    window.innerHeight = 768
    storeLayout(100, 100)
    mount()
    const card = screen.getByLabelText('System monitor')
    fireEvent.pointerDown(card, { button: 0, pointerId: 11, clientX: 150, clientY: 120 })
    fireEvent.pointerMove(card, { pointerId: 11, clientX: 260, clientY: 200 })
    fireEvent.pointerUp(card, { pointerId: 11 })
    // An element outside React opens and closes the card through the browser's
    // own click, which only the capture phase claims.
    const outside = document.createElement('button')
    document.body.append(outside)
    outside.addEventListener('click', () => { fireEvent.click(card) })
    outside.click()
    outside.remove()
    expect(cardOffsets()).toEqual({ left: '210px', top: '180px' })
  })

  it('restores the form a drag started from when its trailing click had toggled the card', () => {
    mount()
    const pill = document.querySelector('[data-system-monitor-pill]') as HTMLElement
    fireEvent.pointerDown(pill, { button: 0, pointerId: 15, clientX: 200, clientY: 200 })
    fireEvent.pointerMove(pill, { pointerId: 15, clientX: 260, clientY: 260 })
    fireEvent.pointerUp(pill, { pointerId: 15 })
    // The gesture expands the card; a later click on the card's surface is swallowed and the pill returns.
    const card = screen.getByLabelText('System monitor')
    fireEvent.pointerDown(card, { button: 0, pointerId: 16, clientX: 240, clientY: 240 })
    fireEvent.pointerMove(card, { pointerId: 16, clientX: 300, clientY: 300 })
    fireEvent.pointerUp(card, { pointerId: 16 })
    fireEvent.click(card)
    expect(document.querySelector('[data-system-monitor-pill]')).toBeTruthy()
  })

  it('ends a drag where it began when the release lands on the header controls', () => {
    window.innerWidth = 1024
    window.innerHeight = 768
    storeLayout(100, 100)
    mount()
    const card = screen.getByLabelText('System monitor')
    const collapse = screen.getByRole('button', { name: 'Collapse the system monitor' })
    fireEvent.pointerDown(card, { button: 0, pointerId: 16, clientX: 150, clientY: 120 })
    fireEvent.pointerMove(card, { pointerId: 16, clientX: 250, clientY: 200 })
    fireEvent.pointerUp(card, { pointerId: 16 })
    // The browser sends the drag's click to the control under the release, and
    // React runs its handler before the monitor can claim the click.
    fireEvent.click(collapse)
    expect(document.querySelector('[data-system-monitor-card]')).toBeTruthy()
    expect(JSON.parse(localStorage.getItem(OVERLAY_STORAGE_KEY) ?? '{}')).toMatchObject({ form: 'card' })
    // The drag moved the card, but it did not change form; the next press starts
    // a fresh gesture, so its own click reaches the control.
    expect(cardOffsets()).toEqual({ left: '200px', top: '180px' })
    fireEvent.pointerDown(card, { button: 0, pointerId: 17, clientX: 150, clientY: 150 })
    fireEvent.click(collapse)
    expect(screen.getByRole('button', { name: 'Open the system monitor' })).toBeTruthy()
  })

  it('collapses back to the pill from the header', () => {
    storeLayout(100, 100)
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Collapse the system monitor' }))
    expect(screen.getByRole('button', { name: 'Open the system monitor' })).toBeTruthy()
  })

  it('renders without persistent storage', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('blocked') })
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Open the system monitor' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pause sampling' }))
    expect(screen.getByLabelText('System monitor')).toBeTruthy()
  })

  it('handles a zero-capacity disk and battery readings the platform omits', () => {
    storeLayout(100, 100)
    mount(snapshotOf({
      frame: {
        ...frame,
        disk: { mount: '/', totalBytes: 0, freeBytes: 0 },
        power: { batteryPercent: null, charging: null, thermalPressure: 'serious' },
        memory: { ...frame.memory, totalBytes: 0, usedBytes: 0 },
      },
    }))
    expect(screen.getByText('serious')).toBeTruthy()
    expect(screen.getAllByText(/—/u).length).toBeGreaterThan(0)
  })

  it('falls back to zero for GPU memory and reads a charging battery', () => {
    storeLayout(100, 100)
    mount(snapshotOf({
      frame: {
        ...frame,
        gpu: { ...frame.gpu!, inUseMemoryBytes: null },
        power: { batteryPercent: 42, charging: true, thermalPressure: 'nominal' },
      },
      points: [{ at: 1_000, cpu: 0.2, gpu: null, memory: 0.5 }],
    }))
    expect(screen.getByText('0 B')).toBeTruthy()
    expect(screen.getByText(/42%.*charging/u)).toBeTruthy()
  })

  it('reports the paused state instead of frozen readings in the pill', () => {
    const { view } = mount()
    expect(screen.getByText('32%')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Open the system monitor' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pause sampling' }))
    fireEvent.click(screen.getByRole('button', { name: 'Collapse the system monitor' }))
    expect(screen.getByText('paused')).toBeTruthy()
    expect(screen.queryByText('32%')).toBeNull()
    view.unmount()
  })

  it('keeps the desktop panel card filling its window and its controls their presses', () => {
    storeLayout(100, 100)
    mount(snapshotOf(), { surface: 'window' })
    const card = document.querySelector('[data-window-surface]') as HTMLElement
    // The header's native drag region moves the window, so the document never
    // offsets the card inside it.
    expect({ left: card.style.left, top: card.style.top }).toEqual({ left: '', top: '' })
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Pause sampling' }), { button: 0, pointerId: 11 })
    expect(screen.getByRole('button', { name: 'Pause sampling' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Pause sampling' }))
    expect(screen.getByRole('button', { name: 'Resume sampling' })).toBeTruthy()
  })

  it('renders the desktop panel surface without the pill', () => {
    mount(snapshotOf(), { surface: 'window' })
    expect(screen.queryByRole('button', { name: 'Open the system monitor' })).toBeNull()
    expect(screen.getByLabelText('System monitor')).toBeTruthy()
    expect(screen.getByText('Processor')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Hide the panel' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Pause sampling' }))
    expect(screen.getByRole('button', { name: 'Resume sampling' })).toBeTruthy()
  })

  it('closes the panel window from its own control', () => {
    const closeWindow = vi.fn()
    mount(snapshotOf(), { surface: 'window', closeWindow })
    fireEvent.click(screen.getByRole('button', { name: 'Hide the panel' }))
    expect(closeWindow).toHaveBeenCalledTimes(1)
  })

  it('floats the overlay onto the desktop from its header', () => {
    storeLayout(100, 100)
    const floatPanel = vi.fn()
    mount(snapshotOf(), { floatPanel })
    fireEvent.click(screen.getByRole('button', { name: 'Float on the desktop' }))
    expect(floatPanel).toHaveBeenCalledTimes(1)
  })

  it('renders each header control as its icon, never as an escape sequence', () => {
    storeLayout(100, 100)
    const { view } = mount(snapshotOf(), { floatPanel: () => {} })
    const glyph = (name: string): string => screen.getByRole('button', { name }).textContent ?? ''
    // A literal backslash here means the escape never became a character.
    expect(glyph('Float on the desktop')).toBe('⧉')
    expect(glyph('Pause sampling')).toBe('❚❚')
    fireEvent.click(screen.getByRole('button', { name: 'Pause sampling' }))
    expect(glyph('Resume sampling')).toBe('')
    expect(screen.getByRole('button', { name: 'Resume sampling' }).querySelector('[data-icon]')).toBeTruthy()
    view.unmount()

    const panel = mount(snapshotOf(), { surface: 'window', closeWindow: () => {} })
    expect(screen.getByRole('button', { name: 'Hide the panel' }).textContent).toBe('✕')
    panel.view.unmount()
  })

  it('collapses through the shared chevron icon on the bare control', () => {
    storeLayout(100, 100)
    mount()
    const collapse = screen.getByRole('button', { name: 'Collapse the system monitor' })
    expect(collapse.querySelector('[data-icon]')).toBeTruthy()
    expect(collapse.textContent).toBe('')
    fireEvent.click(collapse)
    expect(screen.getByRole('button', { name: 'Open the system monitor' })).toBeTruthy()
  })

  it('hides the float control when the build has no desktop panel', () => {
    storeLayout(100, 100)
    mount()
    expect(screen.queryByRole('button', { name: 'Float on the desktop' })).toBeNull()
  })

  it('shows a dash in the pill when the platform has no GPU reading', () => {
    mount(snapshotOf({ frame: { ...frame, gpu: null } }))
    expect(screen.getByText('—')).toBeTruthy()
  })
})
