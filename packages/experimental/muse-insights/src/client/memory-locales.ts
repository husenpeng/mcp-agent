/** Locale namespace and dictionaries of the Session memory tab. */

import type {} from '@tomato/client-ui-slots'

/** Locale namespace owned by the memory tab. */
export const MEMORY_NS = 'museMemory'

/** English copy of the memory tab. */
export const en = {
  'tab': 'Memory',
  'note': 'Read-only log of memory snapshots, memory tool calls, capture passes, and promotion passes in this session.',
  'empty': 'No memory activity in this session yet.',
  'kind.snapshot': 'Snapshot',
  'kind.call': 'Call',
  'kind.result': 'Result',
  'kind.capture': 'Capture',
  'kind.promotion': 'Promotion',
  'embeddings.title': 'Embedding provider',
  'embeddings.hint': 'Connect an OpenAI-compatible /embeddings endpoint. The local Ollama path keeps text on this machine; a remote endpoint receives record text and queries.',
  'embeddings.baseUrl': 'Endpoint URL',
  'embeddings.model': 'Model id',
  'embeddings.apiKeyEnv': 'Credential name',
  'embeddings.dimensions': 'Vector length',
  'embeddings.test': 'Test connection',
  'embeddings.testing': 'Testing…',
  'embeddings.testOk': 'Connected',
  'embeddings.testFailed': 'Not connected',
  'embeddings.loading': 'Loading the provider configuration…',
  'embeddings.unavailable': 'This page appears after the embedding row is enabled.',
  'embeddings.readOnly': 'The running profile does not accept form edits.',
  'embeddings.apiKeyEnvHint': 'Optional name of a stored credential or environment variable; never paste the key here.',
  'embeddings.endpointSave': 'Save endpoint',
  'embeddings.endpointSaved': 'Endpoint saved. Reload the Host for a changed URL to take effect; a changed credential name applies to new requests.',
  'embeddings.endpointFailed': 'The Host refused the change; reload and try again.',
  'embeddings.dimensionsUnit': 'values',
  'embeddings.usage': 'Embedding usage',
  'embeddings.usageLine': '{requests} requests · {texts} texts · {failures} failures · {seconds}s',
  'embeddings.empty': 'Not configured',
  'embeddings.anyLength': 'any (set by the first response)',
  'embeddings.noCredential': 'No credential',
  'embeddings.enabled': 'Semantic search is on',
  'embeddings.disabled': 'Semantic search is off',
  'embeddings.toggleSaved': 'Updated. The running provider adopts the switch immediately.',
  'embeddings.toggleRefused': 'The Host refused the change; reload and try again.',
  'model.v4': 'Alibaba multilingual model, 1024 values; the fastest of the tested models and a good default for Chinese and English.',
  'model.doubao': 'ByteDance model, 2560 values; the fastest reply but the largest vectors among the tested models.',
  'model.ada': 'Legacy OpenAI model, 1536 values; broadly compatible and slower than text-embedding-v4 on this relay.',
  'model.small': 'OpenAI small model, 1536 values; balanced quality and cost, about twice the latency of text-embedding-v4 here.',
  'model.large': 'OpenAI large model, 3072 values; highest storage cost and the slowest reply of the tested models.',
}

/** Key set of the memory tab. */
export type MemoryKey = keyof typeof en

declare module '@tomato/client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Session memory tab copy. */
    museMemory: MemoryKey
  }
}

/** Chinese copy, checked against the English key set. */
export const zh: Record<MemoryKey, string> = {
  'tab': '记忆',
  'note': '本会话中记忆快照、记忆工具调用、捕捉与提升过程的只读日志。',
  'empty': '本会话还没有记忆活动。',
  'kind.snapshot': '快照',
  'kind.call': '调用',
  'kind.result': '结果',
  'kind.capture': '捕捉',
  'kind.promotion': '提升',
  'embeddings.title': '向量提供方',
  'embeddings.hint': '连接 OpenAI 兼容的 /embeddings 端点。本机 Ollama 路径让文本留在本机；远端端点会收到记录文本与查询。',
  'embeddings.baseUrl': '端点地址',
  'embeddings.model': '模型 id',
  'embeddings.apiKeyEnv': '凭据名',
  'embeddings.dimensions': '向量长度',
  'embeddings.test': '测试连接',
  'embeddings.testing': '测试中…',
  'embeddings.testOk': '连接成功',
  'embeddings.testFailed': '未连接',
  'embeddings.loading': '正在加载提供方配置…',
  'embeddings.unavailable': '启用向量提供方行后，这里才会出现配置页。',
  'embeddings.readOnly': '当前 profile 不接受表单修改。',
  'embeddings.apiKeyEnvHint': '可选的已存凭据或环境变量名；不要在这里粘贴密钥。',
  'embeddings.endpointSave': '保存端点',
  'embeddings.endpointSaved': '端点已保存。修改 URL 后需重新加载 Host 才会生效；只改凭据名会用于后续请求。',
  'embeddings.endpointFailed': 'Host 拒绝了修改；请刷新后重试。',
  'embeddings.dimensionsUnit': '维',
  'embeddings.usage': '嵌入用量',
  'embeddings.usageLine': '{requests} 次请求 · {texts} 条文本 · {failures} 次失败 · {seconds} 秒',
  'embeddings.empty': '未配置',
  'embeddings.anyLength': '任意（由首个响应决定）',
  'embeddings.noCredential': '无凭据',
  'embeddings.enabled': '语义检索已开启',
  'embeddings.disabled': '语义检索已关闭',
  'embeddings.toggleSaved': '已更新，运行中的提供方会立即采用该开关。',
  'embeddings.toggleRefused': 'Host 拒绝了修改；请刷新后重试。',
  'model.v4': '阿里多语言模型，1024 维；测试中最快，适合中英文混合记忆的默认选择。',
  'model.doubao': '字节模型，2560 维；响应最快，但测试模型里向量最大。',
  'model.ada': 'OpenAI 旧版模型，1536 维；兼容性广，在此中转上比 text-embedding-v4 慢。',
  'model.small': 'OpenAI 小模型，1536 维；质量与成本均衡，在此中转上延迟约为 text-embedding-v4 的两倍。',
  'model.large': 'OpenAI 大模型，3072 维；存储成本最高，也是测试中最慢的。',
}
