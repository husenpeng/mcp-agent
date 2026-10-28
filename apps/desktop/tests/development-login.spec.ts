/** Development login variables projected from the checked-in env file. */
import { describe, expect, it } from 'vitest'
import { developmentLoginEnvironment } from '../scripts/development-login.ts'

const FILE = {
  DSH_DESKTOP_AUTH_SERVICE_URL: 'http://localhost:8020',
  DSH_DESKTOP_TOMATO_WEB_URL: 'http://localhost:3000',
}

describe('developmentLoginEnvironment', () => {
  it('maps the development file onto the Host runtime variables', () => {
    expect(developmentLoginEnvironment(FILE, {})).toEqual({
      AUTH_SERVICE_URL: 'http://localhost:8020',
      TOMATO_WEB_URL: 'http://localhost:3000',
    })
  })

  it('lets explicit launch variables win over the file', () => {
    expect(developmentLoginEnvironment(FILE, {
      AUTH_SERVICE_URL: 'http://127.0.0.1:9000',
      TOMATO_WEB_URL: 'http://127.0.0.1:4000',
    })).toEqual({
      AUTH_SERVICE_URL: 'http://127.0.0.1:9000',
      TOMATO_WEB_URL: 'http://127.0.0.1:4000',
    })
    expect(developmentLoginEnvironment(FILE, { DSH_DESKTOP_AUTH_SERVICE_URL: 'http://127.0.0.1:9000' }))
      .toMatchObject({ AUTH_SERVICE_URL: 'http://127.0.0.1:9000' })
  })

  it('omits absent values and rejects malformed origins', () => {
    expect(developmentLoginEnvironment({}, {})).toEqual({})
    expect(() => developmentLoginEnvironment({}, { AUTH_SERVICE_URL: 'not a url' }))
      .toThrow(/AUTH_SERVICE_URL/)
    expect(() => developmentLoginEnvironment({ DSH_DESKTOP_TOMATO_WEB_URL: 'http://localhost:3000/ui' }, {}))
      .toThrow(/TOMATO_WEB_URL/)
  })
})
