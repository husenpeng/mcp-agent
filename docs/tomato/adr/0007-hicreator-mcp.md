# 0007. hiCreator 达人数据以远程 MCP 接入

- 状态：Accepted
- 日期：2026-10-27
- 影响范围：`packages/bundle/web-app/cordis.patch.yml`、`packages/bundle/web-app/package.json`

## 背景

Tomato AI 的 M2 计划是接公司 MCP 网关的 `kol_capabilities` / `kol_search` / `kol_detail` / `kol_summary`，但该网关尚未提供。hiCreator 官方提供远程 Streamable HTTP MCP（`https://mcp.hicreator.ai/mcp`，`Authorization: Bearer <hc_ 开头的 Developer API Key>`），暴露 21 个达人发现、详情、邮箱、受众报告、假粉检测与收藏夹工具，覆盖「找达人 → 看详情 → 拿邮箱」的前半段流程。本仓库已有 `@deepseek-ai/dsh-mcp-client`，支持该传输方式与自定义请求头。

## 决策

- 在 `dsh-web-app` 补丁层新增 `mcp-hicreator` 行，配置 `transport: streamable-http`、`serverName: hicreator` 与官方地址；不修改 base 层，headless、ACP 与 SDK 组合不受影响。
- API Key 只从 `HICREATOR_API_KEY` 环境变量读取。该变量缺失时整行 `disabled`，启动路径与服务端连接都不发生；root `.env` 由 app-boot 加载，开发态只需在 `.env` 中补一行。
- `@deepseek-ai/dsh-mcp-client` 加入 `dsh-web-app` 的依赖清单，满足组合包解析清单的依赖要求。
- 工具以 `mcp__hicreator__<tool>` 命名，与既有 MCP 工具共存；权限仍走当前 profile 的 `ask` / 审批策略。
- 仅作为公司网关落地前的可选数据源，不替代 `kol_*` 契约；公司网关可用后可整行删除，不影响其他行。

## 备选方案

- 装 hiCreator 的 Agent Skill 到 `.agents/skills/`：只提供调用说明，数据仍要靠 MCP 或 API；且 web-app 的 skill 归 preset 管辖，随 preset 变化。
- 写 `@tomato/hicreator` 原生插件包装 REST API：能得到类型化工具与定制卡，但需要自行维护鉴权、重试与 21 个工具契约，验证阶段成本过高。
- 把 API Key 写进补丁配置：会把密钥带进仓库与所有安装包；且同一 key 的额度由所有用户共享。
- 放进按需组合包并在插件页展示：适合长期产品化，但当前只是验证阶段，先把行留在 web 补丁层。

## 后果

- 配置了 key 的 Web/Desktop 启动会连接远程 MCP，工具进入模型工具列表；未配置时行为与改动前一致。
- hiCreator 调用按 credits 计费（搜索 0.5/2、邮箱 0.2、受众报告 40、假粉报告 30），失败不自动重试；额度与数据都归属 key 所在的 paid workspace。
- 远程服务器指令会作为字面文本进入系统提示；超长指令会拒绝连接（默认上限 32 KiB）。
- MCP 工具沿用通用工具展示，没有 `kol_search` / `kol_detail` 的定制卡片；产品化仍需 `@tomato/ui-*` 客户端插件挂 `tool.call.toolview`。
- 打包安装包不会自带 `.env`，每用户密钥问题未解决；本 ADR 只覆盖开发态与手工 profile patch 场景。

## 验证

- `pnpm run verify-cordis-config`：行名、依赖清单与补丁结构有效。
- 未设置 `HICREATOR_API_KEY` 启动 `pnpm run dev:web`：`mcp-hicreator` 行停用，启动无新增连接或错误。
- 在 root `.env` 设置 key 后新开 Session：工具列表出现 `mcp__hicreator__*`，执行一次搜索类工具并核对返回与计费。
- `curl -X POST https://mcp.hicreator.ai/mcp` 未带 token 返回 401，确认端点与鉴权要求。

## 未决

- 打包桌面端的每用户密钥：需要 `credentials` 或本地网关注入方案，不能依赖安装目录 `.env`。
- 公司 MCP 网上线后 hiCreator 是否保留、是否只对特定人群启用。
- 定制工具卡、调用前额度提示与敏感数据（达人邮箱）外发策略。