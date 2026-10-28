/** Shared copy adapters: every source bucket and the failure line. */
import { describe, expect, it } from 'vitest'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { failureLine, sourceLabel } from '../src/client/format.ts'
import { zh } from '../src/client/locales.ts'
import { failure } from './scripted-remote.client.ts'

const t = makeTranslate(zh)

describe('sourceLabel', () => {
  it('maps every known source bucket and leaves unknown labels to the neutral bucket', () => {
    expect(sourceLabel(t, 'user-dsh')).toBe(zh['source.personal'])
    expect(sourceLabel(t, 'user-agents')).toBe(zh['source.personal'])
    expect(sourceLabel(t, 'project-dsh')).toBe(zh['source.project'])
    expect(sourceLabel(t, 'project-agents')).toBe(zh['source.project'])
    expect(sourceLabel(t, 'custom')).toBe(zh['source.custom'])
    expect(sourceLabel(t, 'bundled')).toBe(zh['source.bundled'])
    expect(sourceLabel(t, 'runtime')).toBe(zh['source.other'])
  })
})

describe('failureLine', () => {
  it('carries the Remote message into the localized failure line', () => {
    expect(failureLine(t, failure('gateway/internal', 'offline'))).toBe(
      zh['error.unavailable'].replace('{message}', 'offline'),
    )
  })
})
