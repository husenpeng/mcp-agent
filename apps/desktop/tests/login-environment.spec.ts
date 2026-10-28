/** Login origins sealed by packaging and overridable at launch. */
import { describe, expect, it } from 'vitest'
import { resolveLoginEnvironment, withLoginEnvironment } from '../src/login-environment.ts'

const MANIFEST = { tomatoAuthServiceUrl: 'https://auth.example.com', tomatoTomatoWebUrl: 'https://app.example.com' }

describe('resolveLoginEnvironment', () => {
  it('reads the origins sealed into the packaged manifest', () => {
    expect(resolveLoginEnvironment(MANIFEST, {})).toEqual({
      authServiceUrl: 'https://auth.example.com',
      tomatoWebUrl: 'https://app.example.com',
    })
  })

  it('lets explicit launch variables override each packaged origin', () => {
    expect(resolveLoginEnvironment(MANIFEST, {
      AUTH_SERVICE_URL: 'http://127.0.0.1:8003/',
      TOMATO_WEB_URL: 'http://localhost:3000',
    })).toEqual({ authServiceUrl: 'http://127.0.0.1:8003', tomatoWebUrl: 'http://localhost:3000' })
  })

  it('falls back to the manifest for an empty launch variable', () => {
    expect(resolveLoginEnvironment(MANIFEST, { AUTH_SERVICE_URL: ' ' })).toEqual({
      authServiceUrl: 'https://auth.example.com',
      tomatoWebUrl: 'https://app.example.com',
    })
  })

  it('leaves both origins empty when neither source configures them', () => {
    expect(resolveLoginEnvironment({}, {})).toEqual({ authServiceUrl: '', tomatoWebUrl: '' })
  })

  it('rejects malformed origins and manifests', () => {
    expect(() => resolveLoginEnvironment({ tomatoAuthServiceUrl: 'ftp://auth.example.com' }, {}))
      .toThrow(/tomatoAuthServiceUrl/)
    expect(() => resolveLoginEnvironment({ tomatoTomatoWebUrl: 'https://app.example.com/ui' }, {}))
      .toThrow(/tomatoTomatoWebUrl/)
    expect(() => resolveLoginEnvironment({}, { AUTH_SERVICE_URL: 'not a url' })).toThrow(/AUTH_SERVICE_URL/)
    expect(() => resolveLoginEnvironment({}, { TOMATO_WEB_URL: 'https://user:secret@app.example.com' }))
      .toThrow(/TOMATO_WEB_URL/)
    expect(() => resolveLoginEnvironment(null, {})).toThrow(/invalid application manifest/)
  })

  it('projects the resolved origins into the Host environment', () => {
    const env = withLoginEnvironment({ PATH: '/bin', AUTH_SERVICE_URL: 'stale.example.com' }, {
      authServiceUrl: 'https://auth.example.com',
      tomatoWebUrl: 'https://app.example.com',
    })
    expect(env).toEqual({
      PATH: '/bin',
      AUTH_SERVICE_URL: 'https://auth.example.com',
      TOMATO_WEB_URL: 'https://app.example.com',
    })
  })

  it('keeps inherited values when no origin is configured', () => {
    const env = withLoginEnvironment({ AUTH_SERVICE_URL: 'http://127.0.0.1:8003' }, {
      authServiceUrl: '',
      tomatoWebUrl: '',
    })
    expect(env).toEqual({ AUTH_SERVICE_URL: 'http://127.0.0.1:8003' })
  })
})
