/** Start-tunnel prompt: default keep-awake choice and outcome mapping. */

import { expect, it } from 'vitest'
import { en } from '../src/locale.ts'
import { tunnelStartChoice, tunnelStartPrompt } from '../src/remote-prompt.ts'

it('defaults keep-awake to checked and offers confirm before cancel', () => {
  const prompt = tunnelStartPrompt(en)
  expect(prompt.checkboxChecked).toBe(true)
  expect(prompt.checkboxLabel).toBe(en.tunnelStartCheckbox)
  expect(prompt.buttons).toEqual([en.tunnelStartConfirm, en.cancel])
  expect(prompt.defaultId).toBe(0)
  expect(prompt.cancelId).toBe(1)
})

it('maps the confirmed checkbox to the keep-awake choice', () => {
  expect(tunnelStartChoice({ response: 0, checkboxChecked: true })).toBe(true)
  expect(tunnelStartChoice({ response: 0, checkboxChecked: false })).toBe(false)
})

it('treats a dismissed prompt as cancelled', () => {
  expect(tunnelStartChoice({ response: 1, checkboxChecked: true })).toBeUndefined()
})
