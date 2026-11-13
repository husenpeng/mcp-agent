---
description: "在 Host 会话里读取已连接 iPhone 的屏幕，并每次执行一个动作。"
kind: "package-reference"
---

# @tomato/experimental-phone-use

[English](README.md) | 中文

## 概述

让 Host 会话读取已连接 iPhone 的屏幕并操作它：一个工具观测可见元素，另一个执行单次手势、输入、启动或等待。手机在局域网、tailnet 或桌面隧道之后也能用，因为 runner 外连 Host，设备上不监听端口。不可撤销的动作会停下来问人，而不是相信模型。

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

把插件挂进已带 `tools`、Typert 注册表与 Typert loader 的 profile；loader 负责登记本包生成的 `./typert` 产物，缺了它命名空间根本不会出现。

### 什么时候选它

当任务只存在于某个 iOS App 内、没有任何 API 能触达，并且这台手机能承载开发者签名时选它。不要用于 App Store 分发，也不要用于系统保护的界面：密码、Face ID 与钱包应用都够不着。

### 最小配置

```yaml
- id: phone-use
  name: '@tomato/experimental-phone-use'
  config:
    commandTimeoutMs: 15000
```

| 字段 | 默认 | 含义 |
|---|---|---|
| `commandTimeoutMs` | `15000` | 单条引擎命令的截止时间；超时后 Host 取消并判失败。 |
| `observeMaxElements` | `80` | 一次观测最多请求多少元素。 |
| `maxRenderElements` | `40` | 任一工具渲染回模型的最多元素行数。 |

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内幕 —— 点击展开</summary>

每台已连接设备一个会话，持有 attach 流与在途命令。命令在 `phone/result` 命中其 id 时结清；同一设备的新连接会替换旧流并让其挂起命令失败，重连后不重放任何输入。

runner 自己执行 lease 与风险门。Host 补上设备做不到的部分——问人——通过提问通道。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [设备管家](../phone-use-macos/README.zh.md)：续签、安装与拉起 runner。
- [Bundle](../phone-use-bundle/README.zh.md)：插入这两行的 profile 层。
- [Runner](../../../apps/ios/TomatoRunner/README.zh.md)：设备侧引擎及其真机结论。

-----

<a id="model-experience"></a>
## 模型体验

### phone_observe

#### What the model sees

前台应用，可见元素渲染为 `ref role "label" (x,y,w,h)` 行，以及无障碍树太薄时的 OCR 文本。

#### Token effect

每次回答最多 `maxRenderElements` 行元素。

#### KV Cache effect

无：工具不增加系统提示段。

### phone_act

#### What the model sees

动作参数，随后是稳定后的屏幕，格式同上。

#### Token effect

一次调用通常替代一次单独读取，因为回答里已经带着屏幕。

#### KV Cache effect

工具不增加系统提示段。

## 已知限制与后续工作

<a id="known-limitations-and-deferred-work"></a>

- 设备级凭据尚未实现： runner 出示的是应用的 owner 凭据。
- 确认需要 agent 持有的执行；没有 agent 时拒绝无法被清除。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作笔记 —— 点击展开</summary>

None.

</details>
