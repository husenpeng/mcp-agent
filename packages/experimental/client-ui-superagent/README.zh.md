---
description: "把团队工单放在对话旁边 —— 提交任务、实时观察流程，并可中途介入。"
kind: "package-reference"
---

# @tomato/client-ui-superagent

[English](README.md) | 中文

## 概述

在 Host 团队的 `superagentTickets` Remote 之上注册一个右侧栏页面。输入框向团队提交请求；列表实时跟随每次已提交的变更，显示每张工单的标题、阶段、在等人做什么、最近一次执行报告的状态、审查轮次与阻塞性发现。选中一张工单即打开它的流程——授权、每次运行与报告、最近一次审查、话题消息——并提供控件：打断正在执行的运行、终止工单、或发送新的上下文让下一次运行从中继续。面板不触达模型。

## 目录

- [使用本包](#use-this-package)
- [开发备注](#dev-note)
- [模型体验](#model-experience)
- [已知限制与待办](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## 使用本包

在 Web profile 中把它与 `@tomato/superagent-runtime` 一起挂载：

```yml
- insert:
    - id: client-ui-superagent
      name: '@tomato/client-ui-superagent'
```

页面会出现在任意会话的右侧栏，标题是「团队工单」。打开页面会读取 Host 的持久化工单存储并开始跟随它的 `watch` 流；「刷新」会重新读取列表。首次读取失败时可点「重试」，读取失败或流断开时保留此前列表。

输入请求并按「提交」：团队受理、规划并在后台执行；被婉拒或拒绝的请求连同原因留在界面上。选中一行即可读取完整流程。运行进行中时，「打断执行」中止它但保留工单；「终止工单」彻底结束它。消息框把上下文或回答发到工单的话题，下一次运行把它作为最新指示读取。

-----

<a id="dev-note"></a>
## 开发备注

<details>
<summary>实现内部 —— 点击展开</summary>

客户端半边挂载 `@tomato/superagent-runtime/remote` 中生成的 Remote contribution，等 `remote.superagentTickets` 可用后注册面板。一个 Host 读取控制器持有身份稳定的快照：并发列表读取共享同一个请求，`watch` 流发布每一帧，释放会取消正在进行的读取与流，迟到结果不会覆盖状态。每次成功的变更操作后刷新列表；所选工单的行变化时重新读取详情。

</details>

-----

<a id="model-experience"></a>
## 模型体验

无：没有任何模型请求携带这个页面的文本。

#### KV Cache 影响

无：该页面从不运行回合。

-----

## 已知限制与待办

<a id="known-limitations-and-deferred-work"></a>

- **一次一张工单。** 流程视图一次打开一张工单；没有多工单对比。
- **打断只触及执行运行。** 团队在规划或审查时工单没有打开的执行，打断控件不出现；Host 会以 `superagent/not-running` 拒绝打断。
- **没有合并控件。** 审查过的工单等人处理；合并属于本面板不拥有的界面。