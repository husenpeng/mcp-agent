---
description: "为 Tomato Rbot 提供的 11 个创作者营销机器人模板，以及这些机器人运行时加载的内置技能。"
kind: "package-reference"
---

# @tomato/experimental-robot-templates-marketing

[English](README.md) | 中文

## 概述

`@tomato/experimental-robot-templates-marketing` 向 `ctx.robotTemplates` 注册创作者营销机器人模板，并提供这些机器人加载的内置技能。本包提供 11 个模板，每个模板都有自己的技能：品牌营销洞察、达人营销、素材与竞品情报，以及 TikTok、Instagram、X、YouTube 各一个选品分析模板和一个数据洞察模板。只有技能已随本包发布的模板才会出现在页面上。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [延伸阅读](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

`@tomato/experimental-robot-app` 组合包在 `@tomato/experimental-robot/templates` 注册表行之后挂载本插件。它需要 `robotTemplates` 和 `skills`，没有配置字段。

- 每个模板在机器人页上显示为一张卡片；聘用时，以页面语言发布一份归用户所有的规格并实例化。之后修改机器人不会改动模板，模板更新也不会改动已聘用的机器人。
- 所有模板都使用手动触发、40 万 token / 30 分钟 / 300 次工具调用的预算、`workspace-write` 权限预设、不限网络，交付物为文件：在运行的工作目录写出一份 HTML 报告和一份 xlsx 明细表。
- 分析对象由运行指令提供，例如品牌与竞品、搜索关键词或频道 handle。
- 每个技能在设置了对应凭据环境变量时使用官方 API，否则使用无需密钥的公开数据源；技能从不登录平台账号、不传入 cookie，也不下载媒体。缺失的凭据和无法访问的数据源会在报告中记为数据缺口。

| 技能 | 官方凭据 | 无密钥数据源 |
|---|---|---|
| `brand-insight` | `YOUTUBE_API_KEY`；`REDDIT_CLIENT_ID` 和 `REDDIT_CLIENT_SECRET` | GDELT、Wikimedia Pageviews、Hacker News |
| `influencer-marketing` | `YOUTUBE_API_KEY`；`X_BEARER_TOKEN` | yt-dlp、Instaloader |
| `creative-intelligence` | `META_ACCESS_TOKEN`（Meta 广告库） | 无；`--ads-file` 可重新分析已保存的导出 |
| `tiktok-product-selection` | 无 | 用户提供的快照 CSV、商品页、配合 `TIKTOK_MS_TOKEN` 的 TikTokApi |
| `tiktok-data-insight` | `TIKTOK_ACCESS_TOKEN`（Display API，仅授权账号） | 配合 `TIKTOK_MS_TOKEN` 的 TikTokApi、yt-dlp |
| `instagram-product-selection`、`instagram-data-insight` | `META_ACCESS_TOKEN` 和 `IG_USER_ID` | Instaloader |
| `x-product-selection`、`x-data-insight` | `X_BEARER_TOKEN`（按读取次数付费） | 以 Reddit 和 Hacker News 替代；从不抓取 X |
| `youtube-product-selection`、`youtube-data-insight` | `YOUTUBE_API_KEY` | yt-dlp |

[第三方声明](THIRD_PARTY_NOTICES.md) 列出技能安装或导入的项目。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部 — 点击展开</summary>

`src/templates.ts` 用同一套执行配置加上每个模板的中英文文案生成全部模板；任务目标写明先加载哪个技能。`src/index.ts` 在加载时读取每个 `skills/<name>/SKILL.md`，frontmatter 中的 `name` 与目录名不一致时拒绝加载；它注册一个内置技能 provider，资源根目录为技能目录，再注册技能全部存在的模板。

每个技能的 Python 脚本分为采集（`collect.py`）、纯指标计算（`metrics.py`）和文件输出（`report.py`），由一个命令行入口调用；技能各自复制所需的辅助代码，不导入其他技能。HTML 报告可独立打开，所有值都经过转义。缺失的计数保持为空，不当作 0；每个无法访问的数据源都会在两个文件中各记一条数据缺口。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [`@tomato/experimental-robot`](../robot/README.zh.md) — 模板注册表，以及从模板到规格的转换。
- [`@tomato/experimental-robot-app`](../robot-app/README.zh.md) — 挂载本包的组合包。

-----

<a id="model-experience"></a>
## 模型体验

### 机器人任务

#### 模型看到什么

已聘用机器人的每次运行，通过运行时的 `robot:mission` 提示段收到模板的任务目标、成功标准和验收标准。任务目标写明要加载的技能。技能目录列出每个已发布技能的名称和描述；模型调用技能时才加载其正文。

#### Token 影响

任务提示段每次运行约增加 150 到 250 个 token。每个已发布技能在目录中占一行；技能正文加载后约 1,000 到 1,500 个 token。

#### KV 缓存影响

任务提示段在同一规格修订内保持不变。加载技能会把正文追加在已缓存的前缀之后。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- **估算值与替代指标** — TikTok Shop 销量来自两次快照之间已售数的差值，因此首次运行没有销量增量；Instagram 只提供需求信号，没有销量；Meta 广告库只返回投放到欧盟和英国的商业广告。
- **尚未对接真实平台验证** — 每个技能的测试都用录制的响应离线运行；Graph API、Display API 和 X API 的字段名依据官方文档，需要用真实凭据运行一次确认。
- **运行时不会按规格挂载技能** — `capability.skills` 和 `capability.network` 会保存但不会强制执行；任务目标告诉模型加载哪个技能，该技能必须出现在本次运行的技能目录中。
- **实时采集依赖网络访问** — 技能的所有数据源都无法访问时，以状态码 2 退出并说明原因；GDELT 等公开数据源会对共享出口地址限流。
- **平台条款** — 采集公开页面可能与平台服务条款冲突；技能从不登录，会限制请求频率，并记录每个指标的来源。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作背景 — 点击展开</summary>

在包目录下，用任意带 XlsxWriter 的 Python 3.11+ 运行某个技能的离线测试：`python -m unittest discover -s skills/<skill>/tests`。当 `TOMATO_SKILL_PYTHON` 或 `PATH` 上的 `python3.11+` 满足条件时，包测试会运行每个技能的测试。11 个模板背后的调研资料保存在包外。

</details>
