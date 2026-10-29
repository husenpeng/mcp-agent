# 0010. 跨会话记忆与目标专注以可选实验组合包交付

- 状态：Accepted
- 日期：2026-10-29
- 影响范围：`packages/experimental/memory`、`packages/experimental/tool-memory`、`packages/experimental/focus`、`packages/experimental/muse-bundle`、`packages/util/official-bundles`、`apps/cli`

## 背景

Meta 在 2026-10-12 发布 Muse Wonder 时提出两项能力：Active Memory（跨会话携带用户在意的内容，并在当前任务需要时调取）与 Active Focus（任务受阻时换路径、从错误中恢复、需要时澄清、重要动作前确认）。这两项是模型训练出的行为，模型卡没有提供记忆存储或记忆 API；harness 要获得同类效果，必须自行提供存储、检索、注入和失败处理。

仓库已有的相关能力：`@tomato/goal` 与 `@tomato/goal-round-driver` 负责持久目标、轮次和上限；`@tomato/user-approval` 负责一次性审批；`@tomato/storage-domain` 提供宿主侧持久 KV；`@tomato/tool-session-query` 可检索原始会话日志，但默认关闭，且只返回原始事件。缺口在于：没有跨会话的事实存储；goal 轮次看不到已失败的调用；审批只能由 sandbox 升级或 hook 触发，不能按工具名配置。

约束：模型可见内容必须能从会话日志重建；不得修改 `agent-loop`；新的会话事件类型必须走持久化类型确认；产品可见插件需要真实组合测试。

## 决策

- **交付形态**：四个实验包加一个默认关闭的可选组合包 `@tomato/experimental-muse-bundle`，列入 `OPTIONAL_BUNDLES` 与插件页的 More 列表，带 Experimental 标记。组合包在 Host 层插入 `optional-memory`、`optional-tool-memory`、`optional-focus` 三行，因此所有预设（包括 minimal）都会获得工具。
- **记忆服务**（`@tomato/experimental-memory`，`ctx.memory`）：记录存于 `tomato_memory` 存储域（版本 1、`single` 布局、表 `records`），从不写入会话日志。范围是会话头部 `cwd` 的 `realpath`；修改工作目录不会切换范围。同一工作区内 `(entity, key)` 唯一，再次写入时替换原记录，并保留原 id 和创建时间。`forget` 直接从存储中删除。状态只有 `active` 与 `candidate` 两种，只有 `active` 记录可以置顶。检索按查询词命中比例（基于 `Intl.Segmenter` 分词）排序，再按新近程度排序，不做语义检索。
- **写入要求来源**（`@tomato/experimental-tool-memory`）：`memory_write` 必须带 `user_quote`。规范化后的引用（小写、合并空白、去掉句末标点，长度不少于 `minQuoteChars` 个字形）包含在当前轮次某条 `source.kind: 'user'` 消息中时，记录才生效，并保存该消息的 seq；否则存为候选，只有人工执行 `/memory confirm` 才能激活。被委派的智能体可以搜索，但不能写入或删除。
- **注入方式**：置顶记录在每轮第一步，通过 `agent/pre-step` 作为一条 `experimental-memory` 来源的用户消息追加在已接纳消息之后，内容受 `maxPinnedBytes` 限制。仅限 Host 的投影 `experimentalMemory` 折叠两项内容：当前轮次中人的消息，以及仍在模型界面上的快照摘要。内容没变就不重发；被压缩遮蔽后会补发；全部取消置顶时追加一条清除通知。没有使用 `PromptContext`：它的 `text` 是同步函数，而且在 `agent/pre-step` 之前装配，拿不到当前消息；它的任何变化都会让整个运行时上下文重新发送。
- **目标专注**（`@tomato/experimental-focus`）：不新增 driver，也不自动重试；轮次调度和上限仍由 `goal-round-driver` 负责。仅限 Host 的投影 `experimentalFocus` 从已记录的 `user/message`（goal 来源）、`tool/call` 和 `tool/result` 折叠出当前目标的失败记录。失败以“工具名 + 规范化参数 + 失败代码”标识，取消不算失败，该工具任意一次成功都会重置它的连续失败计数。`tools/post-execute`（prepend）在同一调用连续失败达到 `repeatedFailureThreshold` 次时追加提醒；`agent/pre-step` 把失败记录追加到同一目标的下一轮。`approvalTools` 中的工具名在其他 pre-execute 策略都放行后返回 `ask`，由 `ctx.approval` 决定；策略为 `never` 或没有审批服务时拒绝。
- **持久化**：新增 `experimental-memory` 与 `experimental-focus` 两个 `@persistenceAttribution` 来源类型，记录为 `2026-10-29-memory-focus-attribution`，决定为 `same-version`；不新增 `SessionEventMap` 成员，不提升 `SESSION_FORMAT_VERSION`。

