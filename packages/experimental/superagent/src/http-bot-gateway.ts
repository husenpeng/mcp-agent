/**
 * Bot service over HTTP: the im_service bot API, addressed with the verified
 * user the deployment acts as. Validation happens here because a response body
 * is a wire value, not a typed same-process one.
 */
import type { BotEvent, BotEventsPage, BotGateway, BotThread } from './source.ts'

/** Failure the gateway raises when the bot service refuses or answers badly. */
export class BotGatewayError extends Error {
  /**
   * @param message - what the service reported.
   * @param status - HTTP status, or `0` when the request never completed.
   */
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'BotGatewayError'
  }
}

/** Where the bot service lives and who the caller is. */
export interface BotGatewayConfig {
  /** Base URL of the service, without a trailing slash. */
  readonly baseUrl: string
  /** Verified user id the service authorizes the call for. */
  readonly userId: string
  /** Transport override, for a deployment with its own fetch. */
  readonly fetch?: typeof globalThis.fetch
}

/** One response envelope the bot service returns. */
interface Envelope<T> {
  readonly code: number
  readonly message: string
  readonly data: T
}

/**
 * Read one envelope, rejecting a body that is not the documented shape.
 * @param response - raw fetch response.
 * @returns the payload the envelope carried.
 * @throws {@link BotGatewayError} for a non-2xx status or a body without a payload.
 */
async function unwrap<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new BotGatewayError(`bot service answered ${response.status}`, response.status)
  }
  const body: unknown = await response.json()
  if (typeof body !== 'object' || body === null || !('data' in body)) {
    throw new BotGatewayError('bot service answered without a payload', response.status)
  }
  return (body as Envelope<T>).data
}

/** The im_service bot API as a {@link BotGateway}. */
export class HttpBotGateway implements BotGateway {
  readonly #config: BotGatewayConfig

  /**
   * @param config - base URL, acting user, and optional transport.
   */
  constructor(config: BotGatewayConfig) {
    this.#config = config
  }

  async events(cursor: number, limit: number): Promise<BotEventsPage> {
    const data = await this.#call<BotEventsPage>(`/api/v1/bot/events?cursor=${cursor}&limit=${limit}`, 'GET')
    return data
  }

  async thread(chatId: string, messageId: string): Promise<BotThread> {
    return await this.#call<BotThread>(
      `/api/v1/bot/threads/${encodeURIComponent(chatId)}/${encodeURIComponent(messageId)}`,
      'GET',
    )
  }

  async reply(chatId: string, messageId: string, text: string): Promise<{ readonly messageId: string }> {
    return await this.#call<{ messageId: string }>('/api/v1/bot/messages', 'POST', { chatId, messageId, text })
  }

  async #call<T>(path: string, method: 'GET' | 'POST', body?: Record<string, string>): Promise<T> {
    const response = await this.#fetch(`${this.#config.baseUrl}${path}`, {
      method,
      headers: {
        'X-User-Id': this.#config.userId,
        ...method === 'POST' ? { 'content-type': 'application/json' } : {},
      },
      ...body === undefined ? {} : { body: JSON.stringify(body) },
    })
    return await unwrap<T>(response)
  }

  #fetch(url: string, init: RequestInit): Promise<Response> {
    const transport = this.#config.fetch ?? globalThis.fetch
    return transport(url, init)
  }
}

/** One event as the service sends it, for a caller that parses a page itself. */
export type WireEvent = BotEvent
