// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { makeTranslate } from '@tomato/client-test-runtime'
import { zh as commonZh } from '@tomato/client-locale/src/locales/zh.ts'
import { ResourcePicker, type ResourcePickerProps } from '../src/client/ResourcePicker.tsx'
import { zh } from '../src/client/locales.ts'

afterEach(cleanup)

const t = makeTranslate({ ...commonZh, ...zh }) as ResourcePickerProps['t']

const OPTIONS = [
  { value: 'alpha', label: 'Alpha', description: 'First skill', path: '/skills/alpha' },
  { value: 'beta', label: 'Beta', description: 'Second skill', path: '/skills/beta' },
  { value: 'gamma', label: 'Gamma' },
]

/** Stateful owner: the picker applies every toggle immediately. */
function Harness({ onChange, onClose = vi.fn(), ...overrides }: Partial<ResourcePickerProps> & {
  readonly onChange?: ResourcePickerProps['onChange']
  readonly onClose?: ResourcePickerProps['onClose']
}) {
  const [selected, setSelected] = useState<readonly string[]>(overrides.selected ?? [])
  return (
    <ResourcePicker
      t={t}
      open
      title="选择技能"
      kind="skill"
      options={OPTIONS}
      selected={selected}
      onChange={(next) => { setSelected(next); onChange?.(next) }}
      onClose={onClose}
      {...overrides}
    />
  )
}

describe('resource picker', () => {
  it('lists source folders and toggles selection immediately', () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const dialog = screen.getByRole('dialog', { name: '选择技能' })
    within(dialog).getByText('/skills/alpha')
    within(dialog).getByText('First skill')
    within(dialog).getByText('已选 0 项')
    fireEvent.click(within(dialog).getByRole('button', { name: /Alpha/ }))
    expect(onChange).toHaveBeenLastCalledWith(['alpha'])
    within(dialog).getByText('已选 1 项')
    fireEvent.click(within(dialog).getByRole('button', { name: /Alpha/ }))
    expect(onChange).toHaveBeenLastCalledWith([])
    within(dialog).getByText('已选 0 项')
    fireEvent.click(within(dialog).getByRole('button', { name: /Gamma/ }))
    expect(onChange).toHaveBeenLastCalledWith(['gamma'])
  })

  it('filters by label, description, and folder path', () => {
    render(<Harness />)
    const dialog = screen.getByRole('dialog', { name: '选择技能' })
    fireEvent.change(within(dialog).getByLabelText('搜索'), { target: { value: 'beta' } })
    within(dialog).getByText('Beta')
    expect(within(dialog).queryByText('Alpha')).toBeNull()
    fireEvent.change(within(dialog).getByLabelText('搜索'), { target: { value: '/skills/alpha' } })
    within(dialog).getByText('Alpha')
    expect(within(dialog).queryByText('Beta')).toBeNull()
    fireEvent.change(within(dialog).getByLabelText('搜索'), { target: { value: 'nothing' } })
    within(dialog).getByText('没有可选项。')
  })

  it('reports selection order and closes from the footer', () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    const dialog = screen.getByRole('dialog', { name: '选择技能' })
    fireEvent.click(within(dialog).getByRole('button', { name: /Beta/ }))
    fireEvent.click(within(dialog).getByRole('button', { name: /Alpha/ }))
    within(dialog).getByText('已选 2 项')
    fireEvent.click(within(dialog).getByRole('button', { name: '完成' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows the browse action only when the owner supplies it', () => {
    const onBrowse = vi.fn()
    const view = render(<Harness />)
    expect(screen.queryByRole('button', { name: '浏览文件夹…' })).toBeNull()
    view.unmount()
    render(<Harness onBrowse={onBrowse} />)
    fireEvent.click(screen.getByRole('button', { name: '浏览文件夹…' }))
    expect(onBrowse).toHaveBeenCalledOnce()
  })

  it('uses the supplied empty hint and closes from the header', () => {
    const onClose = vi.fn()
    render(<Harness options={[]} emptyHint="还没有可用的技能" onClose={onClose} />)
    const dialog = screen.getByRole('dialog', { name: '选择技能' })
    within(dialog).getByText('还没有可用的技能')
    fireEvent.click(within(dialog).getByRole('button', { name: '关闭' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
