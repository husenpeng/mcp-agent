---
description: "基于公司 BFF 的模型可见达人搜索工具：creator_search、creator_detail 与 youtube_channel，用 Desktop 会话 cookie 鉴权，并以一个有文档记载的请求预算为界。"
kind: "package-reference"
---

# @tomato/tool-creator-search

[English](README.md) | 中文

## 概述

`@tomato/tool-creator-search` 让模型在公司 BFF 的 `/api/v1/creator-search/*` 端点上做达人侦察。`creator_scout` 把 brief 变成一组有界、多策略的搜索，合并并补全结果，再按 brief 排序并给出每个达人的证据；`creator_feedback` 记住接受、拒绝与观察决定，让后续任务遵守它们。底层的 `creator_search`、`creator_detail` 与 `youtube_channel` 直接暴露单点能力。BFF 持有上游凭据；本包负责 brief 门槛、搜索阶梯、打分、请求预算与持久反馈存储。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

把本包挂到需要访问公司 BFF 的 preset，并用 `TOMATO_SEARCH_GATEWAY_URL`（或 `TOMATO_WEB_URL`）指明源站。随产品发布的 Web `standard` 与 `cordis` preset 已挂载它；`minimal` 不挂载。

### 何时选用

当 agent 参与达人发现或达人核验时选用它：可以按关键词搜索某个品类，完整读取单个达人，并核对 YouTube 频道的公开 BrandConnect 数据。没有已登录 Desktop 外壳的 profile 仍会显示这些工具，但每次调用都返回重新登录的提示，因为 BFF 从该会话推导调用方身份。

### 最小配置

```yaml
- id: tool-creator-search
  name: '@tomato/tool-creator-search'
  config:
    timeoutMs: 60000
```

| 字段 | 默认值 | 含义 |
|---|---|---|
| `baseURL` | `$TOMATO_SEARCH_GATEWAY_URL`，其次 `$TOMATO_WEB_URL` | BFF 源站；为空时每次调用都报告源站未配置 |
| `timeoutMs` | `60000` | 单次请求的端到端预算（毫秒），附加在每个工具定义上 |
| `maxOutputChars` | `20000` | 单次调用完整渲染文本的上限（字符） |
| `search` | `true` | 注册 `creator_search` |
| `detail` | `true` | 注册 `creator_detail` |
| `channel` | `true` | 注册 `youtube_channel` |
| `scout` | `true` | 注册 `creator_scout` |
| `feedback` | `true` | 注册 `creator_feedback` |
| `ingest` | `true` | 注册 `creator_ingest`，用于索引之外找到的达人 |
| `scoutTimeoutMs` | `300000` | 单次多请求侦察调用的预算 |
| `defaultFollowersMin` / `defaultFollowersMax` | `10000` / `200000` | brief 未给出时使用的粉丝带 |
| `defaultMinEngagementRate` | `0.01` | brief 未给出时的互动率下限 |
| `defaultTargetCount` | `10` | brief 未给出时想要的达人数 |
| `depthFast` / `depthStandard` / `depthBroad` | 内置预算 | 每档的 `maxSearchCalls`、`pagesPerQuery`、`pageSize`、`enrichLimit`、`poolFactor` |
| `querySuffixes` | `[]` | 只有 `broad` 策略才追加的后缀词 |
| `queryPolicy` | `balanced` | `strict` 只搜用户给的词，`balanced` 只重组用户已给的字段，`broad` 才追加 `querySuffixes` |
| `feedbackBoost` | `10` | 记住的接受决定带来的加分 |
| `weightFollowers` … `weightContactability` | `25/25/20/15/10/5` | 打分的权重；至少一项大于零 |
| `contactEnrichment` | `true` | 对索引里没有邮箱的 shortlist 达人做网页抓取 |
| `contactLimit` | `5` | 单次调用最多抓取多少位达人 |
| `contactQueriesPerCreator` | `2` | 每位达人可花的搜索次数 |
| `contactFetchesPerCreator` | `2` | 每位达人可花的页面读取次数 |
| `contactTimeoutMs` | `20000` | 每位达人抓取的预算 |

