---
description: "可选的机器人协作团队层：协作流程提供方、Remote 控制器、agent 工具，以及带群聊标签页的流程画布。"
kind: "package-bundle"
---

# @tomato/experimental-robot-crew-bundle

[English](README.md) | 中文

## 概述

在 Rbot bundle 之上叠加多智能体协作流程：带版本的交接图、持久运行账本、流程画布，以及启动运行并读取运行记录的群聊标签页。这一层默认关闭，同时挂载面向 agent 的协作工具。

## 目录

- [使用本包](#use-this-package)
- [了解实现](#understand-the-implementation)
- [模型体验](#model-experience)
- [已知限制与待办](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在 Web 或桌面端的「插件」里启用 **机器人协作团队**。左侧边栏随即出现协作群聊标签页，流程画布从该标签页打开，agent 也能通过协作工具接收一份 crew 规格。关闭这一层会移除全部五条行；`tomato_crew` 存储域保留数据，重新启用即可恢复协作群与它们的运行记录。

Rbot bundle 保持独立：它只带机器人注册表、机器人页与协作空间，不会自行挂载任何 crew 行。

-----

<a id="understand-the-implementation"></a>
## 了解实现

<details>
<summary>实现细节 —— 展开查看</summary>

[`cordis.patch.yml`](cordis.patch.yml) 贡献基于存储的协作流程提供方、它的 Remote 传输、生成的协作控制器、agent 工具与协作 UI 包。提供方打开持久化的 `tomato_crew` 域并在 Host 上执行已接受的运行；页面在没有 Web Host 时不生效，且只有在其客户端服务挂载后才渲染。

</details>

-----

<a id="model-experience"></a>
## 模型体验

间接体现：成员简报、运行账本与循环护栏都由协作流程相关包拥有。

#### KV Cache 影响

这一层本身不增加任何请求内容。

## 已知限制与待办

<a id="known-limitations-and-deferred-work"></a>

- 协作运行不会在 Host 重启后恢复：提供方会把所有非终态运行结算为失败。
- 群聊标签页只读协作运行；协作空间是另一个独立的产品面，有自己的接线。

### 开发备注

<a id="dev-note"></a>

<details>
<summary>维护者工作上下文 —— 点击展开</summary>

无。

</details>