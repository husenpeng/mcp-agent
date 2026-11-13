import { readFileSync } from 'node:fs'
import { load } from 'js-yaml'
import { expect, it } from 'vitest'

it('ships the release overlay: checkout context, embedding relay, and capture route', () => {
  const text = readFileSync(new URL('../resources/release-profile.patch.yml', import.meta.url), 'utf8')
  expect(load(text)).toMatchObject([
    { id: 'harness-dev-context', config: { sourceContext: false } },
    { id: 'optional-embeddings-http', config: { model: 'text-embedding-v4', dimensions: 1024 } },
    { id: 'optional-tool-memory', config: { capture: true, captureProvider: 'blue-opus', captureModel: 'claude-haiku-5-5' } },
  ])
})
