/** Host registration of the developer page's volatile recording switch. */

import { Context } from '@tomato/cordis'
import { expect, it, onTestFinished } from 'vitest'
import * as HostPlugin from '../src/index.ts'
import { liveConfig, omitsGeneratedPage } from '../../../settings/settings/tests/live-config.ts'
import { plainConfig } from '../../../settings/settings/src/schema.ts'
import { Config } from '../src/index.ts'

it('defaults the switch off and persists valid choices', async () => {
  const ctx = new Context()
  const configuration = await liveConfig(ctx, { Config, apply: HostPlugin.apply })
  onTestFinished(() => ctx.fiber.dispose())
  expect(plainConfig(configuration.fiber.effectiveConfig)).toEqual({ enabled: false })
  await configuration.update({ enabled: true })
  expect(plainConfig(configuration.fiber.effectiveConfig)).toEqual({ enabled: true })
  await expect(configuration.update({ enabled: 'yes' })).rejects.toThrow()
})

it('keeps its own instance off the generated Settings pages', () => omitsGeneratedPage(ctx => ctx.plugin(HostPlugin)))
