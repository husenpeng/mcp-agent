import { readFileSync } from 'node:fs'
import { load } from 'js-yaml'
import { expect, it } from 'vitest'

it('ships the release overlay: checkout context, embedding relay, and unpinned turn capture', () => {
  const text = readFileSync(new URL('../resources/release-profile.patch.yml', import.meta.url), 'utf8')
  expect(load(text)).toMatchObject([
    { id: 'harness-dev-context', config: { sourceContext: false } },
    { id: 'optional-embeddings-http', config: { model: 'text-embedding-v4', dimensions: 1024 } },
    // Turn capture must follow the session's own route; a pinned provider breaks
    // every capture once that provider is renamed or removed.
    { id: 'optional-tool-memory', config: { capture: true } },
  ])
})
