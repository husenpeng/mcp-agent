/** Boots a real headless composition with the marketing overlay and records every MCP tool it published. */
import { writeFile } from 'node:fs/promises'
import { bootProductionProfile } from '../../../../test-support/loader-smoke/tests/fixtures/production-profile.ts'

const configPath = process.argv[2]
if (configPath === undefined) throw new Error('marketing composition fixture requires an overlay')
const ctx = await bootProductionProfile({ binName: 'marketing-composition', profile: 'headless', overlayPaths: [configPath] })
try {
  const definitions = ctx.get('tools')?.definitions() ?? []
  const names = definitions.map(definition => definition.name).filter(name => name.startsWith('mcp__'))
  await writeFile('marketing-tools.json', JSON.stringify(names))
} finally {
  await ctx.fiber.dispose()
}
