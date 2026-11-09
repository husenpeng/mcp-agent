# Agent Note: 机器人平台的产品形态、运行时与 A2A

Status: proposed

[English](2026-10-29-robot-platform-product-architecture.md) | 中文

## 问题

今天的机器人是一条带聊天界面的 Session。DS Bot 插件把限制暴露得很清楚：每个 Bot 都是某个工作区里的一条 Session，靠对话创建、靠设置页配置、只能通过消息触达。地位、执行逻辑、能力边界和输入输出契约都不属于这个对象，它的 A2A 路径也只是一次邮箱写入，没有重试、去重或跨进程投递。

Tomato 已经拥有持久化部件——Session 日志、投影、jobs、schedule、goal、subagent、preset、deliverables、credentials、sandbox 与审批——但没有一个包把机器人当成有版本、可运行、可检查的进程来拥有。用户看不到有哪些机器人、它们正在做什么、可以碰什么、消费和产出什么、以及它们如何互相调用。

## 提案

### 产品形态

1. **机队视图。** 默认页以卡片列出机器人，显示状态、当前 run、队列深度、剩余预算、最近失败和待审批；筛选覆盖团队、能力和状态。
2. **机器人详情。** 标签页展示 Spec（渲染、可编辑、可 diff）、Runs（时间线与回放）、Tasks、Comms（带因果链的 A2A 消息）、Memory 和 Artifacts。
3. **任务看板。** 任务按 `queued`、`running`、`waiting`、`done` 和 `failed` 分组，显示负责人、截止时间、依赖边和验收标准。
4. **Run 追踪与收件箱。** 一次 run 渲染完整时间线——输入信封、组装后的上下文、计划、每次模型请求、工具调用、A2A 调用、产物、花费和结果——并可回放；审批、提问、升级和死信进入同一个收件箱。
5. **创建。** 含五个区块的 spec 向导依次驱动校验、干跑、版本 diff、发布和实例化。对话可以起草 spec；它永远不能直接发布。

### 领域模型

| 对象 | 契约 |
|---|---|
| `RobotSpec` | 有版本的规格；已发布的 revision 不可修改 |
| `Robot` | 绑定一个 spec revision 的实例；拥有邮箱、执行槽和状态 |
| `Run` | 一次激活；一条 Session 日志；可重放 |
| `Task` | 带负责人、依赖边、截止时间、验收标准和产物的工作单元 |
| `Envelope` | 引用 task、trace、产物和记忆的 A2A 消息 |
| `MemoryRecord` | 带 namespace、来源、状态和过期时间的条目 |
| `Artifact` | 带类型、版本和存储引用的产出 |
| `Approval` | 阻塞 run、并以输入恢复它的人工决定 |

- 控制面事件与每次 run 的 Session 日志是唯一事实源；所有视图都是投影。
- 每个对模型可见的输入都能从该次 run 的 Session 重建。
- 每个副作用都带幂等键和补偿记录；未知结果必须上报，绝不当作成功。
- 每次跨机器人调用都在发送端和接收端做权限检查；没有授权即拒绝。
- 规格变更不影响在途 run；新的 run 绑定新的 revision。

### 规格即创建契约

| 区块 | 字段 |
|---|---|
| 地位与权限 | 负责人、`reportsTo`、调用方、被调用方、升级路径、可见范围 |
| 目标与执行 | mission、成功判据、触发条件、策略、停止条件、失败策略、预算、并发 |
| 能力与边界 | 工具白名单与黑名单、MCP 服务器、skill、工作区根、数据分级、凭据引用、sandbox 与权限预设、网络策略 |
| 输入与输出 | 输入 schema 与版本、输出 schema、产物格式、交付目标、验收标准 |
| 记忆与 A2A | 读写 namespace、保留期、召回策略、允许的 intent、每对端的预算与速率、需要对端审批 |

