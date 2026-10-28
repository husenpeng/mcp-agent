# Agent Note: 将 Playwright 浏览器工具作为按需官方组合包分发

Status: implemented

[English](2026-10-27-official-on-demand-playwright-bundle.md) | 中文

## Problem

Playwright MCP 提供方已经可用，但产品层面无法触达：profile 必须手写服务与提供方名称，插件页既不会列出也不能安装。随每次安装分发同样不合适，因为提供方会带入 Playwright 运行时，并要求本机存在大多数安装永远用不到的 Chromium 构建。

## Decision

`ON_DEMAND_BUNDLES` 将 `@deepseek-ai/dsh-experimental-browser-use-playwright-bundle` 纳入官方目录。只有用户在插件页打开开关时才会安装；目录条目自带包内本地化元数据与图标，离线也能发现。源码安装链接工作区包，正式安装固定到当前 DSH 版本，具体规则见[按需组合包决策](2026-10-05-official-on-demand-bundles.zh.md)。

组合包补丁插入共享的 `dsh-browser-use` 服务与一个 `mode: launch`、`headless: true` 的 Playwright 提供方。激活后创建的 Session 拥有独立的 Chromium；关闭开关只取消选中该层，卸载仍是单独操作。开关不提供配置表单：可见浏览器与附加模式仍由显式 profile 组合作出，这与[可选组合包准入决策](2026-09-21-experimental-capabilities-as-optional-bundles.zh.md)一致，该决策把外部浏览器提供方排除在随安装分发的列表之外。

组合包不安装浏览器构建。提供方从 Playwright 缓存或显式 `executablePath` 启动 Chromium，首次使用步骤写在包 README。提供方仍是唯一的 browser-use 注册者；第二个提供方会在激活时失败。

## Alternatives considered

**随每次安装分发（`OPTIONAL_BUNDLES`）。** 开关可以离线工作，但每次安装都会为大多数人不启用的能力带入 Playwright 运行时与浏览器要求；可选组合包决策已经因这一成本排除了外部浏览器提供方。

**为每个浏览器提供方各建一个按需组合包。** 在尚无产品需求时，Chrome DevTools 或 Stagehand 组合包只会重复目录、元数据与补丁维护；当前只有 Playwright 被明确需要，后续提供方可以沿用同一机制。

**保留手工 profile 补丁并写文档。** 安装成本为零，但提供方在插件页仍不可发现，每个 profile 都要重复包名、版本与补丁文本。

**在激活时自动下载 Chromium。** 从开关触发 Playwright 安装器会引入网络下载与第二个失败面，而所需构建由固定版本的 Playwright 决定；改为在 README 中给出命令。

## Consequences

发现与安装不需要解析包；首次激活需要 registry 或准备好的工作区，以及已有的 Chromium 构建。从不启用该组合包的 profile 不付任何成本。固定的 launch/headless 配置是可用默认值；可见或附加浏览器需要 profile 补丁。浏览器状态只属于 Session，且不会从日志恢复。补丁组合测试与目录投影测试覆盖准入、行顺序、固定配置与离线元数据。
