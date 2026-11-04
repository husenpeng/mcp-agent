/** Business-language projection of one robot run's Chat nodes: inputs, answers, and actions. */
import type {
  AssistantBlock, AssistantChatData, ChatConversationViewNode, SteeringMessageNode, ToolCallBlock, ToolChatData,
  UserMessageNode,
} from '@tomato/client-ui-chat/client'
import type { ContentBlock } from '@tomato/llm'

/** Whether one Tool root carries its final result rather than a running call. */
function isSettledTool(block: ToolCallBlock): block is Extract<ToolCallBlock, { kind: 'tool-result' }> {
  return 'kind' in block
}

/** Chat node carrying one of the payloads the run timeline presents. */
export type RunNode =
  | (ChatConversationViewNode & { readonly kind: 'user'; readonly data: UserMessageNode })
  | (ChatConversationViewNode & { readonly kind: 'steering'; readonly data: SteeringMessageNode })
  | (ChatConversationViewNode & { readonly kind: 'assistant-step'; readonly data: AssistantChatData })
  | (ChatConversationViewNode & { readonly kind: 'tool-call'; readonly data: ToolChatData })

/**
 * Narrow one materialized Chat node to a payload the timeline presents.
 * @param node - materialized Chat node.
 * @returns the narrowed node, or `undefined` for a kind the timeline skips.
 */
function asRunNode(node: ChatConversationViewNode | undefined): RunNode | undefined {
  if (node === undefined) return undefined
  // The Chat node store publishes its union through the base node type; the
  // kind discriminator pairs each payload, exactly as Chat's own renderers read it.
  return node.kind === 'user' || node.kind === 'steering' || node.kind === 'assistant-step' || node.kind === 'tool-call'
    ? node as RunNode
    : undefined
}

/** Structured subset of a Chat snapshot the run timeline reads. */
export interface RunStepSource {
  readonly order: readonly string[]
  readonly nodes: { get(key: string): ChatConversationViewNode | undefined }
}

/** One line of the run timeline. */
export type RunStep =
  | { readonly kind: 'input'; readonly key: string; readonly seq: number; readonly text: string }
  | { readonly kind: 'answer'; readonly key: string; readonly seq: number; readonly text: string }
  | {
    readonly kind: 'action'
    readonly key: string
    readonly seq: number
    /** Registered tool name, kept for the technical detail view. */
    readonly tool: string
    /** Best-effort object the action touched, such as a file path or a command. */
    readonly detail?: string
    readonly status: 'running' | 'done' | 'failed'
    readonly output?: string
    /** Raw argument text, kept for the technical detail view. */
    readonly raw?: string
  }

/** Argument keys that name the object an action touched, in display preference order. */
const DETAIL_KEYS = ['path', 'file_path', 'filePath', 'command', 'query', 'url', 'pattern', 'name'] as const

/** Maximum characters one timeline text carries before it is shortened. */
const TEXT_LIMIT = 400

function textOfContent(content: readonly ContentBlock[]): string {
  return content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('')
    .trim()
}

function textOfBlocks(blocks: readonly AssistantBlock[]): string {
  return blocks
    .filter(block => block.kind === 'text')
    .map(block => block.text)
    .join('')
    .trim()
}

/**
 * Shorten one timeline text for a business view.
 * @param text - complete text.
 * @returns the text, truncated with an ellipsis when it exceeds the display limit.
 */
export function shorten(text: string): string {
  return text.length <= TEXT_LIMIT ? text : `${text.slice(0, TEXT_LIMIT)}…`
}

/**
 * Read the object an action touched from its recorded arguments.
 * @param argsRaw - raw JSON argument text exactly as the model produced it.
 * @returns the first recognized scalar field, or `undefined` when none parses.
 */
export function detailOf(argsRaw: string | undefined): string | undefined {
  if (argsRaw === undefined || argsRaw === '') return undefined
  let parsed: unknown
  try {
    parsed = JSON.parse(argsRaw)
  } catch {
    // A preparing or interrupted call can leave partial argument text.
    return undefined
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return undefined
  const fields = parsed as Record<string, unknown>
  for (const key of DETAIL_KEYS) {
    const value = fields[key]
    if (typeof value === 'string' && value.trim() !== '') return value.length <= 120 ? value : `${value.slice(0, 120)}…`
  }
  return undefined
}

function actionStep(key: string, seq: number, root: ToolCallBlock): RunStep {
  if (isSettledTool(root)) {
    const argsRaw = root.call?.argsRaw
    const detail = detailOf(argsRaw)
    const output = shorten(textOfContent(root.content))
    return {
      kind: 'action',
      key,
      seq,
      tool: root.name,
      ...detail === undefined ? {} : { detail },
      status: root.isError ? 'failed' : 'done',
      ...output === '' ? {} : { output },
      ...argsRaw === undefined ? {} : { raw: argsRaw },
    }
  }
  const argsRaw = root.phase === 'start' ? root.argsRaw : undefined
  const detail = detailOf(argsRaw)
  return {
    kind: 'action',
    key,
    seq,
    tool: root.name,
    ...detail === undefined ? {} : { detail },
    status: 'running',
    ...argsRaw === undefined ? {} : { raw: argsRaw },
  }
}

/**
 * Fold one run's Chat nodes into business-language timeline lines. Nodes the
 * robot page does not present — reasoning, context injections, retries, turn
 * footers — are skipped rather than shown as raw machinery.
 * @param chat - the run Session's Chat snapshot, or `undefined` before it loads.
 * @returns timeline lines in durable order.
 */
export function runSteps(chat: RunStepSource | undefined): readonly RunStep[] {
  if (chat === undefined) return []
  const steps: RunStep[] = []
  for (const key of chat.order) {
    const node = asRunNode(chat.nodes.get(key))
    if (node === undefined || node.visibility === 'hidden') continue
    switch (node.kind) {
      case 'user':
      case 'steering': {
        const text = textOfContent(node.data.content).trim()
        if (text !== '') steps.push({ kind: 'input', key, seq: node.anchorSeq, text: shorten(text) })
        continue
      }
      case 'assistant-step': {
        const text = textOfBlocks(node.data.blocks)
        if (text !== '') steps.push({ kind: 'answer', key, seq: node.anchorSeq, text: shorten(text) })
        continue
      }
      case 'tool-call':
        steps.push(actionStep(key, node.anchorSeq, node.data.root))
    }
  }
  return steps
}
