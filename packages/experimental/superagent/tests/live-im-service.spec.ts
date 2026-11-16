/**
 * The bot gateway against a running im_service. This asks a live server, so it
 * skips when nothing answers on the deployment port: the unit suite must stay
 * runnable on a machine with no services.
 */
import { describe, expect, it } from 'vitest'
import { BotGatewayError, HttpBotGateway } from '@tomato/superagent'

const BASE = 'http://127.0.0.1:8013'

/** Whether a bot service answers on the deployment port. */
async function reachable(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE}/api/v1/health`, { signal: AbortSignal.timeout(750) })
    return response.ok
  } catch {
    // Nothing listens: the live contract cannot be checked on this machine.
    return false
  }
}

const live = await reachable()

describe.skipIf(!live)('live im_service', () => {
  it('reads a cursor page with the acting user and returns the envelope payload', async () => {
    const gateway = new HttpBotGateway({ baseUrl: BASE, userId: 'tomato-superagent-probe' })
    const page = await gateway.events(0, 5)
    expect(page.nextCursor).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(page.items)).toBe(true)
    for (const event of page.items) {
      expect(typeof event.cursor).toBe('number')
      expect(typeof event.chatId).toBe('string')
      expect(typeof event.messageId).toBe('string')
    }
  })

  it('refuses a reply into a conversation the service never saw', async () => {
    const gateway = new HttpBotGateway({ baseUrl: BASE, userId: 'tomato-superagent-probe' })
    await expect(gateway.reply('oc_never_seen', 'om_never_seen', 'probe'))
      .rejects.toThrow(BotGatewayError)
  })

  it('answers a thread read with the documented source marker', async () => {
    const gateway = new HttpBotGateway({ baseUrl: BASE, userId: 'tomato-superagent-probe' })
    const thread = await gateway.thread('oc_never_seen', 'om_never_seen')
    expect(['feishu', 'log']).toContain(thread.source)
    expect(Array.isArray(thread.items)).toBe(true)
  })
})