生成的 [配置目录](../../../docs/config-catalog.zh.md#tomatotool-creator-search) 是全部字段及其 JSDoc 的完整来源。

### 三个工具

- `creator_scout(brief, depth?)` 校验 brief（品类、平台、市场），按声明的查询保真策略规划关键词、变体、更深翻页与放宽粉丝带的有限阶梯，跨平台去重、补全最强的候选人，返回排序后的 shortlist；缺少必填项时只返回要问的问题，不花任何额度。
- 索引没有给出邮箱时，`creator_scout` 会通过 web 工具背后的 provider seam 搜索并读取该达人的页面，取第一个可信的商务邮箱，并把来源页面与抓取时间记在达人上；没有 web provider 的 profile 会保留「未知」并在 `caveats` 里说明。
- `creator_scout` 还会报告硬性的调用预算（`stats.budget`），并在池子不足时给出 `escalation`，列出应交给 `web_search`/`web_fetch` 的查询词；`creator_ingest(brief, entries)` 再把爬到的达人按同一套门槛、权重与已记住的决定打分。
- `creator_feedback(entries, client?)` 把决定写入插件自己的持久存储域：被接受的达人下次排名更高，被拒绝的连同原因一起排除；不传 entries 时列出已记住的决定。
- `creator_search(platform, query, page?, pageSize?)` 消耗一次集团接口月度额度，返回 BFF 的 `{items, task_status?, pager?}` 载荷。
- `creator_detail(platform, creatorId)` 消耗一次额度，返回单个达人的集团接口详情对象。
- `youtube_channel(channel, languageCode?)` 读取 YCP 公开频道数据，不消耗集团接口额度。

三个工具都返回规范值 `{source, traceId, data, quota?}`：`data` 是保留上游字段名的 BFF 载荷（Blue 为 snake_case，YCP 为 camelCase），`traceId` 是用于排查的 BFF trace，`quota` 是 Blue 端点上报的月度快照。

<a id="understand-the-implementation"></a>
## 理解实现

### 源码地图

| 文件 | 职责 |
|---|---|
| [`src/index.ts`](src/index.ts) | 插件名、注入、配置 schema、源站解析与 Desktop 会话读取 |
| [`src/bff.ts`](src/bff.ts) | 端点路径、会话 cookie、带 `redirect: "error"` 的 fetch、请求预算与错误映射 |
| [`src/tools.ts`](src/tools.ts) | 工具 schema、BFF 的入参上界、渲染文本与待办卡片标题 |
| [`src/types.ts`](src/types.ts) | 信封与额度类型；无运行时代码 |

### 请求与失败行为

每个请求都带 `cookie: session_id=<desktop session>` 并拒绝重定向，会话 cookie 因此不会跟随重定向响应泄露到其他源站。调用方取消会中止请求，否则由部署的 `timeoutMs` 限定。

| BFF 应答 | 工具失败 | 工具是否重试 |
|---|---|---|
| 401 / `UNAUTHENTICATED` | 提示重新登录；不重复请求 | 否 |
| 429 / `BLUE_QUOTA_EXCEEDED` | 报告月度额度耗尽，并附上 BFF 最近上报的快照 | 否 |
| 429 / `UPSTREAM_RATE_LIMITED`、502、504、超时、BFF 不可达 | 报告可重试失败，并告知模型同一请求值得再试 | 否——由模型决定是否再花一次额度 |
| 400 / 其他 4xx | 报告 BFF 消息与 trace | 否 |
| 200 但 `{data, meta}` 信封不可读 | 报告响应不可读 | 否 |

工具从不自行重试：一次 Blue 搜索可能为等待上游任务轮询 45 秒，同一次调用内再试会超出任何合理预算，并在未获调用方同意的情况下再消耗一次额度。

<a id="model-experience"></a>
## 模型体验

### 工具 schema

#### 模型看到什么

模型看到的是生成的 [`creator_search`、`creator_detail` 与 `youtube_channel` schema](../../../docs/tool-catalog.zh.md#tomatotool-creator-search)。schema DSL 无法表达的约束——`query` 与 `creatorId` 的 1–200 字符、`page` 的 1–100000、`pageSize` 的 1–50、`languageCode` 的 2–20 字符，以及频道形式——都在 `execute` 内校验，因此非法调用在请求到达 BFF 之前就以模型可读的消息失败。每个工具还提供 `presentCall`，待办卡片会写明操作及其目标；没有声明 `presentResult`，完成态沿用通用卡片渲染返回内容。

#### Token 影响

每个工具定义向请求的工具块贡献一份 schema 与一段描述，描述控制在三句以内。结果是紧凑 JSON，并按 `maxOutputChars` 逐次调用封顶，因此一页较大的搜索结果不会淹没上下文：上限会截断载荷，并追加说明本次上限的截断提示。

#### KV Cache 影响

工具定义与系统提示在插件生命周期内保持不变，因此提示前缀在轮次之间持续可缓存。结果内容只取决于 BFF 应答；其中的额度快照改变的是结果文本，而不是提示前缀。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- **打分排序的是证据，不是匹配度。** 分数只在 BFF 实际返回的信号上归一化；覆盖度与状态说明每个分数依赖了多少 brief 信息。缺失的国家、互动率或邮箱会降低覆盖度，而不是被猜一个值。
- **反馈是主机级的，不按账号隔离。** 记录存放在 Harness home 下插件的存储域里；未指明 client 的记录作用于该主机上的每个客户，共用同一主机 profile 的部署共享同一份记录。
- **没有基于种子达人的相似扩展。** BFF 的两个详情端点不暴露相似达人，因此发现仍由关键词、翻页与平台驱动。
- **没有筛选词表。** Blue 搜索端点接受上游 `filters` 对象，但其键集合没有文档，因此工具只暴露关键词与翻页。要先有一份有文档的键集合，才适合暴露筛选。
- **不自动重试。** 工具报告可重试失败而不自行重试，因为重试可能让 45 秒的上游链路翻倍，并多消耗一次额度。需要重试的部署可以在 `tools/execute` 外围添加。
- **额度快照可能过期。** 429 额度应答本身不带快照，报告的数字来自本进程最近一次成功的 Blue 应答，并保持到下一次成功为止。BFF 的计数按月归零且按进程统计。
- **没有专用 Web 卡片。** 达人结果的专用卡片需要在持久化结果元数据之上实现 Client 呈现器；目前通用卡片展示渲染文本。
- **Blue 详情 `task_status`。** 上游详情任务仍在处理时 BFF 返回 504 `UPSTREAM_TIMEOUT`；工具报告该可重试失败而不轮询。

<a id="dev-note"></a>
### 开发备注

无。
