// @vitest-environment jsdom
/** Dot-field canvas host: sizing, frames, pointer physics, theme recoloring, and teardown. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { createDotGrid } from '../src/client/skeleton/dot-field.ts'
import { DotField } from '../src/client/skeleton/DotField.tsx'

const BASE_TOKEN = '--dsw-alias-border-l3'
const ACTIVE_TOKEN = '--dsw-brand-mark-end'

interface Arc {
  readonly x: number
  readonly y: number
  readonly fill: string
}

interface FakeContext {
  fillStyle: string
  setTransform(...values: number[]): void
  clearRect(): void
  beginPath(): void
  arc(x: number, y: number, _radius: number, _start: number, _end: number): void
  fill(): void
}

function fakeContext() {
  const arcs: Arc[] = []
  const transforms: number[][] = []
  const context: FakeContext = {
    fillStyle: '',
    setTransform(...values: number[]) { transforms.push(values) },
    clearRect() {},
    beginPath() {},
    arc(x: number, y: number) { arcs.push({ x, y, fill: context.fillStyle }) },
    fill() {},
  }
  return { context, arcs, transforms }
}

function rect(width: number, height: number): DOMRect {
  return { x: 0, y: 0, width, height, top: 0, right: width, bottom: height, left: 0, toJSON: () => ({}) }
}

let frames: Map<number, FrameRequestCallback>
let resizeRecords: ResizeEntry[]
let reduceMotion: boolean
let clock: number

interface ResizeEntry {
  readonly callback: ResizeObserverCallback
  targets: Element[]
}

class ResizeObserverStub implements ResizeObserver {
  private readonly entry: ResizeEntry
  constructor(callback: ResizeObserverCallback) {
    this.entry = { callback, targets: [] }
    resizeRecords.push(this.entry)
  }
  observe(target: Element): void { this.entry.targets.push(target) }
  unobserve(): void {}
  disconnect(): void { this.entry.targets.length = 0 }
}

const NOOP_OBSERVER: ResizeObserver = { observe() {}, unobserve() {}, disconnect() {} }

function fireResize(): void {
  for (const entry of resizeRecords) entry.callback([], NOOP_OBSERVER)
}

function flushFrames(time: number): void {
  const pending = [...frames.values()]
  frames.clear()
  for (const callback of pending) callback(time)
}

function move(x: number, y: number): void {
  window.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y }))
}

function click(x: number, y: number): void {
  window.dispatchEvent(new MouseEvent('click', { clientX: x, clientY: y, detail: 1 }))
}

function setToken(token: string, value: string): void {
  document.body.style.setProperty(token, value)
}

beforeEach(() => {
  document.body.style.setProperty(BASE_TOKEN, 'rgb(224, 224, 224)')
  document.body.style.setProperty(ACTIVE_TOKEN, 'rgb(254, 80, 66)')
  frames = new Map()
  resizeRecords = []
  reduceMotion = false
  clock = 0
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = frames.size + 1
    frames.set(id, callback)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => { frames.delete(id) })
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduced-motion') ? reduceMotion : false,
  }))
  vi.spyOn(performance, 'now').mockImplementation(() => clock)
  Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 2 })
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect')
    .mockReturnValue(rect(100, 80))
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  document.body.removeAttribute('data-ds-dark-theme')
  document.body.style.removeProperty(BASE_TOKEN)
  document.body.style.removeProperty(ACTIVE_TOKEN)
})

function mockContext(context: FakeContext | null) {
  return vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue(context as CanvasRenderingContext2D | null)
}

describe('DotField', () => {
  it('draws the resting grid and marks the canvas ready', () => {
    const { context, arcs, transforms } = fakeContext()
    mockContext(context)
    const view = render(<DotField />)
    const canvas = view.container.querySelector<HTMLCanvasElement>('canvas')!
    expect(canvas.getAttribute('data-dot-field')).toBe('')
    expect(canvas.getAttribute('aria-hidden')).toBe('true')
    expect(canvas.width).toBe(200)
    expect(canvas.height).toBe(160)
    expect(transforms[0]).toEqual([2, 0, 0, 2, 0, 0])
    expect(arcs).toHaveLength(createDotGrid(100, 80).length)
    expect(arcs.every(arc => arc.fill === 'rgba(224, 224, 224, 1)')).toBe(true)
    expect(canvas.hasAttribute('data-ready')).toBe(true)
    expect(frames.size).toBe(0)
  })

  it('does not touch a context before the canvas has a box', () => {
    const context = fakeContext()
    const getContext = mockContext(context.context)
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue(rect(0, 0))
    const view = render(<DotField />)
    expect(getContext).not.toHaveBeenCalled()
    expect(view.container.querySelector<HTMLCanvasElement>('canvas')!.hasAttribute('data-ready')).toBe(false)
  })

  it('keeps the CSS fallback when no 2D context is available', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const getContext = mockContext(null)
    const view = render(<DotField />)
    const canvas = view.container.querySelector<HTMLCanvasElement>('canvas')!
    expect(getContext).toHaveBeenCalledTimes(1)
    expect(canvas.hasAttribute('data-ready')).toBe(false)
    vi.advanceTimersByTime(220)
    expect(getContext).toHaveBeenCalledTimes(1)
    expect(() => { view.unmount() }).not.toThrow()
  })

  it('caps the backing-store ratio', () => {
    const { context } = fakeContext()
    mockContext(context)
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 3 })
    const view = render(<DotField />)
    expect(view.container.querySelector<HTMLCanvasElement>('canvas')!.width).toBe(200)
  })

  it('rebuilds the grid after the resize debounce and releases at zero size', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { context, arcs } = fakeContext()
    mockContext(context)
    const view = render(<DotField />)
    const canvas = view.container.querySelector<HTMLCanvasElement>('canvas')!
    arcs.length = 0
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue(rect(200, 160))
    fireResize()
    vi.advanceTimersByTime(219)
    expect(arcs).toHaveLength(0)
    vi.advanceTimersByTime(1)
    expect(arcs).toHaveLength(createDotGrid(200, 160).length)
    expect(canvas.width).toBe(400)
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue(rect(0, 0))
    fireResize()
    vi.advanceTimersByTime(220)
    expect(canvas.hasAttribute('data-ready')).toBe(false)
    expect(canvas.width).toBe(0)
  })

  it('pushes dots around a fast pointer move', () => {
    const { context, arcs } = fakeContext()
    mockContext(context)
    render(<DotField />)
    const resting = createDotGrid(100, 80).map(dot => ({ x: dot.cx, y: dot.cy }))
    arcs.length = 0
    clock = 100
    move(10, 10)
    flushFrames(16)
    expect(arcs.map(arc => ({ x: arc.x, y: arc.y }))).toEqual(resting)
    arcs.length = 0
    clock = 150
    move(90, 60)
    expect(frames.size).toBe(1)
    flushFrames(32)
    expect(arcs.some(arc => !resting.some(point => point.x === arc.x && point.y === arc.y))).toBe(true)
  })

  it('sends a shockwave on click and clears the tint outside the field', () => {
    const { context, arcs } = fakeContext()
    mockContext(context)
    render(<DotField />)
    const resting = createDotGrid(100, 80).map(dot => ({ x: dot.cx, y: dot.cy }))
    arcs.length = 0
    click(50, 40)
    flushFrames(32)
    expect(arcs.some(arc => !resting.some(point => point.x === arc.x && point.y === arc.y))).toBe(true)
    clock = 100
    arcs.length = 0
    move(50, 63)
    flushFrames(48)
    expect(arcs.some(arc => arc.fill === 'rgba(254, 80, 66, 1)')).toBe(true)
    clock = 160
    arcs.length = 0
    move(-10, -10)
    flushFrames(64)
    expect(arcs.every(arc => arc.fill === 'rgba(224, 224, 224, 1)')).toBe(true)
  })

  it('keeps a static frame under reduced motion', async () => {
    reduceMotion = true
    const { context, arcs } = fakeContext()
    mockContext(context)
    render(<DotField />)
    expect(arcs).toHaveLength(createDotGrid(100, 80).length)
    clock = 100
    move(10, 10)
    clock = 150
    move(90, 60)
    click(50, 40)
    expect(frames.size).toBe(0)
    arcs.length = 0
    setToken(BASE_TOKEN, 'rgb(10, 20, 30)')
    await act(async () => { await Promise.resolve() })
    expect(arcs).toHaveLength(createDotGrid(100, 80).length)
    expect(arcs.every(arc => arc.fill === 'rgba(10, 20, 30, 1)')).toBe(true)
    expect(frames.size).toBe(0)
  })

  it('recolors the field when the theme body projection changes', async () => {
    const { context, arcs } = fakeContext()
    mockContext(context)
    render(<DotField />)
    arcs.length = 0
    setToken(BASE_TOKEN, 'rgb(10, 20, 30)')
    document.body.setAttribute('data-ds-dark-theme', '')
    await act(async () => { await Promise.resolve() })
    flushFrames(16)
    expect(arcs.length).toBeGreaterThan(0)
    expect(arcs.every(arc => arc.fill === 'rgba(10, 20, 30, 1)')).toBe(true)
  })

  it('releases frames, observers, and listeners on unmount', () => {
    const { context } = fakeContext()
    mockContext(context)
    const view = render(<DotField />)
    const canvas = view.container.querySelector<HTMLCanvasElement>('canvas')!
    clock = 100
    move(10, 10)
    clock = 150
    move(90, 60)
    expect(frames.size).toBe(1)
    view.unmount()
    expect(frames.size).toBe(0)
    expect(canvas.hasAttribute('data-ready')).toBe(false)
    expect(canvas.width).toBe(0)
    expect(resizeRecords.every(entry => entry.targets.length === 0)).toBe(true)
    move(20, 20)
    click(20, 20)
    expect(frames.size).toBe(0)
  })
})
