---
description: "番茄侧栏账户入口与设置账户页，基于本地网关的 auth_service 会话。"
kind: "package-reference"
---

# @tomato/account

[English](README.md) | 中文

## 概述

`@tomato/account` 是浏览器侧账户界面。它用一个与 React 无关的快照读取本地网关的 `/api/auth/session`，并注册侧栏入口与设置「账户」页。页面显示已登录、未登录、登录服务不可用三态；提供登录、退出与重试，不做资料编辑。Web 用弹窗打开网关登录；Desktop 调用 `dshDesktop.account` preload 桥，由主进程持有隔离窗口与已存会话。

## 目录

- [使用本包](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

<a id="use-this-package"></a>

## 使用本包

在浏览器插件清单中、`ui-settings` 与 `locale` 之后挂载。它注册两个槽位：

| 槽位 | 界面 |
|---|---|
| `settings.launcher` | 侧栏账户入口与菜单 |
| `settings.section` | 设置内的账户页 |

Client service 维护 `loading`、`signed-in`、`signed-out`、`unavailable` 四态。挂载、窗口获得焦点、登录弹窗发出 `tomato-auth-result` 后各读一次网关；不做轮询。登出在 Web 调 `POST /api/auth/logout`，在 Desktop 走 preload 桥，然后刷新投影；auth_service 未确认远端吊销时显示可关闭提示。

渲染进程永远拿不到 sessionId：Web 存在 httpOnly `tomato_session` cookie，Desktop 由主进程存入 `safeStorage`。

## Model Experience

无。本包只展示账户状态并发出浏览器认证命令。

#### KV Cache effect

无；本包既不组装也不发送 provider 请求。

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **资料只读** —— 页面显示 auth_service 的 `name`、`email`、`avatarUrl`，不调用 `PATCH /profile`。
- **没有服务端会话缓存** —— 每次读取都打 `/api/auth/session`；auth_service 慢会延迟侧栏入口。
- **头像直连提供方 URL** —— 没有图片代理；被阻断时回退为首字母。
- **额外语言是英文占位** —— key 集合完整，但只有 `en` 与 `zh` 的文案经过审阅。

<a id="dev-note"></a>

### 开发备注

<details>
<summary>维护者工作上下文——点击展开</summary>

Desktop 桥是可选的：没有 `dshDesktop.account` 的页面走同源弹窗路径。两条路径共用 controller 与槽位组件，只有登录/登出命令分支。

</details>