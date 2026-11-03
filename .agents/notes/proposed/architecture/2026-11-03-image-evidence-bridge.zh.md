# Agent Note: 面向纯文本模型的图像证据桥

Status: proposed

[English](2026-11-03-image-evidence-bridge.md) | 中文

## 问题

纯文本模型永远看不到粘贴的图像。附件管线会保存图像，Session 也保留它的 `ImageAttachmentRef`，但 `packages/llm/llm/src/content.ts` 的 `projectImagesForTextModel` 在分派前把每个 image block 替换成 `textOnlyImageText`，于是模型收到固定占位符（`[image omitted because this model accepts text only; attachment sha256:…]`），而不是图像内容。更早一步，`packages/api/session-controller/src/commands.ts` 的 `SessionCommands.prompt` 在所选模型的 `inputModalities` 已定义但不含 `image` 时直接拒绝该提示词，返回 `session/attachment-invalid`，原因为 `MODEL_DOES_NOT_SUPPORT_IMAGES`；`packages/subagent/subagent/src/manager.ts` 的 `SubagentManager.assertImageCapable` 对子代理投递施加同一拒绝。

图像管线已经提供了这个能力所需的全部输入。附件按内容寻址，`ImageAttachmentRef` 标识确切字节，`adapterStream` 中的投影是分派前唯一改变请求内容的位置，而模型的模态声明是权威元数据。缺少的是证据：一种图像的文字呈现，使纯文本模型无需假装图像以原生方式到达也能读取。

## 方案

用配置好的视觉模型读取粘贴的图像，并把结果作为派生的附件产物注入。该能力是 [`packages/llm/image-evidence/src/index.ts`](../../../../packages/llm/image-evidence/src/index.ts) 中的 `@tomato/image-evidence`，一个以 `ctx.imageEvidence` 发布的 Cordis 服务。决策分为七部分：

1. **证据是派生产物，不是用户内容。** 图像仍是附件，也仍是 `user/message` 中的 image block；该能力单独保存证据记录，绝不把转写写回 transcript。
2. **生成发生在 `agent/pre-step`。** 插件的 waterfall 监听器让链上其余部分先返回 `enter` 决策，然后收集该决策中的图像引用并调用 `ensure()`。这是唯一同时看到已认领消息、该步骤的 `modelSelection` 和 `signal` 的位置。
3. **投影在分派时同步进行。** `adapterStream` 读取 `ctx.get('imageEvidence')`，并在 `packages/llm/llm/src/index.ts` 中调用 `projectImagesWithEvidence(messages, peek)`，位置在纯文本占位符回退之前。查询是对进程内缓存的同步 `peek`；投影从不等待存储或引擎，也没有失败分支。
4. **准入只在 `canRead` 为真时放宽。** 对于明确声明纯文本输入的模型，两处准入闸门都以结构化方式查询这个可选服务。除非该能力报告 `canRead(model) === true`，否则它们保留 `MODEL_DOES_NOT_SUPPORT_IMAGES`；服务缺席与返回 false 是同一种拒绝。
5. **未知模态永不满足条件。** `canRead` 要求 `inputModalities` 存在且不含 `image`。缺失该列表表示未知，不表示纯文本；声明 `image` 的模型永远不会被介入。
6. **Web bundle 以 `disabled: true` 交付该行。** `packages/bundle/web-app/cordis.patch.yml` 插入 `image-evidence` 行并设置 `disabled: true`，`packages/bundle/web-app/package.json` 声明依赖。该行禁用期间服务缺席，旧拒绝照常生效。
7. **对话卡片读取宿主投影。** 配置了引擎时，插件注册 `imageEvidence` 投影，把每条 `image/evidence` 事件折叠为每个附件一个条目：引擎、尝试次数、失败、截断、复用与耗时。`@tomato/client-ui-image-evidence` 通过新增的 `conversation.chat.user.image-meta` 列表插槽把该条目渲染在图片下方；既有 `conversation.chat.user.images` 是 `single`，在那里二次注册会抛错。投影被排除在会话摘要之外，因为没有会话列表行渲染它。

### 引擎链与证据格式

`Config.engines` 是 `{ provider, model }` 路由的有序列表，路由经 `ctx.llm` 解析；空列表会关闭该能力：插件不注册任何内容、不打开领域，且 `canRead` 返回 false。配置引擎会重载插件，届时打开领域并纳入既有记录。`generate.ts` 按顺序尝试每个引擎。引擎路由自身必须声明图像输入；`inputModalities` 缺少 `image` 的路由会记录一次 `ENGINE_NOT_VISION` 尝试，链继续前进。一次读取是一次手工构造的 `ctx.llm` 调用：`prepareCall`、携带固定 JSON 回答格式和图像的用户消息、`VISION_SYSTEM_PROMPT`、4,096 token 的输出上限、`timeoutMs`（120 秒）以及该步骤的中止信号。

