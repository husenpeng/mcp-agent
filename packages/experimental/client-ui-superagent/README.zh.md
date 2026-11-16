---
description: "把团队工单放在对话旁边 —— 一条只读记录对应一张工单及其所处状态。"
kind: "package-reference"
---

# @tomato/client-ui-superagent

[English](README.md) | 中文

## 摘要

注册一个右侧栏页面，列出你正在阅读的会话所对应的团队工单。它只渲染运行时已经写入的内容：页面读取该会话事件窗口中最新的 `plugin:superagent/tickets` 记录，逐条显示工单标题、所处阶段、在等人做什么、最近一次执行报告的状态、已审查轮次，以及仍有多少阻塞性发现。页面只读，且不触达模型。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [模型体验](#model-experience)
- [已知限制与待办](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## 使用本包

在 Web profile 中挂在工作区相关行旁边：

```yml
- insert:
    - id: client-ui-superagent
      name: '@tomato/client-ui-superagent'
```

页面会出现在任意会话的右侧栏，标题是「团队工单」。运行时尚未写入列表时，页面会明说这一点，而不是渲染空表。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部 —— 点击展开</summary>

客户端半边只从会话自己的事件窗口读取行（`latestTickets` 取最新一条记录），因此不需要 Host 端点，也不新增 Remote 命名空间。畸形记录逐字段丢弃而不是信任；不是数组的负载不产生任何行。

面板按会话订阅并缓存一份数据源；最后一个订阅者离开时取消订阅。

</details>

-----

## 模型体验

无：没有任何模型请求携带这个页面的文本。

#### KV Cache 影响

无：该页面从不运行回合。

-----

## 已知限制与待办

<a id="known-limitations-and-deferred-work"></a>

- **它显示的是你打开的那个会话。** 运行时把列表写进主管会话，因此别的会话右侧栏看到的是它自己（空的）列表，除非团队在那里跑过；要任意会话都能读到团队列表，需要一个 Host Remote。
- **它不能执行动作。** 面板没有确认、重试或停止控件：工单的下一步属于引擎，必要时属于在别处行动的人。
