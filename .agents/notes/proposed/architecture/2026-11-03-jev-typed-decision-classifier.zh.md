# Agent Note: Jev 式类型化决策 classifier seam

Status: proposed

[English](2026-11-03-jev-typed-decision-classifier.md) | 中文

## 问题

本仓库只有一个模型 seam：`ctx.llm`，而且它输出的是流式聊天补全。于是每一个闭集判断都得先写成聊天请求、再把结果解析回来：`@tomato/experimental-auto-review` 发送固定策略加上整段待执行动作，要求模型回一个 JSON 对象，再手工校验成员集合（[源码](../../../../packages/experimental/auto-review/src/index.ts)）。生成延迟和输出 token 花在一个本可事先枚举的答案上，一旦格式走样整个调用就失败。

每次安装都已依赖的 `@earendil-works/pi-ai` 恰好提供了第二种模型类型：`ClassifierModel`（`type: 'classifier'`）、`Models.classify()`，以及四个 classifier API——`typesafe-system-one`、`cloudflare-workers-ai-system-one`、`llama-cpp-classify`、`openai-decisions`。它的目录里带着 TypeSafe 托管的 `jev-latest`，base URL 为 `https://api.typesafe.ai/v1/`，state 窗口 64,000 token；而 `@tomato/llm-pi-ai` 因为 `servesChat()` 要求存在聊天模型，故意把这条路由从聊天侧剔除（[catalog](../../../../packages/llm/llm-pi-ai/src/catalog.ts)）。也就是说，仓库里躺着一个能用的 Jev 客户端却够不着，而唯一的类型化决策路径是聊天补全加手工解析。

## 提案

新增第二个模型 seam `ctx.classifier`，按 `ctx.llm` 的 provider 注册表建模，并把类型化决策的消费者迁到它上面。第一期是 `@tomato/experimental-auto-review`，第二期是工具结果裁剪。

### seam 本身

`@tomato/experimental-classifier` 定义服务并拥有词汇：请求是 `{ state, questions, model? }`，每个 question 是 `choice`（instructions 加 criteria 映射）、`score`（instructions 加有序 criteria）或 `bool`（instructions 加 true/false criteria）；verdict 是每个 question 的类型化答案，带概率与 confidence。provider 注册到服务上并返回 disposer，重名直接抛错，未注册的 provider 立即失败而不是退回聊天。请求与 verdict 类型刻意与 pi-ai 的 `ClassifierContext`、`ClassifierResult` 对齐：seam 是 provider 中立的，pi-ai 只是其中一个实现，不是契约本身。

`@tomato/experimental-classifier-pi-ai` 基于 `Models.classify()` 实现该 seam，于是四个已安装的 classifier API 变成配置而非代码：`typesafe-system-one` 接托管 Jev，`llama-cpp-classify` 接本地 `llama-server`，`cloudflare-workers-ai-system-one` 与 `openai-decisions` 接说同一套类型化契约的其他厂商。provider、model、base URL、凭证引用、超时、confidence 下限与失败关闭行为都是 `Config` 字段，没有任何常量。

### 零配置

挂上 bundle 就是部署要做的全部。激活时 provider 按固定顺序解析后端：配置里写明的端点 → 文档端口上健康的本地端点 → 缓存里已有的模型 → 按统一内存总量选档的首次下载。后端缺失不是崩溃：消费者留在聊天路径上，一条可见的状态行说明缺的是哪个后端、为什么。配置字段用来覆盖解析结果，从不决定它能否工作。

### 记录与重放

verdict 会改变 harness 的行为，因此必须可重建。该 seam 每次调用追加一个 `decision/verdict` session 事件，携带用途、provider、model、question id、answers、生效的 confidence 下限与耗时；消费者引用该 seq。重放读取该 verdict，绝不再调用 classifier，规则与 compaction 对其已记录决策的处理一致。对不认识该事件的读取方它是可忽略的，因为它解释了一个决定，而不是替换历史。

