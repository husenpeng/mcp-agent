// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ModelCatalog } from '@tomato/api-remotes/client'
import { ModelField } from '../src/client/ModelField.tsx'
import { robotModelCatalog } from '../src/client/model-catalog.ts'

afterEach(cleanup)

const HOST_CATALOG: ModelCatalog = {
  default: { provider: 'acme', model: 'acme-small' },
  routableProviders: ['acme', 'openrouter'],
  groups: [
    {
      id: 'acme',
      name: 'Acme Gateway',
      models: [
        { id: 'acme-small', name: 'Acme Small' },
        { id: 'acme-large', name: 'Acme Large', description: '128k context' },
        { id: 'acme-policy', name: 'Acme Policy', blockedReason: 'Deployment policy' },
      ],
    },
    { id: 'openrouter', name: 'OpenRouter', models: [{ id: 'qwen3', name: 'Qwen 3' }] },
  ],
  failures: [{ id: 'dead', name: 'Dead route', message: 'upstream refused' }],
}

const LABELS = {
  label: '模型',
  chooseLabel: '选择模型',
  defaultLabel: '使用部署默认模型',
}

describe('robot model catalog projection', () => {
  it('groups the host catalog and names the deployment default', () => {
    const catalog = robotModelCatalog(HOST_CATALOG)
    expect(catalog.defaultLabel).toBe('Acme Gateway / Acme Small')
    expect(catalog.partial).toBe(true)
    expect(catalog.groups).toEqual([
      {
        provider: 'acme',
        label: 'Acme Gateway',
        models: [
          { model: 'acme-small', label: 'Acme Small' },
          { model: 'acme-large', label: 'Acme Large', description: '128k context' },
          { model: 'acme-policy', label: 'Acme Policy', blockedReason: 'Deployment policy' },
        ],
      },
      { provider: 'openrouter', label: 'OpenRouter', models: [{ model: 'qwen3', label: 'Qwen 3' }] },
    ])
  })

  it('falls back to the raw route when the catalog no longer lists the default', () => {
    const catalog = robotModelCatalog({
      ...HOST_CATALOG,
      default: { provider: 'retired', model: 'gone' },
      failures: [],
    })
    expect(catalog.defaultLabel).toBe('retired / gone')
    expect(catalog.partial).toBe(false)
  })

  it('falls back to the raw route when the default provider is listed without that model', () => {
    const catalog = robotModelCatalog({
      ...HOST_CATALOG,
      default: { provider: 'openrouter', model: 'withdrawn' },
    })
    expect(catalog.defaultLabel).toBe('openrouter / withdrawn')
  })
})

describe('model field', () => {
  const catalog = robotModelCatalog(HOST_CATALOG)

  it('renders the deployment default and stores a picked route', () => {
    const onChange = vi.fn()
    render(<ModelField {...LABELS} groups={catalog.groups} value={undefined} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: '选择模型 模型' }))
    screen.getByRole('menuitem', { name: /Acme Small/ })
    fireEvent.click(screen.getByRole('menuitem', { name: /Acme Large/ }))
    expect(onChange).toHaveBeenCalledWith({ provider: 'acme', model: 'acme-large' })
  })

  it('clears the stored route through the deployment default row', () => {
    const onChange = vi.fn()
    render(
      <ModelField {...LABELS} groups={catalog.groups} value={{ provider: 'acme', model: 'acme-large' }} onChange={onChange} />,
    )
    expect(screen.getByRole('button', { name: '选择模型 模型' }).textContent).toContain('Acme Gateway / Acme Large')
    fireEvent.click(screen.getByRole('button', { name: '选择模型 模型' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /使用部署默认模型/ }))
    expect(onChange).toHaveBeenCalledWith(undefined)
  })

  it('shows a stored route the catalog no longer advertises and disables blocked rows', () => {
    const onChange = vi.fn()
    render(
      <ModelField
        {...LABELS}
        groups={catalog.groups}
        value={{ provider: 'retired', model: 'gone' }}
        onChange={onChange}
        hint="每次运行都使用这里选择的模型。"
        partialHint="部分模型列表加载失败。"
        issue="模型不可用"
      />,
    )
    const trigger = screen.getByRole('button', { name: '选择模型 模型' })
    expect(trigger.textContent).toContain('retired / gone')
    screen.getByText('每次运行都使用这里选择的模型。')
    screen.getByText('部分模型列表加载失败。')
    screen.getByText('模型不可用')
    fireEvent.click(trigger)
    const blocked = screen.getByRole('menuitem', { name: /Acme Policy/ })
    expect((blocked as HTMLButtonElement).disabled).toBe(true)
    expect(blocked.textContent).toContain('Deployment policy')
  })

  it('explains an empty catalog and closes on the trigger or Escape', () => {
    render(
      <ModelField
        {...LABELS}
        groups={[]}
        value={undefined}
        onChange={vi.fn()}
        emptyHint="当前没有可用的模型。"
      />,
    )
    screen.getByText('当前没有可用的模型。')
    fireEvent.click(screen.getByRole('button', { name: '选择模型 模型' }))
    screen.getByRole('menu')
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '选择模型 模型' }))
    fireEvent.click(screen.getByRole('button', { name: '选择模型 模型' }))
    expect(screen.queryByRole('menu')).toBeNull()
  })
})
