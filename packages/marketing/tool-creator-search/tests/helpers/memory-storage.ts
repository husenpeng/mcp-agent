/**
 * Test composition: durable domain storage over the shared in-memory backend, so
 * the plugin's real storage path runs without touching disk. The caller mounts
 * `@tomato/storage` first; this plugin then provides `ctx.storageDomain`.
 * @module
 */

import type { Context } from '@tomato/cordis'
import { DomainFacility } from '@tomato/storage-domain'
import { MemoryMediaPool, MemoryStorageBackend } from '../../../../storage/storage-domain/tests/helpers/memory-backend.ts'

export const name = 'test-memory-storage'

/** The hub this helper extends with a fixture backend and a domain facility. */
export const inject = ['storage']

/**
 * Register the in-memory backend and provide the domain facility.
 * @param ctx - context whose `storage` service is active.
 */
export function apply(ctx: Context): void {
  const backend = new MemoryStorageBackend(new MemoryMediaPool())
  ctx.effect(() => ctx.storage.backend.register('fixture', backend))
  const facility = new DomainFacility(ctx, { backend: 'fixture' })
  ctx.effect(() => {
    const unmount = ctx.storage.mount('domain', facility)
    ctx.provide('storageDomain', facility)
    return async () => {
      await facility.closeAll()
      unmount()
    }
  })
}
