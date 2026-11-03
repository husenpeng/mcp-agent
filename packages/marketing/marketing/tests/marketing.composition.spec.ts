/**
 * Real-composition smoke: a headless profile boots the marketing row through
 * the Loader and publishes no MCP tool while every provider stays off.
 */

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'
import { LOADER_SMOKE_TEST_TIMEOUT_MS, runLoaderSmoke } from '@tomato/loader-smoke'

it('boots a profile with the marketing row and publishes no MCP tool by default', async () => {
  let names: string[] = []
  const driver = resolve(import.meta.dirname, 'fixtures/marketing-driver.ts')
  await runLoaderSmoke({
    label: 'marketing composition',
    tempDirPrefix: 'marketing-',
    binScript: driver,
    libBinScript: driver,
    configPath: resolve(import.meta.dirname, 'fixtures/marketing.patch.yml'),
    tsconfigPath: resolve(import.meta.dirname, '../../../../tsconfig.base.json'),
    inspect: async (cwd) => {
      const parsed: unknown = JSON.parse(await readFile(resolve(cwd, 'marketing-tools.json'), 'utf8'))
      names = Array.isArray(parsed) ? parsed.filter((name): name is string => typeof name === 'string') : []
    },
  })
  expect(names).toEqual([])
}, LOADER_SMOKE_TEST_TIMEOUT_MS)
