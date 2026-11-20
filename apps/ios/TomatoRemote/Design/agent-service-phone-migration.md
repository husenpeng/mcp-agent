# Tomato Phone × agent_service 迁移方案（目标 + 端到端改动）

> 状态：方案稿，等排期。基线：`feature/im_agent_service` worktree（含未提交 WIP）。
> 相关仓库：`services-monorepo-im`（服务端）、`client-monorepo`（BFF）、`tomatoHarness/apps/ios`（手机端）。

## 1. 目标

把 Tomato Phone 的**对话 agent** 从「手机上自己跑 loop + 直连 relay + 手机 Key」迁到 agent_service：

1. 模型循环、工具执行、会话与记忆、配额与审计全部在服务端；
2. 手机本地技能（指令型文本）能注入服务端上下文，装/卸在下一轮生效；
3. 手机端不再保存模型 Key，模型由服务端 agent/model route 决定；
4. 手机保留：会话列表、历史、附件（图片/文档）、停止、审批、断线恢复。

### 非目标（本次明确不做）

- 手机本地 MCP 工具（回环/私网地址、Keychain 令牌）——服务端不可达，退出本方案；
- 手机操控 runner（读屏/点击/输入）——只有 loopback 可达，循环必须留在端上；
- 卡片（card_type）交互、子 agent、workflow、定时任务、goal——不在手机端第一版暴露。

### 验收标准

| # | 场景 | 通过条件 |
|---|---|---|
| A1 | 文本对话 | 手机发消息 → 服务端模型回答，SSE 流式渲染，会话可回放 |
| A2 | 本地技能 | 手机启用 2 个技能建会话 → 服务端每轮注入技能索引 → 模型调 `load_skill` 取正文并遵守 |
| A3 | 技能变更 | 手机装/卸技能后**下一轮**生效，无需新建会话 |
| A4 | 附件 | 相册图片 / 文档上传 → 服务端解析（图片 OCR、文档抽文本）→ 回答引用内容 |
| A5 | 审批 | 写类工具触发审批 → 手机弹出批准/拒绝 → 结果回灌本轮 |
| A6 | 会话管理 | 列表（标题/预览/时间）、改名、删除后列表消失、历史分页 |
| A7 | 稳定性 | 停止可取消；断网重连按 seq 续播；无模型 Key 也能用 |
| A8 | 会话互通 | 手机新建的会话出现在网页端列表，网页端继续对话后手机能看到新消息；改名/删除两边一致 |

## 2. 基线现状（决定改哪、不改哪）

| 项 | 现状 |
|---|---|
| 服务端基线 | `services-monorepo-im` 的 `feature/im_agent_service`（44 个文件未提交改动）。会话列表 / 历史消息 / 改名 / 标题自动生成已实现；无删除、无联网工具、无端侧技能 |
| skill 机制 | 已按 ADR-0014 改为「每轮查已安装摘要 + `load_skill` 现查正文」，pins 不再存 skill 正文；`preload/conditional/on_demand` 已取消 |
| BFF | `client-monorepo/apps/web/app/api/agent-v2/*` 已有 sessions / turns / stream / cancel / messages / memory；**缺 attachments、approvals**；`X-Client-Id` 固定 `web` |
| 手机端 | `PhoneAgent/AgentCore.swift` 本地 loop（OpenAI/Anthropic 双协议、8 步、本地工具、Keychain Key）；会话存手机；能力市场含 MCP + 技能 + 插件 |
| 认证 | 手机已有 auth_service 会话（`AccountAuthStore.sessionId`，BFF cookie 名 `session_id`），可直接过 BFF 校验 |

**要作废的中间产物**：`feat/agent-service-client-skills`（基于 main 的 pins+preload 版 `clientSkills`，提交 `999120aa`）与 ADR-0014 冲突，不合并。

## 3. 目标架构

```
Tomato Phone (iOS)
  │  1) POST /api/agent-v2/sessions {clientSkills[]}
  │  2) PUT  /api/agent-v2/sessions/{id}/client-skills   (技能变更)
  │  3) POST /api/agent-v2/sessions/{id}/turns {text, attachments[]}
  │      GET  .../turns/{turnId}/stream?afterSeq=     (SSE)
  │      POST .../turns/{turnId}/cancel
  │      POST .../approvals/{approvalId} {decision}
  │      GET  .../sessions?… / .../messages?… / PATCH / DELETE
  ▼
Web BFF (Next.js, auth_service 会话)
  │  X-Client-Id: web（与网页端同一 client，会话互通）、X-User-Id、X-Internal-Token
  ▼
agent_service（feature/im_agent_service）
  ├─ 会话/轮/事件/审批/附件/记忆（已有）
  ├─ 每轮注入：skill-service 已安装摘要 + 本会话客户端技能摘要
  ├─ load_skill：先查会话客户端技能，再查 skill-service
  ├─ web_search / fetch_url（新增内置工具）
  └─ DELETE /sessions/{id}（新增，软删）
```

