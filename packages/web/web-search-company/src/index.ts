/**
 * Company-gateway `WebSearchProvider` plugin. It contributes to the `ctx.web`
 * registry without owning the service, and reads the desktop auth session the
 * shell publishes to the Host. The signed-in session is the search credential,
 * so the registered `ready()` answers whether one is present; a step without a
 * session neither declares nor dispatches `web_search`.
 *
 * The gateway owns the search vendor and its credential; this plugin only needs
 * the gateway origin and the current session.
 *
 * @module @tomato/web-search-company
 */

import type { Context } from '@tomato/cordis'
import { launchEnvironmentOf } from '@tomato/launch-environment'
import z from '@tomato/schemastery'
import type {} from '@tomato/web'
import {
  COMPANY_DEFAULT_MAX_CHARS,
  COMPANY_DEFAULT_MAX_CHARS_PER_RESULT,
  COMPANY_DEFAULT_TIMEOUT_MS,
  COMPANY_MAX_CHARS,
  COMPANY_MAX_CHARS_PER_RESULT,
  COMPANY_MAX_RESULTS,
  CompanySearchProvider,
} from './provider.ts'

export {
  COMPANY_DEFAULT_MAX_CHARS,
  COMPANY_DEFAULT_MAX_CHARS_PER_RESULT,
  COMPANY_DEFAULT_TIMEOUT_MS,
  COMPANY_MAX_CHARS,
  COMPANY_MAX_CHARS_PER_RESULT,
  COMPANY_MAX_RESULTS,
  COMPANY_PROVIDER_ID,
  COMPANY_QUERY_MAX_CHARS,
  COMPANY_SEARCH_PATH,
  COMPANY_SESSION_COOKIE,
  CompanySearchProvider,
} from './provider.ts'
export type { CompanySearchProviderOptions } from './provider.ts'
export { mapCompanyResponse, mapCompanyResult } from './provider.ts'
export type { CompanyErrorBody, CompanySearchRequest, CompanySearchResponse, CompanySearchResult } from './types.ts'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'web-search-company'

/** The web seam this provider registers into. */
export const inject = ['web']

/** Environment variable naming the gateway origin when the composition omits `baseURL`. */
const BASE_URL_ENV = 'TOMATO_SEARCH_GATEWAY_URL'

/** The auth session the Desktop shell publishes to the Host. */
export interface DesktopSession {
  /**
   * Read the current auth session.
   * @returns the auth_service session id, or undefined after sign-out.
   */
  sessionId(): string | undefined
}

declare module '@tomato/cordis' {
  interface Context {
    /**
     * Session published by the Desktop shell; absent in profiles without a
     * signed-in shell, which leaves this provider unavailable.
     */
    readonly desktopSession?: DesktopSession
  }
}

/** Plugin config (all optional — `apply` fills env-var and constant defaults). */
export interface Config {
  /** Gateway origin, such as `https://test.tomatoai.vip`. Falls back to `$TOMATO_SEARCH_GATEWAY_URL`. */
  baseURL?: string
  /** End-to-end budget for one request, in milliseconds. Defaults to 45 seconds. */
  timeoutMs?: number
  /** Default result bound when a request carries no `maxResults`. Omitted = gateway default. */
  maxResults?: number
  /** Per-result excerpt budget forwarded to the gateway, in characters. Defaults to 500. */
  maxCharsPerResult?: number
  /** Total excerpt budget forwarded to the gateway, in characters. Defaults to 3000. */
  maxChars?: number
}

export const Config: z<Config> = z.object({
  baseURL: z.string(),
  timeoutMs: z.natural().min(100),
  maxResults: z.natural().min(1).max(COMPANY_MAX_RESULTS),
  maxCharsPerResult: z.natural().min(1).max(COMPANY_MAX_CHARS_PER_RESULT),
  maxChars: z.natural().min(1).max(COMPANY_MAX_CHARS),
})

/** Register the company-gateway search provider with `ctx.web`. Its `ready()` answers whether
 * the signed-in Desktop session needed to authenticate a search is present. */
export function apply(ctx: Context, config: Config): void {
  const provider = new CompanySearchProvider({
    baseURL: config.baseURL ?? launchEnvironmentOf(ctx).get(BASE_URL_ENV)?.value ?? '',
    timeoutMs: config.timeoutMs ?? COMPANY_DEFAULT_TIMEOUT_MS,
    sessionId: () => desktopSessionId(ctx),
    maxCharsPerResult: config.maxCharsPerResult ?? COMPANY_DEFAULT_MAX_CHARS_PER_RESULT,
    maxChars: config.maxChars ?? COMPANY_DEFAULT_MAX_CHARS,
    ...config.maxResults === undefined ? {} : { maxResults: config.maxResults },
  })
  ctx.web.registerSearchProvider({
    id: provider.id,
    available: () => provider.available(),
    // Configuration-only and route-independent: the same session authenticates
    // a search whatever model route the step uses.
    ready: () => Promise.resolve(desktopSessionId(ctx) !== undefined),
    search: (request, signal) => provider.search(request, signal),
  })
}

/**
 * Read the auth session the Desktop shell published to the Host.
 *
 * The service is optional: profiles without it (CLI, headless) leave the
 * provider not ready, so a model step neither declares nor dispatches the tool;
 * a search made outside a step fails with `WEB_PROVIDER_CREDENTIAL_MISSING`.
 *
 * @param ctx - the plugin context; the Host provides `desktopSession` on it.
 * @returns the current session id, or undefined when signed out or absent.
 */
function desktopSessionId(ctx: Context): string | undefined {
  const published = ctx.get('desktopSession')?.sessionId()
  return typeof published === 'string' && published !== '' ? published : undefined
}
