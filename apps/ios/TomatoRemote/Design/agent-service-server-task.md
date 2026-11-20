# agent_service 服务端改造任务单（交给指定 agent）

> 背景：Tomato Phone 对话 agent 迁到 agent_service，手机与网页会话互通（同一 `clientId=web`）。
> 本任务单只覆盖服务端；BFF 与 iOS 由别的改动跟进。契约字段一旦冻结，客户端按此实现，改契约要先回传。
> 基线：`services-monorepo-im` 的 `feature/im_agent_service`（先把当前 44 个未提交改动提交成干净基线）。
> 总方案见 [agent-service-phone-migration.md](./agent-service-phone-migration.md)。

## 1. 必须遵守的既有决策

- **skill 取用按 ADR-0014**：每轮按 userId 查 skill-service 已安装摘要注入索引，`load_skill` 现查正文；不再用 pins 快照、不再有 `preload/conditional/on_demand`。
- 不要复活 `main` 上基于 pins 的 `clientSkills` 实现（提交 `999120aa`，与 ADR-0014 冲突，已废弃）。
- 现有会话/轮/SSE/审批/附件/记忆接口保持兼容；新字段全部可选、缺省行为不变。
- `api → service → runtime.ports` 依赖方向不变；新能力走端口/适配器，不在 api 层写业务。

## 2. 契约（客户端按此实现）

### 2.1 会话

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/v1/sessions` | 建会话；新增可选 `modelRoute`、`clientSkills` |
| GET | `/api/v1/sessions` | 已有（im 分支）：分页 + `agentName/keyword/status` |
| GET | `/api/v1/sessions/{id}` | 已有 |
| PATCH | `/api/v1/sessions/{id}` | 已有改名；新增可选 `modelRoute` |
| DELETE | `/api/v1/sessions/{id}` | **新增**：软删（`status=archived`），返回 `{sessionId, status}` |
| GET | `/api/v1/sessions/{id}/messages` | 已有（im 分支）：`limit/beforeSeq/includeTools` |
| GET | `/api/v1/models` | 已有：管理面启用的 route（不含 `default`），给手机模型面板 |

请求字段：

```json
{
  "agentName": "default",
  "modelRoute": "DeepSeek-V4.1-Flash",
  "clientSkills": [
    {"name": "答法", "content": "每个回答结尾加一句「收到」。"}
  ]
}
```

`PATCH /sessions/{id}`：

```json
{"title": "新标题", "modelRoute": "kimi-k3"}
```

校验与错误：

- `modelRoute` 不在 `runtime.model_routes`（或对当前用户不可见）→ `MODEL_ROUTE_INVALID`（现有错误码）。
- `clientSkills` 超限 → `INVALID_ARGUMENT`（40001）；单条 > `client_skills_max_bytes`、总量 > `client_skills_max_bytes_total`、条数 > `client_skills_max_count`。
- `DELETE` 不存在或不属于当前用户 → `SESSION_NOT_FOUND`；正在跑的轮先 cancel 再归档。

### 2.2 会话级客户端技能

| 方法 | 路径 | 说明 |
|---|---|---|
| PUT | `/api/v1/sessions/{id}/client-skills` | 整表替换：`{"skills":[{name, content}]}`；空数组=清空；下一轮生效 |
| GET | `/api/v1/sessions/{id}/client-skills` | 只返回 `{skillId, name, contentHash, updatedAt}`，正文不外发 |

存储：新表 `agent_client_skill`

```
session_id    text     not null   -- 外键语义到 agent_session.id；软删会话时一并归档/清理
skill_id      text     not null   -- client:<sha256(content)[:16]>
name          text     not null   -- ≤120 字符
content       text     not null   -- 正文（仅服务端）
content_hash  text     not null
updated_at    timestamptz not null default now()
primary key (session_id, skill_id)
```

要求：迁移带列注释；PG 与 memory 两套 store 都实现；会话软删时该会话的客户端技能不再注入。

注入（改 `app/runtime/engine/loop.py` 的 `_inject_installed_skills`）：

1. 每轮取 skill-service 已安装摘要 + 本会话客户端技能摘要，合并成**一条**索引；客户端技能行标 `client` 来源，条目形如 `name（skillId）：tagline`。
2. 事件 `source=client_skill_index`（现有 `skill_index` 保留给 skill-service 来源，或合并时在 payload 加 `origin`），`pinned=false`，可参与压缩。
3. **不注入全文**。`load_skill(skillId)` 解析顺序：客户端技能表 → skill-service（skill-service 需在本轮已安装集合内）。未命中统一返回“该技能未安装或不存在，无法获取内容”。
4. 失败语义：客户端技能读失败 → 跳过本轮索引；skill-service 失败 → 维持现有降级。

### 2.3 模型选择（会话级）

- 引擎当前取 `agent.model_route`（loop.py 约 200 行）；改为 `session.pins.get("model_route") or agent.model_route`。
- 建会话/PATCH 写入 `session.pins["model_route"]`；不新增列、不改 agent revision。
- 切换后在下一轮生效；同一会话内可反复切换。
- thinking 档位跟随 route 配置，本次不做用户可调。

### 2.4 联网工具（新增）

`app/runtime/adapters/tools/` 新增两个 `Tool`：

| 工具 | 行为 | risk |
|---|---|---|
| `web_search` | 豆包搜索（`https://open.feedcoopapi.com/search_api/web_search`），参考旧 SDK 版 `app/harness/mcp/builtin/retrieval/tools/web_search.py`；参数 `query`、`maxResults`（1–8） | read |
| `fetch_url` | 抓取正文（trafilatura），参考旧版 `fetch_url.py`；参数 `url`、`maxChars`；超时/重试/域名黑名单；结果截断 | read |

