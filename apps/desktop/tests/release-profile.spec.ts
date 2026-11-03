import { readFileSync } from 'node:fs'
import { load } from 'js-yaml'
import { expect, it } from 'vitest'

it('ships one release overlay entry that drops the implementation-checkout context', () => {
  const text = readFileSync(new URL('../resources/release-profile.patch.yml', import.meta.url), 'utf8')
  expect(load(text)).toEqual([{ id: 'harness-dev-context', config: { sourceContext: false } }])
})
