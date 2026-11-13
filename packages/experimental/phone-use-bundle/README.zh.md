---
description: "给 tomato --profile 表面增加手机控制的可选 profile 层。"
kind: "package-bundle"
---

# @tomato/experimental-phone-use-bundle

[English](README.md) | 中文

## 概述

给 profile 增加手机控制：两个观测与操作已连接手机的工具，以及在 macOS 上负责续签与拉起 runner 的设备管家。在 Tomato Remote 应用里配对一次，`phone` 命名空间就能承载所有命令；设备上不监听端口。本层自身不拥有行为——每一行所属的包才是所有者。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与后续工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

把这一层加进已带基础组合的 profile，并在依赖续签之前把 `iosProjectDir` 指向源码检出目录。

### 安装进 profile

```text
tomato plugin --profile <name> add @tomato/experimental-phone-use-bundle
tomato plugin --profile <name> remove @tomato/experimental-phone-use-bundle
```

### 你会得到什么

| 行 | 所有者 | 表面 |
|---|---|---|
| `phone-use` | `@tomato/experimental-phone-use` | `phone_observe`、`phone_act` 与 `phone` 命名空间。 |
| `phone-use-macos` | `@tomato/experimental-phone-use-macos` | 续签、拉起与 `phoneDevice` 命名空间；仅 macOS。 |

没有已配对的手机时，工具回答“没有已连接的手机”，其他部分不变。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内幕 —— 点击展开</summary>

补丁插入两行。`phone-use-macos` 带 `!!js process.platform !== 'darwin'`，其他平台静默跳过。profile 可按 id 覆盖任一行，逐行以最后一次写入为准。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [手机工具](../phone-use/README.zh.md)：观测、动作与确认。
- [设备管家](../phone-use-macos/README.zh.md)：Mac 侧的续签与拉起。
- [基础 bundle](../../bundle/base/README.zh.md)：本层所扩展的组合。

-----

<a id="model-experience"></a>
## 模型体验

Indirectly, through the inserted rows: `phone-use` owns the tools the model sees.

#### KV Cache effect

None.

## 已知限制与后续工作

<a id="known-limitations-and-deferred-work"></a>

- 本 bundle 不安装也不拉起 runner；那是设备管家行的事，且只在 macOS 上。
- `iosProjectDir` 没有默认值：打包后的 Desktop 不含 `apps/ios` 源码。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作笔记 —— 点击展开</summary>

None.

</details>