要求：

- 配置走 `settings`：`doubao_search_api_key`、`web_search_timeout_seconds`、`fetch_url_timeout_seconds`、`fetch_url_max_chars`；不写死。
- SSRF：只允许 http/https 公网地址；拒绝回环、私网、`.local`、裸 IP；重定向后复核目标。
- 结果大小受 `max_tool_result_bytes` 约束。
- 注册进 `ToolRegistry`，并把 `web_search`/`fetch_url` 加入默认 agent 的 `allowed_tools`（或注册 phone agent 资源；二选一，需在交付说明里写清）。
- 依赖 `trafilatura` 进 `apps/agent_service/pyproject.toml`。

## 3. 测试（内存后端 + fake LLM）

- `test_client_skills.py`：建会话带技能 → 首轮索引含客户端技能、正文不落事件；`PUT` 替换后下一轮索引变化；`load_skill` 能从客户端技能取正文；超限 40001；跨用户 404。
- `test_session_delete.py`：软删后列表不可见、详情 404、再 PATCH/DELETE 404、正在跑的轮被取消。
- `test_session_model_route.py`：建会话带未知 route → MODEL_ROUTE_INVALID；带合法 route → 引擎用该 route；PATCH 切换下一轮生效。
- `test_web_tools.py`：参数校验、SSRF 拒绝、超时/失败文案、结果截断（网络用 stub transport）。
- 现有 `test_api.py` / `test_skill_injection.py` 必须继续通过。

## 4. 验收（真环境手测）

```bash
# 1) 建会话，带模型与本地技能
curl -s -X POST "$BASE/api/v1/sessions" -H 'X-User-Id: u1' -H 'X-Client-Id: web' \
  -d '{"modelRoute":"DeepSeek-V4.1-Flash","clientSkills":[{"name":"答法","content":"结尾加「收到」"}]}'
# 2) 发一轮，确认索引与 load_skill
curl -s -X POST "$BASE/api/v1/sessions/$SID/turns" -H 'X-User-Id: u1' -H 'X-Client-Id: web' -d '{"text":"你好"}'
# 3) 替换技能后下一轮索引变化
curl -s -X PUT "$BASE/api/v1/sessions/$SID/client-skills" ... -d '{"skills":[]}'
# 4) 删除后列表不可见
curl -s -X DELETE "$BASE/api/v1/sessions/$SID" ...
```

## 5. 兼容与回滚

- 新字段缺省时行为与现状一致；`DELETE` 为软删，可人工恢复 `status=open`。
- 不做数据迁移的破坏性变更；客户端技能表随会话软删失效即可。
- 需要改契约（字段名、错误码、事件 `source`）时先回传，客户端不再各自猜。

## 6. 交付说明里请写清

1. 实际端点与字段（与本文差异）；
2. `web_search/fetch_url` 最终接的是内置工具还是 agent 资源；
3. 客户端技能事件名与 `load_skill` 的解析顺序；
4. 新增 settings 名与默认值；
5. 测试清单与本地跑法。