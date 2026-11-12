/**
 * Probe one third-party OpenAI-style endpoint and print the route
 * configuration its answers support.
 *
 * Usage:
 *   pnpm exec tsx packages/llm/llm-pi-ai/scripts/probe-endpoint.ts \
 *     --base-url https://relay.example.com/v1 --model gpt-6.1-sol \
 *     --provider blueai --api-key-env RELAY_API_KEY
 *
 * Both protocols are probed: Chat Completions because it is the path a route
 * speaks by default, and Responses because an endpoint that refuses function
 * tools beside a reasoning effort there usually names it as the alternative.
 * The script never prints the credential. Exit code is 0 when at least one
 * protocol answered, 1 otherwise.
 */

import { parseArgs } from 'node:util'
import { probeOpenAiEndpoint, renderRouteSnippet } from '../src/openai-probe.ts'
import type { OpenAiProbe, OpenAiProbeProtocol } from '../src/openai-probe.ts'

const USAGE = `Probe an OpenAI-style endpoint and print route configuration.

  --base-url <url>        endpoint root; a trailing /v1 is accepted either way
  --model <id>            model id the endpoint serves
  --provider <name>       route key to name in the emitted YAML; defaults to "probe"
  --api-key-env <name>    environment variable holding the API key (preferred)
  --api-key <key>         API key literal (visible in shell history)
  --header <name:value>   extra request header; repeatable
  --effort <level>        reasoning effort the tool pair probe sends; defaults to high
  --no-cache              skip the prompt-cache probe
  --no-tools              skip the tool probes
  --timeout-ms <ms>      per-request timeout; defaults to 60000
  --json                  print the raw results as JSON
  -h, --help              show this help
`

interface CliValues {
  'base-url'?: string
  model?: string
  provider?: string
  'api-key-env'?: string
  'api-key'?: string
  header?: string[]
  effort?: string
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

/** One line per observation, with the rejection detail a failure needs. */
function describe(probe: OpenAiProbe): string[] {
  const lines = [`${probe.api.padEnd(20)} ${probe.reachable ? 'ok' : `fail: ${probe.error ?? 'unknown error'}`}`]
  if (!probe.reachable) return lines
  lines.push(`  tools              ${state(probe.tools)}`)
  lines.push(`  tools + reasoning  ${state(probe.toolsWithReasoning)}${
    probe.toolsWithReasoningError === undefined ? '' : ` (${probe.toolsWithReasoningError})`}`)
  if (probe.cacheReadTokens !== undefined) {
    lines.push(`  cache read         ${probe.cacheReadTokens} tokens${probe.cacheField === undefined ? '' : ` via ${probe.cacheField}`}`)
  }
  if (probe.cacheKeyAccepted !== undefined) {
    lines.push(`  prompt_cache_key   ${probe.cacheKeyAccepted ? 'ok' : 'refused'}`)
  }
  return lines
}

async function main(): Promise<void> {
  let values: CliValues
  try {
    ({ values } = parseArgs({
      options: {
        'base-url': { type: 'string' },
        model: { type: 'string' },
        provider: { type: 'string' },
        'api-key-env': { type: 'string' },
        'api-key': { type: 'string' },
        header: { type: 'string', multiple: true },
        effort: { type: 'string' },
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

  const protocols: readonly OpenAiProbeProtocol[] = ['openai-completions', 'openai-responses']
  const probes: OpenAiProbe[] = []
  for (const api of protocols) {
    probes.push(await probeOpenAiEndpoint({
      baseURL,
      model,
      api,
      ...apiKey === undefined ? {} : { apiKey },
      ...Object.keys(headers).length === 0 ? {} : { headers },
      ...values.effort === undefined ? {} : { effort: values.effort },
      signal: AbortSignal.timeout(timeoutMs),
      checkCache: values['no-cache'] !== true,
      checkTools: values['no-tools'] !== true,
    }))
  }

  if (values.json === true) {
    console.log(JSON.stringify(probes, null, 2))
  } else {
    for (const probe of probes) console.log(describe(probe).join('\n'))
    console.log('\n# ---- route configuration ----')
    console.log(renderRouteSnippet(values.provider ?? 'probe', model, probes))
  }

  process.exitCode = probes.some(probe => probe.reachable) ? 0 : 1
}

await main()
