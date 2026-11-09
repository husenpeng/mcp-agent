/**
 * Company-gateway `WebFetchProvider` plugin. It contributes to the `ctx.web`
 * registry without owning the service, and reads the desktop auth session the
 * shell publishes to the Host. The signed-in session is the fetch credential,
 * so the registered `ready()` answers whether one is present; a step without a
 * session neither declares nor dispatches `web_fetch`.
 *
 * The gateway owns the fetch vendors and their credentials; this plugin only
 * needs the gateway origin and the current session. Base compositions keep
 * `fetchProvider: http` pinned until a deployment opts in, because the seam
 * refuses to choose between two usable fetch providers.
 *
 * @module @tomato/web-fetch-company
 */

import type { Context } from '@tomato/cordis'
import { launchEnvironmentOf } from '@tomato/launch-environment'
import z from '@tomato/schemastery'
import type {} from '@tomato/web'
import {
  COMPANY_DEFAULT_TIMEOUT_MS,
  CompanyFetchProvider,
} from './provider.ts'

export {
  COMPANY_DEFAULT_TIMEOUT_MS,
  COMPANY_FETCH_PATH,
  COMPANY_PROVIDER_ID,
  COMPANY_SESSION_COOKIE,
  COMPANY_URL_MAX_CHARS,
  CompanyFetchProvider,
  mapCompanyFetchResponse,
} from './provider.ts'
export type { CompanyErrorBody, CompanyFetchResponse } from './types.ts'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'web-fetch-company'

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
  /** End-to-end budget for one request, in milliseconds. Defaults to 50 seconds. */
  timeoutMs?: number
}

export const Config: z<Config> = z.object({
  baseURL: z.string(),
  timeoutMs: z.natural().min(100),
})

/** Register the company-gateway fetch provider with `ctx.web`. Its `ready()` answers
 * whether the signed-in Desktop session needed to authenticate a fetch is present. */
export function apply(ctx: Context, config: Config): void {
  const provider = new CompanyFetchProvider({
    baseURL: config.baseURL ?? launchEnvironmentOf(ctx).get(BASE_URL_ENV)?.value ?? '',
    timeoutMs: config.timeoutMs ?? COMPANY_DEFAULT_TIMEOUT_MS,
    sessionId: () => desktopSessionId(ctx),
  })
  ctx.web.registerFetchProvider({
    id: provider.id,
    available: () => provider.available(),
    // Configuration-only and route-independent: the same session authenticates
    // a fetch whatever model route the step uses.
    ready: () => Promise.resolve(desktopSessionId(ctx) !== undefined),
    fetch: (request, signal) => provider.fetch(request, signal),
  })
}

/**
 * Read the auth session the Desktop shell published to the Host.
 *
 * The service is optional: profiles without it (CLI, headless) leave the
 * provider not ready, so a model step neither declares nor dispatches the tool;
 * a fetch made outside a step fails with `WEB_PROVIDER_CREDENTIAL_MISSING`.
 *
 * @param ctx - the plugin context; the Host provides `desktopSession` on it.
 * @returns the current session id, or undefined when signed out or absent.
 */
function desktopSessionId(ctx: Context): string | undefined {
  const published = ctx.get('desktopSession')?.sessionId()
  return typeof published === 'string' && published !== '' ? published : undefined
}
