/** Chromium browser tools from the pinned Playwright MCP server. @module */

import { existsSync } from 'node:fs'
import { dirname, isAbsolute, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Context } from '@tomato/cordis'
import { BrowserMcpConfig, mountSessionMcp, validateBrowserMcpConfig } from '@tomato/experimental-browser-use-runtime/mcp'
import type {} from '@tomato/working-directory'

/** Cordis identity for the Playwright MCP browser provider. */
export const name = 'experimental-browser-use-playwright-mcp'

/** Services required for scoped MCP startup and prompt readiness checks. */
export const inject = ['browserUse', 'agents', 'tools', 'systemPrompt', 'workingDirectory']

/** Fixed Chromium launch or existing-browser attachment settings. */
export type Config = BrowserMcpConfig

/** Validate the launch or attachment configuration before activation. */
export const Config: typeof BrowserMcpConfig = BrowserMcpConfig

/** Model-facing refusal for an address the browser never loads. */
const NON_HTTP_REFUSAL = 'The browser tools open http(s) pages only. To read a local file or folder, use the file tools (read, glob, grep) instead; the browser does not load file:// addresses or local paths.'

/** Model-facing refusal for page code that reaches the browser host's filesystem. */
const LOCAL_FILE_CODE_REFUSAL = 'Browser page code cannot read files from this machine. Use the file tools (read, glob, grep) to inspect a local file or folder instead.'

/** Code shapes that reach the browser host filesystem through Playwright page code. */
const LOCAL_FILE_CODE = [
  /file:\/\//iu,
  /\brequire\s*\(\s*['"](?:node:)?fs['"]\s*\)/iu,
  /\bimport\s*\(\s*['"](?:node:)?fs['"]\s*\)/iu,
  /\bread(?:File|dir)(?:Sync)?\s*\(/iu,
]

/**
 * Read one string field from a parsed tool argument object.
 * @param args - parsed tool arguments.
 * @param field - property to read.
 * @returns the value when it is a string.
 */
function stringField(args: unknown, field: string): string | undefined {
  if (typeof args !== 'object' || args === null) return undefined
  const value = (args as Record<string, unknown>)[field]
  return typeof value === 'string' ? value : undefined
}

/**
 * Decide whether one browser call names an address or a local-file read that
 * the browser provider refuses to dispatch.
 * @param call - MCP tool name without its server prefix, and its parsed arguments.
 * @returns the model-facing refusal, or undefined when the call may run.
 */
export function denyLocalAddresses(call: { readonly name: string; readonly arguments: unknown }): string | undefined {
  const url = stringField(call.arguments, 'url')
  if (url !== undefined) {
    if (/^https?:\/\//iu.test(url)) return undefined
    return `${NON_HTTP_REFUSAL} Refused address: ${url}`
  }
  const code = stringField(call.arguments, 'code')
  if (code !== undefined && LOCAL_FILE_CODE.some(pattern => pattern.test(code))) return LOCAL_FILE_CODE_REFUSAL
  return undefined
}

/**
 * Expose Playwright's upstream tools in each live Session's scope.
 * The pinned npm server runs under the current Node executable; browser state is not persisted by TOMATO.
 * @param ctx - provider context supplying browser use, Agents, and tools.
 * @param config - validated browser choice and optional tool timeout.
 */
export function apply(ctx: Context, config: Config): void {
  validateBrowserMcpConfig(config)
  const cli = join(dirname(fileURLToPath(import.meta.resolve('@playwright/mcp/package.json'))), 'cli.js')
  // Upstream environment options can otherwise replace the configured browser
  // mode or import an unrelated profile. Empty values mean absent to its parser.
  const env = Object.fromEntries(Object.keys(process.env)
    .filter(key => key.toUpperCase().startsWith('PLAYWRIGHT_MCP_'))
    .map(key => [key, '']))
  const args = [cli, '--browser', 'chromium']
  if (config.mode === 'attach') {
    args.push('--cdp-endpoint', config.endpoint)
  } else {
    args.push('--isolated')
    if (config.headless) args.push('--headless')
    // Upstream's `chromium` selection resolves the full Chrome for Testing build, while Desktop ships only the
    // headless shell. The Host names that shell; an explicit provider path remains authoritative.
    if (config.storageState !== undefined) {
      if (!isAbsolute(config.storageState) || !existsSync(config.storageState)) {
        throw new Error(`browser storageState must be an existing absolute file: ${config.storageState}`)
      }
      args.push('--storage-state', config.storageState)
    }
    const inherited = process.env.PLAYWRIGHT_MCP_EXECUTABLE_PATH
    const executablePath = config.executablePath
      ?? (config.headless && inherited !== undefined && inherited !== '' ? inherited : undefined)
    if (executablePath !== undefined) args.push('--executable-path', executablePath)
  }
  mountSessionMcp(ctx, {
    name: 'playwright-mcp',
    deny: denyLocalAddresses,
    exclusive: config.mode === 'attach',
    command: process.execPath,
    args,
    env,
    ...config.toolCallTimeoutMs === undefined ? {} : { toolCallTimeoutMs: config.toolCallTimeoutMs },
  })
}