## 4. 协议契约

### 4.1 会话与轮（沿用，手机侧只消费）

- `POST /sessions` → 201 `{sessionId, agentName, agentRevision, pins, title, createdAt, lastActiveAt}`；可选 `modelRoute`
- `GET /sessions?limit&offset&agentName&keyword&status` → `{items[], total, limit, offset, hasMore}`；每项含 `sessionId/title/preview/turnCount/lastTurnStatus/createdAt/lastActiveAt`
- `PATCH /sessions/{id}` `{title?, modelRoute?}` → 改名 / 切模型；`DELETE /sessions/{id}` → 软删（新增）
- `GET /models` → 可选的 model route 列表（管理面启用的，不含 `default`）
- `GET /sessions/{id}/messages?limit&beforeSeq&includeTools` → 尾部优先分页
- `POST /sessions/{id}/turns` `{text, attachments, cardAnswers}` → 202 `{turnId, status}`
- `GET /sessions/{id}/turns/{turnId}/stream?afterSeq&Last-Event-ID` → SSE
- `POST /sessions/{id}/turns/{turnId}/cancel`
- `GET/POST /sessions/{id}/approvals/{approvalId}`
- `POST /attachments`（multipart）→ `{attachmentId, category, parseStatus, note}`

SSE 帧（沿用现有）：`connected`、`assistant/message`、`tool/call`、`tool/result`、`approval/request|decision`、`turn/end`、`heartbeat`、`error`、`[DONE]`。
手机映射：`assistant/message.text` → 正文；`tool/call` + `tool/result` → 工具行；`approval/request` → 审批卡；`turn/end` → 收尾；断线用 `seq` 续播。

### 4.2 客户端技能（新增，按 ADR-0014 语义）

- `POST /sessions` 增加 `clientSkills: [{name, content}]`（可选，≤8 条，单条 ≤128KB，总量 ≤256KB）。
- `PUT /sessions/{id}/client-skills` `{skills: [{name, content}]}`：**整表替换**，下一轮生效；空数组 = 清空。
- `GET /sessions/{id}/client-skills` → 只返回 `{skillId, name, contentHash}`（正文不外发）。
- 服务端存储：新表 `agent_client_skill(session_id, skill_id, name, content, content_hash, updated_at)`，`skill_id = client:<sha256(content)[:16]>`；随会话软删清理。
- 注入：每轮把「客户端技能摘要 + skill-service 已安装摘要」合并成一条索引（`source=client_skill_index` + 现有 `skill_index`），**不注入全文**；模型调 `load_skill(skillId)` 时先查客户端技能表，未命中再走 skill-service（需已安装校验）。
- 安全：客户端技能等同用户输入，标注来源，不授予工具权限；正文只进服务端。

### 4.3 模型选择（新增，会话级）

- 用户可在手机上选模型，选择存在**会话**上，不落手机 Key。
- `POST /sessions` 与 `PATCH /sessions/{id}` 都可带 `modelRoute`；值必须是管理面已启用、且对当前用户可见的 route 名，未知/禁用返回 `MODEL_ROUTE_INVALID`（沿用现有错误码）。
- 存储：写进 `session.pins["model_route"]`（不改 agent revision）；引擎取 `session.pins.get("model_route") or agent.model_route`，按名字在 `runtime.model_routes` 里取。
- 手机端：模型面板改为读 `GET /models`；选择后 `PATCH` 当前会话，下一条消息生效；新会话沿用上次选择（手机本地只存“上次选择的名字”，不存 Key）。
- 档位跟着模型走：`GET /models` 每条带 `thinkingLevel`（路由默认档）与 `thinkingLevels`（该模型允许的档位白名单，空数组 = 不开放 thinking）。两个接口都不按用户/端过滤，所有通过鉴权的 client 看到同一份列表，白名单在两层生效：
  - **调用方 client 白名单**（`X-Client-Id` + 生产 `agent_client` / `AUTH_ALLOWED_CLIENT_IDS`）：决定这部手机能不能调。手机沿用 `web`（与网页端同一 client，会话互通），见 §3 与 §6。
  - **模型/档位白名单**（`thinking_policy.levels`）：决定能选哪些模型、哪些档位。