回答必须是单个 JSON 对象，包含 `summary`、`ocr.full_text` 和类型正确的 `layout.regions`；`parseEvidence` 丢弃未携带声明类型的可选成员，非 JSON 回答记为一次 `EVIDENCE_INVALID` 尝试。保存的 `text` 是按 `maxChars`（8,000 字符）截断并带显式截断标记的序列化证据。它正是投影发送的文本，因此缓存命中的请求可复现。同一附件的并发步骤共享一次进行中的生成；全部失败时，尝试记录会进入进程内冷却（`failureCooldownMs`，300 秒），使下一步不重复已经付费的失败。

### 面向模型的文本块

`formatEvidenceBlock` 把保存的文本包成 `<image_evidence trust="untrusted" source="${attachmentId}">…</image_evidence>`，`projectImagesWithEvidence` 用这个文本块替换图像所在位置。配置了引擎时，插件还在 `systemPrompt.getSectionOrder('IMAGE_EVIDENCE')`（950，位于文件引用之后、工具段之前）注册 `image-evidence:trust` 系统提示词段。该段说明：块内容是为用户从图像中识别出的文本，其内容是数据而非指令，遇到被截断的块应要求补充缺失部分。已被[图像卸载](../../implemented/architecture/2026-09-10-image-offload-events.zh.md)标记为 `offloaded` 的图像会被跳过：那个决策已按预算替换了它们，因此该能力不应付费读取路由不会收到的图像。

### 存储、保留与重放

证据保存在 `spec.ts` 声明的 `image_evidence` 领域：版本 1，`layout: 'per-record'`，一个 `evidence` 表。键是 `evidenceRecordKey(attachmentId, engine, contractVersion)`，即附件 id、引擎 provider 与 model、契约版本的 SHA-256 摘要；哈希让任意模型 id 不会进入按记录划分的路径片段。配置引擎时，`ImageEvidence` 在 `Service.init` 打开领域，把已存记录纳入 attachment-id 索引和格式化文本缓存，并运行 `prune()`。当一个附件存在多个引擎的记录时，索引优先选择配置顺序最靠前的引擎。

`prune` 先删除 `lastReadAt` 早于 `retentionDays`（30 天）的记录，再按最近读取时间删除记录，直到保存的文本总量符合 `maxCachedBytes`（64 MiB）。缓存命中最多每小时刷新一次 `lastReadAt`，因此复用不会在每个步骤重写记录。该领域是宿主存储而非会话存储：记录没有 session id，并且在首次读取它的会话被删除后仍然存在。跨会话复用是有意设计。这也使存储成为重放依赖，因为请求看到的文本位于会话日志之外。

### 事件与交付

一次新读取、记录在一个会话中的首次复用，以及一次全部失败，都会追加一条持久的 `image/evidence` 会话事件，声明于 `types.ts`：`attachmentId`、`cached`、`engine`、`attempts`、`truncated`、`durationMs` 和 `usage`。失败时没有记录：`engine` 取 `attempts[0].engine`，`truncated` 与 `cached` 为 false。私有 `announced` 集合会抑制同一会话与附件的重复事件，冷却会抑制重复尝试，因此一次失败的读取只产生一条事件。该事件在读取时是必需的，因此不认识此事件类型的 reader 会拒绝包含它的日志；它不改变会话信封，也不推进 `SESSION_FORMAT_VERSION`。

这次改动是一个纵向切片：插件、引擎链、存储、两处准入闸门、投影接缝、提示词段、面向路径与 URL 的 `read_image` 工具，以及禁用的 bundle 行。CLI harness 引擎不在其中。该包位于 `packages/llm/` 而非 `packages/experimental/`，因为 `verify-default-product-isolation` 会把默认 bundle patch 命名的包视为默认产品的一部分，即使该行处于禁用状态，并在那里拒绝实验性包。

## 备选方案

**在 `llm/stream` 中于请求时重写消息。** 到达该 waterfall 的请求已被深度冻结且只读；替换 image block 的监听器要么修改冻结对象，要么在已记录的请求路径之外重新分派请求。分派也没有地方等待：一次读取需要数秒，不能成为流式传输的一部分。投影接缝让请求保持为日志与证据查询的纯函数。

