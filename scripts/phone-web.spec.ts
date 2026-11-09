import { describe, expect, it } from 'vitest'
import { parseOptions, tunnelHostFrom, UsageError, webArguments } from './phone-web.ts'

describe('web:phone options', () => {
  it('defaults to a loopback port and the PATH cloudflared', () => {
    expect(parseOptions([], {})).toEqual({ port: 43_299, bind: '127.0.0.1', binary: 'cloudflared' })
  })

  it('reads the override environment for the binary', () => {
    expect(parseOptions([], { CLOUDFLARED_BIN: '/opt/homebrew/bin/cloudflared' }).binary)
      .toBe('/opt/homebrew/bin/cloudflared')
  })

  it('accepts explicit flags', () => {
    expect(parseOptions(['--port', '8080', '--bind', '172.24.60.47', '--bin', '/usr/local/bin/cloudflared'], {}))
      .toEqual({ port: 8080, bind: '172.24.60.47', binary: '/usr/local/bin/cloudflared' })
  })

  it.each([
    ['a missing value', ['--port']],
    ['a non-numeric port', ['--port', 'http']],
    ['a port outside 1-65535', ['--port', '0']],
    ['a port above the range', ['--port', '70000']],
    ['an unknown flag', ['--serve']],
  ])('rejects %s', (_case, argv) => {
    expect(() => parseOptions(argv, {})).toThrow(UsageError)
  })
})

describe('tunnelHostFrom', () => {
  it('reads the hostname cloudflared prints in its banner', () => {
    expect(tunnelHostFrom('|  https://calm-herself-dev-philosophy.trycloudflare.com   |'))
      .toBe('calm-herself-dev-philosophy.trycloudflare.com')
  })

  it('also reads the quick-tunnel request line', () => {
    expect(tunnelHostFrom('INF Requesting new quick Tunnel on trycloudflare.com...')).toBeUndefined()
    expect(tunnelHostFrom('INF |  https://angel-publicly-dim-indicators.trycloudflare.com  |'))
      .toBe('angel-publicly-dim-indicators.trycloudflare.com')
  })

  it('ignores lines without a quick-tunnel URL', () => {
    expect(tunnelHostFrom('INF Registered tunnel connection connIndex=0 location=lax10')).toBeUndefined()
  })
})

describe('webArguments', () => {
  it('starts the Web profile behind the tunnel hostname', () => {
    const args = webArguments({ port: 43_299, bind: '127.0.0.1', binary: 'cloudflared' }, 'example.trycloudflare.com')
    expect(args).toContain('--profile')
    expect(args[args.indexOf('--profile') + 1]).toBe('web')
    expect(args[args.indexOf('--public-url') + 1]).toBe('https://example.trycloudflare.com/')
    expect(args[args.indexOf('--trusted-host') + 1]).toBe('example.trycloudflare.com')
    expect(args).toContain('--no-open')
    expect(args).not.toContain('127.0.0.1:43299')
  })

  it('trusts the bind authority on a non-loopback listener', () => {
    const args = webArguments({ port: 8080, bind: '172.24.60.47', binary: 'cloudflared' }, 'example.trycloudflare.com')
    expect(args.filter(entry => entry === '--trusted-host')).toHaveLength(2)
    expect(args).toContain('172.24.60.47:8080')
  })
})
