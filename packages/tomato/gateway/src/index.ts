/**
 * Tomato local gateway: same-origin browser routes for auth_service sessions
 * and a fixed-table HTTP forwarder for company services.
 *
 * It mounts in the Web Host beside Connection's `/api` prefix. `/api/auth/*`
 * answers login and session state; `/api/services/<service>/*` forwards only
 * hosts configured in the service table. Host RPC, model requests, tool egress,
 * and telemetry stay outside this package.
 *
 * @module @tomato/gateway
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@tomato/cordis'
import type {} from '@tomato/client-connection'
import type {} from '@tomato/host-webserver'
import { AuthRoutes } from './auth-routes.ts'
import { AuthService } from './auth-service.ts'
import { Config } from './config.ts'
import { ServiceProxy } from './service-proxy.ts'

export { Config, type Config as GatewayConfig, type ServiceEntry, type UserIdInjection } from './config.ts'
export { SESSION_COOKIE } from './cookies.ts'
export { AuthRoutes } from './auth-routes.ts'
export { AuthService } from './auth-service.ts'
export { ServiceProxy } from './service-proxy.ts'
export type { LoginFailure, LoginAttempt, RedeemOutcome, SessionUser, SessionView, VerifyOutcome } from './types.ts'

/** Host services the route registration reads at load. */
export const inject = ['webServer', 'connection']

/** Answer a route whose method is not served. */
function methodNotAllowed(response: ServerResponse, allow: string): void {
  response.writeHead(405, { allow })
  response.end()
}

/** Reject one request through Connection's Host/Origin and browser authentication policy. */
function admit(ctx: Context, request: IncomingMessage): string | undefined {
  const admission = ctx.connection.admit(request)
  return 'rejection' in admission ? admission.rejection === 401 ? 'unauthorized' : 'forbidden' : undefined
}

/**
 * Register the gateway's same-origin routes.
 * @param ctx - Host context carrying Connection and the Web server.
 * @param config - validated gateway configuration.
 */
export function apply(ctx: Context, config: Config): void {
  const origin = new URL(ctx.webServer.getOrigin()).origin
  const secure = ctx.webServer.protocol === 'https:'
  const auth = new AuthService(config.authServiceUrl, config.verifyTimeoutMs, config.requestTimeoutMs)
  const routes = new AuthRoutes(config, auth, origin, secure)
  const proxy = new ServiceProxy(ctx, config, auth)
  ctx.effect(() => {
    const disposers = [
      ctx.webServer.register({
        kind: 'exact',
        path: '/api/auth/start',
        handler: (request, response) => {
          if (request.method !== 'GET' && request.method !== 'HEAD') { methodNotAllowed(response, 'GET, HEAD'); return }
          const rejected = admit(ctx, request)
          if (rejected !== undefined) { response.writeHead(rejected === 'unauthorized' ? 401 : 403); response.end(rejected); return }
          routes.start(request, response)
        },
      }),
      ctx.webServer.register({
        kind: 'exact',
        path: '/api/auth/callback',
        handler: async (request, response) => {
          if (request.method !== 'GET') { methodNotAllowed(response, 'GET'); return }
          await routes.callback(request, response)
        },
      }),
      ctx.webServer.register({
        kind: 'exact',
        path: '/api/auth/session',
        handler: async (request, response) => {
          if (request.method !== 'GET' && request.method !== 'HEAD') { methodNotAllowed(response, 'GET, HEAD'); return }
          const rejected = admit(ctx, request)
          if (rejected !== undefined) { response.writeHead(rejected === 'unauthorized' ? 401 : 403); response.end(rejected); return }
          await routes.session(request, response)
        },
      }),
      ctx.webServer.register({
        kind: 'exact',
        path: '/api/auth/logout',
        handler: async (request, response) => {
          if (request.method !== 'POST') { methodNotAllowed(response, 'POST'); return }
          const rejected = admit(ctx, request)
          if (rejected !== undefined) { response.writeHead(rejected === 'unauthorized' ? 401 : 403); response.end(rejected); return }
          await routes.logout(request, response)
        },
      }),
      ctx.webServer.register({
        kind: 'prefix',
        path: proxy.prefix,
        handler: async (request, response) => { await proxy.handle(request, response) },
      }),
    ]
    return () => { for (const dispose of disposers) dispose() }
  }, 'tomato-gateway: browser routes')
}