## 备选方案

- **独立 focus driver 自动续跑与重试**：会与 `goal-round-driver` 争抢空闲时机。由于只有 goal 来源的消息计入 `maxGoalRounds`，轮次上限会被绕过。hiCreator 按 credits 计费且不自动重试（[ADR 0007](0007-hicreator-mcp.md)），工具也没有幂等元数据，自动重试会重复扣费、重复产生副作用。
- **每轮后台 LLM 抽取记忆**：每轮多一次模型调用；为满足“模型可见即已记录”，要记录完整的抽取请求；而且会把达人简介等外部文本误写成约束。改为模型显式写入，并用原话校验。
- **用 `PromptContext` 注入记忆**：见上文“注入方式”。
- **新增 `focus/change` 会话事件**：只有 `packages/experimental/` 下的调用方才能使用 `appendPluginRecord` 写 ignorable 记录，而 `Session.append()` 不支持 `ignorable`。新事件会成为必需事件，旧版本会拒绝读取。失败记录完全可以从已有事件派生。
- **把服务放进 `packages/tomato/` 并默认挂载**：隐私敏感且未经验证的能力不应进入默认产品；先用实验组合包收集使用反馈。
- **按账号隔离记忆**：agent 和会话侧目前没有已验证的用户 id，只有网关里有；引入它需要持久化变更，留待单独立项。

## 后果

- 开启组合包后，每次请求固定增加三个工具 schema；置顶集合变化后的第一轮最多增加 `maxPinnedBytes` 字节；有失败的目标轮次会多出失败记录和提醒。开关组合包会使活动会话已缓存的请求前缀失效一次。
- 记忆保存在本机 `$TOMATO_HOME/storages/tomato_memory.json`。同一 TOMATO 主目录下运行多个 Host 进程时，写入可能互相覆盖（JSON 存储后端没有跨进程写锁）。登出不会隔离记忆：同一台机器、同一项目目录的另一个账号能看到这些记忆。
- 删除记忆只删除存储中的记录；早先会话日志里已经展示给模型的快照和工具结果仍会保留。
- `approvalTools` 只按工具名匹配，无法根据参数区分只读调用和写入调用。在 `danger-full-access` 档位（审批策略为 `never`）下，匹配的工具会被一律拒绝。
- 没有 Web 管理页；记忆通过 `/memory` 和工具管理。

## 验证

- `pnpm exec vitest run packages/experimental/memory packages/experimental/tool-memory packages/experimental/focus packages/experimental/muse-bundle`：51 个测试通过，四个包源码的单文件覆盖率均为 100%。
- 组合包测试通过真实 profile Loader 启动随包发布的三行，配合真实的 Session、AgentLoop、命令、目标、审批与 JSON 存储；模型输出由脚本给出。断言内容：第一个会话中带原话的写入在第二个会话的首次请求中以置顶快照出现；另一个目录看不到；同一调用失败两次后出现提醒；`send_*` 先征求审批，被拒后拒绝文本进入工具结果；下一轮带上失败记录。
- `pnpm run verify-persistence-changes`、`verify-persistence-formats`、`verify-tool-catalog`、`verify-config-catalog`、`verify-cordis-catalog`、`verify-default-product-isolation`、`verify-package-meta`、`verify-locale-metadata`、`verify-export-jsdoc`、`verify-no-unknown-casts`、`test:docs` 通过。
- 人工：在 Desktop 插件页 More 列表中开启“记忆与目标专注”，新建会话说出一条偏好并要求记住；在同一工作区新建会话，确认智能体不再询问；执行 `/memory` 查看并删除。

## 未决

- 是否引入已验证的账号 id 作为记忆范围的一部分（涉及会话头部的持久化变更）。
- 记录规模接近上限时，是否改用 `per-record` 布局或 SQLite 后端。
- 是否提供 Web 管理页（需要 API controller、客户端插件和双语文案）。
