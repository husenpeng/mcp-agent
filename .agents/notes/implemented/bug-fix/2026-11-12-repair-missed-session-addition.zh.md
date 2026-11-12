# Agent Note: 从后续通知修复丢失的 Session 新增

Status: implemented

[English](2026-11-12-repair-missed-session-addition.md) | 中文

## 问题

会话列表客户端只从一个转发的 `api-session/added` 通知获得集合成员关系。此后针对同一 Session 的每个通知（`api-session/status`、`api-session/activity`、`api-session/error`）都只修改已存在的行。当这唯一的“新增”通知丢失——转发的 event stream 断开、重连空档，或一次早于创建的列表读取——客户端就没有对应的行，并静默丢弃该身份之后的所有通知。会话在该客户端上一直不可见，直到重载或重启重新读取 `session/list`。手机通过已配对的 Host 链接新建会话时，会在 Mac 桌面客户端上复现这一现象。

同一条路径上还有一个范围更窄的情形：以 `blank: true` 到达的行会一直停留在草稿状态，直到一条运行状态通知将其清除；因此当本客户端错过那条状态通知时，另一个客户端写入的对话不会显示。

## 决策

`SessionManager` 把任何指向未知 Session 的实时通知视为列表已过期的证据，并请求一次列表修复：没有进行中的列表请求时立即拉取一次；已有请求在进行时，在其结束后再拉取一次，因为该响应可能早于这条通知。每个身份在每个 Host generation 内最多请求一次；重新连接和移除都会清空该集合。集合成员关系仍然只来自 `session/list`；通知从不凭空创建行。

持久的用户消息（`api-session/activity`）也会记录已有的受理观察，且 `handleSessionAdded` 应用列表路径相同的 `effectiveBlank` 协调，因此已在运行时宣布的 Session 不会被展示成草稿。

## 考虑过的备选方案

**用定时器轮询列表。** iOS 客户端已经每 60 秒重读一次作为自己的修复。桌面客户端的后台定时器会为每个空闲客户端消耗请求，且仍留有不受限的盲区。

**用通知合并占位行。** 通知只携带 Session id，不携带摘要；占位行会展示标题、目录和投影都不是从任何读取得到的行，而 Host 列表仍是成员关系的唯一权威。

**在窗口获得焦点或可见时刷新。** 只在客户端回到前台时覆盖用户可见情形；窗口可见期间创建、而 event stream 已断开的会话仍然不可见。

## 后果

- 丢失一次新增最多花费一次额外的列表读取，且以该身份出现为条件；收到全部新增的客户端读取的内容与之前完全相同。
- 修复仅在客户端内：不改变 Host 事件、wire 字段或持久化格式。
- 理所当然不会进入 `session/list` 的 Session——例如通过父级目录寻址的常驻 subagent——会被常驻实例与地址检查排除在修复之外。

## 验证

- `packages/api/session-controller/tests/manager.client.spec.ts` 覆盖：从 status 与从 activity 通知修复丢失的新增、进行中拉取之后的补读、每个身份与每代只修复一次、运行中宣布的会话不是草稿，以及 activity 结束草稿展示。
- `packages/api/session-controller/tests/client-apply.client.spec.ts` 覆盖经由组装客户端 `$events` stream 的同一恢复。

## 相关决策

[blank 回退修复决策](2026-09-15-client-session-blank-reconciliation.zh.md) 拥有本次扩展的受理观察；[Client Session 引用决策](../architecture/2026-09-15-client-session-references.zh.md) 拥有列表刷新与保留规则。