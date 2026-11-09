/**
 * Probe one third-party Anthropic-compatible endpoint before moving a model
 * to a native route.
 *
 * Usage:
 *   pnpm exec tsx packages/llm/llm-pi-ai/scripts/probe-anthropic.ts \
 *     --base-url https://relay.example.com --model claude-opus-5-5 \
 *     --api-key-env RELAY_API_KEY
 *
 * The script prints the observed capabilities and exits 0 when the endpoint is
 * native and thinking works, 2 when it is native without thinking, and 1 when
 * `/v1/messages` does not answer. It never prints the credential.
 */

import { parseArgs } from 'node:util'
import { probeAnthropicEndpoint } from '../src/probe.ts'

const USAGE = `Probe an Anthropic-compatible endpoint.

  --base-url <url>        endpoint root; a trailing /v1 is folded away
  --model <id>            model id the endpoint serves
  --api-key-env <name>    environment variable holding the API key (preferred)
  --api-key <key>         API key literal (visible in shell history)
  --header <name:value>   extra request header; repeatable
  --no-cache              skip the prompt-cache probe
  --no-tools              skip the tool-use probe
  --timeout-ms <ms>      per-request timeout; defaults to 60000
  --json                  print the result as JSON
  -h, --help              show this help
`

interface CliValues {
  'base-url'?: string
  model?: string
  'api-key-env'?: string
  'api-key'?: string
  header?: string[]
  'no-cache'?: boolean
  'no-tools'?: boolean
  'timeout-ms'?: string
  json?: boolean
  help?: boolean
}

/** Parse repeated `name:value` headers. */
function parseHeaders(values: readonly string[] | undefined): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const raw of values ?? []) {
    const colon = raw.indexOf(':')
    if (colon <= 0) throw new Error(`--header expects name:value, got ${JSON.stringify(raw)}`)
    headers[raw.slice(0, colon).trim()] = raw.slice(colon + 1).trim()
  }
  return headers
}

/** Resolve the credential from the literal, the named environment, or neither. */
function resolveKey(values: CliValues): string | undefined {
  if (values['api-key'] !== undefined) return values['api-key']
  const name = values['api-key-env']
  if (name === undefined) return undefined
  const value = process.env[name]
  if (value === undefined || value.length === 0) {
    throw new Error(`environment variable ${name} is not set`)
  }
  return value
}

/** A human-readable state for one optional capability. */
function state(value: boolean | undefined): string {
  return value === undefined ? 'skipped' : value ? 'ok' : 'fail'
}

async function main(): Promise<void> {
  let values: CliValues
  try {
    ({ values } = parseArgs({
      options: {
        'base-url': { type: 'string' },
        model: { type: 'string' },
        'api-key-env': { type: 'string' },
        'api-key': { type: 'string' },
        header: { type: 'string', multiple: true },
        'no-cache': { type: 'boolean' },
        'no-tools': { type: 'boolean' },
        'timeout-ms': { type: 'string' },
        json: { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
      },
      allowPositionals: false,
    }) as { values: CliValues })
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : String(error))
    console.error(USAGE)
    process.exitCode = 1
    return
  }

  if (values.help === true) {
    console.log(USAGE)
    return
  }
  const baseURL = values['base-url']
  const model = values.model
  if (baseURL === undefined || baseURL.length === 0 || model === undefined || model.length === 0) {
    console.error('--base-url and --model are required')
    console.error(USAGE)
    process.exitCode = 1
    return
  }
  const timeoutMs = Number(values['timeout-ms'] ?? 60_000)
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    console.error('--timeout-ms must be a positive number')
    process.exitCode = 1
    return
  }

  let apiKey: string | undefined
  let headers: Record<string, string>
  try {
    apiKey = resolveKey(values)
    headers = parseHeaders(values.header)
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
    return
  }

  const result = await probeAnthropicEndpoint({
    baseURL,
    model,
    ...apiKey === undefined ? {} : { apiKey },
    ...Object.keys(headers).length === 0 ? {} : { headers },
    signal: AbortSignal.timeout(timeoutMs),
    checkCache: values['no-cache'] !== true,
    checkTools: values['no-tools'] !== true,
  })

  if (values.json === true) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    console.log(`model     ${model}`)
    console.log(`native    ${result.native ? 'ok' : `fail: ${result.error ?? 'unknown error'}`}`)
    console.log(`thinking  ${result.thinking ? 'ok' : 'fail'}${result.thinkingTokens === undefined ? '' : ` (${result.thinkingTokens} tokens)`}`)
    console.log(`cache     ${state(result.cache)}`)
    console.log(`tools     ${state(result.tools)}`)
  }

  process.exitCode = result.native ? (result.thinking ? 0 : 2) : 1
}

await main()
