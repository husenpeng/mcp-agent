/**
 * Real-composition test: one text-only agent turn whose user message carries an
 * image must send the stored evidence text instead of the placeholder, and the
 * engine call must stay a separate auxiliary request.
 */

import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@tomato/cordis'
import { AttachmentStore } from '@tomato/attachment'
import type {
  ImageAttachmentLimits,
  ImageAttachmentRef,
  SaveImageAttachment,
  StoredImageAttachment,
} from '@tomato/attachment'
import { LlmAdapter, createUserMessage } from '@tomato/llm'
import type { GenerateOptions, LlmResolvedModelInfo, StreamChunk } from '@tomato/llm'
import { SessionId } from '@tomato/session'
import { mountAgentLoopTestDependencies, mountAgentLoopTestHarness } from '@tomato/agent-loop-testkit'
import Storage from '@tomato/storage'
import * as StorageDomain from '@tomato/storage-domain'
import * as StorageJson from '@tomato/storage-json'
import { afterEach, describe, expect, it } from 'vitest'
import ImageEvidence from '../src/index.ts'

const LIMITS: ImageAttachmentLimits = {
  maxImageBytes: 1_000_000,
  maxImagesPerMessage: 4,
  maxMessageImageBytes: 4_000_000,
  maxImagePixels: 1_000_000,
  maxImageDimension: 8_192,
  mediaTypes: ['image/png'],
}

/** In-memory attachment provider; the engine adapter never reads bytes. */
class MemoryAttachments extends AttachmentStore {
  readonly imageLimits = LIMITS
  // Cordis proxies services, so plain fields survive where #private fields do not.
  private readonly images = new Map<string, StoredImageAttachment>()
  private next = 0

  async validateImage(): Promise<void> {}

  async saveImage(input: SaveImageAttachment): Promise<ImageAttachmentRef> {
    this.next += 1
    const ref: ImageAttachmentRef = {
      attachmentId: `sha256:${'a'.repeat(63)}${this.next}` as ImageAttachmentRef['attachmentId'],
      mediaType: input.mediaType,
      bytes: input.data.byteLength,
      width: 4,
      height: 4,
    }
    this.images.set(String(ref.attachmentId), { ref, data: input.data })
    return ref
  }

  async readImage(ref: ImageAttachmentRef): Promise<StoredImageAttachment> {
    const stored = this.images.get(String(ref.attachmentId))
    if (stored === undefined) throw new Error(`missing test image ${ref.attachmentId}`)
    return stored
  }
}

/** Adapter that records requests and replays one script. */
class ScriptedAdapter extends LlmAdapter {
  readonly requests: GenerateOptions[] = []

  constructor(
    readonly modalities: readonly ('text' | 'image')[],
    private readonly scriptText: string,
  ) {
    super()
  }

  override resolveModel(provider: string, model: string): Promise<LlmResolvedModelInfo> {
    return Promise.resolve({
      provider,
      id: model,
      name: model,
      inputModalities: this.modalities,
    })
  }

  override async * stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    this.requests.push(options)
    yield { type: 'text-delta', index: 0, text: this.scriptText }
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

const EVIDENCE_JSON = JSON.stringify({
  summary: 'A four-pixel test image.',
  ocr: { full_text: 'HELLO' },
  layout: { regions: [{ type: 'title', reading_order: 1, text: 'HELLO' }] },
})

const contexts: Context[] = []
const homes: string[] = []

afterEach(async () => {
  for (const ctx of contexts.splice(0)) await ctx.fiber.dispose()
  for (const home of homes.splice(0)) await rm(home, { recursive: true, force: true })
})

describe('image evidence at turn level', () => {
  it('sends stored evidence to a text-only model and keeps the engine call auxiliary', async () => {
    const home = await mkdtemp(join(tmpdir(), 'image-evidence-'))
    homes.push(home)
    const ctx = new Context()
    contexts.push(ctx)
    await ctx.plugin(Storage)
    await ctx.plugin(StorageJson, { root: join(home, 'storage') })
    await ctx.plugin(StorageDomain, { backend: 'json' })
    await ctx.plugin(MemoryAttachments)
    await mountAgentLoopTestDependencies(ctx)

    const text = new ScriptedAdapter(['text'], 'I read the evidence.')
    const vision = new ScriptedAdapter(['text', 'image'], EVIDENCE_JSON)
    ctx.llm.registerAdapter(['text-route'], text)
    ctx.llm.registerAdapter(['vision-route'], vision)
    await ctx.plugin(ImageEvidence, { engines: [{ provider: 'vision-route', model: 'vision-1' }] })

    const harness = await mountAgentLoopTestHarness(ctx)
    const agent = await harness.create(SessionId('evidence-turn'), { provider: 'text-route', model: 'text-1' })
    const ref = await ctx.attachments.saveImage({
      data: new Uint8Array([1, 2, 3, 4]),
      mediaType: 'image/png',
    })
    agent.followup(createUserMessage({
      content: [{ type: 'image', attachment: ref }, { type: 'text', text: 'What does it say?' }],
      source: { kind: 'user' },
    }))
    await agent.whenIdle()

    expect(ctx.tools.get('read_image')).toBeDefined()
    expect(vision.requests).toHaveLength(1)
    expect(text.requests).toHaveLength(1)
    const blocks = text.requests[0]?.messages.flatMap(message => message.content) ?? []
    const evidence = blocks.find(block => block.type === 'text' && block.text.startsWith('<image_evidence'))
    expect(evidence).toBeDefined()
    expect(evidence?.type === 'text' ? evidence.text : '').toContain('HELLO')
    expect(blocks.some(block => block.type === 'image')).toBe(false)
    const announced = agent.session.snapshotEvents().filter(event => event.type === 'image/evidence')
    expect(announced).toHaveLength(1)
  })
})
