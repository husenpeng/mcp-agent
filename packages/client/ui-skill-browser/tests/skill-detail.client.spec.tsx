// @vitest-environment jsdom
/** Detail rendering states that the list body never mounts. */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { makeTranslate } from '@tomato/client-test-runtime'
import { SkillDetail } from '../src/client/SkillDetail.tsx'
import { zh } from '../src/client/locales.ts'

afterEach(() => { cleanup() })

describe('SkillDetail', () => {
  it('renders nothing while the tab shows its list', () => {
    const view = render(
      <SkillDetail
        state={{ status: 'idle' }}
        t={makeTranslate(zh)}
        onClose={() => {}}
        onRetry={() => {}}
        onSave={() => Promise.resolve(null)}
      />,
    )
    expect(view.container.innerHTML).toBe('')
  })
})