1. 表单与 YAML 文档编辑同一份 spec；JSON Schema 校验把错误定位到字段。
2. 发布时用 mock 工具和录像模型输出执行干跑，并展示样例 run 追踪。
3. 发布时展示与上一 revision 的 diff；已发布的 revision 不能编辑，只能被取代。
4. 缺少依赖——模型、凭据、工作区、MCP 服务器、权限预设——时实例化失败。

### 运行时与 run 生命周期

- 机器人状态：`provisioning`、`idle`、`running`、`paused`、`failed`、`stopped`。
- Run 状态：`queued`、`leased`、`running`、`waiting`、`finalizing`、`succeeded`、`failed`、`cancelled`、`timed_out`。
- 触发器：手动、cron、事件主题、webhook、依赖完成、阈值。Schedule 只触发一次，不负责调度 run。
- 一次 run 先取带心跳的租约，再组装 spec revision、记忆快照和输入信封，随后计划、执行各步、写入产物、finalizing、写回记忆并通知。
- 每个机器人一个执行槽；队列顺序按优先级与公平性；崩溃后租约过期并重新排队，幂等键防止重复副作用。
- 预算覆盖 token、墙钟时间、成本和工具调用数，在步边界检查；耗尽时按 spec 的降级、暂停或失败策略处理。
- 失败分类为 `transient`、`permanent`、`policy` 和 `unknown`；策略决定退避重试、熔断、升级或死信。finalizing 总是记录结果、花费、产物和记忆候选。
- 审批阻塞 run；决定以输入信封恢复它。

### A2A 协议

```json
{
  "id": "msg_...",
  "traceId": "trace_...",
  "conversationId": "task_...",
  "from": "robot:a",
  "to": "robot:b",
  "intent": "request|accept|reject|progress|result|error|cancel|delegate|escalate|event|ack",
  "schema": { "id": "review.request", "version": 1 },
  "payload": {},
  "refs": { "taskId": "...", "artifactId": "...", "memory": ["..."] },
  "deadline": "2026-10-29T12:00:00Z",
  "ttlSeconds": 3600,
  "priority": "normal",
  "budget": { "tokens": 50000, "millis": 600000, "cost": 0.5 },
  "idempotencyKey": "...",
  "replyTo": "msg_...",
  "lineage": { "depth": 2, "chain": ["robot:user", "robot:a"] },
  "policy": { "approval": "none", "dataClass": "internal" }
}
```

- `request` 返回带原因的 `accept` 或 `reject`，然后零个或多个 `progress`，最后是 `result` 或 `error`；accept 可以协商截止时间和预算。
- `delegate` 转移 task 的负责人；`request` 保留负责人。
- `cancel` 是协作式的，向子任务传播；已经产生副作用的接收方报告补偿或未知结果。
- `escalate` 携带上下文包送到 `reportsTo` 上的下一级权威。
- `event` 发布到主题且不期待回复；`ack` 表示接收方已把信封写入日志。
- 每个机器人有一个持久邮箱，投递语义为 at-least-once，并按 `idempotencyKey` 去重；顺序只按 `conversationId` 保证，不是全局顺序。
- TTL、重试退避和死信队列属于邮箱；传输是能力缝，进程内、HTTP 和 ACP 提供者承载同一种信封。
- `lineage.depth`、每 task 消息预算、每 run 对端调用预算和链路环检测共同阻止 A2A 成环。
- 发送端与接收端都检查 ACL，`policy.dataClass` 限制载荷，每对端有速率限制，每个信封都进审计；拓扑覆盖点对点、主管链、主题总线、房间广播和可选的招标。

### 共享记忆与召回

