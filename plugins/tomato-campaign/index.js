// tomato-campaign host half: the same-origin `/api/clientweb` proxy that carries
// the browser's auth_service session to the company BFF, the model-facing tools
// over campaigns / rosters / Feishu / outreach, and one embedded skill.
//
// The browser half lives in src/client and is discovered through the package's
// `tomato.client` manifest and `./client` export.
import { defineTool } from '@tomato/tools'
import { resolveConfig } from './src/host/config.js'
import { createBff } from './src/host/bff.js'
import { createProxy } from './src/host/proxy.js'
import { createTools } from './src/host/tools.js'
import { SKILL } from './src/host/skill.js'

export const name = 'tomato-campaign'

/** Required services: the HTTP carrier and the model-facing tool registry. */
export const inject = ['webServer']

/**
 * Mount the proxy, the tools, and the skill.
 * @param ctx - the Cordis host context.
 * @param rawConfig - plugin config; {@link resolveConfig} fills every default.
 */
export function apply(ctx, rawConfig = {}) {
  const config = resolveConfig(rawConfig)
  /** Latest session a proxied browser request presented; tools read it. */
  const state = { sessionId: undefined }
  let origin
  try {
    origin = ctx.webServer.getOrigin()
  } catch {
    origin = undefined
  }

  const bff = createBff({ baseUrl: config.baseUrl, timeoutMs: config.timeoutMs })
  const handler = createProxy({ config, state, origin })
  ctx.effect(
    () => ctx.webServer.register({ kind: 'prefix', path: config.proxyPath, handler }),
    `tomato-campaign: ${config.proxyPath}`,
  )

  // The tool and skill services activate after this row in some compositions;
  // `ctx.inject` waits for each instead of reading a possibly absent service.
  if (config.tools) {
    ctx.inject(['tools'], (child) => {
      const call = (path, options = {}) => bff.call(path, { ...options, session: state.sessionId })
      for (const tool of createTools({ config, call, defineTool })) {
        child.effect(() => child.tools.register(tool), `tomato-campaign: tool ${tool.name}`)
      }
    })
  }

  if (config.skill) {
    ctx.inject(['skills'], (child) => {
      child.effect(() => child.skills.register(SKILL), 'tomato-campaign: skill campaign-outreach')
    })
  }
}