/**
 * Fold unit: durable `image/evidence` records become the client-visible
 * `imageEvidence` map the transcript card reads.
 */

import { describe, expect, it } from 'vitest'
import { SessionSeq } from '@tomato/session'
import type { SessionEvent } from '@tomato/session/types'
import type { ImageEvidenceAttempt } from '../src/spec.ts'
import { imageEvidenceProjectionDefinition } from '../src/projection.ts'
import type { ImageEvidenceProjection } from '../src/projection.ts'

const AK = 'sha256:aaaa'
const BK = 'sha256:bbbb'
const ENGINE = { provider: 'acme', model: 'vision-1' }

function attempt(ok: boolean, provider = ENGINE.provider, model = ENGINE.model): ImageEvidenceAttempt {
  return {
    engine: { provider, model },
    ok,
    durationMs: 100,
    ...ok ? {} : { failure: { code: 'ENGINE_ERROR', message: 'boom' } },
  }
}

function evidence(
  attachmentId: string,
  fields: {
    cached?: boolean
    attempts?: readonly ImageEvidenceAttempt[]
    truncated?: boolean
    durationMs?: number
    engine?: { provider: string; model: string }
  } = {},
): SessionEvent {
  return {
    type: 'image/evidence',
    seq: SessionSeq(1),
    time: 1,
    data: {
      attachmentId,
      cached: fields.cached ?? false,
      engine: fields.engine ?? ENGINE,
      attempts: fields.attempts ?? [attempt(true)],
      truncated: fields.truncated ?? false,
      durationMs: fields.durationMs ?? 1_200,
    },
  }
}

function fold(events: readonly SessionEvent[], initial: ImageEvidenceProjection = {}): ImageEvidenceProjection {
  return events.reduce((state, event) => imageEvidenceProjectionDefinition.apply(state, event), initial)
}

describe('imageEvidenceProjectionDefinition', () => {
  it('starts empty', () => {
    expect(imageEvidenceProjectionDefinition.init()).toEqual({})
  })

  it('folds one generated read into an entry the card can render', () => {
    expect(fold([evidence(AK)])).toEqual({
      [AK]: {
        engine: ENGINE,
        attempts: 1,
        failed: false,
        truncated: false,
        cached: false,
        durationMs: 1_200,
      },
    })
  })

  it('reports a reused record with no attempts and no elapsed time', () => {
    expect(fold([evidence(AK, { cached: true, attempts: [], durationMs: 0 })])).toEqual({
      [AK]: {
        engine: ENGINE,
        attempts: 0,
        failed: false,
        truncated: false,
        cached: true,
        durationMs: 0,
      },
    })
  })

  it('reports a chain that exhausted every engine as failed', () => {
    const [entry] = Object.values(fold([
      evidence(AK, {
        attempts: [attempt(false), attempt(false, 'acme', 'vision-2')],
        durationMs: 900,
      }),
    ]))
    expect(entry).toMatchObject({ attempts: 2, failed: true, cached: false, truncated: false })
  })

  it('keeps a successful chain\'s earlier failures out of the failed state', () => {
    const [entry] = Object.values(fold([evidence(AK, { attempts: [attempt(false), attempt(true)] })]))
    expect(entry).toMatchObject({ attempts: 2, failed: false })
  })

  it('records truncation and the engine that produced the text', () => {
    const [entry] = Object.values(fold([evidence(AK, { truncated: true, engine: { provider: 'other', model: 'v9' } })]))
    expect(entry).toMatchObject({ truncated: true, engine: { provider: 'other', model: 'v9' } })
  })

  it('ignores events outside the evidence contract and keeps the same reference', () => {
    const state: ImageEvidenceProjection = {
      [AK]: { engine: ENGINE, attempts: 1, failed: false, truncated: false, cached: false, durationMs: 5 },
    }
    const turnStart: SessionEvent = { type: 'turn/start', seq: SessionSeq(2), time: 2, data: { turn: 1 } }
    expect(imageEvidenceProjectionDefinition.apply(state, turnStart)).toBe(state)
    expect(Object.entries(fold([turnStart, evidence(BK)]))).toEqual([
      [BK, { engine: ENGINE, attempts: 1, failed: false, truncated: false, cached: false, durationMs: 1_200 }],
    ])
  })

  it('lets a later read of the same attachment replace the earlier entry', () => {
    const state = fold([
      evidence(AK, { cached: true, attempts: [], durationMs: 0 }),
      evidence(AK, { engine: { provider: 'other', model: 'v9' }, durationMs: 2_000 }),
    ])
    expect(Object.keys(state)).toEqual([AK])
    expect(state[AK]).toMatchObject({ engine: { provider: 'other', model: 'v9' }, cached: false, durationMs: 2_000 })
  })

  it('accepts only complete persisted state as a cache seed', () => {
    const state = fold([evidence(AK)])
    expect(imageEvidenceProjectionDefinition.stateSchema.parse(state)).toEqual(state)
    expect(() => imageEvidenceProjectionDefinition.stateSchema.parse({
      [AK]: { engine: ENGINE, failed: false, truncated: false, cached: false, durationMs: 5 },
    })).toThrow()
  })

  it('publishes the folded state unchanged to the client view', () => {
    const state = fold([evidence(AK)])
    expect(imageEvidenceProjectionDefinition.wire.view(state)).toBe(state)
    expect(imageEvidenceProjectionDefinition.wire.viewSchema.parse(state)).toEqual(state)
    expect(imageEvidenceProjectionDefinition.wire.summary).toBe(false)
  })
})
