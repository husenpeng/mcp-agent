/**
 * `read_image` tool: load an image from a path or URL, store it as an
 * attachment, and return the evidence text. Registered by the bridge only while
 * engines are configured, so an unconfigured deployment exposes no tool.
 * @module @tomato/image-evidence/src/tool
 */

import { defineTool } from '@tomato/tools'
import type { AttachmentStore } from '@tomato/attachment'
import type { ToolDefinition } from '@tomato/tools'
import type { Session } from '@tomato/session'
import type { ImageEvidenceOutcome } from './types.ts'
import { formatEvidenceBlock } from './prompt.ts'
import type { ImageSourceLimits } from './source.ts'
import { loadImageSource } from './source.ts'

/** Everything the tool needs from its owning plugin instance. */
export interface ReadImageToolOptions {
  /** Attachment store that admits the loaded bytes. */
  readonly attachments: AttachmentStore
  /** Resolves and stores evidence for the admitted image. */
  readonly ensure: (ref: Parameters<AttachmentStore['readImage']>[0]) => Promise<ImageEvidenceOutcome>
  /** Records one outcome on the calling agent's session when it announces. */
  readonly record: (outcome: ImageEvidenceOutcome, session: Session) => void
  /** Source limits shared with the plugin configuration. */
  readonly limits: ImageSourceLimits
}

/** Model-facing description; it states the trigger and the refusal surface. */
const DESCRIPTION = [
  'Read one image from an absolute file path or an http(s) URL and return its structured evidence',
  '(summary, transcription, layout, semantics) as text.',
  'Use it when the user names an image path or URL that is not already attached to the conversation.',
  'It refuses non-image bytes, sources above the configured byte limit, and, by policy, private or local URLs.',
].join(' ')

/**
 * Build the `read_image` tool definition.
 * @param options - attachment store, evidence resolver, recorder, and source limits.
 * @returns the tool definition to register on `ctx.tools`.
 */
export function createReadImageTool(options: ReadImageToolOptions): ToolDefinition {
  return defineTool({
    name: 'read_image',
    description: DESCRIPTION,
    parameters: {
      source: { type: 'string', required: true, description: 'Absolute image path or http(s) URL.' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          evidence: { type: 'string', required: true },
          attachmentId: { type: 'string', required: true },
          mediaType: { type: 'string', required: true },
          truncated: { type: 'boolean', required: true },
        },
      },
      render: (_args, value) => [{ type: 'text', text: value.evidence }],
    },
    async execute(args, exec) {
      const loaded = await loadImageSource(args.source, options.limits, exec.signal)
      const ref = await options.attachments.saveImage(loaded)
      const outcome = await options.ensure(ref)
      if (outcome.record === undefined) {
        const attempts = outcome.attempts
          .map(attempt => `${attempt.engine.provider}/${attempt.engine.model}: ${attempt.failure?.message ?? 'failed'}`)
          .join('; ')
        throw new Error(`read_image could not read the image${attempts === '' ? '' : `: ${attempts}`}`)
      }
      if (exec.agent !== undefined) options.record(outcome, exec.agent.session)
      return {
        evidence: formatEvidenceBlock(outcome.record.attachmentId, outcome.record.text),
        attachmentId: outcome.record.attachmentId,
        mediaType: loaded.mediaType,
        truncated: outcome.record.truncated,
      }
    },
    presentCall: args => ({ card: 'generic', title: 'Read image', kind: 'other', rawInput: args.source }),
  })
}
