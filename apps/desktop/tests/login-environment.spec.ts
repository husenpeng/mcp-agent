/** Login and IM origins sealed by packaging and overridable at launch. */
import { describe, expect, it } from 'vitest'
import { resolveLoginEnvironment, withLoginEnvironment } from '../src/login-environment.ts'

const MANIFEST = {
  tomatoAuthServiceUrl: 'https://auth.example.com',
  tomatoTomatoWebUrl: 'https://app.example.com',
  tomatoImServiceUrl: 'http://im.example.com:8013',
}

describe('resolveLoginEnvironment', () => {
  it('reads the origins sealed into the packaged manifest', () => {
    expect(resolveLoginEnvironment(MANIFEST, {})).toEqual({
      authServiceUrl: 'https://auth.example.com',
      tomatoWebUrl: 'https://app.example.com',
      imServiceUrl: 'http://im.example.com:8013',
    })
  })

  it('lets explicit launch variables override each packaged origin', () => {
    expect(resolveLoginEnvironment(MANIFEST, {
      AUTH_SERVICE_URL: 'http://127.0.0.1:8003/',
      TOMATO_WEB_URL: 'http://localhost:3000',
      TOMATO_IM_SERVICE_URL: 'http://127.0.0.1:8013/',
    })).toEqual({
      authServiceUrl: 'http://127.0.0.1:8003',
      tomatoWebUrl: 'http://localhost:3000',
      imServiceUrl: 'http://127.0.0.1:8013',
    })
  })

  it('falls back to the manifest for an empty launch variable', () => {
    expect(resolveLoginEnvironment(MANIFEST, { AUTH_SERVICE_URL: ' ' })).toEqual({
      authServiceUrl: 'https://auth.example.com',
      tomatoWebUrl: 'https://app.example.com',
      imServiceUrl: 'http://im.example.com:8013',
    })
  })

  it('leaves every origin empty when neither source configures them', () => {
    expect(resolveLoginEnvironment({}, {})).toEqual({ authServiceUrl: '', tomatoWebUrl: '', imServiceUrl: '' })
  })

  it('rejects malformed origins and manifests', () => {
    expect(() => resolveLoginEnvironment({ tomatoAuthServiceUrl: 'ftp://auth.example.com' }, {}))
      .toThrow(/tomatoAuthServiceUrl/)
    expect(() => resolveLoginEnvironment({ tomatoTomatoWebUrl: 'https://app.example.com/ui' }, {}))
      .toThrow(/tomatoTomatoWebUrl/)
    expect(() => resolveLoginEnvironment({ tomatoImServiceUrl: 'http://im.example.com/mcp/im' }, {}))
      .toThrow(/tomatoImServiceUrl/)
    expect(() => resolveLoginEnvironment({}, { AUTH_SERVICE_URL: 'not a url' })).toThrow(/AUTH_SERVICE_URL/)
    expect(() => resolveLoginEnvironment({}, { TOMATO_WEB_URL: 'https://user:secret@app.example.com' }))
      .toThrow(/TOMATO_WEB_URL/)
    expect(() => resolveLoginEnvironment(null, {})).toThrow(/invalid application manifest/)
  })

  it('projects the resolved origins into the Host environment', () => {
    const env = withLoginEnvironment({ PATH: '/bin', AUTH_SERVICE_URL: 'stale.example.com' }, {
      authServiceUrl: 'https://auth.example.com',
      tomatoWebUrl: 'https://app.example.com',
      imServiceUrl: 'http://im.example.com:8013',
    })
    expect(env).toEqual({
      PATH: '/bin',
      AUTH_SERVICE_URL: 'https://auth.example.com',
      TOMATO_WEB_URL: 'https://app.example.com',
      TOMATO_SEARCH_GATEWAY_URL: 'https://app.example.com',
      TOMATO_IM_SERVICE_URL: 'http://im.example.com:8013',
    })
  })

  it('lets an explicit search gateway override the BFF default', () => {
    const env = withLoginEnvironment({ TOMATO_SEARCH_GATEWAY_URL: 'https://search.example.com' }, {
      authServiceUrl: '',
      tomatoWebUrl: 'https://app.example.com',
      imServiceUrl: '',
    })
    expect(env.TOMATO_SEARCH_GATEWAY_URL).toBe('https://search.example.com')
  })

  it('keeps inherited values when no origin is configured', () => {
    const env = withLoginEnvironment({ AUTH_SERVICE_URL: 'http://127.0.0.1:8003' }, {
      authServiceUrl: '',
      tomatoWebUrl: '',
      imServiceUrl: '',
    })
    expect(env).toEqual({ AUTH_SERVICE_URL: 'http://127.0.0.1:8003' })
  })
})