- Namespace：`robot:<id>`、`team:<id>`、`task:<id>`（黑板）、`user:<id>`、`workspace:<hash>`。
- 记录包含 entity、key、value、kind、namespace、来源、置信度、状态（`candidate` 或 `active`）、pinned 和过期时间。
- 机器人写自己的 namespace；team namespace 需要权威或显式授权；所有 task 参与者都可写黑板。
- `recall(query, namespaces, filters, limit)` 返回带来源的排名记录；检索是混合式的，注入遵守字符预算。
- 系统提示中的记忆段在 run 启动时冻结；run 期间写入的内容通过 `recall` 可见。
- A2A 消息携带记忆引用而不是复制值；task 结束后黑板归档到 team 或机器人 namespace。
- 写回结合自动复盘与显式 `remember`；每次变更都进 journal，并可被遗忘或过期。

### 包拓扑与控制面

| 包 | 职责 |
|---|---|
| `@tomato/robot` | 服务定义 `ctx.robots`：spec 注册、revision、生命周期、校验 |
| `@tomato/robot-runtime` | 提供者：触发、租约、基于 jobs 与 agent 的 run 编排 |
| `@tomato/robot-a2a` | 信封、邮箱、投递、重试、防环；本地、HTTP 和 ACP 传输 |
| `@tomato/robot-memory` | 多 namespace 记忆与召回 |
| `@tomato/tool-robot` | 面向模型的调用与查询工具；没有工具能写 spec |

| 现有能力 | 包 |
|---|---|
| 持久日志与视图 | `session`、`session-projection`、session kind |
| 后台执行与定时 | `jobs`、`schedule` |
| 目标、计划、工作流 | `goal`、`plan-mode`、`workflow` |
| 规格到 agent | `preset`、`persona`、`subagent` |
| 产物与边界 | `deliverables`、`workspace`、`credentials`、`sandbox`、`permission-presets`、`interaction` |

- 团队级 `robot-control` Session 保存 spec 发布、roster、task 和邮箱事件；每次 run 有自己的 Session；`storage-domain` 为两者建索引。
- 持久事件属于 `robot/*`、`task/*` 和 `a2a/*` 领域；机队视图、任务看板和 Comms 都是投影。
- 能力缝三角齐备：`@tomato/robot` 定义 `ctx.robots`，`@tomato/robot-runtime` 提供实现，UI、API 和工具消费它。
- 切片 1 以 `@tomato/experimental-robot`、`@tomato/experimental-robot-local` 与 `@tomato/experimental-robot-runtime` 落地服务定义、存储提供者与执行器；晋升把定义与执行器映射为 `@tomato/robot` 与 `@tomato/robot-runtime`，存储提供者保持为本地实现。
- 切片 2 以 `@tomato/experimental-robot-triggers` 落地 cron 与事件触发器；webhook、依赖与阈值触发器等待各自的领域。
- 远程机器人使用 A2A 传输提供者加 ACP 或 SDK；跨主机时使用签名身份与端到端权限。

### 交付切片

1. 领域模型、控制面日志、spec 校验与 revision、单主机手动 run、Run 追踪。
2. 触发器、队列、租约、预算、失败语义和审批。
3. A2A v1：邮箱、信封、请求/响应/取消、追踪和防环。
4. 共享记忆：namespace、召回、黑板。
5. 团队编排：主管链、任务 DAG、升级、`reportsTo` 权威、任务看板。
6. 远程机器人、HTTP/ACP 传输、多主机。
7. 运维：配额、审计、指标、备份、迁移和升级指南。

### 既定决策

1. 控制面是 `robot-control` 类型的 Session，不是独立事件存储。切片 1 把持久状态放在 `tomato_robot` 存储域中，因为持久 Session kind 需要一次会话格式变更；Session 日志控制面仍是回放与投影的目标。
2. 每次 run 使用独立 Session，不是每个机器人一条长 Session。
3. 首个 A2A 传输是本地邮箱；HTTP 沿用同一信封。
4. 共享记忆是新包 `@tomato/robot-memory`，不扩展 `@tomato/experimental-memory`。[长期记忆提案](../feature/2026-11-05-long-term-memory-for-muse-and-robots.zh.md) 修正了这项决定：`ctx.memory` 保留唯一读取面与按作用域的写入策略，`@tomato/robot-memory` 成为面向机器人的策略与组装层。
5. 权威模型同时使用 `reportsTo` 与能力 ACL；单独任何一个都不够。

