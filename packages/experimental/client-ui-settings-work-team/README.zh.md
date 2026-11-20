---
description: "tomato Web 客户端插件页上的工作团队设置页：tool-work-team 条目里 work_team_create 新建机器人继承的默认值，以及客户端机器人注册表中每个已发布机器人的模型路由。"
kind: "package-reference"
---

# @tomato/client-ui-settings-work-team

[English](README.md) | 中文

## 概述

在侧栏打开**插件**，在官方分组里选择**工作团队**，即可设置 `work_team_create` 工具新建每个机器人时使用的模型路由与沙箱限制，并修改每个已发布机器人的模型。Host 服务 `tool-work-team` 条目时页面就存在；机器人部分读取客户端机器人注册表，即使默认配置表单尚未就绪也仍然可用。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

**团队默认配置**暂存 Host `tool-work-team` 条目的四个可实时编辑的 Config 字段：默认提供方、默认模型、权限预设和沙箱（none、workspace、full 三选一）。每个字段显示其生效值；清空文本字段并保存即让它重新继承组合层默认值。一次**保存**把所有暂存修改作为一次带修订栅栏的写入提交，被拒绝的保存保留草稿并报告失败。离开页面即丢弃草稿。

**机器人成员**列出每个已发布的机器人规格及其当前提供方和模型。修改任一输入框后点击该行的**保存**：页面会发布一个更新了 `goal.model` 的新规格修订，然后把绑定到该规格的每个机器人实例重新绑定到新修订。该行就地报告成功或失败；失败的保存保留草稿，供修改后重试。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节——点击展开</summary>

宿主半侧是一个空的 `apply`，只为让本包占一条 Loader 行，客户端模块系统据此送出浏览器半侧。浏览器半侧通过 `ctx.configForms.get` 绑定 `tool-work-team` 条目：`WorkTeamDefaultsCardController` 用 `ui-primitives` 的共享 `SettingsFormModel` 暂存四个字段，沙箱字段规格只接受三种限制级别。`workTeamCardFace` 把该表单与 `ctx.robotRuns` 的注册表源及其 `publish`/`rebind` 透传合成 `WorkTeamSettingsCard` 渲染的一个 face；按规格 id 记录的草稿与保存结果是组件局部状态。页面通过 `ctx.configForms.whileServed` 监视该条目，注册进插件页的 `plugins.item` slot。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [ui-plugin-manager](../../client/ui-plugin-manager/README.zh.md)——插件页以及本页注册进去的 `plugins.item` slot。
- [ui-settings](../../client/ui-settings/README.zh.md)——本页依赖的设置 scope 与"命名空间被服务期间"的监视。
- [ui-primitives](../../client/ui-primitives/README.zh.md)——默认配置部分渲染的设置表单模型与字段。
- [tool-work-team](../tool-work-team/README.zh.md)——默认配置部分编辑其 Config 字段的 Host 工具。
- [api-robot-controller](../../api/robot-controller/README.zh.md)——机器人部分驱动的客户端机器人注册表、发布与重新绑定。

-----

<a id="model-experience"></a>
## 模型体验

无，本包是浏览器侧的设置界面，不注册任何模型面。

#### KV 缓存影响

无；本包既不组装也不发送提供方请求。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- **机器人行只编辑模型路由**——提供方和模型是自由文本，没有目录校验；部署无法访问的路由会被注册表接受，并在运行时失败。
- **重新绑定读取保存时刻的快照**——在发布与重新绑定循环之间创建的机器人实例仍绑定旧修订，直到下一次保存。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文——点击展开</summary>

无。

</details>