### 第一个消费者：Auto review

`classifyRisk` 改为对它已经冻结的同一份快照提两个 question：`risk` 是以 low、medium、high 为选项的 `choice`，criteria 就是现行策略文本；`authorized` 是 `bool`，判断当前用户或直接父级指令是否授权了这次动作及其范围。决策表保持策略已经写明的同一套：high 一律拒绝；low 放行；medium 仅在 `authorized` 为真时放行；任何低于 `confidenceFloor` 的答案在 `ask` 审批策略下转为询问用户，在 `never` 下转为拒绝。verdict 只能削减权限——`ToolGuard` 与审批路径保持不变，classifier 失败时维持今天的失败关闭行为。

### 工具结果裁剪

`@tomato/compaction-tool-result-pruner` 目前按字符预算裁剪，不做任何模型调用（[源码](../../../../packages/compaction/compaction-tool-result-pruner/src/index.ts)）。第二期对每个超限结果提一个 `score` question——保留、截断、删除——并把 verdict 记录在现有 shadow-price 事件旁边，使裁剪后的投影仍然可重放。这一期要等 seam 离开 experimental 分组：发布包不能依赖 experimental 包，因此裁剪的改动与该次提升一起落地。

## 在 macOS 上自托管

TypeSafe 的 Jev 没有开放权重：已安装目录里只暴露一个托管 classifier id `jev-latest`，地址 `api.typesafe.ai`，没有可 vendor 的东西。能本地跑的是独立的 Open-Jev 发行（MIT 代码，含决策头、LoRA adapter 与校准，跑在被钉住版本的 Qwen 基座权重上），或者 Simple Jev——从任意 Hugging Face 模型读 next-token logits。未训练的 `kyegomez/open-jev` 只有架构。

本地服务不需要新的客户端代码。Open-Jev 在 `POST /v1/systemone` 上应答 TypeSafe 的 wire 形状，pi-ai 的 `typesafe-system-one` 传输把 `{ model, ...request }` POST 到 `${baseUrl}/systemone`，因此把该路由的 base URL 指向 `http://127.0.0.1:8791/v1` 并填一个占位凭证，就能打到本地进程。兼容是部分的，所以每种 question 类型都要先发一次 smoke 请求，才可信任这个 provider。

这些路线都不经过聊天网关。没有 Jev 路由的第三方 provider 继续做聊天传输，而 classifier 端点是一个独立的 loopback 服务，所以替换、限流或失去那个网关都不会把类型化决策一起带走。

llama.cpp 是最短的离线路线，且不需要 Python。`llama-server` 暴露的 tokenizer、template 与对数概率端点正是 `llama-cpp-classify` 已经在调的，因此本地的 GGUF 模型无需决策头、也无需运行时下载，就能回答同一套类型化问题。它给的是聊天模型的标签分布，不是训练过的决策头，所以适合先做分诊，再谈授权闸门。

本地硬件受制于 MPS 路径，而不是模型质量。唯一有文档的 Apple Silicon 组合是 2B 包配 `--device mps` 与 `JEV_TORCH_DTYPE=float32`；MPS 不支持 bitsandbytes 的 4/8-bit 加载，所以 16 GB CUDA 显卡那套放置技巧搬不过来。

| 统一内存 | 模型包 | 依据 |
|---|---|---|
| 8 GB | 无 | 仅 2B 的 float32 权重就约 8 GB |
| 16–24 GB | 2B，`--device mps`，float32，`--max-length 4096` | 有文档的组合；Mac 上没有公开延迟数据 |
| 32–36 GB | 2B 舒适；9B 只能在降精度下做实验 | 9B 的 float32 权重约 36 GB，float16 路径数值未验证 |
| 48–64 GB | 9B 走 float32，或 float16 但要留余量 | 16 GB CUDA 的放置配方不适用于 MPS |
| 96–128 GB | 9B 舒适；27B bf16 属于边际 | 27B v1.1 在 H100 上单次请求峰值 54.1 GiB |
| 192 GB | 27B bf16 | 在 MPS 上仍未验证 |

