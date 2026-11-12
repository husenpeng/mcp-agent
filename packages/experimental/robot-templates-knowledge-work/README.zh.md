---
description: "十六个知识工作机器人模板，以及从 Anthropic knowledge-work-plugins 适配而来的内置技能。"
kind: "package-reference"
---

# @tomato/experimental-robot-templates-knowledge-work

[English](README.md) | 中文

## 概述

`@tomato/experimental-robot-templates-knowledge-work` 把 Anthropic 开源的 [knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) 适配进 Tomato：十六个岗位插件变成十六个可聘用机器人模板和 181 个内置技能。`plugins/` 下的 vendored 目录与上游逐字节一致（Apache-2.0），上游新提交可直接整目录替换而不必合并；`src/` 里的适配层把每个 `SKILL.md`、`commands/*.md` 和 `.mcp.json` 声明转换成 Tomato 技能词汇，并显式报告无法承接的 Claude 专有特性。

## 目录

- [使用本包](#use-this-package)
- [实现说明](#understand-the-implementation)
- [延伸阅读](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延后工作](#known-limitations-and-deferred-work)
- [开发者注记](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

`@tomato/experimental-robot-app` bundle 在营销模板行之后挂载本插件。它声明 `robotTemplates` 与 `skills` 两个依赖，没有配置字段。不在该 bundle 中时，自行加入这一行：

```yaml
- id: robot-templates-knowledge-work
  name: '@tomato/experimental-robot-templates-knowledge-work'
```

- 十六个岗位在机器人页各出现一张模板卡。聘用后发布一份归用户所有的规格；之后模板或上游的改动都不会影响已聘用的机器人。
- 所有模板共用同一执行档案：手动触发、40 万 token / 30 分钟 / 300 次工具调用预算、`workspace-write` 权限预设、不限制网络、以对话消息交付。
- 模板的 `capability.skills` 列出该岗位的全部技能，因此一次运行的可加载技能目录只包含本岗位的技能，不会带进本包的其它岗位技能。
- 模板不声明 MCP 服务器。没有任何连接器时运行依然可用；vendored 的 `.mcp.json` 声明可通过 `connectorPlan` 交给由部署方自行挂载连接器的场景。

| 岗位 | 模板 id | 技能数 | 目录 token 约数 |
|---|---|---|---|
| 营销 | `marketing` | 8 | 644 |
| 销售 | `sales` | 36 | 3,092 |
| 客户支持 | `customer-support` | 5 | 338 |
| 产品管理 | `product-management` | 9 | 589 |
| 个人效率 | `productivity` | 4 | 246 |
| 法务 | `legal` | 9 | 744 |
| 财务 | `finance` | 8 | 535 |
| 数据 | `data` | 10 | 744 |
| 企业搜索 | `enterprise-search` | 5 | 296 |
| 生物研发 | `bio-research` | 6 | 612 |
| 工程 | `engineering` | 10 | 633 |
| 设计 | `design` | 7 | 456 |
| 人力资源 | `human-resources` | 9 | 577 |
| 业务运营 | `operations` | 9 | 617 |
| 小微企业 | `small-business` | 44 | 5,450 |
| 插件管理 | `cowork-plugin-management` | 2 | 155 |

目录 token 按 `tool-skill` 默认的 500 字符描述上限计算。

[第三方声明](THIRD_PARTY_NOTICES.md) 记录了 vendored 来源及其许可证。

-----

<a id="understand-the-implementation"></a>
## 实现说明

<details>
<summary>实现内部细节——点击展开</summary>

`src/plugins.ts` 读取每个 vendored 插件：清单提供版本与摘要，`skills/*/SKILL.md` 与 `commands/*.md` 提供指令，`.mcp.json` 提供连接器声明。它在加载期做三处改写，把文件转换成 Tomato 技能词汇，而 vendored 字节保持可编辑、可与上游逐行对比：

- **连接器占位符。** `~~category` 变成 `<category> tool`；插件 `CONNECTORS.md` 里列出的标签先替换，且长标签优先，避免双词标签被首个单词截断。
- **斜杠命令。** 指向同插件内置技能或命令的 `/name` 片段变成 `the <name> skill`；指向插件未内置命令的片段保持原样，因为 Tomato 中没有同名技能可解析。
- **命令参数。** `$ARGUMENTS` 变成 `the user's request`，导入的命令因此读起来就是一个普通的用户可调用技能。

有四个技能名在两个岗位重复出现——`competitive-brief`（营销与产品管理）、`lead-triage`（销售与小微企业）、`start`（生物研发与个人效率）。适配层给这些名字统一加上岗位前缀（`marketing-competitive-brief`、`sales-lead-triage`、`bio-research-start`），两个版本都可加载，其余 175 个名字保持上游写法。

`src/templates.ts` 持有十六个岗位的中英文卡片文案和一份共用执行档案。`src/index.ts` 为每个文件生成一个技能候选，注册一个以技能目录为资源根的 bundled provider，并在 `ctx.effect` 内注册每个模板，卸载时一并移除。`src/connectors.ts` 把 `.mcp.json` 声明转换成 `mcp-client` 行，将服务器名规范化为 `[A-Za-z0-9_-]{1,32}` 命名空间，并报告缺少端点、需要 OAuth、端点冲突的声明，而不是产出一行注定失败的行。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) — vendored 的上游仓库。
- [`@tomato/experimental-robot`](../robot/README.zh.md) — 模板注册表与模板到规格的转换。
- [`@tomato/experimental-robot-runtime`](../robot-runtime/README.zh.md) — 把运行技能目录限制为模板声明技能的执行器。
- [`@tomato/experimental-robot-templates-marketing`](../robot-templates-marketing/README.zh.md) — 共用同一执行档案的创作者营销模板。
- [`@tomato/mcp-client`](../../mcp/mcp-client/README.zh.md) — 挂载连接器行的插件。

-----

<a id="model-experience"></a>
## 模型体验

### 机器人任务说明

#### 模型看到什么

被聘用机器人的运行通过运行时的 `robot:mission` 提示区收到模板的 mission、成功标准与验收条件。mission 点明岗位，并要求模型先选用匹配的岗位技能再行动。

#### Token 影响

每个运行的任务说明区约 150–250 token。

#### KV 缓存影响

任务说明在一个规格修订内保持稳定；加载技能会把技能正文追加在已缓存前缀之后。

### 内置技能目录

#### 模型看到什么

只要 `skill` 工具可见，每个已挂载技能都会贡献一行目录（名称加描述）。181 行合计约 15,700 token（按默认 500 字符描述上限计算）；机器人运行只声明本岗位技能，其目录开销为上表对应列。

#### Token 影响

挂载本插件会在每个会话加入完整目录；机器人运行只加入本岗位的那部分。加载一份正文再增加约 500–1,500 token。

#### KV 缓存影响

provider 挂载期间目录保持稳定；成员变化时以完整替换追加，不影响其之前的前缀。

<a id="known-limitations-and-deferred-work"></a>

## 已知限制与延后工作

- **连接器需要人来补完。** 85 个声明全部是 Streamable HTTP 端点，多数依赖 Claude 的交互式 OAuth 授权。`mcp-client` 只接受 URL 与静态 header，不执行 OAuth 流程，这类声明会出现在 `connectorPlan().gaps.needsOAuth`，部署方需要自行提供 token header（`cordis.yml` 里的 `!!js` 值）才能在机器人里命名该服务器。
- **`allowed-tools` 被丢弃。** 44 个 vendored 技能声明了 Claude 工具白名单。Tomato 按机器人而不是按技能限制工具，因此该行留在 vendored 文件里、适配层忽略它，运行按模板的 `capability.tools` 列表执行。
- **命令以无参数占位符的技能形式导入。** 唯一 vendored 命令（`product-management/commands/brainstorm.md`）变成一个普通用户可调用技能；`/brainstorm` 通过技能手势可用，但 Tomato 没有 `$ARGUMENTS` 替换，正文在导入时改写。
- **`CONNECTORS.md` 链接保持相对路径。** 正文保留 `[CONNECTORS.md](../../CONNECTORS.md)`，因为 vendored 目录结构被完整保留；在别的工作目录读该链接不会解析，实际可执行的指示在改写后的 `~~category` 文本里。
- **上游同步是手动的。** vendored 文件从不就地修改，上游新提交等于整目录替换加一次适配层测试。适配层无法转换的技能（缺 `description`、名称与目录不一致）会让插件加载失败并给出文件路径。
- **十六个岗位文案由本包撰写。** 上游不提供卡片文案；中英文 mission、成功标准与验收条件都在本包维护，上游新增岗位时需要随之补充。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文——点击展开</summary>

从新的上游检出重新同步：

```sh
rsync -a --delete \
  --exclude .git --exclude .github --exclude partner-built --exclude pdf-viewer \
  /path/to/knowledge-work-plugins/ packages/experimental/robot-templates-knowledge-work/plugins/
```

然后运行本包测试。新增岗位必须在 `ROLE_COPY` 中补一条，否则插件会拒绝加载并指出目录名。`readPlugins` 与 `connectorPlan` 均已导出，脚本或测试可在不挂载插件的情况下检查 vendored 目录。

</details>