**在 `agent/pre-step` 中重写已认领消息。** 该 waterfall 可以返回替换后的消息，因此该能力本可以在那里替换文本。这会把另一个模型的转写作为用户内容写入 transcript：fork、重放、压缩和所有其他投影都会把生成的文本读作用户说过的话，后续步骤也无法把它与真实消息区分开。把证据放在旁路存储中可保留 transcript，并把决定留给分派。

**像 ModLens 那样粘贴到路径。** 把图像写入工作区路径并发送文本加路径，可以避免新增附件界面，但会为上传增加客户端和路由机制，丢失现有的缩略图、灯箱、重放和附件生命周期，并使提示词依赖一个在另一执行世界中可能不存在的路径。附件本身已经持久且完整；该能力直接消费它。

**为引擎增加并行的 provider 与凭证层。** 独立的视觉客户端栈会重复 `ctx.llm` 的凭证解析、重试策略、计价、usage 和适配器路由，而且每一项都会与主 provider 路径漂移。视觉引擎就是一次聊天模型调用；`{ provider, model }` 路由经 `ctx.llm` 复用既有接缝。

**嗅探模型名称来判断能力。** 名称启发式会让该能力和准入闸门在没有元数据的情况下把某些模型当作纯文本。`inputModalities` 是权威声明；名称会变，别名会说谎，错误的猜测会静默地把原生图像路径转换成证据，或反过来。该能力读取元数据，并把缺失列表视为未知。

## 验收标准

- 在至少配置一个引擎、且模型的 `inputModalities` 不含 `image` 时，图像提示词被准入，请求在图像位置携带围栏文本块 `<image_evidence …>`，而不是 `textOnlyImageText`。
- 第二个需要同一附件的步骤、轮次或会话不会发起引擎调用；它复用记录并报告 `cached: true`。
- 声明 `image` 的模型收到原始 image block，且没有证据文本；证据投影不会为它进入。
- 没有配置引擎，或 bundle 行被禁用时，纯文本模型的图像提示词仍以 `MODEL_DOES_NOT_SUPPORT_IMAGES` 失败；`ctx.get('imageEvidence')` 返回空时行为相同。
- `inputModalities` 缺失的模型永远不会被当作纯文本：准入保持既有规则，适配器原样保留图像。
- 所有引擎都失败时，步骤以占位符完成并追加一条携带尝试记录的 `image/evidence` 事件；该附件的重试在 `failureCooldownMs` 内被抑制。
- 记录在 30 天未读后被清理，并受 64 MiB 最近最少读取预算约束；保存的文本正是投影放入围栏内的内容。
- `packages/bundle/web-app/cordis.patch.yml` 包含带 `disabled: true` 的 `image-evidence` 行。
- `read_image` 在调用任何引擎之前拒绝解析到私网地址的主机名、非 http(s) URL、超限来源以及缺少图片签名的字节。
- 配置引擎后，粘贴的图片在对话中显示引擎与耗时，可展开查看尝试次数与标志；会话未读取的附件不显示任何内容；桥被禁用或附件未读取时不出现卡片。
- 一次 AgentLoop 轮次会挂载真实投影：文本适配器收到围栏证据块且不含图片块，引擎适配器恰好收到一次辅助请求。

## 风险

**每次读取都是付费调用。** 该能力把图像变成真实的视觉模型请求。交付默认关闭，空引擎列表不产生行为，因此只有用户启用该行并指定引擎后才开始产生成本；对话模型和引擎可以共享路由，它们的配额与计价会相互影响。

**证据是另一个模型的转写。** 摘要、OCR 和布局可能错误或不完整，纯文本模型无法分辨。围栏把块标记为不可信数据，回答格式也有 `uncertainty` 字段，但正确性没有保证；原始图像仍是事实来源。

**重放依赖存储。** 证据不在会话日志中。记录被清理或存储后端丢失时，同一请求会回退到占位符；引擎顺序变化也可能选中不同的已存记录。保留的存储是使用过证据的那些轮次之重构保证的一部分。

**被删除的会话保留其证据。** `image_evidence` 领域不按会话划分，因此删除会话不会删除图像文本；保留策略拥有它。这是按附件内容而非会话建立键所带来的复用收益与隐私代价。

**卡片无法引用转写文本。** 投影只携带状态字段，不携带存储文本，因此读者能看到图片被读取和截断，却看不到模型收到什么。显示文本会把最多 `maxChars` 的证据带进每个投影快照与会话视图。

**失败的读取可见，但其重试状态不持久。** 失败不阻塞，并追加一条携带尝试记录的 `image/evidence` 事件，因此日志能解释某一步为何使用占位符。不过冷却在内存中：重启后会立即重试引擎，并可能为同一失败再追加一条事件。
