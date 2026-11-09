// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ChoiceRow, TagField } from '../src/client/SpecFields.tsx'

afterEach(cleanup)

describe('tag field', () => {
  it('renders selected chips, removes one, and adds a typed value on Enter', () => {
    const onChange = vi.fn()
    render(
      <TagField
        label="技能"
        values={['alpha']}
        onChange={onChange}
        options={[{ value: 'alpha', label: 'Alpha', path: '/skills/alpha' }]}
        addLabel="添加"
        removeLabel="移除"
        optionsLabel="选择"
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '移除 alpha' }))
    expect(onChange).toHaveBeenCalledWith([])
    const input = screen.getByRole('textbox', { name: '技能' })
    fireEvent.change(input, { target: { value: 'beta' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenLastCalledWith(['alpha', 'beta'])
    fireEvent.keyDown(input, { key: 'a' })
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('adds through the add button and opens the owner picker when supplied', () => {
    const onChange = vi.fn()
    const onChoose = vi.fn()
    render(
      <TagField
        label="技能"
        values={[]}
        onChange={onChange}
        options={[{ value: 'alpha', label: 'Alpha' }]}
        addLabel="添加"
        removeLabel="移除"
        optionsLabel="选择"
        onChoose={onChoose}
      />,
    )
    fireEvent.change(screen.getByRole('textbox', { name: '技能' }), { target: { value: ' gamma ' } })
    fireEvent.click(screen.getByRole('button', { name: '添加' }))
    expect(onChange).toHaveBeenCalledWith(['gamma'])
    fireEvent.click(screen.getByRole('button', { name: '选择 技能' }))
    expect(onChoose).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).toBeNull()
  })
})

describe('choice row', () => {
  it('renders the options and reports the picked one', () => {
    const onChange = vi.fn()
    render(
      <ChoiceRow
        label="可见性"
        value="private"
        options={[
          { value: 'private', label: '私有' },
          { value: 'team', label: '团队' },
        ]}
        onChange={onChange}
        hint="可见范围"
      />,
    )
    screen.getByText('可见范围')
    fireEvent.click(screen.getByRole('button', { name: '团队' }))
    expect(onChange).toHaveBeenCalledWith('team')
  })
})
