// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { DirectoryListing } from '@tomato/api-remotes/client'
import { makeTranslate } from '@tomato/client-test-runtime'
import { zh as commonZh } from '@tomato/client-locale/src/locales/zh.ts'
import { FolderPicker, type FolderPickerProps } from '../src/client/FolderPicker.tsx'
import { zh } from '../src/client/locales.ts'

afterEach(cleanup)

const t = makeTranslate({ ...commonZh, ...zh }) as FolderPickerProps['t']

const WORK: DirectoryListing = {
  path: '/work',
  home: '/home/me',
  crumbs: [
    { name: '/', path: '/', hidden: false },
    { name: 'home', path: '/home', hidden: false },
    { name: 'me', path: '/home/me', hidden: false },
    { name: 'work', path: '/work', hidden: false },
  ],
  entries: [
    { name: 'alpha', path: '/work/alpha', hidden: false },
    { name: 'beta', path: '/work/beta', hidden: false },
    { name: '.cache', path: '/work/.cache', hidden: true },
  ],
  truncated: false,
}

const CHILD: DirectoryListing = {
  ...WORK,
  path: '/work/alpha',
  crumbs: [...WORK.crumbs, { name: 'alpha', path: '/work/alpha', hidden: false }],
  entries: [],
}

function mount(overrides: Partial<FolderPickerProps> = {}) {
  const onPicked = vi.fn<FolderPickerProps['onPicked']>()
  const onCancel = vi.fn()
  const listDirectory = vi.fn<FolderPickerProps['listDirectory']>(async (path?: string) =>
    (path === '/work/alpha' ? CHILD : WORK))
  const pickDirectory = vi.fn<FolderPickerProps['pickDirectory']>(async () => null)
  const view = render(
    <FolderPicker
      t={t}
      open
      title="选择工作目录"
      initialPath="/work"
      listDirectory={listDirectory}
      pickDirectory={pickDirectory}
      onPicked={onPicked}
      onCancel={onCancel}
      {...overrides}
    />,
  )
  return { onPicked, onCancel, listDirectory, pickDirectory, view }
}

