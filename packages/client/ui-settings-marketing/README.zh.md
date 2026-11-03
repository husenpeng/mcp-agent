---
description: "Tomato Web 客户端插件页上的营销设置页：每个广告或营销 provider 一个开关，以及它需要的凭据引用。"
kind: "package-reference"
---

# @tomato/client-ui-settings-marketing

[English](README.md) | 中文

## 概述

在侧栏打开 **插件**，选择 **营销**，即可开启广告与营销 provider 并填写各自需要的凭据。页面先暂存输入，保存时才写入；凭据经凭据域写入而不是写进设置文档，因此密钥字面量不会随响应传输。该页面在宿主提供 `marketing` 命名空间时存在，该命名空间由[营销插件](../../marketing/marketing/README.zh.md)提供。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与待办](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

## 使用本包

<a id="use-this-package"></a>

官方分组的 **营销** 卡片打开该页面。页面按 provider 分组渲染——Google Ads、Google Analytics 4、Meta/Instagram/TikTok/YouTube/X、Mailchimp——每组包含一个 **启用** 开关，以及该 provider 读取的凭据控件。

每次载入时凭据控件都是空的，只报告该设置段所指引用下是否已配置凭据；留空表示保留已存值。设置段改名后按新名字寻址，因此自行导出环境变量的部署无需改动页面。当凭据域报告某引用不可写时（例如值来自进程环境），对应控件禁用。

保存前不写入任何内容；离开页面会丢弃草稿。一次保存会把暂存的开关写入设置段、把暂存的凭据写入各自引用，provider 的 MCP 服务随之因重新组合而挂载或卸载。

-----

## 理解实现

<a id="understand-the-implementation"></a>

<details>
<summary>实现内部——点击展开</summary>

宿主半边是空的 `apply`，只是让该包持有加载器行，以便客户端模块系统为其提供浏览器半边。浏览器半边通过 `ctx.configForms.get` 绑定 `marketing` 命名空间，并在 `MarketingCardController` 中维护一个 `ui-primitives` 的 `SettingsFormModel`。开关是暂存为文本的布尔字段；七个凭据控件是表单的 secret 规格，其写入经 `remote.credentials.set` 落到对应设置字段所指的引用，成功与否再从 `remote.credentials.describe` 读回。

控制器接收一个窄的凭据面而非浏览器上下文，因此包内测试可用内存设置段与记录型凭据面驱动，无需渲染器。页面通过 `ctx.configForms.whileServed` 注册到插件页的 `plugins.item` 槽位。

</details>

-----

## 进一步探索

<a id="further-exploration"></a>

- [营销插件](../../marketing/marketing/README.zh.md) —— 本页编辑的命名空间、字段与凭据解析。
- [ui-plugin-manager](../ui-plugin-manager/README.zh.md) —— 插件页与 `plugins.item` 槽位。
- [ui-primitives](../ui-primitives/README.zh.md) —— 页面渲染所用的设置表单模型与字段。
- [credentials](../../credentials/README.zh.md) —— 每个凭据控件写入所经的引用接缝。

-----

## 模型体验

<a id="model-experience"></a>

无。本包是浏览器侧设置界面，不注册任何模型面。

#### KV Cache 影响

无；本包既不组装也不发送 provider 请求。

## 已知限制与待办

<a id="known-limitations-and-deferred-work"></a>

- **没有 provider 启动诊断。** 页面只报告凭据状态；启动失败的服务只表现为工具缺席，页面上没有提示。
- **不能覆盖命令。** 每个 provider 的 MCP 命令与包名保留在宿主目录中；此处只编辑开关与凭据引用。
- **仅两种语言。** 页面提供英文与简体中文词典，其他 Web 语言回落到英文。

-----

### 开发备注

<a id="dev-note"></a>

<details>
<summary>维护者工作上下文——点击展开</summary>

控制器把凭据面作为参数接收，只是为了测试能在没有浏览器上下文的情况下驱动它；生产路径传入的是 `remote.credentials` 之上的适配器。保持 provider 表与宿主目录中的字段名一致：改名后的设置字段到达本页时表现为未知引用，而不是报错。

</details>
