# 0009. 仓库命名统一为 Tomato

- 状态：Accepted
- 日期：2026-10-28
- 影响范围：全仓（包名、环境变量、CLI、桌面应用标识、持久化键、文档）

## 背景

本仓库是 `deepseek-harness` 的一次性硬分叉，不合并上游，也不发布 npm 包。分叉后产品名为 Tomato AI，但包 scope 仍是 `@deepseek-ai/dsh-*`，环境变量前缀是 `DSH_`，命令是 `dsh`，用户数据目录是 `~/.dsh`，URI scheme 是 `dsh-app://`。这些旧名持续出现在配置、日志、文档与用户数据路径里，与产品身份不一致；混用 `dsh` 与 `tomato` 的变量（如 `DSH_DESKTOP_TOMATO_WEB_URL`）还会继续增加。

## 决策

- **包名**：全部 `@deepseek-ai/*` 改为 `@tomato/*`，`dsh-` 前缀剥离。显式映射：`@deepseek-ai/dsh` → `@tomato/cli`，`dsh-brand` → `@tomato/branded`，`dsh-root` → `@tomato/harness`，`dsh-subagent-dsh-sdk` → `@tomato/subagent-sdk`。`vendor/` 与 `native/` 一并改名。
- **运行时标识**：`DSH_` → `TOMATO_`；`Dsh*` / `dsh*` 标识符 → `Tomato*` / `tomato*`；`__DSH_*__` 全局与 `SCREAMING_DSH` 常量同步改名；CLI `dsh` → `tomato`；home `~/.dsh` → `~/.tomato`；`package.json` 清单字段 `dsh` → `tomato`；设置键 `dsh.*` → `tomato.*`；URI scheme `dsh-app://`、`dsh-resource://`、`dsh-session:` → `tomato-*`；发布 tag `dsh-v*` → `tomato-v*`。
- **桌面身份**：`com.deepseek.dsh` → `vip.tomatoai.desktop`；本地无签名构建 `com.deepseek.harness` → `vip.tomatoai.harness`。
- **保留的外部身份**：`DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`、`api.deepseek.com`、`deepseek-*` 模型 id、`deepseek-official` / `deepseek-account` / `deepseek-api-key` provider id、适配器包名中的 `deepseek` leaf（如 `@tomato/llm-deepseek`）、上游仓库 slug `deepseek-harness`，以及真实第三方包 `@deepseek-ai/libreoffice-kit*`。
- **冻结的历史记录**：`.agents/notes/`、`docs/upgrade-guide/`、`docs/persistence-changes/`、`docs/tomato/adr/`、`scripts/snapshots/` 不重写。
- **技能目录名保留**：`.agents/skills/dsh-*` 不改名。归档 Agent Note 的封印禁止修改内容，而这些笔记链接到技能目录；技能名属于工具标识，不是 harness 运行时命名。
- **不做兼容**：不双读旧环境变量、不自动迁移旧 home、不保留 `dsh` 命令别名。旧数据留在 `~/.dsh`，需要时手动 `mv`。
- **工具**：`scripts/rescope-to-tomato.ts` 按 `env`、`ident`、`pkg`、`cli`、`prose` 五层执行，支持 `--apply`、`--check`、`--only=`；`--check` 断言无残留且第二次 apply 为空操作。

## 备选方案

- **只改产品面、保留上游包名**（原 README 方案）：与“统一为 Tomato”的目标不符，配置与日志仍出现旧名。
- **把 `@tomato/*` 发布到 npm**：仓库不发布包，没有外部消费者，无需承担发布与旧名弃用成本。
- **双读旧环境变量一个版本**：与仓库“misconfiguration fails loud”规则冲突，且内部 M1 用户面很小，硬切成本更低。

## 后果

- 旧环境变量、旧 home 目录与旧 CLI 名立即失效；升级需要按 [upgrade guide](../../upgrade-guide/v0.2.1-rc.3/tomato-namespace/guide.md) 手动迁移。
- 与上游源码的 diff 对照进一步减弱；仓库本来就不合并上游，只剩参考阅读。
- 快照与文档批量改写；冻结的历史记录仍保留旧名，可能包含指向旧路径的链接。

## 验证

- `pnpm exec tsx scripts/rescope-to-tomato.ts --check`：无残留、幂等。
- `pnpm run typecheck`、`pnpm run build`、`pnpm run doc-sync`、`pnpm run hygiene` 通过。
- `pnpm run test:snapshot`：失败集合与分叉基线完全相同（13 个场景，均为基线已有的 provider/环境问题：`deepseek-account` 被 Tomato bundle 停用、python sandbox 与 web-search provider 未配置）；本次改名没有新增失败。已刷新因改名产生字节统计漂移的 authored 场景。