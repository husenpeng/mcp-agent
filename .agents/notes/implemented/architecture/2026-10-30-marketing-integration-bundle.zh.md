# Agent Note: 以单个设置驱动插件接入营销平台

Status: implemented

[English](2026-10-30-marketing-integration-bundle.md) | 中文

## 问题

每个广告与营销平台各自发布 MCP 服务，而部署只想要其中几个，并且不想为每个 provider 手改 `cordis.yml`。把服务直接列进 bundle patch，会得到永远开启、凭据只能在文件里改的行；把这样的 profile 交给使用者，就没有可以「填上密钥再打开」的界面。

harness 已有的部件是齐的：`@tomato/mcp-client` 一行挂一个服务，`@tomato/settings` 把 volatile 字段暴露成可编辑表单，凭据域把密钥存到设置文档之外。缺的是一个把「这个 provider 已打开且凭据可解析」变成「现在就挂载这个子连接」的插件。

它建立在既有接缝之上而非替代它们：[profile 拥有的实时配置](2026-09-19-profile-owned-live-configuration.zh.md)负责保存设置并重载条目，[volatile 配置引用](2026-09-18-volatile-config-references.zh.md)定义表单可编辑的字段，[MCP 客户端](../../archived/feature/2026-07-07-mcp-client-plugin.md)拥有每条连接。

## 决定

一个插件 `@tomato/marketing` 拥有一个扁平的设置段：每个 provider 一个开关与一个凭据引用，外加一张 MCP 目录。`apply` 先经 `ctx.credentials` 与启动环境解析引用，然后为每个「已开启且凭据可解析」的 provider 创建一个 `@tomato/mcp-client` 子连接。所有 provider 默认关闭，因此把 bundle 加入 profile 不会发布任何工具、进程或提示词文本。

`@tomato/client-ui-settings-marketing` 通过 `ctx.configForms` 在插件页渲染该设置段，并把每个密钥经 `remote.credentials` 写到设置段所指的引用下。保存设置会改写 profile patch，进而重载条目并以新设置重跑 `apply`，于是打开 provider 会挂载其服务、关闭 provider 会卸载子连接。

`@tomato/marketing-app` 是 bundle：一个含插件行与页面行的 patch，不配置任何 provider。它不属于任何出厂 profile 模板。

目录是 `providers.ts` 中的数据——服务名、命令、参数、必需与可选环境变量名——同一张表也给出页面暂存的字段名。上游改了控制台脚本名时，按配置修正而不是改代码。

## Alternatives considered

**每个 provider 一个 bundle。** 七个 bundle、七个设置命名空间、七个页面把同一个决定重复七次，测试面翻倍；否决原因是产品收益为零。

**在 Web bundle 里直接写静态 MCP 行。** 行可以开关，但 `env` 来自 profile patch，在界面里配密钥的人没有通路抵达子进程；否决原因是 `mcp-client` 在连接时读取环境变量，没有任何环节把界面写入的密钥带过去。

**让 `mcp-client` 支持凭据引用。** 教会核心客户端在 `env` 中解析凭据，会为了一个集成族改动所有 MCP 行都在用的包；否决原因是影响面过大。

**设置文档里按 provider 嵌套。** `SettingsFormModel` 只寻址顶层字段，嵌套段需要另写表单模型而非复用共享实现；否决原因是复用失败。

## 后果

- 字段是扁平的带前缀结构；新增 provider 需要在 `index.ts` 增加一个开关与其引用字段，并在目录中增加一条。
- 启动失败的 provider 只由 `@tomato/mcp-client` 记入日志；页面只报告凭据状态，因此暂无页面级诊断。
- bundle 是工作区包而非已发布包，插件页不会列出它供按需安装；profile 需显式选择它。
- 组合冒烟测试（[`marketing.composition.spec.ts`](../../../../packages/marketing/marketing/tests/marketing.composition.spec.ts)）让 headless profile 带上该行启动并断言没有任何 `mcp__` 工具，从而钉住「默认关闭」这条承诺；已挂载路径由 [`resolve-mounts.spec.ts`](../../../../packages/marketing/marketing/tests/resolve-mounts.spec.ts) 在不启动服务的前提下覆盖。