- `POST/PATCH /sessions` 校验：`modelRoute` 不命中可见路由 → `MODEL_ROUTE_INVALID`（40004）；`thinkingLevel` 不命中该模型 `thinkingLevels` → 同码，文案列出可选档。只切模型时旧档位不在新白名单里，服务端清 pin、回落新模型默认档（下一轮生效）。
- 手机侧对应实现：档位行由所选模型的 `thinkingLevels` 生成（`low/balanced/high/ultra/max` 在前，未知名按字母序接后），未选模型或白名单为空时不提供档位；切模型时本地档位按新白名单收敛，建会话若仍被拒（40004）则清本地档位、改用路由默认档重试。

### 4.4 附件（图片/文档）

- 手机先 `POST /attachments`（multipart，经 BFF → TOS），拿到 `attachmentId`，再在 `turns.attachments` 引用；不把 base64 塞进消息。
- 服务端按现有管线解析：图片 → OCR 成文本，文档 → 确定性抽取；回复里引用解析后的内容。
- 真视觉（多模态透传）不在本次；若需要，后续在附件管线加透传。

## 5. 服务端改动（services-monorepo-im / feature/im_agent_service）

> 交付方式：服务端由指定 agent 实现，任务单见 [agent-service-server-task.md](./agent-service-server-task.md)；本仓不改 `services-monorepo-im`。

先决：让这条分支的 WIP 先提交，作为新基线（当前工作树有 44 个文件未提交）。

| 文件 | 改动 |
|---|---|
| `app/api/dto/session_dto.py` | 增加 `ClientSkill`、`SessionCreateRequest.clientSkills/modelRoute`、`SessionPatchRequest.modelRoute`、`ClientSkillListData` |
| `app/api/session_controller.py` | 增加 `PUT/GET /sessions/{id}/client-skills`、`DELETE /sessions/{id}`；`PATCH` 接受 `modelRoute` |
| `app/service/session_service.py` | 客户端技能写入/替换/读取；删除会话；列表过滤 archived；校验并保存 `model_route` |
| `app/infra/repository/` | 新实体 `client_skill_entity.py` + PG/memory store 实现；migration `002x_client_skill.py`（含列注释） |
| `app/runtime/engine/loop.py` | `_inject_installed_skills` 合并客户端技能摘要；`ToolContext` 增加 `client_skills` 目录；`active_route` 改为 `session.pins.model_route or agent.model_route` |
| `app/runtime/adapters/tools/load_skill.py` | 解析顺序：客户端技能 → skill-service；失败文案统一 |
| `app/runtime/adapters/tools/web_search.py`（新） | 从旧 SDK 版移植豆包搜索（`web_search`），配置走 settings（`DOUBAO_SEARCH_API_KEY`） |
| `app/runtime/adapters/tools/fetch_url.py`（新） | 移植 trafilatura 正文抽取 + 域名黑名单 + 超时重试；SSRF 校验 |
| `app/service/runtime.py` | 注册两个新工具；默认 agent 的 `allowed_tools` 增加 `web_search/fetch_url`（或注册 phone agent 资源） |
| `app/core/settings.py` | `client_skills_max_count / max_bytes / max_bytes_total`、`web_search_* / fetch_url_*` |
| `docs/` | 新 ADR：客户端技能目录（与 ADR-0014 的关系）；technical-design 补端点与注入顺序 |
| `tests/` | `test_client_skills.py`、`test_session_delete.py`、`test_session_model_route.py`、`test_web_tools.py`（内存后端，fake LLM） |

行为不变项：现有会话/轮/SSE/审批/附件接口保持兼容；`clientSkills` 缺省不影响任何调用方。

## 6. BFF 改动（client-monorepo / apps/web）

手机与网页端共用同一 client（`X-Client-Id: web`）与同一套 `/api/agent-v2/*` 路由：会话、消息、改名、删除两边看到的是同一份数据；手机不新建路由族，只补两个缺失的代理。

