/** The on-demand patch mounts the shared service before the fixed Playwright launch provider. */
import { readFile } from 'node:fs/promises'
import { Context } from '@deepseek-ai/cordis'
import Loader, { type EntryOptions } from '@deepseek-ai/cordis-plugin-loader'
import { entryListSchema } from '@deepseek-ai/cordis-plugin-include'
import { load } from 'js-yaml'
import { expect, it, vi } from 'vitest'

const SERVICE = '@deepseek-ai/dsh-browser-use'
const PROVIDER = '@deepseek-ai/dsh-experimental-browser-use-playwright-mcp'

async function patchRows(): Promise<EntryOptions[]> {
  const patch = load(await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8'), {
    schema: entryListSchema,
  }) as { insert: EntryOptions[] }[]
  return patch[0]!.insert
}

it('fixes an isolated headless launch and mounts the service before the provider', async () => {
  const rows = await patchRows()
  expect(rows.map(row => row.name)).toEqual([SERVICE, PROVIDER])
  expect(rows[1]!.config).toEqual({ mode: 'launch', headless: true })
})

it('loads both rows through the Loader in patch order', async () => {
  const ctx = new Context()
  await ctx.plugin(Loader)
  if (!ctx.loader.internal) throw new Error('Loader module importer is unavailable')
  const imported = vi.spyOn(ctx.loader.internal, 'import').mockImplementation(async (name: string) => ({ name, apply: () => {} }))
  try {
    for (const row of await patchRows()) await ctx.loader.create(row)
    await ctx.loader.await()
    expect(imported.mock.calls.map(call => call[0])).toEqual([SERVICE, PROVIDER])
  } finally {
    await ctx.fiber.dispose()
    imported.mockRestore()
  }
})