对团队来说更省事的切分是：Linux GPU 主机跑 Open-Jev，Mac 只跑 harness——客户端改动仍是同一个 base URL，而 9B 在那边用贡献者的放置配置就能塞进一张 16 GB 卡。

## 备选方案

**改用 MCP server。** `jkudish/jev-mcp` 与 `itsmostafa/typesafe-mcp` 把类型化判断暴露成 MCP 工具，核心代码零改动。但它把调用点交给模型选择，因此无法在派发前拦截工具调用，还要在上下文里付出工具定义与结果的 token，并且 verdict 只是建议性的。适合用来打磨 question 设计，不适合作为接入方式。

**保留聊天加 JSON。** 即现状。它能用，而且需要成篇散文的判断只有它能做。代价是每个决策一次完整生成、需要 auto review 里那套手写解析器，也用不上 64,000 token 的 state 窗口做单次 prefill。

**自托管 Open-Jev。** `Zefan-Cai/Open-Jev` 的代码是 MIT，发布 LoRA adapter、决策头与校准，跑在被钉住版本的 Qwen 基座权重上，以 `/v1/systemone` 提供服务（[仓库](https://github.com/Zefan-Cai/Open-Jev)）。它消除了数据出境，但要多一套 GPU 服务，而且它自己的公开对比显示 27B v1.1 在 JevBench 上低于托管 Jev。等 seam 存在之后，它是 provider 变体，不是第一版接入。

**现在就用本地 `llama-cpp-classify`。** 该实现已经装好，从 `llama-server` 读取标签 token 的对数概率而不生成答案。质量取决于所服务的模型，因此它适合作为廉价的本地分诊 provider，在保留会话基准测试之前不适合承担授权闸门。

**把 Jev 硬编码进 Auto review。** 一个包，没有 seam。下一个消费者会复制客户端、配置与日志逻辑。

## 验收标准

- `ctx.classifier` 对三种 question 返回类型化答案，派发到配置的 provider，并在 provider 未知、配置非法或 provider 未返回某个 question id 的答案时明确失败。
- 走 classifier 路径的 Auto review 在留存语料上给出与聊天评审相同的拒绝、询问、放行结果，且其配置中写明 confidence 下限与失败关闭设置。
- 每一个改变了行为的 verdict 在 session log 中出现一次，重放该会话不调用 classifier 即可复现相同决策。
- 移除 provider 包即恢复今天的行为，无需其他配置改动。
- 模型可见的变化带上更新后的录制会话快照，新包满足按文件覆盖率门槛。

## 风险

- **verdict 不是授权。** Jev 的 confidence 是间隔余量，不是"答案正确"的概率，而被评审的 state 里含不可信的工具输出，注入的指令有可能移动答案。缓解手段是结构性的：确定性 guard 与审批照常执行，verdict 只能削减权限，high 风险保持只能拒绝。
- **数据出境。** Auto review 的 state 包含工具参数与会话事实。把它们发往 `api.typesafe.ai` 会新建一条信任边界，本地 provider 则不需要；provider 选择属于部署决策，不是默认值。
- **校准漂移。** confidence 下限只对本部署的数据有意义。从文档里抄来的下限可能悄悄放行本应询问的动作；它必须在留存会话上实测，并在 provider 或模型更换时重测。
- **计费。** 已安装目录把 `jev-latest` 定价为零，token meter 会报出虚假的零成本。要么 provider 如实上报 usage，要么 seam 把成本记为未知而非免费。
- **两个模型 seam。** `ctx.llm` 与 `ctx.classifier` 不能长出重叠职责；规则是：需要生成文本的请求走 `ctx.llm`，需要可枚举答案的请求走 `ctx.classifier`。