| 文件 | 改动 |
|---|---|
| `app/api/agent-v2/sessions/route.ts` | 创建时透传 `clientSkills`（现有 `{...raw, agentName}` 已支持，补测试） |
| `app/api/agent-v2/sessions/[sessionId]/client-skills/route.ts`（新） | `PUT/GET` 客户端技能目录代理 |
| `app/api/agent-v2/sessions/[sessionId]/route.ts` | `PATCH` 透传 `modelRoute`；增加 `DELETE`（会话删除）代理 |
| `app/api/agent-v2/models/route.ts`（新） | `GET /models` 代理，供手机模型面板 |
| `app/api/agent-v2/attachments/route.ts`（新） | multipart 流式转发（现有 `proxyToAgentService` 只读文本，需新增二进制路径，保留 content-type 与大小上限） |
| `app/api/agent-v2/sessions/[sessionId]/approvals/[approvalId]/route.ts`（新） | 审批 GET/POST 代理 |
| `_lib/proxy.ts` | 抽出二进制/表单代理分支，SSE 与 JSON 路径保持现状 |
| 测试 | 注入头不变、`clientSkills` 透传、二进制上传、审批 decision 透传、400/401 透传 |

共用会话的后果（需要在产品上确认接受）：

- 手机删除 = 网页端也删除；改名、标题对两边同时生效。
- 手机历史列表 = 网页端全部会话，可能出现大量网页端会话；需要用 `metadata`（如 `channel: phone`）做展示标记而不是做隔离。
- 配额/审计共用 `web` client 的额度；手机流量会计入网页端同一配额池。
- 手机建会话时带的 `clientSkills` 会钉在该会话上，网页端打开同一会话也带着这些技能（符合“互通”语义）。

## 7. 手机端改动（apps/ios/TomatoRemote）

新增目录 `PhoneAgent/AgentService/`：

| 文件 | 职责 |
|---|---|
| `AgentServiceClient.swift` | BFF 基址（`AccountAuthStore.searchContext.base`）+ `Cookie: session_id`；会话/轮/流/审批/附件/会话 CRUD 的请求封装；401 → 登录提示 |
| `AgentServiceWire.swift` | DTO 解码 + SSE 帧解析（`event:`/`data:`/`id:`）+ 事件到 UI 行的纯映射（可单测） |
| `AgentServiceSession.swift` | 当前 sessionId/turnId/seq、待答审批、重连状态 |

改造既有文件：

| 文件 | 改动 |
|---|---|
| `PhoneAgent/AgentCore.swift` | `PhoneAgentModel` 增加后端开关（默认 `local`，灰度后切 `service`）；service 路径：建会话（带技能）→ 提交轮 → 消费 SSE → 写入现有 `AgentMessage` 行；停止走 cancel；删除本地 loop 的入口保留为回退 |
| `PhoneAgent/PhoneAgentView.swift` | 审批卡（批准/拒绝）、连接/重连状态、服务端错误文案；模型/推理芯片在 service 模式隐藏 |
| `PhoneAgent/PhoneConversations.swift` | service 模式以服务端会话为准（列表/标题/预览/分页/改名/删除），本地文件降级为缓存 |
| `PhoneAgent/CapabilityCatalog.swift` | service 模式禁用 MCP 安装入口（本次范围外），保留技能安装/开关；技能变更调用 `PUT client-skills` |
| `PhoneAgent/PhoneModelSheets.swift` | service 模式改为读 `GET /models`，选择写回会话（`PATCH modelRoute`），只在本机记“上次选择的名字”；不再读写模型 Key |
| `PhoneAgent/CacheableModels.swift`、`ModelCatalogCache.swift`、`CacheSurvey.swift`、`ModelCacheHealth.swift` | service 模式不再使用；保留代码供本地回退 |
| `PhoneAgent/PhoneCamera.swift` / `PhoneDocuments.swift` | 附件改为先上传再引用 `attachmentId` |
| `Account/AccountAuth.swift` | 暴露 BFF origin 给 agent 客户端（已有 `searchContext`，可能只需读权限调整） |

保留不动：`Phone/PhoneTaskModel.swift`、`Phone/PhoneTaskView.swift`、`PhoneAgent` 的 runner 相关（操控本机不在本次范围）。

删除（切换后）：本地模型 Key 的读取路径、模型 cache 观测入口（先藏后删，避免回退不可用）。

测试：新增 `AgentServiceWire` 的解析单测（独立于 UI）；UI 测试覆盖发送/停止/审批/列表；真机 E2E 连测试环境 BFF。

## 8. 分期与 PR 计划