describe('folder picker', () => {
  it('renders nothing while closed and does not scan', () => {
    const { listDirectory } = mount({ open: false })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(listDirectory).not.toHaveBeenCalled()
  })

  it('lists folders, hides hidden entries, and picks the current level', async () => {
    const { onPicked } = mount()
    expect(await screen.findByText('alpha')).toBeDefined()
    screen.getByText('beta')
    expect(screen.queryByText('.cache')).toBeNull()
    fireEvent.click(screen.getByRole('checkbox', { name: '显示隐藏文件夹' }))
    screen.getByText('.cache')
    fireEvent.click(screen.getByRole('checkbox', { name: '显示隐藏文件夹' }))
    expect(screen.queryByText('.cache')).toBeNull()
    screen.getByRole('button', { name: '主目录' })
    fireEvent.click(screen.getByRole('button', { name: '选择此文件夹' }))
    expect(onPicked).toHaveBeenCalledWith('/work')
  })

  it('steps into a folder, shows an empty level, and steps back up', async () => {
    const { listDirectory } = mount()
    await screen.findByText('alpha')
    fireEvent.click(screen.getByRole('button', { name: 'alpha' }))
    await waitFor(() => { expect(listDirectory).toHaveBeenLastCalledWith('/work/alpha', expect.any(AbortSignal)) })
    screen.getByText('这里没有子文件夹。')
    fireEvent.click(screen.getByRole('button', { name: '上一级' }))
    await waitFor(() => { expect(listDirectory).toHaveBeenLastCalledWith('/work', expect.any(AbortSignal)) })
    screen.getByText('beta')
  })

  it('jumps through a breadcrumb and reports a truncated level', async () => {
    const listDirectory = vi.fn<FolderPickerProps['listDirectory']>(async (path?: string) => ({
      ...WORK,
      ...(path === '/work' ? { truncated: true } : {}),
    }))
    const { onPicked } = mount({ listDirectory })
    await screen.findByText('alpha')
    screen.getByText('文件夹过多，只显示开头部分。')
    fireEvent.click(screen.getByRole('button', { name: 'home' }))
    await waitFor(() => { expect(listDirectory).toHaveBeenLastCalledWith('/home', expect.any(AbortSignal)) })
    // The mocked listing keeps /work as its path, so confirm the current level.
    fireEvent.click(screen.getByRole('button', { name: '选择此文件夹' }))
    expect(onPicked).toHaveBeenCalledWith('/work')
  })

  it('shows the loading state until the first level settles', async () => {
    let settle!: (listing: DirectoryListing) => void
    const listDirectory = vi.fn<FolderPickerProps['listDirectory']>(() =>
      new Promise<DirectoryListing>((resolve) => { settle = resolve }))
    mount({ listDirectory })
    screen.getByRole('status')
    await act(async () => { settle(WORK) })
    await screen.findByText('alpha')
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('keeps the browse failure visible and retries it', async () => {
    const listDirectory = vi.fn<FolderPickerProps['listDirectory']>()
      .mockRejectedValueOnce({ rpcError: { code: 'directory-unreadable', message: '无法读取这个目录' } })
      .mockResolvedValue(WORK)
    mount({ listDirectory })
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('无法读取这个目录')
    fireEvent.click(screen.getByRole('button', { name: '重试' }))
    await screen.findByText('alpha')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('falls back to the native chooser when the browse capability is absent', async () => {
    const listDirectory = vi.fn<FolderPickerProps['listDirectory']>(
      async () => { throw { rpcError: { code: 'directory-picker/unavailable' } } },
    )
    const picked = vi.fn<FolderPickerProps['pickDirectory']>(async () => '/work/beta')
    const { onPicked } = mount({ listDirectory, pickDirectory: picked })
    await waitFor(() => { expect(onPicked).toHaveBeenCalledWith('/work/beta') })
  })

  it('treats a cancelled chooser as a dismissal and reports a failed one', async () => {
    const unavailable = vi.fn<FolderPickerProps['listDirectory']>(
      async () => { throw { rpcError: { code: 'directory-picker/unavailable' } } },
    )
    const cancel = mount({ listDirectory: unavailable })
    await waitFor(() => { expect(cancel.onCancel).toHaveBeenCalledOnce() })
    cleanup()
    const pickDirectory = vi.fn<FolderPickerProps['pickDirectory']>(async () => {
      throw new Error('没有可用的文件夹选择器')
    })
    const failure = mount({ listDirectory: unavailable, pickDirectory })
    expect((await screen.findByRole('alert')).textContent).toContain('没有可用的文件夹选择器')
    expect(failure.onPicked).not.toHaveBeenCalled()
  })

  it('reports non-standard browse rejections without losing the dialog', async () => {
    const cases: readonly unknown[] = ['boom', null, {}, { rpcError: { message: '' } }]
    for (const rejection of cases) {
      const listDirectory = vi.fn<FolderPickerProps['listDirectory']>(async () => { throw rejection })
      const mounted = mount({ listDirectory })
      expect((await screen.findByRole('alert')).textContent).not.toBe('')
      mounted.view.unmount()
    }
  })

  it('ignores a level that settles after the dialog closed', async () => {
    let resolve!: (listing: DirectoryListing) => void
    const listDirectory = vi.fn<FolderPickerProps['listDirectory']>(() =>
      new Promise<DirectoryListing>((settle) => { resolve = settle }))
    const mounted = mount({ listDirectory })
    mounted.view.unmount()
    await act(async () => { resolve(WORK) })
    expect(mounted.onPicked).not.toHaveBeenCalled()

    const failing = vi.fn<FolderPickerProps['listDirectory']>(
      () => new Promise<DirectoryListing>((_, reject) => { reject(new Error('late failure')) }),
    )
    const closed = mount({ listDirectory: failing })
    closed.view.unmount()
    await act(async () => { await Promise.resolve() })
    expect(closed.onPicked).not.toHaveBeenCalled()
  })

  it('ignores a native chooser that settles after the dialog closed', async () => {
    const unavailable = vi.fn<FolderPickerProps['listDirectory']>(
      async () => { throw { rpcError: { code: 'directory-picker/unavailable' } } },
    )
    let pick!: (path: string | null) => void
    const pickDirectory = vi.fn<FolderPickerProps['pickDirectory']>(() =>
      new Promise<string | null>((resolve) => { pick = resolve }))
    const mounted = mount({ listDirectory: unavailable, pickDirectory })
    await waitFor(() => { expect(pickDirectory).toHaveBeenCalledOnce() })
    mounted.view.unmount()
    await act(async () => { pick('/work/beta') })
    expect(mounted.onPicked).not.toHaveBeenCalled()

    let rejectPick!: (reason: unknown) => void
    const failing = vi.fn<FolderPickerProps['pickDirectory']>(() =>
      new Promise<string | null>((_, reject) => { rejectPick = reject }))
    const closed = mount({ listDirectory: unavailable, pickDirectory: failing })
    await waitFor(() => { expect(failing).toHaveBeenCalledOnce() })
    closed.view.unmount()
    await act(async () => { rejectPick(new Error('late picker failure')) })
    expect(closed.onPicked).not.toHaveBeenCalled()
  })

  it('shows a plain rejection message and closes from the header', async () => {
    const listDirectory = vi.fn<FolderPickerProps['listDirectory']>(
      async () => { throw new Error('目录服务不可用') },
    )
    const { onCancel } = mount({ listDirectory })
    expect((await screen.findByRole('alert')).textContent).toContain('目录服务不可用')
    fireEvent.click(screen.getByRole('button', { name: '关闭' }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
