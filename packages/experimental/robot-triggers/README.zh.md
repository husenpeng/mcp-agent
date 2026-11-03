---
description: "从 cron 调度与机器人事件主题启动机器人 run。"
kind: "package-reference"
---

# @tomato/experimental-robot-triggers

[English](README.md) | 中文

## 概述

`@tomato/experimental-robot-triggers` 依据规格中的 `cron` 调度与 `robot/event` 主题启动机器人 run。它不保存触发器状态：插件加载时与注册表写入后，都从每个机器人已发布的 revision 重新计算调度；主机停机期间错过的触发不会被重放。

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

在 `@tomato/experimental-robot-local` 之后挂载本插件；它需要 `robots`，没有配置字段。

- `cron` 触发器在下一次触发时刻到达时，以机器人的 mission 启动 run。
- `event` 触发器在另一个插件发出 `ctx.emit('robot/event', topic, payload)` 时启动 run。
- 因机器人已在运行而被拒绝的 start 会记录日志；它不会排队等待。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部 — 点击展开</summary>

cron 表达式与时区由 `@tomato/schedule` 解析；触发器插件只按当前墙钟读数计算下一次触发，并为最早的待触发项设置一个主机定时器。定时器触发时，所有到期项各自启动 run、重算下一次触发，随后定时器重新布防。无法产生未来触发的调度会被记录日志并跳过。

`tomato_robot` 的 `robots` 与 `revisions` 表上的 `domain/changed` 写入会触发刷新，因此新实例与新规格 revision 无需重启即可生效。事件触发器按精确 topic 匹配；每个匹配的机器人收到一次 start，其用户消息包含 topic 与 JSON 载荷。多个机器人匹配同一 topic 时各自运行。

插件不持久化任何内容：卸载时清除定时器，重启后按当前时间重新计算每个调度。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [`@tomato/experimental-robot`](../robot/README.zh.md)——触发器词汇与服务契约。
- [`@tomato/experimental-robot-local`](../robot-local/README.zh.md)——本包读取的持久注册表。
- [`@tomato/experimental-robot-runtime`](../robot-runtime/README.zh.md)——驱动本包所启动 run 的执行器。
- [机器人平台](../../../docs/subsystems/robot.zh.md)——规格、revision、生命周期与 agent-to-agent 字段。

-----

<a id="model-experience"></a>
## 模型体验

### 触发器 run 输入

#### 模型看到的内容

触发器启动的 run 以机器人 mission 作为用户消息；事件触发器还会附加 topic 与载荷。

##### 触发消息

```markdown
## Cron
<mission>

## Event
<mission>

Robot event: <topic>
<JSON payload>
```

#### Token 影响

向该 run 的首次模型请求加入一条用户消息；不贡献系统提示、工具 schema 或其他上下文。

#### KV Cache 影响

每次触发的 run 打开自己的 Session，因此消息不会替换更早的请求前缀。不同载荷改变该 run 的用户消息，因而改变其首次请求。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- **只有 cron 与事件触发器** —— `webhook`、`dependency` 与 `threshold` 触发器可写入规格，但不会启动 run。
- **错过的触发被跳过** —— 停机的主机不会重放错过的 cron 触发；只调度下一个未来时刻。
- **非法 cron 表达式只记录日志，不在发布时拒绝** —— 规格校验只检查表达式非空；不可用的表达式在触发器加载时被跳过。
- **start 失败只记录日志，不排队** —— 机器人在运行时触发会被丢弃；下一次触发或事件可以启动新的 run。
- **没有持久触发状态或跨进程租约** —— 每个主机都重新计算调度，因此共享同一注册表的两个主机可能启动同一次触发。
- **每个触发器一条消息** —— 整个消息就是 mission；规格无法声明每触发器的输入文本或载荷 schema。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

无。

</details>