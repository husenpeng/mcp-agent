---
description: "监管 Desktop Host 手机隧道的设置页：展示配对链接及其二维码。"
kind: "package-reference"
---

# @tomato/client-ui-settings-remote

[English](README.md) | 中文

## 概述

在桌面应用里打开 **设置 → 手机**，可以启停由壳托管的 Cloudflare quick tunnel，让手机上的 Tomato Remote 从其他网络连到这台 Host。页面显示隧道状态、带 token 的配对链接，以及该链接的二维码，并提供复制操作。浏览器构建下页面只说明：只有桌面应用能托管这条连接。

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

页面以 `remote` 设置分区注册进所有组合。在桌面应用里点 **开启隧道**，壳会启动 `cloudflared`，页面跟随壳的状态：`off`、`starting`、`online`、`failed`。在线时显示配对链接及其二维码；手机扫码或粘贴链接都可以，两者都带着 Host 当前的启动 token。**关闭隧道** 结束进程；隧道自行退出时壳会自动重启，退出应用则一定会停止它。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>Implementation internals — click to expand</summary>

页面读取 Desktop preload 暴露的 `window.tomatoDesktop.remote`：`status`、`start`、`stop`、`subscribe`，并把它映射成单个可观察快照，由渲染层绑定到页面的 `useRemote` 钩子；插件的 apply 闭包在第一个订阅者出现时才订阅，因此页面从未挂载时不会产生壳通信。隧道进程、启动 token 与二维码编码都归壳所有，页面只负责渲染。在应用 frame 之外 preload 不提供桥，页面据此提示：连接必须由桌面应用托管。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [desktop](../../../apps/desktop/README.zh.md#remote-access) — `remote` 设置、隧道监管器与 watchdog。
- [connection](../connection/README.zh.md) — 隧道域名必须满足的 `/api` 浏览器信任栅栏。
- [ui-settings](../ui-settings/README.zh.md) — 设置作用域与本文填充的 `settings.section` 槽位。

-----

<a id="model-experience"></a>
## 模型体验

无：本包是浏览器端设置页，不注册任何模型输入。

#### KV Cache 影响

无；本包既不组装也不发送提供方请求。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- **只能由桌面端托管** — 浏览器构建无法启动隧道或生成配对链接，页面会说明这一点而不是降级。
- **链接属于单个进程** — 重启 Host 或隧道都会改变域名与 token；已配对的手机需要读取新链接，除非它已保存的 cookie 仍匹配新的权威。
- **设置项不在页面内编辑** — `remote.tunnel` 决定隧道是否随应用启动；页面按钮只控制当前运行的进程。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>Working context for maintainers — click to expand</summary>

壳把配对链接拼成 `https://<隧道域名>/` 加上它早已从 Host 子进程收到的认证 URL 的 query，因此不新增 token 通道。二维码在主进程里由同一个字符串生成，渲染进程不会拿到第二份凭证。

</details>