## 备选方案

**基于 DS Bot 构建** —— 否决：它把机器人绑定到聊天 Session，创建路径是对话，机器人之间的投递没有重试、去重或跨进程保证。借鉴它的界面经验不等于复用它的产品模型。

**以聊天为主界面** —— 否决：聊天记录无法显示队列深度、预算、依赖边或待审批，而且会把每个操作都变成消息。对话保留为干预通道。

**每个机器人一条长 Session** —— 否决：它把每次 run 的上下文、预算和回放与之前所有 run 耦合，让取消和重试含混不清，并迫使压缩机制承载执行状态。按 run 划分的 Session 让每次激活都可检查。

**为控制面单独建事件存储** —— 否决：Session 日志已经提供持久追加、回放、投影、导出和迁移。第二个存储只会为同一批事实增加第二套一致性模型。

**扩展 `@tomato/experimental-memory` 以支持 team 和 task namespace** —— 否决：它的所有者是账户或工作区，记录是个人或工作区事实，写入路径需要用户确认。机器人记忆需要 agent 自主写入、task 黑板和跨 agent 的来源信息；可以共享记录与召回代码，但不应合并服务。

**以 HTTP 作为首个 A2A 传输** —— 否决：它会在本地协议语义得到验证之前引入认证、序列化版本和新的失败模式。本地邮箱使用同一信封和投递规则。

**只用能力 ACL，不引入 `reportsTo`** —— 否决：升级、审批和组织可见性需要一条权威链。ACL 回答一次调用是否被允许，不回答两个机器人意见不一致时由谁决定。

**对话驱动创建** —— 否决：它无法预览组装后的提示、工具清单和权限，无法从同一段话复现同一份 spec，而且只有在机器人已经存在后才做校验。对话可以起草；经过评审的 spec 才能发布。

## 验收标准

- 创建机器人需要合法 spec 和已发布 revision；发布前 UI 展示编译后的提示段落、工具清单、权限预设和干跑追踪。
- 每次 run 都能从其 Session 日志重建：输入信封、组装后的记忆、计划、模型请求、工具调用、A2A 信封、产物、花费和结果。
- A2A 投递是带去重的 at-least-once；被取消的 task 把取消传播给子任务，并报告补偿或未知结果。
- 每条召回的记忆记录都带来源；机器人不能读取未授权的 namespace，拒绝记录出现在审计日志中。
- 机队视图、机器人详情、任务看板、Run 追踪、Comms 和收件箱只读投影，并在主机重启后保持正确。
- 上述五个决策反映在包边界上；没有包跨能力缝导入具体提供者。

## 风险

- **控制面争用。** 每个机器人事件都追加到同一个团队 Session。若写入吞吐成为瓶颈，task 与邮箱记录迁到 `storage-domain` 表，Session 只保留审计事件；投影契约不变。
- **每次 run 一个 Session 的开销。** 数千次小 run 会产生大量 Session 目录。保留与归档策略必须属于切片 1，而不是事后补丁。
- **记忆一致性。** 冻结的提示段与实时召回可能显示与冻结段矛盾的事实。Run 追踪必须标注每次请求使用的记忆 revision。
- **远程信任。** 签名信封认证的是机器人身份，不是它的意图。跨主机权限、数据分级和速率限制必须在接收主机执行。
- **规格复杂度。** 五个带 schema 的区块可能压垮首次使用者。模板与引导式表单是产品要求，不是文档。
- **与 Agent Teams 重叠。** 实验性团队包已经拥有 roster 和 task DAG。本提案为生产机器人取代它的模型；没有迁移路径地保留两者会让同一份状态重复存在。