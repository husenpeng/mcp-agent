/** The generated Typert artifact is what makes `phone/*` reachable from a client. */
import { Context } from '@tomato/cordis'
import TypertRegistry from '@tomato/typert-registry'
import { validateTypertManifest } from '@tomato/typert-loader'
import { describe, expect, it } from 'vitest'
import { TYPERT } from '../lib/typert.host.js'
import { PhoneDevices } from '../src/registry.ts'
import { PhoneRemote } from '../src/remote.ts'

describe('phone-use Typert artifact', () => {
  it('claims the four endpoints of the phone namespace', async () => {
    const ctx = new Context()
    await ctx.plugin(TypertRegistry)
    const contribution = validateTypertManifest('@tomato/experimental-phone-use', TYPERT)
    ctx.typert.register(contribution)

    const endpoints = contribution.invocations.map(descriptor => `${descriptor.namespace}/${descriptor.method}`).sort()
    expect(endpoints).toEqual(['phone/attach', 'phone/devices', 'phone/event', 'phone/result'])
    // Registering the manifest is what makes the namespace discoverable at all.
    expect(ctx.typert.getPackage('@tomato/experimental-phone-use', 'host')).toBeDefined()
  })

  it('binds the namespace to the service key the Host mounts', async () => {
    const ctx = new Context()
    await ctx.plugin(TypertRegistry)
    ctx.typert.register(validateTypertManifest('@tomato/experimental-phone-use', TYPERT))
    new PhoneRemote(ctx, new PhoneDevices())
    const service = ctx.get('phoneRemote')
    expect(service).toBeInstanceOf(PhoneRemote)
    expect(service?.typertRemote.namespace).toBe('phone')
    expect(service?.typertRemote.serviceKey).toBe('phoneRemote')
  })
})