| 阶段 | 内容 | 依赖 | 验收 |
|---|---|---|---|
| S0 | im 分支 WIP 提交、清理；确立基线 | 服务端 owner | 分支干净、CI 绿 |
| S1 | 服务端：会话级 `modelRoute` + 客户端技能目录 + 删除会话 | S0 | 新测试 + 全量 pytest |
| S2 | 服务端：`web_search` / `fetch_url` | S0 | 工具测试 + 真 relay 手测 |
| S3 | BFF：`/api/agent-v2` 补附件二进制、审批、client-skills、删除、`/models` 代理（沿用 `web` client，无新路由族） | S1/S2 部署到 test | BFF 单测 |
| S4 | iOS：客户端骨架 + 文本/技能（flag 关闭默认） | S3 | 真机文本对话 + A2/A3 |
| S5 | iOS：附件、审批、会话管理、停止/重连 | S4 | A4–A7 |
| S6 | 灰度切默认 + 下线本地模型设置 | S5 稳定 | 回滚开关演练 |

顺序原则：服务端契约先落、BFF 跟上、手机只消费稳定契约；每阶段独立可回滚。

## 9. 风险与回滚

| 风险 | 处理 |
|---|---|
| BFF 二进制上传 | 单独路由 + 流式转发 + 大小上限；先走小文件验证 |
| SSE 被中间层缓冲 | 沿用 web 的 `no-transform` + idle timeout；手机端心跳超时重建 |
| 审批 300s 超时 | 手机端后台通知/回前台重拉；超时文案明确 |
| 图片 OCR 质量 | 第一版接受；后续评估多模态透传 |
| 客户端技能提示注入 | 标注来源、大小上限、审计事件；不授予工具 |
| 失去模型选择 | 产品确认；如需保留，另开“会话级 modelRoute”ADR |
| 回滚 | 手机保留 `local` 后端；服务端新字段/端点向后兼容；BFF 路由可独立下线 |

## 10. 待确认

1. ~~手机与 web 的会话是否要互通~~ → **已定：互通，沿用 `web` client。** 后果见 §6。
2. ~~是否保留用户选模型~~ → **已定：保留，做会话级 `modelRoute`（§4.3）。**
3. ~~图片怎么进服务端~~ → **已定：BFF → TOS 附件上传（§4.4）；视觉透传不在本次。**
4. ~~旧 `feat/agent-service-client-skills` 提交~~ → **废弃**：与 ADR-0014 冲突（原因见回复）。
## 11. 实施状态（2026-11-17，手机端）

已落地（`apps/ios/TomatoRemote/PhoneAgent/`，模拟器构建通过）：

- `AgentService/AgentServiceWire.swift`：会话/轮/模型/审批 DTO + SSE 帧解析（含 `assistant/delta`）。
- `AgentService/AgentServiceClient.swift`：`/api/agent-v2/*` 的会话 CRUD、轮提交/取消、SSE、附件 multipart、审批、client-skills、`/models`。
- `AgentService/AgentServiceCatalog.swift`：服务端模型目录。
- `AgentCore.swift`：`PhoneAgentBackend`（本机/服务端）+ 持久化；服务端路径（建会话带技能与 modelRoute、每轮同步技能、上传附件、流式渲染、停止、审批）；`PhoneConversation.serviceSessionId`、`AgentAttachment.serviceId`。
- `PhoneAgentView.swift`：审批条、后端切换、服务端模型面板入口。
- `PhoneModelSheets.swift`：`PhoneServiceModelSheet`。

第二批（同日）：

- 服务端会话列表进历史面板（`GET /sessions`），选中后按 `GET /messages` 回放；改名走 `PATCH`、删除走 `DELETE`。
- 断线按 `afterSeq` 续播，最多重连两次；轮结束刷新会话列表。
- 切换后端时：进服务端开新会话（本地旧transcript 不假装已上传），回本机重读本地历史。

未完成 / 依赖：

- BFF：`/api/agent-v2/attachments`、`/approvals/*`、`client-skills`、`DELETE`、`/models` 五个路由（S3）。
- 服务端：`DELETE`、`client-skills`、`modelRoute`、`web_search/fetch_url`（任务单 S1/S2）。
- 手机端：历史分页（现在只取 50 条）、附件在历史里的图片展示、跨设备实时刷新（需轮询或推送）、
  服务端会话 id 与本地会话 id 的归并（当前本地起始的会话在刷新后以服务端 id 另起一行）。
