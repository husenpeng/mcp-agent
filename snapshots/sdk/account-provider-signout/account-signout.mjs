/** Deterministic transport boundary; cancellation belongs to the shipped account provider. */
export const inject = ['llm', 'agents']
export function apply(ctx) {
  ctx.on('llm/stream', async function* (request, next) {
    if (request.provider !== 'deepseek-official') { yield* next(); return }
    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'text-delta', index: 0, text: 'Before sign-out' }
    ctx.emit('account/signed-out')
    throw new DOMException('account/signed-out', 'AbortError')
  })
}
